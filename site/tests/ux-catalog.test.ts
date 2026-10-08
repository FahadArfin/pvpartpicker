import test from 'node:test';
import assert from 'node:assert/strict';
import {manufacturerDisplay,manufacturerOptions,unknownManufacturer} from '../lib/manufacturer-display.ts';
import {comparisonRequest} from '../lib/comparison-request.ts';
import {comparisonRows} from '../lib/comparison-view.ts';
import type {Product} from '../lib/types.ts';
const panel:Product={id:'p',name:'Panel',brand:'Pecron',category:'panels',description:'',image:'',images:[],sourceUrl:'https://example.com/listing',verifiedAt:'',offers:[],specs:{voc:48}};
test('manufacturer aliases consolidate without mutating original brands; pseudo brands stay separate',()=>{
 assert.deepEqual(manufacturerOptions(['PECRON LLC','Pecron','pecron','Renogy','Unknown','ShopSolar']),['Pecron','Renogy',unknownManufacturer]);
 assert.equal(manufacturerDisplay('See manufacturer'),unknownManufacturer);assert.equal(manufacturerDisplay('ShopSolar.com'),unknownManufacturer);assert.equal(manufacturerDisplay('Renogy US'),'Renogy');assert.equal(manufacturerDisplay('RUIXU'),'RUiXU');assert.equal(manufacturerDisplay('Acme Inc.'),'Acme');assert.equal(manufacturerDisplay(''),unknownManufacturer);
 assert.equal(panel.brand,'Pecron');assert.equal(manufacturerDisplay('RICH SOLAR'),'Rich Solar');assert.equal(manufacturerDisplay('SUNGOLDPOWER'),'SunGoldPower');assert.equal(manufacturerDisplay('Sungold'),'SunGoldPower');assert.equal(manufacturerDisplay('My Store'),unknownManufacturer);
});
test('comparison requests bound evidence to four unique public selections',()=>{
 assert.deepEqual(comparisonRequest({productIds:['a','b']}),['a','b']);
 for(const value of [null,{}, {productIds:[]},{productIds:['a','a']},{productIds:['a','b','c','d','e']},{productIds:[1]}])assert.throws(()=>comparisonRequest(value));
});
test('detailed comparison uses sourced ratings, keeps missing values unknown, and computes differences',()=>{
 const sourced={...panel,id:'s',connectionSpecs:{voc:{key:'voc',label:'Voc',value:'48 V',source:'https://example.com/sheet',kind:'datasheet' as const}}};
 const rows=comparisonRows([sourced,panel],true),voc=rows.find(r=>r.key==='voc')!;
 assert.deepEqual(voc.values.map(v=>v.value),['48 V','—']);assert.equal(voc.different,true);assert.equal(voc.values[0].source,'https://example.com/sheet');
 assert.equal(comparisonRows([sourced,panel]).some(r=>r.key==='voc'),false);
 assert.equal(comparisonRows([sourced,sourced],true).find(r=>r.key==='voc')!.different,false);
 const estimate={...sourced,connectionSpecs:{voc:{...sourced.connectionSpecs.voc,value:'Approx 48 V'}}};
 assert.equal(comparisonRows([estimate],true).find(r=>r.key==='voc')!.values[0].value,'—');
});
test('category-specific fields stay N/A for another category and empty cabinets',()=>{
 const battery={...panel,id:'b',category:'batteries' as const,specs:{batteryKind:'Battery cabinets'}};
 const rows=comparisonRows([panel,battery],true);
 assert.equal(rows.find(r=>r.key==='voc')!.values[1].value,'N/A');
 assert.equal(rows.find(r=>r.key==='maxChargeCurrent')!.values[1].value,'N/A');
});
