/** Offline explicit corrections. Never use this to merge generic stronger fields. */
import {createHash} from 'node:crypto';
import {correctionLedger,correctionIdentityMatches,sameCorrectionObject} from './specification-correction-guard.ts';
import type {CorrectionEntry} from './specification-correction-guard.ts';
import type {Product,ProductSpecification} from './types.ts';
export const correctionSha256=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
function correctedObject(e:CorrectionEntry):ProductSpecification{
 const d=structuredClone(e.oldFullObject);
 for(const c of e.changes){let found=0;for(const g of d.groups){g.fields=g.fields.flatMap(f=>{if(f.key!==c.key)return [f];found++;if(!sameCorrectionObject(f,c.oldFullField)||correctionSha256(JSON.stringify(f))!==c.oldFieldSha256)throw Error('Old field hash rejected '+e.id+':'+c.key);return c.replacement?[structuredClone(c.replacement)]:[];});}if(found!==1)throw Error('Unique old field required '+e.id+':'+c.key);}
 return d;
}
export function applyReviewedCorrections(prior:Record<string,ProductSpecification>,products:Product[],sourceHashes:Record<string,string>,selectedVariants:Record<string,{id:string;sku:string;sourceUrl:string}>){
 for(const a of correctionLedger.sourceArtifacts)if(sourceHashes[a.path]!==a.sha256)throw Error('Source bytes rejected '+a.path);
 const next={...prior};let changes=0;
 for(const e of correctionLedger.entries){const selected=selectedVariants?.[e.id];if(!selected||selected.id!==e.id.slice(7)||selected.sku!==e.exactControllerSku||selected.sourceUrl!==e.expected.sourceUrl)throw Error('Exact source SKU rejected '+e.id);const matches=products.filter(p=>p.id===e.id);if(matches.length!==1||!correctionIdentityMatches(matches[0],e))throw Error('Exact identity rejected '+e.id);
 if(correctionSha256(JSON.stringify(e.oldFullObject))!==e.oldFullObjectSha256)throw Error('Ledger full object hash rejected '+e.id);
 const corrected=correctedObject(e);
 if(sameCorrectionObject(prior[e.id],corrected))continue;
 if(!prior[e.id]||correctionSha256(JSON.stringify(prior[e.id]))!==e.oldFullObjectSha256||!sameCorrectionObject(prior[e.id],e.oldFullObject))throw Error('Old whole-object precondition rejected '+e.id);
 next[e.id]=corrected;changes+=e.changes.length;
 }
 return {index:next,changes};
}
