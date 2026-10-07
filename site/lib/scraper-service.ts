import {retailers} from './retailers.ts';
import {validateScraperSite,nextScrapeAt,emptyProgress,validateProgress,publicSourceUrl} from './scraper-config.ts';
import type {ScraperSite,ScraperProgress} from './scraper-config.ts';
import {backfillAction} from './history-backfill.ts';
interface SiteRow{id:string;json:string;next_at:string|null;updated_at:string;}
interface JobRow{id:string;site_id:string;status:string;config:string;progress:string;queued_at:string;started_at:string|null;finished_at:string|null;lease_token:string|null;lease_until:string|null;cancel_requested:number;}
const iso=()=>new Date().toISOString();
const seeded=new WeakSet<D1Database>();
const presentJob=(r:JobRow)=>({id:r.id,siteId:r.site_id,status:r.status,site:JSON.parse(r.config) as ScraperSite,progress:JSON.parse(r.progress) as ScraperProgress,queuedAt:r.queued_at,startedAt:r.started_at,finishedAt:r.finished_at,cancelRequested:Boolean(r.cancel_requested)});
export async function seedScraperSites(db:D1Database){
 if(seeded.has(db))return;
 const now=iso();await db.batch(retailers.map(r=>{
  const site:ScraperSite={id:r.id,name:r.name,origin:r.origin,enabled:r.enabled!==false,sourceNotes:r.sourceNotes,adapter:r.adapter||(['renogy','shopsolar','emporia'].includes(r.id)?'shopify':r.id==='santan-solar'?'woocommerce':'sitemap'),startPath:r.startPath||(r.id==='signature-solar'?'/xmlsitemap.php?type=products&page=1':'/sitemap.xml'),urls:r.urls||[],schedule:'interval',frequencyMinutes:r.frequencyMinutes||360,dailyTime:'06:17',weekdays:[0,1,2,3,4,5,6],delaySeconds:10,jitterSeconds:2,maxPages:24,usdConfirmed:r.usdConfirmed!==false,feedPages:['renogy','santan-solar'].includes(r.id)?2:1};
  return db.prepare('INSERT OR IGNORE INTO scraper_sites (id,origin,json,next_at,updated_at) VALUES (?,?,?,?,?)').bind(r.id,r.origin,JSON.stringify(site),site.enabled?now:null,now);
 }));seeded.add(db);
}
async function sites(db:D1Database){const r=await db.prepare('SELECT * FROM scraper_sites ORDER BY updated_at DESC,id').all<SiteRow>();return r.results;}
async function queue(db:D1Database,row:SiteRow){
 const site=JSON.parse(row.json) as ScraperSite;if(!site.enabled)throw new Error('Resume this site before queueing it.');
 await db.prepare("INSERT OR IGNORE INTO scraper_jobs (id,site_id,status,config,progress,queued_at) VALUES (?,?,'queued',?,?,?)").bind(crypto.randomUUID(),site.id,row.json,JSON.stringify(emptyProgress()),iso()).run();
}
export async function scraperDashboard(db:D1Database,siteId?:string){
 await seedScraperSites(db);
 const [sourceRows,jobs,heartbeat,legacy]=await Promise.all([sites(db),db.prepare("SELECT * FROM scraper_jobs WHERE status IN ('queued','running') OR id IN (SELECT id FROM scraper_jobs WHERE status NOT IN ('queued','running') ORDER BY queued_at DESC LIMIT 100) ORDER BY queued_at DESC").all<JobRow>(),db.prepare("SELECT value FROM job_state WHERE id='scraper-heartbeat'").first<{value:string}>(),db.prepare("SELECT json,created_at AS createdAt FROM collection_runs WHERE json_extract(json,'$[0].managedJobId') IS NULL ORDER BY created_at DESC LIMIT 12").all<{json:string;createdAt:string}>()]);
 const counts=await db.prepare("SELECT json_extract(json,'$.retailerId') AS siteId,COUNT(*) AS offers,MIN(updated_at) AS oldest,MAX(updated_at) AS latest FROM offers GROUP BY siteId").all();
 let detail:unknown=null;
 if(siteId){
  const row=sourceRows.find(r=>r.id===siteId);if(!row)throw new Error('Source not found.');
  const [targets,observations]=await Promise.all([
   db.prepare("SELECT f.id,json_extract(f.json,'$.url') AS url,json_extract(f.json,'$.price') AS price,f.updated_at AS checkedAt,json_extract(p.json,'$.name') AS name FROM offers f LEFT JOIN products p ON p.id=f.product_id WHERE json_extract(f.json,'$.retailerId')=? ORDER BY f.updated_at,f.id LIMIT 80").bind(siteId).all(),
   db.prepare("SELECT o.price,o.pack_quantity AS packQuantity,o.stock,o.observed_at AS observedAt,json_extract(f.json,'$.url') AS url,json_extract(p.json,'$.name') AS name,p.id AS productId FROM observations o JOIN offers f ON f.id=o.offer_id LEFT JOIN products p ON p.id=f.product_id WHERE json_extract(f.json,'$.retailerId')=? ORDER BY o.observed_at DESC LIMIT 100").bind(siteId).all()
  ]);detail={targets:targets.results,observations:observations.results};
 }
 return {sites:sourceRows.map(r=>({...JSON.parse(r.json),nextAt:r.next_at,updatedAt:r.updated_at,stats:counts.results.find((c:any)=>c.siteId===r.id)||{offers:0,oldest:null,latest:null}})),jobs:jobs.results.map(presentJob),heartbeat:heartbeat?JSON.parse(heartbeat.value):null,legacy:legacy.results.map(r=>({createdAt:r.createdAt,reports:JSON.parse(r.json)})),detail,historyBackfill:await backfillAction(db,{action:'status'}),now:iso()};
}
export async function scraperOwnerAction(db:D1Database,d:any){
 await seedScraperSites(db);
 if(d.action==='save'){
  const id=typeof d.id==='string'&&/^[a-z0-9-]{1,80}$/.test(d.id)?d.id:'source-'+crypto.randomUUID();
  const site=validateScraperSite(d.site,id);const existing=await db.prepare('SELECT * FROM scraper_sites WHERE id=?').bind(id).first<SiteRow>();
  if(existing&&JSON.parse(existing.json).origin!==site.origin)throw new Error('A saved site’s origin cannot change. Add a new site for a different domain.');
  const now=iso();const next=site.enabled&&site.schedule==='interval'?now:nextScrapeAt(site);
  await db.prepare('INSERT INTO scraper_sites (id,origin,json,next_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,next_at=excluded.next_at,updated_at=excluded.updated_at').bind(id,site.origin,JSON.stringify(site),next,now).run();
  if(!site.enabled)await db.prepare("UPDATE scraper_jobs SET status='cancelled',finished_at=? WHERE site_id=? AND status='queued'").bind(now,id).run();return {saved:true,id};
 }
 if(d.action==='queue'){
  const rows=await sites(db);const chosen=d.id?rows.filter(r=>r.id===d.id):rows.filter(r=>JSON.parse(r.json).enabled);if(!chosen.length)throw new Error('Select an enabled source.');
  for(const row of chosen)await queue(db,row);return {queued:true};
 }
 if(d.action==='cancel'&&typeof d.id==='string'){
  await db.prepare("UPDATE scraper_jobs SET cancel_requested=1,status=CASE WHEN status='queued' THEN 'cancelled' ELSE status END,finished_at=CASE WHEN status='queued' THEN ? ELSE finished_at END WHERE id=? AND status IN ('queued','running')").bind(iso(),d.id).run();return {cancelled:true};
 }
 throw new Error('Unknown scraper action.');
}
async function leasedJob(db:D1Database,d:any){
 if(typeof d.id!=='string'||typeof d.lease!=='string')throw new Error('Job lease required.');
 const row=await db.prepare("SELECT * FROM scraper_jobs WHERE id=? AND lease_token=? AND status='running' AND lease_until>?").bind(d.id,d.lease,iso()).first<JobRow>();if(!row)throw new Error('Job lease expired or no longer active.');return row;
}
export async function scraperWorkerAction(db:D1Database,d:any){
 await seedScraperSites(db);
 if(d.action==='claim'){
  const now=iso();await db.prepare("INSERT INTO job_state (id,value) VALUES ('scraper-heartbeat',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(JSON.stringify({at:now,runUrl:typeof d.runUrl==='string'&&/^https:\/\/github\.com\/FahadArfin\/pvpartpicker\/actions\/runs\/\d+$/.test(d.runUrl)?d.runUrl:null})).run();
  await db.prepare("UPDATE scraper_jobs SET status='failed',finished_at=?,progress=json_set(progress,'$.message','Worker lease expired; previously saved observations are retained.') WHERE status='running' AND lease_until<=?").bind(now,now).run();
  for(const row of await sites(db))if(row.next_at&&row.next_at<=now&&JSON.parse(row.json).enabled){await queue(db,row);await db.prepare('UPDATE scraper_sites SET next_at=? WHERE id=?').bind(nextScrapeAt(JSON.parse(row.json)),row.id).run();}
  if(typeof d.claimId!=='string'||!/^[a-f0-9-]{36}$/.test(d.claimId))throw new Error('Claim request identifier required.');
  // One atomic allocation per request ID. Replayed or concurrent requests recover
  // that same job, including when the first response was lost after commit.
  const claimKey='scraper-claim:'+d.claimId,until=new Date(Date.now()+1200000).toISOString();
  await db.batch([
   db.prepare("INSERT OR IGNORE INTO job_state (id,value) VALUES (?,json_object('jobId',COALESCE((SELECT id FROM scraper_jobs WHERE status='queued' ORDER BY queued_at,id LIMIT 1),''),'at',?))").bind(claimKey,now),
   db.prepare("UPDATE scraper_jobs SET status='running',started_at=?,lease_token=?,lease_until=? WHERE id=(SELECT json_extract(value,'$.jobId') FROM job_state WHERE id=?) AND status='queued'").bind(now,d.claimId,until,claimKey)
  ]);
  await db.prepare("DELETE FROM job_state WHERE id LIKE 'scraper-claim:%' AND json_extract(value,'$.at')<?").bind(new Date(Date.now()-86400000).toISOString()).run();
  const jobs=[];
  const row=await db.prepare("SELECT * FROM scraper_jobs WHERE id=(SELECT json_extract(value,'$.jobId') FROM job_state WHERE id=?) AND lease_token=? AND status='running' AND lease_until>?").bind(claimKey,d.claimId,now).first<JobRow>();
  if(row){
   const site=JSON.parse(row.config) as ScraperSite;
   const known=await db.prepare("SELECT DISTINCT json_extract(json,'$.url') AS url FROM offers WHERE json_extract(json,'$.retailerId')=? ORDER BY updated_at LIMIT 80").bind(site.id).all<{url:string}>();
   const cursor=await db.prepare('SELECT value FROM job_state WHERE id=?').bind('scraper-discovery:'+site.id).first<{value:string}>();
   jobs.push({...presentJob(row),lease:d.claimId,discoveryOffset:Number(cursor?.value)||0,knownUrls:known.results.map(r=>r.url).filter(u=>{try{return publicSourceUrl(u,site.origin).origin===site.origin;}catch{return false;}})});
  }return {jobs};
 }
 if(d.action==='finish'&&typeof d.id==='string'&&typeof d.lease==='string'){
  const completed=await db.prepare("SELECT id FROM scraper_jobs WHERE id=? AND lease_token=? AND lease_until IS NULL AND status IN ('succeeded','partial','failed','cancelled')").bind(d.id,d.lease).first();if(completed)return {finished:true};
 }
 const row=await leasedJob(db,d);const progress=validateProgress(d.progress);const old=JSON.parse(row.progress) as ScraperProgress;
 if(['requests','checked','found','inserted','quarantined','errors'].some(k=>progress[k as keyof ScraperProgress]<old[k as keyof ScraperProgress]))throw new Error('Progress counters cannot decrease.');
 if(progress.currentUrl)publicSourceUrl(progress.currentUrl,JSON.parse(row.config).origin);
 if(d.action==='event'){
  if(d.event){const e=d.event;if(typeof e.url!=='string'||typeof e.message!=='string'||e.message.length>1000||!['ok','error','skipped'].includes(e.status)||!Number.isFinite(e.durationMs)||e.durationMs<0)throw new Error('Invalid request event.');publicSourceUrl(e.url,JSON.parse(row.config).origin);
   if(typeof e.id!=='string'||!/^[a-f0-9-]{36}$/.test(e.id))throw new Error('Request event identifier required.');
   await db.prepare('INSERT OR IGNORE INTO scraper_events (id,job_id,json,created_at) VALUES (?,?,?,?)').bind(row.id+':'+e.id,row.id,JSON.stringify({url:e.url,status:e.status,httpStatus:typeof e.httpStatus==='number'?e.httpStatus:null,durationMs:Math.round(e.durationMs),message:e.message}),iso()).run();}
  await db.prepare('UPDATE scraper_jobs SET progress=?,lease_until=? WHERE id=? AND lease_token=?').bind(JSON.stringify(progress),new Date(Date.now()+1200000).toISOString(),row.id,d.lease).run();
  const source=await db.prepare('SELECT json FROM scraper_sites WHERE id=?').bind(row.site_id).first<{json:string}>();const fresh=await db.prepare('SELECT cancel_requested FROM scraper_jobs WHERE id=?').bind(row.id).first<{cancel_requested:number}>();
  return {cancel:Boolean(fresh?.cancel_requested||!source||!JSON.parse(source.json).enabled)};
 }
 if(d.action==='finish'){
  if(!['succeeded','partial','failed','cancelled'].includes(d.status))throw new Error('Invalid completion status.');
  const status=row.cancel_requested?'cancelled':d.status,site=JSON.parse(row.config) as ScraperSite,now=iso();
  const statements=[db.prepare('UPDATE scraper_jobs SET status=?,progress=?,finished_at=?,lease_until=NULL WHERE id=? AND lease_token=?').bind(status,JSON.stringify(progress),now,row.id,d.lease),db.prepare('INSERT OR IGNORE INTO collection_runs (id,json,created_at) VALUES (?,?,?)').bind(row.id,JSON.stringify([{retailerId:site.id,retailer:site.name,status:status==='succeeded'?'ok':status,products:progress.found,checkedAt:now,message:progress.message,managedJobId:row.id}]),now)];
  if(status!=='cancelled'&&Number.isInteger(d.discoveryNext)&&d.discoveryNext>=0&&d.discoveryNext<2000)statements.push(db.prepare('INSERT INTO job_state (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('scraper-discovery:'+site.id,String(d.discoveryNext)));
  await db.batch(statements);return {finished:true};
 }throw new Error('Unknown worker action.');
}
export async function scraperJobEvents(db:D1Database,id:string){
 const row=await db.prepare('SELECT * FROM scraper_jobs WHERE id=?').bind(id).first<JobRow>();if(!row)throw new Error('Run not found.');const events=await db.prepare('SELECT json,created_at AS at FROM scraper_events WHERE job_id=? ORDER BY created_at,id LIMIT 200').bind(id).all<{json:string;at:string}>();return {job:presentJob(row),events:events.results.map(e=>({...JSON.parse(e.json),at:e.at}))};
}
export async function registeredRetailers(db:D1Database){const rows=await sites(db);return rows.map(r=>{const s=JSON.parse(r.json) as ScraperSite;return {id:s.id,name:s.name,origin:s.origin};});}
