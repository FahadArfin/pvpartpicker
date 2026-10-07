import {freshOffers} from './domain.ts';
import type {Product} from './types.ts';
export type DropPeriod='day'|'week'|'month'|'latest';
export type DropSort='dollars'|'percent'|'latest';
export interface DropCandidate {offerId:string;previous:number;previousAt:string;firstObservedAt:string;observations:number;changedAt:string}
export interface PriceDrop extends DropCandidate {productId:string;retailer:string;current:number;dollars:number;percent:number;purchasePrice:number;packQuantity:number;observedAt:string}
export function dropPeriod(value:string|null){const period=value||'day';if(!['day','week','month','latest'].includes(period))throw new Error('Choose day, week, month or latest.');return {period:period as DropPeriod,days:period==='day'?1:period==='week'?7:30};}
export function normalizeWatchIds(value:unknown):string[]{if(!Array.isArray(value)||value.length>500||value.some(id=>typeof id!=='string'||!id.trim()||id.length>180))throw new Error('Choose up to 500 valid products.');return [...new Set(value)];}
export function buildDrops(products:Product[],candidates:DropCandidate[],now=Date.now()):PriceDrop[]{
 const offers=new Map(products.flatMap(p=>freshOffers(p.offers,now).filter(o=>Number.isFinite(o.price)&&Number.isInteger(o.packQuantity)&&o.packQuantity>0).map(o=>[o.id,{p,o}] as const)));
 return candidates.flatMap(c=>{const match=offers.get(c.offerId);if(!match||!Number.isFinite(c.previous)||c.previous<=match.o.price||c.observations<2||!Number.isFinite(Date.parse(c.previousAt))||Date.parse(c.previousAt)>=Date.parse(match.o.observedAt)||!Number.isFinite(Date.parse(c.changedAt)))return [];const {p,o}=match,previous=c.previous/o.packQuantity,current=o.price/o.packQuantity;return [{...c,productId:p.id,retailer:o.retailer,previous,current,dollars:previous-current,percent:(previous-current)/previous*100,purchasePrice:o.price,packQuantity:o.packQuantity,observedAt:o.observedAt}];});
}
export function selectDrops<T extends Pick<PriceDrop,'dollars'|'percent'|'changedAt'|'offerId'>>(drops:T[],{sort='dollars',minDollars=0,minPercent=0}:{sort?:DropSort;minDollars?:number;minPercent?:number}={}){return drops.filter(d=>d.dollars+1e-8>=minDollars&&d.percent+1e-8>=minPercent).sort((a,b)=>(sort==='latest'?Date.parse(b.changedAt)-Date.parse(a.changedAt):sort==='percent'?b.percent-a.percent:b.dollars-a.dollars)||b.dollars-a.dollars||a.offerId.localeCompare(b.offerId));}
export function bestDropsByProduct(drops:PriceDrop[],metric:'dollars'|'percent'='dollars'){const result=new Map<string,PriceDrop>();for(const d of selectDrops(drops,{sort:metric}))if(!result.has(d.productId))result.set(d.productId,d);return result;}
export const watchInsertSql='INSERT OR IGNORE INTO watchlist (user_id,product_id,created_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM watchlist WHERE user_id=?)<500';
// Aggregate in SQL instead of truncating a month of observations. Package and
// retailer identities remain fixed; latest compares the most recent different
// price, so another unchanged collection does not erase a recent drop.
export function dropQuery(latest:boolean){return `
 WITH valid AS (
  SELECT o.offer_id AS offerId,o.price,o.observed_at AS observedAt,json_extract(f.json,'$.price') AS current
  FROM observations o JOIN offers f ON f.id=o.offer_id
  WHERE o.observed_at>=? AND o.observed_at<=json_extract(f.json,'$.observedAt')
   AND o.stock='in_stock' AND o.price>0
   AND o.pack_quantity=json_extract(f.json,'$.packQuantity')
   AND json_extract(f.json,'$.currency')='USD'
 ), stats AS (
  SELECT offerId,MIN(observedAt) AS firstObservedAt,COUNT(*) AS observations,
   MAX(CASE WHEN price<>current THEN observedAt END) AS differentAt FROM valid GROUP BY offerId
 ), ranked AS (
  SELECT *,ROW_NUMBER() OVER (PARTITION BY offerId ORDER BY ${latest?'observedAt DESC':'price DESC,observedAt DESC'}) AS rn
  FROM valid ${latest?'WHERE price<>current':''}
 )
 SELECT r.offerId,r.price AS previous,r.observedAt AS previousAt,s.firstObservedAt,s.observations,
  COALESCE((SELECT MIN(v.observedAt) FROM valid v WHERE v.offerId=r.offerId AND v.observedAt>s.differentAt),r.observedAt) AS changedAt
 FROM ranked r JOIN stats s ON s.offerId=r.offerId WHERE r.rn=1`;
}
