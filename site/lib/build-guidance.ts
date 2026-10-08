import type {Build,Compatibility} from './types.ts';
export function buildReadiness(build:Build,checks:Compatibility[]){
 const confirmed=checks.filter(c=>c.status==='match').length,missing=checks.filter(c=>c.status==='unknown').length,conflicts=checks.filter(c=>c.status==='mismatch').length;
 return {confirmed,missing,conflicts,label:!build.lines.length?'Choose your first component':conflicts?`${conflicts} ${conflicts===1?'conflict needs':'conflicts need'} attention`:missing?'Review missing specifications':'Review your equipment',detail:!build.lines.length?'Start with panels, an integrated station, or a bundle for your purpose.':`${confirmed} documented checks · ${missing} need verification · ${conflicts} conflicts. Selection does not establish installation approval.`};
}
export function analyticsPrerequisites(input:{capacityKw:number;capacityComplete:boolean;hasLocation:boolean;unpriced:number;hasCostOverride:boolean;selectionCount:number}){
 return [
  {key:'capacity',complete:input.capacityComplete&&input.capacityKw>0&&input.capacityKw<=1000,label:'Confirm total solar panel capacity',detail:'Choose panels or enter a sourced total PV capacity. Battery kWh and inverter output are not solar generation.'},
  {key:'location',complete:input.hasLocation,label:'Choose a location',detail:'A city or map point and array direction are needed for a production estimate.'},
  {key:'cost',complete:(input.selectionCount>0&&input.unpriced===0)||input.hasCostOverride,label:'Confirm equipment or installed pricing',detail:'Missing equipment prices require a complete installed quote before payback is available.'},
 ];
}
