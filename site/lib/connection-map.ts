import type {Build,Compatibility,Product,PVArray,SpecificationField} from './types.ts';

export interface ConnectionCheck extends Compatibility {key:string;value?:number;limit?:number;}
export interface InputLimits {count?:number;voc?:number;vmp?:[number,number];imp?:number;isc?:number;ports?:number;watts?:number;totalWatts?:number;batteryRange?:[number,number];batteryNominal?:number;}
export interface ArrayValues {voc?:number;vmp?:number;imp?:number;isc?:number;watts?:number;coldVoc?:number;hotVmp?:number;coldVmp?:number;}
export interface ArrayConnection {array:PVArray;panel?:Product;receiver?:Product;battery?:Product;values:ArrayValues;limits:InputLimits;checks:ConnectionCheck[];batteryChecks:ConnectionCheck[];status:Compatibility['status'];}
const round=(n:number)=>Math.round(n*10000)/10000;
const missing='Not documented for this exact model.';
const kinds=['datasheet','manual','manufacturer','retailer'];
function fields(p?:Product){return [...Object.values(p?.connectionSpecs||{}).filter(f=>f.kind&&kinds.includes(f.kind)&&f.source),...(p?.specification?.groups.flatMap(g=>g.fields)||[]).filter(f=>f.kind!=='listing'&&p?.specification?.sources.some(s=>s.url===f.source&&kinds.includes(s.kind)))].filter(f=>!/estimate|approx|not verified|unknown/i.test(f.value)).sort((a,b)=>kinds.indexOf(a.kind||'retailer')-kinds.indexOf(b.kind||'retailer'));}
const electricalKeys=new Set(['voc','vmp','imp','isc','watts','pmax','vocTemperatureCoefficient','vmpTemperatureCoefficient','maxSystemVoltage','mpptCount','maxPvVoltage','mpptVoltageRange','maxMpptCurrent','maxPvIsc','inputsPerMppt','maxPvWattsPerMppt','maxPvWatts','batteryVoltageRange','batteryVoltageRangeLithium','batteryVoltageRangeLeadAcid','voltage','operatingVoltage','chemistry']);
/** Selected-product transport only; never add full sheets to the shared catalog. */
export function connectionEvidence(p:Product):Record<string,SpecificationField>{
 const out:Record<string,SpecificationField>={};
 for(const f of fields(p))if(electricalKeys.has(f.key)&&!out[f.key])out[f.key]={...f,kind:f.kind||p.specification?.sources.find(s=>s.url===f.source)?.kind};
 const ratings=p.specification?.panelRatings;
 for(const key of ['pmax','voc','vmp','imp','isc']){const value=ratings?.stc[key],source=ratings?.sources?.['stc.'+key],evidence=p.specification?.sources.find(s=>s.url===source&&kinds.includes(s.kind));if(value&&source&&evidence)out[key]={key,label:key,value,source,kind:evidence.kind};}
 return out;
}
export function connectionRequest(value:unknown):string[]{
 const ids=(value as {productIds?:unknown})?.productIds;
 if(!Array.isArray(ids)||ids.length>100||ids.some(id=>typeof id!=='string'||!id||id.length>180)||new Set(ids).size!==ids.length)throw new Error('Select up to 100 unique product IDs.');
 return ids;
}
function field(p:Product|undefined,key:string):SpecificationField|undefined{return fields(p).find(f=>f.key===key);}
function scalar(value?:string):number|undefined{
 if(!value)return;const match=value.trim().replace(/,/g,'').match(/^([-+]?\d+(?:\.\d+)?)\s*(kW|W|V(?:DC)?|A(?: DC)?|%\s*\/\s*[°º]C)?$/i);if(!match)return;
 const n=Number(match[1])*(match[2]?.toLowerCase()==='kw'?1000:1);return Number.isFinite(n)?n:undefined;
}
function measured(p:Product|undefined,key:string):number|undefined{
 const ratings=p?.specification?.panelRatings,source=ratings?.sources?.['stc.'+key],value=ratings?.stc[key];
 if(value&&source&&p?.specification?.sources.some(s=>s.url===source&&kinds.includes(s.kind)))return scalar(value);
 return scalar(field(p,key)?.value);
}
function positive(p:Product|undefined,key:string){const n=measured(p,key);return n!==undefined&&n>0?n:undefined;}
function range(p:Product|undefined,key:string):[number,number]|undefined{
 const text=field(p,key)?.value.replace(/[–—]/g,'-');if(!text)return;
 const m=text.trim().match(/^(\d+(?:\.\d+)?)\s*(?:V(?:DC)?)?\s*-\s*(\d+(?:\.\d+)?)\s*(?:V(?:DC)?)?$/i);
 if(!m)return;const low=Number(m[1]),high=Number(m[2]);return low>0&&high>low?[low,high]:undefined;
}
function perTracker(p:Product,key:string,tracker:number,count?:number){
 const evidence=field(p,key),value=evidence?.value;if(!value)return;
 const tokens=value.split(/\s*[\/|]\s*/),numbers=tokens.map(scalar);
 if(numbers.some(n=>n===undefined||n<=0))return;
 if(tokens.length===1){if(count&&count>1&&['maxMpptCurrent','maxPvIsc'].includes(key)&&!/per (?:mppt|tracker)|each (?:mppt|tracker)/i.test(evidence!.label))return;return numbers[0];}
 return count&&tokens.length===count?numbers[tracker-1]:undefined;
}
export function receiverLimits(p?:Product,tracker=1,battery?:Product):InputLimits{
 if(!p)return {};const n=positive(p,'mpptCount'),count=n&&Number.isInteger(n)&&n<=200?n:undefined;
 const chemistry=field(battery,'chemistry')?.value,chemistryRange=chemistry&&/LiFePO4|lithium/i.test(chemistry)?range(p,'batteryVoltageRangeLithium'):chemistry&&/lead.?acid|AGM|gel/i.test(chemistry)?range(p,'batteryVoltageRangeLeadAcid'):undefined;
 return {count,voc:positive(p,'maxPvVoltage'),vmp:range(p,'mpptVoltageRange'),imp:perTracker(p,'maxMpptCurrent',tracker,count),isc:perTracker(p,'maxPvIsc',tracker,count),ports:perTracker(p,'inputsPerMppt',tracker,count),watts:perTracker(p,'maxPvWattsPerMppt',tracker,count),totalWatts:positive(p,'maxPvWatts'),batteryRange:range(p,'batteryVoltageRange')??chemistryRange,batteryNominal:positive(p,'voltage')};
}
const status=(checks:ConnectionCheck[]):Compatibility['status']=>checks.some(c=>c.status==='mismatch')?'mismatch':checks.some(c=>c.status==='unknown')?'unknown':'match';
export const connectionStatus=status;
export function selectedReceivers(build:Build,products:Product[]){return products.filter(p=>build.lines.some(l=>l.productId===p.id)&&['inverters','charging','all-in-one'].includes(p.category));}
export function arrayValues(p:Product|undefined,a:PVArray,min?:number,max=70):ArrayValues{
 const voc=positive(p,'voc'),vmp=positive(p,'vmp'),imp=positive(p,'imp'),isc=positive(p,'isc'),w=positive(p,'pmax')??positive(p,'watts');
 const cv=measured(p,'vocTemperatureCoefficient'),cm=measured(p,'vmpTemperatureCoefficient');
 const validCoeff=(n:number|undefined)=>n!==undefined&&n<=0&&n>=-1;
 return {voc:voc&&round(voc*a.series),vmp:vmp&&round(vmp*a.series),imp:imp&&round(imp*a.parallel),isc:isc&&round(isc*a.parallel),watts:w&&round(w*a.series*a.parallel),coldVoc:voc&&validCoeff(cv)&&min!==undefined?round(voc*a.series*(1+cv!/100*(Math.min(min,25)-25))):undefined,hotVmp:vmp&&validCoeff(cm)?round(vmp*a.series*(1+cm!/100*(max-25))):undefined,coldVmp:vmp&&validCoeff(cm)&&min!==undefined?round(vmp*a.series*(1+cm!/100*(Math.min(min,25)-25))):undefined};
}
function comparison(key:string,title:string,value:number|undefined,limit:number|undefined,strict=false,source?:string):ConnectionCheck{
 const unknown=value===undefined||limit===undefined;
 return {key,title,value,limit,status:unknown?'unknown':(strict?value<limit:value<=limit)?'match':'mismatch',detail:unknown?missing:`${value.toFixed(1)} ${['imp','isc'].includes(key)?'A':'V'} / ${limit.toFixed(1)} ${['imp','isc'].includes(key)?'A':'V'} limit.`,source};
}
function voltageWindow(key:string,title:string,value:number|undefined,limits:InputLimits):ConnectionCheck{
 return {key,title,value,status:value===undefined||!limits.vmp?'unknown':value>=limits.vmp[0]&&value<=limits.vmp[1]?'match':'mismatch',detail:value===undefined||!limits.vmp?missing:`${value.toFixed(1)} V / ${limits.vmp[0]}–${limits.vmp[1]} V MPPT window.`};
}
export function connectionMap(build:Build,products:Product[]){
 const arrays=build.settings.pvArrays||[],selected=new Map(build.lines.map(l=>[l.productId,l.quantity])),receivers=new Map(selectedReceivers(build,products).map(p=>[p.id,p])),productMap=new Map(products.map(p=>[p.id,p]));
 const panels=products.filter(p=>selected.has(p.id)&&p.category==='panels');
 const allocations=panels.map(panel=>{const used=arrays.filter(a=>a.panelId===panel.id).reduce((n,a)=>n+a.series*a.parallel,0),quantity=selected.get(panel.id)!;return {panel,used,quantity,remaining:quantity-used,status:(used>quantity?'mismatch':used===quantity?'match':'unknown') as Compatibility['status']};});
 const results:ArrayConnection[]=arrays.map(a=>{
  const panel=panels.find(p=>p.id===a.panelId),receiver=receivers.get(a.receiverId||''),chosen=productMap.get(a.batteryId||''),battery=chosen&&selected.has(chosen.id)&&chosen.category==='batteries'&&chosen.specs.batteryKind!=='Battery cabinets'?chosen:undefined;
  const limits=receiverLimits(receiver,a.tracker,battery),values=arrayValues(panel,a,build.settings.minimumTemperature,build.settings.maximumCellTemperature??70);
  const reused=arrays.some(b=>b.id!==a.id&&b.receiverId&&b.receiverId===a.receiverId&&b.receiverUnit===a.receiverUnit&&b.tracker===a.tracker);
  const invalid=!panel||(a.receiverId&&!receiver)||(receiver&&a.receiverUnit>selected.get(receiver.id)!)||(limits.count&&a.tracker>limits.count)||reused||allocations.some(p=>p.panel.id===a.panelId&&p.remaining<0);
  const checks:ConnectionCheck[]=[{key:'assignment',title:'Input assignment',status:invalid?'mismatch':!receiver||!limits.count?'unknown':'match',detail:reused?'This MPPT is used twice. Combine identical strings into one arrangement; keep different panel models on separate trackers.':invalid?'Equipment was removed, an input/unit is out of range, or too many panels are assigned.':!receiver?'Choose a solar input.':!limits.count?'Independent MPPT count is not documented.':`Unit ${a.receiverUnit}, MPPT ${a.tracker}; ${a.series*a.parallel} selected panels assigned.`},comparison('coldVoc','Cold Voc',values.coldVoc,limits.voc,true,field(receiver,'maxPvVoltage')?.source),voltageWindow('vmp','Vmp at STC',values.vmp,limits),voltageWindow('hotVmp','Hot-cell Vmp',values.hotVmp,limits),voltageWindow('coldVmp','Cold-cell Vmp',values.coldVmp,limits),comparison('imp','Operating current (Imp)',values.imp,limits.imp,false,field(receiver,'maxMpptCurrent')?.source),comparison('isc','Short-circuit current (Isc)',values.isc,limits.isc,false,field(receiver,'maxPvIsc')?.source),comparison('moduleVoltage','Panel system-voltage rating',values.coldVoc,positive(panel,'maxSystemVoltage'),true,field(panel,'maxSystemVoltage')?.source)];
  if(limits.ports!==undefined)checks.push({key:'ports',title:'Direct parallel inputs',status:a.parallel<=limits.ports?'match':'mismatch',detail:`${a.parallel} strings / ${limits.ports} documented direct inputs. External combining needs separate verification.`});
  const unitArrays=arrays.filter(b=>b.receiverId===a.receiverId&&b.receiverUnit===a.receiverUnit),unitWatts=unitArrays.map(b=>arrayValues(panels.find(p=>p.id===b.panelId),b).watts);
  const powerKnown=unitWatts.length>0&&unitWatts.every(w=>w!==undefined),total=powerKnown?round(unitWatts.reduce((n,w)=>n+w!,0)):undefined;
  checks.push({key:'pvPower',title:'PV power planning',status:values.watts===undefined||(!limits.watts&&!limits.totalWatts)||total===undefined?'unknown':(limits.watts&&values.watts>limits.watts)||(limits.totalWatts&&total>limits.totalWatts)?'unknown':'match',detail:`Array: ${values.watts??'unknown'} W. Unit total: ${total??'unknown'} W. ${limits.watts?`Tracker rating ${limits.watts} W. `:''}${limits.totalWatts?`Unit utilized/input rating ${limits.totalWatts} W. `:''}Review permitted DC oversizing and clipping in the manual.`});
  const batteryChecks:ConnectionCheck[]=[];
  if(receiver?.category==='all-in-one')batteryChecks.push({key:'batteryRange',title:'Integrated battery',status:'unknown',detail:'The station has an integrated battery. Standalone batteries cannot be assumed compatible with proprietary expansion ports.'});
  else if(!battery)batteryChecks.push({key:'batteryRange',title:'Battery connection',status:'unknown',detail:a.batteryId?'Selected battery was removed or is not a standalone battery.':'Choose a battery to check its DC voltage. Grid-only equipment may not support storage.'});
  else{
   const voltage=positive(battery,'voltage'),envelope=range(battery,'operatingVoltage'),rangeKnown=Boolean(envelope&&limits.batteryRange);
   batteryChecks.push({key:'batteryRange',title:'Battery operating voltage',status:rangeKnown?(envelope![0]>=limits.batteryRange![0]&&envelope![1]<=limits.batteryRange![1]?'match':'mismatch'):'unknown',detail:rangeKnown?`${envelope![0]}–${envelope![1]} V battery / ${limits.batteryRange![0]}–${limits.batteryRange![1]} V supported.`:'Battery operating envelope or receiver battery range is not documented.',source:field(battery,'operatingVoltage')?.source});
   batteryChecks.push({key:'batteryNominal',title:'Nominal voltage check',status:voltage&&limits.batteryRange?(voltage>=limits.batteryRange[0]&&voltage<=limits.batteryRange[1]?'match':'mismatch'):'unknown',detail:`${voltage??'Unknown'} V nominal / ${limits.batteryRange?limits.batteryRange[0]+'–'+limits.batteryRange[1]+' V supported':'receiver range not documented'}. Battery quantity does not multiply voltage; no battery-series wiring is assumed.`});
   batteryChecks.push({key:'batterySupport',title:'Battery controls & protection',status:'unknown',detail:'Exact-model approval, CAN/RS485, firmware, charge settings, current limits and parallel-battery support require manufacturer verification.'});
  }
  return {array:a,panel,receiver,battery,values,limits,checks,batteryChecks,status:status(checks)};
 });
 return {arrays:results,allocations,checks:results.flatMap(r=>[...r.checks,...r.batteryChecks])};
}
export function suggestArray(build:Build,products:Product[],array:PVArray):{layout?:{series:number;parallel:number};unused?:number;message:string}{
 const panel=products.find(p=>p.id===array.panelId&&p.category==='panels'),receiver=selectedReceivers(build,products).find(p=>p.id===array.receiverId),limits=receiverLimits(receiver,array.tracker);
 const available=(build.lines.find(l=>l.productId===array.panelId)?.quantity||0)-(build.settings.pvArrays||[]).filter(a=>a.id!==array.id&&a.panelId===array.panelId).reduce((n,a)=>n+a.series*a.parallel,0);
 if(!panel||!receiver||!limits.count||array.tracker>limits.count||array.receiverUnit>(build.lines.find(l=>l.productId===receiver.id)?.quantity||0))return {message:'Choose a selected receiver, unit and documented MPPT input first.'};
 if((build.settings.pvArrays||[]).some(a=>a.id!==array.id&&a.receiverId===array.receiverId&&a.receiverUnit===array.receiverUnit&&a.tracker===array.tracker))return {message:'This input is already assigned. Choose a free MPPT.'};
 const sample=arrayValues(panel,{...array,series:1,parallel:1},build.settings.minimumTemperature,build.settings.maximumCellTemperature??70);
 if(sample.coldVoc===undefined||sample.vmp===undefined||sample.imp===undefined||sample.isc===undefined||limits.voc===undefined||!limits.vmp||limits.imp===undefined||limits.isc===undefined)return {message:'Auto-size needs your minimum temperature, sourced Voc/Vmp/Imp/Isc, Voc coefficient, and documented voltage/current input limits.'};
 let winner:{series:number;parallel:number}|undefined;
 const panelVoltage=positive(panel,'maxSystemVoltage');
 for(let s=1;s<=Math.min(200,available);s++){
  if(sample.coldVoc*s>=limits.voc||panelVoltage&&sample.coldVoc*s>=panelVoltage||sample.vmp*s<limits.vmp[0]||sample.vmp*s>limits.vmp[1])continue;
  if(sample.hotVmp!==undefined&&(sample.hotVmp*s<limits.vmp[0]||sample.hotVmp*s>limits.vmp[1]))continue;
  if(sample.coldVmp!==undefined&&(sample.coldVmp*s<limits.vmp[0]||sample.coldVmp*s>limits.vmp[1]))continue;
  const p=Math.min(200,Math.floor(available/s),Math.floor(limits.imp/sample.imp),Math.floor(limits.isc/sample.isc),limits.ports??200);
  if(p<1)continue;
  if(!winner||s*p>winner.series*winner.parallel||s*p===winner.series*winner.parallel&&p<winner.parallel)winner={series:s,parallel:p};
 }
 if(!winner)return {message:'No arrangement fits the recorded electrical limits with the remaining panels. Try another tracker or panel count.'};
 const unused=available-winner.series*winner.parallel;
 return {layout:winner,unused,message:`${winner.series} in series × ${winner.parallel} parallel; ${unused} panels remain. Candidate based on recorded limits. Verify any unresolved checks before wiring.`};
}
