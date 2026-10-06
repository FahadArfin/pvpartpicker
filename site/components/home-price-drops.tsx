"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Package,Pause,Play} from 'lucide-react';
import Link from './site-link';
import {money} from '../lib/domain';
import {advanceTicker,type HomeDeal} from '../lib/home-deals';

export function HomePriceDrops(){
 const [deals,setDeals]=useState<HomeDeal[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const [paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false),[loopWidth,setLoopWidth]=useState(0);
 const strip=useRef<HTMLDivElement>(null),group=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(media.matches),visibility=()=>setHidden(document.hidden);
  update();visibility();media.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  let controller:AbortController|undefined;
  const load=async()=>{controller?.abort();const request=new AbortController();controller=request;
   try{const response=await fetch('/api/deals?view=home',{signal:request.signal});if(!response.ok)throw new Error('Price history unavailable');const data=await response.json() as {drops:HomeDeal[]};if(!Array.isArray(data.drops))throw new Error('Invalid price feed');if(!request.signal.aborted){setDeals(data.drops);setError(false);}}
   catch{if(!request.signal.aborted){setDeals([]);setError(true);}}
   finally{if(!request.signal.aborted)setLoading(false);}
  };
  const refresh=()=>{if(!document.hidden)void load();};
  void load();const timer=window.setInterval(refresh,300000);document.addEventListener('visibilitychange',refresh);
  return()=>{controller?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[attempt]);
 useEffect(()=>{
  const el=strip.current,content=group.current;if(!el||!content)return;
  const measure=()=>{const width=content.getBoundingClientRect().width;setLoopWidth(width>el.clientWidth+2?width:0);};
  measure();const observer=new ResizeObserver(measure);observer.observe(el);observer.observe(content);return()=>observer.disconnect();
 },[deals]);
 useEffect(()=>{
  if(paused||hovered||focused||reduced||hidden||!loopWidth)return;
  const el=strip.current;if(!el)return;let frame=0,last:number|undefined,position=el.scrollLeft%loopWidth;
  const tick=(time:number)=>{if(last!==undefined){position=advanceTicker(position,loopWidth,time-last);el.scrollLeft=position;}last=time;frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[paused,hovered,focused,reduced,hidden,loopWidth]);
 const items=(duplicate=false)=>deals.map(d=>{
  const pack=d.packQuantity>1?`Pack of ${d.packQuantity}`:'Single unit';
  const detail=`${d.name} · ${d.retailer}${d.condition==='used'?' · Used / refurbished':''} · ${pack} · Checked ${d.observedAt.slice(0,10)} · Shipping and tax extra`;
  return <Link key={d.offerId} tabIndex={duplicate?-1:undefined} className="home-ticker-item" title={detail} href={'/products/'+encodeURIComponent(d.productId)}>
   <span className="home-ticker-image"><Package aria-hidden="true" size={22}/>{d.image&&<img src={d.image} alt="" width={38} height={44} loading="lazy" decoding="async" onError={e=>{e.currentTarget.hidden=true;}}/>}</span>
   <span className="home-ticker-info"><strong>{d.name}</strong><span className="home-ticker-price"><del>{money(d.previous*d.packQuantity)}</del><b>{money(d.purchasePrice)}</b><span>−{d.percent.toFixed(1)}%</span><small>{pack}</small></span><small>{d.retailer}{d.condition==='used'?' · Used':''} · <time dateTime={d.observedAt}>Checked {d.observedAt.slice(5,10)}</time></small></span>
  </Link>;
 });
 return <aside className="home-ticker" aria-label="Latest price drops" aria-describedby="home-ticker-note">
  <p id="home-ticker-note" className="sr-only">Recorded price drops from the last 30 days. Prices shown are for the entire listed package. Shipping and tax are extra. Scrolling pauses on hover or keyboard focus.</p>
  {loading?<p className="home-ticker-state" role="status">Checking prices…</p>:error?<p className="home-ticker-state" role="status">Price history unavailable. <button onClick={()=>{setLoading(true);setAttempt(v=>v+1);}}>Retry</button></p>:!deals.length?<p className="home-ticker-state">No recent verified price drops.</p>:
   <div ref={strip} className="home-ticker-window" aria-label="Recently discounted products" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false);}} onPointerDown={()=>setPaused(true)}>
    <div ref={group} className="home-ticker-group">{items()}</div>
    {loopWidth>0&&!reduced&&<div className="home-ticker-group" aria-hidden="true">{items(true)}</div>}
   </div>}
  <div className="home-ticker-tools">{loopWidth>0&&!reduced&&<button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Play price drops':'Pause price drops'} title={paused?'Resume scrolling':'Pause scrolling'}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}<Link href="/deals?period=latest" aria-label="View all price drops">All deals<ArrowUpRight size={15} aria-hidden="true"/></Link>{deals.length>0&&<small>+ shipping & tax</small>}</div>
 </aside>;
}
