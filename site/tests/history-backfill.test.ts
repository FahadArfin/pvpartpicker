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
 const status:any=await backfillAction(db,{action:'status'},now);assert.equal(status.counts.complete,1);assert.equal(status.importedRows,2);sql.close();
});
test('source refusal pauses the whole queue and scheduled runs cannot silently resume it',async()=>{
 const {db,sql}=fixture();await backfillAction(db,{action:'seed'},1000);const a:any=await backfillAction(db,{action:'claim'},1000);
 await backfillAction(db,{action:'pause',lease:a.lease,reason:'HTTP 403'},1000);
 assert.equal((await backfillAction(db,{action:'claim'},500000) as any).paused,true);sql.close();
});
test('timestamp import is retry-safe, rejects conflicts/ambiguous variants and leaves live offers untouched',async()=>{
 const {db,sql,p,o}=fixture();const dropProduct={id:'ss-11059',name:p.name,productUrl:o.url};
 const source={id:'b'.repeat(64),label:'Drop.solar · Signature Solar',url:'https://drop.solar/products/ss-11059',precision:'timestamp',startDate:'2025-11-09T16:46:12.010Z',endDate:'2026-06-18T01:16:25.401Z'};
 const payload={source,dropProduct,rows:[{offerId:o.id,name:p.name,link:o.url,packQuantity:1,date:source.startDate,price:4199}]};
 assert.equal((await importHistory(db,payload)).inserted,1);assert.equal((await importHistory(db,payload)).inserted,0);
 assert.equal((sql.prepare('SELECT stock FROM observations').get() as any).stock,'unknown');assert.equal((sql.prepare('SELECT json FROM offers').get() as any).json,JSON.stringify(o));
 await assert.rejects(importHistory(db,{...payload,rows:[{...payload.rows[0],price:123}]}),/conflict/i);
 sql.prepare('INSERT INTO offers VALUES(?,?,?,?)').run('ss-2',p.id,JSON.stringify({...o,id:'ss-2',packQuantity:2}),'today');
 await assert.rejects(importHistory(db,payload),/ambiguous/i);sql.close();
});
