import test from 'node:test';import assert from 'node:assert/strict';
import {modelPackageDeals,watchedModelPackages,watchedModelGroups} from '../lib/model-package-deals.ts';
import type {Product,Offer} from '../lib/types.ts';
const now=Date.parse('2026-10-08T12:00:00Z');
const offer=(id:string,price:number,extra:Partial<Offer>={}):Offer=>({id,price,retailer:'Retailer',retailerId:'retailer',url:'https://example.com/'+id,currency:'USD',packQuantity:1,condition:'new',stock:'in_stock',observedAt:new Date(now).toISOString(),...extra});
const product=(id:string,kind:'unit'|'pack'|'bundle',offers:Offer[]):Product=>({id,name:id,brand:'Brand',category:'all-in-one',image:'',images:[],description:'',sourceUrl:'https://example.com/'+id,specs:{},verifiedAt:new Date(now).toISOString(),offers,modelIdentity:{modelId:'station',name:'Station',defaultProductId:'unit',kind,packageKey:id,packageLabel:id,listingCount:5}});
test('cheaper bundle leads on total purchase cost, with exact package/offer and equal-condition unit savings',()=>{
 const unit=product('unit','unit',[offer('unit-offer',899)]),bundle=product('bundle','bundle',[offer('bundle-offer',849)]),pack=product('pack','pack',[offer('pack-offer',1600,{packQuantity:2})]);
 const report=modelPackageDeals(unit,[unit,pack,bundle],now);
 assert.equal(report.rows[0].product.id,'bundle');assert.equal(report.rows[0].offer?.id,'bundle-offer');assert.equal(report.rows[0].belowUnit,50);assert.equal(report.cheaperBundle?.product.id,'bundle');assert.equal(report.rows.find(r=>r.product.id==='pack')?.purchasePrice,1600);
});
test('stale, out-of-stock and unknown-condition comparisons cannot claim a cheaper bundle',()=>{
 const unit=product('unit','unit',[offer('unit-offer',899)]);
 const stale=product('stale','bundle',[offer('stale-offer',1,{observedAt:new Date(now-86400001).toISOString()})]);
 const oos=product('oos','bundle',[offer('oos-offer',2,{stock:'out_of_stock'})]);
 const used=product('used','bundle',[offer('used-offer',500,{condition:'used'})]);
 const bad=product('bad','bundle',[offer('bad-offer',3,{packQuantity:0})]);
 const report=modelPackageDeals(unit,[unit,stale,oos,used,bad],now);
 assert.equal(report.cheaperBundle,undefined);assert.equal(report.rows.find(r=>r.product.id==='used')?.belowUnit,undefined);assert.equal(report.rows.find(r=>r.product.id==='stale')?.offer,undefined);assert.equal(report.rows.find(r=>r.product.id==='bad')?.offer,undefined);
});
test('same-package aliases collapse, unrelated model offers cannot enter comparison',()=>{
 const unit=product('unit','unit',[offer('a',899)]),alias={...unit,id:'alias'},other=product('other','bundle',[offer('other-offer',1)]);other.modelIdentity={...other.modelIdentity!,modelId:'different'};
 const report=modelPackageDeals(alias,[unit,alias,other],now);assert.equal(report.rows.length,1);assert.equal(report.rows[0].product.id,'alias');
});
test('watch list groups identical package aliases but retains distinct bundles and removal IDs',()=>{
 const unit=product('unit','unit',[offer('a',899)]),alias={...unit,id:'alias'},bundle=product('bundle','bundle',[offer('b',849)]);
 const rows=watchedModelPackages([unit,alias,bundle],['alias','bundle','unit','unavailable']);
 assert.equal(rows.length,2);assert.equal(rows[0].product.id,'alias');assert.deepEqual(rows[0].ids,['alias','unit']);assert.deepEqual(rows[1].ids,['bundle']);
});
test('a cheaper used offer cannot hide a new-vs-new bundle saving',()=>{
 const unit=product('unit','unit',[offer('unit-new',899)]),bundle=product('bundle','bundle',[offer('bundle-used',500,{condition:'used'}),offer('bundle-new',849)]);
 const report=modelPackageDeals(unit,[unit,bundle],now);
 assert.equal(report.rows[0].offer?.id,'bundle-used');assert.equal(report.rows[0].belowUnit,undefined);
 assert.equal(report.cheaperBundle?.offer?.id,'bundle-new');assert.equal(report.cheaperBundle?.purchasePrice,849);assert.equal(report.cheaperBundle?.belowUnit,50);
});

test('model watch counts agree across distinct packages without merging unknown identities',()=>{
 const unit=product('unit','unit',[]),bundle=product('bundle','bundle',[]),unknown={...unit,id:'unknown',modelIdentity:undefined};
 const groups=watchedModelGroups([unit,bundle,unknown],['unit','bundle','unknown','missing']);
 assert.equal(groups.length,2);assert.deepEqual(groups[0].packages.map(p=>p.product.id),['unit','bundle']);assert.equal(groups[1].id,'listing:unknown');
});
