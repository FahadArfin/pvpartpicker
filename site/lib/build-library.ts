import {validateBuild} from './domain.ts';
import type {Build} from './types.ts';
export const deviceBuildsKey='pvpartpicker-saved-builds';
export interface SavedBuild extends Build {id:string;updatedAt:string;communityShareId?:string;communityDescription?:string;}
export const isDeviceBuild=(id?:string)=>Boolean(id?.startsWith('device:'));
export function copyBuild(build:Build):Build{return validateBuild(build);}
function contents(build:Build){return JSON.stringify({name:build.name,lines:build.lines,settings:build.settings});}
export function buildSwitchNeedsConfirmation(current:Build,target:Build,copy=false):boolean{
 const blank:Build={name:'My solar build',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
 const hasDraft=Boolean(current.id)||contents(current)!==contents(blank);
 return hasDraft&&(copy||current.id!==target.id||contents(current)!==contents(target));
}
export function targetAfterBuildSave(current:Build,target:Build,id:string,copy:boolean):Build{
 return !copy&&current.id&&current.id===target.id?{...current,id}:target;
}
export function applySavedBuildIdentity(current:Build,snapshot:Build,saved:Build):Build{
 if(current.id!==snapshot.id)return current;
 return current===snapshot?saved:{...current,id:saved.id,shareId:saved.id===current.id?current.shareId:undefined};
}
export function readDeviceBuilds(stored:string|null):SavedBuild[]{
 if(!stored)return [];
 try{const values=JSON.parse(stored);if(!Array.isArray(values)||values.length>100)throw new Error();return values.map(v=>{if(!isDeviceBuild(v.id)||typeof v.updatedAt!=='string')throw new Error();return {...validateBuild(v),id:v.id,updatedAt:v.updatedAt};});}
 catch{throw new Error('Could not read your saved builds on this device. Your stored data has been kept.');}
}
export function saveDeviceBuild(saved:SavedBuild[],build:Build,id:string,updatedAt:string):SavedBuild[]{
 if(!isDeviceBuild(id))throw new Error('Invalid device build.');
 const clean=validateBuild(build),others=saved.filter(b=>b.id!==id);
 if(others.length>=100)throw new Error('You can save up to 100 builds on this device.');
 return [{...clean,id,updatedAt},...others];
}
export const purposeLabel={offgrid:'Off-grid',hybrid:'Hybrid / backup',gridtie:'Grid-tied'};
