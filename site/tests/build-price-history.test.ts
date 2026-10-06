import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {buildPriceHistory,validateHistoryRequest,buildHistoryQuery} from '../lib/build-price-history.ts';
import {buildHistoryChartPoints} from '../lib/build-history-chart.ts';
import type {Product,Offer,Observation} from '../lib/types.ts';
const now=Date.parse('2026-10-06T12:00:00Z');
const offer=(id:string,packQuantity=1):Offer=>({id,retailerId:id,retailer:id,url:'https://example.com',price:100,currency:'USD',packQuantity,stock:'in_stock',observedAt:'2026-09-01T00:00:00Z',condition:'new'});
const product=(id:string,offers:Offer[]):Product=>({id,name:id,brand:'Brand',category:'panels',description:'',image:'',images:[],sourceUrl:'',specs:{},verifiedAt:'2026-09-01',offers});
const obs=(offerId:string,price:number,at:string,packQuantity=1,stock='in_stock'):Observation=>({offerId,price,observedAt:at,packQuantity,stock});

test('history uses whole packages and the lowest purchase cost for the current quantities',()=>{
 const products=[product('panels',[offer('single'),offer('four',4)]),product('battery',[offer('battery')])];
 const points=[obs('single',90,'2026-10-05T10:00:00Z'),obs('four',300,'2026-10-05T10:00:00Z',4),obs('battery',500,'2026-10-05T10:00:00Z')];
 const h=buildPriceHistory([{productId:'panels',quantity:5},{productId:'battery',quantity:2}],products,points,30,now);
 const day=h.points.find(p=>p.date==='2026-10-05')!;
 assert.equal(day.prices.panels?.cost,450); // 5 singles beat 2 four-packs.
 assert.equal(day.prices.battery?.cost,1000);assert.equal(day.subtotal,1450);assert.equal(day.complete,true);
 const chosen=buildPriceHistory([{productId:'panels',quantity:5,offerId:'four'}],products,points,30,now);
 assert.equal(chosen.points.find(p=>p.date==='2026-10-05')!.subtotal,600);
});
test('later out-of-stock observations, stale checks, package changes and missing parts create gaps rather than free equipment',()=>{
 const p=product('panel',[offer('panel')]);
 const observations=[obs('panel',100,'2026-10-03T10:00:00Z'),obs('panel',80,'2026-10-03T20:00:00Z',1,'out_of_stock'),obs('panel',10,'2026-10-04T10:00:00Z',2),obs('panel',90,'2026-10-05T10:00:00Z'),obs('panel',1,'2026-10-07T10:00:00Z')];
 const h=buildPriceHistory([{productId:'panel',quantity:1},{productId:'missing',quantity:1}],[p],observations,30,now);
 assert.equal(h.points.find(p=>p.date==='2026-10-03')!.prices.panel,null);
 assert.equal(h.points.find(p=>p.date==='2026-10-04')!.prices.panel,null);
 assert.equal(h.points.find(p=>p.date==='2026-10-05')!.subtotal,90);
 assert.equal(h.points.find(p=>p.date==='2026-10-05')!.complete,false);
 assert.equal(h.points.at(-1)!.prices.panel,null);
 assert.equal(h.series.find(s=>s.productId==='missing')!.hasHistory,false);
 assert.equal(h.points.length,30);
});
test('selected retailers never silently switch, non-USD and invalid observations are excluded, latest snapshots are not backdated',()=>{
 const usd=offer('usd'),cad={...offer('cad'),currency:'CAD'} as unknown as Offer;
 const p=product('panel',[usd,cad,{...offer('new'),price:125,observedAt:'2026-10-06T11:00:00Z'}]);
 const points=[obs('usd',NaN,'2026-10-06T11:00:00Z'),obs('cad',1,'2026-10-06T11:00:00Z')];
 const h=buildPriceHistory([{productId:'panel',quantity:1}],[p],points,30,now);
 assert.equal(h.points.at(-1)!.subtotal,125);assert.equal(h.points.at(-2)!.prices.panel,null);
 assert.equal(buildPriceHistory([{productId:'panel',quantity:1,offerId:'usd'}],[p],points,30,now).points.at(-1)!.subtotal,null);
});
test('history requests reject excessive, duplicate, fractional and invalid selections',()=>{
 assert.deepEqual(validateHistoryRequest({lines:[{productId:'p',quantity:2}],days:90}),{lines:[{productId:'p',quantity:2}],days:90});
 for(const input of [{lines:[],days:2},{lines:[{productId:'p',quantity:1.5}],days:90},{lines:[{productId:'p',quantity:0}],days:30},{lines:[{productId:'p',quantity:1},{productId:'p',quantity:2}],days:30},{lines:Array.from({length:101},(_,i)=>({productId:String(i),quantity:1})),days:365}])assert.throws(()=>validateHistoryRequest(input));
});
test('stacked bands break at missing checkpoints instead of plotting an unknown part as zero',()=>{
 const h=buildPriceHistory([{productId:'a',quantity:1},{productId:'b',quantity:1},{productId:'missing',quantity:1}],[product('a',[offer('a')]),product('b',[offer('b')])],[obs('a',100,'2026-10-04T20:00:00Z'),obs('a',90,'2026-10-05T20:00:00Z'),obs('b',300,'2026-10-05T20:00:00Z')],30,now);
 const chart=buildHistoryChartPoints(h),gap=chart.find(p=>p.date==='2026-10-04')!,full=chart.find(p=>p.date==='2026-10-05')!;
 assert.equal(gap.part0,null);assert.equal(gap.part1,null);assert.equal(gap.total,null);
 assert.deepEqual(full.part0,[0,90]);assert.deepEqual(full.part1,[90,390]);assert.equal(full.total,390);assert.equal(full.complete,false);
});
test('batched query selects the last daily check including unavailability and bounds the requested offer scope',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE observations(id TEXT,offer_id TEXT,price REAL,pack_quantity INTEGER,stock TEXT,observed_at TEXT)');
 const insert=db.prepare('INSERT INTO observations VALUES (?,?,?,?,?,?)');
 insert.run('1','a',100,1,'in_stock','2026-10-05T10:00:00Z');insert.run('2','a',90,1,'out_of_stock','2026-10-05T20:00:00Z');
 insert.run('3','b',5,1,'in_stock','2026-10-05T10:00:00Z');insert.run('4','a',10,1,'in_stock','2026-10-07T00:00:00Z');
 const rows=db.prepare(buildHistoryQuery).all(JSON.stringify(['a']),'2026-10-04T00:00:00Z','2026-10-06T12:00:00Z') as unknown as Observation[];
 assert.equal(rows.length,1);assert.equal(rows[0].stock,'out_of_stock');assert.equal(rows[0].price,90);db.close();
});
