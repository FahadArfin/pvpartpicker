import {freshOffers} from './domain.ts';
import type {Product} from './types.ts';

export interface SaleBaseline {offerId:string;usualPrice:number;sampleDays:number;firstDay:string;lastDay:string}
export interface SaleOffer {
 productId:string;offerId:string;retailer:string;previous:number;current:number;dollars:number;percent:number;
 purchasePrice:number;packQuantity:number;observedAt:string;changedAt:string;basis:'retailer'|'history';sampleDays:number;
}
// Each completed UTC day has equal weight. Repeated hourly collections must not
// dominate the typical price; imported archives are not recent live checks.
export const saleHistoryQuery=`
 WITH checks AS (
  SELECT o.offer_id AS offerId,o.price,substr(o.observed_at,1,10) AS day,
   ROW_NUMBER() OVER (PARTITION BY o.offer_id,substr(o.observed_at,1,10) ORDER BY o.observed_at DESC) AS dailyRank
  FROM observations o JOIN offers f ON f.id=o.offer_id
  WHERE o.observed_at>=? AND o.observed_at<? AND o.source_id IS NULL
   AND o.stock='in_stock' AND o.price>0
   AND o.pack_quantity=json_extract(f.json,'$.packQuantity')
   AND json_extract(f.json,'$.currency')='USD'
 ), ranked AS (
  SELECT *,ROW_NUMBER() OVER (PARTITION BY offerId ORDER BY price,day) AS priceRank,
   COUNT(*) OVER (PARTITION BY offerId) AS sampleDays FROM checks WHERE dailyRank=1
 )
 SELECT offerId,AVG(CASE WHEN priceRank IN ((sampleDays+1)/2,(sampleDays+2)/2) THEN price END) AS usualPrice,
  COUNT(*) AS sampleDays,MIN(day) AS firstDay,MAX(day) AS lastDay
 FROM ranked GROUP BY offerId HAVING COUNT(*)>=7`;

export function buildSales(products:Product[],baselines:SaleBaseline[],now=Date.now()):SaleOffer[]{
 const today=Math.floor(now/86400000)*86400000,since=today-30*86400000;
 const histories=new Map(baselines.filter(h=>Number.isFinite(h.usualPrice)&&h.usualPrice>0&&Number.isInteger(h.sampleDays)&&h.sampleDays>=7&&h.sampleDays<=30&&Date.parse(h.firstDay)>=since&&Date.parse(h.lastDay)<today&&Date.parse(h.firstDay)<=Date.parse(h.lastDay)).map(h=>[h.offerId,h]));
 return products.flatMap(p=>freshOffers(p.offers,now).flatMap(o=>{
  if(!Number.isFinite(o.price)||!Number.isInteger(o.packQuantity)||o.packQuantity<1)return [];
  const history=histories.get(o.id),reference=history?.usualPrice??o.referencePrice;
  if(reference===undefined||!Number.isFinite(reference)||reference<=o.price)return [];
  const previous=reference/o.packQuantity,current=o.price/o.packQuantity;
  return [{productId:p.id,offerId:o.id,retailer:o.retailer,previous,current,dollars:previous-current,percent:(previous-current)/previous*100,purchasePrice:o.price,packQuantity:o.packQuantity,observedAt:o.observedAt,changedAt:o.observedAt,basis:history?'history':'retailer',sampleDays:history?.sampleDays??0} as SaleOffer];
 }));
}

export function currentSales(sales:SaleOffer[],products:Product[],now=Date.now()):SaleOffer[]{
 const offers=new Map(products.flatMap(p=>freshOffers(p.offers,now).map(o=>[o.id,{p,o}] as const)));
 return sales.filter(s=>{const match=offers.get(s.offerId);return match&&match.p.id===s.productId&&match.o.packQuantity===s.packQuantity&&match.o.price===s.purchasePrice&&(s.basis==='history'||Math.abs((match.o.referencePrice??0)-s.previous*s.packQuantity)<1e-8);});
}
