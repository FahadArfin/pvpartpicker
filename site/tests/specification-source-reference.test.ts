import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as specifications from '../lib/specifications.ts';
import type {Product} from '../lib/types.ts';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(fs.readFileSync(new URL('../components/product-specifications.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const component={exports:{} as {ProductSpecifications:React.ComponentType<{product:Product}>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/specifications'?specifications:require(id),component,component.exports);
const url='https://example.com/exact-model';
const product={id:'source-reference-fixture',name:'Source reference fixture',brand:'Fixture',description:'Test-only source citation fixture',image:'',images:[],verifiedAt:'2026-10-13T00:00:00Z',category:'batteries',specs:{},offers:[],sourceUrl:url,specification:{summary:'Fixture',notes:[],sources:[{url,kind:'listing',label:'Listing identity'},{url,kind:'retailer',label:'Technical specifications'}],groups:[{title:'Ratings',fields:[{key:'model',label:'Model',value:'Selected fixture',source:url,kind:'listing'},{key:'cycleLife',label:'Cycle life',value:'500 cycles at stated conditions',source:url,kind:'retailer'}]}]}} as Product;
const render=(p:Product)=>renderToStaticMarkup(React.createElement(component.exports.ProductSpecifications,{product:p}));
test('same URL keeps listing and technical field citations distinct',()=>{
 const html=render(product);
 assert.match(html,/Selected fixture <a[^>]*href="#spec-source-1"/);
 assert.match(html,/500 cycles at stated conditions <a[^>]*href="#spec-source-2"/);
});
test('missing exact source kind must not misattribute a technical field to listing evidence',()=>{
 const p=structuredClone(product);p.specification!.sources=p.specification!.sources.slice(0,1);
 assert.doesNotMatch(render(p),/500 cycles at stated conditions <a/);
});
test('untyped panel citations prefer technical evidence over a same-URL listing',()=>{
 const p=structuredClone(product);p.category='panels';p.specification!.panelRatings={stc:{pmax:'123 W'},noct:{},sources:{'stc.pmax':url}};
 assert.match(render(p),/123 W <a[^>]*href="#spec-source-2"/);
});

