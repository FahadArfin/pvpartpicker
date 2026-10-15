import {assertCorrectionWriteBoundary} from './specification-correction-guard.ts';
/** Offline, hash-bound quarantine migration; never overwrites or infers a rating. */
import {createHash} from 'node:crypto';
import {quarantineLedger,quarantineIdentityMatches,assertQuarantineWriteBoundary} from './specification-quarantine-guard.ts';
import type {Product,ProductSpecification} from './types.ts';
export const quarantineSha256=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex');
function sorted(value:unknown):unknown{return Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,sorted((value as Record<string,unknown>)[k])])):value;}
export const quarantineObjectSha256=(v:unknown)=>quarantineSha256(JSON.stringify(sorted(v)));
export function applyReviewedQuarantines(prior:Record<string,ProductSpecification>,products:Product[],sourceHashes:Record<string,string>,selected:Record<string,{id:string;sku:string;sourceUrl:string}>){
 const next={...prior};let changes=0;const differences:{id:string;key:string;old:unknown;replacement:null}[]=[];
 for(const e of quarantineLedger.entries){
  for(const a of e.sourceArtifacts)if(sourceHashes[a.path]!==a.sha256)throw Error('Source bytes rejected '+a.path);
  const ps=products.filter(p=>p.id===e.id);if(ps.length!==1||!quarantineIdentityMatches(ps[0],e))throw Error('Exact quarantine identity rejected '+e.id);
  const v=selected[e.id];if(!v||v.id!==e.id.slice(7)||v.sku!==e.exactSourceSku||v.sourceUrl!==e.expected.sourceUrl)throw Error('Exact source SKU rejected '+e.id);
  if(!prior[e.id])throw Error('Missing quarantine target '+e.id);
  const d=structuredClone(prior[e.id]),fields=d.groups.flatMap(g=>g.fields);
  if(d.identity&&(d.identity.name!==e.expected.name||d.identity.category!==e.expected.category||d.identity.sourceUrl!==e.expected.sourceUrl||Object.entries(d.identity.anchors).some(([k,v])=>ps[0].specs[k]!==v)))throw Error('Stored quarantine identity rejected '+e.id);
  for(const f of e.protectedManualFields)if(!fields.some(x=>quarantineObjectSha256(x)===quarantineObjectSha256(f)))throw Error('Protected manual field missing or changed '+e.id+':'+f.key);
  for(const q of e.quarantineFields){
   if(quarantineObjectSha256(q.field)!==q.fieldSha256)throw Error('Ledger field hash rejected '+e.id+':'+q.field.key);
   const matches=d.groups.flatMap(g=>g.fields.filter(f=>f.key===q.field.key&&f.source===q.field.source&&f.kind===q.field.kind).map(f=>({group:g,field:f})));
   if(!matches.length)continue; // An already quarantined tuple is an idempotent no-op.
   if(matches.length!==1||matches[0].group.title!==q.groupTitle||quarantineObjectSha256(matches[0].field)!==q.fieldSha256)throw Error('Exact old field precondition rejected '+e.id+':'+q.field.key);
   matches[0].group.fields=matches[0].group.fields.filter(f=>f!==matches[0].field);changes++;differences.push({id:e.id,key:q.field.key,old:q.field,replacement:null});
  }
  next[e.id]=d;
 }
 assertQuarantineWriteBoundary(products,next);
 assertCorrectionWriteBoundary(products,next);
 return {index:next,changes,differences};
}
