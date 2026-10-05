import type {Product} from './types.ts';

export interface SpecEstimate {key:string;label:string;value:string;basis:string;references:{label:string;url:string}[];}
const sandia='https://pvpmc.sandia.gov/modeling-guide/5-ac-system-output/pv-performance-metrics/normalized-efficiency/';
const fields=(p:Product)=>p.specification?.groups.flatMap(g=>g.fields)||[];
const verified=(p:Product,key:string)=>fields(p).find(f=>f.key===key&&f.kind!=='listing'&&p.specification?.sources.some(s=>s.url===f.source&&s.kind!=='listing'));
const positive=(v:unknown)=>{const n=Number(String(v).replace(/,/g,'').match(/^\s*(\d+(?:\.\d+)?)/)?.[1]);return Number.isFinite(n)&&n>0?n:undefined;};
const fmt=(n:number)=>Number(n.toFixed(n<10?2:1)).toString();
function form(p:Product){const text=p.name+' '+(p.specs.panelType||'')+' '+(p.specs.formFactor||'');return /flexible/i.test(text)?'flexible':/fold|portable/i.test(text)?'folding':/rigid|framed|bifacial|monofacial|mono facial/i.test(text)?'rigid':undefined;}
function voltageClass(p:Product){const n=positive(p.specs.systemVoltage??p.specs.systemVoltageV)??positive(p.name.match(/\b(12|24|48)\s*V\b/i)?.[1]);return n;}
const watts=(p:Product)=>positive(p.specification?.panelRatings?.stc.pmax)??positive(p.specs.watts);
const energy=(p:Product)=>{const f=verified(p,'capacityKwh');if(f){const n=positive(f.value);return n?(/kwh/i.test(f.value)?n:/wh/i.test(f.value)?n/1000:undefined):undefined;}return positive(p.specs.capacityKwh);};
const similar=(a?:number,b?:number)=>a!==undefined&&b!==undefined&&Math.abs(a-b)/a<=.2;
function measured(p:Product,key:string){
 const f=verified(p,key);const s=p.specification?.panelRatings;
 const value=key.startsWith('stc.')?s?.stc[key.slice(4)]:f?.value;
 const source=key.startsWith('stc.')?s?.sources?.[key]:f?.source;
 if(!value||!source||!p.specification?.sources.some(x=>x.url===source&&x.kind!=='listing'))return;
 let n=positive(value);if(!n)return;
 if(key==='weight'){const kg=value.match(/(\d+(?:\.\d+)?)\s*kg\b/i),lb=value.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/i);if(kg)n=Number(kg[1]);else if(lb)n=Number(lb[1])*.45359237;else return;}
 return {n,source};
}
/** Display-only comparisons. Never mutate Product.specs or the verified specification index. */
export function estimateSpecifications(p:Product,peers:Product[]):SpecEstimate[]{
 const out:SpecEstimate[]=[];
 if(p.category==='kits'||p.specs.batteryKind==='Battery cabinets')return out;
 const present=(key:string)=>key.startsWith('stc.')?Boolean(p.specification?.panelRatings?.stc[key.slice(4)]):fields(p).some(f=>f.key===key);
 function cohort(key:string,label:string,unit:string,compatible:(x:Product)=>boolean){
  if(present(key))return;
  const seen=new Set<string>();const refs=peers.filter(x=>x.id!==p.id&&x.category===p.category&&compatible(x)).flatMap(x=>{const m=measured(x,key),base=x.sourceUrl.split('?')[0];if(!m||seen.has(base))return [];seen.add(base);return [{...m,label:x.brand+' '+(verified(x,'model')?.value||x.name.split(' — ')[0])}];});
  if(refs.length<3)return;
  const low=Math.min(...refs.map(r=>r.n))*.95,high=Math.max(...refs.map(r=>r.n))*1.05;
  out.push({key,label,value:`~${fmt(low)}–${fmt(high)} ${unit}`,basis:`Comparison estimate from ${refs.length} independent products with matching format and size class (within 20%). Observed minimum–maximum widened by 5%; this is not a confidence interval or a product rating.`,references:refs.map(r=>({label:r.label,url:r.source}))});
 }
 if(p.category==='panels'){
  const w=watts(p),f=form(p),v=voltageClass(p);
  const compatible=(x:Product)=>Boolean(f&&form(x)===f&&similar(w,watts(x))&&(!p.specs.face||x.specs.face===p.specs.face)&&(!p.specs.cellType||x.specs.cellType===p.specs.cellType));
  for(const [key,label,unit] of [['voc','Open-circuit voltage (Voc)','V'],['vmp','Maximum-power voltage (Vmp)','V'],['imp','Maximum-power current (Imp)','A'],['isc','Short-circuit current (Isc)','A']])cohort('stc.'+key,label,unit,x=>compatible(x)&&v!==undefined&&voltageClass(x)===v);
  cohort('stc.efficiency','Module efficiency','%',compatible);cohort('weight','Weight','kg',compatible);
  // This lives outside the NOCT table: a assumed-cell-temperature model is not a NOCT rating.
  if(w&&!p.specification?.panelRatings?.noct.pmax&&!/perovsk|thin.?film|cigs|cdte/i.test(p.name+' '+p.specs.technology)&&/mono|poly|crystalline|topcon|perc|ibc|hpbc|hjt/i.test(p.name+' '+p.specs.technology+' '+p.specs.cellConstruction))out.push({key:'modeledPower',label:'Modeled power at 800 W/m²',value:`~${Math.floor(w*.72)}–${Math.ceil(w*.752)} W`,basis:`Assumes 45°C cell temperature and crystalline-silicon Pmax coefficient −0.5 to −0.3%/°C: ${w} W × 0.8 × (1 + coefficient × 20). Front-side output only; no rear-side gain. This is an illustrative operating estimate, not a published NOCT rating.`,references:[{label:'Sandia PVPMC temperature and irradiance model',url:sandia},{label:'Listed panel wattage',url:p.sourceUrl}]});
 }else if(p.category==='batteries'||p.category==='all-in-one'){
  const v=positive(p.specs.voltage),ah=positive(p.specs.capacityAh);
  if(!present('capacityKwh')&&v&&ah)out.push({key:'capacityKwh',label:'Nominal energy capacity',value:`~${fmt(v*ah/1000)} kWh`,basis:`Calculated from listed ${v} V × ${ah} Ah ÷ 1,000. Assumes those are nominal pack ratings; usable capacity will differ.`,references:[{label:'Selected listing voltage and capacity',url:p.sourceUrl}]});
  const format=p.specs.formFactor||p.specs.stationType;
  cohort('weight','Weight','kg',x=>Boolean(format&&format===(x.specs.formFactor||x.specs.stationType)&&similar(energy(p),energy(x))&&p.specs.chemistry&&p.specs.chemistry===x.specs.chemistry));
 }else if(p.category==='inverters'){
  const power=positive(verified(p,'outputWatts')?.value)??positive(p.specs.outputWatts),type=p.specs.inverterType;
  cohort('weight','Weight','kg',x=>Boolean(type&&x.specs.inverterType===type&&similar(power,positive(verified(x,'outputWatts')?.value)??positive(x.specs.outputWatts))));
 }
 return out;
}
/** Discard stale estimates when live listing identity or verified evidence changes. */
export function applicableEstimates(product:Product,record?:{identity:string;fields:SpecEstimate[]}){return record?.identity===estimateIdentity(product)?record.fields.filter(f=>{
 const key=f.key.startsWith('stc.')?f.key.slice(4):f.key,mapped=key==='efficiency'?'moduleEfficiency':key;
 if(product.specs[mapped]!==undefined&&product.specs[mapped]!=='')return false;
 return f.key==='modeledPower'?!product.specification?.panelRatings?.noct.pmax:f.key.startsWith('stc.')?!product.specification?.panelRatings?.stc[key]:!fields(product).some(x=>x.key===key);
 }):[];}
export function estimateIdentity(p:Product){return JSON.stringify([p.category,p.specs.watts,p.specs.voltage,p.specs.capacityAh,p.specs.capacityKwh,p.specs.panelType,p.specs.formFactor,p.specs.stationType,p.specs.chemistry,p.specs.cellType,p.specs.face,p.specs.systemVoltage,p.specs.systemVoltageV,p.specs.outputWatts,p.specs.inverterType,p.name]);}
