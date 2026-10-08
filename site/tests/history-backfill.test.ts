import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {backfillAction} from '../lib/history-backfill.ts';import {importHistory} from '../lib/historical-import.ts';
function fixture(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE job_state(id TEXT PRIMARY KEY,value TEXT);CREATE TABLE offers(id TEXT PRIMARY KEY,product_id TEXT,json TEXT,updated_at TEXT);CREATE TABLE products(id TEXT PRIMARY KEY,json TEXT,updated_at TEXT);CREATE TABLE history_sources(id TEXT PRIMARY KEY,json TEXT,created_at TEXT);CREATE TABLE observations(id TEXT PRIMARY KEY,offer_id TEXT,price REAL,pack_quantity INTEGER,stock TEXT,observed_at TEXT,source_id TEXT);');
 const p={id:'eg4-flexboss21',name:'EG4 FlexBOSS21 16kW AC Hybrid Inverter',category:'inverters'},o={id:'ss-1',url:'https://signaturesolar.com/flexboss21/',retailerId:'signature-solar',retailer:'Signature Solar',currency:'USD',condition:'new',packQuantity:1,price:3599,stock:'in_stock'};
 sql.prepare('INSERT INTO products VALUES(?,?,?)').run(p.id,JSON.stringify(p),'today');sql.prepare('INSERT INTO offers VALUES(?,?,?,?)').run(o.id,p.id,JSON.stringify(o),'today');
 const db={prepare(q:string){const s=sql.prepare(q);let a:any[]=[];const w={bind(...v:any[]){a=v;return w;},async first(){return s.get(...a)||null;},async all(){return {results:s.all(...a)};},async run(){return {meta:{changes:Number(s.run(...a).changes)}};}};return w;},async batch(a:any[]){sql.exec('BEGIN');try{const r=[];for(const v of a)r.push(await v.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}} as unknown as D1Database;return {sql,db,p,o};}
test('durable queue claims once, paces every request, resumes expired leases and preserves completed jobs',async()=>{
 const {db,sql}=fixture();let now=1000;
 await backfillAction(db,{action:'seed'},now);let a:any=await backfillAction(db,{action:'claim'},now);
 assert.ok(a.job);assert.equal((await backfillAction(db,{action:'claim'},now) as any).busy,true);
 const permit:any=await backfillAction(db,{action:'permit',lease:a.lease},now);assert.equal(permit.waitMs,0);
 assert.equal((await backfillAction(db,{action:'permit',lease:a.lease},now) as any).waitMs,30000);
 const slow:any=await backfillAction(db,{action:'permit',lease:a.lease,delayMs:600000},now);assert.equal(slow.waitMs,600000);
 assert.equal((await backfillAction(db,{action:'claim'},now+400000) as any).busy,true);
 await assert.rejects(backfillAction(db,{action:'confirm',lease:a.lease},now+1000000),/lease/i);
 await assert.rejects(backfillAction(db,{action:'finish',lease:'wrong',id:a.job.id,status:'complete'},now),/lease/i);
 now+=1000000;a=await backfillAction(db,{action:'claim'},now);assert.ok(a.job);
 await backfillAction(db,{action:'finish',lease:a.lease,id:a.job.id,status:'complete',rows:2},now);
 await backfillAction(db,{action:'seed'},now);assert.equal((await backfillAction(db,{action:'claim'},now) as any).done,true);
 const status:any=await backfillAction(db,{action:'status'},now);assert.equal(status.counts.complete,1);assert.equal(status.importedRows,0);assert.equal(status.recent[0].rows,2);sql.close();
});
test('source refusal pauses the whole queue and scheduled runs cannot silently resume it',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const a:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'pause',lease:a.lease,reason:'HTTP 403'},1000);
 assert.equal((await backfillAction(db,{action:'claim'},500000) as any).paused,true);sql.close();
});

test('failed listings retain their error and timestamp while the next listing stays available at the normal pace',async()=>{
 const {db,sql,p,o}=fixture();sql.prepare('INSERT INTO offers VALUES(?,?,?,?)').run('ss-2',p.id,JSON.stringify({...o,id:'ss-2',url:'https://signaturesolar.com/second/'}),'today');
 await backfillAction(db,{action:'seed'},1000);const c=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'permit',lease:c.lease},1000);await backfillAction(db,{action:'confirm',lease:c.lease},1000);
 await backfillAction(db,{action:'finish',lease:c.lease,id:c.job.id,status:'failed',reason:'Drop.solar HTTP 500 at /api/url-lookup'},1000);
 const s=await backfillAction(db,{action:'status'},1000);assert.equal(s.paused,false);assert.equal(s.queue.remaining,1);assert.equal(s.counts.failed,1);assert.equal(s.recent[0].reason,'Drop.solar HTTP 500 at /api/url-lookup');assert.equal(s.recent[0].finishedAt,new Date(1000).toISOString());
 const next=await backfillAction(db,{action:'claim'},1000);assert.notEqual(next.job.id,c.job.id);assert.equal((await backfillAction(db,{action:'permit',lease:next.lease},1000)).waitMs,30000);sql.close();
});

test('recovery unpauses only the obsolete server-error pause and preserves refusal pauses and live leases',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);let c=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'pause',lease:c.lease,reason:'Drop.solar is unavailable (HTTP 500); owner review required'},1000);
 const r=await backfillAction(db,{action:'recover'},32000);assert.equal(r.recovered,true);assert.equal((await backfillAction(db,{action:'status'},32000)).paused,false);
 c=await backfillAction(db,{action:'claim'},32000);await backfillAction(db,{action:'recover'},33000);
 assert.equal((await backfillAction(db,{action:'claim'},33000)).busy,true);
 await backfillAction(db,{action:'pause',lease:c.lease,reason:'Drop.solar refused requests (HTTP 429); owner review required'},33000);
 assert.equal((await backfillAction(db,{action:'recover'},34000)).recovered,false);assert.equal((await backfillAction(db,{action:'status'},34000)).paused,true);sql.close();
});

test('robots setup error persists a cooldown and reason while keeping the listing pending',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const c=await backfillAction(db,{action:'claim'},1000);
 await assert.rejects(backfillAction(db,{action:'setup_error',lease:'wrong',reason:'HTTP 500 at /robots.txt'},1000),/lease/);
 await backfillAction(db,{action:'setup_error',lease:c.lease,reason:'HTTP 500 at /robots.txt'},1000);
 const s=await backfillAction(db,{action:'status'},1000);assert.equal(s.paused,false);assert.equal(s.active,null);assert.equal(s.queue.remaining,1);assert.equal(s.counts.failed,undefined);assert.equal(s.reason,'HTTP 500 at /robots.txt');assert.equal(s.nextRequestAt,new Date(61000).toISOString());sql.close();
});
test('progress excludes pre-queue review, tracks source attempts and expires active reservations',async()=>{
 const {db,sql,p,o}=fixture();
 sql.prepare('INSERT INTO offers VALUES(?,?,?,?)').run('review',p.id,JSON.stringify({...o,id:'review',url:'https://signaturesolar.com/bundle/',condition:'used'}),'today');
 let s:any=await backfillAction(db,{action:'seed'},1000);
 assert.deepEqual(s.queue,{total:1,checked:0,remaining:1,preReview:1});
 const claim:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'permit',lease:claim.lease},1000);
 await backfillAction(db,{action:'confirm',lease:claim.lease},1000);
 s=await backfillAction(db,{action:'status'},1001);assert.equal(s.active.name,p.name);assert.equal(s.lastRequestAt,new Date(1000).toISOString());
 assert.equal((await backfillAction(db,{action:'status'},400000)).active,null);
 await backfillAction(db,{action:'finish',lease:claim.lease,id:claim.job.id,status:'unmatched',reason:'Review'},2000);
 s=await backfillAction(db,{action:'status'},3000);
 assert.deepEqual(s.queue,{total:1,checked:1,remaining:0,preReview:1});assert.equal(s.active,null);assert.equal(s.lastRequestAt,new Date(1000).toISOString());
 assert.equal(s.recent[0].finishedAt,new Date(2000).toISOString());sql.close();
});
test('worker check-in survives completion and refuses untrusted workflow links',async()=>{
 const {db,sql}=fixture();const runUrl='https://github.com/FahadArfin/pvpartpicker/actions/runs/123';
 await backfillAction(db,{action:'heartbeat',phase:'started',runUrl},1000);
 await backfillAction(db,{action:'seed'},1000);const claim:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'finish',lease:claim.lease,id:claim.job.id,status:'complete'},2000);
 await backfillAction(db,{action:'heartbeat',phase:'finished',runUrl},3000);
 const s:any=await backfillAction(db,{action:'status'},3000);assert.deepEqual(s.worker,{at:new Date(3000).toISOString(),phase:'finished',runUrl});
 await assert.rejects(backfillAction(db,{action:'heartbeat',phase:'started',runUrl:'https://evil.test'},3000),/workflow/i);
 await assert.rejects(backfillAction(db,{action:'heartbeat',phase:'other'},3000),/phase/i);sql.close();
});
test('budget exit releases only the owned reservation without losing pacing or pending work',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const c:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'permit',lease:c.lease,delayMs:60000},1000);
 await assert.rejects(backfillAction(db,{action:'release',lease:'wrong'},1001),/lease/);
 await backfillAction(db,{action:'release',lease:c.lease},1001);
 const s=await backfillAction(db,{action:'status'},1001);assert.equal(s.active,null);assert.equal(s.queue.remaining,1);assert.equal(s.nextRequestAt,new Date(91000).toISOString());sql.close();
});
test('transient retries retain 30-second pacing without an artificial hourly gap',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const c:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'finish',lease:c.lease,id:c.job.id,status:'retry',reason:'Network timeout'},1000);
 assert.equal((await backfillAction(db,{action:'status'},1000)).nextRequestAt,new Date(31000).toISOString());sql.close();
});
test('old unsupported-lookup retry delay is recovered without shortening unrelated source slots',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const c:any=await backfillAction(db,{action:'claim'},1000);
 sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({...c.job,status:'pending',attempts:1,reason:'URL lookup failed (HTTP 400)',finishedAt:new Date(1000).toISOString()}),c.job.id);
 sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({nextAt:3601000}),'drop-history-control');
 assert.ok((await backfillAction(db,{action:'claim'},32000)).job);
 const control=JSON.parse((sql.prepare('SELECT value FROM job_state WHERE id=?').get('drop-history-control') as any).value);
 sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({nextAt:3602000}),'drop-history-control');
 assert.equal((await backfillAction(db,{action:'claim'},32000)).deferred,true);assert.ok(control.lease);sql.close();
});
test('legacy retry migration cannot overwrite a competing lease acquired before reread',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const c:any=await backfillAction(db,{action:'claim'},1000);
 sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({...c.job,status:'pending',attempts:1,reason:'URL lookup failed (HTTP 400)',finishedAt:new Date(1000).toISOString()}),c.job.id);
 sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({nextAt:3601000}),'drop-history-control');
 const original=db.prepare.bind(db);let reads=0;
 const guarded={...db,prepare(q:string){const stmt=original(q);if(q==='SELECT value FROM job_state WHERE id=?'){const first=stmt.first.bind(stmt);stmt.first=async()=>{if(++reads===2)sql.prepare('UPDATE job_state SET value=? WHERE id=?').run(JSON.stringify({nextAt:32000,lease:'competing-worker',until:400000,jobId:c.job.id}),'drop-history-control');return first();};}return stmt;}} as D1Database;
 assert.equal((await backfillAction(guarded,{action:'claim'},32000)).busy,true);
 assert.equal(JSON.parse((sql.prepare('SELECT value FROM job_state WHERE id=?').get('drop-history-control') as any).value).lease,'competing-worker');sql.close();
});
test('timestamp import is retry-safe, rejects conflicts/ambiguous variants and leaves live offers untouched',async()=>{
 const {db,sql,p,o}=fixture();const dropProduct={id:'ss-11059',name:p.name,productUrl:o.url};
 const source={id:'b'.repeat(64),label:'Drop.solar · Signature Solar',url:'https://drop.solar/products/ss-11059',precision:'timestamp',startDate:'2025-11-09T16:46:12.010Z',endDate:'2026-06-18T01:16:25.401Z'};
 const payload={source,dropProduct,rows:[{offerId:o.id,name:p.name,link:o.url,packQuantity:1,date:source.startDate,price:4199}]};
 assert.equal((await importHistory(db,payload)).inserted,1);assert.equal((await importHistory(db,payload)).inserted,0);
 assert.equal((await backfillAction(db,{action:'status'})).importedRows,1);
 assert.equal((sql.prepare('SELECT stock FROM observations').get() as any).stock,'unknown');assert.equal((sql.prepare('SELECT json FROM offers').get() as any).json,JSON.stringify(o));
 await assert.rejects(importHistory(db,{...payload,rows:[{...payload.rows[0],price:123}]}),/conflict/i);
 sql.prepare('INSERT INTO offers VALUES(?,?,?,?)').run('ss-2',p.id,JSON.stringify({...o,id:'ss-2',packQuantity:2}),'today');
 await assert.rejects(importHistory(db,payload),/ambiguous/i);sql.close();
});
