'use client';
import {useEffect, useState, useRef} from 'react';
import {Home, FolderOpen, Battery, BookOpen, Box, Cable, CircleUserRound, Eye, Gauge, Grid2X2, Layers, Menu, PackageOpen, Plug, ShieldCheck, SlidersHorizontal, Sun, TrendingDown, Wrench, X, Zap} from 'lucide-react';
import Link from './site-link';
import {usePV} from './pv-provider';
import {ThemeToggle} from './theme-toggle';
import {categories} from '../lib/types';
import {bestOffer, costForQuantity, money} from '../lib/domain';
import {Dialog, DialogContent, DialogTitle} from './ui/dialog';

const icons = {panels:Sun,mounting:Wrench,wiring:Cable,batteries:Battery,'all-in-one':Battery,inverters:Zap,charging:Plug,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,electrical:Box,accessories:SlidersHorizontal};
const links = [
  {href:'/',label:'Home',icon:Home}, {href:'/parts',label:'Parts',icon:Grid2X2},
  {href:'/build',label:'My build',icon:Wrench}, {href:'/builds',label:'View builds',icon:FolderOpen},
  {href:'/deals',label:'Price drops',icon:TrendingDown}, {href:'/watchlist',label:'Watch list',icon:Eye},
  {href:'/tiers',label:'Tier lists',icon:Layers}, {href:'/guide',label:'Guide',icon:BookOpen},
];
export function SiteNavigation({path}:{path:string}) {
  const {build,watchIds,user,draftReady} = usePV();
  const menuButton=useRef<HTMLButtonElement>(null);
  const [category,setCategory] = useState('panels'), [builder,setBuilder] = useState(false), [open,setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {const query=new URLSearchParams(location.search);setCategory(query.get('category')||'panels');setBuilder(query.get('builder')==='1');};
    sync();window.addEventListener('pv:catalog-change',sync);
    return () => window.removeEventListener('pv:catalog-change',sync);
  },[path]);
  const navigation = <>
    <Link className="rail-brand" href="/" aria-label="PVPartPicker home"><Grid2X2 size={23}/><span>PV<b>Part</b>Picker</span></Link>
    <nav className="rail-primary" aria-label="Main navigation">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={(href==='/'?path==='/':(path===href||path.startsWith(href+'/')||(href==='/builds'&&path.startsWith('/community'))))?'page':undefined} onClick={()=>setOpen(false)}><Icon size={17}/><span>{label}</span>{href==='/build'&&draftReady&&build.lines.length>0&&<small>{build.lines.length}</small>}{href==='/watchlist'&&watchIds.length>0&&<small>{watchIds.length}</small>}</Link>)}</nav>
    <nav className="rail-categories" aria-label="Part categories"><h2>Parts</h2>{categories.map(c=>{const Icon=icons[c.id];return <Link key={c.id} href={'/parts?category='+c.id+(builder?'&builder=1':'')} aria-current={path==='/parts'&&category===c.id?'page':undefined} onClick={()=>setOpen(false)}><Icon size={16}/><span>{c.label}</span></Link>;})}</nav>
    <div className="rail-build"><small>Current build</small><strong>{draftReady?build.name:'My solar build'}</strong><Link href="/build">{draftReady?`${build.lines.length} selected parts · `:''}View build</Link></div>
    <div className="rail-utility"><Link href="/price-scraper">Price scraper</Link><Link href="/account">Account</Link></div>
  </>;
  return <><aside className="workspace-rail">{navigation}</aside><header className="workspace-topbar"><button ref={menuButton} className="icon-button rail-menu-toggle" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={21}/></button><span className="workspace-location">{links.find(l=>l.href==='/'?path==='/':(path===l.href||path.startsWith(l.href+'/')||(l.href==='/builds'&&path.startsWith('/community'))))?.label||'PVPartPicker'}<span> / {path==='/parts'?(categories.find(c=>c.id===category)?.label||'All parts'):'Your solar workspace'}</span></span><div className="workspace-tools"><ThemeToggle/>{user?<Link className="workspace-account" href="/account"><CircleUserRound size={17}/><span>My account</span></Link>:<a className="workspace-account" href="/signin-with-chatgpt?return_to=%2Faccount" target="_top">Sign in</a>}</div></header><Dialog open={open} onOpenChange={setOpen}><DialogContent className="rail-mobile-dialog" aria-describedby={undefined} onCloseAutoFocus={e=>{e.preventDefault();menuButton.current?.focus();}}><DialogTitle className="sr-only">Site navigation</DialogTitle>{navigation}</DialogContent></Dialog></>;
}

export function CatalogBuildTray() {
  const {build,products,draftReady,compare}=usePV();
  let subtotal=0,unpriced=0;
  for(const line of build.lines){const p=products.find(p=>p.id===line.productId);const offer=p?(line.offerId?p.offers.find(o=>o.id===line.offerId&&bestOffer({...p,offers:[o]},line.quantity)):bestOffer(p,line.quantity)):undefined;const cost=offer?costForQuantity(offer,line.quantity):null;if(cost)subtotal+=cost.subtotal;else unpriced++;}
  return <div className={'catalog-build-tray'+(compare.length?' with-comparison':'')}><Wrench size={17}/><div><strong>{draftReady?build.name:'My solar build'}</strong><small>{draftReady?`${build.lines.length} selected parts`:'Loading build…'}{unpriced>0?` · ${unpriced} need current prices`:''}</small></div><div className="tray-subtotal"><small>Equipment subtotal</small><strong>{draftReady?money(subtotal):'—'}</strong></div><Link className="button dark small" href="/build">View build</Link></div>;
}
