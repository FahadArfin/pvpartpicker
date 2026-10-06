import test from 'node:test';
import assert from 'node:assert/strict';
import {createProductHistoryLoader,productHistoryPoints} from '../lib/product-price-history.ts';
import type {Product,Observation} from '../lib/types.ts';
const product={category:'panels',offers:[{id:'a',packQuantity:4},{id:'b',packQuantity:1}]} as Product;
const check=(offerId:string,price:number,observedAt:string,packQuantity?:number):Observation=>({offerId,price,observedAt,packQuantity,stock:'in_stock'});

test('chart uses the historical pack size and retains distinct retailers and actual check times',()=>{
 const observations=[check('a',300,'2026-10-02T12:00:00Z',3),check('a',400,'2026-10-01T12:00:00Z',2),check('b',120,'2026-10-02T12:00:00Z')];
 const points=productHistoryPoints(product,observations);
 assert.equal(points[0].a,200);assert.equal(points[1].a,100);assert.equal(points[1].b,120);
 assert.equal(points[0].time,Date.parse('2026-10-01T12:00:00Z'));
 assert.equal(points[0].b,undefined,'missing checks must not become zero or held prices');
 assert.equal(productHistoryPoints({...product,category:'kits'},observations)[0].a,400);
});
test('chart rejects unmatched, invalid and zero-pack observations without inventing history',()=>{
 assert.deepEqual(productHistoryPoints(product,[check('old-unmapped',100,'2026-10-01'),check('a',100,'bad-date'),check('a',100,'2026-10-01',0),check('a',-1,'2026-10-01')]),[]);
 assert.deepEqual(productHistoryPoints(product,[]),[]);
});
test('preview and product page share history requests until cache expiry',async()=>{
 let calls=0,now=1000,release!:(response:Response)=>void;
 const loader=createProductHistoryLoader(async()=>{calls++;return new Promise<Response>(resolve=>{release=resolve;});},()=>now);
 const preview=loader('a',90),detail=loader('a',90);assert.equal(calls,1);
 release(Response.json({observations:[check('a',100,'2026-10-01')]}));
 assert.equal(await preview,await detail);await loader('a',90);assert.equal(calls,1);
 now+=300000;const refresh=loader('a',90);assert.equal(calls,2);release(Response.json({observations:[]}));await refresh;
 const other=loader('b',90);assert.equal(calls,3);release(Response.json({observations:[]}));await other;
 const period=loader('a',30);assert.equal(calls,4);release(Response.json({observations:[]}));await period;
});
test('failed history requests can retry and empty histories are valid',async()=>{
 let calls=0;const loader=createProductHistoryLoader(async()=>++calls===1?Response.json({error:'offline'},{status:503}):Response.json({observations:[]}));
 await assert.rejects(loader('a',90),/offline/);assert.deepEqual(await loader('a',90),[]);assert.equal(calls,2);
 await assert.rejects(createProductHistoryLoader(async()=>Response.json({observations:null}))('a',90),/Invalid price history/);
 await assert.rejects(createProductHistoryLoader(async()=>{throw Error('Failed to fetch');})('a',90),/Check your connection/);
});
