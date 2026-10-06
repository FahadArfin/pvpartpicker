"use client";
import {ArrowRight,BookOpen,Eye,FolderClosed,Layers,Search,SolarPanel,Tag} from 'lucide-react';
import Link from './site-link';
import {HomePriceDrops} from './home-price-drops';

const shortcuts=[
  {href:'/parts',label:'Browse Parts',icon:SolarPanel,primary:true},
  {href:'/deals',label:'Price Drops',icon:Tag,primary:false},
  {href:'/builds',label:'View Builds',icon:FolderClosed,primary:false},
  {href:'/tiers',label:'Tier Lists',icon:Layers,primary:false},
  {href:'/watchlist',label:'Watch List',icon:Eye,primary:false},
  {href:'/guide',label:'Guide',icon:BookOpen,primary:false},
];

export function HomeWorkspace() {
  return <><main className="home-simple" aria-labelledby="home-title">
    <div className="home-simple-content">
      <h1 id="home-title">Build your solar system.</h1>
      <p className="home-simple-intro">Find parts. Compare prices. Put it all together.</p>
      <form className="home-simple-search" action="/parts" role="search" aria-label="Find solar equipment">
        <Search size={24} aria-hidden="true"/>
        <input type="hidden" name="category" value="all"/>
        <input type="search" name="q" aria-label="Search solar equipment" placeholder="Search solar parts…" maxLength={100}/>
        <button type="submit" aria-label="Search parts"><ArrowRight size={24} aria-hidden="true"/></button>
      </form>
      <nav className="home-shortcuts" aria-label="Get started">
        {shortcuts.map(({href,label,icon:Icon,primary})=><Link key={href} href={href} className={'home-shortcut'+(primary?' home-shortcut-primary':'')}><span className="home-shortcut-circle"><Icon size={38} strokeWidth={1.6} aria-hidden="true"/></span><span>{label}</span></Link>)}
      </nav>
    </div>
  </main><HomePriceDrops/></>;
}
