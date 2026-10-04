import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDrops,selectDrops,dropPeriod,normalizeWatchIds,dropQuery,bestDropsByProduct,watchInsertSql} from '../lib/price-drops.ts';
import {DatabaseSync} from 'node:sqlite';
import type {Product} from '../lib/types.ts';
const now=Date.parse('2026-10-04T23:00:00Z');
const product={id:'panel',category:'panels',offers:[{id:'offer',retailer:'Retailer',currency:'USD',price:800,packQuantity:10,stock:'in_stock',condition:'new',observedAt:'2026-10-04T22:00:00Z'}]} as Product;
const candidate={offerId:'offer',previous:1000,previousAt:'2026-10-04T12:00:00Z',firstObservedAt:'2026-10-04T12:00:00Z',observations:3,changedAt:'2026-10-04T21:00:00Z'};
test('drop calculations compare the same offer and disclose both unit savings and full package purchase',()=>{
 const d=buildDrops([product],[candidate],now)[0];
 assert.equal(d.previous,100);assert.equal(d.current,80);assert.equal(d.dollars,20);assert.equal(d.percent,20);assert.equal(d.purchasePrice,800);assert.equal(d.packQuantity,10);
 assert.equal(d.changedAt,candidate.changedAt);assert.equal(d.observations,3);
});
test('stale, unavailable, future, non-USD, unchanged and malformed prices never count as drops',()=>{
 for(const override of [{stock:'unknown'},{stock:'out_of_stock'},{observedAt:'2026-10-01T00:00:00Z'},{observedAt:'2026-10-05T00:00:00Z'},{currency:'CAD'},{packQuantity:0},{price:NaN}])assert.equal(buildDrops([{...product,offers:[{...product.offers[0],...override}]}] as Product[],[candidate],now).length,0);
 for(const previous of [800,700,NaN,0])assert.equal(buildDrops([product],[{...candidate,previous}],now).length,0);
 assert.equal(buildDrops([product],[{...candidate,observations:1}],now).length,0);
});
test('drop sorting and minimum dollar or percentage filters use numeric amounts',()=>{
 const d=buildDrops([product],[candidate],now)[0];const second={...d,offerId:'second',dollars:50,percent:10,changedAt:'2026-10-04T20:00:00Z'};
 assert.equal(selectDrops([d,second],{sort:'dollars'})[0].offerId,'second');
 assert.equal(selectDrops([d,second],{sort:'percent'})[0].offerId,'offer');
 assert.equal(selectDrops([d,second],{sort:'latest'})[0].offerId,'offer');
 assert.deepEqual(selectDrops([d,second],{minDollars:25}).map(d=>d.offerId),['second']);
 assert.deepEqual(selectDrops([d,second],{minPercent:15}).map(d=>d.offerId),['offer']);
});
test('period parameters are bounded and watch list imports reject malformed or unbounded input',()=>{
 assert.equal(dropPeriod('day').days,1);assert.equal(dropPeriod('week').days,7);assert.equal(dropPeriod('month').days,30);assert.equal(dropPeriod('latest').days,30);
 assert.throws(()=>dropPeriod('year'));
 assert.deepEqual(normalizeWatchIds(['a','a','b']),['a','b']);
 assert.throws(()=>normalizeWatchIds([3]));assert.throws(()=>normalizeWatchIds(Array.from({length:501},(_,i)=>String(i))));assert.throws(()=>normalizeWatchIds(['x'.repeat(181)]));
});
test('SQL preserves a drop through unchanged checks, isolates package sizes and distinguishes rolling windows',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE offers(id TEXT,json TEXT);CREATE TABLE observations(offer_id TEXT,price REAL,pack_quantity INTEGER,stock TEXT,observed_at TEXT)');
 db.prepare('INSERT INTO offers VALUES (?,?)').run('offer',JSON.stringify(product.offers[0]));
 const insert=db.prepare('INSERT INTO observations VALUES (?,?,?,?,?)');
 for(const [price,pack,stock,at] of [[1500,10,'in_stock','2026-09-20T00:00:00Z'],[1200,10,'in_stock','2026-10-01T00:00:00Z'],[1000,10,'in_stock','2026-10-04T12:00:00Z'],[5000,20,'in_stock','2026-10-04T13:00:00Z'],[4000,10,'out_of_stock','2026-10-04T14:00:00Z'],[800,10,'in_stock','2026-10-04T21:00:00Z'],[800,10,'in_stock','2026-10-04T22:00:00Z'],[9000,10,'in_stock','2026-10-05T00:00:00Z']] as const)insert.run('offer',price,pack,stock,at);
 const daily=db.prepare(dropQuery(false)).all('2026-10-03T23:00:00Z') as any[];
 const weekly=db.prepare(dropQuery(false)).all('2026-09-27T23:00:00Z') as any[];
 const monthly=db.prepare(dropQuery(false)).all('2026-09-04T23:00:00Z') as any[];
 const latest=db.prepare(dropQuery(true)).all('2026-09-04T23:00:00Z') as any[];
 assert.equal(daily[0].previous,1000);assert.equal(weekly[0].previous,1200);assert.equal(monthly[0].previous,1500);
 assert.equal(latest[0].previous,1000);assert.equal(latest[0].changedAt,'2026-10-04T21:00:00Z');assert.equal(latest[0].observations,5);
 assert.equal(buildDrops([product],latest,now)[0].dollars,20);db.close();
});
test('watchlist percentage ranking selects the highest-percent retailer, independently of dollars',()=>{
 const d=buildDrops([product],[candidate],now)[0],highDollars={...d,offerId:'expensive',dollars:200,percent:5},highPercent={...d,offerId:'discount',dollars:100,percent:50};
 assert.equal(bestDropsByProduct([highDollars,highPercent],'percent').get('panel')?.offerId,'discount');assert.equal(bestDropsByProduct([highDollars,highPercent],'dollars').get('panel')?.offerId,'expensive');
});
test('account watchlist capacity stays bounded even when two callers observed space before inserting',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE watchlist(user_id TEXT,product_id TEXT,created_at TEXT,PRIMARY KEY(user_id,product_id))');
 const insert=db.prepare(watchInsertSql);for(let i=0;i<499;i++)insert.run('user',String(i),'now','user');
 const count=()=>Number((db.prepare("SELECT COUNT(*) AS n FROM watchlist WHERE user_id='user'").get() as any).n);
 assert.equal(count(),499);assert.equal(count(),499);insert.run('user','first','now','user');insert.run('user','second','now','user');assert.equal(count(),500);
 insert.run('other','second','now','other');assert.equal((db.prepare("SELECT COUNT(*) AS n FROM watchlist WHERE user_id='other'").get() as any).n,1);db.close();
});
