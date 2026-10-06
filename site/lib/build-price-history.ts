import {costForQuantity,validateBuild} from './domain.ts';
import {productListName,productListVariant} from './part-comparison.ts';
import type {BuildLine,Product,Observation,Offer} from './types.ts';

const DAY=86400000;
export interface HistoryPrice {cost:number;offerId:string;observedAt:string;}
export interface BuildHistoryPoint {date:string;prices:Record<string,HistoryPrice|null>;subtotal:number|null;complete:boolean;}
export interface BuildHistorySeries {productId:string;name:string;variant:string;quantity:number;retailer:string;hasHistory:boolean;}
export interface BuildHistory {series:BuildHistorySeries[];points:BuildHistoryPoint[];checkedAt:string;days:number;}
export function validateHistoryRequest(value:unknown){
 const input=value as {lines:BuildLine[];days:number};
 if(!input||![30,90,365].includes(input.days))throw new Error('Choose a 30, 90 or 365 day history.');
 const build=validateBuild({name:'History',lines:input.lines,settings:{purpose:'offgrid',mount:'roof'}});
 return {lines:build.lines,days:input.days};
}
// One batched indexed lookup, not one API request per component. Retain the
// last check even when it says out of stock; filtering those out revives sales.
export const buildHistoryQuery=`WITH daily AS (
 SELECT offer_id AS offerId,price,pack_quantity AS packQuantity,stock,observed_at AS observedAt,
 ROW_NUMBER() OVER (PARTITION BY offer_id,substr(observed_at,1,10) ORDER BY observed_at DESC,id DESC) AS rn
 FROM observations WHERE offer_id IN (SELECT value FROM json_each(?)) AND observed_at>=? AND observed_at<=?
) SELECT offerId,price,packQuantity,stock,observedAt FROM daily WHERE rn=1 ORDER BY observedAt LIMIT 50001`;

export function buildPriceHistory(lines:BuildLine[],products:Product[],observations:Observation[],days:number,now=Date.now()):BuildHistory{
 const endDay=Math.floor(now/DAY)*DAY,startDay=endDay-(days-1)*DAY;
 const productMap=new Map(products.map(p=>[p.id,p]));
 const offers=new Map<string,Offer>();
 for(const l of lines)for(const o of productMap.get(l.productId)?.offers||[])if(o.currency==='USD'&&(!l.offerId||l.offerId===o.id))offers.set(o.id,o);
 const byOffer=new Map<string,Observation[]>();
 // A listing's dated observation may be the only check so far. It is added at
 // its real timestamp, never repeated across earlier days or projected ahead.
 const snapshots=[...offers.values()].map(o=>({offerId:o.id,price:o.price,packQuantity:o.packQuantity,stock:o.stock,observedAt:o.observedAt}));
 for(const o of [...snapshots,...observations]){
  const time=Date.parse(o.observedAt);
  if(!offers.has(o.offerId)||!Number.isFinite(time)||time>now||time<startDay-DAY)continue;
  const list=byOffer.get(o.offerId)||[];list.push(o);byOffer.set(o.offerId,list);
 }
 for(const [id,list] of byOffer){
  const unique=new Map<string,Observation>();for(const o of list)unique.set(o.observedAt,o);
  byOffer.set(id,[...unique.values()].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)));
 }
 const positions=new Map<string,number>(),latest=new Map<string,Observation>();
 const points:BuildHistoryPoint[]=[];
 for(let day=startDay;day<=endDay;day+=DAY){
  const at=Math.min(now,day+DAY-1);
  for(const [id,list] of byOffer){let position=positions.get(id)||0;while(position<list.length&&Date.parse(list[position].observedAt)<=at){latest.set(id,list[position]);position++;}positions.set(id,position);}
  const prices:BuildHistoryPoint['prices']={};let subtotal=0,priced=0;
  for(const line of lines){
   let best:HistoryPrice|null=null;
   for(const offer of productMap.get(line.productId)?.offers||[]){
    if(!offers.has(offer.id)||line.offerId&&line.offerId!==offer.id)continue;
    const check=latest.get(offer.id);if(!check)continue;
    const pack=check.packQuantity??offer.packQuantity;
    if(check.stock!=='in_stock'||!Number.isFinite(check.price)||check.price<=0||!Number.isInteger(pack)||pack<1||pack!==offer.packQuantity||at-Date.parse(check.observedAt)>DAY)continue;
    const cost=costForQuantity({...offer,price:check.price,packQuantity:pack},line.quantity).subtotal;
    if(!best||cost<best.cost)best={cost,offerId:offer.id,observedAt:check.observedAt};
   }
   prices[line.productId]=best;if(best){subtotal+=best.cost;priced++;}
  }
  points.push({date:new Date(day).toISOString().slice(0,10),prices,subtotal:priced?Math.round(subtotal*100)/100:null,complete:priced===lines.length&&priced>0});
 }
 return {days,checkedAt:new Date(now).toISOString(),points,series:lines.map(line=>{
  const p=productMap.get(line.productId),offer=p?.offers.find(o=>o.id===line.offerId);
  return {productId:line.productId,name:p?productListName(p):'Unavailable product',variant:p?productListVariant(p):'',quantity:line.quantity,retailer:line.offerId?(offer?.retailer||'Selected offer unavailable'):'Lowest recorded purchase cost',hasHistory:points.some(point=>point.prices[line.productId]!==null)};
 })};
}
