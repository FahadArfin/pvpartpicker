import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSpecification,applySpecificationEvidence,specificationDisplayGroups} from '../lib/specifications.ts';
import {serializePageCatalog} from '../lib/catalog-transport.ts';
import type {Product} from '../lib/types.ts';
const source='https://manufacturer.example/panel.pdf';
const panel:Product={id:'175w',name:'100/175/200W N-Type Solar Panel — 175W / 1 Piece',brand:'Renogy',category:'panels',description:'200W panel marketing text '.repeat(100),specs:{watts:175,cellType:'N-type'},image:'',images:[],sourceUrl:'https://manufacturer.example/product?variant=175',offers:[],verifiedAt:'2026-10-05T00:00:00Z'};
const field=(s:ReturnType<typeof buildSpecification>,key:string)=>s.groups.flatMap(g=>g.fields).find(f=>f.key===key);
test('mixed energy and Ah capacity notation does not turn watt-hours into amp-hours',()=>{
 const p={...panel,category:'all-in-one' as const,specs:{}};
 const details=buildSpecification(p,{url:source,kind:'manual',rows:[['Capacity','3072Wh(51.2V60Ah)']]});
 assert.equal(field(details,'capacityAh'),undefined);assert.equal(field(details,'capacityKwh')?.value,'3072Wh(51.2V60Ah)');
});
test('misaligned recovery rows with DC voltage/current cannot become AC output power',()=>{
 const p={...panel,category:'all-in-one' as const,specs:{}};
 const details=buildSpecification(p,{url:source,kind:'manual',rows:[['AC Output','12V-5A 12V-5A'],['Maximum PV input power','120 V'],['Surge Power','50 A']]});
 assert.equal(field(details,'outputWatts'),undefined);assert.equal(field(details,'maxPvWatts'),undefined);assert.equal(field(details,'surgeWatts'),undefined);
 const actual=buildSpecification(p,{url:source,kind:'manual',rows:[['AC Output','3600 W at 120 V']]});assert.equal(field(actual,'outputWatts')?.value,'3600 W at 120 V');
});
test('exact panel sheet data gives STC ratings without inventing NOCT electrical values',()=>{
 const s=buildSpecification(panel,{url:source,kind:'datasheet',model:'RSP175DC',rows:[['Maximum Power at STC','175 W'],['Optimum Operating Voltage (Vmp)','20.88 V'],['Optimum Operating Current (Imp)','8.38 A'],['Open Circuit Voltage (Voc)','24.48 V'],['Short Circuit Current (Isc)','8.88 A'],['Module Efficiency','20.6 %'],['Nominal Operating Cell Temperature (NOCT)','45 ± 2 °C'],['Temperature Coefficient of Voc','-0.26 %/°C'],['Weight','9.6 kg']]} );
 assert.equal(s.panelRatings?.stc.voc,'24.48 V');assert.equal(s.panelRatings?.stc.pmax,'175 W');assert.equal(s.panelRatings?.noct.voc,undefined);
 assert.equal(field(s,'moduleEfficiency')?.value,'20.6 %');assert.equal(field(s,'noctTemperature')?.value,'45 ± 2 °C');assert.equal(field(s,'vocTemperatureCoefficient')?.value,'-0.26 %/°C');
 assert.ok(s.summary.length<220);assert.ok(!s.summary.includes('marketing'));assert.equal(s.sources[0].url,source);
});
test('STC and NOCT table columns stay separate and select only the matching wattage',()=>{
 const s=buildSpecification(panel,{url:source,kind:'datasheet',rows:[['Parameter','STC','NOCT'],['Maximum Power (Pmax)','175 W','130 W'],['Open Circuit Voltage (Voc)','24.48 V','22.9 V'],['Maximum Power Voltage (Vmp)','20.88 V','18.9 V'],['Maximum Power Current (Imp)','8.38 A','6.88 A'],['Short Circuit Current (Isc)','8.88 A','7.1 A']]} );
 assert.equal(s.panelRatings?.stc.pmax,'175 W');assert.equal(s.panelRatings?.noct.pmax,'130 W');assert.equal(s.panelRatings?.noct.isc,'7.1 A');
 const multi=buildSpecification(panel,{url:source,kind:'datasheet',rows:[['Model','RSP100DC','RSP175DC','RSP200DC'],['Maximum Power at STC','100 W','175 W','200 W'],['Open Circuit Voltage (Voc)','22.79 V','24.48 V','37.44 V']]});
 assert.equal(multi.panelRatings?.stc.voc,'24.48 V');
});
test('shared 200W description is rejected for a 175W variant; electrical values never guessed',()=>{
 const s=buildSpecification(panel,{url:panel.sourceUrl,kind:'manufacturer',rows:[['Max Power at STC','200W'],['Open Circuit Voltage','23V'],['Module Efficiency','19.2%']]});
 assert.equal(s.panelRatings?.stc.voc,undefined);assert.equal(field(s,'moduleEfficiency'),undefined);assert.ok(s.notes.some(n=>n.includes('variant')));
});
test('each equipment category uses technical groups and a short summary',()=>{
 const battery={...panel,category:'batteries',name:'48V 100Ah server rack battery',specs:{voltage:51.2,capacityKwh:5.12,chemistry:'LiFePO4'}} as Product;
 const s=buildSpecification(battery,{url:source,kind:'datasheet',rows:[['Nominal Voltage','51.2 V'],['Rated Capacity','100 Ah'],['Maximum Continuous Discharge Current','100 A'],['Communication','CAN / RS485'],['Dimensions','440 × 470 × 155 mm']]});
 assert.equal(field(s,'maxDischargeCurrent')?.value,'100 A');assert.equal(field(s,'communications')?.value,'CAN / RS485');assert.equal(field(s,'dimensions')?.value,'440 × 470 × 155 mm');assert.equal(s.panelRatings,undefined);
 const inv=buildSpecification({...panel,category:'inverters',name:'6kW hybrid inverter',specs:{outputWatts:6000}},{url:source,kind:'datasheet',rows:[['Maximum PV Input Voltage','500 V'],['MPPT Voltage Range','120–450 V'],['Number of MPPTs','2'],['Rated AC Output Power','6000 W']]});
 assert.equal(field(inv,'maxPvVoltage')?.value,'500 V');assert.equal(field(inv,'mpptVoltageRange')?.value,'120–450 V');
});
test('enrichment survives stored catalog updates, retains prices, and stays out of shared-page transport',()=>{
 const details=buildSpecification(panel,{url:source,kind:'datasheet',rows:[['Maximum Power at STC','175 W'],['Open Circuit Voltage (Voc)','24.48 V']]});
 const enriched=applySpecificationEvidence(panel,{[panel.id]:details});
 assert.equal(enriched.specification?.panelRatings?.stc.voc,'24.48 V');assert.equal(enriched.specs.voc,24.48);assert.deepEqual(enriched.offers,panel.offers);assert.equal(panel.specs.voc,undefined);
 const transported=JSON.parse(serializePageCatalog({products:[enriched],reports:[]})).products[0];assert.equal(transported.specification,undefined);assert.equal(transported.specs.voc,24.48);
});
test('prose and a different STC variant cannot masquerade as numeric ratings',()=>{
 const battery={...panel,category:'batteries',specs:{voltage:48}} as Product;
 const s=buildSpecification(battery,{url:source,kind:'datasheet',rows:[['System Voltage 48V','batteries in parallel, ensure all'],['Nominal Voltage','51.2V'],['Max Charge Current','150A']]});
 assert.equal(field(s,'voltage')?.value,'51.2V');assert.equal(field(s,'maxChargeCurrent')?.value,'150A');
 const mismatch=buildSpecification(panel,{url:source,kind:'datasheet',rows:[['Parameter','STC','NOCT'],['Maximum Power (Pmax)','200 W','150 W'],['Voc','23 V','21 V']]});assert.equal(mismatch.panelRatings?.stc.voc,undefined);
});
test('database enrichment precedes owner corrections and preserves live offers',async()=>{
 const {readCatalog}=await import('../lib/catalog-reader.ts');
 const details=buildSpecification(panel,{url:source,kind:'datasheet',rows:[['Maximum Power at STC','175 W'],['Open Circuit Voltage (Voc)','24.48 V']]});
 const offer={id:'live',retailerId:'shop',retailer:'Shop',url:'https://example.com',price:99,currency:'USD',packQuantity:1,stock:'in_stock',observedAt:panel.verifiedAt,condition:'new'};
 const db={prepare(){return {};},async batch(){return [[{json:JSON.stringify(panel)}],[{product_id:panel.id,json:JSON.stringify(offer)}],[{id:panel.id,json:JSON.stringify({specs:{voc:24.5}})}],[],[]].map(results=>({results}));}} as unknown as D1Database;
 const catalog=await readCatalog(db,{products:[panel],reports:[],generatedAt:panel.verifiedAt},{[panel.id]:details});
 assert.equal(catalog.products[0].specs.voc,24.5);assert.equal(catalog.products[0].specification?.panelRatings?.stc.voc,'24.48 V');assert.equal(catalog.products[0].offers[0].price,99);
 const empty={prepare(){return {};},async batch(){return [[],[],[],[],[]].map(results=>({results}));}} as unknown as D1Database;
 assert.equal((await readCatalog(empty,{products:[panel],reports:[],generatedAt:null},{[panel.id]:details})).products[0].specs.voc,24.48);
 assert.equal(applySpecificationEvidence({...panel,specs:{watts:200}},{[panel.id]:details}).specification,undefined);
});
test('missing core specs are shown as unverified without inventing stored measurements',()=>{
 const battery={...panel,category:'batteries',specs:{voltage:48}} as Product;
 const details=buildSpecification(battery),groups=specificationDisplayGroups(battery,details);
 assert.equal(groups.flatMap(g=>g.fields).find(f=>f.key==='maxDischargeCurrent')?.value,'Not verified');assert.equal(field(details,'maxDischargeCurrent'),undefined);
 const dc={...battery,category:'all-in-one',specs:{stationType:'DC-only station (no AC inverter)'}} as Product;
 assert.ok(!specificationDisplayGroups(dc,buildSpecification(dc)).flatMap(g=>g.fields).some(f=>f.key==='outputWatts'));
});
test('panel gain and cell efficiency never substitute for front-side STC/module ratings',()=>{
 const s=buildSpecification(panel,{url:source,kind:'manufacturer',rows:[['Maximum Power at STC','175 W'],['Maximum Power Current (Imp)','8.38 A - 10.0 A (bifacial boost)'],['Cell Efficiency','25 %'],['Module Efficiency','Up to 27.9%']]});
 assert.equal(s.panelRatings?.stc.imp,undefined);assert.equal(field(s,'cellEfficiency')?.value,'25 %');assert.equal(field(s,'moduleEfficiency'),undefined);
});
