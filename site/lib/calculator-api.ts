import {addressApi} from './analytics-location.ts';
import {readClimate,searchLocations,type SolarArray} from './solar-production.ts';
import type {Values} from './guide-calculators.ts';
const cache=new Map<string,{expires:number;value:unknown}>();
const pending=new Map<string,Promise<unknown>>();
const requests=new Map<string,{until:number;count:number}>();
export async function calculatorApi(request:Request){
 const url=new URL(request.url),kind=url.searchParams.get('kind');
 if(kind==='address')return addressApi(request);
 if(request.method!=='GET')return Response.json({error:'Use GET for climate estimates.'},{status:405,headers:{'Cache-Control':'no-store'}});
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':status===200?'public, max-age=3600':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!['climate','location'].includes(kind??'')||url.search.length>5000)return json({error:'Invalid calculator request.'},400);
 const key=url.search,now=Date.now(),cached=cache.get(key);if(cached&&cached.expires>now)return json(cached.value);
 const client=request.headers.get('cf-connecting-ip')??'local',limit=requests.get(client);
 if(limit&&limit.until>now&&limit.count>=15)return json({error:'Too many requests. Wait a minute; the instant estimate remains available.'},429);
 if(requests.size>1000)for(const [key,v]of requests)if(v.until<=now)requests.delete(key);
 if(requests.size>=1000&&!requests.has(client))return json({error:'Calculator service is busy. Try again shortly.'},429);
 requests.set(client,{until:limit&&limit.until>now?limit.until:now+60000,count:limit&&limit.until>now?limit.count+1:1});
 try{
  let task=pending.get(key);
  if(!task){if(pending.size>=30)return json({error:'Calculator service is busy. Your instant estimate remains available.'},503);
   task=(async()=>{if(kind==='location')return {locations:await searchLocations(url.searchParams.get('q')??'')};
    const values=JSON.parse(url.searchParams.get('inputs')??'null') as Values,arrays=url.searchParams.has('arrays')?JSON.parse(url.searchParams.get('arrays')!) as SolarArray[]:undefined;
    if(!values||typeof values!=='object'||Array.isArray(values)||Object.values(values).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw new Error('Invalid solar inputs.');
    return await readClimate(values,arrays);
   })();pending.set(key,task);
   void task.finally(()=>{if(pending.get(key)===task)pending.delete(key);}).catch(()=>{});
  }
  const value=await task;if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(key,{value,expires:now+3600000});return json(value);
 }catch(e){return json({error:e instanceof Error?e.message:'Estimate unavailable. Use the instant estimate.'},400);}
}
