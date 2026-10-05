import {categories,type Category,type Product} from './types.ts';

export interface PartColumn {key:string;label:string;help:string;numeric?:boolean;}
export interface PartValue {value:string;source?:string;note?:string;}
const col=(key:string,label:string,help:string,numeric=false):PartColumn=>({key,label,help,numeric});
export const partColumns:Record<Category|'all',PartColumn[]>={
 panels:[col('watts','Power (W)','Front-side rated power at STC, per panel.',true),col('face','Face','Monofacial or bifacial; not inferred from cell material.'),col('cell','Cells','Cell type and architecture, where listed.'),col('moduleEfficiency','Efficiency','Module efficiency at STC, not cell efficiency.',true)],
 batteries:[col('capacityKwh','Energy (kWh)','Nominal energy per battery. A calculated value uses rated voltage × Ah.',true),col('voltage','Voltage (V)','Actual rated DC voltage, not the rounded system class.',true),col('chemistry','Chemistry','Published cell chemistry; AGM and lithium batteries are different.'),col('formFactor','Format','Battery format or empty cabinet.'),col('maxDischargeCurrent','Discharge (A)','Maximum continuous battery discharge current; peak current is separate.',true)],
 'all-in-one':[col('capacityKwh','Energy','Internal storage per selected station; excludes optional expansion batteries.',true),col('outputWatts','AC output','Rated continuous AC output, excluding surge or power-boost claims.',true),col('maxPvWatts','PV input','Published total solar input limit.',true),col('maxMpptCurrent','PV amps','Published operating PV current per input or tracker; not short-circuit current.')],
 inverters:[col('outputWatts','AC out (kW)','Rated continuous AC output in kW; not solar input or surge.',true),col('maxPvWatts','PV max (kW)','Published total solar input limit; recommended array oversizing is separate.',true),col('maxMpptCurrent','PV A/MPPT','Operating current per tracker as published. Values are not added together.'),col('systemVoltage','Battery V','DC battery system voltage. AC output voltage is a different rating.',true)],
 charging:[col('chargeCurrentA','Charge amps','Rated battery charging current.',true),col('maxPvVoltage','PV volts','Maximum PV open-circuit voltage, not battery voltage.',true),col('maxPvWatts','PV power','Published PV power allowance; voltage-dependent limits remain as listed.'),col('voltage','Battery V','Supported nominal battery voltage or voltage range.')],
 wiring:[col('gauge','Gauge','Wire gauge or cross-section as listed.'),col('length','Length','Length of the selected cable or spool.'),col('connector','Connector','Listed connector or terminal type.')],
 mounting:[col('mountType','Type','Roof, ground, rail, clamp or other mounting hardware.'),col('material','Material','Listed construction material.'),col('dimensions','Size','Published dimensions; fit is checked against the exact module or roof.')],
 electrical:[col('electricalType','Type','Protection, distribution, conduit or enclosure category.'),col('ratedCurrent','Rated amps','Continuous current rating; interrupting capacity is a different rating.',true),col('ratedVoltage','Rated volts','Published rating including AC/DC restrictions.')],
 monitoring:[col('monitorType','Function','Energy meter, battery monitor, sensor or controls.'),col('channels','Channels','Published channel or circuit count.',true),col('communications','Connection','Listed wired or wireless communications.')],
 'module-electronics':[col('moduleFunction','Function','Optimizer, rapid shutdown or gateway.'),col('ratedCurrent','Rated amps','Published operating current limit.',true),col('ratedVoltage','Rated volts','Published voltage limit.')],
 kits:[col('kitType','Bundle type','Equipment included in this selected bundle.'),col('contents','Includes','Selected component types and quantities; optional components are excluded.')],
 accessories:[col('accessoryType','Type','Accessory function.'),col('compatibility','Fits','Listed compatible equipment.'),col('dimensions','Size','Published dimensions.')],
 all:[col('category','Category','Equipment category.'),col('highlights','Key specs','Category-specific ratings. Open a category for aligned spec columns.')],
};
const relevantKeys=new Set([...Object.values(partColumns).flat().map(c=>c.key),'model','cellType','technology','capacityAh','outputWatts','maxPvWatts','systemVoltage','voltage','ratedVoltage','lengthFt']);

/** Keep only matched technical fields in the lightweight catalog response. */
export function comparisonEvidence(product:Product):Record<string,PartValue>{
 const result:Record<string,PartValue>={};
 for(const field of product.specification?.groups.flatMap(g=>g.fields)??[]){
  if(relevantKeys.has(field.key)&&field.kind!=='listing'&&product.specification?.sources.some(s=>s.url===field.source&&s.kind!=='listing')&&!/not verified|not published|unknown/i.test(field.value))result[field.key]={value:field.value,source:field.source};
 }
 return result;
}
function raw(product:Product,key:string):PartValue|undefined{
 const evidence=product.comparisonSpecs?.[key]??comparisonEvidence(product)[key];if(evidence)return evidence;
 const value=product.specs[key];if(value===undefined||value===null||value===''||typeof value==='boolean')return;
 return {value:String(value),source:product.sourceUrl,note:'Listed product specification'};
}
const number=(v:PartValue|undefined)=>v&&/^\s*[\d,]+(?:\.\d+)?\s*(?:k?wh|ah|k?w|v(?:dc)?|a|%)?\s*$/i.test(v.value)?Number(v.value.match(/[\d,]+(?:\.\d+)?/)![0].replace(/,/g,'')):undefined;
const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:3});
function unit(v:PartValue|undefined,suffix:string):PartValue|undefined{return v?{...v,value:/^\d+(?:\.\d+)?$/.test(v.value)?fmt(Number(v.value))+' '+suffix:v.value}:undefined;}
function power(v:PartValue|undefined):PartValue|undefined{
 const n=number(v);if(v&&n!==undefined)return {...v,value:fmt(/kw/i.test(v.value)?n:n/1000)+' kW'};
 if(v){const ratings=[...v.value.matchAll(/([\d,]+(?:\.\d+)?)\s*(kw|w)\b/gi)].map(m=>fmt(Number(m[1].replace(/,/g,''))*(m[2].toLowerCase()==='kw'?1:.001)));if(ratings.length)return {...v,value:[...new Set(ratings)].join(' / ')+' kW',note:v.value};}
 return v;
}
function energy(product:Product):PartValue|undefined{
 const v=raw(product,'capacityKwh');if(v){const n=number(v);return n!==undefined?{...v,value:fmt(/\bwh\b/i.test(v.value)&&!/kwh/i.test(v.value)?n/1000:n)+' kWh'}:v;}
 const ah=raw(product,'capacityAh'),volts=raw(product,'voltage'),a=number(ah),b=number(volts);
 // A title's rounded "12 V" system class is not a 12.8 V battery nameplate.
 if(a&&b&&(volts?.note!=='Listed product specification'||[12.8,25.6,51.2].includes(b)))return {value:fmt(a*b/1000)+' kWh',source:ah?.source,note:'Calculated nominal energy: '+volts!.value+' × '+ah!.value+' / 1,000. Not usable energy.'};
}
export function partValue(product:Product,key:string):PartValue{
 let value:PartValue|undefined;
 const cabinet=product.specs.batteryKind==='Battery cabinets';
 if(cabinet&&['capacityKwh','voltage','maxDischargeCurrent','chemistry'].includes(key))return {value:'N/A',note:'Empty battery cabinet; batteries are not included.'};
 if(key==='category')return {value:categories.find(c=>c.id===product.category)!.label};
 if(key==='highlights')return {value:partColumns[product.category].slice(0,3).map(c=>partValue(product,c.key).value).filter(v=>v!=='—').join(' · ')||'—'};
 if(key==='contents')return {value:product.configuration?.components.map(c=>(c.quantity?c.quantity+' × ':'')+({panels:'panels',batteries:'batteries',inverter:'inverter','power-station':'station',mounting:'mounts',controls:'controls',charging:'charger',accessories:'extras'}[c.type])).join(' + ')||'—'};
 if(key==='cell')return {value:[raw(product,'cellType')?.value,raw(product,'technology')?.value].filter(Boolean).join(' · ')||'—'};
 if(key==='capacityKwh')value=energy(product);
 else if(key==='outputWatts'&&product.specs.stationType==='DC-only station (no AC inverter)')return {value:'DC only',note:'No AC inverter.'};
 else if(key==='outputWatts'||key==='maxPvWatts')value=power(raw(product,key));
 else if(key==='systemVoltage'){
  value=unit(raw(product,'systemVoltageV')??raw(product,'systemVoltage')??(number(raw(product,'voltage'))!<120?raw(product,'voltage'):undefined),'V');
 }else if(key==='length')value=raw(product,'length')??unit(raw(product,'lengthFt'),'ft');
 else if(key==='formFactor'&&cabinet)value={value:'Empty cabinet'};
 else value=raw(product,key);
 const units:Record<string,string>={watts:'W',voltage:'V',ratedVoltage:'V',ratedCurrent:'A',maxPvVoltage:'V',chargeCurrentA:'A',maxMpptCurrent:'A',maxDischargeCurrent:'A',moduleEfficiency:'%'};
 if(units[key])value=unit(value,units[key]);
 return value??{value:'—',note:'Not listed in the matched specifications. Open details to check the source.'};
}

function clean(text:string){return text.replace(/®|™/g,'').replace(/\s+/g,' ').trim();}
/** A display name only: retailer titles and selected SKU identifiers are preserved. */
export function productListName(product:Product):string{
 const title=clean(product.name),main=title.split(/\s—\s/)[0];
 const model=raw(product,'model')?.value;
 if(model&&!/^(?:[\d-]+$|description$|model$|n\/?a|none|default|not|pre[ -]?assembled)/i.test(model)&&model.length<55&&!/[,;]|\s\/\s/.test(model))return clean(product.brand+' '+model).replace(/^(\S+)\s+\1\b/i,'$1');
 let base=product.configuration?.kind==='standalone'?product.configuration.components[0]?.detail??main:product.configuration?.kind==='combo'?product.configuration.title.split(' · ')[0]:main;
 const segments=base.split('|').map(s=>s.trim());
 // Pipe-separated manufacturer model codes often sit after the marketing name.
 const code=segments.find(s=>/\d/.test(s)&&/^(?:[A-Z]{2,}[\d-][A-Z\d-]*|MIN\s+\d+[A-Z\d -]*)$/i.test(s)&&s.length<40&&!/\b(?:w|wh|kw|kwh|v|ah)\b/i.test(s));
 base=segments.find(s=>!/^fire sale|^sale|^clearance|^new!?$/i.test(s))??segments[0];
 if(segments.length>1&&base.toLowerCase()===product.brand.toLowerCase())base+=' '+segments[1];
 base=base.replace(/^(?:fire sale|sale|clearance)\s*[:!–-]\s*/i,'').replace(/^New\s+/,'').replace(/\[[^\]]*(?:ship|sale|pre.?order|warranty)[^\]]*\]/gi,'');
 base=base.split(/\s+(?:with|for|compatible with|supports?|up to)\s+/i)[0].split(/\s\+\s/)[0].split(/\s[–—]\s|,|:\s/)[0];
 if(product.category!=='kits')base=base.replace(/\b\d[\d,.]*(?:\s*\/\s*\d[\d,.]*)*\s*(?:kwh|wh|kilowatts?|watts?|kw|w|volts?|v|ah|amps?)\b/gi,'').replace(/\b(?:high efficiency|high-efficiency|ultra.?efficient|ultra.?fast charging|plug.and.play|all.in.one|monocrystalline|polycrystalline|lithium iron phosphate|lifepo4)\b/gi,'');
 base=base.replace(/\s+-\s+$/,'').replace(/\bportable power station\b/gi,'Power Station').replace(/\bsolar generator\b/gi,'Power Station');
 base=base.replace(/\s+-\s+\d+\s*x\s*MPPTs\b.*$/i,'');
 if(code&&!base.toLowerCase().includes(code.toLowerCase()))base=product.brand+' '+code;
 base=clean(base.replace(/\(\s*\)/g,'').replace(/\s+-\s+/g,' ')).replace(/^[\s|/,:-]+|[\s|/,:\-(]+$/g,'');
 if(!/shopsolar|santan|current connected|signature solar|unknown/i.test(product.brand)&&!base.toLowerCase().startsWith(product.brand.toLowerCase())&&!/^(?:Victron|EG4|EcoFlow|Anker|Pecron|Renogy|Canadian Solar|Tigo|Eaton|BigBattery|Mango Power|Sol-Ark|RUiXU|SolaX)\b/i.test(base))base=product.brand+' '+base;
 if(product.configuration?.kind==='combo'&&!/\bkit|bundle|combo\b/i.test(base))base+=' Bundle';
 if(!base)base=product.brand+' '+categories.find(c=>c.id===product.category)!.singular;
 return base;
}
export function productListVariant(product:Product):string{
 const variant=product.name.split(/\s—\s/).slice(1).join(' · ');
 if(product.configuration?.kind==='combo')return product.configuration.selection;
 const color=product.specs.color;
 return clean((variant||[product.brand,color].filter(Boolean).join(' · ')).replace(/\p{Extended_Pictographic}|\uFE0F/gu,'').replace(/[（(](?:most chosen|best value|most popular)[）)]/gi,''));
}
export function sortPartsByColumn(products:Product[],key:string,direction:'asc'|'desc'):Product[]{
 return [...products].sort((a,b)=>{
  const av=partValue(a,key).value,bv=partValue(b,key).value;
  const an=number({value:av}),bn=number({value:bv});
  // Missing values remain last in either direction.
  if(an===undefined||bn===undefined)return an===undefined&&bn===undefined?a.name.localeCompare(b.name):an===undefined?1:-1;
  return (an-bn)*(direction==='asc'?1:-1)||a.name.localeCompare(b.name);
 });
}
