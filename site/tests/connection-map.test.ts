import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBuild} from '../lib/domain.ts';
import type {Build,Product} from '../lib/types.ts';
import {copyBuild,readDeviceBuilds,saveDeviceBuild} from '../lib/build-library.ts';

const source='https://example.com/datasheet.pdf';
function part(id:string,category:Product['category'],values:Record<string,string>):Product{
 return {id,name:id,brand:'Example',category,description:'',image:'',images:[],sourceUrl:source,verifiedAt:'',specs:{},offers:[],specification:{summary:'',notes:[],sources:[{url:source,kind:'datasheet',label:'Sheet'}],groups:[{title:'Ratings',fields:Object.entries(values).map(([key,value])=>({key,label:key,value,source,kind:'datasheet'}))}]}};
}
const panel=part('panel','panels',{voc:'40 V',vmp:'32 V',imp:'10 A',isc:'11 A',watts:'320 W',vocTemperatureCoefficient:'-0.25 %/°C',vmpTemperatureCoefficient:'-0.3 %/°C',maxSystemVoltage:'1000 V'});
const inverter=part('inverter','inverters',{mpptCount:'3',maxPvVoltage:'600 V',mpptVoltageRange:'140–500 V',maxMpptCurrent:'25 A / 15 A / 15 A',maxPvIsc:'31 A / 19 A / 19 A',inputsPerMppt:'2 / 1 / 1',batteryVoltageRange:'40–60 V',maxPvWatts:'18000 W'});
const battery=part('battery','batteries',{voltage:'51.2 V',operatingVoltage:'44.8–57.6 V'});
const array={id:'a',panelId:'panel',receiverId:'inverter',receiverUnit:1,tracker:1,series:8,parallel:2,batteryId:'battery'};
const build:Build={name:'Test',lines:[{productId:'panel',quantity:16},{productId:'inverter',quantity:1},{productId:'battery',quantity:2}],settings:{purpose:'hybrid',mount:'roof',minimumTemperature:-10,maximumCellTemperature:70,pvArrays:[array]}};
async function api(){const module=await import('../lib/connection-map.ts').catch(()=>null);assert.ok(module,'The connection calculation engine must exist');return module;}

test('build save/reopen preserves bounded per-tracker assignments and temperature assumptions',()=>{
 const restored=validateBuild({...build,settings:{...build.settings,extra:'discard',pvArrays:[{...array,extra:'discard'}]}});
 assert.deepEqual(restored.settings.pvArrays,[array]);assert.equal(restored.settings.maximumCellTemperature,70);
 for(const row of [{...array,series:1.5},{...array,receiverUnit:0},{...array,tracker:201},{...array,id:''}])assert.throws(()=>validateBuild({...build,settings:{...build.settings,pvArrays:[row]}}));
 assert.throws(()=>validateBuild({...build,settings:{...build.settings,pvArrays:[array,array]}}));
});
test('saved builds and opened copies retain connection assignments independently',()=>{
 const stored=saveDeviceBuild([],build,'device:connections','2026-10-06T00:00:00Z'),opened=copyBuild(readDeviceBuilds(JSON.stringify(stored))[0]);
 assert.deepEqual(opened.settings.pvArrays,[array]);opened.settings.pvArrays![0].series=4;
 assert.equal(stored[0].settings.pvArrays![0].series,8);
});
test('per-tracker currents are parsed separately and string arithmetic does not multiply voltage in parallel',async()=>{
 const {connectionMap,receiverLimits}=await api();
 assert.equal(receiverLimits(inverter,2).imp,15);assert.equal(receiverLimits(inverter,1).imp,25);
 const row=connectionMap(build,[panel,inverter,battery]).arrays[0];
 assert.equal(row.values.vmp,256);assert.equal(row.values.imp,20);assert.equal(row.values.isc,22);assert.equal(row.values.watts,5120);assert.equal(row.values.coldVoc,348);assert.equal(row.values.hotVmp,221.44);
 assert.equal(row.checks.find(x=>x.key==='imp')?.status,'match');assert.equal(row.batteryChecks.find(x=>x.key==='batteryRange')?.status,'match');
});
test('moving a string to a smaller MPPT reveals current and parallel-input mismatches',async()=>{
 const {connectionMap}=await api();const row=connectionMap({...build,settings:{...build.settings,pvArrays:[{...array,tracker:2}]}},[panel,inverter,battery]).arrays[0];
 assert.equal(row.checks.find(x=>x.key==='imp')?.status,'mismatch');assert.equal(row.checks.find(x=>x.key==='isc')?.status,'mismatch');assert.equal(row.checks.find(x=>x.key==='ports')?.status,'mismatch');
});
test('cold overvoltage, missing coefficients, and listing estimates never become a documented pass',async()=>{
 const {connectionMap}=await api();const row=connectionMap({...build,lines:[{productId:'panel',quantity:30},{productId:'inverter',quantity:1}],settings:{...build.settings,pvArrays:[{...array,series:15,parallel:2}]}},[panel,inverter]).arrays[0];
 assert.equal(row.checks.find(x=>x.key==='coldVoc')?.status,'mismatch');
 const unverified={...panel,specification:undefined,specs:{voc:40,vmp:32,imp:10,isc:11,vocTempCoefficient:-.25}};
 const unknown=connectionMap(build,[unverified,inverter,battery]).arrays[0];assert.equal(unknown.values.vmp,undefined);assert.equal(unknown.checks.find(x=>x.key==='coldVoc')?.status,'unknown');
});
test('allocation counts all arrays and rejects reused inputs, missing equipment and over-allocation',async()=>{
 const {connectionMap}=await api();
 const map=connectionMap({...build,settings:{...build.settings,pvArrays:[array,{...array,id:'b'}]}},[panel,inverter,battery]);
 assert.equal(map.allocations[0].status,'mismatch');assert.ok(map.arrays.every(x=>x.checks.some(c=>c.key==='assignment'&&c.status==='mismatch')));
 const gone=connectionMap(build,[panel,battery]);assert.equal(gone.arrays[0].checks.find(c=>c.key==='assignment')?.status,'mismatch');
});
test('automatic sizing uses available panels and that MPPT limits, and refuses unverified inputs',async()=>{
 const {suggestArray,connectionMap}=await api();const suggestion=suggestArray(build,[panel,inverter,battery],{...array,tracker:2});
 assert.ok(suggestion.layout);assert.equal(suggestion.layout!.series,13);assert.equal(suggestion.layout!.parallel,1);assert.equal(suggestion.unused,3);
 const result=connectionMap({...build,settings:{...build.settings,pvArrays:[{...array,...suggestion.layout,tracker:2}]}},[panel,inverter,battery]);assert.ok(!result.arrays[0].checks.some(c=>c.status==='mismatch'));
 const missing=suggestArray({...build,settings:{...build.settings,minimumTemperature:undefined}},[panel,inverter,battery],array);assert.equal(missing.layout,undefined);
});
test('battery operating envelope is checked independently from nominal class; proprietary station ports remain unknown',async()=>{
 const {connectionMap}=await api();const bad=part('battery','batteries',{voltage:'12.8 V',operatingVoltage:'10–14.6 V'});
 assert.equal(connectionMap(build,[panel,inverter,bad]).arrays[0].batteryChecks.find(x=>x.key==='batteryRange')?.status,'mismatch');
 const station={...inverter,category:'all-in-one' as const};assert.ok(connectionMap(build,[panel,station,battery]).arrays[0].batteryChecks.every(c=>c.status==='unknown'));
});
test('ambiguous aggregate current is not reused on each of multiple trackers',async()=>{
 const {receiverLimits}=await api();const ambiguous=part('receiver','inverters',{mpptCount:'3',maxMpptCurrent:'30 A',maxPvIsc:'40 A'});
 assert.equal(receiverLimits(ambiguous,1).imp,undefined);assert.equal(receiverLimits(ambiguous,2).isc,undefined);
});
test('documented chemistry-specific battery ranges use the selected chemistry',async()=>{
 const {connectionMap}=await api();const receiver=part('inverter','inverters',{batteryVoltageRangeLithium:'46.4–60 V',batteryVoltageRangeLeadAcid:'38.4–60 V'});
 const lead=part('battery','batteries',{chemistry:'Lead-acid',voltage:'48 V',operatingVoltage:'42–58 V'});
 assert.equal(connectionMap(build,[panel,receiver,lead]).arrays[0].batteryChecks.find(c=>c.key==='batteryRange')?.status,'match');
 const lithium=part('battery','batteries',{chemistry:'LiFePO4',voltage:'51.2 V',operatingVoltage:'44.8–57.6 V'});
 assert.equal(connectionMap(build,[panel,receiver,lithium]).arrays[0].batteryChecks.find(c=>c.key==='batteryRange')?.status,'mismatch');
});
test('selected-product transport retains sourced calculation fields without full sheets or estimates',async()=>{
 const {connectionEvidence,connectionMap,connectionRequest}=await api();
 const compact=[panel,inverter,battery].map(p=>({...p,specification:undefined,connectionSpecs:connectionEvidence(p)}));
 assert.equal(connectionMap(build,compact).arrays[0].values.coldVoc,348);
 assert.equal(connectionMap(build,compact).arrays[0].limits.imp,25);
 assert.equal(connectionMap(build,compact).arrays[0].batteryChecks.find(c=>c.key==='batteryRange')?.status,'match');
 assert.deepEqual(connectionEvidence({...panel,specification:undefined}),{});
 assert.deepEqual(connectionRequest({productIds:['panel']}),['panel']);
 for(const ids of [['a','a'],Array(101).fill('a'),[null],['']])assert.throws(()=>connectionRequest({productIds:ids}));
});
