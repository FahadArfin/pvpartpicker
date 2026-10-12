import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,extractSpecs,extractPackQuantity,categorizeProduct} from '../lib/retailers.ts';
import type {Product,Category} from '../lib/types.ts';
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

test('equipment connection cables and mounting brackets retain their component roles',()=>{
 const examples:[string,Category][]=[
  ['Battery to Charge Controller 4 AWG THHN Cables','wiring'],
  ['ETHOS 1/0AWG Control Box to Inverter Connectors (R&B)','wiring'],
  ['Boulder Charge Controller Mounting Brackets','mounting'],
  ['400W N-Type Portable Solar Panel Blanket with 4-in-1 Extension Cable for Power Stations','panels'],
  ['40A Solar Charge Controller with Battery Cables','charging'],
  ['3000W Off-Grid Inverter with Mounting Brackets','inverters'],
 ];
 for(const [name,category] of examples)assert.equal(classify(name),category,name);
});

test('battery accessories and charging modules remain distinct from stored energy',()=>{
 const examples:[string,Category][]=[
  ['Dr.Prepare Smart Battery Box with USB, 12V/24V Cigarette Lighter, and Anderson Ports','accessories'],
  ['Heavy Duty Battery Box for Group 24-31 Battery Sizes','accessories'],
  ['350A Battery Switch','electrical'],
  ['12-Way Battery Terminal Distribution Block Pair','electrical'],
  ['SolaX Xpower Battery Management System','accessories'],
  ['LiTime Battery Balancer for Series & Parallel Connected Batteries — 1 Pack','accessories'],
  ['LiTime Heavy Duty Golf Cart Battery Hold Down Kit with Clamps and Bolts — 1 Pack','mounting'],
  ['ETHOS Battery Top Plate Cover. Side Panel Protection Accessory','accessories'],
  ['Yeti Lithium MPPT Solar Charging Optimization Module','charging'],
  ['MPS3K (3kW / 4.5kWh)','all-in-one'],
  ['Adventurer Li- 30A PWM Flush Mount Charge Controller w/ LCD Display','charging'],
  ['12V 60A DC to DC Battery Charger','charging'],
  ['2360W Bifacial Solar Panel | 4x 590W N-Type Panels w/Tilt Mounts','panels'],
  ['ECO-WORTHY PowerMega Conduit Box, Cable Management & Terminal Protection Enclosure for 48V 314Ah Battery','electrical'],
  ['ECO-WORTHY 24V 100Ah Bluetooth Lithium Battery with BMS — 1 Pack','batteries'],
  ['48V 100Ah LiFePO4 Battery with Battery Management System','batteries'],
  ['Steel Battery Cabinet for Server Rack Batteries','batteries'],
 ];
 for(const [name,category] of examples)assert.equal(classify(name),category,name);
});
test('Emporia current sensor clamps use source context without moving ordinary spring clamps',()=>{
 const base:Product={id:'emporia-46599751631103',name:'Spring Clamps (Set of 2)',brand:'Emporia Energy',description:'Set of 2 Spring Clips for Vue Home Energy Monitor Applications: Applicable primary current: 50-200A',category:'mounting',image:'',images:[],sourceUrl:'https://shop.emporiaenergy.com/products/spring-clips-set-of-2?variant=46599751631103',specs:{},offers:[],verifiedAt:''};
 const sensor=categorizeProduct(base);assert.equal(sensor.category,'monitoring');assert.equal(sensor.specs.monitorType,'Sensor');
 assert.equal(categorizeProduct({...base,brand:'Other',description:'Spring clamps for mounting a solar panel'}).category,'mounting');
});

test('battery-box cell packages are not mistaken for empty enclosures',()=>{
 assert.equal(classify('YIXIANG V3 Stacked Battery Box Kit With JK 200A BMS +16PCS EVE 314 MB31 Brand New Grade A Lifepo4 Battery Cell'),'batteries');
 assert.equal(classify('YIXIANG DIY Battery Box Kit +16PCS EVE 314Ah LiFePO4 Battery Cells'),'batteries');
});

test('explicit panel-pack ratings retain published per-module watts and whole-package offers',()=>{
 for(const [name,unit] of [['2360W Bifacial Solar Panel | 4x 590W N-Type Panels w/Tilt Mounts',590],['1280W Solar Panel | 4x 320W N-Type Panels w/Tilt Mounts',320]] as const){
  const p:Product={id:'panel-pack',name,brand:'Renogy',description:'',category:'mounting',image:'',images:[],sourceUrl:'https://example.test/panel-pack',specs:{watts:unit*4},offers:[{id:'offer',retailerId:'renogy',retailer:'Renogy',url:'https://example.test/panel-pack',price:1000,currency:'USD',stock:'in_stock',packQuantity:4,observedAt:'2026-10-12T00:00:00Z',condition:'new'}],verifiedAt:''};
  const actual=categorizeProduct(p);assert.equal(actual.category,'panels');assert.equal(actual.specs.watts,unit);assert.deepEqual(actual.offers,p.offers);
 }
 assert.equal(extractSpecs('2400W Solar Panel | 4x 590W N-Type Panels','panels').watts,2400);
});
test('equipment roles follow the sale subject before attached features and wiring destinations',()=>{
 const cases:[string,Category][]=[
 ['EG4 12K PV Hybrid Inverter | 48V | 12000W Input | RSD | All-In-One Hybrid Solar Inverter','inverters'],
 ['Pro 12V Bluetooth Pure Sine Inverter (1000W/2000W/3000W) + 120V 30A Automatic ATS Transfer Switch — 3000W','inverters'],
 ['Solar Panel to Charge Controller Adaptor Kit — 10FT / 12AWG','wiring'],
 ['Solar Tray Cables - Connecting Charge Controller and Battery — 8FT / 8 AWG','wiring'],
 ['10 Gauge Extension Cable to Connect Solar Panel to Charge Controller | Pair of 10AWG Red and Black Extension Wires — 20 Feet','wiring'],
 ['440 Watt All-black Bifacial Mono-crystalline Solar Panels (with Z-brackets)','panels'],
 ['WattCycle 51.2V 628Ah 32kWh Smart LiFePO4 Solar Home Energy Storage System - Active Balancing — 32kWh Battery','batteries'],
 ['WattCycle 51.2V 628Ah 32kWh Smart LiFePO4 Solar Home Energy Storage System - Active Balancing — 32kWh Battery + 12kW AIO Inverter','kits'],
 ['LiTime 48V 30Ah GC2 Metal Case RS485 Monitor Lithium Battery for Golf Cart & Lawn Mower — 1 Pack 51.2V 30Ah COM','batteries'],
 ];for(const [name,category] of cases)assert.equal(classify(name),category,name);
 assert.equal(classify('Solar Charge Controller Connecting Cable'),'wiring');
 assert.equal(classify('Tigo TS4-A-O Optimizer | Rapid Shutdown | MC4 Cables'),'module-electronics');
 assert.equal(classify('12V Inverter Remote Control'),'monitoring');
 assert.equal(classify('Mounting Bracket for MPPT Charge Controller'),'mounting');
});

test('rated equipment descriptions do not absorb accessories or battery bank kits',()=>{
 assert.equal(classify('Compatible Accessories for the 12V 104Ah Super Slim Solid-State LiFePO4 Battery — Bracket for 2P Busbar'),'mounting');
 assert.equal(classify('300Ah 12V LiFePO4 Off-Grid Battery Kit | 3.8kWh Deep Cycle Lithium Battery Bank | Powerful 300Ah Battery Kit for RVs, Trailers, Cabins, Campers, Vans, Off-Grid | 3 X ALPHA 1 LITE in Parallel'),'kits');
 assert.equal(classify('EG4 FlexBOSS21 Inverter & EG4-GridBOSS MID V3.1 [BNDL-E0019-3.1]'),'monitoring');
});
test('plural inverter connection cables stay wiring after catalog expansion',()=>{
 for(const name of ['6 Foot 1/0 AWT Alligator Clamp Power Inverter Cables CLAMPHDCBL06FT1/0','10 Foot 4 AWG Alligator Clamp Inverter Cables PWRC12004A1500','Vector 1,000 Watt Power Inverter Cables'])assert.equal(classify(name),'wiring');
});
test('accessory families and package selections use the item actually sold',()=>{
 const cases:[string,Category][]=[
 ['Compatible Accessories for the 12V 104Ah Super Slim Solid-State LiFePO4 Battery — Battery Bracket for Single Battery','mounting'],
 ['Compatible Accessories for the 12V 104Ah Super Slim Solid-State LiFePO4 Battery — Bracket for Double Batteries','mounting'],
 ['Compatible Accessories for the 12V 104Ah Super Slim Solid-State LiFePO4 Battery — Bracket for 2P Busbar','mounting'],
 ['Adjustable Solar Panel Tilt Mount Brackets kit 28inch Support up to 150 Watt Solar Panels for Boats,RV,Roof Off Grid System','mounting'],
 ['Ultra-Light 100W & 200W Foldable Portable Solar Panel | Up to 25% Cell Efficiency, IP67, 3-in-1 Adapter Cable — 200W','panels'],
 ['12V 2x HUSKY2 RV LINKS2 Control System','kits'],
 ['12V 400Ah RV HUSKY2-Victron-LINKS2 Control System','kits'],
 ['WattCycle Dedicated 51.2V 314Ah Floor-Standing Battery Expansion Dual-Head Quick-Connect Parallel Cable — 2x Batteries & 1x Parallel Cables','kits'],
 ['WattCycle WattLINK - BLUETTI AC200MAX PPS Extra 48V Battery-to-PPS Expansion Cable — 5.12kWh(48V 100Ah Wall-Mount Battery) & AC200MAX Adapter kit','kits'],
 ['GridBOSS Breaker Kit','electrical'],
 ['Cable Entry Housing | Cable Entry Solutions for Solar Panel Roof Installs | Easy to Install — Black','accessories'],
 ];for(const [name,category] of cases)assert.equal(classify(name),category,name);
 assert.equal(classify('WattCycle Dedicated 51.2V 314Ah Floor-Standing Battery Expansion Dual-Head Quick-Connect Parallel Cable — Parallel Cable Only'),'wiring');
 assert.equal(classify('120V 30 Amp Automatic Transfer Switch'),'monitoring');
 assert.equal(classify('EG4 GridBOSS 200A MID'),'monitoring');
 assert.equal(classify('100W Solar Panel Extension Cable'),'wiring');
});
test('equipment destinations and plural accessories do not become solar panels',()=>{
 assert.equal(classify('Solar Connectors for Solar Panels 5 Pairs Male & Female'),'wiring');
 assert.equal(classify('Solar Panel Stands | 28" Fully Adjustable Tilt Mount | 100W-200W Panels ONLY'),'mounting');
 assert.equal(classify('Mega 1 + 2*240W Solar Panel | Solar Generator Kits — Mega 1 + 240W Solar Panel*2'),'kits');
 assert.equal(classify('Victron Energy Cerbo GX for Solar Panels and System Monitoring'),'monitoring');
 assert.equal(classify('HQST Solar Panel Connectors, Male & Female Pair, IP67 Waterproof Solar PV Connectors for Photovoltaic Solar System Outdoor Permanent Installation — 5 pairs'),'wiring');
});

test('exact selected equipment sale roles from batch ten preserve component boundaries',()=>{
 const examples:[string,Category][]=[
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 60kWh","kits"],
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 120kWh","kits"],
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 180kWh","kits"],
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 240kWh","kits"],
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 300kWh","kits"],
  ["Sol-Ark 60kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180/240/300/360kWh) — 360kWh","kits"],
  ["EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 1 Battery [6.1kWh]","batteries"],
  ["EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 2 Battery Packs [12.2kWh]","batteries"],
  ["EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 3 Battery Packs [18.42kWh]","batteries"],
  ["EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 4 Battery Packs [24.56kWh]","batteries"],
  ["EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 5 Battery Packs [30.7kWh]","batteries"],
  ["Set of 28\" Solar Panel Stands / Legs | 4/6/8 Panels | Portable Solar Panel Leg Kit | Fully Adjustable & Universal Compatibility — 4 x Sets of 2 Legs","mounting"],
  ["Set of 28\" Solar Panel Stands / Legs | 4/6/8 Panels | Portable Solar Panel Leg Kit | Fully Adjustable & Universal Compatibility — 6 x Sets of 2 Legs","mounting"],
  ["Set of 28\" Solar Panel Stands / Legs | 4/6/8 Panels | Portable Solar Panel Leg Kit | Fully Adjustable & Universal Compatibility — 8 x Sets of 2 Legs","mounting"],
  ["Sol-Ark 15kW Inverter with Deye RW-F10.2 — UL 9540 Closed-Loop Bundle (10/20/30kWh) — 20.4kWh","kits"],
  ["Sol-Ark 15kW Inverter with Deye RW-F10.2 — UL 9540 Closed-Loop Bundle (10/20/30kWh) — 10.2kWh","kits"],
  ["Sol-Ark 15kW Inverter with Deye RW-F10.2 — UL 9540 Closed-Loop Bundle (10/20/30kWh) — 30.6kWh","kits"],
  ["Sol-Ark 30kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180kWh) — 60kWh","kits"],
  ["Sol-Ark 30kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180kWh) — 120kWh","kits"],
  ["Sol-Ark 30kW Inverter with Deye GE-FL60/GE-FH60 Cabinet — UL 9540 Closed-Loop Bundle (60/120/180kWh) — 180kWh","kits"],
  ["SRNE 5kW Inverter with Deye SE-G5.1 Pro-B — Off-Grid Bundle (5/10/15kWh) — 5.12kWh","kits"],
  ["SRNE 5kW Inverter with Deye SE-G5.1 Pro-B — Off-Grid Bundle (5/10/15kWh) — 10.2kWh","kits"],
  ["SRNE 5kW Inverter with Deye SE-G5.1 Pro-B — Off-Grid Bundle (5/10/15kWh) — 15.3kWh","kits"],
  ["SRNE 10kW Inverter with Deye RW-F10.2 — Off-Grid Bundle (10/20/30kWh) — 10.2kWh","kits"],
  ["SRNE 10kW Inverter with Deye RW-F10.2 — Off-Grid Bundle (10/20/30kWh) — 20.4kWh","kits"],
  ["SRNE 10kW Inverter with Deye RW-F10.2 — Off-Grid Bundle (10/20/30kWh) — 30.6kWh","kits"],
  ["Solar Oven Kit Replacement Tube","accessories"],
  ["Single-Panel Adjustable Solar Pole Mount Bracket Kit | 36.6\" Crossbar | 25°–90° Tilt | Supports 100–250W Solar Panels | Fits Poles Up to 5\"","mounting"],
  ["Dual-Panel Adjustable Solar Pole Mount Bracket Kit | 36.6 in Crossbar | 25°–90° Tilt | Supports 100–250W Solar Panels | Fits Poles Up to 5 in","mounting"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 30W (Up to 2000 sq/ft) / Flat (Shingled Roof)","accessories"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 30W (Up to 2000 sq/ft) / Curb (Flat or Tile Roof)","accessories"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 32W (Up to 2100 sq/ft) / Flat (Shingled Roof)","accessories"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 32W (Up to 2100 sq/ft) / Curb (Flat or Tile Roof)","accessories"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 45W (Up to 2800 sq/ft) / Flat (Shingled Roof)","accessories"],
  ["SunRise Solar Attic Fan with Integrated Solar Panel | 30W–45W Options | Flat or Curb Base | Up to 2,800 sq/ft Cooling — 45W (Up to 2800 sq/ft) / Curb (Flat or Tile Roof)","accessories"],
  ["Tamarack Solar 1.6-IN Flush Mount Rail Kit | 8-Module Portrait | 5050 Module Clamps | 8' Spans | UL 2703 | PE Certified","mounting"],
  ["Tamarack Solar 2.3 Rail 93\" Black Flush Mount Kit | 4 Rails | Mounts 4 Modules up to 46\" Wide | UL 2703 | 180 MPH Rated","mounting"],
  ["Tamarack Solar 1.6 Rail 93 IN Black 2-Rail Kit | Mount Up to 2 Modules (Up to 46\" Wide) | UL 2703 Listed | 1.6-IN Rail Height","mounting"],
  ["TOP Rack Solar Panel TRT Rail Base System(TRT 02) — 12P","mounting"],
  ["TOP Rack Solar Panel TRT Rail Base System(TRT 02) — 16P","mounting"],
  ["TOP Rack Solar Panel TRT Rail Base System(TRT 02) — 36P","mounting"],
  ["TOP Rack Solar Panel TRT Rail Base System(TRT 02) — 40P","mounting"],
  ["TOP Rack Solar Panel TRT Rail Base System(TRT 02) — 31P","mounting"],
  ["Tamarack Solar 2.3 Rail - 93-Inch Black 2-Rail Flush Mount Kit | Mount 2 Modules up to 46\" Wide | Compatible w/ 4 & 8 Rail Kits | UL 2703 | PE Certified","mounting"],
  ["TOP Rack Solar Panel TRT Tile Hook System(TRT 03) — 12P","mounting"],
  ["TOP Rack Solar Panel TRT Tile Hook System(TRT 03) — 16P","mounting"],
  ["TOP Rack Solar Panel TRT Tile Hook System(TRT 03) — 31P","mounting"],
  ["TOP Rack Solar Panel TRT Tile Hook System(TRT 03) — 36P","mounting"],
  ["TOP Rack Solar Panel TRT Tile Hook System(TRT 03) — 40P","mounting"],
  ["BLUETTI Premium 200 [AC200PL] Portable Power Statio | Complete Solar Generator Kit | 3,500 Cycles | 5‑Year Warranty | Choose Your Bundle — Bluetti AC200P L [Main Unit Only]","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 5 kWh Battery | 11.5 kW Output - 1 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 10 kWh Battery | 11.5 kW Output - 2 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 15 kWh Battery | 11.5 kW Output - 3 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 20 kWh Battery | 11.5 kW Output - 4 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 25 kWh Battery | 11.5 kW Output - 5 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 30 kWh Battery | 11.5 kW Output - 6 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 35 kWh Battery | 11.5 kW Output - 7 Battery Modules | 1 Inverter","all-in-one"],
  ["Canadian Solar EP Cube 2.0 All-In-One Solar Energy Storage System | 11.5kW 120/240V Output | 23kW Solar PV Input | 5 - 40kWh Battery Capacity | Service Entrance Rated — 40 kWh Battery | 11.5 kW Output - 8 Battery Modules | 1 Inverter","all-in-one"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 55L / With Plug-in Battery","accessories"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 55L / No Plug-In Battery","accessories"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 45L / With Plug-in Battery","accessories"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 45L / No Plug-In Battery","accessories"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 35L / With Plug-in Battery","accessories"],
  ["EcoFlow GLACIER Classic 3-in-1 Portable Fridge, Freezer & Battery | 35L–55L | Up to 45H Runtime | Dual-Zone Cooling | Solar + USB-C Rechargeable — 35L / No Plug-In Battery","accessories"],
  ["BigBattery ETHOS 12kW Energy Storage System | 10.2–30.7kWh | Modular LiFePO4 | Indoor-Ready | 12-Year Warranty — 1 x EG4 18kPV + 2 x 48V Ethos 5.12kWh Stackable Battery Module | 10.2kWh Capacity","kits"],
  ["BigBattery ETHOS 12kW Energy Storage System | 10.2–30.7kWh | Modular LiFePO4 | Indoor-Ready | 12-Year Warranty — 1 x EG4 18kPV + 3 x 48V Ethos 5.12kWh Stackable Battery Module | 15.3kWh Capacity","kits"],
  ["BigBattery ETHOS 12kW Energy Storage System | 10.2–30.7kWh | Modular LiFePO4 | Indoor-Ready | 12-Year Warranty — 1 x EG4 18kPV + 4 x 48V Ethos 5.12kWh Stackable Battery Module | 20.4kWh Capacity","kits"],
  ["BigBattery ETHOS 12kW Energy Storage System | 10.2–30.7kWh | Modular LiFePO4 | Indoor-Ready | 12-Year Warranty — 1 x EG4 18kPV + 6 x 48V Ethos 5.12kWh Stackable Battery Module | 30.7kWh Capacity","kits"],
  ["(Sold Out) Mega 5 & B5 Extra Battery | Home Backup Battery — Mega 5 + 1 * B5 Extra Battery","kits"],
  ["(Sold Out) Mega 5 & B5 Extra Battery | Home Backup Battery — Mega 5 + 2 * B5 Extra Battery","kits"],
  ["Mega 3 & B2 Extra Battery | Home Backup Battery — Mega 3 + 1 * B2 Extra Battery","kits"],
  ["Mega 3 & B2 Extra Battery | Home Backup Battery — Mega 3 + 2 * B2 Extra Battery","kits"],
  ["Sol-Ark + Renon [E-CUBE] Sol Ark 30K or 60K + 61kWh Battery Storage | Air-Cooled Battery Storage System | Commercial / Industrial Solar — SOL-ARK 30K+ 61kWh Renon ECUBE","kits"],
  ["Sol-Ark + Renon [E-CUBE] Sol Ark 30K or 60K + 61kWh Battery Storage | Air-Cooled Battery Storage System | Commercial / Industrial Solar — SOL-ARK 60K + 61kWh Renon ECUBE","kits"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — Jackery FridgeGuard","all-in-one"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — Mounting Bracket","mounting"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — DC Input Module","accessories"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — Expansion Battery Pack","batteries"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — FridgeGuard + Expansion Battery Pack + Mounting Bracket","kits"],
  ["EcoFlow Wave 3 Portable Air Conditioner with Heater | 5,100 BTU Cooling + 6,100 BTU Heating | 8 Hrs Runtime | 5-Year Warranty — WAVE 3 + Add-on Battery","accessories"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — Mounting Bracket","mounting"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — DC Input Module","accessories"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — Expansion Battery Pack","batteries"],
  ["Jackery FridgeGuard - 1,024Wh Battery / 800W Output - Ultra-Slim Smart Power Backup | 5-Year Warranty — FridgeGuard + Expansion Battery Pack + Mounting Bracket","kits"],
  ["EcoFlow Wave 3 Portable Air Conditioner with Heater | 5,100 BTU Cooling + 6,100 BTU Heating | 8 Hrs Runtime | 5-Year Warranty — WAVE 3 Add-on Battery [Battery Only]","batteries"],
  ["BLUETTI RV5 - Modular RV Solar System | 5,000W | 120V | Off-Grid Ready | UL Certified | 5-Year Warranty — RV5 Power Hub [Unit Only]","inverters"],
  ["Discover HELIOS ESS Generic Conduit Box | 950-0077 | Lockable, Code-Compliant Wiring Enclosure | LYNK II Mount","accessories"],
  ["RUiXU Conduit Box for Lithi2-16 Battery | Compatible with RX-12K & Sol-Ark 15K | Clean Cable Management | Weather-Resistant | Easy Assembly","accessories"],
  ["Renogy 20A/30A/40A/60A/80A/100A/200A/300A/400A ANL Fuse Set w/ Fuse — Cover","accessories"],
  ["Anker SOLIX Manual Transfer Switch | 6-Circuit (30A, 120V) & 10-Circuit (50A, 120/240V or 30A Cable Kit) | UL 1008 | For F2000–F3800+ — 10-Circuit Kit (120V/240V, 50 Amp | For F3800 & 2 x F3800 Plus","electrical"],
  ["6KW Array12V Victron w/ Cerbo Kit for 50A RV/Trailer | 4 Panel | No Batteries","kits"],
  ["3KW Array 12V Victron w/Cerbo Kit for 30A RV/Trailer | 4 Panel | No Batteries","kits"]
 ];
 for(const [name,category] of examples)assert.equal(classify(name),category,name);
});

test('ETHOS control and connection options exclude battery cells while installation options retain them',()=>{
 const cases:[string,Category][]=[
 [
  "BigBattery 48V ETHOS Stackable Battery [Choose Capacity: 10kWh-30kWh] | On-Grid or Off-Grid | UN9540, UL1973, CE | 12-Year Warranty — 1 x Parallel Kit",
  "wiring"
 ],
 [
  "BigBattery 48V ETHOS Stackable Battery [Choose Capacity: 10kWh-30kWh] | On-Grid or Off-Grid | UN9540, UL1973, CE | 12-Year Warranty — 1 x Control Box Only",
  "accessories"
 ],
 [
  "RUiXU Lithi2-16 | 51.2V314Ah | 16kWh Battery | UL1973, 9540A, 9540, CEC, SGIP — Wheels Only",
  "batteries"
 ]
];
 for(const [name,category] of cases)assert.equal(classify(name),category,name);
});

test('standalone appliance batteries and selected passive options retain their own ratings',()=>{
 assert.equal(classify('EcoFlow WAVE 3 Add-on Battery'),'batteries');
 const options=['Jackery FridgeGuard - 1,024Wh Battery / 800W Output — Mounting Bracket','BigBattery 48V ETHOS Stackable Battery [Choose Capacity: 10kWh-30kWh] — 1 x Parallel Kit','BigBattery 48V ETHOS Stackable Battery [Choose Capacity: 10kWh-30kWh] — 1 x Control Box Only'];
 for(const name of options){const specs=extractSpecs(name,classify(name)!);for(const key of ['watts','voltage','capacityKwh','capacityAh'])assert.equal(specs[key],undefined,name+' '+key);}
});
