import test from 'node:test';
import assert from 'node:assert/strict';
import {categorizeProduct,extractSpecs,classify} from '../lib/retailers.ts';
import {checkCompatibility} from '../lib/domain.ts';
import type {Product} from '../lib/types.ts';

function product(name:string,category:Product['category'],specs:Product['specs']={}):Product {
 return {id:'saved-part',name,category,brand:'Test',description:'',image:'',images:[],sourceUrl:'https://example.com/part',specs,offers:[{id:'saved-offer',retailerId:'test',retailer:'Test',url:'https://example.com/part',price:100,currency:'USD',packQuantity:1,stock:'in_stock',condition:'new',observedAt:'2026-10-04T00:00:00Z'}],verifiedAt:'2026-10-04T00:00:00Z'};
}

test('empty battery cabinets move out of electrical without changing saved IDs or prices',()=>{
 const original=product('10 Slot Battery Cabinet | Wheels & Busbar Included | Pre-assembled','electrical');
 const updated=categorizeProduct(original);
 assert.equal(updated.category,'batteries');
 assert.equal(updated.specs.batteryKind,'Battery cabinets');
 assert.equal(updated.id,original.id);assert.deepEqual(updated.offers,original.offers);
 assert.equal(original.category,'electrical');
 assert.equal(classify('Battery cabinet enclosure with busbars'),'batteries');
 assert.equal(categorizeProduct(product('48V 100Ah LiFePO4 Battery Cabinet Energy Storage','batteries')).specs.batteryKind,'Battery modules');
});

test('stackable battery modules and panel technologies get explicit, source-derived specs',()=>{
 assert.equal(extractSpecs('EcoFlow OCEAN PRO 10kWh Battery Module | Stackable to 80kWh','batteries').formFactor,'Stackable');
 assert.equal(extractSpecs('Wall-mounted stackable battery module','batteries').formFactor,'Stackable');
 assert.equal(extractSpecs('P-type monofacial back contact solar panel','panels').cellType,'P-type');
 assert.equal(extractSpecs('P-type monofacial back contact solar panel','panels').face,'Monofacial');
 assert.equal(extractSpecs('P-type monofacial back contact solar panel','panels').technology,'Back contact');
 assert.equal(extractSpecs('Perovskite tandem solar panel','panels').cellType,'Perovskite');
 assert.equal(extractSpecs('N-type 450W solar panel','panels').face,undefined);
});

test('inverter rated power ignores surge, PV input, and ambiguous model numbers',()=>{
 assert.equal(extractSpecs('12kW 48V Inverter Charger | 36,000W Surge | 120/240V Output','inverters').outputWatts,12000);
 assert.equal(extractSpecs('10kW 48V Solar Inverter | Dual MPPT 11,000W PV Input','inverters').outputWatts,10000);
 assert.equal(extractSpecs('Hybrid inverter | 25kW PV Input | 12kW Backup','inverters').outputWatts,12000);
 assert.equal(extractSpecs('Hybrid inverter | 40kW Solar Input','inverters').outputWatts,undefined);
 assert.equal(extractSpecs('EG4 18kPV Hybrid Inverter','inverters').outputWatts,undefined);
 assert.equal(extractSpecs('2000W/3000W 12V Inverter Charger — 3000W','inverters').outputWatts,3000);
 assert.equal(extractSpecs('6,500W 120/240V Hybrid Inverter | 48V Battery','inverters').systemVoltageV,48);
});

test('electrical and accessory subcategories identify the main sale item',()=>{
 for(const [name,type] of [['250A Busbar Set','Busbars'],['ANL Fuse Cover','Fuses'],['Thermal Circuit Breaker — 40A','Circuit breakers'],['Rigid Metal Conduit Body','Conduit'],['Conext Battery Fuse Combiner Box','Boxes & combiners']]) {
  assert.equal(extractSpecs(name,'electrical').electricalType,type);
 }
 for(const [name,type] of [['Emporia Level 2 EV Charger','EV charging'],['EG4 Chargeverter Battery Charger','Battery chargers'],['SolaX Battery Base','Battery bases & stands'],['LCD Screen Kit','Displays & controls'],['Wifi Adapter','Adapters & communications'],['Mini Split Heat Pump','Appliances']]) {
  assert.equal(extractSpecs(name,'accessories').accessoryType,type);
 }
});

test('empty battery cabinets do not participate in battery compatibility checks',()=>{
 const cabinet=categorizeProduct(product('6 Slot Battery Cabinet | Busbar Included','electrical'));
 const inverter=product('48V Inverter','inverters',{voltage:48,batteryMinV:46,batteryMaxV:60});
 const checks=checkCompatibility([cabinet,inverter],{purpose:'offgrid',mount:'roof'});
 assert.ok(!checks.some(c=>c.title==='Battery voltage'||c.title==='Battery communication & certification'));
});

test('labeled panel specs use product evidence, not comparisons to other panel types',()=>{
 const p=product('Runergy 405W Solar Panel','panels');
 p.description='Specifications: Cell Type: Monocrystalline P-Type PERC Cell Count: 108. Panel Face: Bifacial.';
 const updated=categorizeProduct(p);
 assert.equal(updated.specs.cellType,'P-type');assert.equal(updated.specs.technology,'PERC');assert.equal(updated.specs.face,'Bifacial');
 const comparison=product('N-type solar panel','panels');comparison.description='Better yield than conventional P-type monofacial panels with back contact cells.';
 const unchanged=categorizeProduct(comparison);
 assert.equal(unchanged.specs.cellType,'N-type');assert.equal(unchanged.specs.face,undefined);assert.equal(unchanged.specs.technology,undefined);
 const known=product('100/175/200W N-Type Solar Panel — 100W / 1 Piece','panels');known.sourceUrl='https://www.renogy.com/products/renogy-n-type-solar-panel?variant=43232667795571';
 assert.equal(categorizeProduct(known).specs.face,'Monofacial');
 const backContact=product('Used SunPower 327W Solar Panel COM','panels');backContact.id='santan-solar-spr-e20-327-com-u';
 assert.equal(categorizeProduct(backContact).specs.technology,'Back contact');
 assert.match(String(categorizeProduct(backContact).specs.technologySource),/^https:\/\/www.sec.gov\//);
 assert.equal(extractSpecs('MRCOOL Mini Split Heat Pump | Smart Controls','accessories').accessoryType,'Appliances');
});

test('power and voltage filters consolidate exact specs into non-overlapping choices',async()=>{
 const {matchesAttribute,getFilterOptions}=await import('../lib/catalog-filters.ts');
 for(const [watts,range] of [[0,'0-150'],[149,'0-150'],[150,'150-350'],[349,'150-350'],[350,'350-450'],[449,'350-450'],[450,'450+'],[700,'450+']] as const) {
  const p=product('Panel','panels',{watts});assert.ok(matchesAttribute(p,'watts',range));
  assert.equal(getFilterOptions('panels','watts',[p]).filter(o=>matchesAttribute(p,'watts',o.value)).length,1);
 }
 const p=product('Battery','batteries',{voltage:51.2});
 assert.ok(matchesAttribute(p,'voltage','48'));assert.equal(p.specs.voltage,51.2);
 assert.ok(matchesAttribute(product('Battery','batteries',{voltage:12.8}),'voltage','12'));
 assert.ok(!matchesAttribute(product('Unlisted','panels'),'watts','0-150'));
 assert.ok(!matchesAttribute(product('Unknown inverter','inverters',{watts:36000}),'outputWatts','18+'));
 assert.ok(matchesAttribute(product('Inverter','inverters',{outputWatts:18000}),'outputWatts','18+'));
 assert.ok(matchesAttribute(product('Inverter','inverters',{outputWatts:15000}),'outputWatts','12-18'));
 for(const n of [1,2000,2001,4000,4001,6000,6001,8000,8001,12000,12001,17999,18000,25000]) {
  const inverter=product('Inverter','inverters',{outputWatts:n});
  assert.equal(getFilterOptions('inverters','outputWatts',[inverter]).filter(o=>matchesAttribute(inverter,'outputWatts',o.value)).length,1);
 }
 assert.deepEqual(getFilterOptions('inverters','voltage',[]).map(o=>o.value),['12','24','48','120','400']);
 assert.ok(!matchesAttribute(product('120V AC inverter','inverters',{voltage:120}),'voltage','120'));
});

test('requested future panel types remain available but chemistry is hidden unless it varies',async()=>{
 const {getFilterOptions,matchesAttribute}=await import('../lib/catalog-filters.ts');
 const panels=[product('Panel','panels',{cellType:'N-type',face:'Bifacial',technology:'IBC'})];
 assert.deepEqual(getFilterOptions('panels','cellType',panels).map(o=>o.value),['N-type','P-type','Perovskite']);
 assert.deepEqual(getFilterOptions('panels','face',panels).map(o=>o.value),['Monofacial','Bifacial']);
 assert.ok(getFilterOptions('panels','technology',panels).some(o=>o.value==='Back contact'));
 assert.ok(matchesAttribute(panels[0],'technology','Back contact'));
 assert.deepEqual(getFilterOptions('batteries','chemistry',[product('Battery','batteries',{chemistry:'LiFePO4'})]),[]);
 assert.equal(getFilterOptions('batteries','chemistry',[product('LFP','batteries',{chemistry:'LiFePO4'}),product('Lead','batteries',{chemistry:'Lead acid'})]).length,2);
 assert.ok(getFilterOptions('batteries','formFactor',[]).some(o=>o.value==='Stackable'));
});
