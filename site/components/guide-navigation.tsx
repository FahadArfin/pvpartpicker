'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,Search} from 'lucide-react';
import Link from './site-link';
import {Dialog,DialogContent,DialogTitle} from './ui/dialog';
import type {GuideEntry} from '../lib/guide-content';
const topicOrder=['Foundations','Site and sunlight','Panels & technology','System design','Batteries & backup','Inverters & backup','Electrical design','Placement','Buying and ownership','Operation & maintenance'];
export default function GuideNavigation({entries,currentSlug,sections}:{entries:GuideEntry[];currentSlug:string;sections:{id:string;title:string}[]}){
 const [query,setQuery]=useState(''),[active,setActive]=useState(''),[expanded,setExpanded]=useState(false),[mode,setMode]=useState('chapters');
 const trigger=useRef<HTMLButtonElement>(null),sectionJump=useRef('');
 const selected=entries.find(e=>e.slug===currentSlug);
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const matches=entries.filter(e=>terms.every(t=>`${e.title} ${e.summary} ${e.topic} ${e.slug.replace(/-/g,' ')}`.toLowerCase().includes(t)));
 const groups=[...new Set(entries.filter(e=>e.kind==='Guide').map(e=>e.topic))].sort((a,b)=>(topicOrder.indexOf(a)<0?99:topicOrder.indexOf(a))-(topicOrder.indexOf(b)<0?99:topicOrder.indexOf(b)));
 useEffect(()=>{
  const nodes=sections.map(s=>document.getElementById(s.id)).filter((e):e is HTMLElement=>!!e);
  const observer=new IntersectionObserver(items=>{const visible=items.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])setActive(visible[0].target.id);},{rootMargin:'-110px 0px -55% 0px',threshold:0});
  nodes.forEach(n=>observer.observe(n));return()=>observer.disconnect();
 },[sections]);
 const chapter=(e:GuideEntry)=><li key={e.slug}><Link href={'/guide/'+e.slug} onClick={()=>setExpanded(false)} aria-current={e.slug===currentSlug?'page':undefined}><span className="guide-chapter-number">{String(entries.filter(x=>x.kind===e.kind).findIndex(x=>x.slug===e.slug)+1).padStart(2,'0')}</span><span>{e.title}</span></Link></li>;
 const contents=<>   <label className="guide-nav-search"><Search size={14}/><input aria-label="Search guide chapters" placeholder="Find a topic…" value={query} onChange={e=>{setQuery(e.target.value);setMode('chapters');}}/></label>
   <div className="guide-nav-tools"><Link href="/guide?view=library">All articles & filters →</Link></div>
   <div className="guide-nav-modes" role="group" aria-label="Contents navigation"><button aria-pressed={mode==='chapters'} onClick={()=>setMode('chapters')}>Chapters</button><button aria-pressed={mode==='sections'} onClick={()=>setMode('sections')}>In this chapter</button></div>
   <nav aria-label="Guide chapters" hidden={mode!=='chapters'}>{groups.map(group=>{const items=matches.filter(e=>e.kind==='Guide'&&e.topic===group);return items.length?<details key={group+(query?'search':'')} open={query?true:group===selected?.topic}><summary>{group}<span>{items.length}</span></summary><ol>{items.map(chapter)}</ol></details>:null;})}
    {matches.some(e=>e.kind==='News & analysis')&&<details open={selected?.kind==='News & analysis'||!!query}><summary>News & analysis<span>{matches.filter(e=>e.kind==='News & analysis').length}</span></summary><ol>{matches.filter(e=>e.kind==='News & analysis').map(chapter)}</ol></details>}
    {!matches.length&&<div className="guide-nav-empty"><p>No chapters match.</p><button onClick={()=>setQuery('')}>Clear search</button></div>}
   </nav>
   <nav className="guide-current-outline" aria-label="In this chapter" hidden={mode!=='sections'}><strong>{selected?.title}</strong>{sections.map(s=><a href={'#'+s.id} key={s.id} aria-current={active===s.id?'location':undefined} onClick={e=>{if(expanded){e.preventDefault();sectionJump.current=s.id;setExpanded(false);}setActive(s.id);}}>{s.title}</a>)}</nav>
</>;
 return <aside className="guide-curriculum" aria-label="Guide table of contents"><div className="guide-curriculum-title"><BookOpen size={17}/><strong>Table of contents</strong><button ref={trigger} className="guide-contents-toggle" aria-expanded={expanded} aria-haspopup="dialog" onClick={()=>setExpanded(true)}>Contents</button></div><div className="guide-phone-chapter">{selected?.title}<small>{entries.filter(e=>e.kind===selected?.kind).findIndex(e=>e.slug===currentSlug)+1} / {entries.filter(e=>e.kind===selected?.kind).length} chapters</small></div><div className="guide-contents-body guide-desktop-contents" id="guide-contents-body">{contents}</div><Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="build-dialog guide-contents-dialog" onCloseAutoFocus={e=>{e.preventDefault();if(sectionJump.current){const id=sectionJump.current;sectionJump.current='';requestAnimationFrame(()=>{const section=document.getElementById(id);section?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});if(section){section.tabIndex=-1;section.focus({preventScroll:true});}window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search+'#'+id);});}else trigger.current?.focus();}}><DialogTitle>Guide contents</DialogTitle><div className="guide-contents-body is-open">{contents}</div></DialogContent></Dialog></aside>;
}
