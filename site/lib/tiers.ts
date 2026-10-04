import research from '../data/tiers.json' with {type:'json'};
import type {Category,Product,Offer} from './types.ts';
import {freshOffers} from './domain.ts';
export type Tier='S'|'A'|'B'|'C';
export type RankedCategory=Extract<Category,'all-in-one'|'batteries'|'panels'|'inverters'>;
export interface Evidence {label:string;url:string;kind:string;note:string}
export interface Ranking {id:string;name:string;category:RankedCategory;tier:Tier;cohort:string;productIds:string[];denominator:number;headline:string;strengths:string[];limits:string[];sources:Evidence[];specs:string[];reviewedAt:string;image?:string}
export const rankings=research as Ranking[];
export const tierFamilies:{id:RankedCategory;label:string;description:string}[]=[
 {id:'all-in-one',label:'All-in-one batteries',description:'Battery + inverter + solar charging, together. Panels and home transfer equipment may be extra.'},
 {id:'batteries',label:'Solar batteries',description:'Standalone DC storage. Inverter, enclosure, wiring and installation costs are additional.'},
 {id:'panels',label:'Solar panels',description:'Exact module families, front-side STC watts and practical installation fit.'},
 {id:'inverters',label:'Inverters',description:'Compare off-grid and hybrid use cases. A higher tier does not establish system compatibility.'},
];
export interface TierPrice {product:Product;offer:Offer;unitPrice:number;purchasePrice:number;metric:number}
// IDs are reviewed exact base configurations. No fuzzy matching of accessories,
// expansion batteries, similarly named generations, or panel/station bundles.
export function tierPrice(r:Ranking,products:Product[],now=Date.now()):TierPrice|undefined {
 if(!Number.isFinite(r.denominator)||r.denominator<=0)return;
 const prices=products.filter(p=>p.category===r.category&&r.productIds.includes(p.id)).flatMap(product=>freshOffers(product.offers,now).filter(o=>o.condition==='new'&&Number.isFinite(o.price)&&Number.isInteger(o.packQuantity)&&o.packQuantity>0).map(offer=>({product,offer,unitPrice:offer.price/offer.packQuantity,purchasePrice:offer.price,metric:offer.price/offer.packQuantity/r.denominator})));
 return prices.sort((a,b)=>a.metric-b.metric||a.purchasePrice-b.purchasePrice)[0];
}
export const valueBands:Record<RankedCategory,{unit:string;limits:[number,number,number]}>={
 'all-in-one':{unit:'$/rated kWh',limits:[400,600,900]},batteries:{unit:'$/rated kWh',limits:[220,300,400]},panels:{unit:'$/front-side W',limits:[.3,.45,.6]},inverters:{unit:'$/battery-only AC W',limits:[.3,.4,.6]},
};
export function valueTier(r:Ranking,price:TierPrice|undefined):Tier|'Unpriced'{
 if(!price||!Number.isFinite(price.metric)||price.metric<=0)return 'Unpriced';
 const [s,a,b]=valueBands[r.category].limits;return price.metric<=s?'S':price.metric<=a?'A':price.metric<=b?'B':'C';
}
export function tierForProduct(product:Product){return rankings.find(r=>r.productIds.includes(product.id));}
