import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,extractSpecs,categorizeProduct,extractPackQuantity} from '../lib/retailers.ts';
import {rankings,tierPrice,valueTier,filterRankings} from '../lib/tiers.ts';
import type {Product} from '../lib/types.ts';
import {checkCompatibility} from '../lib/domain.ts';
const now=Date.parse('2026-10-04T23:00:00Z');
test('battery format filtering composes with use case and search without mixing families',()=>{
 const entries=[
  {...rankings[0],id:'rack',category:'batteries' as const,name:'Rack Alpha',cohort:'Home backup',formats:['server-rack' as const]},
  {...rankings[0],id:'floor',category:'batteries' as const,name:'Floor Alpha',cohort:'Home backup',formats:['standing' as const,'wall-mounted' as const]},
  {...rankings[0],id:'stack',category:'batteries' as const,name:'Stack Beta',cohort:'Modular storage',formats:['stackable' as const]},
  {...rankings[0],id:'station',formats:['standing' as const]},
 ];
 assert.deepEqual(filterRankings(entries,{category:'batteries',format:'server-rack'}).map(r=>r.id),['rack']);
 assert.deepEqual(filterRankings(entries,{category:'batteries',format:'standing',cohort:'Home backup',query:'ALPHA'}).map(r=>r.id),['floor']);
 assert.equal(filterRankings(entries,{category:'batteries',format:'stackable',query:'alpha'}).length,0);
 assert.equal(filterRankings(entries,{category:'batteries',format:'all'}).length,3);
 assert.equal(filterRankings(entries,{category:'all-in-one',format:'server-rack'}).length,1);
});
test('grid-only inverters cannot acquire a battery-only AC watt price rank',()=>{
 const r={...rankings.find(r=>r.id==='6000xp')!,priceBasis:'grid-ac' as const};
 const p={id:r.productIds[0],category:'inverters',offers:[{id:'new',price:900,packQuantity:1,condition:'new',stock:'in_stock',currency:'USD',observedAt:'2026-10-04T22:00:00Z'}]} as Product;
 assert.equal(tierPrice(r,[p],now),undefined);
});
test('expanded research covers many exact models and explicit battery formats',()=>{
 for(const category of ['all-in-one','batteries','panels','inverters']) assert.ok(rankings.filter(r=>r.category===category).length>=24,category);
 for(const r of rankings.filter(r=>r.category==='batteries')) assert.ok(r.formats?.length,r.id);
 assert.ok(rankings.filter(r=>r.formats?.includes('standing')).length>=5);
 assert.ok(rankings.filter(r=>r.formats?.includes('server-rack')).length>=6);
});
test('floor filter retains documented EG4 floor installations with mounting conditions',()=>{
 const floor=filterRankings(rankings,{category:'batteries',format:'standing'});
 for(const id of ['eg4-wm314-aw','eg4-wm280-indoor','eg4-wm280-aw']){
  const r=floor.find(r=>r.id===id);assert.ok(r,id);
  assert.ok(r.limits.some(s=>/bracket|wall attachment/.test(s)),id);
 }
});
test('standalone stations and combos remain separate without stealing expansion batteries or inverters',()=>{
 for(const name of ['Pecron E3800LFP','EcoFlow DELTA Pro 3 Portable Power Station','BLUETTI AC200L']) assert.equal(classify(name),'all-in-one',name);
 for(const name of ['PECRON F5000 LFP Portable Power Station — F5000 + 2 x EXP Batteries','Anker SOLIX C2000 Gen2 Portable Power Station — + 400W Solar Panel','Anker SOLIX F3800 Plus + Expansion Battery','Anker SOLIX F3800 Plus + Expansion Battery + 400W Solar Panel']) assert.equal(classify(name),'kits',name);
 assert.equal(classify('PECRON F5000LFP 48V Expansion Battery 5,120Wh | Battery Only'),'batteries');
 assert.equal(classify('Anker SOLIX BP2000 Expansion Battery Gen 2 for C2000'),'batteries');
 assert.equal(classify('Anker SOLIX High-Voltage Solar Charging Cable For F3800'),'wiring');
 assert.equal(classify('EG4 18kPV All-In-One Hybrid Inverter'),'inverters');
 assert.equal(classify('EG4 6000XP Solar Kit with battery'),'kits');
});
test('station bundle price is a complete sale unit and generic title parsing does not invent AC output from panel watts',()=>{
 assert.equal(extractPackQuantity('Anker Solar Generator + 410W Solar Panel (pack of 2 RIGID)','all-in-one'),1);
 const p=categorizeProduct({id:'station',name:'Portable Power Station 2,048Wh — + 400W Solar Panel',category:'kits',specs:{},offers:[{price:1200,packQuantity:2,observedAt:'2026-10-04T00:00:00Z'}]} as Product);
 assert.equal(p.offers[0].packQuantity,1);assert.equal(p.offers[0].price,1200);assert.equal(p.offers[0].observedAt,'2026-10-04T00:00:00Z');
 assert.equal(extractSpecs(p.name,'all-in-one').outputWatts,undefined);
 assert.equal(extractSpecs(p.name,'all-in-one').capacityKwh,2.048);
});
test('price tier requires an explicitly verified base configuration and excludes bundles, used, stale, unknown and out of stock offers',()=>{
 const r=rankings.find(r=>r.id==='c2000')!;
 const product=(id:string,condition='new',stock='in_stock',observedAt='2026-10-04T22:00:00Z')=>({id,category:'all-in-one',offers:[{id:'offer-'+id,price:999.99,packQuantity:1,currency:'USD',condition,stock,observedAt}]} as Product);
 assert.ok(tierPrice(r,[product(r.productIds[0])],now));
 for(const p of [product('unverified-bundle'),product(r.productIds[0],'used'),product(r.productIds[0],'new','out_of_stock'),product(r.productIds[0],'new','unknown'),product(r.productIds[0],'new','in_stock','2026-10-01T00:00:00Z')]) assert.equal(tierPrice(r,[p],now),undefined);
 assert.equal(valueTier(r,undefined),'Unpriced');
 assert.equal(valueTier(r,tierPrice(r,[product(r.productIds[0])],now)),'A');
});
test('panel value uses front-side STC power and preserves whole-package purchase minimums',()=>{
 const r=rankings.find(r=>r.id==='cs680')!;
 const p={id:r.productIds[0],category:'panels',offers:[{id:'pallet',price:5800,packQuantity:31,condition:'new',stock:'in_stock',currency:'USD',observedAt:'2026-10-04T22:00:00Z'}]} as Product;
 const price=tierPrice(r,[p],now)!;
 assert.equal(price.purchasePrice,5800);assert.equal(price.unitPrice,5800/31);assert.equal(price.metric,5800/31/680);
 assert.equal(valueTier(r,price),'S');
});
test('research cards provide reasons, limitations and dated evidence across all four families',()=>{
 for(const category of ['all-in-one','batteries','panels','inverters']) assert.ok(rankings.filter(r=>r.category===category).length>=4);
 for(const r of rankings){assert.ok(r.strengths.length&&r.limits.length&&r.sources.length);assert.ok(r.sources.every(s=>s.url.startsWith('https://')&&s.note));assert.ok(r.reviewedAt);}
 assert.equal(new Set(rankings.map(r=>r.id)).size,rankings.length);
});
test('station detection respects the main equipment noun and ignores cycle-life plus signs',()=>{
 assert.equal(classify('MC4 to 8mm Solar Generator Adapter Cable | 12AWG | 3ft'),'wiring');
 assert.equal(classify('EcoFlow DELTA PRO [ULTRA-X] Inverter | 12kW–36kW Output'),'inverters');
 assert.equal(classify('Anker SOLIX F3000 Expansion Battery | 3,072Wh LiFePO4 | 4,000+ Cycles'),'batteries');
 assert.equal(classify('Anker SOLIX F3800 + Expansion Battery + 400W Solar Panel'),'kits');
 assert.equal(classify('NUE SunCase 605 Portable Power Station 540Wh | LiFePO4 Battery'),'all-in-one');
});
test('selected DC station variants use their own capacity and disclose no AC inverter',()=>{
 const title='EcoFlow TRAIL Series DC Portable Power Station | 200 DC (192Wh, 220W) or 300 DC (288Wh, 300W) — TRAIL 300 DC: 288Wh | 300W output';
 const specs=extractSpecs(title,'all-in-one');
 assert.equal(specs.capacityKwh,.288);assert.equal(specs.stationType,'DC-only station (no AC inverter)');
 assert.equal(extractSpecs('Jackery Explorer 300D Portable Power Station 288Wh','all-in-one').stationType,'DC-only station (no AC inverter)');
 const checks=checkCompatibility([{id:'dc',category:'all-in-one',specs}] as Product[],{purpose:'offgrid',mount:'roof'});
 assert.ok(checks.some(c=>c.title==='DC-only output'&&c.status==='unknown'));
});
