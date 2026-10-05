import type {Category,Product} from './types.ts';
import {matchesAttribute} from './catalog-filters.ts';
export interface QuickFilterGroup {key:string;label:string;options:{value:string;label:string}[];}
const group=(key:string,label:string,options:[string,string][]):QuickFilterGroup=>({key,label,options:options.map(([value,label])=>({value,label}))});
const voltage=group('voltage','System voltage',[['12','12 V'],['24','24 V'],['48','48 V'],['400','400 V']]);
const groups:Partial<Record<Category,QuickFilterGroup[]>>={
 mounting:[group('mountingPart','Mounting type',[['rails','Roof rails'],['clamps','Clamps'],['ground','Ground arrays & pole mounts'],['brackets','Solar mounting brackets'],['roof-hardware','Roof attachments'],['other','Other mounting']])],
 wiring:[group('wirePart','Wire & cable type',[['premade','Premade cables'],['bulk','Bulk wire & spools'],['lugs','Battery terminal lugs'],['connectors','Connectors & adapters'],['other','Other wiring']]),group('connector','Connector',[['mc4','MC4 / solar'],['xt60','XT60 / XT60i'],['anderson','Anderson'],['terminal','Battery terminals']]),group('wireMaterial','Conductor',[['copper','Pure / tinned copper']]),group('wireInsulation','Wire rating',[['thwn','THHN / THWN'],['pv','PV-rated wire']])],
 batteries:[voltage,group('batteryFormat','Battery style',[['rack','Server rack'],['standing','Vertical standing'],['rv','RV / drop-in'],['wall','Wall mounted'],['stackable','Stackable'],['cabinets','Battery cabinets']])],
 inverters:[voltage,group('inverterType','Inverter type',[['Off-grid','Off-grid'],['Hybrid','Hybrid'],['Grid-tie','On-grid'],['Microinverter','Microinverters']])],
 electrical:[group('electricalPart','Electrical type',[['fuses','Fuses'],['busbars','Busbars'],['breakers','Circuit breakers'],['conduit','Conduit'],['smart-panels','Smart electrical panels'],['panels','Normal electrical panels'],['combiners','Combiner boxes'],['junction','Junction boxes'],['other','Other electrical']])],
};
export function quickFilterGroups(category:Category|'all',selection:Record<string,string>):QuickFilterGroup[]{
 const result=[...(category==='all'?[]:groups[category]||[])];
 if(category==='electrical'&&selection.electricalPart==='fuses')result.push(group('fuseType','Fuse type',[['anl','ANL'],['class-t','Class T'],['mrbf','MRBF'],['other','Other fuses']]));
 return result;
}
export function toggleQuickFilter(selection:Record<string,string>,key:string,value:string){
 const next={...selection};if(!value||next[key]===value)delete next[key];else next[key]=value;
 if(key==='electricalPart'&&next.electricalPart!=='fuses')delete next.fuseType;
 return next;
}
function mountingPart(p:Product){
 const t=p.name.split(/\s—\s|\s\|\s/)[0];
 if(/DIN\s*rail|EV charger|battery|inverter|monitor/i.test(t))return 'other';
 if(/ground|pole mount/i.test(t))return 'ground';
 if(/clamp/i.test(t))return 'clamps';
 if(/rail[ -]?free|l[- ]foot|RT\s*MINI|roof hook|flashing|attachment|standoff|hex bolt|flange nut/i.test(t))return 'roof-hardware';
 if(/bracket|tilt|z[- ]mount/i.test(t))return 'brackets';
 if(/rail/i.test(t))return 'rails';
 if(/roof|flashing|roof hook|l[- ]foot|standoff/i.test(t))return 'roof-hardware';
 return 'other';
}
function wirePart(p:Product){
 const t=p.name;
 if(/\blugs?\b|ferrule|ring terminal/i.test(t)&&!/cable.*(?:with|ends|lug)|wire.*with.*lug/i.test(t))return 'lugs';
 if(/spool|bulk|welding|\bTHHN\b|\bTHWN|unterminated|bare wire|(?:by|per)\s+(?:the\s+)?(?:foot|ft)\b/i.test(t))return 'bulk';
 if(/gland|cable entry|cable connectors?\b|terminal connectors?\b/i.test(t)&&!/with (?:solar )?connectors/i.test(t))return 'connectors';
 if(/premade|pre[ -]?(?:made|assembled)|extension|charging cable|adaptor kit|(?:adapter|adaptor|communication|communications|network|CT|RJ45) cable|mc[- ]?4.*cable|xt[- ]?60.*cable|anderson.*cable|(?:cable|wire).*with.*(?:connector|lug|terminal)|with ends|interconnect|parallel.*cable/i.test(t))return 'premade';
 if(/connector|adapter|adaptor|mc4|xt[- ]?60|anderson/i.test(t))return 'connectors';
 if(/\bwire\b/i.test(t))return 'bulk';
 return 'other';
}
function electricalPart(p:Product){
 const t=p.name.split(/\s—\s/)[0];
 if(/combiner/i.test(t))return 'combiners';
 if(/(?:smart.*(?:electrical|home|solar)?\s*panel|panel.*smart)/i.test(t))return 'smart-panels';
 if(/load cent(?:er|re)|electrical panel|breaker panel|breaker box/i.test(t))return 'panels';
 if(/conduit/i.test(t))return 'conduit';
 if(/junction|wire\s?box|bell box|electrical box/i.test(t))return 'junction';
 if(/bus[ -]?bar/i.test(t))return 'busbars';
 if(/breaker/i.test(t))return 'breakers';
 if(/fuse/i.test(t))return 'fuses';
 return 'other';
}
export function matchesQuickFilter(p:Product,key:string,value:string):boolean{
 if(!value)return true;
 const t=p.name;
 if(key==='mountingPart')return p.category==='mounting'&&mountingPart(p)===value;
 if(key==='wirePart')return p.category==='wiring'&&wirePart(p)===value;
 if(key==='electricalPart')return p.category==='electrical'&&electricalPart(p)===value;
 if(key==='connector')return p.category==='wiring'&&({mc4:/mc[- ]?4|solar connectors?/i,xt60:/xt[- ]?60i?/i,anderson:/anderson|\bSB\s*(?:50|120|175|350)\b/i,terminal:/terminal|lug|ring/i}[value]?.test(t)||false);
 if(key==='wireMaterial')return p.category==='wiring'&&!/\bCCA\b|copper[ -]?clad|alumin(?:um|ium)/i.test(t)&&(/pure copper|tinned copper|bare copper|oxygen.free copper|\bOFC\b/i.test(t)||/^Copper$/i.test(String(p.specs.wireMaterial||'')));
 if(key==='wireInsulation')return p.category==='wiring'&&(value==='thwn'?/\bTHHN\b|\bTHWN/i.test(t+' '+(p.specs.wireInsulation||'')):/\bPV\b|photovoltaic|solar panel.*(?:wire|cable)/i.test(t+' '+(p.specs.wireInsulation||'')));
 if(key==='batteryFormat'){
  if(p.category!=='batteries')return false;
  if(value==='cabinets')return p.specs.batteryKind==='Battery cabinets';
  if(p.specs.batteryKind==='Battery cabinets')return false;
  if(value==='rv')return /\bRV\b|recreational vehicle|drop[ -]?in|group\s*(?:24|27|31)\b/i.test(t)||p.specs.batteryUse==='RV';
  return String(p.specs.formFactor||'')===({rack:'Server rack',standing:'Floor standing',wall:'Wall mounted',stackable:'Stackable'}[value]);
 }
 if(key==='fuseType')return p.category==='electrical'&&electricalPart(p)==='fuses'&&(value==='anl'?/\bANL\b/i.test(t):value==='class-t'?/class[ -]?t|t[ -]?class/i.test(t):value==='mrbf'?/\bMRBF\b/i.test(t):!/\bANL\b|class[ -]?t|t[ -]?class|\bMRBF\b/i.test(t));
 return matchesAttribute(p,key,value);
}
