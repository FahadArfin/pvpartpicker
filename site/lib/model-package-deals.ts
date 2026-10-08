import {modelPurchaseOptions} from './model-identity.ts';
import {bestOffer,costForQuantity} from './domain.ts';
import type {Product,Offer} from './types.ts';
export interface PackageDeal {product:Product;offer?:Offer;purchasePrice?:number;belowUnit?:number;}
/** Compare one whole purchase, never a multipack's per-unit sticker price. */
export function modelPackageDeals(product:Product,products:Product[],now=Date.now()){
 const current=products.find(p=>p.id===product.id)||product;
 const options=modelPurchaseOptions(current,products);
 const valid=(p:Product)=>({...p,offers:p.offers.filter(o=>Number.isFinite(o.price)&&Number.isInteger(o.packQuantity)&&o.packQuantity>0&&['new','used'].includes(o.condition))});
 const rows:PackageDeal[]=options.map(p=>{const offer=bestOffer(valid(p),1,now);return {product:p,offer,purchasePrice:offer?costForQuantity(offer,1).subtotal:undefined};});
 const unitPrices=new Map<string,number>();
 for(const p of options.filter(p=>p.modelIdentity?.kind==='unit'))for(const condition of ['new','used']){
  const offer=bestOffer({...valid(p),offers:valid(p).offers.filter(o=>o.condition===condition&&o.packQuantity===1)},1,now);
  if(offer)unitPrices.set(condition,Math.min(unitPrices.get(condition)??Infinity,offer.price));
 }
 for(const row of rows){const baseline=row.offer&&unitPrices.get(row.offer.condition);if(row.product.modelIdentity?.kind==='bundle'&&row.offer?.packQuantity===1&&baseline!==undefined&&row.purchasePrice!<baseline)row.belowUnit=Math.round((baseline-row.purchasePrice!)*100)/100;}
 const bundleDeals:PackageDeal[]=[];
 for(const p of options.filter(p=>p.modelIdentity?.kind==='bundle'))for(const [condition,baseline] of unitPrices){
  const offer=bestOffer({...valid(p),offers:valid(p).offers.filter(o=>o.condition===condition&&o.packQuantity===1)},1,now);
  if(offer&&offer.price<baseline)bundleDeals.push({product:p,offer,purchasePrice:offer.price,belowUnit:Math.round((baseline-offer.price)*100)/100});
 }
 bundleDeals.sort((a,b)=>a.purchasePrice!-b.purchasePrice!||a.product.id.localeCompare(b.product.id));
 rows.sort((a,b)=>(a.purchasePrice??Infinity)-(b.purchasePrice??Infinity)||a.product.modelIdentity!.packageLabel.localeCompare(b.product.modelIdentity!.packageLabel));
 return {rows,cheapest:rows.find(r=>r.offer),cheaperBundle:bundleDeals[0]};
}
/** One watched row per package; retain all original IDs for drop matching/removal. */
export function watchedModelPackages(products:Product[],watchIds:string[]){
 const byId=new Map(products.map(p=>[p.id,p])),groups=new Map<string,{product:Product;ids:string[]}>();
 for(const id of watchIds){const p=byId.get(id);if(!p)continue;const key=p.modelIdentity?p.modelIdentity.modelId+'|'+p.modelIdentity.packageKey:'listing:'+id;const group=groups.get(key);if(group)group.ids.push(id);else groups.set(key,{product:p,ids:[id]});}
 return [...groups.values()];
}
