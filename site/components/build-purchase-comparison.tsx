'use client';
import {useEffect,useState} from 'react';
import type {Build,Product} from '../lib/types';
import {buildPurchaseComparison,type PurchasePlan} from '../lib/build-purchase';
import {money} from '../lib/domain';
import {productListName} from '../lib/part-comparison';
import './build-purchase-comparison.css';

function PurchaseOption({plan,title}:{plan:PurchasePlan;title:string}){
 return <details className="purchase-option"><summary><strong>{title}</strong><span>{plan.complete?money(plan.equipmentSubtotal!):'Incomplete'} · {plan.lines.filter(l=>l.cost).length}/{plan.lines.length} lines priced</span></summary>
  <table><caption className="sr-only">{title} equipment purchase breakdown</caption><thead><tr><th scope="col">Selected equipment</th><th scope="col">Packages & condition</th><th scope="col">Retailer source</th><th scope="col">Equipment cost</th><th scope="col">Shipping assumption</th></tr></thead>
   <tbody>{plan.lines.map((line,i)=><tr key={line.productId+'-'+i}><th scope="row">{line.product?productListName(line.product):'Unavailable product'}<small>{line.quantity} requested units</small></th><td data-label="Packages & condition">{line.cost&&line.offer?<>{line.cost.packs} × {line.offer.packQuantity}-unit package · {money(line.offer.price)} each<small>{line.offer.condition} · {line.cost.purchasedUnits} purchased units{line.cost.extraUnits>0?` · ${line.cost.extraUnits} extra`:''}</small></>:<span>{line.reason}</span>}</td><td data-label="Retailer source">{line.offer?<><a href={line.offer.url} target="_blank" rel="noreferrer">{line.offer.retailer} ↗</a><small>Observed {new Date(line.offer.observedAt).toLocaleString()}</small></>:'No eligible offer'}</td><td data-label="Equipment cost">{line.cost?money(line.cost.subtotal):'Unpriced'}</td><td data-label="Shipping assumption">{line.cost?line.shipping===null?'Unknown':money(line.shipping):'Unavailable'}</td></tr>)}</tbody>
  </table>
  <p className="purchase-summary">{plan.complete?`Equipment subtotal ${money(plan.equipmentSubtotal!)}`:`Tracked equipment subtotal ${money(plan.trackedSubtotal)} · incomplete`}. Known shipping {money(plan.knownShipping)}{plan.unknownShippingCount?` · ${plan.unknownShippingCount} priced ${plan.unknownShippingCount===1?'line has':'lines have'} unknown shipping`:''}.</p>
 </details>;
}
export function BuildPurchaseComparison({build,products}:{build:Build;products:Product[]}){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const refresh=()=>setNow(Date.now());const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[]);
 const result=buildPurchaseComparison(build,products,now);
 return <details className="build-purchase-comparison"><summary><strong>Compare buying options</strong><span>{!build.lines.length?'Choose equipment first':result.split.complete?`Lowest split equipment subtotal ${money(result.split.equipmentSubtotal!)}`:'Complete equipment pricing unavailable'}</span></summary>
 {!build.lines.length?<p>Add parts to compare buying the same equipment from one retailer or several.</p>:<>
  <p>Same selected products; chosen offers keep their package size and new/used condition. Parts without a chosen offer use new condition. Options do not change your build.</p>
  <p>Ranked by equipment subtotal, excluding shipping and tax. Known shipping is multiplied by purchased packages, assuming each quoted shipping charge applies per package. Actual combined-order shipping may differ; missing quotes stay unknown. These are not delivered-price comparisons.</p>
  <PurchaseOption plan={result.split} title="Split retailers"/>
  {result.singleRetailer.length?result.singleRetailer.map(plan=><PurchaseOption key={plan.retailerId} plan={plan} title={'Single retailer · '+plan.retailer}/>):<p>No retailer currently has eligible prices for every selected line.</p>}
  {result.incompleteRetailers.length>0&&<details className="purchase-incomplete"><summary>{result.incompleteRetailers.length} retailers with partial coverage</summary><p>Partial coverage is incomplete and cannot qualify as the lowest complete equipment cost.</p>{result.incompleteRetailers.map(plan=><PurchaseOption key={plan.retailerId} plan={plan} title={'Incomplete · '+plan.retailer}/>)}</details>}
 </>}
 </details>;
}
