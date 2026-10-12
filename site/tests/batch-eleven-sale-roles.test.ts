import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categorizeProduct,classify} from '../lib/retailers.ts';
import type {Product} from '../lib/types.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/batch-eleven-sale-roles.json',import.meta.url),'utf8')) as {expectedCategory:Product['category'];product:Product}[];
for(const {expectedCategory,product} of fixtures)test('exact selected sale role: '+product.id,()=>{
 const result=categorizeProduct(product);assert.equal(result.category,expectedCategory,product.name);
 assert.deepEqual(result.offers,product.offers);assert.equal(result.sourceUrl,product.sourceUrl);assert.equal(result.id,product.id);
 assert.deepEqual(categorizeProduct(result),result,'normalization is idempotent');
 if(expectedCategory==='accessories'||expectedCategory==='mounting'||expectedCategory==='wiring'||expectedCategory==='electrical')assert.equal(result.configuration,undefined);
});
test('FridgePower selected expansion battery precedes parent AC station',()=>{
 assert.equal(classify('BLUETTI FridgePower - 2,016Wh Battery / 1,800W Output / LiFePO4 — 1 x FridgeBattery'),'batteries');
});
test('automatic interconnect controls and standalone battery chargers retain approved roles',()=>{
 for(const name of ['EG4 GridBOSS Microgrid Interconnect Device (MID)','Tigo 200A MCB Auto Transfer Switch (ATS)'])assert.equal(classify(name),'monitoring');
 assert.equal(classify('Manual Transfer Switch'),'electrical');
 assert.equal(classify('LiTime 12V (14.6V) 10A LiFePO4 Battery Charger Rechargeable for 12V Batteries — 1 Pack'),'accessories');
 assert.equal(classify('100AH 51.2V Lithium Battery with Max Charging & Discharging Current 100A'),'batteries');
});
test('category repair retains previously reviewed scalar and full specification evidence',()=>{
 const p=fixtures.find(f=>f.product.id==='shopsolar-54751581536396')!.product;
 const enriched={...p,specs:{...p.specs,capacityKwh:2.016,chemistry:'Reviewed LiFePO4'},specification:{summary:'Reviewed',groups:[],sources:[],notes:[]}} as Product;
 const result=categorizeProduct(enriched);assert.deepEqual(result.specs,enriched.specs);assert.deepEqual(result.specification,enriched.specification);
});
test('OUPES selected station bundle retains exact suffix panel counts',()=>{
 for(const {product} of fixtures.filter(f=>/^OUPES/.test(f.product.name))){const suffix=product.name.match(/240W Solar Panel\*(\d+)$/);if(!suffix)continue;const panels=categorizeProduct(product).configuration!.components.find(c=>c.type==='panels')!;assert.equal(panels.quantity,Number(suffix[1]));assert.equal(panels.detail,`240 W each · ${240*Number(suffix[1])} W array`);}
});
test('GoSun Fusion oven tilt legs are an appliance accessory',()=>{
 const p={...fixtures[0].product,id:'gosun-32376954454110',name:'Fusion Tilt Kit',brand:'GoSun',category:'mounting',sourceUrl:'https://gosun.co/products/fusion-tilt-kit-for-water-heating?variant=32376954454110',description:'The Fusion Tilt Kit is an add-on to convert your Fusion to heat water for showers. The kit includes two legs, cap and a clip to allow the Fusion Solar Oven to stand vertically.',specs:{mountType:'Hardware'}} as Product;
 assert.equal(categorizeProduct(p).category,'accessories');assert.equal(categorizeProduct(p).configuration,undefined);
 assert.equal(classify('Solar Panel Tilt Kit'),'mounting');
});
test('Lion UT1300 selected battery and charger bundle names both components',()=>{
 const title='UT 1300 BT-H + Battery Charger Bundle';const p={...fixtures[0].product,id:'lion-energy-48358378930405',name:title,category:'accessories',sourceUrl:'https://lionenergy.com/products/ut-1300-bt-h-battery-charger?variant=48358378930405',specs:{}} as Product;
 const result=categorizeProduct(p);assert.equal(result.category,'kits');assert.deepEqual(result.configuration!.components.map(c=>[c.type,c.quantity]),[['batteries',1],['charging',1]]);
 assert.equal(classify('UT 1300 Battery Charger'),'accessories');
});
