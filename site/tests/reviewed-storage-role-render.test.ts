import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as specifications from '../lib/specifications.ts';
import {normalizeCatalogProduct} from '../lib/catalog-cleanup.ts';
import {readCatalog} from '../lib/catalog-reader.ts';
import type {Product,ProductSpecification,Category,Specs} from '../lib/types.ts';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(fs.readFileSync(new URL('../components/product-specifications.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const component={exports:{} as {ProductSpecifications:React.ComponentType<{product:Product}>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/specifications'?specifications:require(id),component,component.exports);
const render=(product:Product)=>renderToStaticMarkup(React.createElement(component.exports.ProductSpecifications,{product}));
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/reviewed-storage-role-products.json',import.meta.url),'utf8')) as {approved:{product:Product;destination:{category:Category;specs:Specs}}[]};
const empty={products:[],reports:[],generatedAt:null};
function database(products:Product[],overrides:unknown[]=[]){return {prepare(){return {};},async batch(){return [products.map(p=>({json:JSON.stringify({...p,offers:[]})})),products.flatMap(p=>p.offers.map(o=>({product_id:p.id,json:JSON.stringify(o)}))),overrides,[],[]].map(results=>({results}));}};}
const snapshotDB={prepare(){return {};},async batch(){return Array.from({length:5},()=>({results:[]}));}} as unknown as D1Database;
const source='https://example.com/exact-target-fixture.pdf';
function targetEvidence(p:Product,key:string,value:string):ProductSpecification{return {identity:{name:p.name,sourceUrl:p.sourceUrl,category:p.category,anchors:{...p.specs}},summary:'Exact selected target-category fixture',groups:[{title:'Selected equipment',fields:[{key,label:key,value,source,kind:'manual'}]}],sources:[{url:source,kind:'manual',label:'Exact target fixture manual'}],notes:['Test-only evidence, never imported']};}
for(const row of fixtures.approved.filter(r=>r.destination.category==='accessories'))test('actual rendered exact accessory excludes inherited battery ratings: '+row.product.id,()=>{
 const p=normalizeCatalogProduct(row.product),before=structuredClone(p),html=render(p);
 assert.doesNotMatch(html,/Battery chemistry|Battery format|Energy capacity|Rated capacity|LiFePO4|Server rack|16 kWh/);
 assert.deepEqual(p,before);
 const sibling={...p,id:'unreviewed-accessory'};assert.match(render(sibling),/Battery chemistry/,'other accessory behavior unchanged');
});
for(const row of fixtures.approved.filter(r=>['accessories','kits'].includes(r.destination.category)))test('both catalog paths apply exact target-category evidence after guarded role: '+row.product.id,async()=>{
 const p=row.product,projected={...p,category:row.destination.category,specs:{...p.specs,...row.destination.specs}},key=projected.category==='kits'?'contents':'dimensions',value=key==='contents'?'One enclosure and separately supplied loose cells; test-only package proof':'123 × 456 × 789 mm; test-only exact fit';const evidence=targetEvidence(projected,key,value);
 for(const db of [snapshotDB,database([p]) as unknown as D1Database]){
  const catalog=await readCatalog(db,{...empty,products:[p]},{[p.id]:evidence}),actual=catalog.products[0];
  assert.equal(actual.category,projected.category);assert.strictEqual(actual.specification,evidence);assert.deepEqual(actual.offers,p.offers);
  const html=render(actual);assert.match(html,/Exact target fixture manual/);assert.ok(html.includes(value));assert.ok(html.includes(source));
  if(actual.category==='accessories')assert.doesNotMatch(html,/Battery chemistry|Battery format|Energy capacity|LiFePO4|Server rack|16 kWh/);
 }
});
test('late target evidence cannot bypass foreign selection, explicit owner role, duplicates or prior old-category evidence',async()=>{
 const row=fixtures.approved.find(r=>r.destination.category==='kits')!,p=row.product,projected={...p,category:'kits' as const,specs:{...p.specs,...row.destination.specs}},target=targetEvidence(projected,'contents','Target fixture must not leak');
 const foreign={...p,offers:p.offers.map(o=>({...o,sku:'foreign',packQuantity:3}))};
 const owner=[{id:p.id,json:JSON.stringify({specs:{kitType:'Owner package'}})}];
 for(const db of [database([foreign]),database([p],owner),database([p,structuredClone(p)])]){const result=await readCatalog(db as unknown as D1Database,empty,{[p.id]:target});assert.equal(result.products[0].specification,undefined);}
 const old=targetEvidence(p,'dimensions','Prior immutable dimension'),prior={...p,specification:old};
 for(const db of [snapshotDB,database([prior]) as unknown as D1Database]){const result=await readCatalog(db,{...empty,products:[prior]},{[p.id]:target});assert.equal(result.products[0].category,'batteries');assert.deepEqual(result.products[0].specification,old);}
 const duplicateSnapshot=await readCatalog(snapshotDB,{...empty,products:[p,structuredClone(p)]},{[p.id]:target});assert.ok(duplicateSnapshot.products.every(p=>!p.specification&&p.category==='batteries'));
 const foreignSnapshot=await readCatalog(snapshotDB,{...empty,products:[foreign]},{[p.id]:target});assert.equal(foreignSnapshot.products[0].specification,undefined);
});
test('target evidence on already projected metadata still requires final selection and duplicate guards',async()=>{
 const row=fixtures.approved.find(r=>r.destination.category==='kits')!,p={...row.product,category:'kits' as const,specs:{...row.product.specs,...row.destination.specs}},target=targetEvidence(p,'contents','Already-projected target fixture must not leak'),foreign={...p,offers:p.offers.map(o=>({...o,sku:'foreign'}))};
 for(const db of [snapshotDB,database([foreign]) as unknown as D1Database]){const result=await readCatalog(db,{...empty,products:[foreign]},{[p.id]:target});assert.equal(result.products[0].specification,undefined);}
 for(const db of [snapshotDB,database([p,structuredClone(p)]) as unknown as D1Database]){const result=await readCatalog(db,{...empty,products:[p,structuredClone(p)]},{[p.id]:target});assert.ok(result.products.every(p=>p.specification===undefined));}
});
