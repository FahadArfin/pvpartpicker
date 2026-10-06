import { getChatGPTUser } from '../../chatgpt-auth';
import { database, runtime, getCatalog, getPublicCatalog, getCatalogSummary, invalidatePublicCatalog, rateLimit } from '../../../lib/storage';
import { validateBuild, bestOffer, costForQuantity } from '../../../lib/domain';
import { validateIngestion } from '../../../lib/ingestion';
import { processAlerts } from '../../../lib/alerts';
import type { Product, CollectionReport } from '../../../lib/types';
import {homeDeals} from '../../../lib/home-deals';
import {buildDrops,dropPeriod,dropQuery,normalizeWatchIds,watchInsertSql} from '../../../lib/price-drops';
import type {DropCandidate} from '../../../lib/price-drops';
import {listCommunityBuilds,getCommunityBuild,publishCommunityBuild,unpublishCommunityBuild} from '../../../lib/community-builds';
import {scraperDashboard,scraperOwnerAction,scraperWorkerAction,scraperJobEvents,registeredRetailers} from '../../../lib/scraper-service';
import {calculatorApi} from '../../../lib/calculator-api';
import {buildPriceHistory,buildHistoryQuery,validateHistoryRequest} from '../../../lib/build-price-history';
import type {Observation} from '../../../lib/types';
import {connectionEvidence,connectionRequest} from '../../../lib/connection-map';
export const dynamic = 'force-dynamic';
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
async function body(request: Request) { if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('JSON required.'); if(Number(request.headers.get('content-length'))>600000)throw new Error('Request is too large.'); const text = await request.text(); if (text.length > 600000) throw new Error('Request is too large.'); return JSON.parse(text); }
function collector(request: Request) { const secret = runtime().COLLECTOR_TOKEN; const given = request.headers.get('authorization'); if (!secret || !given || given.length !== secret.length + 7) return false; let mismatch = 0; const expected = 'Bearer ' + secret; for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ given.charCodeAt(i); return mismatch === 0; }
async function handle(request: Request, method: string) {
  let catalogMutation=false;
  try {
    const url = new URL(request.url), paths = url.pathname.replace(/^\/api\//, '').split('/'), action = paths[0], id = paths[1];
    if (method !== 'GET' && request.headers.get('origin') && request.headers.get('origin') !== url.origin) return json({ error: 'Cross-origin write rejected.' }, 403);
    if(action==='solar-calculator'&&method==='GET')return calculatorApi(request);
    // This response has no account data and does not depend on auth headers.
    if(action==='catalog'&&method==='GET'&&url.searchParams.get('view')==='summary'){
      const start=performance.now(),result=await getCatalogSummary();
      return new Response(result.body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=${Math.max(0,Math.floor((result.expiresAt-Date.now())/1000))}, must-revalidate`,'X-Content-Type-Options':'nosniff','Server-Timing':`catalog;dur=${(performance.now()-start).toFixed(1)}`}});
    }
    if(action==='build-history'&&method==='POST'){
      const {lines,days}=validateHistoryRequest(await body(request));
      const now=Date.now(),catalog=await getPublicCatalog();
      if(catalog.storage!=='database')throw new Error('Recorded price history is unavailable. Please try again.');
      const selections=new Map(lines.map(l=>[l.productId,l])),products=catalog.products.filter(p=>selections.has(p.id));
      const offerIds=products.flatMap(p=>p.offers.filter(o=>o.currency==='USD'&&(!selections.get(p.id)?.offerId||selections.get(p.id)?.offerId===o.id)).map(o=>o.id));
      const since=new Date(Math.floor(now/86400000)*86400000-days*86400000).toISOString();
      const records=offerIds.length?await database().prepare(buildHistoryQuery).bind(JSON.stringify(offerIds),since,new Date(now).toISOString()).all<Observation>():{results:[]};
      if(records.results.length>50000)throw new Error('This selection has too many history records. Choose a shorter period or fewer parts.');
      return json(buildPriceHistory(lines,products,records.results,days,now));
    }
    if(action==='build-connections'&&method==='POST'){
      const ids=new Set(connectionRequest(await body(request))),catalog=await getPublicCatalog();
      return json({products:catalog.products.filter(p=>ids.has(p.id)).map(p=>({id:p.id,connectionSpecs:connectionEvidence(p)}))});
    }
    const user = await getChatGPTUser(); const isAdmin = Boolean(user && runtime().ADMIN_EMAIL && user.email.toLowerCase() === runtime().ADMIN_EMAIL?.toLowerCase());
    if (action === 'me' && method === 'GET') return json({ user: user ? { displayName: user.displayName, email: user.email } : null, isAdmin, emailConfigured: Boolean(runtime().RESEND_API_KEY && runtime().EMAIL_FROM) });
    if (action === 'catalog' && method === 'GET') {const start=performance.now();const result=await getCatalog();const response=json(result);response.headers.set('Server-Timing',`catalog;dur=${(performance.now()-start).toFixed(1)}`);return response;}
    if(action==='community'&&method==='GET'){
      if(!id)return json({builds:await listCommunityBuilds(database())});
      if(!/^[a-f0-9-]{36}$/.test(id))return json({error:'Community build not found.'},404);
      const build=await getCommunityBuild(database(),id);return build?json(build):json({error:'Community build not found.'},404);
    }
    if(action==='deals'&&method==='GET'){
      const home=url.searchParams.get('view')==='home';
      const {period,days}=dropPeriod(home?'latest':url.searchParams.get('period')),now=Date.now(),since=new Date(now-days*86400000).toISOString();
      const catalog=await getPublicCatalog();if(catalog.storage!=='database')throw new Error('Database history is unavailable. Please try again later.');
      const records=await database().prepare(dropQuery(period==='latest')).bind(since).all<DropCandidate>();
      const drops=buildDrops(catalog.products,records.results,now);
      return json({drops:home?homeDeals(catalog.products,drops):drops,period,since,checkedAt:new Date(now).toISOString()});
    }
    if (action === 'history' && method === 'GET') {
      const productId = url.searchParams.get('productId'); const days = Number(url.searchParams.get('days') || 90); if (![30,90,365].includes(days)) throw new Error('Invalid history period.'); const p = (await getPublicCatalog()).products.find(p => p.id === productId); if (!p) return json({ error: 'Product not found.' },404);
      const since = new Date(Date.now() - days * 86400000).toISOString(); let points: unknown[] = [];
      try { const rows = await database().prepare('SELECT o.offer_id AS offerId, o.price, o.pack_quantity AS packQuantity, o.stock, o.observed_at AS observedAt FROM observations o JOIN offers f ON f.id=o.offer_id WHERE COALESCE((SELECT product_id FROM offer_mappings WHERE id=f.id),f.product_id)=? AND o.observed_at>=? ORDER BY o.observed_at LIMIT 5000').bind(p.id,since).all(); points = rows.results; } catch {}
      if (!points.length) points = p.offers.filter(o => o.observedAt >= since).map(o => ({ offerId:o.id,price:o.price,packQuantity:o.packQuantity,stock:o.stock,observedAt:o.observedAt }));
      return json({ observations: points, offers: p.offers });
    }
    if (action === 'reviews' && method === 'GET') {
      const productId = url.searchParams.get('productId'); if (!productId) throw new Error('Product is required.');
      const rows = await database().prepare("SELECT id, author, rating, body, created_at AS createdAt FROM reviews WHERE product_id=? AND status='approved' ORDER BY created_at DESC LIMIT 100").bind(productId).all();
      const own = user ? await database().prepare('SELECT id, rating, body, status FROM reviews WHERE product_id=? AND user_id=?').bind(productId,user.userId).first() : null;
      return json({ reviews: rows.results, own });
    }
    if (action === 'share' && method === 'GET') { if (!id || !/^[a-f0-9-]{36}$/.test(id)) return json({ error:'Shared build not found.' },404); const row = await database().prepare('SELECT json FROM builds WHERE share_id=?').bind(id).first<{json:string}>(); return row ? json(JSON.parse(row.json)) : json({ error:'Shared build not found.' },404); }
    if (action === 'unsubscribe' && method === 'POST') { const token = url.searchParams.get('token'); if (!token || !/^[a-f0-9-]{36}$/.test(token)) return json({ error:'Invalid unsubscribe link.' },400); await database().prepare('UPDATE alerts SET active=0, email_enabled=0 WHERE token=?').bind(token).run(); return json({ unsubscribed:true }); }
    if(action==='scraper'){
      if(id==='worker'){
        if(method!=='POST'||!collector(request))return json({error:'Collector authentication required.'},401);
        return json(await scraperWorkerAction(database(),await body(request)));
      }
      if(!isAdmin)return json({error:user?'Price Scraper is available to the site owner only.':'Sign in with the owner account to manage scraping.'},user?403:401);
      if(method==='GET')return json(id==='run'?await scraperJobEvents(database(),url.searchParams.get('id')||''):await scraperDashboard(database(),url.searchParams.get('siteId')||undefined));
      if(method==='POST'){await rateLimit(user!.userId,'scraper',120);return json(await scraperOwnerAction(database(),await body(request)));}
      return json({error:'Unsupported scraper operation.'},405);
    }
    if (['ingest','process-alerts'].includes(action)) {
      if (method !== 'POST' || !collector(request)) return json({ error:'Collector authentication required.' },401);
      if (action === 'process-alerts') return json(await processAlerts());
      catalogMutation=true;invalidatePublicCatalog();
      const db = database(); const configured=await registeredRetailers(db); const data = validateIngestion(await body(request),[...configured,...(configured.length?[]:(await import('../../../lib/retailers')).retailers)]); let inserted = 0, quarantined = 0;
      for (const p of data.products) {
        const statements: D1PreparedStatement[] = []; const observationIndexes:number[]=[]; const { offers, ...metadata } = p;
        statements.push(db.prepare('INSERT INTO products (id,json,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at WHERE excluded.updated_at>=products.updated_at').bind(p.id,JSON.stringify(metadata),p.verifiedAt));
        for (const o of offers) {
          const prior = await db.prepare('SELECT json FROM offers WHERE id=?').bind(o.id).first<{json:string}>();
          if (prior) { const old = JSON.parse(prior.json); if (old.packQuantity !== o.packQuantity || Math.abs(o.price-old.price)/old.price > 0.8) { await db.prepare("INSERT OR IGNORE INTO quarantine (id,json,reason,status,created_at) VALUES (?,?,?,'pending',?)").bind(o.id+':'+o.observedAt,JSON.stringify({productId:p.id,offer:o}),'Package changed or price moved more than 80%',new Date().toISOString()).run();quarantined++; continue; } }
          statements.push(db.prepare('INSERT INTO offers (id,product_id,json,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,json=excluded.json,updated_at=excluded.updated_at WHERE excluded.updated_at>=offers.updated_at').bind(o.id,p.id,JSON.stringify(o),o.observedAt));
          statements.push(db.prepare('INSERT OR IGNORE INTO observations (id,offer_id,price,pack_quantity,stock,observed_at) VALUES (?,?,?,?,?,?)').bind(o.id+':'+o.observedAt,o.id,o.price,o.packQuantity,o.stock,o.observedAt)); observationIndexes.push(statements.length-1);
        }
        const result=await db.batch(statements);inserted+=observationIndexes.reduce((sum,index)=>sum+(result[index].meta.changes||0),0);
      }
      if (data.reports.length || quarantined) await db.prepare('INSERT INTO collection_runs (id,json,created_at) VALUES (?,?,?)').bind(crypto.randomUUID(),JSON.stringify(data.reports.length ? data.reports : [{retailerId:'quarantine',retailer:'Validation',status:'quarantined',products:quarantined,checkedAt:new Date().toISOString(),message:'Large price or package change requires review.'}]),new Date().toISOString()).run();
      return json({ inserted,quarantined });
    }
    if (!user) return json({ error:'Sign in with ChatGPT to continue.' },401);
    const db = database(); if (method !== 'GET') await rateLimit(user.userId,action,action==='watchlist'?180:40);
    if(action==='community'){
      if(method==='POST'){const data=await body(request);if(typeof data.buildId!=='string'||data.buildId.length>100)throw new Error('Select a saved build.');return json(await publishCommunityBuild(db,user.userId,data.buildId,data.description));}
      if(method==='DELETE'&&id)return await unpublishCommunityBuild(db,user.userId,id)?json({withdrawn:true}):json({error:'Published build not found.'},404);
    }
    if(action==='watchlist'){
      if(method==='GET'){const rows=await db.prepare('SELECT product_id AS productId,created_at AS createdAt FROM watchlist WHERE user_id=? ORDER BY created_at DESC,product_id LIMIT 500').bind(user.userId).all<{productId:string;createdAt:string}>();return json({items:rows.results});}
      if(method==='DELETE'&&id){if(id.length>180)throw new Error('Invalid product.');await db.prepare('DELETE FROM watchlist WHERE user_id=? AND product_id=?').bind(user.userId,id).run();return json({removed:true});}
      if(method==='POST'){
        const data=await body(request),ids=normalizeWatchIds(data.productIds),catalog=await getCatalog();
        if(ids.some(id=>!catalog.products.some(p=>p.id===id)))throw new Error('A selected product is no longer available.');
        const existing=await db.prepare('SELECT product_id FROM watchlist WHERE user_id=? LIMIT 501').bind(user.userId).all<{product_id:string}>();
        if(new Set([...existing.results.map(r=>r.product_id),...ids]).size>500)throw new Error('Your watch list can hold up to 500 products.');
        const stamp=new Date().toISOString();for(let start=0;start<ids.length;start+=50)await db.batch(ids.slice(start,start+50).map(id=>db.prepare(watchInsertSql).bind(user.userId,id,stamp,user.userId)));
        const saved=await db.prepare('SELECT product_id FROM watchlist WHERE user_id=? LIMIT 500').bind(user.userId).all<{product_id:string}>();if(ids.some(id=>!saved.results.some(r=>r.product_id===id)))throw new Error('Your watch list filled while saving. Reload it and remove a product to make room.');
        return json({saved:true});
      }
    }
    if (action === 'builds') {
      if (method === 'GET') { const rows = await db.prepare('SELECT b.id,b.json,b.share_id AS shareId,b.updated_at AS updatedAt,c.share_id AS communityShareId,c.description AS communityDescription FROM builds b LEFT JOIN community_builds c ON c.build_id=b.id WHERE b.user_id=? ORDER BY b.updated_at DESC LIMIT 100').bind(user.userId).all<any>(); const builds=rows.results.map(r=>({...validateBuild(JSON.parse(r.json)),id:r.id,shareId:r.shareId,updatedAt:r.updatedAt,communityShareId:r.communityShareId,communityDescription:r.communityDescription}));return id?(builds.find(b=>b.id===id)?json(builds.find(b=>b.id===id)):json({error:'Build not found.'},404)):json({builds}); }
      if (method === 'DELETE' && id) { const result = await db.prepare('DELETE FROM builds WHERE id=? AND user_id=?').bind(id,user.userId).run(); return result.meta.changes ? json({deleted:true}) : json({error:'Build not found.'},404); }
      if (method === 'POST') {
        const data = await body(request); const build = validateBuild(data); const products = (await getCatalog()).products;
        if (build.lines.some(l => !products.some(p => p.id === l.productId && (!l.offerId || p.offers.some(o=>o.id===l.offerId))))) throw new Error('A selected product or retailer offer is no longer available.');
        let buildId = data.id; if (buildId) { const own = await db.prepare('SELECT id FROM builds WHERE id=? AND user_id=?').bind(buildId,user.userId).first(); if (!own) return json({error:'Build not found.'},404); } else { const count = await db.prepare('SELECT COUNT(*) AS count FROM builds WHERE user_id=?').bind(user.userId).first<{count:number}>(); if ((count?.count || 0)>=100) throw new Error('Maximum 100 saved builds.'); buildId=crypto.randomUUID(); }
        await db.prepare('INSERT INTO builds (id,user_id,json,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at').bind(buildId,user.userId,JSON.stringify(build),new Date().toISOString()).run(); return json({...build,id:buildId});
      }
      if (method === 'PATCH' && id) { const row = await db.prepare('SELECT share_id FROM builds WHERE id=? AND user_id=?').bind(id,user.userId).first<{share_id:string}>(); if (!row) return json({error:'Build not found.'},404); const shareId=row.share_id || crypto.randomUUID(); await db.prepare('UPDATE builds SET share_id=? WHERE id=? AND user_id=?').bind(shareId,id,user.userId).run(); return json({shareId}); }
    }
    if (action === 'reviews') {
      if (method === 'POST') { const d = await body(request); if (typeof d.body !== 'string' || d.body.trim().length<10 || d.body.length>3000 || (d.rating !== null && (!Number.isInteger(d.rating) || d.rating<1 || d.rating>5)) || !(await getCatalog()).products.some(p=>p.id===d.productId)) throw new Error('Write 10–3,000 characters and choose a valid rating.');
        await db.prepare("INSERT INTO reviews (id,product_id,user_id,author,rating,body,status,created_at) VALUES (?,?,?,?,?,?,'pending',?) ON CONFLICT(user_id,product_id) DO UPDATE SET rating=excluded.rating,body=excluded.body,status='pending',created_at=excluded.created_at").bind(crypto.randomUUID(),d.productId,user.userId,user.fullName || 'Solar builder',d.rating,d.body.trim(),new Date().toISOString()).run(); return json({status:'pending'}); }
      if (method === 'DELETE' && id) { await db.prepare('DELETE FROM reviews WHERE id=? AND user_id=?').bind(id,user.userId).run(); return json({deleted:true}); }
    }
    if (action === 'alerts') {
      if (method === 'GET') { const rows = await db.prepare('SELECT id,product_id AS productId,quantity,target,email_enabled AS emailEnabled,active,last_price AS lastPrice FROM alerts WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all(); return json({alerts:rows.results}); }
      if (method === 'DELETE' && id) { await db.prepare('UPDATE alerts SET active=0,email_enabled=0 WHERE id=? AND user_id=?').bind(id,user.userId).run(); return json({deleted:true}); }
      if (method === 'POST') { const d = await body(request); if (!Number.isFinite(d.target) || d.target<0.01 || d.target>1000000 || !Number.isInteger(d.quantity) || d.quantity<1 || d.quantity>10000 || typeof d.emailEnabled !== 'boolean') throw new Error('Enter a valid target price and quantity.'); const product=(await getCatalog()).products.find(p=>p.id===d.productId); if (!product) throw new Error('Product not found.'); const count=await db.prepare('SELECT COUNT(*) AS count FROM alerts WHERE user_id=? AND active=1').bind(user.userId).first<{count:number}>(); if ((count?.count || 0)>=100) throw new Error('Maximum 100 active alerts.');
        const alertId=crypto.randomUUID(); await db.prepare('INSERT INTO alerts (id,user_id,email,product_id,quantity,target,email_enabled,last_price,active,token,created_at) VALUES (?,?,?,?,?,?,?,NULL,1,?,?)').bind(alertId,user.userId,user.email,d.productId,d.quantity,d.target,Number(d.emailEnabled),crypto.randomUUID(),new Date().toISOString()).run(); return json({id:alertId,emailConfigured:Boolean(runtime().RESEND_API_KEY&&runtime().EMAIL_FROM)}); }
    }
    if (action === 'notifications') {
      if (method === 'GET') return json({notifications:(await db.prepare('SELECT id,title,body,product_id AS productId,read,created_at AS createdAt FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all()).results});
      if (method === 'PATCH' && id) { await db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').bind(id,user.userId).run(); return json({read:true}); }
    }
    if (action === 'admin') {
      if (!isAdmin) return json({error:'Administrator access required.'},403);
      if(method==='POST'){catalogMutation=true;invalidatePublicCatalog();}
      if (method === 'GET') return json({quarantine:(await db.prepare("SELECT id,json,reason FROM quarantine WHERE status='pending' ORDER BY created_at LIMIT 100").all()).results.map((r:any)=>({...r,...JSON.parse(r.json)})),reports:(await getCatalog()).reports,reviews:(await db.prepare("SELECT id,product_id AS productId,author,rating,body,status FROM reviews WHERE status='pending' ORDER BY created_at LIMIT 100").all()).results, email:{configured:Boolean(runtime().RESEND_API_KEY&&runtime().EMAIL_FROM),pending:(await db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE email_status='pending'").first<{count:number}>())?.count||0,failed:(await db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE email_status='failed'").first<{count:number}>())?.count||0}});
      if (method === 'POST') { const d=await body(request); if (d.action==='moderate' && ['approved','rejected'].includes(d.status)) { await db.prepare('UPDATE reviews SET status=? WHERE id=?').bind(d.status,d.id).run(); return json({updated:true}); } if (d.action==='specs') { const p=(await getCatalog()).products.find(p=>p.id===d.id); if (!p || !d.specs || typeof d.specs!=='object' || JSON.stringify(d.specs).length>10000 || typeof d.source!=='string' || !d.source.startsWith('https://')) throw new Error('Valid product specifications and an HTTPS source are required.'); await db.prepare('INSERT INTO product_overrides (id,json,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at').bind(p.id,JSON.stringify({specs:{...p.specs,...d.specs,specificationSource:d.source},documentation:d.source}),new Date().toISOString()).run(); return json({updated:true}); } if(d.action==='map'){const catalog=await getCatalog();const target=catalog.products.find(p=>p.id===d.productId);const current=catalog.products.find(p=>p.offers.some(o=>o.id===d.offerId));if(!target||!current||typeof d.source!=='string'||!d.source.startsWith('https://'))throw new Error('Select an offer, target model, and verification URL.');if(target.category!==current.category)throw new Error('Product categories must match.');await db.prepare('INSERT INTO offer_mappings (id,product_id,source,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,source=excluded.source,updated_at=excluded.updated_at').bind(d.offerId,target.id,d.source,new Date().toISOString()).run();return json({updated:true});}if(d.action==='quarantine'&&['approved','rejected'].includes(d.status)){const q=await db.prepare("SELECT json FROM quarantine WHERE id=? AND status='pending'").bind(d.id).first<{json:string}>();if(!q)throw new Error('Candidate not found.');if(d.status==='approved'){const candidate=JSON.parse(q.json),o=candidate.offer;await db.batch([db.prepare('UPDATE offers SET json=?,updated_at=? WHERE id=? AND updated_at<=?').bind(JSON.stringify(o),o.observedAt,o.id,o.observedAt),db.prepare('INSERT OR IGNORE INTO observations (id,offer_id,price,pack_quantity,stock,observed_at) VALUES (?,?,?,?,?,?)').bind(o.id+':'+o.observedAt,o.id,o.price,o.packQuantity,o.stock,o.observedAt)]);}await db.prepare('UPDATE quarantine SET status=? WHERE id=?').bind(d.status,d.id).run();return json({updated:true});}throw new Error('Unknown administration action.'); }
    }
    return json({error:'Not found.'},404);
  } catch (error) { const message=error instanceof Error?error.message:'Unexpected error.'; const unavailable=/Database|D1|SQLITE|no such table/.test(message); return json({error:unavailable?'This service is temporarily unavailable. Your input has been preserved.':message},unavailable?503:/Too many/.test(message)?429:400); }
  finally{if(catalogMutation)invalidatePublicCatalog();}
}
export const GET = (r:Request) => handle(r,'GET');
export const POST = (r:Request) => handle(r,'POST');
export const PATCH = (r:Request) => handle(r,'PATCH');
export const DELETE = (r:Request) => handle(r,'DELETE');
