import type {Product} from './types.ts';
import {selectDrops,type PriceDrop} from './price-drops.ts';
import {productListName} from './part-comparison.ts';
export interface HomeDeal extends PriceDrop {name:string;image:string;condition:'new'|'used'}
// One listing per product, latest reduction first; no catalog payload in Home.
export function homeDeals(products:Product[],drops:PriceDrop[]):HomeDeal[]{
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
