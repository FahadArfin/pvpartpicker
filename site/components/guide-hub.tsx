'use client';
import {useState} from 'react';
import {Search,ArrowRight,BookOpen} from 'lucide-react';
import Link from './site-link';
import GuideViewNavigation from './guide-view-navigation';
import type {GuideEntry} from '../lib/guide-content';
export default function GuideHub({entries}:{entries:GuideEntry[]}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('All'),[topic,setTopic]=useState('All topics');
 const topics=[...new Set(entries.map(e=>e.topic))].sort();
 const filtered=entries.filter(e=>(filter==='All'||(filter==='News'?e.kind==='News & analysis':e.kind==='Guide'&&(e.level===filter||e.level==='All levels')))&&(topic==='All topics'||e.topic===topic)&&`${e.title} ${e.summary} ${e.topic}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <main className="page-container guide-hub"><div className="eyebrow">SOLAR KNOWLEDGE, PUT TO WORK</div><h1>Guide</h1><p className="guide-lead">An illustrated solar reference. Study the equipment, follow worked examples, and put the numbers into practice.</p>
 <GuideViewNavigation view="articles" articleHref="/guide?view=library" calculatorHref="/guide/calculators?article=library"/>
 <div className="guide-start guide-start-single"><div><BookOpen size={22}/><div><strong>New to solar?</strong><p>Start with loads and purpose, then work toward a complete system.</p></div><Link href="/guide/solar-energy-path">Start here <ArrowRight size={15}/></Link></div></div>
 <div className="guide-library-controls"><label className="guide-search"><Search size={18}/><input aria-label="Search guides" placeholder="Search guides, technology, policy…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="guide-topic"><span className="sr-only">Topic</span><select aria-label="Filter by topic" value={topic} onChange={e=>setTopic(e.target.value)}><option>All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select></label></div>
 <div className="guide-tabs" aria-label="Guide audience">{['All','Beginner','Experienced','News'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='Beginner'?'Getting started':f==='Experienced'?'Going deeper':f==='News'?'News & analysis':'All articles'}</button>)}</div>
 <div className="guide-list-caption"><span aria-live="polite">{filtered.length} articles</span><span>Review and adaptation dates appear in each article · News is a dated collection</span></div>
 <div className="guide-list">{filtered.map((e,i)=><Link className="guide-row" href={'/guide/'+e.slug} key={e.slug}><span className="guide-row-number">{String(i+1).padStart(2,'0')}</span><div><div className="guide-row-tags"><span>{e.topic}</span><span>{e.kind==='Guide'?e.level:'News & analysis'}</span></div><h2>{e.title}</h2><p>{e.summary}</p></div><div className="guide-row-end"><span>{e.minutes} min read</span>{e.eventDate&&<time dateTime={e.eventDate}>{new Date(e.eventDate+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}</time>}<ArrowRight size={18}/></div></Link>)}</div>
 {!filtered.length&&<div className="guide-no-results"><h2>No articles match those filters.</h2><button className="button outline" onClick={()=>{setQuery('');setFilter('All');setTopic('All topics');}}>Clear filters</button></div>}
 <p className="guide-library-note">Worked examples use stated assumptions. Confirm the exact equipment manuals, installation requirements and current local rules for your project.</p></main>;
}
