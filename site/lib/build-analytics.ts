import {bestOffer,costForQuantity,validateBuild} from './domain.ts';
import type {Build,Product} from './types.ts';

export interface AnalyticsFace {sharePercent:number;tilt:number;azimuth:number;}
export interface AnalyticsLocation {latitude:number;longitude:number;label:string;}
export interface AnalyticsSettings {
 location?:AnalyticsLocation; capacityOverrideKw?:number; totalCostOverride?:number;
 faces:AnalyticsFace[]; lossesPercent:number; peakSunHours:number; annualUsageKwh:number;
 electricityRate:number; exportRate:number; selfConsumptionPercent:number;
 additionalCost:number; incentive:number; annualMaintenance:number;
 degradationPercent:number; rateEscalationPercent:number; discountPercent:number;
}
export const analyticsDefaults:AnalyticsSettings={faces:[{sharePercent:100,tilt:30,azimuth:180}],lossesPercent:14,peakSunHours:4,annualUsageKwh:10000,electricityRate:.19,exportRate:0,selfConsumptionPercent:60,additionalCost:0,incentive:0,annualMaintenance:0,degradationPercent:.5,rateEscalationPercent:2,discountPercent:5};
export const analyticsRanges:Record<Exclude<keyof AnalyticsSettings,'location'|'faces'>,[number,number]>={capacityOverrideKw:[0,1000],totalCostOverride:[0,100000000],lossesPercent:[0,99],peakSunHours:[0,12],annualUsageKwh:[0,10000000],electricityRate:[0,10],exportRate:[0,10],selfConsumptionPercent:[0,100],additionalCost:[0,100000000],incentive:[0,100000000],annualMaintenance:[0,10000000],degradationPercent:[0,10],rateEscalationPercent:[0,20],discountPercent:[0,30]};
export function validateAnalytics(value:unknown):AnalyticsSettings {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid analytics settings.');
 const input=value as AnalyticsSettings,clean={} as AnalyticsSettings;
 for(const [key,[min,max]]of Object.entries(analyticsRanges)){
  const k=key as keyof typeof analyticsRanges,n=input[k];
  if(n===undefined&&['capacityOverrideKw','totalCostOverride'].includes(k))continue;
  if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new Error(`Check analytics ${key} (${min}–${max}).`);
  clean[k]=n;
 }
 if(!Array.isArray(input.faces)||!input.faces.length||input.faces.length>4||input.faces.some(f=>!f||typeof f!=='object'||!Number.isFinite(f.sharePercent)||f.sharePercent<=0||f.sharePercent>100||!Number.isFinite(f.tilt)||f.tilt<0||f.tilt>90||!Number.isFinite(f.azimuth)||f.azimuth<0||f.azimuth>360)||Math.abs(input.faces.reduce((s,f)=>s+f.sharePercent,0)-100)>.01)throw new Error('Use 1–4 roof faces whose capacity shares total 100%.');
 clean.faces=input.faces.map(f=>({sharePercent:f.sharePercent,tilt:f.tilt,azimuth:f.azimuth}));
 if(input.location!==undefined){const l=input.location;if(!l||typeof l.latitude!=='number'||!Number.isFinite(l.latitude)||Math.abs(l.latitude)>66||typeof l.longitude!=='number'||!Number.isFinite(l.longitude)||Math.abs(l.longitude)>180||typeof l.label!=='string'||l.label.length>200)throw new Error('Choose a valid location between 66°S and 66°N.');clean.location={latitude:l.latitude,longitude:l.longitude,label:l.label};}
 return clean;
}
export function publicBuildCopy(build:Build):Build {
 // Precise location, consumption and household financial assumptions are private.
 const clean=validateBuild(build);delete clean.settings.analytics;return clean;
}
export function buildAnalyticsInputs(build:Build,products:Product[],now=Date.now()) {
 let capacityKw=0,equipmentCost=0,unpriced=0;const unknownSolar:string[]=[];
 for(const line of build.lines){const p=products.find(p=>p.id===line.productId);
  if(!p)unknownSolar.push('Unavailable equipment: '+line.productId);
  if(p?.category==='panels'){const watts=Number(p.specs.watts);if(Number.isFinite(watts)&&watts>0)capacityKw+=watts*line.quantity/1000;else unknownSolar.push(p.name||p.id);}
  if(p?.category==='kits')unknownSolar.push(p.name||p.id);
  const offer=p?bestOffer(line.offerId?{...p,offers:p.offers.filter(o=>o.id===line.offerId)}:p,line.quantity,now):undefined;
  if(offer)equipmentCost+=costForQuantity(offer,line.quantity).subtotal;else unpriced++;
 }
 return {capacityKw,equipmentCost:Math.round(equipmentCost*100)/100,unpriced,unknownSolar,capacityComplete:unknownSolar.length===0||build.settings.analytics?.capacityOverrideKw!==undefined};
}
export const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function analyticsFinancials(monthly:number[],settings:AnalyticsSettings,equipmentCost:number,priced:boolean,purpose:Build['settings']['purpose']) {
 const s=validateAnalytics(settings);
 if(monthly.length!==12||monthly.some(n=>!Number.isFinite(n)||n<0))throw new Error('Expected twelve nonnegative monthly estimates.');
 if(!Number.isFinite(equipmentCost)||equipmentCost<0)throw new Error('Invalid equipment cost.');
 const monthlyLoad=s.annualUsageKwh/12,exportRate=purpose==='offgrid'?0:s.exportRate;
 const months=monthly.map((generationKwh,i)=>{const usedKwh=Math.min(monthlyLoad,generationKwh*s.selfConsumptionPercent/100),exportedKwh=Math.max(0,generationKwh-usedKwh);return {month:monthNames[i],generationKwh,loadKwh:monthlyLoad,usedKwh,exportedKwh,gridKwh:Math.max(0,monthlyLoad-usedKwh),savings:usedKwh*s.electricityRate+exportedKwh*exportRate};});
 const annualKwh=monthly.reduce((s,n)=>s+n,0),usedKwh=months.reduce((s,m)=>s+m.usedKwh,0),exportedKwh=annualKwh-usedKwh,annualSavings=months.reduce((s,m)=>s+m.savings,0);
 const grossCost=s.totalCostOverride??(priced?equipmentCost+s.additionalCost:null),netCost=grossCost===null?null:Math.max(0,grossCost-s.incentive),annualNet=annualSavings-s.annualMaintenance;
 const simplePayback=netCost===null||annualNet<=0?null:netCost/annualNet;
 let cumulative=netCost===null?null:-netCost,npv=netCost===null?null:-netCost,breakEvenYear:number|null=netCost===0?0:null;
 const cashFlow=Array.from({length:25},(_,i)=>{
  const scale=(1-s.degradationPercent/100)**i,rateScale=(1+s.rateEscalationPercent/100)**i;
  const generationKwh=annualKwh*scale,savings=monthly.reduce((sum,g)=>{const used=Math.min(monthlyLoad,g*scale*s.selfConsumptionPercent/100),surplus=g*scale-used;return sum+used*s.electricityRate*rateScale+surplus*exportRate*rateScale;},0),net=savings-s.annualMaintenance;
  if(cumulative!==null){const previous=cumulative;cumulative+=net;if(breakEvenYear===null&&previous<0&&cumulative>=0&&net>0)breakEvenYear=i+(-previous/net);}
  if(npv!==null)npv+=net/(1+s.discountPercent/100)**(i+1);
  return {year:i+1,generationKwh,savings,maintenance:s.annualMaintenance,net,cumulative};
 });
 return {months,annualKwh,usedKwh,exportedKwh,annualSavings,annualNet,grossCost,netCost,simplePayback,breakEvenYear,cashFlow,npv,energyOffsetPercent:s.annualUsageKwh>0?annualKwh/s.annualUsageKwh*100:null,billOffsetPercent:s.annualUsageKwh*s.electricityRate>0?annualSavings/(s.annualUsageKwh*s.electricityRate)*100:null};
}
