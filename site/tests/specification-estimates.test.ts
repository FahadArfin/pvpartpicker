import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateSpecifications,applicableEstimates,estimateIdentity} from '../lib/specification-estimates.ts';
import {buildSpecification,applySpecificationEvidence} from '../lib/specifications.ts';
import type {Product,Specs} from '../lib/types.ts';
const panel=(id:string,watts=100):Product=>({id,name:'Rigid monocrystalline panel '+id,brand:'Test',category:'panels',description:'',image:'',images:[],sourceUrl:'https://example.com/'+id,specs:{watts,panelType:'Rigid',systemVoltage:12},offers:[],verifiedAt:''});
const peer=(id:string)=>{const p=panel(id);p.specification=buildSpecification(p,{url:p.sourceUrl+'.pdf',kind:'datasheet',rows:[['Maximum power at STC','100 W'],['Open circuit voltage','24 V'],['Maximum power voltage','20 V'],['Maximum power current','5 A'],['Short circuit current','5.5 A'],['Module efficiency','20 %']]});return p;};
test('panel estimates require three independent compatible reference models and retain source links',()=>{
 const p=panel('target'),e=estimateSpecifications(p,[peer('a'),peer('b'),peer('c')]);
 assert.equal(e.find(x=>x.key==='stc.voc')?.value,'~22.8–25.2 V');
 assert.equal(e.find(x=>x.key==='stc.voc')?.references.length,3);
 assert.ok(!estimateSpecifications(p,[peer('a'),{...peer('a'),id:'duplicate'},peer('b')]).some(x=>x.key==='stc.voc'));
});
test('estimates never replace published ratings or enter compatibility values',()=>{
 const p=peer('target'),before=JSON.stringify(p),e=estimateSpecifications(p,[peer('a'),peer('b'),peer('c')]);
 assert.ok(!e.some(x=>x.key==='stc.voc'));
 assert.equal(JSON.stringify(p),before);assert.equal(applySpecificationEvidence(panel('target'),{}).specs.voc,undefined);
});
test('different panel formats, voltage classes, unknown formats and bundles do not borrow electrical ratings',()=>{
 const refs=[peer('a'),peer('b'),peer('c')];
 for(const p of ([{...panel('x'),name:'Flexible panel',specs:{watts:100,panelType:'Flexible',systemVoltage:12}},{...panel('x'),specs:{watts:100,panelType:'Rigid',systemVoltage:24}},{...panel('x'),name:'Panel',specs:{watts:100}},{...panel('x'),category:'kits' as const}] as Product[]))assert.ok(!estimateSpecifications(p,refs).some(x=>x.key==='stc.voc'));
});
test('NOCT-like power is a labelled modeled range with temperature assumptions, not a published NOCT value',()=>{
 const e=estimateSpecifications(panel('target'),[]),f=e.find(x=>x.key==='modeledPower');
 assert.equal(f?.value,'~72–76 W');assert.match(f!.basis,/45°C/);assert.ok(f!.references.some(x=>x.url.includes('sandia')));
 assert.ok(!e.some(x=>x.key.startsWith('noct.')));
});
test('battery energy estimate uses explicitly listed voltage and Ah, and excludes cabinets and ambiguous system classes',()=>{
 const battery={...panel('battery'),name:'Battery',category:'batteries' as const,specs:{voltage:51.2,capacityAh:100}};
 assert.equal(estimateSpecifications(battery,[]).find(x=>x.key==='capacityKwh')?.value,'~5.12 kWh');
 for(const specs of ([{systemVoltage:48,capacityAh:100},{voltage:51.2,capacityAh:100,batteryKind:'Battery cabinets'}] as Specs[]))assert.equal(estimateSpecifications({...battery,specs},[]).length,0);
});
test('untyped accessories and electrical protection devices get no guessed limits',()=>{
 for(const category of ['accessories','electrical','wiring'] as const)assert.equal(estimateSpecifications({...panel('x'),category},[peer('a'),peer('b'),peer('c')]).length,0);
});
test('detail estimates are invalidated after variant changes and verified overrides',()=>{
 const p=panel('x'),fields=estimateSpecifications(p,[peer('a'),peer('b'),peer('c')]),record={identity:estimateIdentity(p),fields};
 assert.ok(applicableEstimates(p,record).length);
 assert.equal(applicableEstimates({...p,specs:{...p.specs,watts:200}},record).length,0);
 const exact={...p,specification:peer('x').specification};
 assert.ok(!applicableEstimates(exact,record).some(f=>f.key==='stc.voc'));
});
test('dual-unit weights select the numeric value adjacent to kg, never treating pounds as kg',()=>{
 const peers=['a','b','c'].map(id=>{const p=peer(id);p.specification=buildSpecification(p,{url:p.sourceUrl+'.pdf',kind:'datasheet',rows:[['Maximum power at STC','100 W'],['Weight','13.89lbs / 6.3kg']]});return p;});
 assert.equal(estimateSpecifications(panel('target'),peers).find(f=>f.key==='weight')?.value,'~5.98–6.62 kg');
});
test('owner-corrected raw measurements suppress the corresponding comparison estimates',()=>{
 const p=panel('x'),fields=estimateSpecifications(p,[peer('a'),peer('b'),peer('c')]),record={identity:estimateIdentity(p),fields};
 assert.ok(!applicableEstimates({...p,specs:{...p.specs,voc:25}},record).some(f=>f.key==='stc.voc'));
 const weightRecord={identity:estimateIdentity(p),fields:[{key:'weight',label:'Weight',value:'~5–6 kg',basis:'Peers',references:[]}]};
 assert.equal(applicableEstimates({...p,specs:{...p.specs,weight:30}},weightRecord).length,0);
});
