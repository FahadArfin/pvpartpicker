import {partColumns,partValue,type PartValue} from './part-comparison.ts';
import type {Product} from './types.ts';
import {connectionEvidence} from './connection-map.ts';
const detailed:Partial<Record<Product['category'],[string,string][]>>={
 panels:[['voc','Open-circuit voltage (Voc)'],['vmp','Maximum-power voltage (Vmp)'],['imp','Maximum-power current (Imp)'],['isc','Short-circuit current (Isc)'],['vocTemperatureCoefficient','Voc temperature coefficient'],['vmpTemperatureCoefficient','Vmp temperature coefficient'],['pmaxTemperatureCoefficient','Power temperature coefficient'],['dimensions','Dimensions']],
 inverters:[['mpptVoltageRange','MPPT operating voltage range'],['maxPvVoltage','Maximum PV voltage'],['mpptCount','Independent MPPT count'],['maxPvIsc','PV short-circuit current limit'],['batteryVoltageRange','Battery voltage range'],['acOutput','AC output voltage / phase'],['frequency','AC frequency']],
 batteries:[['capacityAh','Rated capacity (Ah)'],['maxChargeCurrent','Maximum charge current'],['peakDischargeCurrent','Peak discharge current'],['chargeTemperature','Charge temperature'],['dischargeTemperature','Discharge temperature'],['communications','Communications'],['dimensions','Dimensions']],
 charging:[['mpptVoltageRange','MPPT operating voltage range'],['mpptCount','Independent MPPT count'],['maxMpptCurrent','Maximum MPPT input current'],['maxPvIsc','PV short-circuit current limit'],['operatingTemperature','Operating temperature']],
 'all-in-one':[['mpptVoltageRange','MPPT operating voltage range'],['mpptCount','Independent MPPT count'],['maxPvVoltage','Maximum PV voltage'],['maxPvIsc','PV short-circuit current limit'],['acOutput','AC output voltage'],['surgeWatts','Surge output (published duration)'],['dimensions','Dimensions']],
 wiring:[['conductor','Conductor material'],['ratedVoltage','Rated voltage'],['ratedCurrent','Rated current']],
 electrical:[['interruptRating','Interrupt / breaking capacity'],['poles','Poles'],['ipRating','Ingress protection']],
 mounting:[['compatibility','Supported equipment / fit'],['tilt','Tilt range']],
 monitoring:[['accuracy','Measurement accuracy'],['ipRating','Ingress protection']],
 'module-electronics':[['maxPvVoltage','Maximum PV voltage'],['efficiency','Conversion efficiency'],['communications','Communications']],
 accessories:[['material','Material'],['ipRating','Ingress protection']],
};
const unknown=()=>({value:'—',note:'Not listed in sourced exact-model specifications.'});
const uncertain=/estimate|approx|unknown|not verified|not published|not documented|not listed/i;
const units:Record<string,string>={voc:'V',vmp:'V',imp:'A',isc:'A',capacityAh:'Ah',maxChargeCurrent:'A',peakDischargeCurrent:'A',maxPvVoltage:'V',maxPvIsc:'A',maxMpptCurrent:'A',ratedCurrent:'A',ratedVoltage:'V',surgeWatts:'W'};
/** Compare scalar formatting, never infer values or normalize operating ranges. */
function differenceValue(value:string):string{
 const scalar=value.trim().match(/^([-+]?[\d,]+(?:\.\d+)?)\s*(V|VDC|A|W|kW|Ah|Wh|kWh|%)$/i);
 return scalar?Number(scalar[1].replace(/,/g,''))+' '+scalar[2].toLowerCase():value.trim().replace(/\s+/g,' ');
}
function detailedValue(p:Product,key:string):PartValue{
 if(p.specs.batteryKind==='Battery cabinets'&&key!=='dimensions')return {value:'N/A',note:'Empty battery cabinet; batteries are not included.'};
 const field=connectionEvidence(p)[key]??p.specification?.groups.flatMap(g=>g.fields).find(f=>f.key===key&&f.kind!=='listing'&&p.specification?.sources.some(s=>s.url===f.source&&s.kind!=='listing'));
 const value=field?{value:field.value,source:field.source}:p.comparisonSpecs?.[key];
 if(!value?.source||uncertain.test(value.value))return unknown();
 return {...value,value:units[key]&&/^\d+(?:\.\d+)?$/.test(value.value)?value.value+' '+units[key]:value.value,note:field?'Sourced exact-model specification':value.note};
}
export interface ComparisonRow {key:string;label:string;help:string;values:PartValue[];different:boolean;}
/** Coverage is calculated before filtering so equal missing fields remain visible as gaps. */
export function comparisonCoverage(rows:ComparisonRow[],products:Product[]):{id:string;missing:number;applicable:number}[]{
 return products.map((p,index)=>({id:p.id,missing:rows.filter(r=>r.values[index]?.value==='—').length,applicable:rows.filter(r=>r.values[index]?.value!=='N/A').length}));
}
export function comparisonRows(products:Product[],allSpecs=false):ComparisonRow[]{
 const columns=(p:Product)=>[...partColumns[p.category],...(allSpecs?(detailed[p.category]??[]).map(([key,label])=>({key,label,help:'Published exact-model specification. Missing values do not establish compatibility.'})):[])];
 const keys=new Map(products.flatMap(columns).map(c=>[c.key,c]));
 return [...keys.values()].map(c=>{const values=products.map(p=>{
  if(!columns(p).some(pc=>pc.key===c.key))return {value:'N/A',note:'Different equipment category.'};
  const sourced=Object.fromEntries(Object.entries(connectionEvidence(p)).map(([key,field])=>[key,{value:field.value,source:field.source,note:'Sourced exact-model specification'}]));
  const value=partColumns[p.category].some(pc=>pc.key===c.key)?partValue({...p,comparisonSpecs:{...p.comparisonSpecs,...sourced}},c.key):detailedValue(p,c.key);
  return uncertain.test(value.value)?unknown():value;
 });return {...c,values,different:new Set(values.map(v=>differenceValue(v.value))).size>1};});
}
