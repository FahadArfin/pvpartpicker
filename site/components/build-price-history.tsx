'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import Link from './site-link';
import {api} from './pv-provider';
import type {BuildLine} from '../lib/types';
import type {BuildHistory} from '../lib/build-price-history';
import {money} from '../lib/domain';
const BuildHistoryChart=lazy(()=>import('./build-history-chart'));
const cache=new Map<string,{data:BuildHistory;at:number}>();

export function BuildPriceHistory({lines}:{lines:BuildLine[]}){
 const [days,setDays]=useState(90),[active,setActive]=useState(false),[attempt,setAttempt]=useState(0),[recordsOpen,setRecordsOpen]=useState(false);
 const [result,setResult]=useState<{key:string;data?:BuildHistory;error?:string}>({key:''});
 const section=useRef<HTMLElement>(null);
 const request=JSON.stringify({lines,days}),key=request+'|'+attempt;
 useEffect(()=>{
  const element=section.current;if(!element)return;
  if(typeof IntersectionObserver==='undefined'){setActive(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setActive(true);observer.disconnect();}},{rootMargin:'300px'});
  observer.observe(element);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!active||!lines.length)return;
  const cached=cache.get(request);if(cached&&Date.now()-cached.at<300000){setResult({key,data:cached.data});return;}
  const controller=new AbortController();
  // Coalesce repeated +/- clicks without delaying the builder's controls.
  const timer=setTimeout(()=>{api('build-history',{method:'POST',body:request,signal:controller.signal}).then((data:BuildHistory)=>{
   if(controller.signal.aborted)return;
   if(cache.size>=10)cache.delete(cache.keys().next().value!);
   cache.set(request,{data,at:Date.now()});setResult({key,data});
  }).catch(e=>{if(!controller.signal.aborted)setResult({key,error:e.message});});},180);
  return()=>{clearTimeout(timer);controller.abort();};
 },[active,request,key,lines.length]);
 const data=result.key===key?result.data:undefined,error=result.key===key?result.error:undefined;
 const tracked=data?.series.filter(s=>s.hasHistory)||[];
 const retry=()=>{cache.delete(request);setAttempt(n=>n+1);};
 return <section ref={section} className="builder-history" aria-labelledby="build-history-heading">
  <div className="builder-history-heading"><div><h2 id="build-history-heading">Build price history</h2><p>How the price of your selected equipment has changed.</p></div><div className="builder-history-controls"><div className="builder-history-period" role="group" aria-label="Build history period">{[30,90,365].map(d=><button key={d} aria-pressed={days===d} onClick={()=>setDays(d)}>{d===365?'1 year':d+' days'}</button>)}</div>{lines.length>0&&<button className="text-link small-text" onClick={retry}>Refresh</button>}</div></div>
  {!lines.length?<p className="builder-history-status">Choose a part above to start tracking the price of your build.</p>:error?<div className="builder-history-status" role="alert"><p>{error}</p><button className="button outline small" onClick={retry}>Try again</button></div>:!data?<p className="builder-history-status" role="status">{active?'Loading recorded build prices…':'Price history loads as you scroll here.'}</p>:<>
   <div className="builder-history-legend" aria-label="Parts in this history">{data.series.map((s,i)=><div key={s.productId} className={!s.hasHistory?'history-untracked':''} style={{borderTopColor:`var(--chart-${i%8+1})`}}><Link href={'/products/'+s.productId} title={[s.name,s.variant,s.retailer].filter(Boolean).join(' · ')}>{s.name}<span> × {s.quantity}</span></Link><small>{s.variant}{s.variant?' · ':''}{s.retailer}{!s.hasHistory?' · No eligible history in this period':''}</small></div>)}</div>
   {tracked.length?<Suspense fallback={<p className="builder-history-status" role="status">Loading history chart…</p>}><BuildHistoryChart history={data}/></Suspense>:<p className="builder-history-status">No eligible recorded prices in this period. History will appear after in-stock retailer checks are collected.</p>}
   <p className="builder-history-note">{tracked.length} of {data.series.length} selected products have history. {tracked.length<data.series.length?'The chart is a tracked subtotal, not your complete build cost. ':''}Current quantities and retailer choices apply to every date; package minimums are included. Shipping and tax are excluded.</p>
   <p className="builder-history-note">UTC daily checkpoints use each retailer’s latest USD check, priced only when in stock and at most 24 hours old. Gaps mean missing or stale data, not zero cost. Prices can change between checks. Last loaded {data.checkedAt.slice(0,16).replace('T',' ')} UTC.</p>
   {tracked.length>0&&<details className="builder-history-records" onToggle={e=>setRecordsOpen(e.currentTarget.open)}><summary>View daily prices and coverage</summary>{recordsOpen&&<div className="table-scroll"><table className="data-table"><caption className="sr-only">Daily recorded prices for the current build quantities</caption><thead><tr><th>Date (UTC)</th>{data.series.map(s=><th key={s.productId}>{s.name} × {s.quantity}<small>{s.variant}</small></th>)}<th>Recorded subtotal</th><th>Coverage</th></tr></thead><tbody>{[...data.points].reverse().map(p=><tr key={p.date}><th scope="row">{p.date}</th>{data.series.map(s=><td key={s.productId}>{p.prices[s.productId]?money(p.prices[s.productId]!.cost):'No eligible check'}</td>)}<td>{p.subtotal===null?'—':money(p.subtotal)}</td><td>{Object.values(p.prices).filter(Boolean).length}/{data.series.length}{p.complete?' · Complete':' · Partial'}</td></tr>)}</tbody></table></div>}</details>}
  </>}
 </section>;
}
