import type {SaleOffer} from './sales.ts';
import type {Product} from './types.ts';
import {selectDrops,type PriceDrop} from './price-drops.ts';
import {productListName} from './part-comparison.ts';
type DisplayPrice=Pick<PriceDrop,'productId'|'offerId'|'retailer'|'previous'|'current'|'dollars'|'percent'|'purchasePrice'|'packQuantity'|'observedAt'|'changedAt'>;
export interface HomeDeal extends DisplayPrice {name:string;image:string;condition:'new'|'used';saleBasis?:'retailer'|'history'}
// One listing per product, latest reduction first; no catalog payload in Home.
export function homeDeals(products:Product[],drops:DisplayPrice[]):HomeDeal[]{
 const productsById=new Map(products.map(p=>[p.id,p])),seen=new Set<string>();
 const result:HomeDeal[]=[];
 for(const drop of selectDrops(drops,{sort:'latest'})){
  const p=productsById.get(drop.productId),offer=p?.offers.find(o=>o.id===drop.offerId);
  if(!p||!offer||seen.has(p.id))continue;
  seen.add(p.id);result.push({...drop,name:productListName(p),image:p.image,condition:offer.condition});
  if(result.length===12)break;
 }
 return result;
}
// Fixed pixels per second, independent of display refresh rate. Cap long frames
// so resuming a background tab cannot jump across several products.
export function advanceTicker(position:number,loopWidth:number,elapsedMs:number){
 if(loopWidth<=0)return 0;
 return (position+Math.min(Math.max(elapsedMs,0),64)*0.022)%loopWidth;
}

/** Reuse the bounded display projection; sale references never become history. */
export function homeSales(products:Product[],sales:SaleOffer[]):HomeDeal[]{
 const result=homeDeals(products,sales.map(({productId,offerId,retailer,previous,current,dollars,percent,purchasePrice,packQuantity,observedAt,changedAt})=>({productId,offerId,retailer,previous,current,dollars,percent,purchasePrice,packQuantity,observedAt,changedAt})));
 const bases=new Map(sales.map(s=>[s.offerId,s.basis]));
 return result.map(d=>({...d,saleBasis:bases.get(d.offerId)}));
}
