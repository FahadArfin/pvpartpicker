import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as specifications from '../lib/specifications.ts';
import * as comparison from '../lib/part-comparison.ts';
import * as bundles from '../lib/bundles.ts';
import * as ux from '../lib/ux-product.ts';
import * as domain from '../lib/domain.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';

const require=createRequire(import.meta.url);
const code=ts.transpileModule(fs.readFileSync(new URL('../components/product-specifications.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{} as {ProductSpecifications:React.ComponentType<{product:Product}>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/specifications'?specifications:require(id),module,module.exports);
const manual='https://manufacturer.example/MSK-90-manual.pdf';
const product:Product={id:'exact-kit',name:'MSK-90',brand:'Samlex',category:'kits',sourceUrl:'https://retailer.example/msk-90',description:'',specs:{kitType:'Portable kit'},image:'',images:[],offers:[],verifiedAt:''};
const evidence:ProductSpecification={summary:'Portable kit',groups:[{title:'Package contents',fields:[{key:'contents',label:'Included components',value:'Three folding modules, controller and fused battery cable. Battery excluded.',source:manual,kind:'manual'}]},{title:'Old component ratings',fields:[{key:'outputWatts',label:'Output power',value:'98765 W',source:manual,kind:'manual'}]}],sources:[{url:manual,kind:'manual',label:'Manufacturer kit manual'}],notes:[],identity:{name:'MSK-90',sourceUrl:product.sourceUrl,category:'kits',anchors:{kitType:'Portable kit'}}};
const render=(p:Product)=>renderToStaticMarkup(React.createElement(module.exports.ProductSpecifications,{product:p}));

test('kit detail renders exact reviewed contents with its manual without treating component power as a whole kit rating',()=>{
 const html=render({...product,specification:evidence});
 assert.match(html,/Three folding modules, controller and fused battery cable/);
 assert.match(html,/Manufacturer kit manual/);
 assert.match(html,/https:\/\/manufacturer\.example\/MSK-90-manual\.pdf/);
 assert.doesNotMatch(html,/98765/);
 assert.doesNotMatch(html,/Output power/);
});
test('kit detail does not display dormant contents after the selected variant changes',()=>{
 const html=render({...product,name:'Different kit',sourceUrl:'https://retailer.example/different-kit',specification:evidence});
 assert.doesNotMatch(html,/Three folding modules/);
 assert.doesNotMatch(html,/Manufacturer kit manual/);
});
test('kit detail never promotes inherited station or panel scalar fields to whole package ratings',()=>{
 const html=render({...product,specs:{...product.specs,outputWatts:98765,voltage:51.2,capacityKwh:13.37,watts:54321},specification:evidence});
 assert.match(html,/Three folding modules/);
 for(const value of ['98765','51.2','13.37','54321'])assert.ok(!html.includes(value));
});
test('unbound historical kit evidence cannot display component or package claims',()=>{
 const {identity,...unbound}=evidence;
 const html=render({...product,specification:unbound});
 assert.doesNotMatch(html,/Three folding modules|98765|Manufacturer kit manual/);
});

const bundleCode=ts.transpileModule(fs.readFileSync(new URL('../components/bundle-presentation.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const bundleModule={exports:{} as {BundleContents:React.ComponentType<{product:Product}>}};
const inertImports:Record<string,unknown>={'./pv-provider':{},'next/navigation':{},'../lib/page-navigation':{},'./site-link':{default:'a'},'../lib/specifications':specifications,'../lib/part-comparison':comparison,'../lib/bundles':bundles,'../lib/ux-product':ux,'../lib/domain':domain};
new Function('require','module','exports',bundleCode)((id:string)=>id in inertImports?inertImports[id]:require(id),bundleModule,bundleModule.exports);
test('bundle contents shows reviewed manufacturer contents when retailer parsing has no component list',()=>{
 const selected={...product,specification:evidence,configuration:{kind:'combo' as const,title:'Portable kit',family:'MSK',selection:'MSK-90',type:'Portable kit',components:[]}};
 const html=renderToStaticMarkup(React.createElement(bundleModule.exports.BundleContents,{product:selected}));
 assert.match(html,/Three folding modules, controller and fused battery cable/);
 assert.match(html,/https:\/\/manufacturer\.example\/MSK-90-manual\.pdf/);
 assert.doesNotMatch(html,/component list has not been published/);
 assert.doesNotMatch(html,/98765/);
});
