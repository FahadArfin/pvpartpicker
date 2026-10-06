import test from 'node:test';
import assert from 'node:assert/strict';
import type {Build,Product} from '../lib/types.ts';

const build:Build={name:'Cabin power',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
const part=(category:Product['category'],specs:Product['specs']={}):Product=>({id:'part-1',category,specs} as Product);

test('purpose toggles narrow inverters but keep unknown equipment available',async()=>{
 const {matchesBuildPreferences}=await import('../lib/build-flow.ts');
 assert.ok(matchesBuildPreferences(part('inverters',{inverterType:'Off-grid'}),build.settings));
 assert.ok(matchesBuildPreferences(part('inverters',{inverterType:'Hybrid'}),build.settings));
 assert.ok(!matchesBuildPreferences(part('inverters',{inverterType:'Grid-tie'}),build.settings));
 assert.ok(!matchesBuildPreferences(part('inverters',{inverterType:'Microinverter'}),build.settings));
 assert.ok(matchesBuildPreferences(part('inverters'),build.settings));
 assert.ok(matchesBuildPreferences(part('inverters',{inverterType:'Hybrid'}),{purpose:'hybrid',mount:'roof'}));
 assert.ok(!matchesBuildPreferences(part('inverters',{inverterType:'Off-grid'}),{purpose:'hybrid',mount:'roof'}));
 assert.ok(!matchesBuildPreferences(part('inverters',{inverterType:'Grid-tie'}),{purpose:'hybrid',mount:'roof'}));
 assert.ok(matchesBuildPreferences(part('inverters',{inverterType:'Microinverter'}),{purpose:'gridtie',mount:'roof'}));
 assert.ok(matchesBuildPreferences(part('inverters',{inverterType:'Hybrid'}),{purpose:'gridtie',mount:'roof'}));
 assert.ok(!matchesBuildPreferences(part('inverters',{inverterType:'Off-grid'}),{purpose:'gridtie',mount:'roof'}));
});

test('mount toggles exclude the other mount system, not general hardware or other categories',async()=>{
 const {matchesBuildPreferences}=await import('../lib/build-flow.ts');
 assert.ok(matchesBuildPreferences(part('mounting',{mountType:'Roof'}),build.settings));
 assert.ok(!matchesBuildPreferences(part('mounting',{mountType:'Ground'}),build.settings));
 assert.ok(matchesBuildPreferences(part('mounting',{mountType:'Hardware'}),build.settings));
 assert.ok(matchesBuildPreferences(part('mounting'),build.settings));
 assert.ok(matchesBuildPreferences(part('mounting',{mountType:'Ground'}),{purpose:'offgrid',mount:'ground'}));
 assert.ok(matchesBuildPreferences(part('batteries',{formFactor:'Server rack'}),build.settings));
});

test('builder picker links carry the explicit return-to-build context',async()=>{
 const {builderPickerHref}=await import('../lib/build-flow.ts');
 assert.equal(builderPickerHref('panels'),'/parts?category=panels&builder=1');
 assert.equal(builderPickerHref('module-electronics'),'/parts?category=module-electronics&builder=1');
});

test('choosing a part preserves the draft settings and existing selected offer',async()=>{
 const {addBuildPart}=await import('../lib/build-flow.ts');
 const first=addBuildPart(build,'part-1','offer-1');
 assert.deepEqual(first.lines,[{productId:'part-1',quantity:1,offerId:'offer-1'}]);
 assert.equal(first.name,'Cabin power');assert.deepEqual(first.settings,build.settings);
 assert.deepEqual(build.lines,[]);
 const second=addBuildPart(first,'part-1');
 assert.deepEqual(second.lines,[{productId:'part-1',quantity:2,offerId:'offer-1'}]);
 assert.equal(first.lines[0].quantity,1);
 const full=addBuildPart({...build,lines:[{productId:'part-1',quantity:10000,offerId:'offer-1'}]},'part-1');
 assert.equal(full.lines[0].quantity,10000);
});
