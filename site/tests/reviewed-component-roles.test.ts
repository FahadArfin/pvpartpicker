import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categorizeProduct} from '../lib/retailers.ts';
import {normalizeCatalogProduct} from '../lib/catalog-cleanup.ts';
import {readCatalog} from '../lib/catalog-reader.ts';
import {applyReviewedStorageRole} from '../lib/reviewed-storage-roles.ts';
import {comparisonRows} from '../lib/comparison-view.ts';
import {specificationForDisplay} from '../lib/specifications.ts';
import type {Product,Category,Specs,ProductSpecification} from '../lib/types.ts';

type Patch={set:Partial<Product>;remove:string[]};
type Approved={proposalIndex:number;product:Product;target:{category:Category;specs:Specs};anchors:Specs};
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/reviewed-component-role-products.json',import.meta.url),'utf8')) as {approved:Approved[];held:Product[];rejectionBaseline:{id:string;label:string;input:Patch;categorized:Patch;normalized:Patch;databaseProducts:Patch[];snapshotProducts:Patch[]}[]};
const empty={products:[],reports:[],generatedAt:null};
const snapshotDB={prepare(){return {};},async batch(){return Array.from({length:5},()=>({results:[]}));}} as unknown as D1Database;
function database(products:Product[],overrides:unknown[]=[]){return {prepare(){return {};},async batch(){return [products.map(p=>({json:JSON.stringify({...p,offers:[]})})),products.flatMap(p=>p.offers.map(o=>({product_id:p.id,json:JSON.stringify(o)}))),overrides,[],[]].map(results=>({results}));}} as unknown as D1Database;}
const clean=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
function applyPatch(base:Product,p:Patch){const next={...structuredClone(base),...structuredClone(p.set)};for(const key of p.remove)delete (next as unknown as Record<string,unknown>)[key];return next;}
function expected(row:Approved):Product{return {...row.product,category:row.target.category,specs:{...row.product.specs,...row.target.specs}};}

for(const row of fixtures.approved){
 const p=row.product;
 test('verified component category applies consistently and preserves the selected sale: '+p.id,async()=>{
  const before=structuredClone(p),want=expected(row);
  assert.deepEqual(categorizeProduct(p),want);assert.deepEqual(normalizeCatalogProduct(p),want);
  for(const fn of [categorizeProduct,normalizeCatalogProduct])assert.deepEqual(fn(fn(p)),want,'idempotent');
  for(const catalog of [await readCatalog(database([p]),empty),await readCatalog(snapshotDB,{...empty,products:[p]})])assert.deepEqual(catalog.products[0],want);
  assert.deepEqual(p,before);assert.deepEqual(want.offers,p.offers);assert.equal(want.brand,p.brand);assert.deepEqual(want.modelIdentity,p.modelIdentity);
 });
 test('component role holds changed identities, selections, packages and scalar overrides: '+p.id,()=>{
  const changed:Product[]=[{...p,id:p.id+'-other'},{...p,name:p.name+' revised'},{...p,sourceUrl:p.sourceUrl+'#foreign'},{...p,category:'charging'},...Object.keys(row.anchors).map(key=>({...p,specs:{...p.specs,[key]:'changed'}})),...Object.keys(row.target.specs).map(key=>({...p,specs:{...p.specs,[key]:'Owner selected role'}})),...(['id','retailerId','url','sku','packQuantity'] as const).map(key=>({...p,offers:[{...p.offers[0],[key]:key==='packQuantity'?p.offers[0].packQuantity+1:String(p.offers[0][key])+'-other'}]})),{...p,offers:[]},{...p,offers:[...p.offers,{...p.offers[0],id:'other'}]}];
  for(const input of changed)assert.equal(applyReviewedStorageRole(input),undefined);
  const validMarketUpdate={...p,offers:p.offers.map(o=>({...o,price:o.price+7,observedAt:'2026-10-13T00:00:00Z',stock:'out_of_stock' as const,condition:'used' as const}))};
  assert.deepEqual(applyReviewedStorageRole(validMarketUpdate),{...expected(row),offers:validMarketUpdate.offers},'market observations are preserved, not bound to an old price');
 });
 test('component owner role corrections and prior evidence retain their hold: '+p.id,async()=>{
  const key=Object.keys(row.target.specs)[0],override={id:p.id,json:JSON.stringify({specs:{[key]:'Owner selected role'}})};
  const owned=await readCatalog(database([p],[override]),empty);assert.equal(owned.products[0].category,p.category);assert.equal(owned.products[0].specs[key],'Owner selected role');assert.deepEqual(owned.products[0].offers,p.offers);
  const source=p.sourceUrl+'#prior-source',prior:ProductSpecification={summary:'Retained prior evidence',identity:{name:p.name,sourceUrl:p.sourceUrl,category:p.category,anchors:row.anchors},groups:[{title:'Prior',fields:[{key:'dimensions',label:'Dimensions',value:'Unrelated prior dimension',source,kind:'manual'}]}],sources:[{url:source,kind:'manual',label:'Prior source'}],notes:['Retain this source']};
  const input={...p,specification:prior};assert.equal(applyReviewedStorageRole(input),undefined);assert.deepEqual(categorizeProduct(input),input);assert.deepEqual(normalizeCatalogProduct(input),input);
  for(const catalog of [await readCatalog(database([input]),empty),await readCatalog(snapshotDB,{...empty,products:[input]})])assert.deepEqual(catalog.products[0],input);
 });
}

test('rejected component projections retain actual prepatch generic behavior in every catalog path',async()=>{
 for(const row of fixtures.rejectionBaseline){const base=fixtures.approved.find(p=>p.product.id===row.id)!.product,input=applyPatch(base,row.input),label=row.id+' '+row.label;
  assert.deepEqual(clean(categorizeProduct(input)),applyPatch(input,row.categorized),label+' categorization');assert.deepEqual(clean(normalizeCatalogProduct(input)),applyPatch(input,row.normalized),label+' normalization');
  assert.deepEqual(clean((await readCatalog(database([input]),empty)).products),row.databaseProducts.map(p=>applyPatch(input,p)),label+' database');assert.deepEqual(clean((await readCatalog(snapshotDB,{...empty,products:[input]})).products),row.snapshotProducts.map(p=>applyPatch(input,p)),label+' snapshot');
 }
});

test('duplicate identities and the six unresolved source cases receive no new component role',async()=>{
 for(const row of fixtures.approved){const p=row.product;for(const catalog of [await readCatalog(database([p,structuredClone(p)]),empty),await readCatalog(snapshotDB,{...empty,products:[p,structuredClone(p)]})])assert.ok(catalog.products.every(x=>x.category===p.category));}
 for(const p of fixtures.held){assert.equal(applyReviewedStorageRole(p),undefined);assert.deepEqual(normalizeCatalogProduct(p),p);assert.equal(categorizeProduct(p).category,p.category);}
});

test('target-category evidence waits for the final component selected-offer and package guard',async()=>{
 for(const row of fixtures.approved){const p=row.product,source=p.sourceUrl+'#future-source';const evidence:ProductSpecification={identity:{name:p.name,sourceUrl:p.sourceUrl,category:row.target.category,anchors:row.target.specs},summary:'Future exact source',groups:[{title:'Physical',fields:[{key:'dimensions',label:'Dimensions',value:'20 x 30 x 40 mm',source,kind:'manual'}]}],sources:[{url:source,kind:'manual',label:'Future exact source'}],notes:[]};
  const accepted=await readCatalog(database([p]),empty,{[p.id]:evidence});assert.equal(accepted.products[0].category,row.target.category);assert.deepEqual(accepted.products[0].specification,evidence);
  for(const input of [p,expected(row)])for(const field of ['sku','packQuantity'] as const){const rejected={...input,offers:[{...input.offers[0],[field]:field==='sku'?'foreign':input.offers[0].packQuantity+1}]};for(const result of [await readCatalog(database([rejected]),empty,{[p.id]:evidence}),await readCatalog(snapshotDB,{...empty,products:[rejected]},{[p.id]:evidence})])assert.equal(result.products[0].specification,undefined,'foreign final selection cannot attach target evidence '+p.id);}
 }
});

test('rejected raw category metadata cannot acquire a reviewed component role or target evidence after generic classification',async()=>{
 for(const row of fixtures.approved){
  const p={...row.product,category:'charging' as Category},source=p.sourceUrl+'#future-source';
  const evidence:ProductSpecification={identity:{name:p.name,sourceUrl:p.sourceUrl,category:row.target.category,anchors:row.target.specs},summary:'Future exact source',groups:[{title:'Physical',fields:[{key:'dimensions',label:'Dimensions',value:'20 x 30 x 40 mm',source,kind:'manual'}]}],sources:[{url:source,kind:'manual',label:'Future exact source'}],notes:[]};
  assert.equal(applyReviewedStorageRole(p),undefined);
  for(const catalog of [await readCatalog(database([p]),empty,{[p.id]:evidence}),await readCatalog(snapshotDB,{...empty,products:[p]},{[p.id]:evidence})]){
   assert.equal(catalog.products[0].specification,undefined,'raw category hold must survive hydration: '+p.id);
   for(const key of Object.keys(row.target.specs))assert.equal(catalog.products[0].specs[key],undefined,'raw category hold must survive generic classification: '+p.id);
  }
 }
});

test('source category corrections retire irrelevant gaps without inventing technical measurements',()=>{
 let before=0,after=0,retired=0,added=0,persisted=0;
 for(const row of fixtures.approved){const old=comparisonRows([row.product],true).filter(r=>r.values[0].value==='—').map(r=>r.key),next=normalizeCatalogProduct(row.product),missing=comparisonRows([next],true).filter(r=>r.values[0].value==='—').map(r=>r.key);before+=old.length;after+=missing.length;retired+=old.filter(x=>!missing.includes(x)).length;added+=missing.filter(x=>!old.includes(x)).length;persisted+=missing.filter(x=>old.includes(x)).length;
  assert.deepEqual(next.specs,{...row.product.specs,...row.target.specs});assert.deepEqual(next.offers,row.product.offers);
  const display=specificationForDisplay(next);assert.ok(!display.panelRatings,'non-panel role cannot show panel electrical tables');assert.ok(display.groups.flatMap(g=>g.fields).every(f=>f.kind==='listing'),'no technical field transcriptions in this patch');
 }
 // The Isc TC panel row adds one pre-correction gap for each of 15 Watts247
 // combiner listings still miscategorized as panels; category repair retires those rows.
 assert.deepEqual({before,after,retired,added,persisted},{before:228,after:87,retired:226,added:85,persisted:2});
});
