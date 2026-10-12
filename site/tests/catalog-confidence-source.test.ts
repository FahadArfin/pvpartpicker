import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {latestSourceReportsQuery} from '../lib/catalog-reader.ts';
test('latest retailer failure remains visible beyond seven other retailer jobs',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE collection_runs(id TEXT,json TEXT,created_at TEXT)');
 const add=(id:string,retailerId:string,date:string,status='ok')=>db.prepare('INSERT INTO collection_runs VALUES(?,?,?)').run(id,JSON.stringify([{retailerId,retailer:retailerId,checkedAt:date,status,products:status==='ok'?1:0}]),date);
 add('old-naz','naz','2026-10-10T10:00:00Z');add('naz-failed','naz','2026-10-11T10:00:00Z','failed');for(let i=0;i<15;i++)add('shop'+i,'shop',`2026-10-11T11:${String(i).padStart(2,'0')}:00Z`);
 const rows=db.prepare(latestSourceReportsQuery).all() as {json:string}[],reports=rows.flatMap(r=>JSON.parse(r.json));assert.equal(reports.length,2);assert.equal(reports.find(r=>r.retailerId==='naz')?.status,'failed');assert.equal(reports.find(r=>r.retailerId==='shop')?.checkedAt,'2026-10-11T11:14:00Z');db.close();
});
