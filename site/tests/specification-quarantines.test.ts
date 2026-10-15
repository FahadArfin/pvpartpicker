import test from 'node:test';
import assert from 'node:assert/strict';
import fixtureData from './fixtures/specification-quarantines.json' with {type:'json'};
import {buildSpecification,applySpecificationEvidence} from '../lib/specifications.ts';
import {importReviewedSpecification} from '../lib/reviewed-specifications.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
const fixtures=fixtureData as unknown as {product:Product;before:ProductSpecification;rows:string[][]}[];
const removed=[['altitude'],['operatingTemperature','storageTemperature','ipRating'],['operatingTemperature','storageTemperature','ipRating'],['operatingTemperature']];
const keys=(s?:ProductSpecification)=>s?.groups.flatMap(g=>g.fields.map(f=>f.key))||[];
// Removing quarantine from generation or attachment would restore the exact source errors.
test('generation and runtime attachment suppress only eight reviewed source errors',()=>{
 for(const [i,{product:p,before,rows}]of fixtures.entries()){
  const snapshot=JSON.stringify(before),generated=buildSpecification(p,{url:p.sourceUrl,kind:'manufacturer',rows}),attached=applySpecificationEvidence(p,{[p.id]:before});
  for(const key of removed[i]){assert.ok(!keys(generated).includes(key),p.id+': generation '+key);assert.ok(!keys(attached.specification).includes(key),p.id+': runtime '+key);}
  assert.equal(JSON.stringify(before),snapshot);assert.deepEqual(attached.specification?.sources,before.sources);
  for(const field of before.groups.flatMap(g=>g.fields).filter(f=>!removed[i].includes(f.key)))assert.ok(attached.specification?.groups.some(g=>g.fields.some(f=>JSON.stringify(f)===JSON.stringify(field))));
 }
});
test('reviewed reimport and no-new-record path cannot restore quarantined prior fields',()=>{
 for(const [i,{product:p,before,rows}]of fixtures.entries()){
  const expected={name:p.name,sourceUrl:p.sourceUrl,category:p.category,anchors:{}},record={productIds:[p.id],expected:{[p.id]:expected},url:p.sourceUrl,kind:'manufacturer' as const,rows};
  for(const records of [[],[record]]){const result=importReviewedSpecification(p,records,before);for(const key of removed[i])assert.ok(!keys(result).includes(key));assert.deepEqual(result?.sources,before.sources);}
 }
});
import {quarantineLedger,quarantineSpecification,assertQuarantineWriteBoundary} from '../lib/specification-quarantine-guard.ts';
import {applyReviewedQuarantines} from '../lib/specification-quarantines.ts';
const fixtureIndex=()=>Object.fromEntries(fixtures.map(f=>[f.product.id,structuredClone(f.before)]));
const products=()=>fixtures.map(f=>structuredClone(f.product));
const sourceHashes=Object.fromEntries(quarantineLedger.entries.flatMap(e=>e.sourceArtifacts.map(a=>[a.path,a.sha256])));
const selected=Object.fromEntries(quarantineLedger.entries.map(e=>[e.id,{id:e.id.slice(7),sku:e.exactSourceSku,sourceUrl:e.expected.sourceUrl}]));
test('runtime rejects changed selection and writer fails closed on any restored tuple',()=>{
 const {product:p,before}=fixtures[1];
 for(const mutate of [(p:Product)=>p.name+=' revised',(p:Product)=>p.sourceUrl+='&different=true',(p:Product)=>p.category='accessories',(p:Product)=>p.specs.chargeCurrentA=20,(p:Product)=>p.offers[0].sku='same-name-different-sku',(p:Product)=>p.offers[0].packQuantity=2,(p:Product)=>p.offers[0].condition='used']){const bad=structuredClone(p);mutate(bad);assert.throws(()=>quarantineSpecification(bad,before),/identity rejected/);assert.equal(applySpecificationEvidence({...bad,specification:before},{[p.id]:before}).specification,undefined);}
 assert.throws(()=>assertQuarantineWriteBoundary([p],{[p.id]:before}),/write boundary/);
 const sibling={...p,id:'renogy-sibling'};assert.equal(quarantineSpecification(sibling,before),before);
});
test('guard preserves separately sourced, differently qualified and manual facts',()=>{
 const {product:p,before}=fixtures[1],old=before.groups.flatMap(g=>g.fields).find(f=>f.key==='operatingTemperature')!;
 for(const field of [{...old,source:'https://www.renogy.com/new-exact-model.pdf'},{...old,kind:'manual' as const},{...old,value:old.value+' (derated)'},{...old,value:'-20°C to 50°C'}]){const d={...before,groups:[{title:'Protection & environment',fields:[field]}]};assert.equal(quarantineSpecification(p,d),d);}
 const relabeled={...before,groups:[{title:'Other',fields:[{...old,label:'Ambient temperature'}]}]};assert.equal(quarantineSpecification(p,relabeled)?.groups[0].fields.length,0);
});
test('offline migration removes eight exact tuples and preserves new unrelated data and all provenance',()=>{
 const before=fixtureIndex(),p=products();before.other=structuredClone(fixtures[2].before);before[p[0].id].notes.push('Later reviewed note');before[p[0].id].groups[0].fields.push({key:'future',label:'Future field',value:'retained',source:'https://example.test/manual.pdf',kind:'manual'});const snapshot=JSON.stringify(before);
 const result=applyReviewedQuarantines(before,p,sourceHashes,selected);assert.equal(result.changes,8);assert.equal(JSON.stringify(before),snapshot);assert.deepEqual(result.index.other,before.other);
 for(const [i,f]of fixtures.entries()){const after=result.index[f.product.id];for(const key of removed[i])assert.ok(!keys(after).includes(key));assert.deepEqual(after.sources,before[f.product.id].sources);assert.deepEqual(after.notes,before[f.product.id].notes);for(const old of before[f.product.id].groups.flatMap(g=>g.fields).filter(x=>!removed[i].includes(x.key)))assert.ok(after.groups.some(g=>g.fields.some(x=>JSON.stringify(x)===JSON.stringify(old))));}
 assert.equal(result.index[p[0].id].groups.flatMap(g=>g.fields).filter(f=>f.kind==='manual').length,6);
 const rerun=applyReviewedQuarantines(result.index,p,sourceHashes,selected);assert.equal(rerun.changes,0);assert.deepEqual(rerun.index,result.index);
});
test('migration rejects changed source bytes, source SKU, duplicate identities, missing target and tampered field hash',()=>{
 for(const artifact of quarantineLedger.entries.flatMap(e=>e.sourceArtifacts))assert.throws(()=>applyReviewedQuarantines(fixtureIndex(),products(),{...sourceHashes,[artifact.path]:'wrong'},selected),/Source bytes/);
 for(const key of ['sku','id','sourceUrl'] as const){const bad=structuredClone(selected);bad[fixtures[0].product.id][key]='wrong';assert.throws(()=>applyReviewedQuarantines(fixtureIndex(),products(),sourceHashes,bad),/source SKU/);}
 const dup=products();dup.push(dup[0]);assert.throws(()=>applyReviewedQuarantines(fixtureIndex(),dup,sourceHashes,selected),/identity/);
 const missing=fixtureIndex();delete missing[fixtures[0].product.id];assert.throws(()=>applyReviewedQuarantines(missing,products(),sourceHashes,selected),/Missing/);
 const changed=fixtureIndex();changed[fixtures[1].product.id].groups.flatMap(g=>g.fields).find(f=>f.key==='operatingTemperature')!.value='different source condition';assert.throws(()=>applyReviewedQuarantines(changed,products(),sourceHashes,selected),/field precondition/);
 const q=quarantineLedger.entries[0].quarantineFields[0],hash=q.fieldSha256;try{q.fieldSha256='wrong';assert.throws(()=>applyReviewedQuarantines(fixtureIndex(),products(),sourceHashes,selected),/field hash/);}finally{q.fieldSha256=hash;}
 const lostManual=fixtureIndex();lostManual[fixtures[0].product.id].groups[0].fields=lostManual[fixtures[0].product.id].groups[0].fields.filter(f=>f.kind!=='manual');assert.throws(()=>applyReviewedQuarantines(lostManual,products(),sourceHashes,selected),/Protected manual/);
});
import {comparisonRows} from '../lib/comparison-view.ts';
test('runtime attachment clears stale projected quarantine values before comparison fallback',()=>{
 const {product:p,before}=fixtures[1],field=before.groups.flatMap(g=>g.fields).find(f=>f.key==='operatingTemperature')!;
 const cached={...p,specification:before,comparisonSpecs:{operatingTemperature:{value:field.value,source:field.source}},connectionSpecs:{operatingTemperature:field}};
 const next=applySpecificationEvidence(cached,{[p.id]:before});
 assert.equal(comparisonRows([next],true).find(r=>r.key==='operatingTemperature')?.values[0].value,'—');
 assert.equal(next.connectionSpecs?.operatingTemperature,undefined);
});
test('raw Rover Lite selection attaches retained facts before PV limit hydration',()=>{
 const {product,before}=fixtures[3],raw=structuredClone(product);delete raw.specs.maxPvVoltage;
 const attached=applySpecificationEvidence(raw,{[raw.id]:before});
 assert.equal(attached.specification?.groups.flatMap(g=>g.fields).find(f=>f.key==='storageTemperature')?.value,'-40℉~176℉ /-40 ℃~ 80℃');
 assert.equal(attached.specs.maxPvVoltage,150);assert.ok(!keys(attached.specification).includes('operatingTemperature'));
});

import {readCatalog} from '../lib/catalog-reader.ts';
async function hydrateQuarantineFixture(product:Product,before:ProductSpecification,offers=product.offers){
 const db={prepare:()=>({}),batch:async()=>[
  {results:[{json:JSON.stringify({...product,offers:[]})}]},
  {results:offers.map(o=>({product_id:product.id,json:JSON.stringify(o)}))},
  {results:[]},{results:[]},{results:[]}
 ]} as unknown as D1Database;
 return readCatalog(db,{products:[],reports:[],generatedAt:null},{[product.id]:before});
}
test('database offer hydration retains good quarantine-product facts and removes reviewed errors',async()=>{
 for(const [i,{product,before}] of fixtures.entries()){
  const catalog=await hydrateQuarantineFixture(product,before);
  assert.equal(catalog.storage,'database');
  const actual=catalog.products.find(p=>p.id===product.id)!;
  assert.ok(actual.specification,product.id+' retained facts must attach after offers hydrate');
  for(const key of removed[i])assert.ok(!keys(actual.specification).includes(key));
  for(const f of before.groups.flatMap(g=>g.fields).filter(f=>!removed[i].includes(f.key)))assert.ok(actual.specification.groups.some(g=>g.fields.some(a=>JSON.stringify(a)===JSON.stringify(f))));
 }
});
test('database hydrated quarantine selection rejects mismatched SKU, pack and condition',async()=>{
 const {product,before}=fixtures[1];
 for(const change of [{sku:'different'},{packQuantity:2},{condition:'used' as const}]){
  const catalog=await hydrateQuarantineFixture(product,before,[{...product.offers[0],...change}]);
  assert.equal(catalog.storage,'database');
  assert.equal(catalog.products[0].specification,undefined);
 }
});
