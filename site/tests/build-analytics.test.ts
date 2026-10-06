import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Build,Product} from '../lib/types.ts';
import {analyticsDefaults,buildAnalyticsInputs,analyticsFinancials,validateAnalytics,publicBuildCopy} from '../lib/build-analytics.ts';
import {validateBuild} from '../lib/domain.ts';
const build:Build={name:'Test roof',lines:[{productId:'panel',quantity:5},{productId:'battery',quantity:1}],settings:{purpose:'hybrid',mount:'roof'}};
const now=Date.parse('2026-10-06T12:00:00Z');
const products=[{id:'panel',category:'panels',specs:{watts:400},offers:[{id:'pack',currency:'USD',stock:'in_stock',observedAt:new Date(now).toISOString(),price:900,packQuantity:4}]},{id:'battery',category:'batteries',specs:{capacityKwh:5},offers:[]}] as unknown as Product[];
test('analytics follows unit quantities, rounds pack purchases and flags unpriced or ambiguous bundles',()=>{
 const inputs=buildAnalyticsInputs(build,products,now);
 assert.equal(inputs.capacityKw,2);assert.equal(inputs.equipmentCost,1800);assert.equal(inputs.unpriced,1);
 assert.equal(buildAnalyticsInputs({...build,lines:[{productId:'panel',quantity:10}]},products,now).capacityKw,4);
 const bundle={id:'kit',category:'kits',specs:{watts:5000},offers:[]} as unknown as Product;
 const missing=buildAnalyticsInputs({...build,lines:[{productId:'kit',quantity:1}]},[bundle],now);
 assert.equal(missing.capacityKw,0);assert.equal(missing.unknownSolar.length,1);
 assert.equal(missing.capacityComplete,false);
 const partial={...build,lines:[{productId:'panel',quantity:10},{productId:'kit',quantity:1}]};
 assert.equal(buildAnalyticsInputs(partial,[...products,bundle],now).capacityComplete,false);
 assert.equal(buildAnalyticsInputs({...partial,settings:{...partial.settings,analytics:{...analyticsDefaults,capacityOverrideKw:6}}},[...products,bundle],now).capacityComplete,true);
 assert.equal(buildAnalyticsInputs({...build,lines:[...build.lines,{productId:'unavailable',quantity:1}]},products,now).capacityComplete,false);
});
test('monthly savings value self-consumption and exports separately, capped by load',()=>{
 const settings={...analyticsDefaults,annualUsageKwh:1200,selfConsumptionPercent:50,electricityRate:.2,exportRate:.05,additionalCost:200,incentive:100,annualMaintenance:10,rateEscalationPercent:0,degradationPercent:0,discountPercent:0};
 const report=analyticsFinancials(Array(12).fill(200),settings,1000,true,'hybrid');
 assert.equal(report.annualKwh,2400);assert.equal(report.usedKwh,1200);assert.equal(report.exportedKwh,1200);
 assert.equal(report.annualSavings,300);assert.equal(report.netCost,1100);assert.equal(report.simplePayback,1100/290);
 assert.equal(report.cashFlow[24].cumulative,6150);assert.equal(report.npv,6150);
 const offgrid=analyticsFinancials(Array(12).fill(200),settings,1000,true,'offgrid');assert.equal(offgrid.annualSavings,240);
 const capped=analyticsFinancials(Array(12).fill(200),{...settings,selfConsumptionPercent:100},1000,true,'gridtie');assert.equal(capped.usedKwh,1200);
});
test('unknown costs, zero use, zero rate and negative returns do not invent a payback',()=>{
 const noCost=analyticsFinancials(Array(12).fill(100),analyticsDefaults,500,false,'hybrid');assert.equal(noCost.simplePayback,null);assert.equal(noCost.netCost,null);
 const override=analyticsFinancials(Array(12).fill(100),{...analyticsDefaults,totalCostOverride:2000},500,false,'hybrid');assert.equal(override.netCost,2000);
 const zero=analyticsFinancials(Array(12).fill(0),{...analyticsDefaults,annualUsageKwh:0,electricityRate:0},1000,true,'hybrid');assert.equal(zero.simplePayback,null);assert.equal(zero.energyOffsetPercent,null);assert.equal(zero.billOffsetPercent,null);
 const negative=analyticsFinancials(Array(12).fill(10),{...analyticsDefaults,annualMaintenance:10000},1000,true,'gridtie');assert.equal(negative.simplePayback,null);assert.equal(negative.breakEvenYear,null);
});
test('private analytics survive validation and public copies strip precise location and household finances',()=>{
 const settings={...analyticsDefaults,location:{latitude:42.88,longitude:-78.88,label:'Private location'},faces:[{sharePercent:60,tilt:30,azimuth:180},{sharePercent:40,tilt:20,azimuth:90}]};
 const privateBuild={...build,settings:{...build.settings,analytics:settings}};
 assert.deepEqual(validateBuild(privateBuild).settings.analytics,settings);
 const shared=publicBuildCopy(privateBuild);assert.equal(shared.settings.analytics,undefined);assert.deepEqual(shared.lines,build.lines);assert.equal(privateBuild.settings.analytics.location.label,'Private location');
 assert.throws(()=>validateAnalytics({...settings,location:{latitude:91,longitude:0,label:'x'}}),/location/i);
 assert.throws(()=>validateAnalytics({...settings,electricityRate:-1}),/electricityRate/);
 assert.throws(()=>validateAnalytics({...settings,faces:[{sharePercent:20,tilt:30,azimuth:180}]}),/100/);
 assert.throws(()=>analyticsFinancials([1],settings,1000,true,'hybrid'),/twelve/i);
});
test('saving and reopening device builds retains an independent analytics snapshot',async()=>{
 const {saveDeviceBuild,readDeviceBuilds}=await import('../lib/build-library.ts');
 const input={...build,settings:{...build.settings,analytics:{...analyticsDefaults,location:{latitude:42.88,longitude:-78.88,label:'Public test landmark'}}}};
 const saved=saveDeviceBuild([],input,'device:analytics','2026-10-06T12:00:00Z');
 const opened=readDeviceBuilds(JSON.stringify(saved));
 assert.deepEqual(opened[0].settings.analytics,input.settings.analytics);
 opened[0].settings.analytics!.faces[0].tilt=45;
 assert.equal(input.settings.analytics.faces[0].tilt,30);
});
