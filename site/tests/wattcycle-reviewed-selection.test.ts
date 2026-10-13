import test from 'node:test';import assert from 'node:assert/strict';
import {isWattcycleReviewedListing,matchesWattcycleReviewedMetadata,matchesWattcycleReviewedSelection,canAttachWattcycleReviewedEvidence,assertWattcycleReviewedRegeneration} from '../lib/wattcycle-reviewed-selection.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
import fixture from './fixtures/wattcycle-reviewed-migration.json' with {type:'json'};
const products=fixture.products as unknown as Product[],evidence=fixture.evidence as Record<string,ProductSpecification>;
test('only the three source-approved exact current WattLINK selections grant evidence',()=>{
 assert.deepEqual(products.map(p=>p.id),['wattcycle-67838376313128','wattcycle-67838376345896','wattcycle-67838376378664']);
 for(const p of products){assert(isWattcycleReviewedListing(p));assert(matchesWattcycleReviewedMetadata(p));assert(matchesWattcycleReviewedSelection(p));for(const field of ['name','sourceUrl','category'] as const){const q=structuredClone(p);q[field]='changed' as never;assert(!matchesWattcycleReviewedSelection(q));}const old=structuredClone(p);old.name=old.name.slice('⚡️Early Bird⚡️ '.length);assert(!matchesWattcycleReviewedSelection(old));}
 for(const id of ['wattcycle-51806480859432','wattcycle-52163504668968','unapproved'])assert(!isWattcycleReviewedListing({id}));
});
test('missing/finally mapped or colliding offers and recorded-package changes hold exact metadata',()=>{
 for(const p of products){const missing={...p,offers:[]};assert(matchesWattcycleReviewedMetadata(missing));assert(!matchesWattcycleReviewedSelection(missing));for(const [key,value]of [['id','changed'],['retailerId','other'],['url',p.sourceUrl+'&variant=0'],['sku','manufacturer SKU is not catalog variant ID'],['packQuantity',9],['recordedPackQuantity',9]] as const){const q=structuredClone(p);Object.assign(q.offers[0],{[key]:value});assert(!matchesWattcycleReviewedSelection(q));}assert(!matchesWattcycleReviewedSelection({...p,offers:[...p.offers,{...p.offers[0],id:'mapped-collision'}]}));}
});
test('normal price/stock/history updates preserve the model selection without rewriting offers',()=>{for(const p of products){const q=structuredClone(p);q.offers[0].price=77;q.offers[0].stock='out_of_stock';q.offers[0].observedAt='2026-10-14T00:00:00Z';const before=JSON.stringify(q);assert(matchesWattcycleReviewedSelection(q));assert.equal(JSON.stringify(q),before);}});
test('default CI protects the actual approved field and complete source scope',()=>{
 assertWattcycleReviewedRegeneration(products,evidence);
 for(const p of products){assert(canAttachWattcycleReviewedEvidence(p,evidence[p.id]));
  for(const mutate of [(d:ProductSpecification)=>{d.identity!.name+=' other';},(d:ProductSpecification)=>{d.sources.shift();},(d:ProductSpecification)=>{d.groups[0].fields[0].value+=' other';},(d:ProductSpecification)=>{d.groups[0].fields.push({...d.groups[0].fields[0]});}]){const changed=structuredClone(evidence);mutate(changed[p.id]);assert(!canAttachWattcycleReviewedEvidence(p,changed[p.id]));assert.throws(()=>assertWattcycleReviewedRegeneration(products,changed));}
 }
 const cable=products[0];for(const value of ['BLUETTI 51.2V; voltage difference ≤1V','BLUETTI 51.2V; SOC within 1% and voltage difference ≤1V']){const changed=structuredClone(evidence);changed[cable.id].groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility')!.value=value;assert.throws(()=>assertWattcycleReviewedRegeneration(products,changed));}
 assert.throws(()=>assertWattcycleReviewedRegeneration([...products,products[0]],evidence));
 for(const p of products){const changed=structuredClone(products);changed.find(q=>q.id===p.id)!.offers[0].packQuantity=9;assert.throws(()=>assertWattcycleReviewedRegeneration(changed,evidence));}
});
const writer=assertWattcycleReviewedRegeneration as (p:Product[],index:Record<string,ProductSpecification>,prior?:Record<string,ProductSpecification>)=>void;
test('writer preserves unchanged verified objects during partial-category and retired-listing batches',()=>{
 for(const subset of [[],products.slice(0,1),[{...products[0],id:'unrelated',offers:[]}]] as Product[][]){assert.doesNotThrow(()=>writer(subset,structuredClone(evidence),evidence));assert.throws(()=>writer(subset,evidence));}
 const held=structuredClone(products);held[0].name+=' changed';held[1].offers[0].packQuantity=9;held[2].offers[0].sku='changed';
 assert.doesNotThrow(()=>writer(held,structuredClone(evidence),evidence));
 for(const p of held)assert(!canAttachWattcycleReviewedEvidence(p,evidence[p.id]));
});
test('writer cannot modify any whole protected object under absent or invalid raw selections',()=>{
 for(const p of products){for(const mutate of [(d:ProductSpecification)=>{d.notes.push('new');},(d:ProductSpecification)=>{d.summary+=' new';},(d:ProductSpecification)=>{d.groups.push({title:'Additional',fields:[{key:'new',label:'New',value:'New',source:p.sourceUrl,kind:'manufacturer'}]});},(d:ProductSpecification)=>{d.sources.push({url:p.sourceUrl,kind:'manufacturer',label:'new'});},(d:ProductSpecification)=>{d.sources.shift();},(d:ProductSpecification)=>{d.groups[0].fields[0].value+=' changed';},(d:ProductSpecification)=>{d.identity!.name+=' changed';}]){
  const changed=structuredClone(evidence);mutate(changed[p.id]);assert.throws(()=>writer([],changed,evidence));const held=structuredClone(products);held.find(q=>q.id===p.id)!.offers[0].sku='changed';assert.throws(()=>writer(held,changed,evidence));
 }}
 assert.throws(()=>writer([],evidence,{}));
 for(const p of products){for(const mutate of [(d:ProductSpecification)=>{d.sources.shift();},(d:ProductSpecification)=>{d.groups[0].fields[0].value+=' changed';},(d:ProductSpecification)=>{d.identity!.name+=' changed';}]){const bad=structuredClone(evidence);mutate(bad[p.id]);assert.throws(()=>writer([],bad,bad));assert.throws(()=>writer([],evidence,bad));}const missing=structuredClone(evidence);delete missing[p.id];assert.throws(()=>writer([],missing,evidence));assert.throws(()=>writer([],evidence,missing));}
 assert.throws(()=>writer([...products,products[0]],evidence,evidence));
 const unrelated={...products[0],id:'unrelated'};assert.throws(()=>writer([unrelated,unrelated],evidence,evidence));
});
test('writer permits independently reviewed additions only with current raw selection and protected scope',()=>{
 const changed=structuredClone(evidence);changed[products[0].id].groups.push({title:'Additional reviewed',fields:[{key:'new',label:'New',value:'Verified',source:products[0].sourceUrl,kind:'manufacturer'}]});
 assert.doesNotThrow(()=>writer(products,changed,evidence));assert(canAttachWattcycleReviewedEvidence(products[0],changed[products[0].id]));assert.throws(()=>writer([],changed,evidence));
});
