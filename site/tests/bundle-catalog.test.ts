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
