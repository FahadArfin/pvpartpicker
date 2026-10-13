/** Offline, exact source-approved migration. No I/O, network, aliases or generic field merge. */
import {createHash} from 'node:crypto';
import {wattcycleApprovedSourceProposalSha256,wattcycleReviewedSelections,matchesWattcycleReviewedSelection} from './wattcycle-reviewed-selection.ts';
import type {Product,ProductSpecification,SpecificationIdentity,SpecificationField,SpecificationSource} from './types.ts';
export const wattcycleApprovedSourceManifestSha256='42dcf687d3211614dbe011c2093139311c18d8526c79b08b68f4b47c2bc47471';
const sha=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
type Files=Record<string,Uint8Array>;
interface Binding {original:{htmlSha256:string;productId:number;selectedVariantId:number;actualMerchantSku:string;options:string[]};current:{htmlSha256:string;productId:number;selectedVariantId:number;actualMerchantSku:string;options:string[];sourceUrl:string;checkedAt:string};}
interface Candidate {id:string;previousIdentity:SpecificationIdentity;currentExpectedIdentity:SpecificationIdentity;indexObjectSha256:string;sourceBinding:Binding;}
interface Correction {productId:string;expectedOldIdentity:SpecificationIdentity;proposedCurrentIdentity:SpecificationIdentity;expectedOldField:SpecificationField;expectedOldFieldSha256:string;proposedCorrectedField:SpecificationField;proposedCorrectedFieldSha256:string;freshSourceObject:SpecificationSource;originalIndexObjectSha256:string;sourceBinding:Binding;quoteProof:{side:string;htmlSha256:string;quotes:{quote:string}[]}[];}
interface Proposal {version:number;unconditionalExactBundleIdentityCandidates:Candidate[];conditionalCableCorrectionAndIdentityProposal:Correction;correctedExistingFieldCount:number;newTechnicalFields:number;researchFillCredit:number;}
function bytes(files:Files,p:string){const b=files[p];if(!b)throw Error('Frozen source packet input missing '+p);return b;}
function json<T>(files:Files,p:string):T{return JSON.parse(Buffer.from(bytes(files,p)).toString('utf8')) as T;}
function selectedProduct(b:Uint8Array,id:number){const html=Buffer.from(b).toString('utf8');const found:{product:Record<string,unknown>;variant:Record<string,unknown>}[]=[];
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){try{const p=JSON.parse(m[1]);if(!p||!Array.isArray(p.variants))continue;const v=p.variants.find((v:{id:unknown})=>v.id===id);if(v)found.push({product:p,variant:v});}catch{}}
 if(found.length!==1)throw Error('Unique complete inert source product/selected variant required');return found[0];
}
function context(files:Files){
 if(sha(bytes(files,'manifest.json'))!==wattcycleApprovedSourceManifestSha256)throw Error('Approved frozen manifest hash rejected');
 const manifest=json<{files:{path:string;bytes:number;sha256:string}[]}>(files,'manifest.json');
 for(const f of manifest.files){const b=bytes(files,f.path);if(b.byteLength!==f.bytes||sha(b)!==f.sha256)throw Error('Frozen source packet bytes/hash rejected '+f.path);}
 const proposalPath='inputs/component-eighteen-wattcycle-identity-proposal-v2.json';if(sha(bytes(files,proposalPath))!==wattcycleApprovedSourceProposalSha256)throw Error('Approved source proposal hash rejected');
 const p=json<Proposal>(files,proposalPath),prior=json<Record<string,ProductSpecification>>(files,'baseline/specifications.json');
 if(p.version!==2||p.unconditionalExactBundleIdentityCandidates.length!==2||p.conditionalCableCorrectionAndIdentityProposal.productId!=='wattcycle-67838376313128'||p.correctedExistingFieldCount!==1||p.newTechnicalFields!==0||p.researchFillCredit!==0)throw Error('Bounded approved operation scope rejected');
 const entries=[...p.unconditionalExactBundleIdentityCandidates,{id:p.conditionalCableCorrectionAndIdentityProposal.productId,previousIdentity:p.conditionalCableCorrectionAndIdentityProposal.expectedOldIdentity,currentExpectedIdentity:p.conditionalCableCorrectionAndIdentityProposal.proposedCurrentIdentity,indexObjectSha256:p.conditionalCableCorrectionAndIdentityProposal.originalIndexObjectSha256,sourceBinding:p.conditionalCableCorrectionAndIdentityProposal.sourceBinding}];
 if(new Set(entries.map(e=>e.id)).size!==3||entries.some(e=>!wattcycleReviewedSelections.some(s=>s.id===e.id)))throw Error('Unapproved identity operation or collision rejected');
 const expected:Record<string,ProductSpecification>={};
 for(const e of entries){const selector=wattcycleReviewedSelections.find(s=>s.id===e.id)!;if(!same(e.currentExpectedIdentity,selector.expected))throw Error('Exact approved current metadata contract rejected '+e.id);
  const old=prior[e.id];if(!old||sha(JSON.stringify(old))!==e.indexObjectSha256||!same(old.identity,e.previousIdentity))throw Error('Frozen old full object/identity hash rejected '+e.id);
  const a=selectedProduct(bytes(files,'sources/'+e.id+'/original.html'),e.sourceBinding.original.selectedVariantId),b=selectedProduct(bytes(files,'sources/'+e.id+'/current.html'),e.sourceBinding.current.selectedVariantId);
  for(const [side,data]of [['original',a],['current',b]] as const){const bind=e.sourceBinding[side],src=bytes(files,'sources/'+e.id+'/'+side+'.html');if(sha(src)!==bind.htmlSha256||data.product.id!==bind.productId||data.variant.id!==bind.selectedVariantId||data.variant.sku!==bind.actualMerchantSku||!same(data.variant.options,bind.options)||data.product.title+' — '+data.variant.public_title!==(side==='original'?e.previousIdentity.name:e.currentExpectedIdentity.name))throw Error('Exact original/current source product/SKU/variant/options rejected '+e.id);}
  if(a.product.id!==b.product.id||a.variant.id!==b.variant.id||a.variant.sku!==b.variant.sku||!same(a.variant.options,b.variant.options)||!same(a.variant.quantity_rule,b.variant.quantity_rule)||a.product.description!==b.product.description)throw Error('Changed source physical revision/package rejected '+e.id);
  const next=structuredClone(old);next.identity=structuredClone(e.currentExpectedIdentity);
  if(e.id===p.conditionalCableCorrectionAndIdentityProposal.productId){const c=p.conditionalCableCorrectionAndIdentityProposal;let found=0;
   for(const g of next.groups)g.fields=g.fields.map(f=>{if(f.key!=='compatibility')return f;found++;if(!same(f,c.expectedOldField)||sha(JSON.stringify(f))!==c.expectedOldFieldSha256)throw Error('Exact old compatibility field precondition rejected');return structuredClone(c.proposedCorrectedField);});
   if(found!==1||sha(JSON.stringify(c.proposedCorrectedField))!==c.proposedCorrectedFieldSha256||c.proposedCorrectedField.key!=='compatibility'||!c.proposedCorrectedField.value.includes('tightly matched SOC')||!c.proposedCorrectedField.value.includes('voltage difference ≤1V')||c.proposedCorrectedField.source!==c.sourceBinding.current.sourceUrl||c.freshSourceObject.url!==c.proposedCorrectedField.source||c.freshSourceObject.kind!=='manufacturer'||c.freshSourceObject.checkedAt!==c.sourceBinding.current.checkedAt)throw Error('Approved existing compatibility correction or provenance rejected');
   if(next.sources.some(s=>s.url===c.freshSourceObject.url&&s.kind===c.freshSourceObject.kind))throw Error('Fresh source collision rejected');next.sources.push(structuredClone(c.freshSourceObject));
  }
  expected[e.id]=next;
 }
 return {proposal:p,baseline:prior,entries,expected};
}
function guardProducts(products:Product[],ids:string[]){const seen=new Set<string>();for(const p of products){if(seen.has(p.id))throw Error('Unique catalog product required; collision '+p.id);seen.add(p.id);}for(const id of ids){const ps=products.filter(p=>p.id===id);if(ps.length!==1)throw Error('Unique exact selected product required; missing/collision '+id);if(!matchesWattcycleReviewedSelection(ps[0]))throw Error('Exact current identity/anchors/final offer selection rejected '+id);}}
export function applyWattcycleIdentityMigration(index:Record<string,ProductSpecification>,products:Product[],packetFiles:Files){
 const c=context(packetFiles),ids=c.entries.map(e=>e.id);guardProducts(products,ids);const next={...index};let identitiesChanged=0,correctedExistingFields=0;
 const audit=[];
 for(const e of c.entries){const old=c.baseline[e.id],wanted=c.expected[e.id],actual=index[e.id];if(same(actual,wanted))continue;
  if(!actual||sha(JSON.stringify(actual))!==e.indexObjectSha256||!same(actual,old))throw Error('Exact old whole-object precondition rejected '+e.id);
  next[e.id]=wanted;identitiesChanged++;correctedExistingFields+=Number(e.id===c.proposal.conditionalCableCorrectionAndIdentityProposal.productId);
  audit.push({id:e.id,oldFullObject:structuredClone(actual),oldFullObjectSha256:e.indexObjectSha256,newFullObject:structuredClone(wanted),newFullObjectSha256:sha(JSON.stringify(wanted)),sourceBinding:e.sourceBinding});
 }
 return {index:next,identitiesChanged,correctedExistingFields,newTechnicalFields:0,researchFillCredit:0,audit,sourceManifestSha256:wattcycleApprovedSourceManifestSha256,sourceProposalSha256:wattcycleApprovedSourceProposalSha256};
}
/** Proposed regeneration boundary; existing importer callers are intentionally not edited here. */
export function assertWattcycleMigrationWriteBoundary(products:Product[],index:Record<string,ProductSpecification>,packetFiles:Files){
 const c=context(packetFiles);guardProducts(products,c.entries.map(e=>e.id));for(const e of c.entries)if(!same(index[e.id],c.expected[e.id]))throw Error('WattCycle reviewed migration write boundary rejected full corrected object '+e.id);
}
