import {partColumns,partValue,type PartValue} from './part-comparison.ts';
import type {Product} from './types.ts';
import {connectionEvidence} from './connection-map.ts';
const detailed:Partial<Record<Product['category'],[string,string][]>>={
 panels:[['voc','Open-circuit voltage (Voc)'],['vmp','Maximum-power voltage (Vmp)'],['imp','Maximum-power current (Imp)'],['isc','Short-circuit current (Isc)'],['vocTemperatureCoefficient','Voc temperature coefficient'],['vmpTemperatureCoefficient','Vmp temperature coefficient'],['pmaxTemperatureCoefficient','Power temperature coefficient'],['dimensions','Dimensions']],
 inverters:[['mpptVoltageRange','MPPT operating voltage range'],['maxPvVoltage','Maximum PV voltage'],['mpptCount','Independent MPPT count'],['maxPvIsc','PV short-circuit current limit'],['batteryVoltageRange','Battery voltage range'],['acOutput','AC output voltage / phase'],['frequency','AC frequency']],
 batteries:[['capacityAh','Rated capacity (Ah)'],['maxChargeCurrent','Maximum charge current'],['peakDischargeCurrent','Peak discharge current'],['communications','Communications'],['dimensions','Dimensions']],
};
function detailedValue(p:Product,key:string):PartValue{
 if(p.specs.batteryKind==='Battery cabinets'&&key!=='dimensions')return {value:'N/A',note:'Empty battery cabinet; batteries are not included.'};
 const field=connectionEvidence(p)[key]??p.specification?.groups.flatMap(g=>g.fields).find(f=>f.key===key&&f.kind!=='listing'&&p.specification?.sources.some(s=>s.url===f.source&&s.kind!=='listing'));
 const value=field?{value:field.value,source:field.source}:p.comparisonSpecs?.[key];
 return value&&!/estimate|approx|unknown|not verified|not published/i.test(value.value)?value:{value:'—',note:'Not listed in sourced exact-model specifications.'};
}
export function comparisonRows(products:Product[],allSpecs=false):{key:string;label:string;help:string;values:PartValue[];different:boolean}[]{
 const columns=(p:Product)=>[...partColumns[p.category],...(allSpecs?(detailed[p.category]??[]).map(([key,label])=>({key,label,help:'Published exact-model specification. Missing values do not establish compatibility.'})):[])];
 const keys=new Map(products.flatMap(columns).map(c=>[c.key,c]));
 return [...keys.values()].map(c=>{const values=products.map(p=>columns(p).some(pc=>pc.key===c.key)?partColumns[p.category].some(pc=>pc.key===c.key)?partValue(p,c.key):detailedValue(p,c.key):{value:'N/A',note:'Different equipment category.'});return {...c,values,different:new Set(values.map(v=>v.value)).size>1};});
}
