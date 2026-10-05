import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product} from '../lib/types.ts';
import {bestOffer,costForQuantity,checkCompatibility} from '../lib/domain.ts';
const now=new Date().toISOString();
const panel:Product={id:'panel',name:'Panel </script> test',brand:'Example',category:'panels',description:'Full description '.repeat(1000),image:'https://example.com/panel.png',images:['https://example.com/panel.png','https://example.com/other.png'],sourceUrl:'https://example.com/panel',documentation:'https://example.com/specs',verifiedAt:now,specs:{watts:400,face:'Bifacial'},offers:[{id:'pallet',retailerId:'shop',retailer:'Shop',url:'https://example.com/buy',currency:'USD',price:1200,packQuantity:10,stock:'in_stock',observedAt:now,condition:'new'}]};
test('page catalog transport preserves pricing, exact specs and source links while removing detail-only duplication',async()=>{
 const {serializePageCatalog}=await import('../lib/catalog-transport.ts');
 const result=serializePageCatalog({products:[panel],reports:[]});assert.equal(typeof result,'string');
 const decoded=JSON.parse(result);const part=decoded.products[0];
 assert.equal(part.name,panel.name);assert.equal(part.image,panel.image);assert.equal(part.documentation,panel.documentation);
 assert.deepEqual(part.specs,panel.specs);assert.deepEqual(part.offers,panel.offers);
 assert.equal(costForQuantity(bestOffer(part)!,11).subtotal,2400);
 assert.deepEqual(checkCompatibility([part],{purpose:'offgrid',mount:'roof'}),checkCompatibility([panel],{purpose:'offgrid',mount:'roof'}));
 assert.equal(part.description,'');assert.deepEqual(part.images,[]);
 assert.ok(result.length<JSON.stringify(panel).length/5);
 assert.equal(panel.images.length,2);assert.ok(panel.description.length>1000);
});
