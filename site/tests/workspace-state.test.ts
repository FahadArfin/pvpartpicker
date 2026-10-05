import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import type {Build} from '../lib/types.ts';

// Compile the real TSX modules for their pure exports. UI imports remain inert;
// these checks exercise state transitions rather than duplicated markup.
function stateExports<T>(file:string):T{
 const source=readFileSync(new URL('../components/'+file,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports:Record<string,unknown>={};
 runInNewContext(code,{exports,require:()=>({})},{filename:file});
 return exports as T;
}

test('deleting the saved current build drops its identity while preserving draft edits',()=>{
 const {draftAfterSavedBuildDeletion}=stateExports<{draftAfterSavedBuildDeletion:(build:Build,id:string)=>Build}>('account-workspace.tsx');
 const draft:Build={id:'saved-a',shareId:'shared-a',name:'Edited cabin',lines:[{productId:'panel',quantity:7}],settings:{purpose:'offgrid',mount:'ground'}};
 const next=draftAfterSavedBuildDeletion(draft,'saved-a');
 assert.equal(next.id,undefined);assert.equal(next.shareId,undefined);
 assert.equal(next.name,draft.name);assert.equal(next.lines,draft.lines);assert.equal(next.settings,draft.settings);
 assert.equal(draft.id,'saved-a');
 assert.equal(draftAfterSavedBuildDeletion(draft,'saved-b'),draft);
});

test('source details stay hidden until they belong to the selected retailer',()=>{
 const {detailForSelectedSource}=stateExports<{detailForSelectedSource:<T>(selected:string,loaded:string,detail:T)=>T|null}>('scraper-workspace.tsx');
 const detail={targets:[{name:'Retailer A panel'}],observations:[]};
 assert.equal(detailForSelectedSource('retailer-b','retailer-a',detail),null);
 assert.equal(detailForSelectedSource('retailer-a','retailer-a',detail),detail);
 assert.equal(detailForSelectedSource('','',detail),null);
});

test('run filters select the displayed collection including a genuinely empty result',()=>{
 const {filterScraperRuns}=stateExports<{filterScraperRuns:<T extends {siteId:string}>(jobs:T[],source:string)=>T[]}>('scraper-workspace.tsx');
 const jobs=[{id:'first',siteId:'a'},{id:'second',siteId:'b'}];
 assert.equal(filterScraperRuns(jobs,'all'),jobs);
 assert.deepEqual(Array.from(filterScraperRuns(jobs,'a')), [jobs[0]]);
 assert.equal(filterScraperRuns(jobs,'missing').length,0);
 assert.equal(jobs.length,2);
});
