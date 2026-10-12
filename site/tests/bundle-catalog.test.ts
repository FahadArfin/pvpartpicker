import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categorizeProduct,classify,canonicalId,extractPackQuantity} from '../lib/retailers.ts';
import {getFilterOptions,matchesAttribute} from '../lib/catalog-filters.ts';
import {costForQuantity,checkCompatibility} from '../lib/domain.ts';
import type {Product} from '../lib/types.ts';

const snapshot=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8')).products as Product[];
const selected=(id:string)=>categorizeProduct(snapshot.find(p=>p.id===id)!);
const product=(name:string)=>categorizeProduct({id:'saved-id',name,brand:'Test',category:'all-in-one',description:'',image:'',images:[],sourceUrl:'https://example.com/variant',verifiedAt:'2026-10-04T00:00:00Z',specs:{capacityKwh:2},offers:[{id:'saved-offer',url:'https://example.com/variant',retailer:'Test',retailerId:'test',price:1200,currency:'USD',packQuantity:2,stock:'in_stock',condition:'new',observedAt:'2026-10-04T00:00:00Z'}]} as Product);

test('selected main-unit SKU stays standalone despite parent kit marketing and shared bundle image',()=>{
 const base=selected('shopsolar-44746661232780');
 assert.equal(base.category,'all-in-one');
 assert.equal(base.configuration?.kind,'standalone');
 assert.match(base.configuration!.title,/EcoFlow DELTA 3 Max.*Black.*Main unit only/);
 assert.deepEqual(base.configuration!.components.map(c=>c.type),['power-station']);
 assert.equal(base.specs.capacityKwh,2.048);
});

test('the actual combo variant is a distinct purchase with exact listed panel count and wattage',()=>{
 const base=selected('shopsolar-44746661232780'),combo=selected('shopsolar-44746661167244');
 assert.equal(combo.category,'kits');assert.equal(combo.configuration?.kind,'combo');
 assert.equal(combo.configuration!.family,base.configuration!.family);
 assert.notEqual(combo.configuration!.title,base.configuration!.title);
 const panels=combo.configuration!.components.find(c=>c.type==='panels')!;
 assert.equal(panels.quantity,2);assert.match(panels.detail,/200 W/);assert.match(panels.detail,/400 W/);
 assert.equal(combo.specs.watts,undefined);assert.equal(combo.specs.capacityKwh,undefined);
 assert.equal(combo.offers[0].packQuantity,1);
});

test('station expansion and charger combos are grouped without counting internal storage as a separate battery',()=>{
 const combo=selected('shopsolar-44718471479436');
 assert.equal(combo.category,'kits');
 assert.deepEqual(combo.configuration!.components.map(c=>c.type),['power-station','batteries','charging']);
 assert.equal(combo.configuration!.components.find(c=>c.type==='batteries')!.quantity,1);
 assert.equal(selected('shopsolar-44718464598156').category,'all-in-one');
});

test('feature claims, compatible panels, homogeneous multipacks and station accessories do not become combos',()=>{
 for(const title of ['Pecron E3800LFP Portable Power Station | 3,000W Solar + 3,200W AC Fast Charging','EcoFlow DELTA 3 Ultra Plus Portable Power Station + Smart Output Priority Tech','EcoFlow DELTA Pro 3 Portable Power Station | Supports solar panels and extra batteries']) assert.equal(classify(title),'all-in-one',title);
 assert.equal(classify('Anker SOLIX F3000 Expansion Battery | 4,000+ Cycles'),'batteries');
 assert.equal(classify('MC4 to 8mm Solar Generator Adapter Cable'),'wiring');
 assert.equal(classify('EG4 18kPV All-In-One Hybrid Inverter'),'inverters');
 assert.equal(classify('500W Solar Panel — 4PCS'),'panels');
 assert.equal(classify('EcoFlow STREAM Balcony Solar — STREAM Microinverter'),'inverters');
});

test('explicit joins classify combos without a kit keyword, and never merge them into standalone canonical IDs',()=>{
 assert.equal(classify('Anker SOLIX F3800 + Expansion Battery + 400W Solar Panel'),'kits');
 assert.equal(classify('EG4 6000XP Inverter + 48V Battery'),'kits');
 assert.notEqual(canonicalId('EG4 6000XP Inverter + 48V Battery','kits','shop-combo'),'eg4-6000xp');
 const p=product('Portable Power Station 2,048Wh — Nomad Kit [2 x 200W Panels]');
 assert.equal(p.id,'saved-id');assert.equal(p.offers[0].id,'saved-offer');assert.equal(p.offers[0].price,1200);
 assert.equal(p.offers[0].observedAt,'2026-10-04T00:00:00Z');assert.equal(costForQuantity(p.offers[0],2).subtotal,2400);
 assert.equal(extractPackQuantity(p.name,'kits'),1);
 assert.ok(checkCompatibility([p],{purpose:'offgrid',mount:'roof'}).every(c=>c.status==='unknown'));
});

test('component filters match every included type in a combo, with variant differences preserved',()=>{
 const panel=selected('shopsolar-44718471577740'),battery=selected('shopsolar-44718464630924');
 assert.ok(matchesAttribute(panel,'bundleComponent','panels'));
 assert.ok(matchesAttribute(panel,'bundleComponent','power-station'));
 assert.equal(matchesAttribute(panel,'bundleComponent','batteries'),false);
 const options=getFilterOptions('kits','bundleComponent',[panel,battery]);
 assert.equal(options.find(o=>o.value==='power-station')?.count,2);
 assert.equal(options.find(o=>o.value==='panels')?.count,1);
 assert.equal(options.find(o=>o.value==='batteries')?.count,1);
});

test('selected mounting exclusions do not become included racking and unspecified counts stay unknown',()=>{
 const p=selected('shopsolar-45508195418252');
 assert.equal(p.category,'kits');assert.ok(p.configuration!.components.some(c=>c.type==='inverter'));
 assert.ok(p.configuration!.components.some(c=>c.type==='panels'));
 assert.equal(p.configuration!.components.find(c=>c.type==='panels')!.quantity,undefined);
 assert.equal(p.configuration!.components.some(c=>c.type==='mounting'),false);
});

test('standalone variant names retain capacity and pack distinctions and inverter-only variants exclude batteries',()=>{
 assert.notEqual(selected('shopsolar-44351068340364').configuration!.title,selected('shopsolar-44351068307596').configuration!.title);
 const inverter=selected('shopsolar-45099587207308');
 assert.equal(inverter.category,'inverters');assert.equal(inverter.configuration!.kind,'standalone');
 assert.deepEqual(inverter.configuration!.components.map(c=>c.type),['inverter']);
 assert.equal(classify('EZ1 Microinverter | DIY Balcony Solar Inverter - Handles up to 2 x Solar Panels'),'inverters');
 assert.notEqual(classify('Solar Panel to Charge Controller Adaptor Kit — 10FT / 12AWG'),'kits');
});

test('stored combo names distinguish each configuration and module capacities are not mislabeled as totals',()=>{
 const combos=snapshot.map(categorizeProduct).filter(p=>p.configuration?.kind==='combo');
 assert.equal(new Set(combos.map(p=>p.configuration!.title)).size,combos.length);
 const ocean=selected('shopsolar-45099587272844').configuration!;
 assert.match(ocean.components.find(c=>c.type==='batteries')!.detail,/10 kWh each.*20 kWh listed storage/);
});

test('source-confirmed RV Cerbo packages exclude batteries and retain their included equipment',()=>{
 const p=product('6KW Array12V Victron w/ Cerbo Kit for 50A RV/Trailer | 4 Panel | No Batteries');
 assert.equal(p.category,'kits');
 assert.deepEqual(p.configuration?.components.map(c=>c.type),['panels','inverter','charging','controls']);
 assert.equal(p.configuration?.components[0].quantity,4);
});
test('Mega and FridgeGuard selected combos preserve battery counts and mounting',()=>{
 const mega=product('Mega 3 & B2 Extra Battery | Home Backup Battery — Mega 3 + 2 * B2 Extra Battery');
 assert.equal(mega.configuration?.components.find(c=>c.type==='batteries')?.quantity,2);
 const fridge=product('Jackery FridgeGuard - 1,024Wh Battery / 800W Output — FridgeGuard + Expansion Battery Pack + Mounting Bracket');
 assert.equal(fridge.category,'kits');
 assert.ok(fridge.configuration?.components.some(c=>c.type==='mounting'));
});

test('a bundle descriptor before the selected capacity never replaces the selected battery size',()=>{
 const p=product('Sol-Ark 15kW Inverter with Deye SE-G5.1 Pro-B Battery Pack — UL 9540 Closed-Loop Bundle (15/20/40kWh) — 15.3kWh');
 assert.equal(p.configuration?.components.find(c=>c.type==='batteries')?.detail,'15.3 kWh listed storage');
});

// Exact selected Shopify variants from cached 7c97730a4d3e6fce.html; offers frozen from the batch-ten snapshot.
const dpuPacks=[
 {
  "id": "shopsolar-44235326849164",
  "name": "EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 1 Battery [6.1kWh]",
  "brand": "EcoFlow",
  "category": "all-in-one",
  "description": "",
  "image": "",
  "images": [],
  "sourceUrl": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326849164",
  "specs": {
   "capacityKwh": 6.1,
   "stationType": "Integrated power station"
  },
  "offers": [
   {
    "id": "shopsolar-44235326849164",
    "retailerId": "shopsolar",
    "retailer": "ShopSolar",
    "url": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326849164",
    "price": 2199,
    "referencePrice": 4123.75,
    "currency": "USD",
    "packQuantity": 1,
    "stock": "out_of_stock",
    "observedAt": "2026-10-11T23:17:26.270Z",
    "sku": "44235326849164",
    "condition": "new"
   }
  ],
  "verifiedAt": "2026-10-11T23:17:26.270Z"
 },
 {
  "id": "shopsolar-44235326881932",
  "name": "EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 2 Battery Packs [12.2kWh]",
  "brand": "EcoFlow",
  "category": "all-in-one",
  "description": "",
  "image": "",
  "images": [],
  "sourceUrl": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326881932",
  "specs": {
   "capacityKwh": 12.2,
   "stationType": "Integrated power station"
  },
  "offers": [
   {
    "id": "shopsolar-44235326881932",
    "retailerId": "shopsolar",
    "retailer": "ShopSolar",
    "url": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326881932",
    "price": 4368,
    "referencePrice": 8247.5,
    "currency": "USD",
    "packQuantity": 1,
    "stock": "out_of_stock",
    "observedAt": "2026-10-11T23:17:26.271Z",
    "sku": "44235326881932",
    "condition": "new"
   }
  ],
  "verifiedAt": "2026-10-11T23:17:26.271Z"
 },
 {
  "id": "shopsolar-44235326914700",
  "name": "EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 3 Battery Packs [18.42kWh]",
  "brand": "EcoFlow",
  "category": "all-in-one",
  "description": "",
  "image": "",
  "images": [],
  "sourceUrl": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326914700",
  "specs": {
   "capacityKwh": 18.42,
   "stationType": "Integrated power station"
  },
  "offers": [
   {
    "id": "shopsolar-44235326914700",
    "retailerId": "shopsolar",
    "retailer": "ShopSolar",
    "url": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326914700",
    "price": 6547,
    "referencePrice": 12371.25,
    "currency": "USD",
    "packQuantity": 1,
    "stock": "out_of_stock",
    "observedAt": "2026-10-11T23:17:26.272Z",
    "sku": "44235326914700",
    "condition": "new"
   }
  ],
  "verifiedAt": "2026-10-11T23:17:26.272Z"
 },
 {
  "id": "shopsolar-44235326947468",
  "name": "EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 4 Battery Packs [24.56kWh]",
  "brand": "EcoFlow",
  "category": "all-in-one",
  "description": "",
  "image": "",
  "images": [],
  "sourceUrl": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326947468",
  "specs": {
   "capacityKwh": 24.56,
   "stationType": "Integrated power station"
  },
  "offers": [
   {
    "id": "shopsolar-44235326947468",
    "retailerId": "shopsolar",
    "retailer": "ShopSolar",
    "url": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326947468",
    "price": 8706,
    "referencePrice": 16495,
    "currency": "USD",
    "packQuantity": 1,
    "stock": "out_of_stock",
    "observedAt": "2026-10-11T23:17:26.273Z",
    "sku": "44235326947468",
    "condition": "new"
   }
  ],
  "verifiedAt": "2026-10-11T23:17:26.273Z"
 },
 {
  "id": "shopsolar-44235326980236",
  "name": "EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option — 5 Battery Packs [30.7kWh]",
  "brand": "EcoFlow",
  "category": "all-in-one",
  "description": "",
  "image": "",
  "images": [],
  "sourceUrl": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326980236",
  "specs": {
   "capacityKwh": 30.7,
   "stationType": "Integrated power station"
  },
  "offers": [
   {
    "id": "shopsolar-44235326980236",
    "retailerId": "shopsolar",
    "retailer": "ShopSolar",
    "url": "https://shopsolarkits.com/products/ecoflow-delta-pro-ultra-battery-pack?variant=44235326980236",
    "price": 10895,
    "referencePrice": 20618.75,
    "currency": "USD",
    "packQuantity": 1,
    "stock": "out_of_stock",
    "observedAt": "2026-10-11T23:17:26.274Z",
    "sku": "44235326980236",
    "condition": "new"
   }
  ],
  "verifiedAt": "2026-10-11T23:17:26.274Z"
 }
] as Product[];

test('homogeneous DELTA Pro Ultra battery packs retain total offers and compare per-module capacity',()=>{
 const cases:[string,number,number][]=[['shopsolar-44235326881932',2,12.2],['shopsolar-44235326849164',1,6.1],['shopsolar-44235326914700',3,18.42],['shopsolar-44235326947468',4,24.56],['shopsolar-44235326980236',5,30.7]];
 for(const [id,count,totalKwh] of cases){
  const raw=dpuPacks.find(p=>p.id===id)!;assert.ok(raw,id);
  const normalized=categorizeProduct(raw);
  assert.equal(normalized.category,'batteries');
  assert.equal(extractPackQuantity(raw.name,'batteries'),count);
  assert.equal(normalized.specs.capacityKwh,6.1,id+' explicitly listed rounded module capacity');
  assert.equal(normalized.specs.packCapacityKwh,totalKwh,id+' selected aggregate capacity');
  for(let i=0;i<raw.offers.length;i++){
   const old=raw.offers[i],offer=normalized.offers[i];
   assert.equal(offer.packQuantity,count);
   assert.equal(offer.price/offer.packQuantity,old.price/count);
   assert.deepEqual({...offer,packQuantity:old.packQuantity,recordedPackQuantity:old.recordedPackQuantity},{...old,recordedPackQuantity:old.recordedPackQuantity});
   assert.equal(costForQuantity(offer,count).subtotal,old.price);
  }
  assert.deepEqual(categorizeProduct(normalized),normalized,'normalization is idempotent');
 }
});
test('selected homogeneous battery quantities exclude mixed systems and accessory packs',()=>{
 const main='EcoFlow DELTA PRO ULTRA - 6,114Wh / 6.1kWh Battery Pack - Choose Bundle Option';
 for(const [name,category] of [[main+' — 2 Battery Packs [12.2kWh] + Inverter','kits'],['EcoFlow DELTA Pro Power Station — Main Unit + 2 Extra Batteries','kits'],['Battery Carrying Case Kit — 2 Battery Packs','accessories']] as const)assert.equal(extractPackQuantity(name,category),1,name);
 const raw=dpuPacks.find(p=>p.id==='shopsolar-44235326881932')!;
 const otherOffer={...raw.offers[0],id:'another-variant-offer',url:raw.sourceUrl.replace('44235326881932','44235326914700')};
 assert.deepEqual(categorizeProduct({...raw,offers:[otherOffer]}).offers[0],otherOffer,'a different selected offer is not rewritten');
});
