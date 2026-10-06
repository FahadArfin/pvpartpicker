import type {Build,BuildSettings,Category,Product} from './types.ts';

export function builderPickerHref(category:Category){return `/parts?category=${category}&builder=1`;}

export function matchesBuildPreferences(product:Product,settings:BuildSettings):boolean {
 if(product.category==='inverters'){
  const type=String(product.specs.inverterType||'');
  if(settings.purpose==='offgrid'&&['Grid-tie','Microinverter'].includes(type))return false;
  if(settings.purpose==='hybrid'&&['Off-grid','Grid-tie','Microinverter'].includes(type))return false;
  if(settings.purpose==='gridtie'&&type==='Off-grid')return false;
 }
 if(product.category==='mounting'){
  if(settings.mount==='roof'&&product.specs.mountType==='Ground')return false;
  if(settings.mount==='ground'&&product.specs.mountType==='Roof')return false;
 }
 return true;
}

export function addBuildPart(build:Build,id:string,offerId?:string):Build {
 return {...build,lines:build.lines.some(l=>l.productId===id)
  ?build.lines.map(l=>l.productId===id?{...l,quantity:Math.min(10000,l.quantity+1),...(offerId?{offerId}:{})}:l)
  :[...build.lines,{productId:id,quantity:1,...(offerId?{offerId}:{})}]};
}
