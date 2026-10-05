import type {Category,Product} from './types.ts';

export const catalogFilters:Record<Category,[string,string][]>= {
 panels:[['watts','Rated power'],['face','Panel face'],['cellType','Cell type'],['technology','Cell technology'],['color','Color']],
 mounting:[['mountType','Mount type'],['color','Color']],wiring:[['gauge','Wire gauge']],
 batteries:[['batteryKind','Subcategory'],['voltage','System voltage'],['capacityKwh','Rated storage (kWh)'],['formFactor','Battery format'],['chemistry','Chemistry']],
 inverters:[['voltage','System voltage'],['outputWatts','Rated output power'],['inverterType','Inverter type'],['acOutput','AC output']],
 charging:[['controllerType','Controller type'],['chargeCurrentA','Listed charge current (A)'],['voltage','Listed voltage (V)']],
 'module-electronics':[['moduleFunction','Module function']],monitoring:[['monitorType','Equipment function']],
 'all-in-one':[['capacityKwh','Listed storage (kWh)'],['stationType','System format']],kits:[['kitType','System format']],
 electrical:[['electricalType','Subcategory']],accessories:[['accessoryType','Subcategory']],
};

type Range={value:string;label:string;min:number;max:number;inclusiveMax?:boolean};
const panelPower:Range[]=[
 {value:'0-150',label:'0–150 W',min:0,max:150},
 {value:'150-350',label:'150–350 W',min:150,max:350},
 {value:'350-450',label:'350–450 W',min:350,max:450},
 {value:'450+',label:'450+ W',min:450,max:Infinity},
];
const inverterPower:Range[]=[
 {value:'0-2',label:'Up to 2 kW',min:0,max:2000,inclusiveMax:true},
 {value:'2-4',label:'Over 2–4 kW',min:2000,max:4000,inclusiveMax:true},
 {value:'4-6',label:'Over 4–6 kW',min:4000,max:6000,inclusiveMax:true},
 {value:'6-8',label:'Over 6–8 kW',min:6000,max:8000,inclusiveMax:true},
 {value:'8-12',label:'Over 8–12 kW',min:8000,max:12000,inclusiveMax:true},
 {value:'12-18',label:'Over 12–under 18 kW',min:12000,max:18000},
 {value:'18+',label:'18+ kW',min:18000,max:Infinity},
];
const fixed:Record<string,string[]>={
 face:['Monofacial','Bifacial'],cellType:['N-type','P-type','Perovskite'],
 technology:['TOPCon','PERC','HJT','Back contact'],
 formFactor:['Server rack','Wall mounted','Floor standing','Stackable'],
 batteryKind:['Battery modules','Battery cabinets'],
 electricalType:['Busbars','Fuses','Circuit breakers','Conduit','Boxes & combiners','Disconnects','Grounding','Surge protection','Other electrical'],
 accessoryType:['EV charging','Battery chargers','Adapters & communications','Displays & controls','Battery bases & stands','Covers & carrying','Appliances','Other accessories'],
};
export const filterHints:Record<string,string>={
 watts:'150, 350 and 450 W start the next range. Exact ratings remain in product specs.',
 outputWatts:'Continuous or rated output where listed; surge and solar-input ratings are excluded.',
 voltage:'Nominal system classes: 12.8 V → 12 V, 25.6 V → 24 V, 51.2 V → 48 V. AC output is shown separately.',
 cellType:'Perovskite is a future-facing material option. Products appear only when a source lists it.',
 technology:'Back contact includes IBC, HPBC, HBC, ABC and BC designs.',
 batteryKind:'Battery cabinets are empty enclosures, not energy-storage modules.',
};
export function nominalVoltage(value:unknown):number|undefined {
 if(value===undefined||value===null||value==='')return;
 const n=Number(value);return ({12:12,12.8:12,24:24,25.6:24,48:48,51.2:48,120:120,400:400} as Record<number,number>)[n];
}
function isBackContact(value:unknown) {return /^(?:back[ -]?contact|IBC|HPBC|HBC|ABC|BC)$/i.test(String(value));}
function attribute(product:Product,key:string):unknown {
 if(key==='technology'&&isBackContact(product.specs[key]))return 'Back contact';
 if(key==='voltage'&&['inverters','batteries'].includes(product.category)) {
  const listed=product.specs.systemVoltageV??product.specs.voltage;
  if(product.category==='inverters'&&product.specs.systemVoltageV===undefined&&Number(listed)>=120)return undefined;
  return nominalVoltage(listed);
 }
 return product.specs[key];
}
function ranges(category:Category,key:string) {return category==='panels'&&key==='watts'?panelPower:category==='inverters'&&key==='outputWatts'?inverterPower:undefined;}
export function matchesAttribute(product:Product,key:string,value:string):boolean {
 if(!value)return true;
 const raw=attribute(product,key),range=ranges(product.category,key)?.find(r=>r.value===value);
 if(range) {
  if(raw===undefined||raw===null||raw==='')return false;
  const n=Number(raw);if(!Number.isFinite(n)||n<0)return false;
  if(product.category==='inverters'&&n===0)return false;
  const above=product.category==='inverters'&&range.min>0&&range.value!=='18+'?n>range.min:n>=range.min;
  return above&&(range.inclusiveMax?n<=range.max:n<range.max);
 }
 return raw!==undefined&&String(raw)===value;
}
export function getFilterOptions(category:Category,key:string,products:Product[]):{value:string;label:string;count:number}[] {
 const grouped=ranges(category,key);
 let choices:{value:string;label:string}[];
 if(grouped)choices=grouped;
 else if(key==='voltage'&&['inverters','batteries'].includes(category))choices=[12,24,48,120,400].map(n=>({value:String(n),label:`${n} V`}));
 else {
  const listed=[...new Set(products.map(p=>attribute(p,key)).filter(v=>v!==undefined&&v!=='').map(String))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(key==='chemistry'&&listed.length<2)return [];
  const values=[...new Set([...(fixed[key]||[]),...listed])];
  choices=values.map(value=>({value,label:value}));
 }
 return choices.map(o=>({...o,count:products.filter(p=>matchesAttribute(p,key,o.value)).length}));
}
