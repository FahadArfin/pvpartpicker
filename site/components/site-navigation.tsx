'use client';
import {useEffect, useState, useRef} from 'react';
import {Home, FolderOpen, Battery, BookOpen, Box, Cable, CircleUserRound, Eye, Gauge, Grid2X2, Layers, Menu, PackageOpen, Plug, ShieldCheck, SlidersHorizontal, Sun, TrendingDown, Users, Wrench, Zap} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import Link from './site-link';
import {usePV} from './pv-provider';
import {ThemeToggle} from './theme-toggle';
import {categories} from '../lib/types';
import {bestOffer, costForQuantity, money} from '../lib/domain';

const icons = {panels:Sun,mounting:Wrench,wiring:Cable,batteries:Battery,'all-in-one':Battery,inverters:Zap,charging:Plug,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,electrical:Box,accessories:SlidersHorizontal};
const links = [
  {href:'/',label:'Home',icon:Home}, {href:'/parts',label:'Parts',icon:Grid2X2},
  {href:'/builds',label:'Builds',icon:FolderOpen},
  {href:'/deals',label:'Price drops',icon:TrendingDown}, {href:'/watchlist',label:'Watch list',icon:Eye},
  {href:'/tiers',label:'Tier lists',icon:Layers}, {href:'/guide',label:'Guide',icon:BookOpen},
];
const buildLinks = [
  {href:'/build',label:'My Build',icon:Wrench},
  {href:'/builds/saved',label:'Saved Builds',icon:FolderOpen},
  {href:'/builds/community',label:'Popular Builds',icon:Users},
];
export function SiteNavigation({path}:{path:string}) {
  const {build,watchIds,user,draftReady} = usePV();
  const [category,setCategory] = useState('panels'), [builder,setBuilder] = useState(false);
  const header=useRef<HTMLElement>(null);
  const [menuOpen,setMenuOpen]=useState(false),menuTrigger=useRef<HTMLButtonElement>(null);
  const inBuilds=path==='/build'||path==='/builds'||path.startsWith('/builds/')||path==='/community'||path.startsWith('/community/')||path.startsWith('/share/');
  const active=(href:string)=>href==='/'?path==='/':path===href||path.startsWith(href+'/')||(href==='/parts'&&path.startsWith('/products/'))||(href==='/builds'&&inBuilds)||(href==='/builds/community'&&(path==='/community'||path.startsWith('/community/')));
  const current=links.find(l=>active(l.href));
  const buildNavigation=(mobile=false)=><nav className={mobile?'mobile-build-navigation':'workspace-categories workspace-builds'} aria-label={mobile?'Builds in mobile navigation':'Builds navigation'}>{buildLinks.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={active(href)?'page':undefined} onClick={()=>setMenuOpen(false)}><Icon size={15} aria-hidden="true"/><span>{label}</span>{href==='/build'&&draftReady&&build.lines.length>0&&<small>{build.lines.length}</small>}</Link>)}</nav>;
  useEffect(()=>{setMenuOpen(false);},[path]);
  useEffect(()=>{const media=window.matchMedia('(min-width:721px)');const close=()=>{if(media.matches)setMenuOpen(false);};media.addEventListener('change',close);return()=>media.removeEventListener('change',close);},[]);
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
    <div className="workspace-mobile-bar"><span>{current?current.label:path==='/price-scraper'?'Price scraper':path.startsWith('/account')?'My account':'Your solar workspace'}</span><button ref={menuTrigger} aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={()=>setMenuOpen(true)}><Menu size={18} aria-hidden="true"/>Menu</button></div>
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}><DialogContent className="build-dialog mobile-navigation-dialog" onCloseAutoFocus={e=>{e.preventDefault();menuTrigger.current?.focus();}}><DialogTitle>Navigate PVPartPicker</DialogTitle><DialogDescription className="sr-only">Choose a section of your solar workspace.</DialogDescription><nav aria-label="Mobile navigation">{links.map(({href,label,icon:Icon})=>{const link=<Link href={href} aria-current={active(href)?'page':undefined} onClick={()=>setMenuOpen(false)}><Icon size={19} aria-hidden="true"/><span>{label}</span>{href==='/watchlist'&&watchIds.length>0&&<small>{watchIds.length}</small>}</Link>;return href==='/builds'?<div key={href} className="mobile-navigation-group">{link}{buildNavigation(true)}</div>:<div key={href}>{link}</div>;})}</nav><div className="mobile-navigation-tools"><Link href="/price-scraper" onClick={()=>setMenuOpen(false)}>Price scraper</Link><Link href="/account" onClick={()=>setMenuOpen(false)}>My account</Link></div></DialogContent></Dialog>
    <nav className="workspace-primary" aria-label="Main navigation">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={active(href)?'page':undefined}><Icon size={16} aria-hidden="true"/><span>{label}</span>{href==='/watchlist'&&watchIds.length>0&&<small>{watchIds.length}</small>}</Link>)}</nav>
    {inBuilds&&buildNavigation()}
    {path==='/parts'&&<nav className="workspace-categories" aria-label="Part categories">{categories.map(c=>{const Icon=icons[c.id];return <Link key={c.id} href={'/parts?category='+c.id+(builder?'&builder=1':'')} aria-current={category===c.id?'page':undefined}><Icon size={15} aria-hidden="true"/><span>{c.label}</span></Link>;})}</nav>}
  </header>;
}

export function CatalogBuildTray() {
  const {build,products,draftReady,compare}=usePV();
  let subtotal=0,unpriced=0;
  for(const line of build.lines){const p=products.find(p=>p.id===line.productId);const offer=p?(line.offerId?p.offers.find(o=>o.id===line.offerId&&bestOffer({...p,offers:[o]},line.quantity)):bestOffer(p,line.quantity)):undefined;const cost=offer?costForQuantity(offer,line.quantity):null;if(cost)subtotal+=cost.subtotal;else unpriced++;}
  return <div className={'catalog-build-tray'+(compare.length?' with-comparison':'')}><Wrench size={17}/><div><strong>{draftReady?build.name:'My solar build'}</strong><small>{draftReady?`${build.lines.length} selected parts`:'Loading build…'}{unpriced>0?` · ${unpriced} need current prices`:''}</small></div><div className="tray-subtotal"><small>Equipment subtotal</small><strong>{draftReady?money(subtotal):'—'}</strong></div><Link className="button dark small" href="/build">View build</Link></div>;
}
