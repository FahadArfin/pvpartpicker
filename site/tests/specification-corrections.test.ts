import test from 'node:test';
import assert from 'node:assert/strict';
import {correctionLedger as ledger} from '../lib/specification-correction-guard.ts';
import {applyReviewedCorrections} from '../lib/specification-corrections.ts';
import {assertCorrectionWriteBoundary} from '../lib/specification-correction-guard.ts';
import {importReviewedSpecification} from '../lib/reviewed-specifications.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const products=()=>ledger.entries.map(e=>({id:e.id,...e.expected,brand:'Renogy',description:'',image:'',images:[],specs:e.expected.anchors,offers:[],verifiedAt:''} as Product));
const index=()=>Object.fromEntries(ledger.entries.map(e=>[e.id,clone(e.oldFullObject)])) as Record<string,ProductSpecification>;
const selectedVariants=Object.fromEntries(ledger.entries.map(e=>[e.id,{id:e.id.slice(7),sku:e.exactControllerSku,sourceUrl:e.expected.sourceUrl}]));
const sources=Object.fromEntries(ledger.sourceArtifacts.map(a=>[a.path,a.sha256]));
// A removed source/hash guard, wrong current/model column, lost provenance or restored length must fail these tests.
test('reviewed correction changes only nine full fields and removes five accessory lengths',()=>{
 const before=index(),ps=products(),snapshot=JSON.stringify(ps),unaffected=clone(before[ps[0].id]);before.other=unaffected;
 const {index:after,changes}=applyReviewedCorrections(before,ps,sources,selectedVariants);
 assert.equal(changes,14);assert.equal(JSON.stringify(ps),snapshot);assert.deepEqual(after.other,unaffected);
 for(const e of ledger.entries){const fields=after[e.id].groups.flatMap(g=>g.fields),oldFields=before[e.id].groups.flatMap(g=>g.fields);
 assert.equal(fields.find(f=>f.key==='chargeCurrentA')?.value,e.id.startsWith('renogy-431')?'20 A':'30 A');assert.equal(fields.find(f=>f.key==='length'),undefined);
 for(const f of oldFields.filter(f=>!e.changes.some(c=>c.key===f.key)))assert.deepEqual(fields.find(x=>x.key===f.key),f);
 assert.deepEqual(after[e.id].sources,before[e.id].sources);assert.deepEqual(after[e.id].identity,before[e.id].identity);assert.deepEqual(after[e.id].notes,before[e.id].notes);
 if(e.id.startsWith('renogy-431')){assert.equal(fields.find(f=>f.key==='dimensions')?.value,'210 x 151 x 68 mm');assert.equal(fields.find(f=>f.key==='weight')?.value,'1.4 kg');}
 for(const c of e.changes.filter(c=>c.replacement)){const f=fields.find(f=>f.key===c.key)!;assert.equal(f.kind,'manual');assert.equal(f.source,e.manualSource.url);}
 }
 assert.deepEqual(before,indexWithOther());
 function indexWithOther(){return {...index(),other:unaffected};}
});
test('identical reapplication changes zero entries and preserves bytes',()=>{const first=applyReviewedCorrections(index(),products(),sources,selectedVariants);const second=applyReviewedCorrections(first.index,products(),sources,selectedVariants);assert.equal(second.changes,0);assert.equal(JSON.stringify(second.index),JSON.stringify(first.index));});
test('all exact identity attributes, anchors, duplicate IDs and source byte mismatches fail closed',()=>{
 for(const mutation of ['id','name','sourceUrl','category','anchor','duplicate','sku']){const ps=products();if(mutation==='anchor')ps[0].specs={...ps[0].specs,chargeCurrentA:40};else if(mutation==='duplicate')ps.push(clone(ps[0]));else if(mutation==='sku')ps[0].offers=[{sku:'WRONG'} as Product['offers'][number]];else (ps[0] as unknown as Record<string,string>)[mutation]='changed';assert.throws(()=>applyReviewedCorrections(index(),ps,sources,selectedVariants),/Exact identity rejected/);}
 for(const a of ledger.sourceArtifacts){assert.throws(()=>applyReviewedCorrections(index(),products(),{...sources,[a.path]:'wrong'},selectedVariants),/Source bytes rejected/);const missing={...sources};delete missing[a.path];assert.throws(()=>applyReviewedCorrections(index(),products(),missing,selectedVariants),/Source bytes rejected/);}
});
test('changed full fields or unrelated whole-object data cannot bypass the reviewed precondition',()=>{for(const mutate of [(d:ProductSpecification)=>{d.groups[0].fields[0].value='changed';},(d:ProductSpecification)=>{d.notes.push('changed');}]){const prior=index();mutate(prior[products()[0].id]);assert.throws(()=>applyReviewedCorrections(prior,products(),sources,selectedVariants),/Old whole-object precondition/);}});
test('write boundary rejects generic regeneration and quarantined-field restoration',()=>{const ps=products(),corrected=applyReviewedCorrections(index(),ps,sources,selectedVariants).index;assert.doesNotThrow(()=>assertCorrectionWriteBoundary(ps,corrected));assert.throws(()=>assertCorrectionWriteBoundary(ps,index()));const regressed=clone(corrected);regressed[ps[0].id].groups[0].fields.push(clone(ledger.entries[0].changes.find(c=>c.key==='length')!.oldFullField));assert.throws(()=>assertCorrectionWriteBoundary(ps,regressed));assert.doesNotThrow(()=>assertCorrectionWriteBoundary([{...ps[0],id:'other'}],{other:index()[ps[0].id]}));});
test('future reviewed merge preserves corrected manual fields and stops restored parent accessory length',()=>{const p=products()[0],prior=applyReviewedCorrections(index(),products(),sources,selectedVariants).index[p.id],record={productIds:[p.id],expected:{[p.id]:ledger.entries[0].expected},kind:'manufacturer' as const,url:p.sourceUrl,rows:[['Rated charge current','40 A']]};const merged=importReviewedSpecification(p,[record],prior)!;assert.equal(merged.groups.flatMap(g=>g.fields).find(f=>f.key==='chargeCurrentA')?.value,'20 A');assert.throws(()=>importReviewedSpecification(p,[{...record,rows:[['Length','16.4 ft']]}],prior));});

test('independently selected source SKU mismatch must reject even when catalog anchors match',()=>{const selected=Object.fromEntries(ledger.entries.map(e=>[e.id,{id:e.id.slice(7),sku:e.exactControllerSku,sourceUrl:e.expected.sourceUrl}]));for(const key of ['sku','id','sourceUrl']){const wrong=clone(selected);wrong[ledger.entries[0].id][key as 'sku'|'id'|'sourceUrl']='wrong';assert.throws(()=>applyReviewedCorrections(index(),products(),sources,wrong),/Exact source SKU rejected/);}assert.throws(()=>applyReviewedCorrections(index(),products(),sources,{}),/Exact source SKU rejected/);});

test('ledger old full-field hash tampering is rejected before correction',()=>{const c=ledger.entries[0].changes[0],old=c.oldFieldSha256;try{c.oldFieldSha256='wrong';assert.throws(()=>applyReviewedCorrections(index(),products(),sources,selectedVariants),/Old field hash rejected/);}finally{c.oldFieldSha256=old;}});
test('quarantine source scope allows a future separately reviewed controller length manual',()=>{const ps=products(),corrected=applyReviewedCorrections(index(),ps,sources,selectedVariants).index;corrected[ps[0].id].groups[0].fields.push({key:'length',label:'Controller body length',value:'210 mm',source:'https://manufacturer.test/exact-controller-revision.pdf',kind:'manual'});assert.doesNotThrow(()=>assertCorrectionWriteBoundary(ps,corrected));});
