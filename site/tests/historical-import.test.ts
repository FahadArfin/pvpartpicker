import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {parseHistoryCsv,historyIdentity,importHistory} from '../lib/historical-import.ts';
test('archive CSV preserves commas, quotes and embedded newlines',()=>{
 const rows=parseHistoryCsv('\uFEFFname,price,description,image,link,date\r\n"Solar, panel",100,"Line 1\nLine ""2""",,https://signaturesolar.com/panel/,2025-01-02\r\n');
 assert.equal(rows[0].name,'Solar, panel');assert.equal(rows[0].description,'Line 1\nLine "2"');assert.equal(rows.length,1);
});
test('identity requires exact package and product; reused bundle URLs and changed accessories stay unresolved',()=>{
 const p:any={id:'eg4-6000xp',name:'EG4 6000XP Off-Grid Inverter',category:'inverters'};
 const o:any={id:'signature-solar-1511090',url:'https://signaturesolar.com/eg4-6000xp/',packQuantity:1,retailerId:'signature-solar',currency:'USD'};
 assert.ok(historyIdentity(p,o,{name:'EG4 6000XP Off-Grid Inverter | 8000W PV Input',link:o.url}));
 assert.equal(historyIdentity(p,o,{name:'EG4 6000XP + WallMount Battery Bundle',link:o.url}),false);
 assert.equal(historyIdentity(p,o,{name:'EG4 6000XP Off-Grid Inverter | 2 Pack',link:o.url}),false);
 assert.equal(historyIdentity(p,o,{name:'EG4 6000XP Off-Grid Inverter | Used - Refurbished',link:o.url}),false);
 assert.equal(historyIdentity(p,{...o,packQuantity:2},{name:p.name,link:o.url}),false);
 assert.equal(historyIdentity({...p,category:'kits'},o,{name:p.name,link:o.url}),false);
 assert.equal(historyIdentity(p,o,{name:p.name,link:'https://other.com/eg4-6000xp/'}),false);
 assert.equal(historyIdentity({...p,name:'Battery cable'},o,{name:'Battery cable with new connectors',link:o.url}),false);
});
test('backfill is idempotent and cannot change current prices, stock, freshness or send alerts',async()=>{
 const sql=new DatabaseSync(':memory:');for(const n of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+n,import.meta.url),'utf8'));
 const p={id:'eg4-6000xp',name:'EG4 6000XP Off-Grid Inverter',category:'inverters'};
 const o={id:'signature-solar-1511090',url:'https://signaturesolar.com/eg4-6000xp/',packQuantity:1,retailerId:'signature-solar',currency:'USD',price:1499,stock:'in_stock',observedAt:'2026-10-06T10:00:00.000Z'};
 sql.prepare('INSERT INTO products VALUES (?,?,?)').run(p.id,JSON.stringify(p),o.observedAt);sql.prepare('INSERT INTO offers VALUES (?,?,?,?)').run(o.id,p.id,JSON.stringify(o),o.observedAt);
 const db={prepare(q:string){const s=sql.prepare(q);let a:any[]=[];const w={bind(...v:any[]){a=v;return w;},async first(){return s.get(...a)||null;},async run(){return {meta:{changes:Number(s.run(...a).changes)}};}};return w;},async batch(s:any[]){sql.exec('BEGIN');try{const r=[];for(const v of s)r.push(await v.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
 const source={id:'a'.repeat(64),label:'Signature Solar archive shared by warklantd',url:'https://diysolarforum.com/threads/price-history-tool-for-signature-solar-current-connected-shopsolar-rich-solar.117159/post-1651990',precision:'day',startDate:'2024-06-03',endDate:'2025-11-28'};
 const payload={source,rows:[{offerId:o.id,name:p.name,link:o.url,packQuantity:1,date:'2025-01-02',price:1699}]};
 assert.equal((await importHistory(db,payload)).inserted,1);assert.equal((await importHistory(db,payload)).inserted,0);
 assert.equal((sql.prepare('SELECT json FROM offers').get() as any).json,JSON.stringify(o));assert.equal((sql.prepare('SELECT updated_at FROM products').get() as any).updated_at,o.observedAt);
 assert.equal((sql.prepare('SELECT stock FROM observations').get() as any).stock,'unknown');assert.equal((sql.prepare('SELECT COUNT(*) n FROM notifications').get() as any).n,0);
 await assert.rejects(importHistory(db,{...payload,rows:[{...payload.rows[0],packQuantity:2}]}),/identity/i);
 await assert.rejects(importHistory(db,{...payload,rows:[{...payload.rows[0],date:'2025-02-30'}]}),/date/i);
 await assert.rejects(importHistory(db,{...payload,source:{...source,label:'changed'}}),/source/i);
 sql.close();
});
