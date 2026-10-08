import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildModelCatalog,type ModelRegistry} from '../lib/model-identity.ts';
import type {Product} from '../lib/types.ts';
const registry=JSON.parse(fs.readFileSync(new URL('../data/model-identities.json',import.meta.url),'utf8')) as ModelRegistry;
function fixtures():Product[]{return registry.flatMap(m=>m.listings.map(l=>({id:l.id,name:l.title,brand:m.name.split(' ')[0],category:'all-in-one',description:'',image:'',images:[],sourceUrl:l.parent,specs:l.hardware||{},verifiedAt:'2026-10-07T12:00:00Z',offers:[{id:l.id,retailerId:l.id,retailer:l.id,url:l.parent,price:100,currency:'USD',packQuantity:l.packQuantity||1,stock:'in_stock',condition:'new',observedAt:'2026-10-07T12:00:00Z'}]} as Product)));}
test('reviewed registry has unique stable model/listing IDs and rejects known conflicts',()=>{
 assert.equal(new Set(registry.map(m=>m.id)).size,registry.length);const entries=registry.flatMap(m=>m.listings);assert.equal(new Set(entries.map(l=>l.id)).size,entries.length);
 assert.ok(!registry.some(m=>/F1000LFP|RSP200DC-ASR/i.test(m.name)));
 for(const m of registry){assert.ok(m.listings.some(l=>l.id===m.preferredId));for(const l of m.listings)assert.ok(l.packageLabel&&l.parent.startsWith('https://')&&l.title);}
});
test('bare F3000 main-unit offers share one selection while cart and panel bundles stay separate',()=>{
 const view=buildModelCatalog(fixtures(),registry),station=view.find(p=>p.id==='pecron-44730689159356')!;
 assert.equal(station.modelIdentity?.kind,'unit');assert.ok(station.offers.some(o=>o.id==='shopsolar-44236343640204'));assert.ok(!station.offers.some(o=>o.id==='pecron-44730734641340'));
 const bundle=view.find(p=>p.id==='pecron-44731306344636')!;assert.equal(bundle.modelIdentity?.kind,'bundle');assert.ok(bundle.offers.some(o=>o.id==='pecron-44730689192124'));assert.equal(bundle.offers.length,2);
});
test('different panel pack quantities stay separate and matching 4-packs share retailers',()=>{
 const view=buildModelCatalog(fixtures(),registry),p=view.find(p=>p.id==='shopsolar-45086083776652')!;
 assert.equal(p.modelIdentity?.packageLabel,'4 units');assert.equal(p.offers.length,2);assert.ok(p.offers.every(o=>o.packQuantity===4));
 assert.equal(view.find(p=>p.id==='sungoldpower-44430515437705')?.offers.length,1);
});
test('included panels, racking and finish selections never substitute a cheaper package',()=>{
 const view=buildModelCatalog(fixtures(),registry);
 for(const id of ['santan-solar-b17901127','santan-solar-river2pro-110-1-us','santan-solar-river2pro-220-1-us','shopsolar-51517850878092','shopsolar-51517850812556','shopsolar-51517850845324','shopsolar-44746653696140','shopsolar-44746661232780']){
  const product=view.find(p=>p.id===id)!;assert.equal(product.offers.length,1,id);assert.notEqual(product.modelIdentity?.packageKey,'unit',id);
 }
 assert.equal(view.find(p=>p.id==='santan-solar-b17901127')?.modelIdentity?.kind,'bundle');
});
