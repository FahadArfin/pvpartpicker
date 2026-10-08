import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReadiness,analyticsPrerequisites} from '../lib/build-guidance.ts';
import {builderReturnHref} from '../lib/build-flow.ts';
import {buildProgress} from '../lib/build-ux.ts';
import {categories,type Build} from '../lib/types.ts';
const empty:Build={name:'Draft',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
test('empty builds start neutrally; conflicts, unknowns and confirmed checks remain distinct',()=>{
 assert.equal(buildReadiness(empty,[{title:'Wiring',status:'unknown',detail:''}]).label,'Choose your first component');
 const selected={...empty,lines:[{productId:'p',quantity:1}]};
 const result=buildReadiness(selected,[{title:'A',status:'match',detail:''},{title:'B',status:'unknown',detail:''},{title:'C',status:'mismatch',detail:''}]);
 assert.deepEqual([result.confirmed,result.missing,result.conflicts],[1,1,1]);assert.match(result.label,/conflict/);assert.match(result.detail,/does not establish/);
});
test('progress identifies relevant planning categories and respects grid-tied optional storage',()=>{
 const progress=buildProgress({...empty,settings:{...empty.settings,purpose:'gridtie'}},[]);
 assert.equal(progress.stages.find(s=>s.category==='panels')!.state,'needed');assert.equal(progress.stages.find(s=>s.category==='inverters')!.state,'needed');
 assert.equal(progress.stages.find(s=>s.category==='batteries')!.state,'optional');assert.equal(progress.stages.some(s=>s.category==='charging'),false);
});
test('analytics prerequisites distinguish no equipment, partial capacity, missing prices and overrides',()=>{
 const input={capacityKw:0,capacityComplete:true,hasLocation:false,unpriced:0,hasCostOverride:false,selectionCount:0};
 assert.equal(analyticsPrerequisites(input).filter(p=>p.complete).length,0);
 assert.equal(analyticsPrerequisites({...input,capacityKw:3,capacityComplete:false})[0].complete,false);
 const complete=analyticsPrerequisites({...input,capacityKw:3,hasLocation:true,selectionCount:2});assert.ok(complete.every(p=>p.complete));
 assert.equal(analyticsPrerequisites({...input,selectionCount:2,unpriced:1})[2].complete,false);
 assert.equal(analyticsPrerequisites({...input,hasCostOverride:true})[2].complete,true);
});
test('builder return encodes original selected product identity and equipment tab',()=>{
 const url=new URL(builderReturnHref('panel/pack + 2'),'https://example.com');
 assert.equal(url.pathname,'/build');assert.equal(url.searchParams.get('tab'),'equipment');assert.equal(url.searchParams.get('added'),'panel/pack + 2');
});
