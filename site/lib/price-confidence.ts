import type {Offer,CollectionReport} from './types.ts';
export function offerConfidence(offer:Offer|undefined,reports:CollectionReport[]=[],now=Date.now()):{status:'fresh'|'stale'|'unavailable'|'unverified'|'check-failed';label:string;detail:string}{
 if(!offer)return {status:'unverified',label:'No recorded price',detail:'No usable price observation is available.'};
 const date=Date.parse(offer.observedAt),valid=Number.isFinite(offer.price)&&offer.price>0&&Number.isInteger(offer.packQuantity)&&offer.packQuantity>=1&&Number.isFinite(date)&&date<=now+60000;
 if(!valid)return {status:'unverified',label:'Price needs verification',detail:'The recorded price, package or timestamp is invalid.'};
 const report=reports.filter(r=>r.retailerId===offer.retailerId&&Number.isFinite(Date.parse(r.checkedAt))&&Date.parse(r.checkedAt)<=now+60000).sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt))[0];
 const checked=`Last price observed ${new Date(date).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})} UTC.`;
 if(report&&Date.parse(report.checkedAt)>=date&&!['ok','succeeded'].includes(report.status))return {status:'check-failed',label:'Latest check unsuccessful',detail:checked+' The latest retailer run did not complete successfully; this is the previously recorded price.'};
 if(offer.stock==='out_of_stock')return {status:'unavailable',label:'Out of stock',detail:checked+' Not available in the latest observation.'};
 if(now-date>86400000)return {status:'stale',label:'Price outdated',detail:checked+' More than 24 hours old; excluded from current-price totals.'};
 if(offer.stock!=='in_stock')return {status:'unverified',label:'Availability unconfirmed',detail:checked+' Stock has not been verified; excluded from current-price totals.'};
 const hours=Math.max(0,Math.floor((now-date)/3600000));
 return {status:'fresh',label:hours<1?'Checked within the hour':`Checked ${hours}h ago`,detail:checked+' In stock when checked. Shipping and tax are separate; confirm the final price with the retailer.'};
}
