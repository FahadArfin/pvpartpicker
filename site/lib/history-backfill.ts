import {historyUrl} from './drop-history.ts';
import type {Product,Offer} from './types.ts';
const controlId='drop-history-control',prefix='drop-history-job:';
interface Control {nextAt:number;slotAt?:number;lease?:string;until?:number;jobId?:string;paused?:boolean;reason?:string;lastRequestAt?:number;}
interface Job {id:string;url:string;p:Pick<Product,'id'|'name'|'category'>;o:Offer;status:string;rows:number;reason?:string;attempts:number;}
async function state(db:D1Database){const r=await db.prepare('SELECT value FROM job_state WHERE id=?').bind(controlId).first<{value:string}>();return r?{raw:r.value,c:JSON.parse(r.value) as Control}:null;}
async function swap(db:D1Database,raw:string,c:Control){const r=await db.prepare('UPDATE job_state SET value=? WHERE id=? AND value=?').bind(JSON.stringify(c),controlId,raw).run();if(!r.meta.changes)throw Error('Backfill lease changed; retry later');}
export async function backfillAction(db:D1Database,d:any,now=Date.now()):Promise<any>{
 if(!d||!['seed','status','claim','permit','confirm','finish','pause','heartbeat','release'].includes(d.action))throw Error('Unknown historical backfill action');
 await db.prepare('INSERT OR IGNORE INTO job_state(id,value) VALUES(?,?)').bind(controlId,JSON.stringify({nextAt:0})).run();
 if(d.action==='heartbeat'){
  if(!['started','finished','failed'].includes(d.phase))throw Error('Invalid worker phase');
  if(d.runUrl!==undefined&&(typeof d.runUrl!=='string'||!/^https:\/\/github\.com\/FahadArfin\/pvpartpicker\/actions\/runs\/\d{1,30}$/.test(d.runUrl)))throw Error('Invalid workflow URL');
  await db.prepare('INSERT INTO job_state(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('drop-history-heartbeat',JSON.stringify({at:new Date(now).toISOString(),phase:d.phase,runUrl:d.runUrl})).run();return {ok:true};
 }
 if(d.action==='seed'){
  const records=await db.prepare('SELECT f.json AS offerJson,p.json AS productJson FROM offers f JOIN products p ON p.id=f.product_id').all<{offerJson:string;productJson:string}>();
  const groups=new Map<string,{p:Product;o:Offer}[]>();
  for(const f of records.results){const o=JSON.parse(f.offerJson) as Offer,p=JSON.parse(f.productJson) as Product,url=historyUrl(o.url);if(!url)continue;groups.set(url,[...(groups.get(url)||[]),{p,o}]);}
  const inserts=[];
  for(const [url,items] of groups){const {p,o}=items[0],bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url)),id=prefix+[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
   const reason=items.length!==1?'Parent URL has multiple catalog variants':o.currency!=='USD'||o.condition!=='new'||!Number.isInteger(o.packQuantity)||o.packQuantity<1||p.category==='kits'?'Package, condition or bundle identity requires review':undefined;
   const j:Job={id,url,p:{id:p.id,name:p.name,category:p.category},o,status:reason?'unmatched':'pending',reason,rows:0,attempts:0};
   inserts.push(db.prepare('INSERT OR IGNORE INTO job_state(id,value) VALUES(?,?)').bind(id,JSON.stringify(j)));
  }
  for(let i=0;i<inserts.length;i+=100)await db.batch(inserts.slice(i,i+100));return backfillAction(db,{action:'status'},now);
 }
 const s=(await state(db))!;
 if(d.action==='status'){
  const counts=await db.prepare("SELECT json_extract(value,'$.status') AS status,COUNT(*) AS n,SUM(json_extract(value,'$.rows')) AS rows FROM job_state WHERE id LIKE 'drop-history-job:%' GROUP BY json_extract(value,'$.status')").all<{status:string;n:number;rows:number}>();
  const recent=await db.prepare("SELECT value FROM job_state WHERE id LIKE 'drop-history-job:%' AND json_extract(value,'$.status') NOT IN ('pending') ORDER BY json_extract(value,'$.finishedAt') DESC LIMIT 100").all<{value:string}>();
  const imported=await db.prepare("SELECT COUNT(*) AS n FROM observations o JOIN history_sources s ON s.id=o.source_id WHERE json_extract(s.json,'$.precision')='timestamp' AND json_extract(s.json,'$.url') LIKE 'https://drop.solar/products/%'").first<{n:number}>();
  const review=await db.prepare("SELECT COUNT(*) AS n FROM job_state WHERE id LIKE 'drop-history-job:%' AND json_extract(value,'$.status')='unmatched' AND COALESCE(json_extract(value,'$.attempts'),0)=0").first<{n:number}>();
  const worker=await db.prepare('SELECT value FROM job_state WHERE id=?').bind('drop-history-heartbeat').first<{value:string}>();
  const current=s.c.jobId&&(s.c.until||0)>now?await db.prepare('SELECT value FROM job_state WHERE id=?').bind(s.c.jobId).first<{value:string}>():null;
  const j=current?JSON.parse(current.value):null,c=Object.fromEntries(counts.results.map(r=>[r.status,r.n])),all=counts.results.reduce((n,r)=>n+r.n,0),preReview=review?.n||0,remaining=c.pending||0;
  return {counts:c,queue:{total:all-preReview,checked:all-preReview-remaining,remaining,preReview},importedRows:imported?.n||0,paused:!!s.c.paused,reason:s.c.reason,now:new Date(now).toISOString(),nextRequestAt:s.c.nextAt?new Date(s.c.nextAt).toISOString():null,lastRequestAt:s.c.lastRequestAt!==undefined?new Date(s.c.lastRequestAt).toISOString():null,worker:worker?JSON.parse(worker.value):null,active:j?{productId:j.p.id,name:j.p.name,retailer:j.o.retailer,until:new Date(s.c.until!).toISOString(),requestAt:s.c.slotAt!==undefined?new Date(s.c.slotAt).toISOString():null}:null,recent:recent.results.map(r=>{const j=JSON.parse(r.value);return {productId:j.p.id,name:j.p.name,retailer:j.o.retailer,status:j.status,rows:j.rows,reason:j.reason,sourceUrl:j.sourceUrl,finishedAt:j.finishedAt};})};
 }
 if(d.action==='claim'){
  if(s.c.paused)return {paused:true,reason:s.c.reason};if(s.c.lease&&(s.c.until||0)>now)return {busy:true};
  if(s.c.nextAt>now+300000)return {deferred:true,nextRequestAt:new Date(s.c.nextAt).toISOString()};
  const row=await db.prepare("SELECT value FROM job_state WHERE id LIKE 'drop-history-job:%' AND json_extract(value,'$.status')='pending' ORDER BY CASE WHEN json_extract(value,'$.p.category')='inverters' THEN 0 WHEN json_extract(value,'$.p.category')='batteries' THEN 1 ELSE 2 END,id LIMIT 1").first<{value:string}>();
  if(!row)return {done:true};const job=JSON.parse(row.value) as Job,lease=crypto.randomUUID();await swap(db,s.raw,{...s.c,lease,until:now+300000,jobId:job.id});return {lease,job};
 }
 if(typeof d.lease!=='string'||d.lease!==s.c.lease||(s.c.until||0)<=now)throw Error('Active historical backfill lease required');
 if(d.action==='release'){
  await swap(db,s.raw,{nextAt:s.c.nextAt,lastRequestAt:s.c.lastRequestAt});return {released:true};
 }
 if(d.action==='permit'){
  const delay=d.delayMs??0;if(!Number.isFinite(delay)||delay<0||delay>3600000)throw Error('Invalid backfill request delay');
  const at=Math.max(now+delay,s.c.nextAt);await swap(db,s.raw,{...s.c,slotAt:at,nextAt:at+30000,until:at+300000});return {waitMs:at-now};
 }
 if(d.action==='confirm'){
  if(!Number.isFinite(s.c.slotAt))throw Error('Reserve a request slot before confirmation');
  if(now<s.c.slotAt!)return {waitMs:s.c.slotAt!-now};
  await swap(db,s.raw,{...s.c,slotAt:undefined,nextAt:now+30000,until:now+300000,lastRequestAt:now});return {waitMs:0};
 }
 if(d.action==='pause'){
  if(typeof d.reason!=='string'||d.reason.length>500)throw Error('Backfill pause reason required');await swap(db,s.raw,{nextAt:s.c.nextAt,lastRequestAt:s.c.lastRequestAt,paused:true,reason:d.reason});return {paused:true};
 }
 if(d.id!==s.c.jobId||!['complete','not_found','unmatched','failed','retry'].includes(d.status)||!Number.isInteger(d.rows||0)||(d.rows||0)<0||(d.rows||0)>5000||typeof(d.reason||'')!=='string'||(d.reason||'').length>500)throw Error('Invalid historical backfill result');
 const row=await db.prepare('SELECT value FROM job_state WHERE id=?').bind(d.id).first<{value:string}>();if(!row)throw Error('Unknown backfill job');const job=JSON.parse(row.value) as Job;
 const attempts=job.attempts+1,status=d.status==='retry'?(attempts<3?'pending':'failed'):d.status;
 const sourceUrl=typeof d.sourceUrl==='string'&&/^https:\/\/drop\.solar\/products\/[a-zA-Z0-9_-]{1,100}$/.test(d.sourceUrl)?d.sourceUrl:undefined;
 // The lease is checked atomically with the result write. Retried imports deduplicate at observation level.
 await db.batch([db.prepare('UPDATE job_state SET value=? WHERE id=? AND EXISTS(SELECT 1 FROM job_state WHERE id=? AND value=?)').bind(JSON.stringify({...job,status,attempts,rows:job.rows+(d.rows||0),reason:d.reason||undefined,sourceUrl,finishedAt:new Date(now).toISOString()}),d.id,controlId,s.raw),db.prepare('UPDATE job_state SET value=? WHERE id=? AND value=?').bind(JSON.stringify({nextAt:Math.max(s.c.nextAt,status==='pending'?now+3600000:0),lastRequestAt:s.c.lastRequestAt}),controlId,s.raw)]);
 return {status};
}
