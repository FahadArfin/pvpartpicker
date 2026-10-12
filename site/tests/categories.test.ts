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
test('database metadata can be regrouped before separately stored offers are attached',()=>{
 const metadata={id:'stored-kit',name:'Jackery Portable Power Station',category:'batteries',specs:{}} as Omit<Product,'offers'>;
 const updated=categorizeProduct(metadata);
 assert.equal(updated.category,'all-in-one');assert.deepEqual(updated.offers,[]);
 assert.equal(updated.id,'stored-kit');
});

test('dedicated lithium chargers are accessories rather than storage batteries',()=>{
 for(const title of ['72V 110V AC 13A IP65 Weatherproof Lithium Charger (87.6V DC)','12V 110V AC 60A Lithium Charger (14.6V DC)']) {
  const product={id:'charger',name:title,category:'batteries',specs:{voltage:72,batteryKind:'Battery modules',capacityAh:105,chemistry:'LiFePO4'},offers:[]} as unknown as Product;
  const updated=categorizeProduct(product);
  assert.equal(updated.category,'accessories');
  assert.equal(updated.specs.accessoryType,'Battery chargers');
  assert.equal(updated.specs.batteryKind,undefined);
  assert.equal(updated.specs.capacityAh,undefined);
 }
});
test('charger classification retains inverter, controller and accessory subjects',()=>{
 for(const [title,category] of [
  ['Victron MultiPlus-II 48V Inverter/Charger','inverters'],
  ['12/24V 50A IP67 DC-DC with MPPT Battery Charger','charging'],
  ['MPPT Solar Charge Controller with Battery Charger','charging'],
  ['Lithium Charger Cable for 48V Batteries','wiring'],
  ['48V Lithium Battery Expansion Kit with Charger','batteries'],
 ] as const) assert.equal(classify(title),category,title);
});
test('battery voltage excludes the bundled charger selected variant rating',()=>{
 const title='【UL 2271】 Vatrer 48V 105Ah Lithium Golf Cart Battery Conversion Kit with Up to 50 Miles of Range — 1 Pack Lithium Battery+1*58.4V 18A Charger+1*LCD Screen+Others / 1 PACK';
 assert.equal(extractSpecs(title,'batteries').voltage,48);
 const product={id:'vatrer-43014543507614',name:title,category:'batteries',specs:{voltage:58.4,capacityAh:105},offers:[]} as unknown as Product;
 assert.equal(categorizeProduct(product).specs.voltage,48);
 assert.equal(categorizeProduct({...product,specs:{...product.specs,voltage:51.2}}).specs.voltage,51.2);
 assert.equal(extractSpecs('LiFePO4 Battery — 24V 100Ah Battery+1*29.2V Charger','batteries').voltage,24);
 assert.equal(extractSpecs('LiFePO4 Battery — 24V 100Ah','batteries').voltage,24);
});

test('battery communication and monitoring taglines do not replace the primary sale item',()=>{
 for(const [name,category,stale] of [
  ['LiTime 12V 100Ah Smart ComFlex Battery | Bluetooth & Victron Communication — 1 Pack','accessories',{accessoryType:'Adapters & communications'}],
  ['🔥【SAVE $29】Redodo 12V 100Ah Group 24 Bluetooth LiFePO4 Battery | Real-Time Battery Monitoring | For RV, Marine, Solar — 1 Pack + 20A Charger','monitoring',{monitorType:'Battery monitor'}],
 ] as const){
  const product={id:'tagline-battery',name,category,specs:{voltage:12,capacityAh:100,...stale},offers:[{id:'original-offer',price:229,packQuantity:1,observedAt:'2026-10-12T00:00:00Z'}]} as unknown as Product;
  const updated=categorizeProduct(product);
  assert.equal(updated.category,'batteries');assert.equal(updated.specs.batteryKind,'Battery modules');
  assert.equal(updated.specs.accessoryType,undefined);assert.equal(updated.specs.monitorType,undefined);
  assert.equal(updated.specs.voltage,12);assert.equal(updated.specs.capacityAh,100);
  assert.deepEqual(updated.offers,product.offers);assert.equal(updated.id,product.id);
 }
});
test('feature columns retain real monitor, accessory, charger, controller, inverter and kit subjects',()=>{
 for(const [name,category] of [
  ['Victron SmartShunt Battery Monitor | Bluetooth & Battery Monitoring','monitoring'],
  ['Battery Communication Adapter | Bluetooth for Lithium Battery','monitoring'],
  ['48V Lithium Charger | For LiFePO4 Battery','accessories'],
  ['40A MPPT Charge Controller | Bluetooth & Battery Monitoring','charging'],
  ['48V 5000W Inverter Charger | Battery Communication','inverters'],
  ['48V Lithium Charger Cable | For Lithium Battery','wiring'],
  ['Solar Kit with 48V Battery and Inverter | Battery Monitoring','kits'],
 ] as const)assert.equal(classify(name),category,name);
});

test('Anker E10 whole-home output and battery-bank systems remain kits',()=>{
 const title='Anker SOLIX E10 [DUAL] - 15kW Output + 12kWh Battery Bank | Whole Home, Off-Grid, Hybrid, Backup Power System | Choose Complete Bundle — PLUS - 5.2KW Solar + 12KWH Battery / Standard Ground Mount';
 assert.equal(classify(title),'kits');
 assert.equal(classify('Anker SOLIX E10 [DUAL] - 15kW Output + 12kWh Battery Bank | Whole Home Backup Solar Power System | Battery Monitoring'),'kits');
});
