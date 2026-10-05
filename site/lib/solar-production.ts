import {calculators,validateValues,type Values} from './solar4u/calculator-config.ts';
import {localEstimate} from './solar4u/model.mjs';
import type {Report} from './guide-calculators.ts';
export type SolarArray={capacityKw:number;tilt:number;azimuth:number};
function validated(input:Values,arrays?:SolarArray[]):Values[]{
 const defaults=calculators.find(d=>d.id==='pv')!.defaults;
 if(input.annualUsageKwh>0&&input.annualUsageKwh<0.001)throw new Error('Enter annual electricity use as zero or at least 0.001 kWh.');
 if(arrays&&(!Array.isArray(arrays)||!arrays.length||arrays.length>12))throw new Error('Use 1–12 roof faces.');
 if(arrays?.some(a=>!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!['capacityKw','tilt','azimuth'].includes(k))||!['capacityKw','tilt','azimuth'].every(k=>typeof a[k as keyof SolarArray]==='number'&&Number.isFinite(a[k as keyof SolarArray]))))throw new Error('Each roof face needs only a numeric capacity, tilt and direction.');
 const rows:Values[]=(arrays??[{capacityKw:input.capacityKw,tilt:input.tilt,azimuth:input.azimuth}]).map(a=>({...defaults,...input,...a}));
 for(const row of rows){validateValues('pv',row);for(const f of calculators.find(d=>d.id==='pv')!.fields){if(!Number.isFinite(row[f.key])||row[f.key]<f.min||row[f.key]>f.max)throw new Error(`Check ${f.label}.`);}}
 if(rows.reduce((s,r)=>s+r.capacityKw,0)>1000)throw new Error('Combined capacity must be 1,000 kW or less.');
 return rows;
}
function report(input:Values,rows:Values[],months:number[][],climate=false):Report{
 const monthly=Array.from({length:12},(_,i)=>months.reduce((s,m)=>s+m[i],0)),annual=monthly.reduce((s,x)=>s+x,0),capacity=rows.reduce((s,r)=>s+r.capacityKw,0),usage=input.annualUsageKwh??10000,rate=input.electricityRate??0.19;
 const offset=usage>0?annual/usage*100:null;
 const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
 return{monthly,raw:{provider:climate?'EU JRC PVGIS 5.3':'Solar4U simplified seasonal model',annualKwh:annual,monthlyKwh:monthly,capacityKw:capacity,grossEnergyValue:annual*rate,energyOffsetPercent:offset,assumptions:climate?{technology:'crystSi',mounting:'free',terrainHorizon:true}:{peakSunHours:input.peakSunHours,lossesPercent:input.lossesPercent,method:'Solar4U simplified orientation, tilt and seasonal factors'},arrays:rows.map((r,i)=>({capacityKw:r.capacityKw,tilt:r.tilt,azimuth:r.azimuth,monthlyKwh:months[i]}))},stats:[{label:'Annual production',value:fmt(annual),unit:'kWh'},{label:'Average daily production',value:fmt(annual/365),unit:'kWh'},{label:'Annual energy / usage',value:offset===null?'No usage entered':fmt(offset),unit:offset===null?'':'%'},{label:'Gross energy value',value:fmt(annual*rate),unit:'USD / year'}],notice:climate?'PVGIS climate-based estimate · fixed crystalline-silicon arrays, free-standing mounting and terrain horizon. Monthly values are long-term averages, not a forecast. Roof shading and snow need separate review.':'Solar4U instant seasonal estimate · uses your peak-sun-hours assumption, not a weather dataset. Energy offset compares annual kWh only; gross value assumes every generated kWh receives the entered rate.'};
}
export function solarProduction(input:Values,arrays?:SolarArray[]):Report{const rows=validated(input,arrays);return report(input,rows,rows.map(r=>localEstimate(r).monthlyKwh));}
export function pvgisUrl(input:Values){
 const [r]=validated(input);const url=new URL('https://re.jrc.ec.europa.eu/api/v5_3/PVcalc');
 url.search=new URLSearchParams({lat:String(r.latitude),lon:String(r.longitude),peakpower:String(r.capacityKw),loss:String(r.lossesPercent),angle:String(r.tilt),aspect:String(((r.azimuth%360+360)%360)-180),pvtechchoice:'crystSi',mountingplace:'free',usehorizon:'1',outputformat:'json'}).toString();return url;
}
export async function readClimate(input:Values,arrays?:SolarArray[],fetcher:typeof fetch=fetch):Promise<Report>{
 const rows=validated(input,arrays),months:number[][]=[],sourceMeta:Record<string,unknown>[]=Array(rows.length);
 // Limit simultaneous upstream requests; zero-capacity faces require no network.
 for(let start=0;start<rows.length;start+=3){months.push(...await Promise.all(rows.slice(start,start+3).map(async (r,index)=>{
  if(r.capacityKw===0){sourceMeta[start+index]={capacityKw:0,provider:'Zero-capacity face; no provider request'};return Array(12).fill(0) as number[];}
  const response=await fetcher(pvgisUrl(r),{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('PVGIS is unavailable or outside its coverage. Your instant estimate is still available.');
  const data=await response.json() as {inputs?:{meteo_data?:Record<string,unknown>};outputs?:{monthly?:{fixed?:{month:number;E_m:number}[]}}};const fixed=data.outputs?.monthly?.fixed;
  if(!Array.isArray(fixed)||fixed.length!==12||new Set(fixed.map(m=>m.month)).size!==12||fixed.some(m=>!Number.isInteger(m.month)||m.month<1||m.month>12||typeof m.E_m!=='number'||!Number.isFinite(m.E_m)||m.E_m<0||m.E_m>r.capacityKw*24*31))throw new Error('PVGIS returned incomplete or implausible production data. Your instant estimate is still available.');
  sourceMeta[start+index]={capacityKw:r.capacityKw,tilt:r.tilt,azimuth:r.azimuth,meteorology:data.inputs?.meteo_data??null,retrievedAt:new Date().toISOString()};
  return [...fixed].sort((a,b)=>a.month-b.month).map(m=>m.E_m);
 })));}const result=report(input,rows,months,true);result.raw.sourceMeta=sourceMeta;return result;
}
export async function searchLocations(query:string,fetcher:typeof fetch=fetch){
 if(query.trim().length<2||query.length>100)throw new Error('Enter a city or postal code (2–100 characters).');
 const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query.trim(),count:'6',language:'en',format:'json'}).toString();
 const r=await fetcher(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('Location search is unavailable. Enter coordinates below.');
 const data=await r.json() as {results?:{id:number;name:string;admin1?:string;country?:string;latitude:number;longitude:number}[]};
 return(data.results??[]).slice(0,6).filter(l=>Number.isFinite(l.latitude)&&Math.abs(l.latitude)<=66&&Number.isFinite(l.longitude)&&Math.abs(l.longitude)<=180).map(l=>({id:l.id,label:[l.name,l.admin1,l.country].filter(Boolean).join(', '),latitude:l.latitude,longitude:l.longitude}));
}
