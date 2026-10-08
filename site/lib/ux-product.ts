import type {Product} from './types.ts';
import type {HistoryPoint} from './product-price-history.ts';

/** Identity is established by the reviewed registry, never a fuzzy title match. */
export function bundleCoreProduct(product:Product,products:Product[]):Product|undefined{
 if(product.modelIdentity?.kind!=='bundle')return undefined;
 return products.find(p=>p.modelIdentity?.modelId===product.modelIdentity!.modelId&&p.modelIdentity?.kind==='unit'&&['all-in-one','inverters','batteries'].includes(p.category));
}
export function historyCoverage(points:HistoryPoint[],offerIds:string[]){
 const recorded=points.filter(p=>Number.isFinite(Date.parse(p.date))&&offerIds.some(id=>typeof p[id]==='number'&&Number.isFinite(p[id])));
 const dates=[...new Set(recorded.map(p=>p.date.slice(0,10)))].sort();
 const prices=recorded.flatMap(p=>offerIds.flatMap(id=>typeof p[id]==='number'&&Number.isFinite(p[id])?[p[id] as number]:[]));
 if(!dates.length||!prices.length)return undefined;
 const low=Math.min(...prices),high=Math.max(...prices);
 return {days:dates.length,first:dates[0],last:dates.at(-1)!,low,high,unchanged:low===high};
}
