export type ScraperAdapter='shopify'|'woocommerce'|'sitemap'|'pages';
export interface ScraperSite {
 id:string;name:string;origin:string;enabled:boolean;adapter:ScraperAdapter;startPath:string;urls:string[];
 schedule:'interval'|'daily'|'manual';frequencyMinutes:number;dailyTime:string;weekdays:number[];
 delaySeconds:number;jitterSeconds:number;maxPages:number;feedPages:number;usdConfirmed:boolean;sourceNotes?:string;
}
export interface ScraperProgress {requests:number;checked:number;found:number;inserted:number;quarantined:number;errors:number;planned:number;currentUrl:string;message:string;}
export const emptyProgress=():ScraperProgress=>({requests:0,checked:0,found:0,inserted:0,quarantined:0,errors:0,planned:0,currentUrl:'',message:'Waiting for the collector.'});
export function publicSourceUrl(value:string,origin?:string){
 const u=new URL(value,origin);
 const host=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!host.includes('.')||/^[\d.]+$/.test(host)||host.includes(':')||/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)||/\.(localhost|local|internal|home|lan)$/.test(host))throw new Error('Use a public HTTPS website without credentials or a custom port.');
 if(origin&&u.origin!==new URL(origin).origin)throw new Error('Product URLs must be on the same website origin.');
 u.hash='';return u;
}
const number=(v:unknown,min:number,max:number,label:string)=>{if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new Error(`${label} must be between ${min} and ${max}.`);return v;};
export function validateScraperSite(value:unknown,id:string):ScraperSite{
 const d=value as ScraperSite;if(!d||typeof d.name!=='string'||!d.name.trim()||d.name.length>80||typeof d.origin!=='string')throw new Error('A site name and website are required.');
 const origin=publicSourceUrl(d.origin).origin;
 if(!['shopify','woocommerce','sitemap','pages'].includes(d.adapter)||!['interval','daily','manual'].includes(d.schedule)||typeof d.enabled!=='boolean')throw new Error('Select an adapter and schedule.');
 if(typeof d.startPath!=='string'||d.startPath.length>500)throw new Error('Invalid starting path.');
 const start=publicSourceUrl(d.startPath||'/sitemap.xml',origin);
 if(!Array.isArray(d.urls)||d.urls.length>80||d.urls.some(u=>typeof u!=='string'||u.length>1500))throw new Error('Use at most 80 product URLs.');
 if(d.enabled&&d.adapter==='shopify'&&d.usdConfirmed!==true)throw new Error('Verify that this Shopify feed uses USD before enabling collection.');
 if(d.sourceNotes!==undefined&&(typeof d.sourceNotes!=='string'||d.sourceNotes.length>500))throw new Error('Source notes must be at most 500 characters.');
 const urls=[...new Set(d.urls.map(u=>publicSourceUrl(u,origin).href))];
 if(d.adapter==='pages'&&!urls.length)throw new Error('Add at least one product URL for a product-page source.');
 if(typeof d.dailyTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.dailyTime)||!Array.isArray(d.weekdays)||!d.weekdays.length||d.weekdays.some(n=>!Number.isInteger(n)||n<0||n>6))throw new Error('Choose a valid UTC time and at least one weekday.');
 return {id,name:d.name.trim(),origin,enabled:d.enabled,adapter:d.adapter,startPath:start.pathname+start.search,urls,schedule:d.schedule,
 usdConfirmed:d.usdConfirmed===true,sourceNotes:d.sourceNotes,frequencyMinutes:number(d.frequencyMinutes,15,10080,'Frequency (minutes)'),dailyTime:d.dailyTime,weekdays:[...new Set(d.weekdays)],
 delaySeconds:number(d.delaySeconds,10,300,'Request delay (seconds)'),jitterSeconds:number(d.jitterSeconds,0,30,'Jitter (seconds)'),maxPages:number(d.maxPages,1,80,'Page budget'),feedPages:number(d.feedPages,1,4,'Feed pages')};
}
export function nextScrapeAt(site:ScraperSite,now=Date.now()):string|null{
 if(!site.enabled||site.schedule==='manual')return null;
 if(site.schedule==='interval')return new Date(now+site.frequencyMinutes*60000).toISOString();
 const [h,m]=site.dailyTime.split(':').map(Number);const day=new Date(now);
 for(let i=0;i<8;i++){const date=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate()+i,h,m));if(date.getTime()>now&&site.weekdays.includes(date.getUTCDay()))return date.toISOString();}
 throw new Error('No scheduled weekday.');
}
export function validateProgress(value:unknown):ScraperProgress{
 const d=value as ScraperProgress;if(!d)throw new Error('Progress required.');const p=emptyProgress();
 for(const key of ['requests','checked','found','inserted','quarantined','errors','planned'] as const)p[key]=number(d[key],0,1000000,key);
 for(const key of ['currentUrl','message'] as const){if(typeof d[key]!=='string'||d[key].length>1500)throw new Error('Invalid progress text.');p[key]=d[key];}return p;
}
