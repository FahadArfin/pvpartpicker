import type {Observation,Product} from './types.ts';

export type HistoryPoint={date:string;time:number;[key:string]:string|number};
/** Historical pack sizes, not today's pack size, determine the plotted unit cost. */
export function productHistoryPoints(product:Product,observations:Observation[]):HistoryPoint[]{
 const points=new Map<string,HistoryPoint>();
 for(const observation of observations){
  const offer=product.offers.find(o=>o.id===observation.offerId),time=Date.parse(observation.observedAt);
  if(!offer||!Number.isFinite(time)||!Number.isFinite(observation.price)||observation.price<0)continue;
  const pack=observation.packQuantity??offer.packQuantity;
  if(!Number.isFinite(pack)||pack<=0)continue;
  const point=points.get(observation.observedAt)||{date:observation.observedAt,time};
  point[offer.id]=observation.price/(product.category==='kits'?1:pack);
  points.set(observation.observedAt,point);
 }
 return [...points.values()].sort((a,b)=>a.time-b.time);
}

/** Small session cache shared by hover previews and product pages. Failed loads retry. */
export function createProductHistoryLoader(fetcher:typeof fetch=fetch,now:()=>number=Date.now){
 const cache=new Map<string,{at:number;observations:Observation[]}>();
 const pending=new Map<string,Promise<Observation[]>>();
 return function load(productId:string,days:number):Promise<Observation[]>{
  const key=productId+'|'+days,cached=cache.get(key);
  if(cached&&now()-cached.at<300000)return Promise.resolve(cached.observations);
  if(pending.has(key))return pending.get(key)!;
  const request=(async()=>{
   const response=await fetcher(`/api/history?productId=${encodeURIComponent(productId)}&days=${days}`,{credentials:'same-origin',signal:AbortSignal.timeout(15000)}).catch(()=>{throw new Error('Could not load recorded prices. Check your connection and try again.');});
   const data=await response.json() as {observations?:unknown;error?:string};
   if(!response.ok)throw new Error(data.error||'Could not load price history.');
   if(!Array.isArray(data.observations)||data.observations.some(o=>!o||typeof o.offerId!=='string'||typeof o.observedAt!=='string'||typeof o.price!=='number'||typeof o.stock!=='string'))throw new Error('Invalid price history response.');
   const observations=data.observations as Observation[];
   cache.delete(key);cache.set(key,{at:now(),observations});
   while(cache.size>40)cache.delete(cache.keys().next().value!);
   return observations;
  })();
  pending.set(key,request);
  void request.finally(()=>pending.delete(key)).catch(()=>{});
  return request;
 };
}
