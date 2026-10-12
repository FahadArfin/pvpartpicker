import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPurchaseComparison,buildEquipmentTarget} from '../lib/build-purchase.ts';
import type {Build,Offer,Product} from '../lib/types.ts';
const now=Date.parse('2026-10-11T12:00:00Z');
const offer=(id:string,retailerId:string,price:number,extra:Partial<Offer>={}):Offer=>({id,retailerId,retailer:retailerId,url:'https://example.com/'+id,price,currency:'USD',packQuantity:1,stock:'in_stock',observedAt:new Date(now).toISOString(),condition:'new',...extra});
const product=(id:string,offers:Offer[]):Product=>({id,name:id,brand:'Brand',category:'panels',description:'',image:'',images:[],sourceUrl:'https://example.com',specs:{},offers,verifiedAt:new Date(now).toISOString()});
const build=(lines:Build['lines']):Build=>({name:'Test',lines,settings:{purpose:'offgrid',mount:'roof'}});
test('packs round up and known shipping is explicitly per purchased package',()=>{
 const result=buildPurchaseComparison(build([{productId:'p',quantity:5,offerId:'a'}]),[product('p',[offer('a','shop',100,{packQuantity:3,shipping:10}),offer('wrong-pack','shop2',1)])],now);
 assert.equal(result.split.complete,true);assert.equal(result.split.equipmentSubtotal,200);assert.equal(result.split.knownShipping,20);
 assert.equal(result.split.lines[0].cost?.packs,2);assert.equal(result.split.lines[0].cost?.extraUnits,1);
});
test('split and single retailer plans rank only complete equipment coverage',()=>{
 const result=buildPurchaseComparison(build([{productId:'p',quantity:1},{productId:'b',quantity:1}]),[product('p',[offer('p-a','a',40),offer('p-b','b',30),offer('p-c','partial',1)]),product('b',[offer('b-a','a',20),offer('b-b','b',50)])],now);
 assert.equal(result.split.equipmentSubtotal,21);assert.deepEqual(result.singleRetailer.map(p=>p.equipmentSubtotal),[60,80]);assert.equal(result.incompleteRetailers[0].complete,false);assert.equal(result.incompleteRetailers[0].equipmentSubtotal,null);
 assert.equal(result.split.unknownShippingCount,2);assert.equal(result.split.knownShipping,0);
});
test('stale, future, unknown stock, invalid packs and nonfinite prices cannot fill a line',()=>{
 for(const patch of [{observedAt:new Date(now-86400001).toISOString()},{observedAt:new Date(now+60001).toISOString()},{stock:'unknown'},{stock:'out_of_stock'},{packQuantity:0},{packQuantity:1.5},{price:Infinity}] as Partial<Offer>[]){
  const result=buildEquipmentTarget(build([{productId:'p',quantity:1}]),[product('p',[offer('a','shop',100,patch)])],now);
  assert.equal(result.complete,false);assert.equal(result.subtotal,null);assert.deepEqual(result.missingProductIds,['p']);
 }
});
test('selected used condition is honored and unpinned products default to new',()=>{
 const products=[product('p',[offer('used','a',20,{condition:'used'}),offer('used-b','b',25,{condition:'used'}),offer('new','b',10)]),product('b',[offer('b-used','a',1,{condition:'used'}),offer('b-new','b',30)])];
 const result=buildPurchaseComparison(build([{productId:'p',quantity:1,offerId:'used'},{productId:'b',quantity:1}]),products,now);
 assert.equal(result.split.equipmentSubtotal,50);assert.equal(result.split.lines[0].offer?.condition,'used');assert.equal(result.singleRetailer[0].retailerId,'b');assert.equal(result.singleRetailer[0].equipmentSubtotal,55);
});
test('missing selected offers and missing products stay incomplete without substitutions',()=>{
 const result=buildPurchaseComparison(build([{productId:'p',quantity:1,offerId:'missing'},{productId:'missing-product',quantity:1}]),[product('p',[offer('new','a',10)])],now);
 assert.equal(result.split.complete,false);assert.equal(result.split.equipmentSubtotal,null);assert.equal(result.split.lines[0].reason,'Selected offer is unavailable; reselect a package and condition.');
});
test('unknown or invalid shipping is distinct from an explicit zero quote',()=>{
 const result=buildPurchaseComparison(build([{productId:'p',quantity:1},{productId:'b',quantity:1},{productId:'c',quantity:1}]),[product('p',[offer('p','a',10,{shipping:0})]),product('b',[offer('b','a',20,{shipping:-1})]),product('c',[offer('c','a',30,{shipping:Infinity})])],now);
 assert.equal(result.split.unknownShippingCount,2);assert.equal(result.split.lines[0].shipping,0);assert.equal(result.split.lines[1].shipping,null);
});
test('empty build never qualifies for a complete equipment target',()=>{
 const result=buildEquipmentTarget(build([]),[],now);assert.equal(result.complete,false);assert.equal(result.subtotal,null);
});
test('a stale selected offer still permits a fresh alternative with the same package and condition',()=>{
 const result=buildEquipmentTarget(build([{productId:'p',quantity:1,offerId:'old'}]),[product('p',[offer('old','a',10,{observedAt:new Date(now-86400001).toISOString()}),offer('fresh','b',20)])],now);
 assert.equal(result.complete,true);assert.equal(result.subtotal,20);
});
test('unpinned new offers can use packs while shipping never changes equipment ranking',()=>{
 const result=buildPurchaseComparison(build([{productId:'p',quantity:5}]),[product('p',[offer('units','a',20,{shipping:0}),offer('pack','b',50,{packQuantity:3,shipping:100}),offer('used','a',1,{condition:'used'})])],now);
 assert.equal(result.split.equipmentSubtotal,100);assert.equal(result.singleRetailer[0].equipmentSubtotal,100);
 assert.equal(result.singleRetailer.find(p=>p.retailerId==='b')?.knownShipping,200);
 assert.equal(result.split.lines[0].offer?.condition,'new');
});
