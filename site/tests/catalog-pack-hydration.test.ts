import test from 'node:test';
import assert from 'node:assert/strict';
import {readCatalog} from '../lib/catalog-reader.ts';
import {createPageCatalogLoader} from '../lib/catalog-client.ts';
import {serializePageCatalog} from '../lib/catalog-transport.ts';
import {normalizeSelectedBatteryPackOffer} from '../lib/retailers.ts';
import {costForQuantity} from '../lib/domain.ts';
import {latestObservedOffer} from '../lib/catalog-cleanup.ts';
import type {Product,Offer,ProductSpecification} from '../lib/types.ts';

// Exact selected DPU pack names and recorded amounts from live Site109.
const variants:[string,number,number,number][]=[['44235326849164',1,6.1,2199],['44235326881932',2,12.2,4368],['44235326914700',3,18.42,6547],['44235326947468',4,24.56,8706],['44235326980236',5,30.7,10895]];
function selectedPack(variant=variants[1]):Product{
 const [id,count,total,price]=variant,sourceUrl='https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant='+id;
 const offer:Offer={id:'shopsolar-'+id,retailerId:'shopsolar',retailer:'ShopSolar',url:sourceUrl,price,currency:'USD',packQuantity:1,stock:'out_of_stock',observedAt:'2026-10-11T23:17:26.271Z',condition:'new'};
 return {id:offer.id,name:'EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — '+count+' Battery'+(count>1?' Packs':'')+' ['+total+'kWh]',brand:'EcoFlow',category:'batteries',description:'',image:'',images:[],sourceUrl,verifiedAt:offer.observedAt,specs:{capacityKwh:6.1,packCapacityKwh:total},offers:[offer]};
}
function database(products:Product[],overrides:unknown[]=[],mappings:unknown[]=[]){
 let calls=0;
 return {get calls(){return calls;},prepare(sql:string){return {sql};},async batch(statements:unknown[]){calls++;assert.equal(statements.length,5);return [products.map(p=>({json:JSON.stringify({...p,offers:[]})})),products.flatMap(p=>p.offers.map(o=>({product_id:p.id,json:JSON.stringify(o)}))),overrides,mappings,[]].map(results=>({results}));}};
}
const initial={products:[],reports:[],generatedAt:null};

test('database hydration through page loader preserves exact DPU pack units and whole-sale prices',async()=>{
 const products=variants.map(selectedPack),before=structuredClone(products),db=database(products);
 const catalog=await readCatalog(db as unknown as D1Database,initial);
 assert.equal(catalog.storage,'database');assert.equal(db.calls,1);
 const now=Date.parse(products[0].offers[0].observedAt)+1000,deadline=now+120000;
 const payload={...JSON.parse(serializePageCatalog(catalog)),version:1,expiresAt:deadline};
 let fetches=0;const loader=createPageCatalogLoader(async()=>{fetches++;return Response.json(payload);},()=>now);
 const [page,sharedPage]=await Promise.all([loader(null),loader(null)]);
 assert.equal(fetches,1);assert.strictEqual(page,sharedPage);assert.equal(page.expiresAt,deadline);
 for(let i=0;i<variants.length;i++){
  const [,units,,price]=variants[i],p=page.products.find(p=>p.id===products[i].id)!,offer=latestObservedOffer(p.offers)!;
  assert.equal(offer.packQuantity,units,p.id);
  assert.equal(offer.recordedPackQuantity,units>1?1:undefined);
  assert.equal(offer.price/offer.packQuantity,price/units);
  assert.deepEqual(costForQuantity(offer,units),{packs:1,purchasedUnits:units,extraUnits:0,subtotal:price});
  assert.deepEqual({...offer,packQuantity:1,recordedPackQuantity:undefined},{...products[i].offers[0],recordedPackQuantity:undefined});
 }
 const two=page.products.find(p=>p.id==='shopsolar-44235326881932')!;
 assert.equal(two.offers[0].price/two.offers[0].packQuantity,2184);
 assert.equal(costForQuantity(two.offers[0],2).subtotal,4368);
 assert.deepEqual(products,before,'database source observations are never mutated');
});

test('quantity hydration preserves reviewed field sources and explicit owner scalar overrides',async()=>{
 const p=selectedPack(),url='https://example.com/reviewed-dpu-manual.pdf';
 const manual:ProductSpecification={summary:'Reviewed per-module capacity',groups:[{title:'Capacity & battery',fields:[{key:'capacityKwh',label:'Energy capacity',value:'6.144 kWh',source:url,kind:'manual'}]}],sources:[{url,kind:'manual',label:'Reviewed fixture manual',checkedAt:'2026-10-12T00:00:00Z'}],notes:[],identity:{name:p.name,sourceUrl:p.sourceUrl,category:'batteries',anchors:{capacityKwh:6.1}}};
 const db=database([p],[{id:p.id,json:JSON.stringify({specs:{capacityKwh:6.144,ownerReviewedMarker:'preserve'},documentation:url})}]);
 const catalog=await readCatalog(db as unknown as D1Database,initial,{[p.id]:manual});
 const hydrated=catalog.products[0];
 assert.equal(hydrated.specs.capacityKwh,6.144);
 assert.equal(hydrated.specs.ownerReviewedMarker,'preserve');assert.equal(hydrated.documentation,url);
 assert.strictEqual(hydrated.specification,manual);assert.deepEqual(hydrated.specification?.sources,manual.sources);
 assert.equal(hydrated.offers[0].packQuantity,2);assert.equal(hydrated.offers[0].recordedPackQuantity,1);
});

test('pack hydration excludes different offer origins, paths and variants, and mixed or accessory sales',async()=>{
 const p=selectedPack();
 const rejectedURLs=[p.sourceUrl.replace('shopsolarkits.com','example.com'),p.sourceUrl.replace('/ecoflow-delta-pro-ultra-battery-pack','/another-product'),p.sourceUrl.replace('44235326881932','44235326914700')];
 for(const url of rejectedURLs){const offer={...p.offers[0],url};const catalog=await readCatalog(database([{...p,offers:[offer]}]) as unknown as D1Database,initial);assert.deepEqual(catalog.products[0].offers[0],offer,url);}
 for(const name of [p.name+' + Inverter','EcoFlow DELTA Pro Power Station — Main Unit + 2 Extra Batteries','Battery Carrying Case Kit — 2 Battery Packs']){
  const candidate={...p,name};const catalog=await readCatalog(database([candidate]) as unknown as D1Database,initial);assert.deepEqual(catalog.products[0].offers[0],candidate.offers[0],name);
 }
});

test('final mapped offers use their exact target selection and already-normalized packs remain idempotent',async()=>{
 const target=selectedPack(),source={...target,id:'other-listing',name:'Battery module',sourceUrl:'https://example.com/battery'};
 const targetWithoutOffers={...target,offers:[]};
 const mapped=await readCatalog(database([targetWithoutOffers,source],[],[{id:target.offers[0].id,product_id:target.id}]) as unknown as D1Database,initial);
 assert.equal(mapped.products[0].id,target.id);assert.equal(mapped.products[0].offers[0].packQuantity,2);
 const normalized={...target,offers:[{...target.offers[0],packQuantity:2,recordedPackQuantity:1}]};
 assert.strictEqual(normalizeSelectedBatteryPackOffer(normalized,normalized.offers[0]),normalized.offers[0],'already-normalized offer identity remains intact');
 const first=await readCatalog(database([normalized]) as unknown as D1Database,initial);
 const second=await readCatalog(database(first.products) as unknown as D1Database,initial);
 assert.deepEqual(first.products,second.products);assert.deepEqual(first.products[0].offers,normalized.offers);
});

test('dated snapshot fallback uses the same offer-only correction without changing reviewed scalars',async()=>{
 const p={...selectedPack(),specs:{capacityKwh:6.144,ownerReviewedMarker:'preserve'}};
 const snapshot={products:[p],reports:[],generatedAt:p.verifiedAt};
 const empty={prepare(){return {};},async batch(){return Array.from({length:5},()=>({results:[]}));}} as unknown as D1Database;
 const catalog=await readCatalog(empty,snapshot);
 assert.equal(catalog.storage,'snapshot');assert.equal(catalog.products[0].specs.capacityKwh,6.144);
 assert.equal(catalog.products[0].offers[0].packQuantity,2);assert.equal(catalog.products[0].offers[0].recordedPackQuantity,1);
 assert.equal(catalog.products[0].offers[0].observedAt,p.offers[0].observedAt);
 assert.equal(p.offers[0].packQuantity,1);
});

test('source pack count survives mapping to the canonical one-module target',async()=>{
 const source=selectedPack(),canonical=selectedPack(variants[0]);
 const catalog=await readCatalog(database([canonical,source],[],[{id:source.offers[0].id,product_id:canonical.id}]) as unknown as D1Database,initial);
 const target=catalog.products.find(p=>p.id===canonical.id)!;
 const mapped=target.offers.find(o=>o.id===source.offers[0].id)!;
 assert.equal(mapped.packQuantity,2);assert.equal(mapped.recordedPackQuantity,1);
 assert.equal(mapped.price/mapped.packQuantity,2184);assert.equal(costForQuantity(mapped,2).subtotal,4368);
 assert.deepEqual({...mapped,packQuantity:1,recordedPackQuantity:undefined},{...source.offers[0],recordedPackQuantity:undefined});
 assert.equal(target.offers.find(o=>o.id===canonical.offers[0].id)?.packQuantity,1);
 assert.equal(target.sourceUrl,canonical.sourceUrl);assert.equal(target.specs.capacityKwh,6.1);
});
