/** Exact source-approved selections only. IDs mark a hold; they never grant evidence. */
import type {Product,Offer,SpecificationIdentity,ProductSpecification} from './types.ts';
import {wattcycleReviewedEvidenceScope} from './wattcycle-reviewed-evidence-scope.ts';
export const wattcycleApprovedSourceProposalSha256='69b702d2d47ae263d2ccfaf22cc328db214898f1cf089361b0d7ea3d7c52b43b';
export const wattcycleReviewedSelections:{id:string;expected:SpecificationIdentity;offer:{id:string;retailerId:string;url:string;sku:string;packQuantity:number}}[]=[
 {id:'wattcycle-67838376313128',expected:{name:'⚡️Early Bird⚡️ WattCycle WattLINK - BLUETTI AC200MAX PPS Extra 48V Battery-to-PPS Expansion Cable — Bluetti AC200MAX Adapter Cable',sourceUrl:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376313128',category:'wiring',anchors:{voltage:48}},offer:{id:'wattcycle-67838376313128',retailerId:'wattcycle',url:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376313128',sku:'67838376313128',packQuantity:1}},
 {id:'wattcycle-67838376345896',expected:{name:'⚡️Early Bird⚡️ WattCycle WattLINK - BLUETTI AC200MAX PPS Extra 48V Battery-to-PPS Expansion Cable — 5.12kWh(48V 100Ah Wall-Mount Battery) & AC200MAX Adapter kit',sourceUrl:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376345896',category:'kits',anchors:{}},offer:{id:'wattcycle-67838376345896',retailerId:'wattcycle',url:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376345896',sku:'67838376345896',packQuantity:1}},
 {id:'wattcycle-67838376378664',expected:{name:'⚡️Early Bird⚡️ WattCycle WattLINK - BLUETTI AC200MAX PPS Extra 48V Battery-to-PPS Expansion Cable — 5.12kWh(48V 100Ah 3U Rack Battery) & AC200MAX Adapter kit',sourceUrl:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376378664',category:'kits',anchors:{}},offer:{id:'wattcycle-67838376378664',retailerId:'wattcycle',url:'https://www.wattcycle.com/products/wattlink-bluetti-ac200max-48v-battery-pps-expansion-cable?variant=67838376378664',sku:'67838376378664',packQuantity:1}},
];
export function isWattcycleReviewedListing(p:Pick<Product,'id'>){return wattcycleReviewedSelections.some(s=>s.id===p.id);}
export function matchesWattcycleReviewedMetadata(p:Product){const s=wattcycleReviewedSelections.find(s=>s.id===p.id);return Boolean(s&&p.name===s.expected.name&&p.sourceUrl===s.expected.sourceUrl&&p.category===s.expected.category&&Object.entries(s.expected.anchors).every(([k,v])=>p.specs[k]===v));}
export function matchesWattcycleReviewedSelection(p:Product){
 const s=wattcycleReviewedSelections.find(s=>s.id===p.id);if(!s||!matchesWattcycleReviewedMetadata(p)||p.offers.length!==1)return false;
 return (p.offers[0].recordedPackQuantity===undefined||p.offers[0].recordedPackQuantity===s.offer.packQuantity)&&Object.entries(s.offer).every(([k,v])=>p.offers[0][k as keyof Offer]===v);
}
function equalObject(a:unknown,b:unknown):boolean {
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const aa=a as Record<string,unknown>,bb=b as Record<string,unknown>;
 const keys=Object.keys(aa);return keys.length===Object.keys(bb).length&&keys.every(k=>Object.hasOwn(bb,k)&&equalObject(aa[k],bb[k]));
}
/** Attachment happens only after raw metadata holds and final offer mappings resolve. */
export function canAttachWattcycleReviewedEvidence(p:Product,d:ProductSpecification|undefined):boolean {
 if(!d||!matchesWattcycleReviewedSelection(p))return false;
 return hasProtectedWattcycleScope(p.id,d);
}
function hasProtectedWattcycleScope(id:string,d:ProductSpecification|undefined):boolean {
 if(!d)return false;
 const scope=wattcycleReviewedEvidenceScope[id as keyof typeof wattcycleReviewedEvidenceScope];
 if(!scope||!equalObject(d.identity,scope.identity))return false;
 const fields=d.groups.flatMap(g=>g.fields);
 return scope.fields.every(expected=>{const same=fields.filter(f=>f.key===expected.key);return same.length===1&&equalObject(same[0],expected);})
  &&scope.sources.every(expected=>d.sources.filter(s=>equalObject(s,expected)).length===1);
}
/** Scoped importer guard; unrelated products do not require sibling WattCycle records. */
export function assertWattcycleReviewedRecordRegeneration(product:Product,output:ProductSpecification|undefined,prior?:ProductSpecification):void {
 if(!isWattcycleReviewedListing(product))return;
 assertProtectedRegeneration(product.id,product,output,prior);
}
function assertProtectedRegeneration(id:string,product:Product|undefined,output:ProductSpecification|undefined,prior?:ProductSpecification):void {
 if(!hasProtectedWattcycleScope(id,output))throw new Error('WattCycle protected source scope lost at regeneration boundary: '+id);
 if(product&&matchesWattcycleReviewedSelection(product))return;
 if(!hasProtectedWattcycleScope(id,prior)||!equalObject(output,prior))throw new Error('Held WattCycle selection requires unchanged verified prior object at regeneration boundary: '+id);
}
/** Pass RAW selections and a prior index captured before generation. A hold permits preservation only. */
export function assertWattcycleReviewedRegeneration(products:Product[],index:Record<string,ProductSpecification>,prior?:Record<string,ProductSpecification>):void {
 const ids=new Set<string>();for(const p of products){if(ids.has(p.id))throw new Error('Duplicate product identity at WattCycle regeneration boundary');ids.add(p.id);}
 for(const selection of wattcycleReviewedSelections)assertProtectedRegeneration(selection.id,products.find(p=>p.id===selection.id),index[selection.id],prior?.[selection.id]);
}
