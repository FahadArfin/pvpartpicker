'use client';
import {ArrowRight,ArrowUpRight,Battery,BookOpen,Box,Cable,Check,Eye,FolderOpen,Gauge,Grid2X2,PackageOpen,Plug,Search,ShieldCheck,Sun,TrendingDown,Wrench,Zap} from 'lucide-react';
import Link from './site-link';
import {usePV} from './pv-provider';
import {categories} from '../lib/types';
import {purposeLabel} from '../lib/build-library';

// Small, representative catalog photographs. No prices or catalog fetch on Home.
const equipment=[
  {id:'panels',label:'Solar panels',detail:'Watts, cells & panel face',icon:Sun,image:'https://cdn.shopify.com/s/files/1/0034/8913/6751/files/canadian-solar-cs7n-680tb-ag-680w-bifacial-solar-panel-pallet-1.webp?v=1790263636&width=240',example:'Canadian Solar CS7N panel'},
  {id:'batteries',label:'Solar batteries',detail:'Capacity, voltage & format',icon:Battery,image:'https://cdn.shopify.com/s/files/1/0034/8913/6751/files/1_153a32b5-0cfb-4585-8af1-30977a6e3801.png?v=1768828113&width=240',example:'EG4 AllWeather WallMount battery'},
  {id:'inverters',label:'Inverters',detail:'Off-grid, hybrid & grid-tied',icon:Zap,image:'https://cdn11.bigcommerce.com/s-bi8c0htqsn/products/3698/images/4079/6000XP00010_1_updatedwhite__32468.1758054079.386.513.jpg?c=1',example:'EG4 6000XP inverter'},
  {id:'all-in-one',label:'All-in-one power',detail:'Portable power & backup',icon:Plug,image:'https://cdn.shopify.com/s/files/1/0034/8913/6751/files/1_7acc2198-c5ff-4b78-b2d3-00709b574780.jpg?v=1773869041&width=240',example:'Pecron F1000LFP power station'},
];
const otherIcons={mounting:Wrench,wiring:Cable,charging:Plug,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,electrical:Box,accessories:Grid2X2};

export function HomeWorkspace() {
  const {build,draftReady}=usePV();
  const hasDraft=draftReady&&build.lines.length>0;
  return <main className="page-container home-dashboard">
    <section className="home-opening" aria-label="Welcome to PVPartPicker">
      <div className="home-welcome">
        <div className="home-kicker"><Sun size={15} aria-hidden="true"/>PVPartPicker<span>Plan it. Price it. Build it.</span></div>
        <h1>Find the right parts.<br/><span>Build your solar system.</span></h1>
        <p>From your first panel to a complete setup. Compare the details, follow the prices, and build a system that fits your life.</p>
        <form className="home-search" action="/parts" role="search" aria-label="Find solar equipment"><Search size={18} aria-hidden="true"/><input type="hidden" name="category" value="all"/><input type="search" name="q" aria-label="Search solar equipment" placeholder="Search a part, brand, or model…" maxLength={100}/><button type="submit" aria-label="Search parts"><ArrowRight size={19}/></button></form>
        <nav className="home-main-actions" aria-label="Get started"><Link className="button dark" href="/parts">Browse Parts<ArrowRight size={15}/></Link><Link className="button outline" href="/deals"><TrendingDown size={15}/>Price Drops</Link><Link className="button outline" href="/builds"><FolderOpen size={15}/>View Builds</Link></nav>
        <div className="home-detail-note"><Check size={13} aria-hidden="true"/>Compare specifications<span>·</span>Track retailer prices<span>·</span>Save your builds</div>
      </div>
      <aside className="home-workbench" aria-label="Your workbench">
        <div className="home-workbench-top"><Wrench size={16} aria-hidden="true"/><span>Your workbench</span><small>{hasDraft?'In progress':'Start here'}</small></div>
        <div className="home-workbench-body"><p className="home-overline">{hasDraft?'CURRENT DRAFT':'YOUR NEXT PROJECT'}</p><h2>{hasDraft?build.name:'Make it your own.'}</h2><p>{hasDraft?'Your setup is right where you left it.':'A home backup, an off-grid cabin, or a little more independence.'}</p>
          <dl><div><dt>Part selections</dt><dd>{draftReady?build.lines.length:'—'}</dd></div><div><dt>System</dt><dd>{draftReady?purposeLabel[build.settings.purpose]:'—'}</dd></div><div><dt>Mounting</dt><dd>{draftReady?(build.settings.mount==='roof'?'Roof':'Ground'):'—'}</dd></div></dl>
          <Link className="home-workbench-continue" href="/build">{hasDraft?'Continue your build':'Open System Builder'}<ArrowRight size={16}/></Link>
        </div><Link className="home-workbench-library" href="/builds"><FolderOpen size={14}/>Saved & community builds<ArrowUpRight size={13}/></Link>
      </aside>
    </section>
    <section className="home-equipment" aria-labelledby="home-equipment-title"><header className="home-section-title"><div><p className="home-overline">THE BUILDING BLOCKS</p><h2 id="home-equipment-title">Start with your equipment</h2></div><Link href="/parts?category=all">All {categories.length} categories<ArrowRight size={14}/></Link></header>
      <div className="home-equipment-grid">{equipment.map(({id,label,detail,icon:Icon,image,example})=><Link href={'/parts?category='+id} className="home-equipment-item" key={id}><div className="home-equipment-photo"><Icon size={30} aria-hidden="true"/><img src={image} alt="" title={'Example: '+example} width={96} height={92} loading="lazy" decoding="async" onError={e=>{e.currentTarget.hidden=true;}}/></div><div><h3>{label}</h3><p>{detail}</p></div><ArrowUpRight className="home-equipment-arrow" size={16} aria-hidden="true"/></Link>)}</div>
      <div className="home-more-equipment">{categories.filter(c=>!equipment.some(e=>e.id===c.id)).map(c=>{const Icon=otherIcons[c.id as keyof typeof otherIcons];return <Link href={'/parts?category='+c.id} key={c.id}><Icon size={15} aria-hidden="true"/>{c.label}<ArrowRight size={12} aria-hidden="true"/></Link>;})}</div>
    </section>
    <section className="home-resources" aria-label="Plan with confidence">
      <Link className="home-guide-feature" href="/guide"><div className="home-guide-photo"><img src="/guide/learn-equipment-wall.webp" alt="Illustration of an inverter, battery storage and electrical equipment" width={1000} height={667} loading="lazy"/><span>THE SOLAR GUIDE</span></div><div className="home-guide-copy"><div className="home-overline"><BookOpen size={13} aria-hidden="true"/>A GOOD PLACE TO BEGIN</div><h2>See how it all fits together.</h2><p>Panels, batteries, inverters, and everything in between. Get to know your system before you buy.</p><span className="home-resource-link">Explore the Guide<ArrowRight size={15}/></span></div></Link>
      <div className="home-resource-list"><Link href="/guide/calculators"><Gauge size={20} aria-hidden="true"/><div><h3>Run the numbers</h3><p>Production, battery runtime, and voltage drop.</p><span className="home-resource-link">Open calculators<ArrowRight size={13}/></span></div></Link><Link href="/watchlist"><Eye size={20} aria-hidden="true"/><div><h3>Keep an eye on your shortlist</h3><p>Save parts now. Follow their prices as you plan.</p><span className="home-resource-link">Your watch list<ArrowRight size={13}/></span></div></Link></div>
    </section>
  </main>;
}
