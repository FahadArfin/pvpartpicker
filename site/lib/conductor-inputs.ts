import {conductorResistance,type ConductorMaterial} from './calculator-exploration.ts';
export function conductorInputResistance(gauge:string,material:ConductorMaterial,temperature:string,manual:string|undefined):number{
 if(!temperature.trim())throw new Error('Enter conductor temperature (0–100°C).');
 const derived=conductorResistance(gauge,material,Number(temperature));
 if(manual===undefined)return derived;
 if(!manual.trim()||!Number.isFinite(Number(manual))||Number(manual)<=0||Number(manual)>1000)throw new Error('Enter a resistance above 0 and up to 1,000 Ω/1,000 ft.');
 return Number(manual);
}
