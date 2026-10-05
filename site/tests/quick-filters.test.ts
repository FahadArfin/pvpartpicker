import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product} from '../lib/types.ts';
import {matchesQuickFilter,quickFilterGroups,toggleQuickFilter} from '../lib/quick-filters.ts';
import {classify,extractSpecs,parseProductPage,retailers,categorizeProduct} from '../lib/retailers.ts';
const p=(name:string,category:Product['category'],specs:Product['specs']={}):Product=>({id:name,name,category,specs,brand:'Test',description:'',image:'',images:[],sourceUrl:'https://example.com/item',offers:[],verifiedAt:''});
test('mounting chips distinguish rails, clamps, ground arrays and brackets by main item',()=>{
 for(const [name,value] of [['IronRidge Roof Rail 14 ft','rails'],['Mid Clamp for Roof Rails','clamps'],['Solar Ground Array Kit with Rails','ground'],['Solar Z Mounting Brackets','brackets'],['DIN Rail Mounting Kit for Vue','other'],['Pole Mount with Rails','ground'],['Roof Tech L-Foot Rail-Free Attachment','roof-hardware'],['Roof Tech RT MINI Bolt & Nut','roof-hardware']])assert.ok(matchesQuickFilter(p(name,'mounting'),'mountingPart',value),name);
});
test('wire chips distinguish assemblies from raw wire and independent connector/material choices',()=>{
 assert.ok(matchesQuickFilter(p('MC4 to XT-60 Premade Solar Cable','wiring'),'wirePart','premade'));
 assert.ok(matchesQuickFilter(p('MC4 to XT-60 Premade Solar Cable','wiring'),'connector','xt60'));
 assert.ok(matchesQuickFilter(p('Anderson SB50 Battery Cable','wiring'),'connector','anderson'));
 assert.ok(matchesQuickFilter(p('Copper Battery Terminal Lugs','wiring'),'wirePart','lugs'));
 assert.ok(matchesQuickFilter(p('500 Foot Spool Pure Copper PV Wire','wiring'),'wirePart','bulk'));
 assert.ok(matchesQuickFilter(p('THHN/THWN-2 Copper Wire','wiring'),'wireInsulation','thwn'));
 assert.ok(matchesQuickFilter(p('EG4 Battery Cable Connectors','wiring'),'wirePart','connectors'));
 assert.ok(matchesQuickFilter(p('HELIOS Terminal Connector Set','wiring'),'wirePart','connectors'));
 assert.ok(matchesQuickFilter(p('Solar Cable Entry Gland','wiring'),'wirePart','connectors'));
 assert.ok(matchesQuickFilter(p('Battery Cable Sold by the Foot','wiring'),'wirePart','bulk'));
 assert.ok(matchesQuickFilter(p('Undocumented Battery Cable','wiring'),'wirePart','other'));
 assert.ok(matchesQuickFilter(p('Roof Tech M8 Hex Bolt & Flange Nut | Secure Rail Attachment','mounting'),'mountingPart','roof-hardware'));
 assert.ok(matchesQuickFilter(p('IntegraRack IR-T1 Roof Mount | Compatible with Rail Systems','mounting'),'mountingPart','roof-hardware'));
 assert.ok(!matchesQuickFilter(p('CCA Copper Clad Aluminum Wire','wiring'),'wireMaterial','copper'));
});
test('battery and inverter voltage chips use nominal DC voltage, not AC output',()=>{
 assert.ok(matchesQuickFilter(p('Rack battery','batteries',{voltage:51.2,formFactor:'Server rack'}),'voltage','48'));
 assert.ok(matchesQuickFilter(p('Rack battery','batteries',{formFactor:'Server rack'}),'batteryFormat','rack'));
 assert.ok(matchesQuickFilter(p('Vertical standing battery','batteries',{formFactor:'Floor standing'}),'batteryFormat','standing'));
 assert.ok(matchesQuickFilter(p('12V RV LiFePO4 Battery','batteries'),'batteryFormat','rv'));
 assert.ok(!matchesQuickFilter(p('120/240V AC inverter','inverters',{voltage:240}),'voltage','400'));
 assert.ok(matchesQuickFilter(p('Hybrid inverter','inverters',{inverterType:'Hybrid'}),'inverterType','Hybrid'));
 assert.ok(matchesQuickFilter(p('Grid tie inverter','inverters',{inverterType:'Grid-tie'}),'inverterType','Grid-tie'));
});
test('explicit floor-standing source descriptions and compact battery labels remain filterable',()=>{
 const battery=p('BigBattery NEXUS 51.2V314Ah LiFePO4 Battery','batteries');battery.description='Installation: Indoor Floor-standing. Compact Floor-Standing Design.';
 const normalized=categorizeProduct(battery);
 assert.equal(normalized.specs.formFactor,'Floor standing');assert.equal(normalized.specs.voltage,51.2);
 assert.ok(matchesQuickFilter(normalized,'batteryFormat','standing'));assert.ok(matchesQuickFilter(normalized,'voltage','48'));
 assert.equal(extractSpecs('DIN Rail Mounting Kit for Energy Monitor','mounting').mountType,'Hardware');
 assert.equal(extractSpecs('Side of Pole Mount with Rails','mounting').mountType,'Ground');
 assert.notEqual(extractSpecs('Expansion Battery with Mounting Bracket','batteries').formFactor,'Server rack');
});
test('electrical chips and fuse child chips classify main equipment, not included parts',()=>{
 for(const [name,value]of [['ANL Fuse Holder','fuses'],['Class T Fuse 200A','fuses'],['PV Fuse Combiner Box','combiners'],['Smart Electrical Panel','smart-panels'],['200A Main Lug Load Center','panels'],['Copper Busbar','busbars'],['DIN Circuit Breaker','breakers'],['Conduit Body','conduit']])assert.ok(matchesQuickFilter(p(name,'electrical'),'electricalPart',value),name);
 assert.ok(matchesQuickFilter(p('Class T Fuse 200A','electrical'),'fuseType','class-t'));
 assert.ok(!matchesQuickFilter(p('ANL Fuse Holder','electrical'),'fuseType','class-t'));
 assert.equal(classify('EcoFlow Smart Home Panel 2'),'electrical');
 assert.equal(classify('Emporia Level 2 EV Charger with Hardwire'),'accessories');
});
test('toggles compose, clear nested fuses, and category groups stay compact',()=>{
 let state=toggleQuickFilter({voltage:'48'},'batteryFormat','rack');assert.deepEqual(state,{voltage:'48',batteryFormat:'rack'});
 state=toggleQuickFilter(state,'batteryFormat','rack');assert.deepEqual(state,{voltage:'48'});
 assert.deepEqual(toggleQuickFilter({electricalPart:'fuses',fuseType:'anl'},'electricalPart','busbars'),{electricalPart:'busbars'});
 assert.ok(quickFilterGroups('electrical',{electricalPart:'fuses'}).some(g=>g.key==='fuseType'));
 assert.ok(!quickFilterGroups('electrical',{}).some(g=>g.key==='fuseType'));
 assert.deepEqual(quickFilterGroups('inverters',{}).find(g=>g.key==='voltage')?.options.map(o=>o.value),['12','24','48','400']);
});
test('new wire retailers use bounded collections/pages and preserve fixed-package prices',()=>{
 const windy=retailers.find(r=>r.id==='windynation'),temco=retailers.find(r=>r.id==='temco');
 assert.ok(windy&&temco);assert.equal(windy.adapter,'shopify');assert.equal(windy.startPath,'/collections/solar-cable/products.json');assert.equal(temco.adapter,'pages');assert.ok(temco.urls?.length);
 const html='<meta property="og:title" content="TEMCo 10 AWG PV Wire 100 Ft Black + 100 Ft Red"><script>var BCData = {"product_attributes":{"sku":"SW2100","price":{"without_tax":{"currency":"USD","value":120.92}},"instock":true}};</script>';
 assert.equal(parseProductPage(html,temco,'https://temcoindustrial.com/wire/','2026-10-05T00:00:00Z')[0]?.offers[0].price,120.92);
 assert.equal(extractSpecs('THHN/THWN-2 Pure Copper Wire','wiring').wireMaterial,'Copper');
});
