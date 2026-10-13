import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {readCatalog} from '../lib/catalog-reader.ts';
import * as selection from '../lib/wattcycle-reviewed-selection.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
const packet=process.env.PVP_WATTCYCLE_MIGRATION_PACKET;
const modulePath=new URL('../lib/wattcycle-identity-migration.ts',import.meta.url);
// The initial red run exercises the real absent migration through readCatalog,
// so the failure is missing source attachment, not an import-resolution error.
async function migration():Promise<typeof import('../lib/wattcycle-identity-migration.ts')|undefined>{return existsSync(modulePath)?await import(modulePath.href):undefined;}
function read(path:string){return JSON.parse(readFileSync(path,'utf8'));}
function fixture(){
 assert(packet);const proposal=read(resolve(packet,'inputs/component-eighteen-wattcycle-identity-proposal-v2.json'));
 const index=read(resolve(packet,'baseline/specifications.json')) as Record<string,ProductSpecification>;
 const cases=[...proposal.unconditionalExactBundleIdentityCandidates,{id:proposal.conditionalCableCorrectionAndIdentityProposal.productId,currentExpectedIdentity:proposal.conditionalCableCorrectionAndIdentityProposal.proposedCurrentIdentity}];
 const products:Product[]=cases.map(c=>({id:c.id,...c.currentExpectedIdentity,specs:{...c.currentExpectedIdentity.anchors},brand:'WattCycle',description:'',image:'',images:[],verifiedAt:'2026-10-13T00:39:43Z',offers:[{id:c.id,retailerId:'wattcycle',retailer:'WattCycle',url:c.currentExpectedIdentity.sourceUrl,sku:c.id.slice('wattcycle-'.length),packQuantity:1,price:42,currency:'USD',stock:'in_stock',condition:'new',observedAt:'2026-10-13T00:39:43Z'}]}));
 const manifest=read(resolve(packet,'manifest.json'));const files:Record<string,Uint8Array>={'manifest.json':readFileSync(resolve(packet,'manifest.json'))};for(const f of manifest.files)files[f.path]=readFileSync(resolve(packet,f.path));
 return {proposal,index,products,files};
}
function database(products:Product[]){return {prepare(sql:string){return sql;},async batch(){return [{results:products.map(p=>({json:JSON.stringify({...p,offers:[]})}))},{results:products.flatMap(p=>p.offers.map(o=>({product_id:p.id,json:JSON.stringify(o)})))},{results:[]},{results:[]},{results:[]}];}} as unknown as D1Database;}
test('approved migration attaches all three exact current metadata selections through real readCatalog',{skip:!packet},async()=>{
 const f=fixture(),m=await migration(),before=JSON.stringify(f.index),offerBytes=JSON.stringify(f.products.map(p=>p.offers));
 const next=m?m.applyWattcycleIdentityMigration(f.index,f.products,f.files).index:f.index;
 const catalog=await readCatalog(database(f.products),{products:[],reports:[],generatedAt:null},next);
 assert.equal(catalog.storage,'database');
 assert.equal(catalog.products.filter(p=>p.specification).length,3,'Current exact selected metadata must attach all approved source facts');
 const cable=catalog.products.find(p=>p.id==='wattcycle-67838376313128')!;
 const value=cable.specification!.groups.flatMap(g=>g.fields).find(v=>v.key==='compatibility')!.value;
 assert.match(value,/tightly matched SOC/);assert.match(value,/voltage difference ≤1V/);assert.match(value,/official B300 pilot battery first/);
 assert.equal(JSON.stringify(f.index),before);assert.equal(JSON.stringify(catalog.products.map(p=>p.offers)),offerBytes);
});
test('migration preserves every untargeted object, replaces one existing field and is byte-idempotent',{skip:!packet},async()=>{
 const f=fixture(),m=await migration();assert(m,'Exact migration must exist');const next=m.applyWattcycleIdentityMigration(f.index,f.products,f.files),ids=new Set(f.products.map(p=>p.id));
 assert.equal(next.identitiesChanged,3);assert.equal(next.correctedExistingFields,1);assert.equal(next.newTechnicalFields,0);assert.equal(next.researchFillCredit,0);
 for(const [id,old]of Object.entries(f.index))if(!ids.has(id))assert.deepEqual(next.index[id],old,id);
 for(const p of f.products){const old=f.index[p.id],n=next.index[p.id];assert.deepEqual(n.notes,old.notes);assert.deepEqual(n.panelRatings,old.panelRatings);for(const s of old.sources)assert(n.sources.some(x=>JSON.stringify(x)===JSON.stringify(s)));for(const field of old.groups.flatMap(g=>g.fields))if(p.id!=='wattcycle-67838376313128'||field.key!=='compatibility')assert(n.groups.flatMap(g=>g.fields).some(v=>JSON.stringify(v)===JSON.stringify(field)));}
 const again=m.applyWattcycleIdentityMigration(next.index,f.products,f.files);assert.equal(again.identitiesChanged,0);assert.equal(again.correctedExistingFields,0);assert.equal(JSON.stringify(again.index),JSON.stringify(next.index));
});
test('approved frozen source bytes and complete old objects are mandatory',{skip:!packet},async()=>{
 const f=fixture(),m=await migration();assert(m);const paths=['manifest.json','inputs/component-eighteen-wattcycle-identity-proposal-v2.json','sources/wattcycle-67838376313128/current.html','sources/wattcycle-67838376345896/original.html','baseline/specifications.json'];
 for(const path of paths){const files={...f.files,[path]:Buffer.from('changed source')};assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,f.products,files),/source|packet|manifest|hash/i,path);}
 for(const id of f.products.map(p=>p.id)){for(const mutate of [(d:ProductSpecification)=>{d.notes.push('changed');},(d:ProductSpecification)=>{d.groups[0].fields[0].value+=' changed';},(d:ProductSpecification)=>{d.sources[0].label+=' changed';},(d:ProductSpecification)=>{d.identity!.name+=' changed';}]){const index=structuredClone(f.index);mutate(index[id]);assert.throws(()=>m.applyWattcycleIdentityMigration(index,f.products,f.files),/old|object|precondition/i,id);}}
});
test('exact current identity and final offer guard reject collisions and changed selected packages',{skip:!packet},async()=>{
 const f=fixture(),m=await migration();assert(m);
 for(const id of f.products.map(p=>p.id)){
  for(const mutate of [(p:Product)=>{p.name+=' arbitrary prefix';},(p:Product)=>{p.sourceUrl+='&variant=0';},(p:Product)=>{p.category='panels';},(p:Product)=>{p.offers[0].id+=' other';},(p:Product)=>{p.offers[0].sku='other';},(p:Product)=>{p.offers[0].retailerId='other';},(p:Product)=>{p.offers[0].url+='&variant=0';},(p:Product)=>{p.offers[0].packQuantity=9;},(p:Product)=>{p.offers.push({...p.offers[0],id:'collision'});},(p:Product)=>{p.offers=[];}]){const ps=structuredClone(f.products);mutate(ps.find(p=>p.id===id)!);assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,ps,f.files),/selection|identity|offer|collision/i,id);}
  assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,[...f.products,structuredClone(f.products.find(p=>p.id===id)!)],f.files),/collision|unique/i,id);
 }
 const anchors=structuredClone(f.products);anchors.find(p=>p.id==='wattcycle-67838376313128')!.specs.voltage=24;assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,anchors,f.files),/identity|anchor|selection/i);
 const extra={...structuredClone(f.products[0]),id:'untargeted-duplicate'};assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,[...f.products,extra,structuredClone(extra)],f.files),/collision|unique/i);
 const recorded=structuredClone(f.products);recorded[0].offers[0].recordedPackQuantity=9;assert.throws(()=>m.applyWattcycleIdentityMigration(f.index,recorded,f.files),/selection|offer|package/i);
});
test('regeneration boundary rejects reintroduced incomplete SOC conditions and unapproved source/name changes',{skip:!packet},async()=>{
 const f=fixture(),m=await migration();assert(m);const next=m.applyWattcycleIdentityMigration(f.index,f.products,f.files).index;
 m.assertWattcycleMigrationWriteBoundary(f.products,next,f.files);
 for(const value of [f.index['wattcycle-67838376313128'].groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility')!.value,'BLUETTI 51.2V; voltage difference ≤1V.','BLUETTI 51.2V; SOC within 1% and voltage difference ≤1V.']){const index=structuredClone(next);index['wattcycle-67838376313128'].groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility')!.value=value;assert.throws(()=>m.assertWattcycleMigrationWriteBoundary(f.products,index,f.files),/boundary|corrected|object/i);}
 const changed=structuredClone(next);changed['wattcycle-67838376345896'].identity!.name+=' other';assert.throws(()=>m.assertWattcycleMigrationWriteBoundary(f.products,changed,f.files),/boundary|object/i);
});
test('proposed runtime evidence gate refuses incomplete SOC, wrong source and selected-offer changes',{skip:!packet},async()=>{
 const f=fixture(),m=await migration();assert(m);const index=m.applyWattcycleIdentityMigration(f.index,f.products,f.files).index;
 const gate=(selection as unknown as {canAttachWattcycleReviewedEvidence?:(p:Product,d:ProductSpecification)=>boolean}).canAttachWattcycleReviewedEvidence||(()=>false);
 for(const p of f.products)assert(gate(p,index[p.id]),'Exact migrated current selection and reviewed field/source must grant evidence');
 const cable=f.products.find(p=>p.id==='wattcycle-67838376313128')!;for(const value of [f.index[cable.id].groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility')!.value,'SOC inferred1%; voltage difference≤1V']){const d=structuredClone(index[cable.id]);d.groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility')!.value=value;assert(!gate(cable,d));}
 const wrong=structuredClone(index[cable.id]);wrong.sources=wrong.sources.filter(s=>s.url!==cable.sourceUrl||s.kind!=='manufacturer');assert(!gate(cable,wrong));
 for(const p of f.products){const changed=structuredClone(p);changed.offers[0].sku='changed';assert(!gate(changed,index[p.id]));}
});
