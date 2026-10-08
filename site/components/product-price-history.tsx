'use client';
import {lazy,Suspense,useEffect,useMemo,useState} from 'react';
import type {Product,Observation} from '../lib/types';
import {createProductHistoryLoader,productHistoryPoints} from '../lib/product-price-history';
import {money} from '../lib/domain';
import {historySourcesNote} from '../lib/drop-history';
const Chart=lazy(()=>import('./price-history-chart'));
const loadHistory=createProductHistoryLoader();
export function ProductPriceHistory({product,compact=false}:{product:Product;compact?:boolean}){
 const [days,setDays]=useState(90),[attempt,setAttempt]=useState(0),[recordsOpen,setRecordsOpen]=useState(false);
 const [result,setResult]=useState<{key:string;observations?:Observation[];error?:string}>({key:''});
 const key=product.id+'|'+days+'|'+attempt;
 useEffect(()=>{
  let live=true;
  // Skip requests for products crossed briefly while moving down the list.
  const timer=setTimeout(()=>loadHistory(product.id,days).then(observations=>{if(live)setResult({key,observations});}).catch(e=>{if(live)setResult({key,error:e.message});}),compact?180:0);
  return()=>{live=false;clearTimeout(timer);};
 },[key,product.id,days,compact]);
 const observations=result.key===key?result.observations:undefined,error=result.key===key?result.error:undefined;
 const points=useMemo(()=>productHistoryPoints(product,observations||[]),[product,observations]);
 const bundled=product.modelIdentity?.kind==='bundle'||product.category==='kits';
 return <section className={'product-price-history'+(compact?' compact':' section-card')} aria-label={'Price history for '+product.name}>
  <div className="section-heading"><div><h2>{compact?'Price history':'Recorded price history'}</h2>{!compact&&<p className="inline-note">{bundled?'USD per selected bundle':'USD per unit · package minimums apply'}{product.modelIdentity?' · '+product.modelIdentity.packageLabel:''}</p>}</div>
   <select aria-label={compact?'Preview history period':'History period'} value={days} onChange={e=>setDays(Number(e.target.value))}>{[30,90,365,0].map(d=><option key={d} value={d}>{d?d+" days":"All history"}</option>)}</select>
  </div>
  <div className="price-history-plot" aria-busy={!observations&&!error}>
   {error?<div className="price-history-status" role="alert"><p>{error}</p><button className="button outline small" onClick={()=>setAttempt(a=>a+1)}>Try again</button></div>:!observations?<p className="price-history-status" role="status">Loading recorded prices…</p>:points.length?<Suspense fallback={<p className="price-history-status" role="status">Loading price chart…</p>}><Chart data={points} product={product} compact={compact}/></Suspense>:<p className="price-history-status">No recorded prices in this period.</p>}
  </div>
  {observations&&!error&&<p className="price-history-note">{points.length===1?'One recorded check; a trend needs more observations. ':''}{points.length?'Recorded checks only. Shipping and tax excluded.':'History will appear after retailer checks are collected.'}{!compact&&points.length>1&&' Lines connect recorded checks; prices between checks may change.'}</p>}
  {[...new Map(observations?.filter(o=>o.sourceId).map(o=>[o.sourceUrl,o])||[]).values()].map(o=><p className="price-history-note" key={o.sourceUrl}>Includes <a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.sourceLabel||'attributed historical records'}</a>. {historySourcesNote(o.precision||'day')} Historical prices are not current offers.</p>)}
  {!compact&&observations&&<details onToggle={e=>setRecordsOpen(e.currentTarget.open)}><summary className="small-text">View recorded observations</summary>{recordsOpen&&<div className="table-scroll"><table className="data-table"><thead><tr><th>Observed (UTC)</th><th>Retailer</th><th>Package price</th><th>Pack size</th><th>Stock</th><th>Source</th></tr></thead><tbody>{observations.map((p,i)=><tr key={i}><td>{p.precision==='day'?p.observedAt.slice(0,10)+' (day only)':p.observedAt.slice(0,16).replace('T',' ')}</td><td>{product.offers.find(o=>o.id===p.offerId)?.retailer||'Unmatched offer'}</td><td>{money(p.price)}</td><td>{p.packQuantity??product.offers.find(o=>o.id===p.offerId)?.packQuantity??'Unknown'}</td><td>{p.stock.replaceAll('_',' ')}</td><td>{p.sourceLabel||'PVPartPicker retailer check'}</td></tr>)}</tbody></table></div>}</details>}
 </section>;
}
