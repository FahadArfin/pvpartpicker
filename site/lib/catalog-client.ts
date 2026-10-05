import type {PageCatalog} from './catalog-transport.ts';
import {catalogTtlMs} from './catalog-cache.ts';
export const pageCatalogUrl='/api/catalog?view=summary';
export const pageCatalogKey='pvpartpicker-public-catalog-v1';
interface BrowserCatalog extends PageCatalog{version:1;expiresAt:number;}
type CatalogStorage=Pick<Storage,'getItem'|'setItem'>|null;
function valid(value:unknown):value is BrowserCatalog{
 if(!value||typeof value!=='object')return false;
 const v=value as BrowserCatalog;
 return v.version===1&&Number.isFinite(v.expiresAt)&&Array.isArray(v.products)&&Array.isArray(v.reports)&&v.products.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.brand==='string'&&typeof p.category==='string'&&Array.isArray(p.offers)&&p.specs&&typeof p.specs==='object');
}
/** A recent fallback keeps browsing available. It does not refresh offer dates. */
export function readRecentPageCatalog(storage:Pick<Storage,'getItem'>|null,now:()=>number=Date.now):PageCatalog|null{
 try{const value:unknown=JSON.parse(storage?.getItem(pageCatalogKey)||'null');return valid(value)&&value.expiresAt>now()-30*60*1000&&value.expiresAt<=now()+catalogTtlMs?value:null;}catch{return null;}
}
export async function loadPageCatalog(storage:CatalogStorage,fetcher:typeof fetch=fetch,now:()=>number=Date.now):Promise<PageCatalog>{
 try{
  const cached=storage?.getItem(pageCatalogKey);
  if(cached){const value:unknown=JSON.parse(cached);if(valid(value)&&value.expiresAt>now()&&value.expiresAt<=now()+catalogTtlMs)return value;}
 }catch{/* Browser storage is optional, and corrupt/old caches are disposable. */}
 const response=await fetcher(pageCatalogUrl,{credentials:'same-origin',signal:AbortSignal.timeout(15000)}).catch(()=>{throw new Error('Could not load the product catalog. Please try again.');});
 if(!response.ok)throw new Error('Could not load the product catalog. Please try again.');
 const value:unknown=await response.json();if(!valid(value))throw new Error('Invalid catalog response. Please try again.');
 // Keep the server deadline: page navigation must never extend old price data.
 value.expiresAt=Math.min(value.expiresAt,now()+catalogTtlMs);
 try{storage?.setItem(pageCatalogKey,JSON.stringify(value));}catch{}
 return value;
}
export function needsPageCatalog(path:string){return !(/^\/guide(?:\/|$)/.test(path)||path==='/learn'||path==='/unsubscribe'||path==='/price-scraper');}
