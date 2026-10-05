import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Build} from '../lib/types.ts';
const draft:Build={id:'account-id',shareId:'private-link',name:'Cabin',lines:[{productId:'panel',quantity:5,offerId:'retailer'}],settings:{purpose:'offgrid',mount:'ground',series:5,minimumTemperature:-10}};
test('device saves update one named build, while save-as creates an independent copy',async()=>{
 const {saveDeviceBuild,readDeviceBuilds}=await import('../lib/build-library.ts');
 const first=saveDeviceBuild([],draft,'device:first','2026-10-04T20:00:00Z');
 assert.equal(first.length,1);assert.equal(first[0].id,'device:first');assert.equal(first[0].shareId,undefined);
 const changed={...first[0],name:'Cabin winter',lines:[{...first[0].lines[0],quantity:10}]};
 const updated=saveDeviceBuild(first,changed,'device:first','2026-10-04T21:00:00Z');
 assert.equal(updated.length,1);assert.equal(updated[0].lines[0].quantity,10);assert.equal(first[0].lines[0].quantity,5);
 const copied=saveDeviceBuild(updated,{...changed,name:'Garage'},'device:second','2026-10-04T22:00:00Z');
 assert.equal(copied.length,2);assert.equal(copied[1].name,'Cabin winter');
 assert.deepEqual(readDeviceBuilds(JSON.stringify(copied)),copied);
 assert.throws(()=>readDeviceBuilds('{broken'),/saved builds/i);
 assert.throws(()=>saveDeviceBuild(copied,{...draft,name:'   '},'device:third','now'),/name/i);
});
test('opening a community copy removes all source identity and sharing fields but preserves settings and quantities',async()=>{
 const {copyBuild}=await import('../lib/build-library.ts');
 const copy=copyBuild({...draft,name:'Community cabin'});
 assert.equal(copy.id,undefined);assert.equal(copy.shareId,undefined);
 assert.deepEqual(copy.lines,draft.lines);assert.deepEqual(copy.settings,draft.settings);
 copy.lines[0].quantity=2;copy.settings.mount='roof';
 assert.equal(draft.lines[0].quantity,5);assert.equal(draft.settings.mount,'ground');
});
test('switching protects named empty drafts and preserves newly saved contents when reopening the same ID',async()=>{
 const {buildSwitchNeedsConfirmation,targetAfterBuildSave}=await import('../lib/build-library.ts');
 const empty:Build={name:'My solar build',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
 assert.equal(buildSwitchNeedsConfirmation(empty,empty),false);
 assert.equal(buildSwitchNeedsConfirmation({...empty,name:'Future cabin'},empty),true);
 assert.equal(buildSwitchNeedsConfirmation({...empty,settings:{purpose:'hybrid',mount:'roof'}},empty),true);
 const edited={...draft,lines:[{...draft.lines[0],quantity:10}]};
 assert.equal(buildSwitchNeedsConfirmation(edited,draft),true);
 assert.equal(targetAfterBuildSave(edited,draft,'account-id',false).lines[0].quantity,10);
 assert.equal(targetAfterBuildSave(edited,draft,'account-id',true).lines[0].quantity,5);
 assert.equal(targetAfterBuildSave(edited,empty,'account-id',false).lines.length,0);
});
test('an in-flight save retains current edits and attaches its identity only to the same draft',async()=>{
 const {applySavedBuildIdentity}=await import('../lib/build-library.ts');
 const unsaved={...draft,id:undefined},edited={...unsaved,name:'Newest edit',lines:[{...draft.lines[0],quantity:12}]};
 const saved={...unsaved,id:'new-account-id'};
 const result=applySavedBuildIdentity(edited,unsaved,saved);
 assert.equal(result.id,'new-account-id');assert.equal(result.name,'Newest edit');assert.equal(result.lines[0].quantity,12);
 assert.equal(applySavedBuildIdentity({...draft,id:'different-build'},unsaved,saved).id,'different-build');
});
