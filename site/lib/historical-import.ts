import type {Product,Offer} from './types.ts';
import {dropIdentity,dropPagePath,historyUrl} from './drop-history.ts';
import type {DropProduct} from './drop-history.ts';
export interface ArchiveRow {name:string;link:string;price:number;date:string;offerId:string;packQuantity:number;}
export interface HistorySource {id:string;label:string;url:string;precision:'day'|'timestamp';startDate:string;endDate:string;}
/** RFC-style quoted CSV: descriptions may span many lines. Never evaluate source text. */
export function parseHistoryCsv(input:string):Record<string,string>[] {
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 input=input.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Unterminated CSV quote');if(cell||row.length){row.push(cell);rows.push(row);}const header=rows.shift()||[];
 if(!['name','price','link','date'].every(k=>header.includes(k)))throw new Error('Archive CSV columns are missing');
 return rows.map(r=>{if(r.length!==header.length)throw new Error('Invalid CSV row width');return Object.fromEntries(header.map((k,i)=>[k,r[i]]));});
}
const normalized=(s:string)=>s.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
export function archiveUrl(s:string){try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password||u.hostname.replace(/^www\./,'')!=='signaturesolar.com'||u.search||u.hash)return '';return 'https://signaturesolar.com'+u.pathname.replace(/\/$/,'');}catch{return '';}}
/** Conservative matching: unchanged listing titles or these explicitly reviewed model aliases. */
export function historyIdentity(p:Pick<Product,'id'|'name'|'category'>,o:Offer,r:Pick<ArchiveRow,'name'|'link'>):boolean {
 if(o.retailerId!=='signature-solar'||o.currency!=='USD'||p.category==='kits'||!archiveUrl(r.link)||archiveUrl(r.link)!==archiveUrl(o.url))return false;
 if(['eg4-6000xp','eg4-18kpv','eg4-flexboss18'].includes(p.id)&&o.packQuantity!==1)return false;
 if(normalized(p.name)===normalized(r.name))return true;
 if(/\b(?:bundle|kit|battery|cable|accessory|pallet|used|refurbished|refurb|renewed|scratch|open[ -]?box|b[ -]?stock|pack|pcs|pieces|qty|quantity)\b|\bx\s*[2-9]\b/i.test(r.name)&&p.category==='inverters')return false;
 const aliases:Record<string,RegExp>={'eg4-6000xp':/^eg4 6000xp off-grid inverter(?:\s*\||$)/i,'eg4-18kpv':/^eg4 18kpv hybrid inverter(?:\s*\||$)/i,'eg4-flexboss18':/^eg4 flexboss18(?:\s*\||\s+hybrid inverter)/i};
 if(aliases[p.id])return o.packQuantity===1&&aliases[p.id].test(r.name);
 // Same Peimar panel, explicitly a 31-panel pallet (not the single-panel listing).
 return p.id==='signature-solar-1548008-31'&&o.packQuantity===31&&/peimar/i.test(r.name)&&/450\s*w/i.test(r.name)&&/\b31\b/.test(r.name)&&/pallet/i.test(r.name);
}
function date(s:unknown){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw new Error('Invalid archive date');return s;}
export async function importHistory(db:D1Database,value:unknown){
 const d=value as {source:HistorySource;rows:ArchiveRow[];dropProduct?:DropProduct},s=d?.source;
 if(!s||typeof s.id!=='string'||!(/^[a-f0-9]{64}$/).test(s.id)||typeof s.label!=='string'||s.label.length<5||s.label.length>160||!['day','timestamp'].includes(s.precision))throw new Error('Invalid history source');
 const drop=s.precision==='timestamp',u=new URL(s.url);
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||(drop?u.hostname!=='drop.solar'||!dropPagePath(u.pathname):u.hostname!=='diysolarforum.com'||!u.pathname.startsWith('/threads/')))throw new Error('Invalid history source attribution');
 const validateDate=(v:unknown)=>{if(!drop)return date(v);if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)throw Error('Invalid history timestamp');return v;};
 validateDate(s.startDate);validateDate(s.endDate);if(s.startDate>s.endDate||s.endDate>=(drop?new Date().toISOString():new Date().toISOString().slice(0,10)))throw new Error('Archive dates must be historical');
 if(drop&&(!d.dropProduct||d.dropProduct.id!==u.pathname.split('/').pop()||typeof d.dropProduct.name!=='string'||typeof d.dropProduct.productUrl!=='string'))throw Error('Drop.solar product identity required');
 if(!Array.isArray(d.rows)||!d.rows.length||d.rows.length>200)throw new Error('Import 1–200 historical prices per batch');
 const sourceJson=JSON.stringify({id:s.id,label:s.label,url:s.url,precision:s.precision,startDate:s.startDate,endDate:s.endDate});
 const prior=await db.prepare('SELECT json FROM history_sources WHERE id=?').bind(s.id).first<{json:string}>();if(prior&&prior.json!==sourceJson)throw new Error('History source cannot change');
 const statements=[db.prepare('INSERT OR IGNORE INTO history_sources (id,json,created_at) VALUES (?,?,?)').bind(s.id,sourceJson,new Date().toISOString())];
 const listings=new Map<string,{p:Product;o:Offer}>();
 const checkedDropListings=new Set<string>();
 for(const r of d.rows){
  if(!r||typeof r.offerId!=='string'||r.offerId.length>180||typeof r.name!=='string'||r.name.length>1500||typeof r.link!=='string'||r.link.length>2000||!Number.isFinite(r.price)||r.price<=0||r.price>1000000||!Number.isInteger(r.packQuantity)||r.packQuantity<1)throw new Error('Invalid archive price');
  validateDate(r.date);if(r.date<s.startDate||r.date>s.endDate)throw new Error('Price date is outside the archive range');
  let listing=listings.get(r.offerId);
  if(!listing){const f=await db.prepare('SELECT f.json AS offerJson,p.json AS productJson FROM offers f JOIN products p ON p.id=f.product_id WHERE f.id=?').bind(r.offerId).first<{offerJson:string;productJson:string}>();if(!f)throw new Error('Historical offer is not in the current catalog');listing={o:JSON.parse(f.offerJson),p:JSON.parse(f.productJson)};listings.set(r.offerId,listing);}
  if(drop){
   if(r.name!==d.dropProduct!.name||historyUrl(r.link)!==historyUrl(d.dropProduct!.productUrl)||!dropIdentity(listing.p,listing.o,d.dropProduct!))throw Error('Historical product/package identity requires review');
   // A parent URL shared by multiple variants cannot establish which price changed.
   if(!checkedDropListings.has(r.offerId)){const siblings=await db.prepare("SELECT json FROM offers WHERE json_extract(json,'$.retailerId')=?").bind(listing.o.retailerId).all<{json:string}>();
    if(siblings.results.filter(f=>historyUrl(JSON.parse(f.json).url)===historyUrl(listing!.o.url)).length!==1)throw Error('Historical parent listing has ambiguous variants');checkedDropListings.add(r.offerId);}
  }else if(!historyIdentity(listing.p,listing.o,r))throw Error('Historical product/package identity requires review');
  if(r.packQuantity!==listing.o.packQuantity)throw Error('Historical product/package identity requires review');
  const stamp=drop?r.date:r.date+'T00:00:00.000Z';
  const old=await db.prepare('SELECT price,pack_quantity AS pack FROM observations WHERE id=?').bind(r.offerId+':'+stamp).first<{price:number;pack:number}>();
  if(old&&(old.price!==r.price||old.pack!==r.packQuantity))throw Error('Historical price conflicts with an existing observation');
  // Stable offer/day keys deduplicate retries and overlapping archives. Only observations are written.
  statements.push(db.prepare('INSERT OR IGNORE INTO observations (id,offer_id,price,pack_quantity,stock,observed_at,source_id) VALUES (?,?,?,?,?,?,?)').bind(r.offerId+':'+stamp,r.offerId,r.price,r.packQuantity,'unknown',stamp,s.id));
 }
 const result=await db.batch(statements);return {inserted:result.slice(1).reduce((n,r)=>n+(r.meta.changes||0),0),submitted:d.rows.length,sourceId:s.id};
}
