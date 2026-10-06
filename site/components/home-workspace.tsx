'use client';
import {ArrowRight,BookOpen,FolderOpen,Grid2X2,TrendingDown,Wrench} from 'lucide-react';
import Link from './site-link';
import {usePV} from './pv-provider';
import {categories} from '../lib/types';

const actions=[
  {href:'/parts',label:'Browse Parts',icon:Grid2X2,description:'Compare specs, retailer prices, and price history. Add the right parts to your system.'},
  {href:'/deals',label:'Price Drops',icon:TrendingDown,description:'See recorded daily, weekly, and monthly drops. Find savings by dollars or percentage.'},
  {href:'/builds',label:'View Builds',icon:FolderOpen,description:'Reopen a saved setup or explore community builds for your next project.'},
];
export function HomeWorkspace() {
  const {build,draftReady}=usePV();
  return <main className="page-container home-page">
    <header className="home-heading"><span className="eyebrow">YOUR SOLAR WORKSPACE</span><h1>PVPartPicker</h1><p>Plan your solar system, one part at a time.</p></header>
    <section className="home-actions" aria-label="Get started">{actions.map(({href,label,icon:Icon,description},i)=><article key={href}><Icon size={22} aria-hidden="true"/><h2>{label}</h2><p>{description}</p><Link className={'button '+(i===0?'dark':'outline')} href={href}>{label}<ArrowRight size={15} aria-hidden="true"/></Link></article>)}</section>
    <section className="home-current" aria-label="Current build"><Wrench size={20} aria-hidden="true"/><div><span className="eyebrow">{draftReady&&build.lines.length?'PICK UP WHERE YOU LEFT OFF':'READY TO BUILD?'}</span><h2>{draftReady&&build.lines.length?build.name:'Start with your first part'}</h2><p>{draftReady&&build.lines.length?`${build.lines.length} part selection${build.lines.length===1?'':'s'} in your current draft.`:'Choose your system goals, then bring your equipment together.'}</p></div><Link className="button outline small" href="/build">{draftReady&&build.lines.length?'Continue build':'Open System Builder'}<ArrowRight size={14} aria-hidden="true"/></Link></section>
    <section className="home-categories"><div className="section-heading"><h2>Shop by category</h2><Link className="text-link small-text" href="/parts?category=all">All parts <ArrowRight size={13}/></Link></div><div>{categories.map(category=><Link href={'/parts?category='+category.id} key={category.id}>{category.label}<ArrowRight size={14} aria-hidden="true"/></Link>)}</div></section>
    <section className="home-learning"><BookOpen size={20} aria-hidden="true"/><div><h2>Get the details right</h2><p>Build your knowledge alongside your system.</p></div><nav aria-label="Planning resources"><Link href="/guide">Read the Guide <ArrowRight size={13}/></Link><Link href="/guide/calculators">Use the calculators <ArrowRight size={13}/></Link><Link href="/tiers">Explore tier lists <ArrowRight size={13}/></Link></nav></section>
  </main>;
}
