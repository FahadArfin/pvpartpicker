import type {Product} from './types';
export type ComparisonEvidence=Pick<Product,'id'|'specification'|'comparisonSpecs'|'connectionSpecs'>[];
const cache=new Map<string,{until:number;data:ComparisonEvidence}>();
export function cachedComparison(key:string):ComparisonEvidence|undefined{const entry=cache.get(key);return entry&&entry.until>Date.now()?entry.data:undefined;}
export async function fetchComparison(key:string,signal:AbortSignal):Promise<ComparisonEvidence>{
 const known=cachedComparison(key);if(known)return known;
 const response=await fetch('/api/comparison-specs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productIds:JSON.parse(key)}),signal});
 const data=await response.json() as {products?:ComparisonEvidence;error?:string};
 if(!response.ok||!Array.isArray(data.products))throw new Error(data.error||'Could not load detailed specifications.');
 if(cache.size>=10)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+120000,data:data.products});return data.products;
}
