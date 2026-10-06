import type {Product} from './types';
type Evidence=Pick<Product,'id'|'connectionSpecs'>[];
const cache=new Map<string,{until:number;data:Evidence}>();
export function cachedConnections(key:string):Evidence|undefined{const row=cache.get(key);if(row&&row.until>Date.now())return row.data;}
export async function fetchConnections(key:string,signal:AbortSignal):Promise<Evidence>{
 const known=cachedConnections(key);if(known)return known;
 const response=await fetch('/api/build-connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productIds:JSON.parse(key)}),signal});
 const data=await response.json() as {products?:Evidence;error?:string};if(!response.ok||!Array.isArray(data.products))throw new Error(data.error||'Could not load electrical specifications.');
 if(cache.size>=10)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+120000,data:data.products});return data.products;
}
