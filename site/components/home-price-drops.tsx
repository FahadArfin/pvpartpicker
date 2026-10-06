"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Package,Pause,Play} from 'lucide-react';
import Link from './site-link';
import {money} from '../lib/domain';
import {nextDealOffset,type HomeDeal} from '../lib/home-deals';

export function HomePriceDrops(){
 const [deals,setDeals]=useState<HomeDeal[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const [paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false),[overflow,setOverflow]=useState(false);
 const strip=useRef<HTMLDivElement>(null);
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
 useEffect(()=>{const el=strip.current;if(!el)return;const measure=()=>setOverflow(el.scrollWidth>el.clientWidth+2);measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[deals]);
 const move=(direction:1|-1)=>{const el=strip.current;if(!el)return;const step=el.firstElementChild?.getBoundingClientRect().width||300;el.scrollTo({left:nextDealOffset(el.scrollLeft,el.scrollWidth-el.clientWidth,step,direction),behavior:reduced?'instant':'smooth'});};
 useEffect(()=>{
  if(paused||hovered||focused||reduced||hidden||!overflow)return;
  const timer=window.setInterval(()=>{const el=strip.current;if(!el)return;el.scrollTo({left:nextDealOffset(el.scrollLeft,el.scrollWidth-el.clientWidth,el.firstElementChild?.getBoundingClientRect().width||300,1),behavior:'smooth'});},5000);
  return()=>clearInterval(timer);
 },[paused,hovered,focused,reduced,hidden,overflow]);
 return <section className="home-deals" aria-labelledby="home-deals-title">
  <header><div><h2 id="home-deals-title">Latest price drops</h2><p>Recorded reductions from the last 30 days.</p></div><div className="home-deals-tools"><Link href="/deals?period=latest">View all deals<ArrowRight size={16} aria-hidden="true"/></Link>{overflow&&<div className="home-deals-controls" role="group" aria-label="Price drop scrolling"><button onClick={()=>{setPaused(true);move(-1);}} aria-label="Previous price drops"><ArrowLeft size={18}/></button>{!reduced&&<button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Play price drops':'Pause price drops'}>{paused?<Play size={17}/>:<Pause size={17}/>}</button>}<button onClick={()=>{setPaused(true);move(1);}} aria-label="Next price drops"><ArrowRight size={18}/></button></div>}</div></header>
  {loading?<p className="home-deals-state" role="status">Checking recorded prices…</p>:error?<div className="home-deals-state" role="status">Price history is unavailable right now. <button onClick={()=>{setLoading(true);setAttempt(v=>v+1);}}>Try again</button></div>:!deals.length?<p className="home-deals-state">No verified recent drops right now. <Link href="/watchlist">Watch your favorite parts</Link> while prices are tracked.</p>:<>
   <div ref={strip} className="home-deals-strip" aria-label="Recently discounted products" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false);}} onPointerDown={()=>setPaused(true)}>
    {deals.map(d=><Link key={d.offerId} className="home-deal" href={'/products/'+encodeURIComponent(d.productId)}><span className="home-deal-image"><Package aria-hidden="true" size={25}/>{d.image&&<img src={d.image} alt="" width={58} height={64} loading="lazy" decoding="async" onError={e=>{e.currentTarget.hidden=true;}}/>}</span><span className="home-deal-info"><strong title={d.name}>{d.name}</strong><span className="home-deal-retailer">{d.retailer}{d.condition==='used'?' · Used / refurbished':''}</span><span className="home-deal-price"><del>{money(d.previous)}</del><b>{money(d.current)}</b><span>−{d.percent.toFixed(1)}%</span></span><small>{d.packQuantity>1?`${money(d.purchasePrice)} / ${d.packQuantity}-unit pack · Per-unit prices`:'Single unit'} · Checked <time dateTime={d.observedAt}>{d.observedAt.slice(0,10)}</time></small></span></Link>)}
   </div><p className="home-deals-note">Shipping and tax excluded. Verify price and availability with the retailer.{overflow&&(reduced?' Swipe or use the arrows to browse.':' Advances every 5 seconds; pauses while you interact.')}</p>
  </>}
 </section>;
}
