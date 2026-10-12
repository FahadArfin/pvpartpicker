/** Bounded regeneration guard. This does not override any field or relax any identity. */
import data from '../data/specification-corrections.json' with {type:'json'};
import type {Product,ProductSpecification,SpecificationField,SpecificationIdentity,SpecificationSource} from './types.ts';
export interface CorrectionEntry {id:string;expected:SpecificationIdentity;exactControllerSku:string;oldFullObjectSha256:string;oldFullObject:ProductSpecification;manualSource:SpecificationSource;changes:{key:string;oldFullField:SpecificationField;oldFieldSha256:string;replacement:SpecificationField|null}[];}
export const correctionLedger=data as unknown as {id:string;sourceArtifacts:{path:string;sha256:string}[];entries:CorrectionEntry[]};
export const sameCorrectionObject=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function correctionIdentityMatches(p:Product,e:CorrectionEntry){return p.id===e.id&&p.name===e.expected.name&&p.sourceUrl===e.expected.sourceUrl&&p.category===e.expected.category&&Object.entries(e.expected.anchors).every(([k,v])=>p.specs[k]===v)&&p.offers.every(o=>!o.sku||o.sku===e.id.slice('renogy-'.length));}
export function correctedSpecificationMatches(d:ProductSpecification|undefined,e:CorrectionEntry){
 if(!d||!sameCorrectionObject(d.identity,e.expected)||!d.sources.some(s=>sameCorrectionObject(s,e.manualSource)))return false;
 const fields=d.groups.flatMap(g=>g.fields);
 return e.changes.every(c=>{const matches=fields.filter(f=>f.key===c.key);return c.replacement?matches.length===1&&sameCorrectionObject(matches[0],c.replacement):matches.every(f=>f.source!==c.oldFullField.source||f.kind!==c.oldFullField.kind);});
}
export function assertCorrectionWriteBoundary(products:Product[],index:Record<string,ProductSpecification>){
 for(const e of correctionLedger.entries){const matches=products.filter(p=>p.id===e.id);if(!matches.length)continue;
 if(matches.length!==1||!correctionIdentityMatches(matches[0],e)||!correctedSpecificationMatches(index[e.id],e))throw Error('Reviewed correction write boundary rejected '+e.id+'; apply the approved correction or stop regeneration.');
 }
}
