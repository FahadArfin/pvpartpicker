'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {BookOpen,Eye,FolderClosed,Layers,SolarPanel,Tag} from 'lucide-react';
import Link from './site-link';

const sections=[
  {href:'/parts',label:'Browse Parts',icon:SolarPanel},
  {href:'/deals',label:'Price Drops',icon:Tag},
  {href:'/builds',label:'View Builds',icon:FolderClosed},
  {href:'/tiers',label:'Tier Lists',icon:Layers},
  {href:'/watchlist',label:'Watch List',icon:Eye},
  {href:'/guide',label:'Guide',icon:BookOpen},
];

/** Beta navigation: stay out of the way while reading; return near page top. */
export function FloatingSections({path,compareCount,hasNotice}:{path:string;compareCount:number;hasNotice:boolean}){
  const nav=useRef<HTMLElement>(null);
  const [hidden,setHidden]=useState(false),[focused,setFocused]=useState(false),[lift,setLift]=useState(0);
  useEffect(()=>{
    let frame=0;
    const update=()=>{
      frame=0;
      // Hysteresis avoids flickering around a single scroll threshold.
      setHidden(previous=>window.scrollY<=32?false:window.scrollY>96?true:previous);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    schedule();window.addEventListener('scroll',schedule,{passive:true});
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);};
  },[path]);
  useEffect(()=>{
    let frame=0;
    let bars:HTMLElement[]=[];
    const measure=()=>{
      frame=0;
      setLift(Math.max(0,...bars.map(bar=>{
        const box=bar.getBoundingClientRect();
        return box.height&&box.top<window.innerHeight?window.innerHeight-box.top:0;
      })));
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    const observer=new ResizeObserver(schedule);
    const refresh=()=>{
      const next=[...document.querySelectorAll<HTMLElement>('.catalog-build-tray,.compare-dock,.toast')];
      if(next.length===bars.length&&next.every((bar,index)=>bar===bars[index]))return;
      observer.disconnect();bars=next;bars.forEach(bar=>observer.observe(bar));schedule();
    };
    // A catalog tray can mount after route navigation finishes loading its data.
    const mounts=new MutationObserver(refresh);mounts.observe(document.body,{childList:true,subtree:true});
    refresh();schedule();window.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();mounts.disconnect();window.removeEventListener('resize',schedule);};
  },[path,compareCount,hasNotice]);
  const concealed=hidden&&!focused;
  const style={'--section-dock-lift':`${lift}px`} as CSSProperties;
  const active=(href:string)=>path===href||path.startsWith(href+'/')||(href==='/parts'&&path.startsWith('/products/'))||(href==='/builds'&&(path==='/build'||path.startsWith('/community')));
  return <><div className="section-dock-space" style={style} aria-hidden="true"/>
    <nav ref={nav} className="section-dock" style={style} data-hidden={concealed?'true':'false'} aria-label="Section shortcuts" aria-hidden={concealed} inert={concealed}
      onPointerDownCapture={()=>setFocused(false)} onFocusCapture={event=>setFocused(event.target.matches(':focus-visible'))} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false);}}>
      {sections.map(({href,label,icon:Icon})=><Link key={href} href={href} className="section-dock-link" data-primary={path==='/'&&href==='/parts'?'true':undefined} aria-current={active(href)?'page':undefined}>
        <span className="section-dock-circle"><Icon size={29} strokeWidth={1.6} aria-hidden="true"/></span><span className="section-dock-label">{label}</span>
      </Link>)}
    </nav></>;
}
