'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {productListName,productListVariant} from '../lib/part-comparison';
import Link from './site-link';
import {CheckCircle2,AlertTriangle,HelpCircle,Plus,Minus,Trash2} from 'lucide-react';
import {usePV,ProductImage} from './pv-provider';
import {BuildLibraryToolbar} from './build-library-toolbar';
import {BuildPriceHistory} from './build-price-history';
import {BuildConnectionMap} from './build-connection-map';
import {useConnectionProducts} from './use-connection-products';
import {categories} from '../lib/types';
import type {Build,BuildSettings} from '../lib/types';
import {builderPickerHref} from '../lib/build-flow';
import {bestOffer,costForQuantity,money} from '../lib/domain';
import {buildCompatibility,buildProgress,normalizeBuildQuantity} from '../lib/build-ux';

const BuildAnalyticsReport=lazy(()=>import('./build-analytics-report'));

function QuantityControl({quantity,name,onChange}:{quantity:number;name:string;onChange:(quantity:number)=>void}){
 const [text,setText]=useState(String(quantity)),focused=useRef(false);
 useEffect(()=>{if(!focused.current)setText(String(quantity));},[quantity]);
 const commit=(value:number)=>{setText(String(value));onChange(value);};
 return <div className="quantity-control"><button aria-label={'Decrease quantity of '+name} disabled={normalizeBuildQuantity(text,quantity)<=1} onClick={()=>commit(Math.max(1,normalizeBuildQuantity(text,quantity)-1))}><Minus size={12}/></button><input aria-label={'Quantity for '+name} title="Whole units; quantity is applied when you leave this field" type="number" min="1" max="10000" step="1" value={text} onFocus={()=>{focused.current=true;}} onChange={e=>setText(e.target.value)} onBlur={()=>{focused.current=false;commit(normalizeBuildQuantity(text,quantity));}}/><button aria-label={'Increase quantity of '+name} disabled={normalizeBuildQuantity(text,quantity)>=10000} onClick={()=>commit(Math.min(10000,normalizeBuildQuantity(text,quantity)+1))}><Plus size={12}/></button></div>;
}

export function BuildWorkspace(){
 const {products:catalog,build,setBuild,saving,notify}=usePV();
 const connections=useConnectionProducts(build,catalog),products=connections.products;
 const [tab,setTab]=useState<'equipment'|'analytics'>('equipment');
 const [cleared,setCleared]=useState<{previous:Build;empty:Build}|null>(null);

 const checks=buildCompatibility({...build,settings:{...build.settings,pvArrays:build.settings.pvArrays||[]}},products),progress=buildProgress(build,products);
 const rows=build.lines.map(l=>{
  const p=products.find(p=>p.id===l.productId);
  const o=p?(l.offerId?bestOffer({...p,offers:p.offers.filter(o=>o.id===l.offerId)},l.quantity):bestOffer(p,l.quantity)):undefined;
  const cost=o?costForQuantity(o,l.quantity):undefined;
  return {l,p,o,cost};
 });
 const total=rows.reduce((sum,row)=>sum+(row.cost?.subtotal??0),0);
 const unpriced=rows.filter(row=>!row.cost).length;
 const watts=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='panels')?.specs.watts||0)*l.quantity,0);
 const kwh=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='batteries'&&p.specs.batteryKind!=='Battery cabinets')?.specs.capacityKwh||0)*l.quantity,0);
 const stationKwh=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='all-in-one')?.specs.capacityKwh||0)*l.quantity,0);
 function setting<K extends 'purpose'|'mount'>(key:K,value:BuildSettings[K]){setBuild(b=>({...b,settings:{...b.settings,[key]:value}}));}
 function qty(id:string,n:number){setBuild(b=>({...b,lines:b.lines.map(l=>l.productId===id?{...l,quantity:n}:l)}));}
 function selectedRow({l,p,cost}:typeof rows[number]){return <tr className="builder-selected-row" key={l.productId}>
  <th scope="row" className="builder-selection"><Link className="row-link" href={'/products/'+l.productId}>{p&&<ProductImage product={p}/>}<span title={p?.name}>{p?productListName(p):'Unavailable product'}{p&&<small className="builder-part-variant">{productListVariant(p)}</small>}</span></Link></th>
  <td className="builder-quantity"><QuantityControl quantity={l.quantity} name={p?.name||'unavailable product'} onChange={n=>qty(l.productId,n)}/>{cost&&cost.extraUnits>0&&<small>{cost.packs} packs · {cost.extraUnits} extra units</small>}</td>
  <td className="builder-retailer"><select aria-label={'Retailer for '+(p?.name||'unavailable product')} value={l.offerId||''} onChange={e=>setBuild(b=>({...b,lines:b.lines.map(line=>line.productId===l.productId?{...line,offerId:e.target.value||undefined}:line)}))}><option value="">Lowest current purchase cost</option>{p?.offers.map(o=><option key={o.id} value={o.id}>{o.retailer} · {money(o.price)} / {o.packQuantity}</option>)}</select></td>
  <td className="builder-cost">{cost?<strong>{money(cost.subtotal)}</strong>:<small>Needs a current offer</small>}</td>
  <td className="builder-remove"><button className="icon-button" aria-label={'Remove '+(p?.name||'unavailable product')} onClick={()=>setBuild(b=>({...b,lines:b.lines.filter(line=>line.productId!==l.productId)}))}><Trash2 size={15}/></button></td>
 </tr>;}
 return <main className="page-container builder-page">
  <header className="builder-heading"><div><div className="eyebrow">SYSTEM BUILDER</div><h1>{tab==='analytics'?'Your build report.':'Choose your parts.'}</h1><p className={tab==='analytics'?'analytics-build-name':undefined}>{tab==='analytics'?build.name:'A place for every part of your solar system.'}</p></div><BuildLibraryToolbar/></header>
  <div className="builder-report-tabs" role="tablist" aria-label="Build workspace" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'equipment':e.key==='End'?'analytics':tab==='equipment'?'analytics':'equipment';setTab(next);document.getElementById('build-tab-'+next)?.focus();}}}>
   <button id="build-tab-equipment" role="tab" aria-selected={tab==='equipment'} tabIndex={tab==='equipment'?0:-1} aria-controls="build-equipment-panel" onClick={()=>setTab('equipment')}>Equipment</button>
   <button id="build-tab-analytics" role="tab" aria-selected={tab==='analytics'} tabIndex={tab==='analytics'?0:-1} aria-controls="build-analytics-panel" onClick={()=>setTab('analytics')}>Analytics report</button>
  </div>
  {tab==='analytics'?<div id="build-analytics-panel" role="tabpanel" aria-labelledby="build-tab-analytics"><Suspense fallback={<p className="inline-note" role="status">Loading your analytics report…</p>}><BuildAnalyticsReport key={build.id||'draft'} products={products}/></Suspense></div>:<div id="build-equipment-panel" role="tabpanel" aria-labelledby="build-tab-equipment">
  <section className="builder-direction" aria-labelledby="direction-heading"><div className="builder-direction-heading"><h2 id="direction-heading">1. Set your direction</h2><Link className="text-link small-text" href="/guide">Need a hand?</Link></div><div className="builder-direction-controls">
   <label className="field builder-name">Build name<input maxLength={100} value={build.name} onChange={e=>setBuild(b=>({...b,name:e.target.value}))}/></label>
   <div className="builder-preference"><span>System purpose</span><div className="builder-toggles" role="group" aria-label="System purpose">{([['offgrid','Off-grid'],['hybrid','Hybrid / backup'],['gridtie','Grid-tied']] as const).map(([value,label])=><button key={value} aria-pressed={build.settings.purpose===value} onClick={()=>setting('purpose',value)}>{label}</button>)}</div></div>
   <div className="builder-preference"><span>Panel mounting</span><div className="builder-toggles" role="group" aria-label="Panel mounting">{([['roof','Roof'],['ground','Ground']] as const).map(([value,label])=><button key={value} aria-pressed={build.settings.mount===value} onClick={()=>setting('mount',value)}>{label}</button>)}</div></div>
  </div><p className="builder-filter-note">These choices narrow inverter and mount options when you choose a part. You can show all options in the picker.</p></section>
  <section className="builder-progress" aria-label="Equipment planning progress"><div className="builder-progress-bar"><details><summary><strong>Your equipment plan</strong> · {progress.selectedCount} of {progress.stages.length} categories selected</summary><ul className="builder-progress-stages">{progress.stages.map(stage=><li key={stage.category} className="builder-progress-stage" data-state={stage.state}><span>{stage.label}</span><small>{stage.state==='selected'?`${stage.count} ${stage.count===1?'product':'products'} selected`:stage.state==='optional'?'Optional for this plan':'Not selected'}</small></li>)}</ul><p>{progress.next.detail}</p><p className="builder-progress-note">{progress.note}</p></details><Link className="builder-next-action" href={progress.next.category?builderPickerHref(progress.next.category):'#compatibility'}>Next: {progress.next.label} →</Link></div></section>
  <section className="builder-equipment" aria-labelledby="equipment-heading"><div className="builder-equipment-heading"><h2 id="equipment-heading">2. Pick your equipment</h2><span>{build.lines.length} selected {build.lines.length===1?'part':'parts'}</span></div>
   <a className={'builder-check-strip '+(checks.some(c=>c.status==='mismatch')?'has-mismatch':'')} href="#compatibility"><AlertTriangle size={16}/><span>{checks.some(c=>c.status==='mismatch')?'Compatibility mismatches need attention':'System needs verification'} <small>Review checks below</small></span></a>
   <table className="builder-parts-table"><thead><tr><th scope="col">Component</th><th scope="col">Selection</th><th scope="col">Quantity</th><th scope="col">Retailer</th><th scope="col">Cost</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>{categories.map(c=>{const items=rows.filter(row=>row.p?.category===c.id);return <tbody key={c.id} aria-label={c.label}><tr className={'builder-category-row'+(items.length?' has-selections':'')}><th scope="rowgroup" rowSpan={items.length+1} className="builder-component"><h3><Link href={builderPickerHref(c.id)}>{c.label}</Link></h3>{items.length>0&&<small>{items.length} {items.length===1?'product':'products'}</small>}</th><td colSpan={5} className="builder-choose-cell"><Link className="button dark small builder-choose-button" href={builderPickerHref(c.id)}><Plus size={13} aria-hidden="true"/>{items.length?'Add another '+c.label.toLowerCase():'Choose '+c.label.toLowerCase()}</Link></td></tr>{items.map(row=>selectedRow(row))}</tbody>;})}{rows.some(row=>!row.p)&&<tbody aria-label="Unavailable products"><tr className="builder-category-row has-selections"><th scope="rowgroup" rowSpan={rows.filter(row=>!row.p).length+1} className="builder-component"><h3>Unavailable products</h3></th><td colSpan={5} className="builder-choose-cell"><small>Review or remove these selections below.</small></td></tr>{rows.filter(row=>!row.p).map(row=>selectedRow(row))}</tbody>}</table>
   <div className="builder-totals"><div className="builder-metrics"><span><strong>{watts?(watts/1000).toFixed(1):'—'}</strong> kW PV</span><span><strong>{kwh?kwh.toFixed(1):'—'}</strong> kWh DC storage</span>{stationKwh>0&&<span><strong>{stationKwh.toFixed(2)}</strong> kWh integrated stations</span>}</div><div className="builder-subtotal"><span>Equipment subtotal</span><strong>{money(total)}</strong></div></div>
   <p className="builder-price-note">{unpriced?`${unpriced} items need current prices. `:''}Package quantities included. Shipping and tax excluded. Totals cover selected equipment, not a complete installation.</p>
  </section>
  <BuildPriceHistory lines={build.lines}/>
  <BuildConnectionMap {...connections}/>
  <section className="section-card builder-compatibility" id="compatibility-notes"><h2>Compatibility notes</h2><p className="inline-note">Connection calculations are shown above. These additional checks cover operating modes, control systems and installation requirements. A passed numerical check does not establish a complete, approved installation.</p>{checks.filter(c=>!build.settings.pvArrays?.length||["System purpose","Battery communication & certification","Module electronics & shutdown","Monitoring & load control","Bundled equipment","Integrated power station","DC-only output","Mounting fit & structure","Wiring & protection","Choose an inverter"].includes(c.title)).map((c,i)=>{const Icon=c.status==='match'?CheckCircle2:c.status==='mismatch'?AlertTriangle:HelpCircle;return <div className={'compatibility-item status-'+c.status} key={i}><Icon size={19}/><div><strong>{c.title} · {c.status==='unknown'?'Needs verification':c.status==='match'?'Documented check passed':'Mismatch'}</strong><p>{c.detail}</p>{c.source&&<a className="text-link small-text" href={c.source} target="_blank" rel="noreferrer">Source documentation</a>}</div></div>;})}</section>
  <div className="builder-footer"><span>Save named versions in My builds. Sign in to keep account builds across devices.</span><div className="flex-actions">{cleared&&build===cleared.empty&&<button className="button outline small" disabled={saving} onClick={()=>{setBuild(cleared.previous);setCleared(null);notify('Cleared draft restored.');}}>Undo clear</button>}<button className="reset-filters" disabled={saving||!build.lines.length} onClick={()=>{const empty={...build,id:undefined,shareId:undefined,lines:[],settings:{...build.settings,pvArrays:[],series:undefined,parallel:undefined}};setCleared({previous:build,empty});setBuild(empty);notify('Draft cleared. Use Undo clear to restore it. Saved builds are unchanged.');}}>Clear draft</button></div></div>
 </div>}
 </main>;
}
