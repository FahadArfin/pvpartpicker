import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate, calculatorDefinitions,type Values} from '../lib/guide-calculators.ts';
test('all nine Solar4U tools calculate finite defaults',()=>{
 assert.equal(calculatorDefinitions.length,9);
 for(const d of calculatorDefinitions){const r=calculate(d.id,d.defaults);assert.ok(r.stats.length>0);assert.ok(!JSON.stringify(r).includes('NaN'));}
});
test('adapted lessons preserve readable math and temperature notation',()=>{
 const text=readFileSync(new URL('../data/guide-foundations.json',import.meta.url),'utf8');
 assert.doesNotMatch(text,/âˆ|Ã—|Ã·|Â°|â‰/);
 assert.ok(text.includes('175.68 V'));
 assert.ok(text.includes('25°C'));
});
test('battery handles zero load and zero energy honestly',()=>{
 const v=calculatorDefinitions.find(d=>d.id==='battery')!.defaults;
 assert.equal(calculate('battery',{...v,loadWatts:0}).raw.runtimeHours,null);
 assert.equal(calculate('battery',{...v,capacityKwh:0}).raw.runtimeHours,0);
 assert.equal(calculate('battery',{...v,capacityKwh:5.12,loadWatts:500,depthOfDischargePercent:90,efficiencyPercent:90}).raw.runtimeHours,8.294400000000001);
});
test('rejects blank, nonfinite, out of range and fractional module inputs',()=>{
 const v=calculatorDefinitions.find(d=>d.id==='array')!.defaults;
 const cases:Values[]=[{seriesCount:1.5},{panelVoc:NaN},{panelVoc:0},{panelVoc:10,panelVmp:40},{panelIsc:1,panelImp:5}];
 for(const changes of cases)assert.throws(()=>calculate('array',{...v,...changes}));
 assert.throws(()=>calculate('battery',{loadWatts:500}));
});
test('cold voltage uses full strings and an absolute input limit cannot pass',()=>{
 const d=calculatorDefinitions.find(d=>d.id==='array')!;
 assert.ok(Math.abs(Number(calculate('array',{...d.defaults,panelVoc:50,seriesCount:3,minimumTempC:-15,tempCoefficientPercent:-0.3}).raw.coldVoc)-168)<1e-9);
 const c=calculatorDefinitions.find(d=>d.id==='controller')!;
 const r=calculate('controller',{...c.defaults,panelVoc:50,seriesCount:3,minimumTempC:25});
 assert.equal(r.controllers?.find(c=>c.model==='SmartSolar MPPT 150/45')?.preliminaryMatch,false);
});
test('cable returns no candidate when example catalog cannot meet constraints',()=>{
 const d=calculatorDefinitions.find(d=>d.id==='cable')!;
 assert.equal(calculate('cable',{...d.defaults,currentA:1000}).raw.gauge,null);
});
test('cash-flow break-even label describes the escalated scenario, not a simple ratio',()=>{
 const d=calculatorDefinitions.find(d=>d.id==='payback')!;
 const r=calculate('payback',d.defaults);
 assert.equal(r.stats.find(s=>s.label==='Modeled break-even year')?.value,'14 years');
 assert.ok(Number(r.raw.netCost)/Number(r.raw.firstYearSavings)>15);
});
test('TOU rejects contradictory shares and preserves negative savings',()=>{
 const d=calculatorDefinitions.find(d=>d.id==='tou')!;
 assert.throws(()=>calculate('tou',{...d.defaults,onPeakSharePercent:70,midPeakSharePercent:50}));
 assert.throws(()=>calculate('tou',{...d.defaults,roundTripEfficiencyPercent:96,dischargeEfficiencyPercent:95}));
 assert.ok(Number(calculate('tou',{...d.defaults,peakRate:0.1,midPeakRate:0.1,offPeakRate:0.5}).raw.dailySavings)<0);
});
test('simplified solar months sum to annual estimate and southern summer shifts',()=>{
 const d=calculatorDefinitions.find(d=>d.id==='pv')!;
 for(const latitude of [40,-40]){const r=calculate('pv',{...d.defaults,latitude,azimuth:latitude>0?180:0});assert.equal(r.monthly!.reduce((a,b)=>a+b,0),r.raw.annualKwh);assert.ok(r.monthly!.every(x=>x>=0));if(latitude>0)assert.ok(r.monthly![6]>r.monthly![0]);else assert.ok(r.monthly![0]>r.monthly![6]);}
});
