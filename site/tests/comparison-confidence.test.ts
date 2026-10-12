import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonRows,comparisonCoverage} from '../lib/comparison-view.ts';
import type {Product} from '../lib/types.ts';

const product=(id:string,category:Product['category']='panels'):Product=>({id,name:id,brand:'Test',category,description:'',image:'',images:[],sourceUrl:'https://example.com/listing',verifiedAt:'',specs:{},offers:[]});
const rating=(key:string,value:string)=>({key,label:key,value,source:'https://example.com/model-sheet',kind:'datasheet' as const});

test('comparison coverage includes missing ratings even when the differences view hides equal unknowns',()=>{
 const products=[product('a'),product('b')];
 const rows=comparisonRows(products,true);
 assert.equal(rows.find(r=>r.key==='voc')!.different,false);
 const coverage=comparisonCoverage(rows,products);
 assert.equal(coverage[0].missing,rows.length);
 assert.equal(coverage[1].missing,rows.length);
 assert.equal(coverage[0].applicable,rows.length);
});

test('detailed sourced ratings normalize bare units and retain provenance; unreferenced values stay unknown',()=>{
 const a={...product('a'),connectionSpecs:{voc:rating('voc','48')}};
 const b={...product('b'),comparisonSpecs:{voc:{value:'48 V'}}};
 const row=comparisonRows([a,b],true).find(r=>r.key==='voc')!;
 assert.deepEqual(row.values.map(v=>v.value),['48 V','—']);
 assert.equal(row.values[0].source,'https://example.com/model-sheet');
 assert.equal(row.different,true);
});

test('charge controllers and stations expose relevant sourced limits without accepting inferred raw electrical data',()=>{
 for(const category of ['charging','all-in-one'] as const){
  const a={...product('a',category),connectionSpecs:{mpptVoltageRange:rating('mpptVoltageRange','60–145 V')},specs:{mpptCount:2}};
  const rows=comparisonRows([a],true);
  assert.equal(rows.find(r=>r.key==='mpptVoltageRange')!.values[0].value,'60–145 V');
  assert.equal(rows.find(r=>r.key==='mpptCount')!.values[0].value,'—');
 }
});

test('category exclusions do not count as missing evidence and unknown claims never appear as measurements',()=>{
 const a={...product('a'),specs:{watts:'Estimated 400 W'}};
 const b={...product('b','batteries'),specs:{batteryKind:'Battery cabinets'}};
 const rows=comparisonRows([a,b],true);
 assert.equal(rows.find(r=>r.key==='watts')!.values[0].value,'—');
 assert.equal(rows.find(r=>r.key==='voc')!.values[1].value,'N/A');
 const coverage=comparisonCoverage(rows,[a,b]);
 assert.ok(coverage[1].applicable<rows.length);
 assert.equal(coverage[1].missing,coverage[1].applicable-1); // the documented empty-cabinet format is known
});

test('equal ratings from different sources remain equal; a sourced rating versus unknown stays a difference',()=>{
 const a={...product('a'),connectionSpecs:{voc:rating('voc','48 V')}};
 const b={...product('b'),connectionSpecs:{voc:{...rating('voc','48 V'),source:'https://example.org/sheet'}}};
 assert.equal(comparisonRows([a,b],true).find(r=>r.key==='voc')!.different,false);
 assert.equal(comparisonRows([a,product('c')],true).find(r=>r.key==='voc')!.different,true);
 assert.deepEqual([a.id,b.id],['a','b']);
});

test('sourced base-column limits override lightweight inferred fields without changing selections',()=>{
 const a={...product('exact','inverters'),specs:{maxMpptCurrent:99},connectionSpecs:{maxMpptCurrent:rating('maxMpptCurrent','16 A')}};
 const row=comparisonRows([a],true).find(r=>r.key==='maxMpptCurrent')!;
 assert.equal(row.values[0].value,'16 A');
 assert.equal(row.values[0].source,'https://example.com/model-sheet');
 assert.equal(a.specs.maxMpptCurrent,99);
});

test('differences ignore harmless decimal and unit spacing while retaining changed electrical ratings',()=>{
 const a={...product('a'),connectionSpecs:{voc:rating('voc','48.0 V')}};
 const b={...product('b'),connectionSpecs:{voc:rating('voc','48V')}};
 const c={...product('c'),connectionSpecs:{voc:rating('voc','49 V')}};
 assert.equal(comparisonRows([a,b],true).find(r=>r.key==='voc')!.different,false);
 assert.equal(comparisonRows([a,c],true).find(r=>r.key==='voc')!.different,true);
 assert.equal(comparisonRows([a,b],true).find(r=>r.key==='voc')!.values[0].value,'48.0 V');
});
