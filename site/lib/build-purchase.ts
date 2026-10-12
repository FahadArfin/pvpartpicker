import {costForQuantity,freshOffers} from './domain.ts';
import type {Build,BuildLine,Offer,Product} from './types.ts';

export interface PurchaseLine {
 productId:string; quantity:number; product?:Product; offer?:Offer;
 cost?:ReturnType<typeof costForQuantity>; shipping:number|null; reason?:string;
 condition?:Offer['condition']; packQuantity?:number;
}
export interface PurchasePlan {
 retailerId?:string; retailer?:string; complete:boolean; lines:PurchaseLine[];
 equipmentSubtotal:number|null; trackedSubtotal:number; knownShipping:number; unknownShippingCount:number;
}
const round=(value:number)=>Math.round(value*100)/100;
function eligible(offers:Offer[],now:number){
 return freshOffers(offers.filter(o=>Number.isFinite(o.price)&&Number.isInteger(o.packQuantity)&&o.packQuantity>0),now);
}
function candidates(line:BuildLine,products:Map<string,Product>,now:number){
 const product=products.get(line.productId);
 const base={productId:line.productId,quantity:line.quantity,product,shipping:null} satisfies PurchaseLine;
 if(!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10000)return {base:{...base,reason:'Quantity must be a positive whole number.'},offers:[]};
 if(!product)return {base:{...base,reason:'Product is unavailable in the current catalog.'},offers:[]};
 const selected=line.offerId?product.offers.find(o=>o.id===line.offerId):undefined;
 if(line.offerId&&!selected)return {base:{...base,reason:'Selected offer is unavailable; reselect a package and condition.'},offers:[]};
 if(selected&&(!Number.isInteger(selected.packQuantity)||selected.packQuantity<1||!['new','used'].includes(selected.condition)))return {base:{...base,condition:selected.condition,packQuantity:selected.packQuantity,reason:'Selected offer needs a fresh in-stock USD price; reselect or wait for a price check.'},offers:[]};
 const condition=selected?.condition||'new';
 const offers=eligible(product.offers,now).filter(o=>o.condition===condition&&(!selected||o.packQuantity===selected.packQuantity));
 return {base:{...base,condition,packQuantity:selected?.packQuantity},offers};
}
function purchaseLine(base:PurchaseLine,offers:Offer[]):PurchaseLine {
 const offer=[...offers].sort((a,b)=>costForQuantity(a,base.quantity).subtotal-costForQuantity(b,base.quantity).subtotal||a.id.localeCompare(b.id))[0];
 if(!offer)return {...base,reason:base.reason||'No fresh in-stock USD offer for this product, package and condition.'};
 const cost=costForQuantity(offer,base.quantity);
 const shipping=offer.shipping!==undefined&&Number.isFinite(offer.shipping)&&offer.shipping>=0?round(cost.packs*offer.shipping):null;
 return {...base,offer,cost,shipping};
}
function plan(lines:PurchaseLine[],retailerId?:string,retailer?:string):PurchasePlan {
 const complete=lines.length>0&&lines.every(l=>l.cost!==undefined);
 const trackedSubtotal=round(lines.reduce((sum,l)=>sum+(l.cost?.subtotal||0),0));
 return {retailerId,retailer,complete,lines,trackedSubtotal,equipmentSubtotal:complete?trackedSubtotal:null,
  knownShipping:round(lines.reduce((sum,l)=>sum+(l.shipping||0),0)),unknownShippingCount:lines.filter(l=>l.cost&&l.shipping===null).length};
}
/** Compare recorded equipment prices only. Shipping quotes are per-package assumptions, never delivered-price rankings. */
export function buildPurchaseComparison(build:Pick<Build,'lines'>,products:Product[],now=Date.now()) {
 const productMap=new Map(products.map(p=>[p.id,p]));
 const choices=build.lines.map(line=>candidates(line,productMap,now));
 const retailers=new Map(choices.flatMap(c=>c.offers.map(o=>[o.retailerId,o.retailer] as const)));
 const retailerPlans=[...retailers].map(([id,name])=>plan(choices.map(c=>purchaseLine(c.base,c.offers.filter(o=>o.retailerId===id))),id,name));
 return {split:plan(choices.map(c=>purchaseLine(c.base,c.offers))),
  singleRetailer:retailerPlans.filter(p=>p.complete).sort((a,b)=>a.equipmentSubtotal!-b.equipmentSubtotal!||a.retailerId!.localeCompare(b.retailerId!)),
  incompleteRetailers:retailerPlans.filter(p=>!p.complete).sort((a,b)=>a.retailer!.localeCompare(b.retailer!))};
}
/** Saved-build equipment alerts share buying eligibility and never treat incomplete coverage as zero. */
export function buildEquipmentTarget(build:Pick<Build,'lines'>,products:Product[],now=Date.now()) {
 const {split}=buildPurchaseComparison(build,products,now);
 return {complete:split.complete,subtotal:split.equipmentSubtotal,missingProductIds:split.lines.filter(l=>!l.cost).map(l=>l.productId)};
}
