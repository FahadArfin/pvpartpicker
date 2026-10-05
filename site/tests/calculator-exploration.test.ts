import test from 'node:test';
import assert from 'node:assert/strict';
import {conductorComparison,conductorResistance} from '../lib/calculator-exploration.ts';
import {solarProduction,pvgisUrl,readClimate,searchLocations} from '../lib/solar-production.ts';
import {calculatorDefinitions} from '../lib/guide-calculators.ts';
const pv=calculatorDefinitions.find(d=>d.id==='pv')!.defaults;
test('conductor comparison doubles one-way length and inverts the drop-current relationship',()=>{
 const a=conductorComparison({voltage:48,currentA:30,targetPercent:2,temperatureC:25,material:'copper',lengths:[25,50]});
 const row=a.find(r=>r.gauge==='6 AWG')!;
 assert.equal(row.resistance,0.411);
 assert.ok(Math.abs(row.cells[1].dropVolts-1.233)<1e-10);
 assert.equal(row.cells[0].maxCurrentA,row.cells[1].maxCurrentA*2);
 assert.ok(row.cells[0].withinTarget);assert.ok(!row.cells[1].withinTarget);
});
test('temperature and aluminum raise resistance; invalid and zero-length comparisons reject',()=>{
 assert.ok(conductorResistance('6 AWG','copper',75)>conductorResistance('6 AWG','copper',25));
 assert.ok(conductorResistance('6 AWG','aluminum',25)>conductorResistance('6 AWG','copper',25));
 assert.throws(()=>conductorComparison({voltage:0,currentA:30,targetPercent:2,temperatureC:25,material:'copper',lengths:[25]}));
 assert.throws(()=>conductorComparison({voltage:48,currentA:30,targetPercent:2,temperatureC:25,material:'copper',lengths:[0]}));
});
test('separate roof faces sum exactly, and usage offset is energy rather than bill savings',()=>{
 const arrays=[{capacityKw:4,tilt:30,azimuth:90},{capacityKw:6,tilt:30,azimuth:270}];
 const r=solarProduction({...pv,annualUsageKwh:50000},arrays);
 const expected=arrays.reduce((s,a)=>s+Number(solarProduction({...pv,...a}).raw.annualKwh),0);
 assert.equal(r.raw.annualKwh,expected);assert.equal(r.monthly!.reduce((s,x)=>s+x,0),expected);
 assert.ok(Number(r.raw.energyOffsetPercent)<100);assert.throws(()=>solarProduction(pv,[]));
});
test('PVGIS request maps compass azimuth and validates every monthly value',async()=>{
 assert.equal(pvgisUrl({...pv,azimuth:90}).searchParams.get('aspect'),'-90');
 assert.equal(pvgisUrl({...pv,azimuth:360}).searchParams.get('aspect'),'-180');
 const rows=Array.from({length:12},(_,i)=>({month:i+1,E_m:i+100}));
 const mock=async()=>Response.json({outputs:{monthly:{fixed:rows}}});
 const r=await readClimate(pv,undefined,mock as typeof fetch);assert.equal(r.monthly!.length,12);assert.equal(r.raw.annualKwh,1266);
 await assert.rejects(()=>readClimate(pv,undefined,(async()=>Response.json({outputs:{monthly:{fixed:rows.map(r=>({...r,E_m:-1}))}}})) as typeof fetch));
 await assert.rejects(()=>readClimate(pv,undefined,(async()=>new Response('',{status:429})) as typeof fetch));
});
test('invalid arrays reject before any provider request and location results are bounded',async()=>{
 let calls=0;const mock=async()=>{calls++;return Response.json({results:[]});};
 await assert.rejects(()=>readClimate(pv,[{capacityKw:-1,tilt:30,azimuth:180}],mock as typeof fetch));assert.equal(calls,0);
 await assert.rejects(()=>searchLocations('a',mock as typeof fetch));
 assert.deepEqual(await searchLocations('Buffalo',mock as typeof fetch),[]);
});
test('roof faces accept precise geometry and reject incomplete or overriding input',()=>{
 assert.ok(Number(solarProduction(pv,[{capacityKw:4.2,tilt:30.5,azimuth:180.3}]).raw.annualKwh)>0);
 for(const faces of [[null],[{}],[1],[{capacityKw:4,tilt:30,azimuth:180,latitude:-40}]])assert.throws(()=>solarProduction(pv,faces as never));
});
test('overflow-sized provider energy cannot become a displayed or exported result',async()=>{
 const rows=Array.from({length:12},(_,i)=>({month:i+1,E_m:1e308}));
 await assert.rejects(()=>readClimate(pv,undefined,(async()=>Response.json({outputs:{monthly:{fixed:rows}}})) as typeof fetch));
});
test('zero annual use omits the energy comparison and impractically tiny use is rejected',()=>{
 assert.equal(solarProduction({...pv,annualUsageKwh:0}).raw.energyOffsetPercent,null);
 assert.throws(()=>solarProduction({...pv,annualUsageKwh:1e-308}));
});
