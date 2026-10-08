import type {Product,Offer} from './types.ts';

export type PurchaseKind='unit'|'pack'|'bundle';
export interface ModelIdentity {modelId:string;name:string;defaultProductId:string;packageKey:string;packageLabel:string;kind:PurchaseKind;listingCount:number;note?:string;}
export type ModelRegistry={id:string;name:string;preferredId?:string;note?:string;listings:{id:string;title:string;parent:string;hardware?:Record<string,string|number|boolean>;packQuantity?:number;packageKey:string;packageLabel:string;kind:PurchaseKind;}[]}[];
const normalize=(s:string)=>s.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
export function modelSourceParent(source:string){
 try{const url=new URL(source);for(const k of [...url.searchParams.keys()])if(k==='variant'||/^utm_|^(?:gclid|fbclid|ref|srsltid)$/.test(k))url.searchParams.delete(k);url.hash='';return url.toString().replace(/\/$/,'');}catch{return source;}
}
const rank=(p:Product)=>p.modelIdentity?.kind==='unit'?0:p.modelIdentity?.kind==='pack'?1:2;
/** A reversible projection: every original ID remains addressable. Never writes collector records. */
export function buildModelCatalog(products:Product[],registry:ModelRegistry):Product[]{
 const byId=new Map(products.map(p=>[p.id,p])),identities=new Map<string,ModelIdentity>(),packages=new Map<string,Product[]>();
 for(const model of registry){
  const matched=model.listings.flatMap(entry=>{
   const p=byId.get(entry.id);if(!p||normalize(p.name)!==normalize(entry.title)||modelSourceParent(p.sourceUrl)!==entry.parent||Object.entries(entry.hardware||{}).some(([k,v])=>p.specs[k]!==v)||(entry.packQuantity!==undefined&&p.offers.some(o=>o.packQuantity!==entry.packQuantity)))return [];
   return [{p,entry}];
  });
  if(!matched.length)continue;
  const fallback=[...matched].sort((a,b)=>({unit:0,pack:1,bundle:2}[a.entry.kind]-{unit:0,pack:1,bundle:2}[b.entry.kind])||(a.p.offers[0]?.packQuantity||1)-(b.p.offers[0]?.packQuantity||1)||a.p.id.localeCompare(b.p.id))[0];
  const primary=matched.find(r=>r.p.id===model.preferredId)||fallback;
  for(const {p,entry} of matched){
   identities.set(p.id,{modelId:model.id,name:model.name,defaultProductId:primary.p.id,packageKey:entry.packageKey,packageLabel:entry.packageLabel,kind:entry.kind,listingCount:matched.length,...(model.note?{note:model.note}:{})});
   const key=model.id+'|'+entry.packageKey,rows=packages.get(key)||[];rows.push(p);packages.set(key,rows);
  }
 }
 const shared=new Map<string,Offer[]>();
 for(const [key,rows] of packages){
  const offers=new Map<string,Offer>();
  for(const p of rows)for(const o of p.offers){const prior=offers.get(o.id);if(!prior||Date.parse(o.observedAt)>Date.parse(prior.observedAt))offers.set(o.id,{...o,listingId:p.id,selectionLabel:identities.get(p.id)!.packageLabel});}
  shared.set(key,[...offers.values()]);
 }
 return products.map(p=>{const identity=identities.get(p.id);return identity?{...p,modelIdentity:identity,offers:shared.get(identity.modelId+'|'+identity.packageKey)!}:p;});
}
/** Collapse after filtering, so matching package/condition choices never disappear. */
export function collapseModelListings(products:Product[]):Product[]{
 const groups=new Map<string,Product[]>();for(const p of products){const key=p.modelIdentity?.modelId||'listing:'+p.id,rows=groups.get(key)||[];rows.push(p);groups.set(key,rows);}
 return [...groups.values()].map(rows=>rows.find(p=>p.id===p.modelIdentity?.defaultProductId)||[...rows].sort((a,b)=>rank(a)-rank(b)||(a.offers[0]?.packQuantity||1)-(b.offers[0]?.packQuantity||1)||a.id.localeCompare(b.id))[0]);
}
/** The currently selected legacy alias stays selected; other identical aliases collapse. */
export function modelPurchaseOptions(product:Product,products:Product[]):Product[]{
 const model=product.modelIdentity;if(!model)return [product];
 const choices=new Map<string,Product>();
 for(const p of products)if(p.modelIdentity?.modelId===model.modelId&&!choices.has(p.modelIdentity.packageKey))choices.set(p.modelIdentity.packageKey,p);
 choices.set(model.packageKey,product);
 return [...choices.values()].sort((a,b)=>rank(a)-rank(b)||(a.offers[0]?.packQuantity||1)-(b.offers[0]?.packQuantity||1)||a.modelIdentity!.packageLabel.localeCompare(b.modelIdentity!.packageLabel));
}
/** Indexed history query scoped to original offers in one selected purchase package. */
export const modelHistoryQuery=`SELECT o.offer_id AS offerId,o.price,o.pack_quantity AS packQuantity,o.stock,o.observed_at AS observedAt,o.source_id AS sourceId,json_extract(s.json,'$.label') AS sourceLabel,json_extract(s.json,'$.url') AS sourceUrl,json_extract(s.json,'$.precision') AS precision FROM observations o LEFT JOIN history_sources s ON s.id=o.source_id WHERE o.offer_id IN (SELECT value FROM json_each(?)) AND o.observed_at>=? ORDER BY o.observed_at LIMIT 5001`;
