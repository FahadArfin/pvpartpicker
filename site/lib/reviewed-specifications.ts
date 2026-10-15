import {quarantineSpecification} from './specification-quarantine-guard.ts';
import {isWattcycleReviewedListing,matchesWattcycleReviewedSelection,assertWattcycleReviewedRecordRegeneration} from './wattcycle-reviewed-selection.ts';
import {assertCorrectionWriteBoundary} from './specification-correction-guard.ts';
import {buildSpecification,technicalRows} from './specifications.ts';
import type {SpecificationEvidence} from './specifications.ts';
import type {Product,ProductSpecification,SpecificationIdentity} from './types.ts';
export interface ReviewedSpecification extends SpecificationEvidence {productIds:string[];expected:Record<string,SpecificationIdentity>;}
export function identityMatches(p:Product,identity:SpecificationIdentity){return p.name===identity.name&&p.sourceUrl===identity.sourceUrl&&p.category===identity.category&&Object.entries(identity.anchors).every(([key,value])=>p.specs[key]===value);}
function compatibleRows(p:Product,r:ReviewedSpecification){
 for(const [label,value] of technicalRows(r.rows)){const n=Number(value.replace(/,/g,'').match(/^\s*([-+]?\d+(?:\.\d+)?)/)?.[1]);if(!Number.isFinite(n))continue;
 if(/^(?:nominal|rated)(?: battery)? voltage(?:\s*\(v\))?$/i.test(label)&&p.specs.voltage&&Math.abs(n-Number(p.specs.voltage))/Number(p.specs.voltage)>.1)return false;
 if(/^(?:rated|nominal|battery) capacity(?:\s*\(ah\))?$/i.test(label)&&(/\bah\b/i.test(value+' '+label))&&p.specs.capacityAh&&Math.abs(n-Number(p.specs.capacityAh))>1)return false;
 if(/^(?:(?:nominal|rated|battery) )?(?:energy(?: capacity)?|capacity)$/i.test(label)&&/k?wh\b/i.test(value)&&p.specs.capacityKwh){const kwh=/kwh\b/i.test(value)?n:n/1000;if(Math.abs(kwh-Number(p.specs.capacityKwh))/Number(p.specs.capacityKwh)>.1)return false;}
 if(p.category==='panels'&&/^(?:maximum power|maximum power at stc|rated power|nominal power|pmax)$/i.test(label)&&p.specs.watts&&Math.abs(n-Number(p.specs.watts))>.5)return false;
 }return true;
}
export function importReviewedSpecification(p:Product,records:ReviewedSpecification[],prior?:ProductSpecification):ProductSpecification|undefined{
 prior=quarantineSpecification(p,prior);
 const protectedPrior=isWattcycleReviewedListing(p)?structuredClone(prior):undefined;
 const finish=(value:ProductSpecification|undefined)=>{assertWattcycleReviewedRecordRegeneration(p,value,protectedPrior);return value;};
 // Changed raw metadata/offers can only preserve a verified prior, never import facts.
 if(isWattcycleReviewedListing(p)&&!matchesWattcycleReviewedSelection(p))return finish(prior);
 if(prior?.identity&&!identityMatches(p,prior.identity))prior=undefined;
 const accepted=records.filter(r=>r.productIds.includes(p.id)&&r.expected[p.id]&&identityMatches(p,r.expected[p.id])&&compatibleRows(p,r));if(!accepted.length)return finish(prior);
 const next=buildSpecification(p,accepted);if(!next.sources.some(s=>s.kind!=='listing'&&accepted.some(r=>r.url===s.url)))return finish(prior);
 const sources=[...(prior?.sources||[])];for(const source of next.sources)if(!sources.some(s=>s.url===source.url&&s.kind===source.kind))sources.push(source);
 const groups=(prior?.groups||[]).map(g=>({...g,fields:g.fields.map(f=>({...f}))})),notes=[...(prior?.notes||[]),...next.notes];
 for(const g of next.groups)for(const f of g.fields){const known=groups.flatMap(g=>g.fields).find(x=>x.key===f.key);if(known){if(known.kind==='listing'&&f.kind!=='listing')Object.assign(known,f);else if(f.kind!=='listing'&&known.kind!=='listing'&&known.value.replace(/\s/g,'')!==f.value.replace(/\s/g,''))notes.push('Reviewed source conflict for '+f.label+'; existing rating retained.');continue;}let target=groups.find(x=>x.title===g.title);if(!target){target={title:g.title,fields:[]};groups.push(target);}target.fields.push(f);}
 const panelRatings=next.panelRatings||prior?.panelRatings?{...next.panelRatings,...prior?.panelRatings,stc:{...next.panelRatings?.stc,...prior?.panelRatings?.stc},noct:{...next.panelRatings?.noct,...prior?.panelRatings?.noct},sources:{...next.panelRatings?.sources,...prior?.panelRatings?.sources}}:undefined;
 for(const condition of ['stc','noct'] as const)for(const [key,value] of Object.entries(next.panelRatings?.[condition]||{})){const old=prior?.panelRatings?.[condition][key];if(old&&old!==value)notes.push('Reviewed source conflict for '+condition+' '+key+'; existing rating retained.');}
 // A still-matching prior identity was checked before merging. Keep its source
 // anchors so reimports cannot require ratings added by an earlier hydration.
 const merged={...next,groups,sources,notes:[...new Set(notes.filter(n=>!n.startsWith('A matching technical specification table is not available')))],...(panelRatings?{panelRatings}:{}),identity:prior?.identity||accepted[0].expected[p.id]};
 assertCorrectionWriteBoundary([p],{[p.id]:merged});
 return finish(merged);
}
