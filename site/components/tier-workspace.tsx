'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Battery,BookOpen,Check,Image as ImageIcon,Search,Sparkles,Sun,Trophy,Type,X,Zap} from 'lucide-react';
import Link from './site-link';
import {ProductImage,usePV,WatchButton} from './pv-provider';
import {BuildQuantity} from './build-quantity';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from './ui/tooltip';
import {money} from '../lib/domain';
import {rankings,tierFamilies,tierPrice,valueTier,valueBands,filterRankings,batteryFormats} from '../lib/tiers';
import type {Ranking,RankedCategory,Tier,BatteryFormat} from '../lib/tiers';
import type {Product} from '../lib/types';
const icons={'all-in-one':Battery,batteries:Battery,panels:Sun,inverters:Zap};
const tiers:Tier[]=['S','A','B','C'];
const labels={S:'Standout for its use',A:'Strong choice',B:'Good with trade-offs',C:'Specialist / compromise'};
// Photo-only matches do not qualify a bundle or revision for price rankings.
const photoIds:Record<string,string[]>={f3800:['santan-solar-b179011f'],'f3800-plus':['santan-solar-b17901127'],aptos460:['shopsolar-51480113479820']};
const queries:Record<string,string>={c2000:'C2000',f3800:'F3800','f3800-plus':'F3800 Plus','sok-n':'SK48V100N',lifepower:'LifePower',lifepower4:'LifePower','lifepower-v2':'LifePower',cs600:'CS6W-600TB-AG',cs680:'CS7N-680TB-AG',aptos460:'Aptos 460', 'used-cs300':'Used Canadian 300',solark15:'Sol-Ark 15K'};
export function TierWorkspace({initialId=''}:{initialId?:string}){
 const {products,compare,setCompare}=usePV();
 const initial=rankings.find(r=>r.id===initialId);
 const[category,setCategory]=useState<RankedCategory>(initial?.category||'all-in-one'),[mode,setMode]=useState<'editorial'|'value'>('editorial'),[cohort,setCohort]=useState('all'),[q,setQ]=useState(''),[selected,setSelected]=useState(initial?.id||''),[now,setNow]=useState<number|undefined>();
 const [pricedOnly,setPricedOnly]=useState(false),[mobile,setMobile]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:900px)');const sync=()=>setMobile(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const [format,setFormat]=useState<BatteryFormat|'all'>('all');
 const researchDate=new Date(Math.max(...rankings.map(r=>Date.parse(r.reviewedAt)))).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const inspector=useRef<HTMLElement>(null);
 const selectedButton=useRef<HTMLButtonElement|null>(null);
 const [display,setDisplay]=useState<'images'|'names'>('images');
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const family=tierFamilies.find(f=>f.id===category)!;
 const familyEntries=rankings.filter(r=>r.category===category);

 const prices=useMemo(()=>new Map(rankings.filter(r=>r.category===category).map(r=>[r.id,now===undefined?undefined:tierPrice(r,products,now)])),[category,products,now]);
 const visible=filterRankings(rankings,{category,cohort,format,query:q}).filter(r=>!pricedOnly||prices.get(r.id));
 const price=(r:Ranking)=>prices.get(r.id);
 const rank=(r:Ranking)=>mode==='editorial'?r.tier:valueTier(r,price(r));
 const entry=visible.find(r=>r.id===selected);
 useEffect(()=>{if(selected&&!visible.some(r=>r.id===selected))setSelected('');},[selected,category,cohort,format,q,pricedOnly,prices]);
 const current=entry?price(entry):undefined;
 const matched=current?.product||(entry?products.find(p=>entry.productIds.includes(p.id)):undefined);
 const imageFor=(r:Ranking,pricedProduct?:Product):Product=>{
  const photo=(pricedProduct?.image?pricedProduct:undefined)
   ||products.find(p=>r.productIds.includes(p.id)&&p.image)
   ||products.find(p=>(photoIds[r.id]||[]).includes(p.id)&&p.image);
  return {id:r.id,name:r.name,image:photo?.image||r.image||''} as Product;
 };
 const imageProduct=entry?imageFor(entry,current?.product):undefined;
 const inspect=(r:Ranking,button:HTMLButtonElement)=>{selectedButton.current=button;setSelected(r.id);};
 const closeInspector=()=>{setSelected('');selectedButton.current?.focus({preventScroll:true});};
 const chooseFamily=(id:RankedCategory)=>{setCategory(id);setCohort('all');setFormat('all');setQ('');setSelected('');};
 const details=entry&&imageProduct?<>

   {!mobile&&<button className="icon-button tier-inspector-close" aria-label="Close product details" onClick={closeInspector}><X size={18} aria-hidden="true"/></button>}
   <div className="tier-inspector-heading"><span className={'tier-badge tier-'+String(rank(entry)).toLowerCase()}>{rank(entry)==='Unpriced'?'?':rank(entry)}</span><div><div className="eyebrow">{mode==='editorial'?'EDITORIAL PICK':'PRICE VALUE PICK'}</div><small>{entry.cohort}{entry.formats&&' · '+entry.formats.map(f=>batteryFormats.find(b=>b.id===f)?.label).join(' / ')}</small></div></div>
   <ProductImage key={'photo-'+entry.id} product={imageProduct} className="tier-product-photo"/>
   <h2>{entry.name}</h2><p className="tier-verdict">{entry.headline}</p><div className="spec-pills">{entry.specs.map(s=><span key={s}>{s}</span>)}</div>
   <div className="tier-current-price"><small>{current?'Best eligible unit price':'Base configuration pricing'}</small><strong>{current?money(current.unitPrice):now===undefined?'Checking…':'No current verified offer'}</strong>{current?<><span>{current.offer.retailer} · {current.metric.toFixed(entry.category==='panels'||entry.category==='inverters'?2:0)} {valueBands[entry.category].unit}</span><small>Checked {current.offer.observedAt.slice(0,16).replace('T',' ')} UTC</small>{current.offer.packQuantity>1&&<small>Purchase minimum: {money(current.purchasePrice)} for {current.offer.packQuantity} panels</small>}</>:<span>{entry.priceBasis==='grid-ac'?'Grid-only output has no battery-only price metric. Use editorial tiers to compare this model.':'Bundles and unmatched revisions stay out of the price ranking.'}</span>}</div>
   <div className="tier-actions">{matched?<><WatchButton product={matched} compact={false}/><BuildQuantity product={matched} offerId={current?.offer.id}/><Link href={'/products/'+(current?.product.id||matched.id)} className="button outline small">Prices & history <ArrowUpRight size={13}/></Link><button className="text-link small-text" disabled={!compare.includes(matched.id)&&compare.length>=4} onClick={()=>setCompare(c=>c.includes(matched.id)?c.filter(id=>id!==matched.id):c.length<4?[...c,matched.id]:c)}>{compare.includes(matched.id)?'✓ In comparison':'Add to comparison'}</button></>:<Link className="button outline small" href={'/parts?q='+encodeURIComponent(queries[entry.id]||entry.name)}>Find catalog variants <ArrowUpRight size={13}/></Link>}</div>
   <div className="tier-reasons"><h3>Why it earns its place</h3>{entry.strengths.map(s=><p key={s}><Check size={14}/><span>{s}</span></p>)}<h3>Know the trade-offs</h3>{entry.limits.map(s=><p key={s}><span className="tier-limit-dot">!</span><span>{s}</span></p>)}</div>
   <details className="tier-evidence" open key={'evidence-'+entry.id}><summary>Sources & review evidence <span>{entry.sources.length} sources</span></summary>{entry.sources.map((s,i)=><div key={s.url+'-'+i}><span className="tier-source-kind">{s.kind}</span><a href={s.url} target="_blank" rel="noreferrer">{i+1}. {s.label}<ArrowUpRight size={12}/></a><p>{s.note}</p></div>)}<small>Sources reviewed {entry.reviewedAt}. Reviewer affiliate links or sample units may influence coverage. Owner reports are anecdotal.</small></details>

</>:null;
 return <main className="tier-page page-container">
  <div className="tier-hero"><div><div className="eyebrow"><Trophy size={15}/> THE SOLAR TIER LAB</div><h1>Find your power picks.</h1><p>Research-backed tiers. Real price value. Every pick has a reason.</p></div><div className="tier-season"><Sparkles size={19}/><span>RESEARCH EDITION <strong>{researchDate}</strong></span></div></div>
  <nav className="tier-family-nav section-pill-nav" aria-label="Tier list categories">{tierFamilies.map(f=>{const Icon=icons[f.id];return <button key={f.id} aria-pressed={category===f.id} onClick={()=>chooseFamily(f.id)}><span className="section-pill-icon"><Icon size={23} aria-hidden="true"/></span>{f.label}<small>{rankings.filter(r=>r.category===f.id).length}</small></button>;})}</nav>
  <div className="tier-control-bar"><div className="tier-view-switch" role="group" aria-label="Ranking method"><button aria-pressed={mode==='editorial'} onClick={()=>setMode('editorial')}><Trophy size={14}/>Editorial tiers</button><button aria-pressed={mode==='value'} onClick={()=>setMode('value')}><Zap size={14}/>Price value</button></div><div className="tier-view-switch tier-display-switch" role="group" aria-label="Tier display"><button aria-pressed={display==='images'} onClick={()=>setDisplay('images')}><ImageIcon size={14}/>Images</button><button aria-pressed={display==='names'} onClick={()=>setDisplay('names')}><Type size={14}/>Names</button></div><label className="tier-search"><Search size={16}/><span className="sr-only">Search ranked models</span><input value={q} placeholder="Find a ranked model…" onChange={e=>setQ(e.target.value)}/></label><label className="tier-cohort"><span className="sr-only">Filter by use case</span><select value={cohort} onChange={e=>setCohort(e.target.value)}><option value="all">All use cases</option>{[...new Set(familyEntries.map(r=>r.cohort))].map(c=><option key={c}>{c}</option>)}</select></label>{category==='batteries'&&<label className="tier-cohort tier-format"><span className="sr-only">Filter by battery format</span><select aria-label="Filter by battery format" value={format} onChange={e=>setFormat(e.target.value as BatteryFormat|'all')}><option value="all">All battery formats</option>{batteryFormats.filter(f=>familyEntries.some(r=>r.formats?.includes(f.id))).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}</div>
  <div className="tier-price-coverage"><label className="check-field"><input type="checkbox" checked={pricedOnly} onChange={e=>setPricedOnly(e.target.checked)}/>Fresh prices only</label><span>{now===undefined?'Checking price coverage…':`${familyEntries.filter(r=>prices.get(r.id)).length} of ${familyEntries.length} models have an eligible fresh price.`} Missing prices do not change editorial ratings.</span></div>
  <div className="tier-context"><strong>{family.label} <small>{visible.length} / {familyEntries.length} models</small></strong><span>{mode==='editorial'?family.description:'Equipment cost only, using fresh in-stock new base configurations. Price tiers do not measure quality or reliability.'}</span><Link href={'/parts?category='+category}>Browse every option <ArrowUpRight size={13}/></Link></div>
  <div className={'tier-layout'+(entry&&!mobile?' has-selection':'')}><TooltipProvider delayDuration={150}><section className={'tier-board tier-board-'+display} aria-label={family.label+' '+(mode==='editorial'?'editorial tiers':'price value tiers')}>
   {[...tiers,...(mode==='value'?['Unpriced']:[])].map(t=>{
    const items=visible.filter(r=>rank(r)===t);
    return <div className={'tier-lane tier-'+t.toLowerCase()} key={t}>
     <div className="tier-letter"><strong>{t==='Unpriced'?'?':t}</strong><small>{t==='Unpriced'?'No eligible price':mode==='editorial'?labels[t as Tier]:t==='S'?'Lowest cost':t==='A'?'Good value':t==='B'?'Higher cost':'Premium cost'}</small></div>
     <div className="tier-lane-items">{items.length?items.map(r=>{
      const p=price(r),image=imageFor(r,p?.product);
      return <Tooltip key={r.id}><TooltipTrigger asChild>
       <button className={'tier-model '+(r.id===entry?.id?'selected':'')} aria-label={r.name} aria-pressed={r.id===entry?.id} aria-expanded={r.id===entry?.id} aria-controls="tier-product-evidence" onClick={event=>inspect(r,event.currentTarget)}>
        {display==='images'?<span className="tier-model-art">{image.image?<ProductImage key={image.image} product={image} className="tier-model-photo"/>:<span className="tier-photo-missing"><ImageIcon size={20}/><strong>{r.name}</strong><small>Photo pending</small></span>}</span>:<span className="tier-model-icon">{r.category==='panels'?<Sun size={18}/>:r.category==='inverters'?<Zap size={18}/>:<Battery size={18}/>}</span>}
        {display==='images'&&image.image&&<span className="tier-mobile-name" aria-hidden="true">{r.name}</span>}
        {display==='names'&&<span className="tier-model-name"><strong>{r.name}</strong><small>{r.cohort} · {r.specs[0]}</small></span>}
        <span className="tier-model-price"><strong>{p?money(p.unitPrice):now===undefined?'Checking…':'No fresh price'}</strong>{display==='names'&&<small>{p?`${p.metric.toFixed(r.category==='panels'||r.category==='inverters'?2:0)} ${valueBands[r.category].unit}`:'Open evidence'}</small>}</span>
       </button>
      </TooltipTrigger>{display==='images'&&<TooltipContent className="tier-name-tooltip" side="top" sideOffset={8}><strong>{r.name}</strong><span>{r.cohort}</span></TooltipContent>}</Tooltip>;
     }):<p className="tier-lane-empty">{q||cohort!=='all'||format!=='all'?'No matches in this tier.':'No researched picks in this tier.'}</p>}</div>
    </div>;
   })}
   <div className="tier-board-foot"><BookOpen size={16}/><p>{mode==='editorial'?'A tier is our editorial judgment for the stated use case. Documentation-only assessments are provisional.':'No coupons, bundles, used equipment, stale prices or unverified model matches. Pallet unit costs still require buying the entire pallet.'}</p></div>
  </section></TooltipProvider>
  {mobile?<Dialog open={!!entry} onOpenChange={open=>{if(!open)closeInspector();}}><DialogContent className="tier-mobile-dialog" onCloseAutoFocus={e=>{e.preventDefault();selectedButton.current?.focus({preventScroll:true});}}><DialogTitle className="sr-only">{entry?.name||'Product evidence'}</DialogTitle><DialogDescription className="sr-only">Pricing, specifications and ranking evidence.</DialogDescription><div id="tier-product-evidence" className="tier-inspector">{details}</div></DialogContent></Dialog>:<div className="tier-inspector-slot" aria-hidden={!entry} inert={!entry}><aside id="tier-product-evidence" className="tier-inspector" ref={inspector} tabIndex={-1} aria-label="Selected product evidence">{details}</aside></div>}</div>
  <details className="tier-method"><summary><BookOpen size={17}/>How the tiers work</summary><div className="tier-method-content"><section><h3>Editorial tiers</h3><p>We weigh documented capability, charging/output performance, practical use, warranty/support evidence and reported limitations. S means a standout for its stated use; A is a strong choice; B has meaningful trade-offs; C suits a narrower or compromise-heavy use. These are judgments, not laboratory scores or community star ratings.</p><p>Manufacturer data establishes specifications. Hands-on reviews inform performance. Owner reports add context, but do not establish failure rates. A documentation-only pick is provisional. Warranty claims are conditional; cycle ratings are not guaranteed lifetime.</p></section><section><h3>Price-value tiers</h3><p>Price tiers recalculate from eligible catalog offers when you open the page and every minute thereafter. Only confirmed in-stock USD offers for new, reviewed base configurations checked within 24 hours qualify. Equipment price excludes shipping, tax, required accessories and installation.</p><div className="table-scroll"><table className="data-table"><thead><tr><th>Family / metric</th><th>S up to</th><th>A up to</th><th>B up to</th><th>C</th></tr></thead><tbody>{tierFamilies.map(f=><tr key={f.id}><td>{f.label}<small>{valueBands[f.id].unit}</small></td>{valueBands[f.id].limits.map(n=><td key={n}>{money(n)}</td>)}<td>Above B</td></tr>)}</tbody></table></div><p>The bands are published editorial thresholds, not market percentiles. Panels use front-side STC watts. Inverters use battery-only continuous AC watts, excluding grid pass-through. Grid-only string and microinverters stay unpriced in this metric; compare them in editorial tiers. Capacity uses rated storage, not measured delivered energy. Compare within a suitable use case.</p></section><section><h3>Coverage & updates</h3><p>This edition covers {rankings.length} selected models and revisions. Unresearched products remain in the catalog without a tier. Prices refresh through the existing collector; research and editorial tiers require manual review. Latest research review {researchDate}. No model gets a rating from its brand name alone.</p></section></div></details>
 </main>;
}
