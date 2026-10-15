/** Exact reviewed source errors, separate from the manual replacement ledger. */
import data from '../data/specification-quarantines.json' with {type:'json'};
import type {Product,ProductSpecification,SpecificationField,SpecificationIdentity} from './types.ts';
export interface QuarantineEntry {id:string;expected:SpecificationIdentity;offer:{id:string;sku?:string;packQuantity:number;condition:string;url:string;retailerId:string};exactSourceSku:string;sourceArtifacts:{path:string;sha256:string}[];quarantineFields:{groupTitle:string;field:SpecificationField;fieldSha256:string}[];protectedManualFields:SpecificationField[];reason:string;}
export const quarantineLedger=data as unknown as {id:string;approvedPacketSha256:string;independentReviewSha256:string;newFactCredit:number;entries:QuarantineEntry[]};
export function quarantineIdentityMatches(p:Product,e:QuarantineEntry){return p.id===e.id&&p.name===e.expected.name&&p.sourceUrl===e.expected.sourceUrl&&p.category===e.expected.category&&Object.entries(e.expected.anchors).every(([k,v])=>p.specs[k]===v)&&p.offers.length===1&&Object.entries(e.offer).every(([k,v])=>p.offers[0][k as keyof Product['offers'][number]]===v);}
// Labels are presentation only; source, kind, key and the entire value are required.
export function isQuarantinedField(f:SpecificationField,e:QuarantineEntry){return e.quarantineFields.some(q=>f.key===q.field.key&&f.source===q.field.source&&f.kind===q.field.kind&&f.value===q.field.value);}
export function quarantineSpecification(p:Product,d:ProductSpecification|undefined):ProductSpecification|undefined{
 const e=quarantineLedger.entries.find(e=>e.id===p.id);if(!e||!d||!d.groups.some(g=>g.fields.some(f=>isQuarantinedField(f,e))))return d;
 if(!quarantineIdentityMatches(p,e))throw Error('Reviewed quarantine identity rejected '+p.id);
 return {...d,groups:d.groups.map(g=>({...g,fields:g.fields.filter(f=>!isQuarantinedField(f,e))}))};
}
export function assertQuarantineWriteBoundary(products:Product[],index:Record<string,ProductSpecification>){
 for(const e of quarantineLedger.entries){const ps=products.filter(p=>p.id===e.id);if(!ps.length)continue;
 if(ps.length!==1||!quarantineIdentityMatches(ps[0],e))throw Error('Reviewed quarantine identity rejected '+e.id);
 if(index[e.id]?.groups.some(g=>g.fields.some(f=>isQuarantinedField(f,e))))throw Error('Reviewed quarantine write boundary rejected '+e.id);
 }
}
/** Projected comparison values lack kind; invalidate only this source/key/value. */
export function quarantineProjectedEvidence(p:Product):Product{
 const e=quarantineLedger.entries.find(e=>e.id===p.id);if(!e)return p;
 const connections=p.connectionSpecs&&Object.fromEntries(Object.entries(p.connectionSpecs).filter(([,f])=>!isQuarantinedField(f,e)));
 const comparisons=p.comparisonSpecs&&Object.fromEntries(Object.entries(p.comparisonSpecs).filter(([key,f])=>!e.quarantineFields.some(q=>q.field.key===key&&q.field.source===f.source&&q.field.value===f.value)));
 if(Object.keys(connections||{}).length===Object.keys(p.connectionSpecs||{}).length&&Object.keys(comparisons||{}).length===Object.keys(p.comparisonSpecs||{}).length)return p;
 if(!quarantineIdentityMatches(p,e))throw Error('Reviewed quarantine identity rejected '+p.id);
 return {...p,connectionSpecs:connections,comparisonSpecs:comparisons};
}
