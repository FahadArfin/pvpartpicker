import type {BundleComponent,BundleComponentType,Product,ProductConfiguration} from './types.ts';

export const bundleComponentLabels:Record<BundleComponentType,string>={
 'power-station':'Power station',panels:'Solar panels',batteries:'Batteries',inverter:'Inverter',
 mounting:'Mounting',controls:'Home controls',charging:'Charger / controller',accessories:'Accessories',
};
const clean=(text:string)=>text.replace(/[\[\]]/g,'').replace(/[×*]/g,'×').replace(/\s+/g,' ').trim();
const compact=(text:string)=>clean(text.split('|')[0]).replace(/\s*\+\s*(?:choose|smart output|\d[\d,]*\s*cycles).*$/i,'').replace(/\s+(?:portable power station|power station|solar generator(?!\s+\d)|custom kits?).*$/i,'').split(/\s[–—]\s/)[0].replace(/\s+\d[\d,./]*\s*(?:wh|kwh|w|kw)\b.*$/i,'').trim();
function familyKey(title:string){let hash=2166136261;for(const ch of title.toLowerCase().replace(/\s+/g,' ').trim())hash=Math.imul(hash^ch.charCodeAt(0),16777619);return 'configuration-'+(hash>>>0).toString(16);}
function station(title:string){
 const subject=title.split(/[+|]/)[0];
 if(/expansion battery|extra battery|battery only|cable|adapter|cover|carrying|replacement/i.test(subject))return false;
 if(/inverter/i.test(subject)&&!/power\s*station|solar generator/i.test(subject))return false;
 return /power\s*station|solar generator|power bank/i.test(subject)||/^(?:pecron\s*(?:e\d+\s*lfp|f\d+(?:\s*lfp)?)|anker\s*(?:solix\s*)?(?:c\d+|f\d+|s2000)\b|(?:ecoflow|ef)\s+delta\b|bluetti\s+ac200l\b|jackery\s+(?:explorer|homepower)\s+\d+)/i.test(subject);
}
function panelComponent(text:string,allowSingular=true):BundleComponent|undefined {
 const pv=text.replace(/smart home panel\s*\d*|smart panel/gi,'').replace(/(?:no|without)\s+(?:solar\s+)?panels?[^+|]*/gi,'');
 if(!/\bpanels?\b/i.test(pv)||/supports?|compatible|handles? up to|optional|choose|options? available|not included|sold separately|panel input/i.test(pv))return;
 const counted=pv.match(/\b(\d+)\s*[x×*]\s*(?:[a-z][\w-]*\s+){0,3}([\d,]+)\s*w\b[^+|]{0,65}?\bpanels?\b/i);
 const rated=pv.match(/\b([\d,]+)\s*w\s*(?:(?:rigid|folding|portable|bifacial|flexible|solar|solarsaga|air|mini|n-type)\s+){0,6}panels?\b/i);
 const count=counted?Number(counted[1]):Number(pv.match(/pack\s*of\s*(\d+)|\b(\d+)\s+(?:solar\s*)?panels?/i)?.slice(1).find(Boolean))||(allowSingular&&/\bpanel\b/i.test(pv)?1:undefined);
 const watts=counted?Number(counted[2].replace(/,/g,'')):rated?Number(rated[1].replace(/,/g,'')):undefined;
 const finish=/folding/i.test(pv)?'folding':/rigid/i.test(pv)?'rigid':/bifacial/i.test(pv)?'bifacial':/portable/i.test(pv)?'portable':'';
 return {type:'panels',...(count?{quantity:count}:{}),detail:watts?`${watts} W${finish?' '+finish:''}${count?' each · '+(watts*count).toLocaleString('en-US')+' W array':''}`:'Panel model / wattage not listed in the variant'};
}
function extras(text:string):BundleComponent[]{
 const result:BundleComponent[]=[];
 const panel=panelComponent(text);if(panel)result.push(panel);
 if(!/supports?|compatible|optional|not included|sold separately/i.test(text)&&/\b(?:exp(?:ansion)?\s*batter(?:y|ies)|extra battery|batteries|\d+\s*[x×*]\s*battery)\b/i.test(text)){
  const count=text.match(/\b(\d+)\s*[x×*]\s*(?:exp(?:ansion)?\s*)?batter(?:y|ies)/i);
  result.push({type:'batteries',...(count?{quantity:Number(count[1])}:/\bbattery\b/i.test(text)?{quantity:1}:{}),detail:'Expansion / additional storage'});
 }
 if(/(?:smart home panel|smart panel|240\s*v\s*(?:box|hub)|transfer switch|zero.export.*(?:meter|gateway))/i.test(text))result.push({type:'controls',detail:'Transfer / home control equipment listed in the variant'});
 if(/alternator charger|battery charger|charge controller|\b(?:mppt|pwm)\s*controller/i.test(text))result.push({type:'charging',detail:/alternator/i.test(text)?'Car alternator charger':'Charge controller / charger'});
 if(!/own racking|without.*(?:rack|mount)|no (?:racking|mount)/i.test(text)&&/ground mount|roof rack|roof mount|mount brackets/i.test(text))result.push({type:'mounting',detail:/ground/i.test(text)?'Ground mount':'Roof mount'});
 if(/\b(?:bag|refrigerator|fridge|accessories)\b/i.test(text))result.push({type:'accessories',detail:/bag/i.test(text)?'Bag':/refrigerator|fridge/i.test(text)?'Portable refrigerator':'Accessories listed; individual items not specified'});
 return result;
}

/** Only the selected variant establishes contents; parent marketing is not a bill of materials. */
export function describeConfiguration(title:string,fallbackCategory?:Product['category']):ProductConfiguration|undefined {
 const [main,...parts]=title.split(/\s—\s/),variant=parts.join(' — ').trim(),isStation=station(main);
 const family=familyKey(main);
 if(isStation){
  const identity=compact(main)||main.split('|')[0].trim();
  const unitOnly=/\b(?:main\s+)?unit only\b|station only/i.test(variant);
  const chosen=unitOnly?'':variant||main.split('|')[0].split(/\s(?:\+|with|and)\s/).slice(1).join(' + ');
  const additions=extras(chosen);
  const counted=chosen.match(/\b(\d+)\s*[x×*]\s*(?:E\d+\s*LFP|F\d+|\d+\s*PLUS|DELTA\b|Explorer\b|PowerStation\b)/i);
  const quantity=counted?Number(counted[1]):/\bdual\b.*\bkit/i.test(main)&&!unitOnly?2:/\bdelta.*\bultra/i.test(main)&&!unitOnly?undefined:1;
  const combo=additions.length>0||(quantity||0)>1;
  const color=variant.match(/\b(black|gr[ae]y|white)\b/i)?.[0];
  let selection=combo?clean(variant||chosen):unitOnly?[color,'Main unit only'].filter(Boolean).join(' · '):clean(variant)||'Main unit only';
  // Retain every selected component/quantity and color, without repeating a model prefix.
  const shortModel=identity.replace(/^(?:anker\s*(?:solix\s*)?|ecoflow\s*|pecron\s*|jackery\s*|bluetti\s*|nue\s*)/i,'');
  if(combo&&selection.toLowerCase().startsWith(shortModel.toLowerCase()))selection=selection.slice(shortModel.length).replace(/^\s*\+\s*/,'').trim();
  selection=selection.replace(/^\s*\+\s*/,'');
  if(!selection)selection=combo?'Dual station combo':'Main unit only';
  return {kind:combo?'combo':'standalone',title:identity+' · '+selection,family,selection,type:combo?'Power station combos':'Power station',components:[{type:'power-station',...(quantity?{quantity}:{}),detail:identity},...additions]};
 }
 // A bare inverter variant is not a solar kit just because the parent offers panels.
 if(/inverter only/i.test(variant))return {kind:'standalone',title:compact(main).split(/\s\+\s/)[0]+' · '+clean(variant),family,selection:clean(variant),type:'Inverter',components:[{type:'inverter',quantity:1,detail:compact(main).split(/\s\+\s/)[0]}]};
 if(variant&&/^\s*[\w -]*microinverter\s*$/i.test(variant))return {kind:'standalone',title:clean(variant),family,selection:clean(variant),type:'Inverter',components:[{type:'inverter',quantity:1,detail:clean(variant)}]};
 const subject=main.split('|')[0];
 const declared=/\b(?:kit|bundle)\b/i.test(main)&&/solar|inverter|storage|battery.*rack|rack.*battery/i.test(main);
 const joined=/inverter\b.*(?:\+|\band\b|\bwith\b).*\bbatter(?:y|ies)\b|batter(?:y|ies)\b.*(?:\+|\band\b|\bwith\b).*inverter\b/i.test(subject);
 if(!declared&&!joined&&fallbackCategory!=='kits')return;
 if(/mounting|tilt kit|bracket|wirebox|screen kit|adaptor|adapter|cable|cover/i.test(subject)&&!joined)return;
 const chosen=variant||main,components:BundleComponent[]=[];
 const selectedPanel=panelComponent(chosen,false);
 const arrayRating=main.match(/\b([\d.]+)\s*(kw|w)\s+(?:solar(?: array)?|array)\b/i)?.[0];
 if(selectedPanel)components.push(selectedPanel);
 else if(!/no panels|without.*panels/i.test(variant)&&(arrayRating||/(?:complete\s+solar(?:\s+panel)?\s+kit|solar panel kit|solar kit|solar.*array)/i.test(main))){
  const rating=(variant.match(/^\s*[\d.]+\s*(?:kw|w)\b/i)||main.match(/^\s*([\d.,]+)\s*(kw|w)\b/i))?.[0];
  components.push({type:'panels',detail:arrayRating?clean(arrayRating)+' (listed)':rating?clean(rating)+' listed array':'Panel count / wattage not listed in the variant'});
 }
 const namedInverter=main.match(/\b(?:Sol-Ark\s*\d+K|EG4\s*(?:6000XP|12000XP|18kPV|12kPV|FlexBOSS\s*\d+)|Victron\s*MultiPlus(?:-II)?)\b/i)?.[0];
 if(namedInverter||/\binverters?\b|\bmicroinverter\b/i.test(chosen)||/\binverters?\b/i.test(main)){
  const count=chosen.match(/\b(\d+)\s*[x×*]\s*(?:sol-ark|eg4|inverter)/i)||main.match(/\b(\d+)\s*[x×*]\s*(?:sol-ark|eg4|inverter)/i);
  const model=(variant+' '+main).match(/\b(?:Sol-Ark\s*\d+K|EG4\s*(?:6000XP|12000XP|18kPV|12kPV|FlexBOSS\s*\d+)|STREAM Microinverter)\b/i)?.[0]||namedInverter;
  components.push({type:'inverter',...(count?{quantity:Number(count[1])}:{}),detail:model||'Inverter model not listed in the variant'});
 }
 if(/\bbatter(?:y|ies)\b|\bkwh\b.*storage|storage.*\bkwh\b/i.test(chosen)||/\bbatter(?:y|ies)\b|\bkwh\b.*storage/i.test(main)){
  const count=chosen.match(/\b(\d+)\s*[x×*]\s*(?:[\d.]+\s*(?:kwh|wh|ah|v)\s*){0,3}batter(?:y|ies)/i);
  const capacity=chosen.match(/\b([\d.]+)\s*kwh\b/i);
  const perModule=chosen.match(/\b(\d+)\s*[x×*]\s*([\d.]+)\s*kwh\s*batter(?:y|ies)/i);
  components.push({type:'batteries',...(count?{quantity:Number(count[1])}:{}),detail:perModule?`${perModule[2]} kWh each · ${Number(perModule[1])*Number(perModule[2])} kWh listed storage`:capacity?`${capacity[1]} kWh listed storage`:'Storage model / count not listed in the variant'});
 }
 if(!/own racking|without.*(?:rack|mount)|no (?:racking|mount)/i.test(chosen)&&/ground mount|roof rack|roof mount|mount brackets|ground mount brackets/i.test(chosen))components.push({type:'mounting',detail:/ground/i.test(chosen)?'Ground mount':'Roof mount'});
 for(const c of extras(chosen))if(!components.some(existing=>existing.type===c.type))components.push(c);
 if(!components.some(c=>c.type==='charging')&&/\bwith\b.*(?:charge controller|mppt controller|pwm controller)/i.test(main))components.push({type:'charging',detail:'Charge controller listed with the kit'});
 const type=components.some(c=>c.type==='inverter')&&components.some(c=>c.type==='batteries')?(components.some(c=>c.type==='panels')?'Solar system kits':'Inverter + battery combos'):components.some(c=>c.type==='batteries')?'Storage bundles':components.some(c=>c.type==='panels')?'Panel kits':'Other equipment kits';
 const code=main.match(/\[((?:SUMMIT|EDGE)[A-Z\s-]*)\]/)?.[1];
 const identity=code?`${code} · ${main.match(/\bSol-Ark\s*\d+K\b/i)?.[0]||'Solar system kit'}${main.match(/^[\d.]+\s*kw\b/i)?' · '+main.match(/^[\d.]+\s*kw\b/i)![0]+' solar':''}`:clean((variant?main.split('|')[0]:main.split('|').filter(p=>!/warranty|choose|options available/i.test(p)).join(' · '))).replace(/\s*\+\s*(?:choose|options).*$/i,'');
 const selection=clean(variant||'Listed bundle');
 return {kind:'combo',title:identity+(variant?' · '+selection:''),family,selection,type,components};
}

export function productDisplayName(product:Product){return product.configuration?.title||product.name;}
