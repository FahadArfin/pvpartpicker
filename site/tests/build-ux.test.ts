import test from 'node:test';
import assert from 'node:assert/strict';
import type {Build,Product} from '../lib/types.ts';
import {buildProgress,buildCompatibility,normalizeBuildQuantity,parseStringSetting,restoreBuildDraft,replaceStoredDraft} from '../lib/build-ux.ts';

const build=(purpose:Build['settings']['purpose']='offgrid'):Build=>({name:'Cabin',lines:[],settings:{purpose,mount:'roof'}});
const part=(id:string,category:Product['category'],specs:Product['specs']={}):Product=>({id,name:id,brand:'Example',description:'',image:'',images:[],verifiedAt:'2026-10-05T00:00:00Z',category,specs,offers:[],sourceUrl:'https://example.com/source'});
const panel=part('panel','panels',{voc:40,vocTempCoefficient:-.25,imp:10});
const inverter=part('inverter','inverters',{maxPvVoltage:500,maxMpptCurrent:30});
const stringBuild:Build={...build(),lines:[{productId:'panel',quantity:10},{productId:'inverter',quantity:1}],settings:{...build().settings,series:5,parallel:2,minimumTemperature:-10}};

test('quantity edits normalize to bounded whole units and blank restores the previous quantity',()=>{
 assert.equal(normalizeBuildQuantity('',12),12);assert.equal(normalizeBuildQuantity('3.7',12),4);
 assert.equal(normalizeBuildQuantity('-4',12),1);assert.equal(normalizeBuildQuantity('10001',12),10000);
 assert.equal(normalizeBuildQuantity('not a number',12),12);
});
test('string settings distinguish blank from invalid input before compatibility runs',()=>{
 assert.deepEqual(parseStringSetting('series',''),{});assert.equal(parseStringSetting('series','1.5').value,undefined);
 assert.match(parseStringSetting('series','201').error!,/whole number/);
 assert.deepEqual(parseStringSetting('minimumTemperature','-15.5'),{value:-15.5});
 assert.ok(parseStringSetting('minimumTemperature','-71').error);
});
test('grid-tied progress treats batteries as optional and selects the next missing equipment category',()=>{
 const b={...build('gridtie'),lines:[{productId:'panel',quantity:4}]};
 const progress=buildProgress(b,[panel]);assert.equal(progress.next.category,'inverters');
 assert.equal(progress.stages.find(s=>s.category==='batteries')?.state,'optional');
 assert.match(progress.note,/installation/);
});
test('integrated stations and bundles direct the builder to the equipment actually selected',()=>{
 const station=part('station','all-in-one');const kit=part('kit','kits');
 const integrated=buildProgress({...build(),lines:[{productId:'station',quantity:1}]},[station]);
 assert.equal(integrated.stages[0].category,'all-in-one');assert.ok(!integrated.stages.some(s=>s.category==='batteries'));
 const bundled=buildProgress({...build(),lines:[{productId:'kit',quantity:1}]},[kit]);
 assert.equal(bundled.next.category,undefined);assert.match(bundled.next.detail,/included/);
});
test('insufficient selected panels prevent a hypothetical string from passing',()=>{
 const checks=buildCompatibility({...stringBuild,lines:[{productId:'panel',quantity:1},{productId:'inverter',quantity:1}]},[panel,inverter]);
 assert.ok(checks.some(c=>c.title==='PV panel allocation'&&c.status==='mismatch'));
 assert.ok(!checks.some(c=>['Cold-weather PV voltage','MPPT operating current'].includes(c.title)&&c.status==='match'));
});
test('invalid string settings and multiple panel models remain unverified',()=>{
 for(const b of [{...stringBuild,settings:{...stringBuild.settings,series:1.5}},{...stringBuild,lines:[...stringBuild.lines,{productId:'panel2',quantity:10}]}]){
  const checks=buildCompatibility(b,[panel,inverter,part('panel2','panels',panel.specs)]);
  assert.ok(!checks.some(c=>['Cold-weather PV voltage','MPPT operating current'].includes(c.title)&&c.status==='match'));
  assert.ok(checks.some(c=>c.status==='unknown'));
 }
});
test('one homogeneous planned string arrangement can pass limited arithmetic checks',()=>{
 const checks=buildCompatibility(stringBuild,[panel,inverter]);
 assert.ok(checks.some(c=>c.title==='Cold-weather PV voltage'&&c.status==='match'));
 assert.ok(checks.some(c=>c.title==='PV panel allocation'&&c.detail.includes('per MPPT')));
});
test('hybrid checks reject inverter modes excluded by hybrid picker preferences',()=>{
 const checks=buildCompatibility({...build('hybrid'),lines:[{productId:'grid','quantity':1}]},[part('grid','inverters',{inverterType:'Grid-tie'})]);
 assert.ok(checks.some(c=>c.title==='System purpose'&&c.status==='mismatch'));
});
test('invalid displayed input suppresses string passes even after its stored numeric value is removed',()=>{
 const checks=buildCompatibility({...stringBuild,settings:{...stringBuild.settings,minimumTemperature:undefined}},[panel,inverter],true);
 assert.ok(!checks.some(c=>['Cold-weather PV voltage','MPPT operating current'].includes(c.title)&&c.status==='match'));
});
test('restored drafts validate contents and preserve only known identity fields',()=>{
 const restored=restoreBuildDraft(JSON.stringify({...stringBuild,id:'device:123',shareId:'share123',extra:'discard'}));
 assert.equal(restored.id,'device:123');assert.equal(restored.shareId,'share123');assert.ok(!Object.keys(restored).includes('extra'));
 for(const bad of [{lines:[],settings:{}},{...stringBuild,lines:[null]},{...stringBuild,name:undefined}])assert.throws(()=>restoreBuildDraft(JSON.stringify(bad)),/draft/i);
});
test('an unfinished blank build name restores the equipment with a usable default name',()=>{
 const restored=restoreBuildDraft(JSON.stringify({...stringBuild,name:'   '}));
 assert.equal(restored.name,'My solar build');assert.deepEqual(restored.lines,stringBuild.lines);
});
test('opening a valid replacement archives a corrupt draft and remains reloadable with later edits',()=>{
 const values=new Map([['pvpartpicker-draft','{broken']]);
 const storage={getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 const opened=replaceStoredDraft(storage,stringBuild,true);
 assert.equal(values.get('pvpartpicker-draft-recovery'),'{broken');assert.deepEqual(restoreBuildDraft(values.get('pvpartpicker-draft')!),opened);
 replaceStoredDraft(storage,{...opened,name:'Updated after recovery'});
 assert.equal(restoreBuildDraft(values.get('pvpartpicker-draft')!).name,'Updated after recovery');
});
