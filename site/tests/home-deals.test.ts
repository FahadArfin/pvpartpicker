import test from 'node:test';
import assert from 'node:assert/strict';
import {homeDeals,nextDealOffset} from '../lib/home-deals.ts';
import {buildDrops,type PriceDrop} from '../lib/price-drops.ts';
import type {Product} from '../lib/types.ts';
const now=Date.now(),stamp=new Date(now).toISOString();
const p:Product={id:'panel',name:'200W Solar Panel',brand:'Example',category:'panels',description:'',image:'/panel.webp',images:[],sourceUrl:'https://example.com',specs:{watts:200},verifiedAt:stamp,offers:[{id:'offer',retailerId:'shop',retailer:'Shop',url:'https://example.com',price:300,currency:'USD',packQuantity:4,stock:'in_stock',observedAt:stamp,condition:'new'}]};
const candidates=[{offerId:'offer',previous:400,previousAt:new Date(now-86400000).toISOString(),firstObservedAt:new Date(now-86400000).toISOString(),observations:2,changedAt:stamp}];
const drops=buildDrops([p],candidates,now);
test('home deals retain pack cost, freshness and verified historical comparison without catalog fields',()=>{
 const result=homeDeals([p],drops);assert.equal(result.length,1);assert.equal(result[0].current,75);assert.equal(result[0].previous,100);assert.equal(result[0].purchasePrice,300);assert.equal(result[0].packQuantity,4);assert.equal(result[0].observedAt,stamp);assert.equal('specs' in result[0],false);assert.equal('offers' in result[0],false);
 assert.deepEqual(homeDeals([p],buildDrops([{...p,offers:p.offers.map(o=>({...o,stock:'out_of_stock'}))}],candidates,now)),[]);
});
test('home feed selects latest distinct products and is bounded to twelve',()=>{
 const products=Array.from({length:15},(_,i)=>({...p,id:'p'+i,offers:[{...p.offers[0],id:'o'+i}]}));
 const rows:PriceDrop[]=products.map((p,i)=>({...drops[0],productId:p.id,offerId:p.offers[0].id,changedAt:new Date(now-i*1000).toISOString()}));
 const result=homeDeals(products,[...rows,rows[0],{...rows[0],productId:'missing'}]);assert.equal(result.length,12);assert.equal(result[0].productId,'p0');assert.equal(result.at(-1)?.productId,'p11');assert.equal(new Set(result.map(d=>d.productId)).size,12);
});
test('carousel wraps, bounds partially visible cards, and handles no overflow',()=>{
 assert.equal(nextDealOffset(0,900,300,1),300);assert.equal(nextDealOffset(800,900,300,1),900);assert.equal(nextDealOffset(900,900,300,1),0);assert.equal(nextDealOffset(0,900,300,-1),900);assert.equal(nextDealOffset(100,900,300,-1),0);assert.equal(nextDealOffset(0,0,300,1),0);
});
