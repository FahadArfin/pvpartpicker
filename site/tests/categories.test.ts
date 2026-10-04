import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,extractSpecs,extractPackQuantity,categorizeProduct} from '../lib/retailers.ts';
import type {Product} from '../lib/types.ts';
import {checkCompatibility} from '../lib/domain.ts';

test('standalone solar controllers are distinct from inverters with built-in MPPT',()=>{
 assert.equal(classify('Rover 2 12V/24V 30A MPPT Charge Controller with Bluetooth'),'charging');
 assert.equal(classify('Victron SmartSolar MPPT 100/50'),'charging');
 assert.equal(classify('12/24V 50A IP67 DC-DC with MPPT Battery Charger'),'charging');
 assert.equal(classify('REGO 12V 60A MPPT Solar Charge Controller — 10FT 6AWG Cable'),'charging');
 assert.equal(classify('Sungold Power 10kW 48V Solar Inverter | Dual MPPT | WiFi Monitoring'),'inverters');
});
test('module electronics stay together even when their titles mention cables or DIN rails',()=>{
 assert.equal(classify('Tigo Rapid Shutdown TS4-A-F, 22A, 725W, 0.1m Cable, MC4'),'module-electronics');
 assert.equal(classify('Tigo RSS Transmitter Pure Signal Single Core Din Rail'),'module-electronics');
 assert.equal(classify('Tigo TS4-A-O 725W PV Optimizer, Monitoring and Rapid Shutdown'),'module-electronics');
 assert.equal(classify('Tigo TAP Access Point'),'module-electronics');
});
test('complete systems and monitoring equipment do not inflate panel and battery counts',()=>{
 assert.equal(classify('Anker SOLIX S2000 Portable Power Station 2,010Wh — + 400W Solar Panel'),'kits');
 assert.equal(classify('EG4 6000XP Off Grid Solar Kit with 48V Battery'),'kits');
 assert.equal(classify('Fortress 12KW | 16KWH Storage | 12KW Array | Tigo Rapid Shutdown | Kit'),'kits');
 assert.equal(classify('Emporia Vue 3 Home Energy Monitor with 4 Pack Smart Plugs'),'monitoring');
 assert.equal(classify('Elejoy 1800W MPPT Solar Panel Multimeter & Watt Meter'),'monitoring');
 assert.equal(classify('EG4 GridBOSS Smart Energy Management System'),'monitoring');
 assert.equal(classify('SolaX Xpower CT Cable (50 Meter)'),'wiring');
 assert.equal(classify('Mounting Bracket for MPPT Charge Controller'),'mounting');
 assert.equal(classify('Victron SmartSolar MPPT WireBox-L'),'electrical');
});
test('unverified controllers, shutdown protocols and bundled systems never acquire a compatibility match',()=>{
 const products=[{id:'controller',name:'MPPT controller',category:'charging',specs:{voltage:48,chargeCurrentA:100}},{id:'shutdown',name:'TS4-A-F',category:'module-electronics',specs:{}},{id:'kit',name:'Solar kit',category:'kits',specs:{}}] as Product[];
 const checks=checkCompatibility(products,{purpose:'offgrid',mount:'roof'});
 assert.ok(checks.some(c=>c.title==='Charge controller & battery'));
 assert.ok(checks.some(c=>c.title==='Module electronics & shutdown'));
 assert.ok(checks.some(c=>c.title==='Bundled equipment'));
 assert.ok(checks.every(c=>c.status==='unknown'));
});
test('new equipment gets useful listed specs without guessing voltage ranges or bundle quantities',()=>{
 const specs=extractSpecs('Rover 12V/24V 40A MPPT Charge Controller','charging');
 assert.equal(specs.controllerType,'MPPT');assert.equal(specs.chargeCurrentA,40);
 assert.equal(specs.batteryMinV,undefined);assert.equal(specs.maxPvVoltage,undefined);
 assert.equal(extractSpecs('Tigo TS4-A-O Optimizer with Rapid Shutdown','module-electronics').moduleFunction,'Optimizer + rapid shutdown');
 assert.equal(extractPackQuantity('Solar Kit with 12 Panels and 2 Batteries','kits'),1);
 assert.equal(extractPackQuantity('Anker Solar Generator + 410W Solar Panel (pack of 2 RIGID)','kits'),1);
});
test('complete system prices count whole sale bundles rather than included panel packs',()=>{
 const product={id:'kit-1',name:'Anker Solar Generator + 410W Solar Panel (pack of 2 RIGID)',category:'panels',specs:{},offers:[{id:'kit-offer',price:3200,packQuantity:2,observedAt:'2026-10-01T00:00:00Z'}]} as unknown as Product;
 const updated=categorizeProduct(product);
 assert.equal(updated.category,'kits');assert.equal(updated.offers[0].packQuantity,1);
 assert.equal(updated.offers[0].price,3200);assert.equal(updated.offers[0].observedAt,product.offers[0].observedAt);
 assert.equal(product.offers[0].packQuantity,2);
});
test('legacy catalog regrouping preserves saved part and offer identities and dated observations',()=>{
 const product={id:'santan-tigo-1',name:'Tigo Rapid Shutdown TS4-A-F with MC4 Cable',category:'wiring',specs:{gauge:'12 AWG',manufacturerRating:'725W'},offers:[{id:'offer-1',price:39,observedAt:'2026-10-01T00:00:00Z'}]} as unknown as Product;
 const updated=categorizeProduct(product);
 assert.equal(updated.category,'module-electronics');assert.equal(updated.id,product.id);
 assert.deepEqual(updated.offers,product.offers);assert.equal(updated.specs.gauge,undefined);
 assert.equal(updated.specs.manufacturerRating,'725W');assert.equal(product.category,'wiring');
});
