import type {Product,Offer} from './types.ts';
export interface DropProduct {id:string;name:string;productUrl:string;}
export interface DropRecord {price:number;date:string;}
/** Keep variant/configuration parameters. Only discard recognized tracking parameters. */
export function historyUrl(value:string){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return '';u.hostname=u.hostname.replace(/^www\./,'');u.hash='';u.pathname=u.pathname.replace(/\/$/,'');
 for(const k of [...u.searchParams.keys()])if(/^utm_|^(?:ref|referral|aff|affiliate|gclid|fbclid)$/i.test(k))u.searchParams.delete(k);
 u.searchParams.sort();return u.href;}catch{return '';}
}
export function dropPagePath(value:string){return /^\/products\/[a-zA-Z0-9_-]{1,100}$/.test(value)?value:'';}
const name=(s:string)=>s.normalize('NFKC').replace(/\s+[—-]\s+Default Title$/i,'').replace(/[™®]/g,'').replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();
export function dropIdentity(p:Pick<Product,'id'|'name'|'category'>,o:Offer,d:DropProduct){
 if(o.currency!=='USD'||o.condition!=='new'||!historyUrl(o.url)||historyUrl(o.url)!==historyUrl(d.productUrl)||p.category==='kits')return false;
 // Multipacks require an explicit count and the entire unchanged listing title.
 if(o.packQuantity>1){const count=d.name.match(/\b(?:pack of|pallet of|quantity|qty)\s*[:=]?\s*(\d+)\b/i)?.[1]||d.name.match(/\b(\d+)\s*[- ]?\s*(?:pack|panels|pieces|pcs|units)\b/i)?.[1];return !!count&&Number(count)===o.packQuantity&&name(p.name)===name(d.name)&&!/[+]|\b(?:bundle|kit|with|used|refurbished)\b/i.test(d.name);}
 // Parent charts do not identify a selected variant. Single-unit aliases stay conservative.
 const configuration=/\b(?:bundle|kit|pack|pallet|pcs|pieces|qty|quantity|pair|two|dual|refurbished|refurb|used|renewed|scratch|open[ -]?box|b[ -]?stock)\b|\+|\bwith\b|\bx\s*\d+\b|\b\d+\s*(?:x|units?|inverters?|panels?|batteries)\b|×\s*\d+/i;
 if(o.packQuantity!==1||configuration.test(d.name)||configuration.test(p.name))return false;
 if(name(p.name)===name(d.name))return true;
 // Reviewed standalone EG4 inverter aliases, never an accessory or an adjacent model.
 const model=p.name.match(/^EG4\s+(6000XP|12000XP|18kPV|12kPV|FlexBOSS18|FlexBOSS21)\b/i)?.[1];
 return p.category==='inverters'&&!!model&&new RegExp('^EG4\\s+'+model+'\\s+(?:\\d+(?:\\.\\d+)?\\s*kW\\s+)?(?:(?:AC|hybrid|off-grid)\\s+)*inverter(?:\\s*\\|\\s*\\d+(?:\\.\\d+)?\\s*(?:kW|W)\\s+(?:PV input|AC output))*$','i').test(d.name.replace(/\s+/g,' ').trim());
}
/** Decode only Next.js JSON string fragments; never execute scripts from a fetched page. */
export function parseDropHistory(html:string,path:string):{product:DropProduct;history:DropRecord[]}{
 if(!dropPagePath(path)||html.length>8_000_000)throw Error('Invalid Drop.solar page');
 let stream='';
 for(const m of html.matchAll(/self\.__next_f\.push\((\[1\s*,\s*"(?:[^"\\]|\\.)*"\])\)/g)){
  try{const fragment=JSON.parse(m[1]);if(typeof fragment[1]==='string')stream+=fragment[1];}catch{/* Non-data scripts are not evaluated. */}
 }
 const candidates:any[]=[];
 const walk=(v:any,depth=0)=>{if(depth>40||!v||typeof v!=='object')return;if(!Array.isArray(v)&&v.product&&Array.isArray(v.history))candidates.push(v);for(const child of Object.values(v))walk(child,depth+1);};
 for(const line of stream.split('\n')){const pos=line.indexOf(':');if(pos<0)continue;try{walk(JSON.parse(line.slice(pos+1)));}catch{/* RSC references and module records are not data objects. */}}
 const expected=path.split('/').pop(),valid=candidates.filter(v=>v.product.id===expected);
 if(valid.length!==1)throw Error('Drop.solar history data missing or ambiguous');
 const {product,history}=valid[0];
 if(typeof product.name!=='string'||product.name.length>1500||typeof product.productUrl!=='string'||!historyUrl(product.productUrl)||history.length>5000)throw Error('Invalid Drop.solar history identity');
 const points=new Map<string,number>();
 for(const r of history){if(r.productId!==expected||!Number.isFinite(r.price)||r.price<=0||r.price>1_000_000||typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString()!==r.date||Date.parse(r.date)>=Date.now())throw Error('Invalid Drop.solar history record');
  if(points.has(r.date)&&points.get(r.date)!==r.price)throw Error('Conflicting Drop.solar history prices');points.set(r.date,r.price);
 }
 return {product:{id:product.id,name:product.name,productUrl:product.productUrl},history:[...points].sort(([a],[b])=>a.localeCompare(b)).map(([date,price])=>({date,price}))};
}
export function historySourcesNote(precision:'day'|'timestamp'){
 return precision==='day'?'Dates have day precision; time and stock were not recorded.':'Recorded price changes with source timestamps, not a daily series. Historical stock was not recorded.';
}
