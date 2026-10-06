'use client';
import {useEffect, useState, useRef} from 'react';
import {Home, FolderOpen, Battery, BookOpen, Box, Cable, CircleUserRound, Eye, Gauge, Grid2X2, Layers, PackageOpen, Plug, ShieldCheck, SlidersHorizontal, Sun, TrendingDown, Wrench, Zap} from 'lucide-react';
import Link from './site-link';
import {usePV} from './pv-provider';
import {ThemeToggle} from './theme-toggle';
import {categories} from '../lib/types';
import {bestOffer, costForQuantity, money} from '../lib/domain';

const icons = {panels:Sun,mounting:Wrench,wiring:Cable,batteries:Battery,'all-in-one':Battery,inverters:Zap,charging:Plug,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,electrical:Box,accessories:SlidersHorizontal};
const links = [
  {href:'/',label:'Home',icon:Home}, {href:'/parts',label:'Parts',icon:Grid2X2},
  {href:'/build',label:'My build',icon:Wrench}, {href:'/builds',label:'Builds',icon:FolderOpen},
  {href:'/deals',label:'Price drops',icon:TrendingDown}, {href:'/watchlist',label:'Watch list',icon:Eye},
  {href:'/tiers',label:'Tier lists',icon:Layers}, {href:'/guide',label:'Guide',icon:BookOpen},
];
export function SiteNavigation({path}:{path:string}) {
  const {build,watchIds,user,draftReady} = usePV();
  const [category,setCategory] = useState('panels'), [builder,setBuilder] = useState(false);
  const header=useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () => {const query=new URLSearchParams(location.search);setCategory(query.get('category')||'panels');setBuilder(query.get('builder')==='1');};
    sync();window.addEventListener('pv:catalog-change',sync);
    return () => window.removeEventListener('pv:catalog-change',sync);
  },[path]);
  useEffect(()=>{
    // Keep the selected section/category visible without scrolling the page.
    const reveal=()=>{for(const nav of header.current?.querySelectorAll<HTMLElement>('nav')||[]){
      const active=nav.querySelector<HTMLElement>('[aria-current=page]');if(!active)continue;
      const row=nav.getBoundingClientRect(),item=active.getBoundingClientRect();
      if(item.left<row.left)nav.scrollLeft+=item.left-row.left-12;
      else if(item.right>row.right)nav.scrollLeft+=item.right-row.right+12;
    }};
    reveal();window.addEventListener('resize',reveal);
    return()=>window.removeEventListener('resize',reveal);
  },[path,category]);
  if(path==='/') return <header className="home-header">
    <Link className="home-brand" href="/" aria-label="PVPartPicker home"><Grid2X2 size={29} strokeWidth={1.7} aria-hidden="true"/><span>PV<b>Part</b>Picker</span></Link>
    <nav className="home-header-links" aria-label="Home navigation">{user?<Link href="/account">My account</Link>:<a href="/signin-with-chatgpt?return_to=%2Faccount" target="_top">Sign in</a>}<ThemeToggle/></nav>
  </header>;
  return <header ref={header} className="workspace-header">
    <div className="workspace-topbar">
      <Link className="workspace-brand" href="/" aria-label="PVPartPicker home"><Grid2X2 size={23} aria-hidden="true"/><span>PV<b>Part</b>Picker</span></Link>
      <div className="workspace-tools"><Link className="workspace-scraper" href="/price-scraper" aria-current={path==='/price-scraper'?'page':undefined}>Price scraper</Link><ThemeToggle/>{user?<Link className="workspace-account" href="/account" aria-label="My account"><CircleUserRound size={17} aria-hidden="true"/><span>My account</span></Link>:<a className="workspace-account" href="/signin-with-chatgpt?return_to=%2Faccount" target="_top">Sign in</a>}</div>
    </div>
    <nav className="workspace-primary" aria-label="Main navigation">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={(href==='/'?path==='/':(path===href||path.startsWith(href+'/')||(href==='/parts'&&path.startsWith('/products/'))||(href==='/builds'&&path.startsWith('/community'))))?'page':undefined}><Icon size={16} aria-hidden="true"/><span>{label}</span>{href==='/build'&&draftReady&&build.lines.length>0&&<small>{build.lines.length}</small>}{href==='/watchlist'&&watchIds.length>0&&<small>{watchIds.length}</small>}</Link>)}</nav>
    {path==='/parts'&&<nav className="workspace-categories" aria-label="Part categories">{categories.map(c=>{const Icon=icons[c.id];return <Link key={c.id} href={'/parts?category='+c.id+(builder?'&builder=1':'')} aria-current={category===c.id?'page':undefined}><Icon size={15} aria-hidden="true"/><span>{c.label}</span></Link>;})}</nav>}
  </header>;
}

export function CatalogBuildTray() {
  const {build,products,draftReady,compare}=usePV();
  let subtotal=0,unpriced=0;
  for(const line of build.lines){const p=products.find(p=>p.id===line.productId);const offer=p?(line.offerId?p.offers.find(o=>o.id===line.offerId&&bestOffer({...p,offers:[o]},line.quantity)):bestOffer(p,line.quantity)):undefined;const cost=offer?costForQuantity(offer,line.quantity):null;if(cost)subtotal+=cost.subtotal;else unpriced++;}
  return <div className={'catalog-build-tray'+(compare.length?' with-comparison':'')}><Wrench size={17}/><div><strong>{draftReady?build.name:'My solar build'}</strong><small>{draftReady?`${build.lines.length} selected parts`:'Loading build…'}{unpriced>0?` · ${unpriced} need current prices`:''}</small></div><div className="tray-subtotal"><small>Equipment subtotal</small><strong>{draftReady?money(subtotal):'—'}</strong></div><Link className="button dark small" href="/build">View build</Link></div>;
}
