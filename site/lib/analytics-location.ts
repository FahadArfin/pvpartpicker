import type {AnalyticsLocation} from './build-analytics.ts';
export interface AddressResult extends AnalyticsLocation {precision:string;}
export async function searchAddresses(query:string,fetcher:typeof fetch=fetch):Promise<AddressResult[]> {
 if(typeof query!=='string'||query.trim().length<3||query.length>200)throw new Error('Enter an address, city or postal code (3–200 characters).');
 const url=new URL('https://photon.komoot.io/api/');url.search=new URLSearchParams({q:query.trim(),limit:'6',lang:'en'}).toString();
 const response=await fetcher(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json','User-Agent':'PVPartPicker/1.0 (https://github.com/FahadArfin/pvpartpicker)'}});
 if(!response.ok)throw new Error('Address search is unavailable. Select a point on the map or enter coordinates.');
 const data=await response.json() as {features?:{geometry?:{type?:string;coordinates?:unknown[]};properties?:Record<string,unknown>}[]};
 if(!Array.isArray(data.features))throw new Error('Address search returned an invalid result. Select a map point instead.');
 return data.features.slice(0,6).flatMap(feature=>{
  const coordinates=feature.geometry?.coordinates;if(feature.geometry?.type!=='Point'||!coordinates||coordinates.length<2)return [];
  const [longitude,latitude]=coordinates;if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>66||typeof longitude!=='number'||!Number.isFinite(longitude)||Math.abs(longitude)>180)return [];
  const p=feature.properties??{},str=(key:string)=>typeof p[key]==='string'?String(p[key]).slice(0,120):'';
  const street=[str('housenumber'),str('street')].filter(Boolean).join(' ');
  const label=[str('name'),street,str('city')||str('district')||str('county'),str('state'),str('postcode'),str('country')].filter((s,i,a)=>s&&a.indexOf(s)===i).join(', ').slice(0,200);
  return [{latitude,longitude,label:label||`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,precision:p.housenumber?'Address point':p.street?'Street / area':'Approximate locality'}];
 });
}
const limits=new Map<string,{until:number;count:number}>();let active=0;
export async function addressApi(request:Request,fetcher:typeof fetch=fetch) {
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(request.method!=='POST'||!request.headers.get('content-type')?.includes('application/json'))return json({error:'Send an address search as JSON.'},400);
 try {
  if(Number(request.headers.get('content-length'))>1500)throw new Error('Address search is too large.');
  const text=await request.text();if(text.length>1500)throw new Error('Address search is too large.');
  const input=JSON.parse(text);if(!input||typeof input.query!=='string'||input.query.length<3||input.query.length>200)throw new Error('Enter an address, city or postal code (3–200 characters).');
  const now=Date.now(),client=request.headers.get('cf-connecting-ip')??'local',limit=limits.get(client);
  for(const [key,v]of limits)if(v.until<=now)limits.delete(key);
  if((limit&&limit.until>now&&limit.count>=6)||active>=3||limits.size>=1000&&!limit)return json({error:'Address search is busy. Wait a minute or use the map.'},429);
  limits.set(client,{until:limit&&limit.until>now?limit.until:now+60000,count:limit&&limit.until>now?limit.count+1:1});
  active++;try{return json({locations:await searchAddresses(input.query,fetcher)});}finally{active--;}
 }catch{return json({error:'Could not find that address. Check the address or select a point on the map.'},400);}
}
