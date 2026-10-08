import test from 'node:test';
import assert from 'node:assert/strict';
import {readGuidePosition,saveGuidePosition} from '../lib/guide-reading.ts';
import {conductorInputResistance} from '../lib/conductor-inputs.ts';
import {conductorComparison,conductorResistance} from '../lib/calculator-exploration.ts';
import {calculate} from '../lib/guide-calculators.ts';
test('saved guide positions recover valid chapter/offset and ignore corrupt storage',()=>{
 const position={section:'lesson-2',offset:-250,updatedAt:123};
 const stored=saveGuidePosition('{broken','voltage-drop',position);
 assert.deepEqual(readGuidePosition(stored,'voltage-drop'),position);
 assert.equal(readGuidePosition(stored,'other-chapter'),undefined);
 for(const text of ['null','[]','{broken','{"x":{"section":"a","offset":1e10,"updatedAt":1}}'])assert.equal(readGuidePosition(text,'x'),undefined);
});
test('guide position registry bounds its saved entries and retains the most recent chapter',()=>{
 let stored='{}';for(let i=0;i<80;i++)stored=saveGuidePosition(stored,'chapter-'+i,{section:'lesson-0',offset:0,updatedAt:i});
 assert.equal(Object.keys(JSON.parse(stored)).length,60);assert.ok(readGuidePosition(stored,'chapter-79'));assert.equal(readGuidePosition(stored,'chapter-0'),undefined);
});
test('one conductor resistance drives main voltage result, chart and selected table row',()=>{
 for(const material of ['copper','aluminum'] as const){
  const resistance=conductorInputResistance('6 AWG',material,'75',undefined);
  assert.equal(resistance,conductorResistance('6 AWG',material,75));
  const main=calculate('voltage',{voltage:48,currentA:30,lengthFt:40,ohmsPerKft:resistance});
  const row=conductorComparison({voltage:48,currentA:30,targetPercent:3,temperatureC:75,material,lengths:[40]}).find(r=>r.gauge==='6 AWG')!;
  assert.ok(Math.abs(Number(main.raw.dropPercent)-row.cells[0].dropPercent)<1e-10);
 }
});
test('manual resistance applies only to its selected gauge and invalid overrides reject',()=>{
 assert.equal(conductorInputResistance('6 AWG','copper','75','0.6'),.6);
 const rows=conductorComparison({voltage:48,currentA:30,targetPercent:3,temperatureC:75,material:'copper',lengths:[40],resistanceOverride:{gauge:'6 AWG',resistance:.6}});
 assert.equal(rows.find(r=>r.gauge==='6 AWG')!.cells[0].dropVolts,1.44);
 assert.equal(rows.find(r=>r.gauge==='4 AWG')!.resistance,conductorResistance('4 AWG','copper',75));
 for(const manual of ['', '0','-1','NaN','1001'])assert.throws(()=>conductorInputResistance('6 AWG','copper','75',manual));
 assert.throws(()=>conductorInputResistance('6 AWG','copper','',undefined));
});
