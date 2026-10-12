import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categorizeProduct} from '../lib/retailers.ts';
import {normalizeCatalogProduct} from '../lib/catalog-cleanup.ts';
import {readCatalog} from '../lib/catalog-reader.ts';
import {comparisonRows} from '../lib/comparison-view.ts';
import {partValue} from '../lib/part-comparison.ts';
import {specificationForDisplay,specificationDisplayGroups} from '../lib/specifications.ts';
import {applyReviewedStorageRole} from '../lib/reviewed-storage-roles.ts';
import type {Product,Category,Specs,ProductSpecification} from '../lib/types.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/reviewed-storage-role-products.json',import.meta.url),'utf8')) as {approved:{proposalIndex:number;product:Product;destination:{category:Category;specs:Specs};anchors:Specs}[];held:Product[]};
const empty={products:[],reports:[],generatedAt:null};
function database(products:Product[],overrides:unknown[]=[]){return {prepare(){return {};},async batch(){return [products.map(p=>({json:JSON.stringify({...p,offers:[]})})),products.flatMap(p=>p.offers.map(o=>({product_id:p.id,json:JSON.stringify(o)}))),overrides,[],[]].map(results=>({results}));}};}
const snapshotDB={prepare(){return {};},async batch(){return Array.from({length:5},()=>({results:[]}));}} as unknown as D1Database;
function corrected(p:Product,destination:{category:Category;specs:Specs}):Product{return {...p,category:destination.category,specs:{...p.specs,...destination.specs}};}
for(const row of fixtures.approved){
 const {product:p,destination,anchors}=row;
 test('exact reviewed storage role preserves original sale and metadata: '+p.id,()=>{
  const before=structuredClone(p),want=corrected(p,destination);
  assert.deepEqual(categorizeProduct(p),want);assert.deepEqual(normalizeCatalogProduct(p),want);assert.deepEqual(p,before);
  for(const fn of [categorizeProduct,normalizeCatalogProduct])assert.deepEqual(fn(fn(p)),want,'idempotent');
 });
 test('selected role rejects each identity and raw anchor drift: '+p.id,()=>{
  const changes:Product[]=[{...p,id:p.id+'-sibling'},{...p,name:p.name+' revised'},{...p,sourceUrl:p.sourceUrl.replace('https://','http://')},{...p,sourceUrl:p.sourceUrl.replace('?variant=','?variant=0')},{...p,category:'electrical'},...Object.keys(anchors).map(k=>({...p,specs:{...p.specs,[k]:'drift'}})),...(['id','retailerId','url','sku'] as const).map(k=>({...p,offers:[{...p.offers[0],[k]:p.offers[0][k]+'-drift'}]})),{...p,offers:[]},{...p,offers:[...p.offers,{...p.offers[0],id:'second',sku:'another-variant'}]}];
  for(const changed of changes){assert.equal(applyReviewedStorageRole(changed),undefined);assert.deepEqual(normalizeCatalogProduct(changed),changed);}
  const already=corrected(p,destination);
  for(const key of Object.keys(anchors).filter(k=>!(k in destination.specs))) {const changed={...already,specs:{...already.specs,[key]:'drift'}};assert.equal(applyReviewedStorageRole(changed),undefined);assert.deepEqual(normalizeCatalogProduct(changed),changed);}
 });
 test('role correction preserves retained scalars, provenance references and unusual package units: '+p.id,()=>{
  const enriched={...p,specs:{...p.specs,strongerScalar:'preserve'},comparisonSpecs:{dimensions:{value:'unrelated retained dimension',source:'https://example.com/reviewed'}},connectionSpecs:{model:{key:'model',label:'Model',value:'retained',source:'https://example.com/reviewed',kind:'manufacturer' as const}},offers:p.offers.map(o=>({...o,packQuantity:3,recordedPackQuantity:4}))};
  assert.deepEqual(categorizeProduct(enriched),corrected(enriched,destination));assert.deepEqual(normalizeCatalogProduct(enriched),corrected(enriched,destination));
 });
 test('hydrated database and snapshot preserve exact role sale contracts: '+p.id,async()=>{
  const enriched={...p,offers:p.offers.map(o=>({...o,packQuantity:3}))};
  for(const catalog of [await readCatalog(database([enriched]) as unknown as D1Database,empty),await readCatalog(snapshotDB,{...empty,products:[enriched]})])assert.deepEqual(catalog.products[0],corrected(enriched,destination));
  const first=await readCatalog(database([enriched]) as unknown as D1Database,empty);const second=await readCatalog(database(first.products) as unknown as D1Database,empty);assert.deepEqual(second.products,first.products);
 });
}
test('held storage proposals and unrelated siblings retain current category',()=>{
 for(const p of fixtures.held){assert.deepEqual(normalizeCatalogProduct(p),p);assert.equal(categorizeProduct(p).category,p.category);}
 const p=fixtures.approved[0].product;assert.deepEqual(normalizeCatalogProduct({...p,id:'sibling-net'}),{...p,id:'sibling-net'});
 const utf=fixtures.approved.find(r=>r.proposalIndex===13)!.product;const mojibake={...utf,name:utf.name.replace('（','ï¼ˆ')};assert.deepEqual(normalizeCatalogProduct(mojibake),mojibake);
});
test('embedded old-category evidence holds role correction without dropping provenance',async()=>{
 const {product:p}=fixtures.approved[4];const source='https://example.com/stronger.pdf';const evidence:ProductSpecification={identity:{name:p.name,sourceUrl:p.sourceUrl,category:'batteries',anchors:{...p.specs}},summary:'Prior reviewed evidence',groups:[{title:'Prior',fields:[{key:'voltage',label:'Voltage',value:'51.2 V',source,kind:'manual'}]}],sources:[{url:source,kind:'manual',label:'Prior exact manual'}],notes:['Keep intact']};
 const candidate={...p,specification:evidence};assert.deepEqual(normalizeCatalogProduct(candidate),candidate);assert.deepEqual(categorizeProduct(candidate),candidate);
 for(const db of [snapshotDB,database([p]) as unknown as D1Database]){const result=await readCatalog(db,{...empty,products:[p]},{[p.id]:evidence});assert.equal(result.products[0].category,'batteries');assert.deepEqual(result.products[0].specification,evidence);}
});
test('duplicate raw catalog identities hold reviewed role application',async()=>{
 const p=fixtures.approved[4].product;
 for(const catalog of [await readCatalog(snapshotDB,{...empty,products:[p,structuredClone(p)]}),await readCatalog(database([p,structuredClone(p)]) as unknown as D1Database,empty)])assert.ok(catalog.products.every(p=>p.category==='batteries'));
});
test('owner role override takes precedence while unrelated owner fields survive correction',async()=>{
 const {product:p,destination}=fixtures.approved[4];const field={id:p.id,json:JSON.stringify({specs:{ownerReviewedMarker:'preserve'},documentation:'https://example.com/owner.pdf'})};const unrelated=await readCatalog(database([p],[field]) as unknown as D1Database,empty);assert.equal(unrelated.products[0].category,'kits');assert.equal(unrelated.products[0].specs.ownerReviewedMarker,'preserve');assert.equal(unrelated.products[0].documentation,'https://example.com/owner.pdf');
 const role={id:p.id,json:JSON.stringify({specs:{kitType:'Owner selected package'}})};const owned=await readCatalog(database([p],[role]) as unknown as D1Database,empty);assert.equal(owned.products[0].specs.kitType,'Owner selected package');assert.equal(owned.products[0].category,'batteries');assert.deepEqual(owned.products[0].offers,p.offers);
});
test('cabinet comparisons are non-applicable and loose-cell kit contents remain unknown',()=>{
 const row=fixtures.approved.find(r=>r.proposalIndex===3)!;const cabinet=normalizeCatalogProduct(row.product);const rows=comparisonRows([cabinet],true);
 for(const key of ['capacityKwh','voltage','chemistry','maxDischargeCurrent','capacityAh','maxChargeCurrent','peakDischargeCurrent','communications'])assert.equal(rows.find(r=>r.key===key)!.values[0].value,'N/A',key);
 assert.equal(partValue(cabinet,'formFactor').value,'Empty cabinet');assert.equal(rows.find(r=>r.key==='dimensions')!.values[0].value,'—');
 for(const row of fixtures.approved.filter(r=>r.destination.category==='kits')){const kit=normalizeCatalogProduct(row.product);assert.deepEqual(comparisonRows([kit],true).map(r=>r.key),['kitType','contents']);assert.equal(partValue(kit,'contents').value,'—');assert.equal(kit.configuration,undefined);assert.ok(specificationForDisplay(kit).groups.flatMap(g=>g.fields).every(f=>!['voltage','capacityAh','capacityKwh','chemistry'].includes(f.key)));}
});
test('drifted metadata and foreign offers retain prepatch generic categorization behavior',()=>{
 // Expectations captured from db86be94's real categorizeProduct, before correction.
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/reviewed-storage-role-generic-baseline.json',import.meta.url),'utf8')) as {input:Product;expected:Product}[];
 for(const {input,expected} of baseline)assert.deepEqual(JSON.parse(JSON.stringify(categorizeProduct(input))),expected);
});
test('exact proven empty cabinet display excludes whole-battery rating claims while retaining raw audit anchors',()=>{
 const p=fixtures.approved.find(r=>r.proposalIndex===3)!.product;
 const cabinet=normalizeCatalogProduct(p),before=structuredClone(cabinet),display=specificationForDisplay(cabinet);
 assert.ok(!/25\.6|280|314|LiFePO4/i.test(display.summary));
 assert.match(display.summary,/empty battery cabinet/i);
 assert.ok(display.groups.flatMap(g=>g.fields).every(f=>!['voltage','capacityAh','capacityKwh','chemistry','maxChargeCurrent','maxDischargeCurrent'].includes(f.key)));
 assert.ok(specificationDisplayGroups(cabinet,display).flatMap(g=>g.fields).every(f=>['model','compatibility','dimensions','weight','material','ipRating','formFactor'].includes(f.key)),'product detail consumer uses only cabinet fields');
 assert.deepEqual(cabinet,before);assert.equal(cabinet.specs.voltage,25.6);assert.equal(cabinet.specs.capacityAh,280);assert.equal(cabinet.specs.chemistry,'LiFePO4');
 const unrelated={...cabinet,id:'another-cabinet'};
 assert.ok(specificationForDisplay(unrelated).groups.flatMap(g=>g.fields).some(f=>f.key==='voltage'),'unrelated cabinet behavior remains unchanged');
 const drifted={...cabinet,name:cabinet.name+' changed'};
 assert.deepEqual(specificationForDisplay(drifted),specificationForDisplay({...drifted,id:'unreviewed'}),'name drift cannot use approved display suppression');
});
test('deferred database selections restore actual prepatch generic categorization after final offer rejection',async()=>{
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/reviewed-storage-role-hydration-baseline.json',import.meta.url),'utf8')) as {label:string;input:Product;expected:Product}[];
 for(const {label,input,expected} of baseline){
  const catalog=await readCatalog(database([input]) as unknown as D1Database,empty);
  assert.equal(catalog.storage,'database');
  assert.deepEqual(JSON.parse(JSON.stringify(catalog.products[0])),expected,label);
  assert.deepEqual(catalog.products[0].offers,input.offers,'rejected role keeps prices and package units: '+label);
 }
});
test('rejected deferred roles preserve explicit owner, prior-evidence and duplicate holds',async()=>{
 const {product:p,destination}=fixtures.approved[4];
 const rejected={...corrected(p,destination),offers:p.offers.map(o=>({...o,sku:'foreign',packQuantity:3}))};
 const owned=await readCatalog(database([rejected],[{id:p.id,json:JSON.stringify({specs:{kitType:'Owner selected package'}})}]) as unknown as D1Database,empty);
 assert.equal(owned.products[0].category,'kits');assert.equal(owned.products[0].specs.kitType,'Owner selected package');assert.deepEqual(owned.products[0].offers,rejected.offers);
 const scalar=await readCatalog(database([rejected],[{id:p.id,json:JSON.stringify({specs:{capacityAh:333,ownerReviewedMarker:'preserve'},documentation:'https://example.com/owner.pdf'})}]) as unknown as D1Database,empty);
 assert.equal(scalar.products[0].category,'batteries');assert.equal(scalar.products[0].specs.kitType,undefined);assert.equal(scalar.products[0].specs.capacityAh,333);assert.equal(scalar.products[0].specs.ownerReviewedMarker,'preserve');assert.equal(scalar.products[0].documentation,'https://example.com/owner.pdf');assert.deepEqual(scalar.products[0].offers,rejected.offers);
 const specification:ProductSpecification={summary:'Prior evidence must hold',groups:[],sources:[],notes:['Preserve immutable evidence']};const prior={...rejected,specification};
 const preserved=await readCatalog(database([prior]) as unknown as D1Database,empty);assert.deepEqual(preserved.products[0],prior);
 const duplicates=await readCatalog(database([rejected,structuredClone(rejected)]) as unknown as D1Database,empty);
 assert.equal(duplicates.products[0].category,'kits');assert.equal(duplicates.products[0].specs.kitType,'Battery DIY kit');assert.ok(duplicates.products[0].offers.every(o=>o.packQuantity===3&&o.sku==='foreign'));
});
