import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product,Offer} from '../lib/types.ts';
const offer:Offer={id:'sale',retailerId:'shop',retailer:'Shop',url:'https://example.com',price:200,currency:'USD',packQuantity:1,stock:'in_stock',observedAt:'2026-10-04T00:00:00Z',condition:'new'};
const product:Product={id:'battery',name:'Battery module',brand:'Example',category:'batteries',description:'A battery',image:'',images:[],sourceUrl:'https://example.com',verifiedAt:offer.observedAt,specs:{voltage:48},offers:[offer]};
const snapshot={products:[product],reports:[],generatedAt:offer.observedAt};
function fakeDB(results:unknown[][]){let calls=0;const prepared:string[]=[];return {get calls(){return calls;},prepared,prepare(sql:string){prepared.push(sql);return {sql,all(){throw new Error('Sequential query used');}};},async batch(statements:unknown[]){calls++;assert.equal(statements.length,5);return results.map(results=>({results}));}};}

test('catalog loads all database tables in one round trip while preserving corrections and mapped offers',async()=>{
 const {readCatalog}=await import('../lib/catalog-reader.ts');
 const db=fakeDB([
  [{json:JSON.stringify({...product,offers:[]})},{json:JSON.stringify({...product,id:'station',name:'Power station',category:'all-in-one',specs:{stationType:'Portable power station'},offers:[]})}],
  [{product_id:'battery',json:JSON.stringify(offer)},{product_id:'station',json:JSON.stringify({...offer,id:'bundle',packQuantity:4})}],
  [{id:'battery',json:JSON.stringify({specs:{voltage:51.2},documentation:'https://example.com/specs'})}],
  [{id:'bundle',product_id:'battery'}],
  [{json:JSON.stringify([{retailerId:'shop',retailer:'Shop',status:'ok',products:2,checkedAt:offer.observedAt}]),created_at:offer.observedAt}]
 ]);
 const catalog=await readCatalog(db as any,snapshot);
 assert.equal(db.calls,1);assert.equal(catalog.storage,'database');
 const battery=catalog.products.find(p=>p.id==='battery')!;
 assert.equal(battery.specs.voltage,51.2);assert.equal(battery.documentation,'https://example.com/specs');
 assert.deepEqual(battery.offers.map(o=>o.id),['sale','bundle']);assert.equal(battery.offers[1].packQuantity,1);
 assert.equal(catalog.products.length,1);assert.equal(catalog.reports.length,1);
 assert.equal(product.specs.voltage,48);assert.equal(product.offers.length,1);
});
test('empty and unavailable databases retain the dated snapshot without caching a failure',async()=>{
 const {readCatalog}=await import('../lib/catalog-reader.ts');
 const empty=await readCatalog(fakeDB([[],[],[],[],[]]) as any,snapshot);assert.equal(empty.storage,'snapshot');assert.equal(empty.products[0].offers[0].observedAt,offer.observedAt);
 const broken=await readCatalog({prepare(){throw new Error('unavailable');}} as any,snapshot);assert.equal(broken.storage,'snapshot_unavailable_database');assert.equal(broken.products.length,1);
});
