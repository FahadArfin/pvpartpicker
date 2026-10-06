import {checkCompatibility,validateBuild} from './domain.ts';
import {categories} from './types.ts';
import type {Build,BuildSettings,Category,Compatibility,Product} from './types.ts';
import {connectionMap} from './connection-map.ts';

export function normalizeBuildQuantity(text:string,previous:number):number{
 const value=text.trim()?Number(text):NaN;
 return Number.isFinite(value)?Math.max(1,Math.min(10000,Math.round(value))):previous;
}

export type StringSetting='series'|'parallel'|'minimumTemperature';
export function parseStringSetting(key:StringSetting,text:string):{value?:number;error?:string}{
 if(!text.trim())return {};
 const value=Number(text);
 if(key==='minimumTemperature')return Number.isFinite(value)&&value>=-70&&value<=60?{value}:{error:'Enter a temperature from −70 to 60°C.'};
 return Number.isInteger(value)&&value>=1&&value<=200?{value}:{error:'Enter a whole number from 1 to 200.'};
}

export function restoreBuildDraft(stored:string):Build{
 try{
  const value=JSON.parse(stored);
  const clean=validateBuild({...value,name:typeof value?.name==='string'&&!value.name.trim()?'My solar build':value?.name});
  for(const key of ['id','shareId'] as const)if(value[key]!==undefined&&(typeof value[key]!=='string'||!value[key]||value[key].length>200))throw new Error();
  return {...clean,...(value.id?{id:value.id}:{}),...(value.shareId?{shareId:value.shareId}:{})};
 }catch{throw new Error('Could not read your saved draft. Your stored data has been kept.');}
}
export function replaceStoredDraft(storage:Pick<Storage,'getItem'|'setItem'>,target:Build,recover=false):Build{
 const next=restoreBuildDraft(JSON.stringify(target));
 if(recover){const previous=storage.getItem('pvpartpicker-draft');if(previous)storage.setItem('pvpartpicker-draft-recovery',previous);}
 storage.setItem('pvpartpicker-draft',JSON.stringify(next));return next;
}

export interface BuildStage{category:Category;label:string;count:number;state:'selected'|'needed'|'optional';}
export function buildProgress(build:Build,products:Product[]):{stages:BuildStage[];selectedCount:number;next:{label:string;detail:string;category?:Category};note:string}{
 const selected=build.lines.map(l=>products.find(p=>p.id===l.productId)).filter((p):p is Product=>Boolean(p));
 const has=(category:Category)=>selected.some(p=>p.category===category);
 const standalone=has('inverters')||has('batteries');
 const station=has('all-in-one')&&!standalone,kit=has('kits')&&!standalone&&!has('panels');
 const plan:{category:Category;optional?:boolean}[]=station?[{category:'all-in-one'},{category:'panels',optional:true},{category:'accessories',optional:true}]:kit?[{category:'kits'},{category:'mounting',optional:true},{category:'electrical',optional:true}]:[{category:'panels'},{category:'inverters'},{category:'batteries',optional:build.settings.purpose==='gridtie'},{category:'mounting'},{category:'wiring'},{category:'electrical'}];
 for(const product of selected)if(!plan.some(stage=>stage.category===product.category))plan.push({category:product.category,optional:true});
 const stages=plan.map(({category,optional}):BuildStage=>({category,label:categories.find(c=>c.id===category)!.label,count:selected.filter(p=>p.category===category).length,state:has(category)?'selected':optional?'optional':'needed'}));
 const nextStage=stages.find(s=>s.state==='needed');
 const next=kit?{label:'Review bundle contents',detail:'Check the included models and quantities before adding separate parts.'}:station?{label:'Review station connections',detail:'Check supported solar charging, expansion batteries, and any transfer equipment.'}:nextStage?{label:'Choose '+nextStage.label.toLowerCase(),category:nextStage.category,detail:nextStage.category==='batteries'?'Plan storage for your off-grid or backup loads. Confirm capacity and exact-model support.':'Add equipment for this part of your plan, then verify the exact specifications.'}:{label:'Review your equipment',detail:'Review string allocation, documented limits, and installation requirements.'};
 return {stages,selectedCount:stages.filter(s=>s.state==='selected').length,next,note:station?'Solar panels and transfer equipment may be separate. Selected categories do not establish installation readiness.':kit?'A bundle can cover several categories. Verify its contents; selected categories do not establish installation readiness.':'These are equipment planning categories. Selection does not establish installation readiness.'};
}

export function buildCompatibility(build:Build,products:Product[],invalidStringInputs=false):Compatibility[]{
 const selected=build.lines.map(l=>products.find(p=>p.id===l.productId)).filter((p):p is Product=>Boolean(p));
 const settings:BuildSettings={purpose:build.settings.purpose,mount:build.settings.mount};
 const invalid:string[]=[];
 if(invalidStringInputs)invalid.push('Correct the highlighted string inputs.');
 for(const key of ['series','parallel','minimumTemperature'] as const){const input=build.settings[key];if(input===undefined)continue;const parsed=parseStringSetting(key,String(input));if(parsed.error)invalid.push(parsed.error);else settings[key]=parsed.value;}
 let checks=checkCompatibility(selected,settings);
 if(settings.purpose==='hybrid'){
  const purposeChecks=selected.filter(p=>p.category==='inverters'&&p.specs.inverterType).map((p):Compatibility=>{
   const mismatch=['Off-grid','Grid-tie','Microinverter'].includes(String(p.specs.inverterType));
   return {title:'System purpose',status:mismatch?'mismatch':'unknown',detail:mismatch?`${p.name} does not support the selected hybrid / backup purpose.`:`Review ${p.name}'s operating modes and required equipment.`,source:p.documentation||p.sourceUrl};
  });
  checks=[...purposeChecks,...checks.filter(c=>c.title!=='System purpose')];
 }
 if(build.settings.pvArrays!==undefined){
  const map=connectionMap(build,products),replaced=new Set(['Cold-weather PV voltage','MPPT operating current','PV string voltage','PV input current','Battery voltage','Charge controller & battery']);
  const assignments:Compatibility[]=map.allocations.map(a=>({status:a.status,title:'PV panel allocation',detail:`${a.panel.name}: ${a.used} assigned / ${a.quantity} selected. ${a.remaining>0?a.remaining+' panels still need an input assignment.':a.remaining<0?'More panels are assigned than selected.':'All selected panels have an assignment.'}`}));
  return [...checks.filter(c=>!replaced.has(c.title)),...map.checks,...assignments];
 }
 const panels=selected.filter(p=>p.category==='panels'),inverters=selected.filter(p=>p.category==='inverters');
 if(!panels.length||!inverters.length)return checks;
 let allocation:Compatibility={title:'PV panel allocation',status:'unknown',detail:'Enter panels per string and parallel strings per MPPT. Assign panels to each tracker before connecting equipment.'};
 const panelQty=build.lines.filter(l=>panels.some(p=>p.id===l.productId)).reduce((sum,l)=>sum+l.quantity,0);
 const inverterQty=build.lines.filter(l=>inverters.some(p=>p.id===l.productId)).reduce((sum,l)=>sum+l.quantity,0);
 if(invalid.length)allocation.detail='Correct the PV string inputs: '+[...new Set(invalid)].join(' ');
 else if(panels.length!==1||inverters.length!==1||inverterQty!==1)allocation.detail='Multiple panel models or inverters need separate string and MPPT assignments. Global string inputs cannot verify their allocation.';
 else if(settings.series&&settings.parallel){
  const needed=settings.series*settings.parallel;
  allocation=panelQty<needed?{title:allocation.title,status:'mismatch',detail:`This arrangement needs ${needed} panels per MPPT, but only ${panelQty} are selected.`}:panelQty>needed?{title:allocation.title,status:'unknown',detail:`The entered arrangement uses ${needed} panels per MPPT. ${panelQty} are selected; assign the remaining panels and verify every tracker.`}:{title:allocation.title,status:'unknown',detail:`${panelQty} selected panels cover the entered ${settings.series} × ${settings.parallel} arrangement per MPPT. Confirm the actual tracker assignment, short-circuit limits, and MPPT voltage window.`};
 }
 const calculable=!invalid.length&&panels.length===1&&inverters.length===1&&inverterQty===1&&Boolean(settings.series&&settings.parallel)&&panelQty===settings.series!*settings.parallel!;
 return [...checks.map(c=>!calculable&&c.status==='match'&&['Cold-weather PV voltage','MPPT operating current'].includes(c.title)?{...c,status:'unknown' as const,detail:c.detail+' This is a hypothetical calculation; selected panel allocation remains unverified.'}:c),allocation];
}
