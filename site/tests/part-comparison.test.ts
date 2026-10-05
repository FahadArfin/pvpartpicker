import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonEvidence,partColumns,partValue,productListName,productListVariant,sortPartsByColumn} from '../lib/part-comparison.ts';
import {serializePageCatalog} from '../lib/catalog-transport.ts';
import type {Product,Category} from '../lib/types.ts';
const p=(name:string,category:Category,specs:Product['specs']={}):Product=>({id:name,name,category,specs,brand:'Renogy',description:'',image:'',images:[],sourceUrl:'https://example.com/selected-sku',verifiedAt:'2026-10-05',offers:[]});

test('short names retain model codes while wattage and selected pack move out of the name',()=>{
 const panel=p('Renogy RSP175DC 175 Watt N-Type Monocrystalline Solar Panel — 4 Pieces','panels',{watts:175});
 assert.equal(productListName(panel),'Renogy RSP175DC N-Type Solar Panel');
 assert.equal(productListVariant(panel),'4 Pieces');assert.equal(partValue(panel,'watts').value,'175 W');
 const inverter=p('Victron MultiPlus-II 48/10000/140-100 230V','inverters');
 assert.equal(productListName(inverter),'Victron MultiPlus-II 48/10000/140-100');
 assert.equal(productListName(p('Renogy Core Mini - LiFePO4 12.8V 300/200/100Ah Lithium Batteries','batteries')),'Renogy Core Mini Lithium Batteries');
});
test('marketing prefixes and pipe-separated model names do not obscure identity',()=>{
 const panel={...p('FIRE SALE | Canadian Solar 695W N-Type TOPCon Bifacial Solar Panel | Up to 840W Bifacial | CS7N-695-TB-AG | 21.55 kW Full Pallet (31)','panels'),brand:'Canadian Solar'};
 assert.equal(productListName(panel),'Canadian Solar CS7N-695-TB-AG');
 assert.equal(panel.name.includes('Full Pallet'),true);
 const inverter={...p('EG4 | 6000XP Off-Grid Inverter','inverters'),brand:'EG4',comparisonSpecs:{model:{value:'1511090'}}};
 assert.equal(productListName(inverter),'EG4 6000XP Off-Grid Inverter');
 assert.match(productListName(p('Renogy Battery Management System','monitoring')),/Management System/);
 assert.equal(productListName({...p('10 Slot Battery Cabinet | Wheels & Busbar Included | Pre-assembled','batteries'),brand:'Ruixu',comparisonSpecs:{model:{value:'Pre-assembled'}}}),'Ruixu 10 Slot Battery Cabinet');
});
test('matched technical evidence survives catalog transport without the full specification body',()=>{
 const battery=p('Battery','batteries',{voltage:48,capacityAh:100});
 battery.specification={summary:'',notes:[],sources:[{kind:'datasheet',label:'Matched sheet',url:'https://example.com/sheet'}],groups:[{title:'Electrical',fields:[{key:'voltage',label:'Nominal voltage',value:'51.2 V',source:'https://example.com/sheet',kind:'datasheet'},{key:'capacityAh',label:'Capacity',value:'100 Ah',source:'https://example.com/sheet',kind:'datasheet'},{key:'cycleLife',label:'Life',value:'6,000',source:'https://example.com/sheet',kind:'datasheet'}]}]};
 const transported=JSON.parse(serializePageCatalog({products:[battery],reports:[]})).products[0] as Product;
 assert.equal(transported.specification,undefined);assert.equal(transported.comparisonSpecs?.cycleLife,undefined);
 assert.equal(partValue(transported,'voltage').value,'51.2 V');
 assert.equal(partValue(transported,'capacityKwh').value,'5.12 kWh');
 assert.match(partValue(transported,'capacityKwh').note!,/Calculated nominal/);
 assert.equal(battery.specs.voltage,48);
});
test('output and PV ratings stay separate; multi-tracker current is never summed or taken from Isc',()=>{
 const inverter=p('18kPV Hybrid Inverter','inverters',{watts:18000,maxPvIsc:31,systemVoltageV:48});
 inverter.comparisonSpecs={outputWatts:{value:'12000 W'},maxPvWatts:{value:'18000 W'},maxMpptCurrent:{value:'25 A / 15 A / 15 A'}};
 assert.equal(partValue(inverter,'outputWatts').value,'12 kW');assert.equal(partValue(inverter,'maxPvWatts').value,'18 kW');
 assert.equal(partValue(inverter,'maxMpptCurrent').value,'25 A / 15 A / 15 A');
 assert.equal(partValue(inverter,'systemVoltage').value,'48 V');
 delete inverter.comparisonSpecs.maxMpptCurrent;
 assert.equal(partValue(inverter,'maxMpptCurrent').value,'—');
 delete inverter.comparisonSpecs.outputWatts;
 assert.equal(partValue(inverter,'outputWatts').value,'—');
});
test('DC-only stations and empty cabinets are not displayed as missing AC inverters or storage modules',()=>{
 const cabinet=p('Battery Cabinet','batteries',{batteryKind:'Battery cabinets'});
 assert.equal(partValue(cabinet,'capacityKwh').value,'N/A');assert.equal(partValue(cabinet,'maxDischargeCurrent').value,'N/A');
 assert.equal(partValue(p('TRAIL','all-in-one',{stationType:'DC-only station (no AC inverter)'}),'outputWatts').value,'DC only');
 assert.equal(partValue(p('12V Battery','batteries',{voltage:12,capacityAh:100}),'capacityKwh').value,'—');
});
test('column sorting normalizes Wh/kWh and W/kW and keeps unknown ratings last in both directions',()=>{
 const a=p('A','all-in-one'),b=p('B','all-in-one'),c=p('C','all-in-one');
 a.comparisonSpecs={capacityKwh:{value:'2048 Wh'},outputWatts:{value:'1500 W'}};b.comparisonSpecs={capacityKwh:{value:'1 kWh'},outputWatts:{value:'2 kW'}};
 assert.deepEqual(sortPartsByColumn([a,c,b],'capacityKwh','asc').map(p=>p.name),['B','A','C']);
 assert.deepEqual(sortPartsByColumn([a,c,b],'outputWatts','desc').map(p=>p.name),['B','A','C']);
 assert.equal(partColumns.inverters.some(c=>c.key==='maxMpptCurrent'),true);
});
test('optional bundle components and selected variants do not disappear behind a common short name',()=>{
 const kit=p('EcoFlow DELTA 3 Max Portable Power Station — Black + 2 x 200W panels','kits');
 kit.configuration={kind:'combo',family:'delta',title:'EcoFlow DELTA 3 Max · Black + 2 x 200W panels',selection:'Black + 2 x 200W panels',type:'Power station combos',components:[{type:'power-station',quantity:1,detail:'EcoFlow DELTA 3 Max'},{type:'panels',quantity:2,detail:'200 W each'}]};
 assert.equal(productListName(kit),'EcoFlow DELTA 3 Max Bundle');assert.equal(productListVariant(kit),'Black + 2 x 200W panels');assert.equal(partValue(kit,'contents').value,'1 × station + 2 × panels');
});
