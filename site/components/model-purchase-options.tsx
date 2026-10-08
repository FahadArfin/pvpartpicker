'use client';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Eye,EyeOff,ArrowRight,TrendingDown} from 'lucide-react';
import Link from './site-link';
import {usePV,WatchButton} from './pv-provider';
import {navigatePage} from '../lib/page-navigation';
import {modelPackageDeals} from '../lib/model-package-deals';
import type {PurchaseKind} from '../lib/model-identity';
import {money} from '../lib/domain';
import type {Product} from '../lib/types';
const labels:Record<PurchaseKind,string>={unit:'Unit only',pack:'Multipacks',bundle:'Bundles'};
export function ModelPurchaseOptions({product,products,builderMode=false}:{product:Product;products:Product[];builderMode?:boolean}){
 const router=useRouter(),identity=product.modelIdentity!;
 const {watchIds,watchReady,watchBusy,watchMany,watchBatchBusy,watchError}=usePV();
 const report=useMemo(()=>modelPackageDeals(product,products),[product,products]);
 const [kind,setKind]=useState<PurchaseKind|'all'>('all'),[expanded,setExpanded]=useState(false);
 const choices=report.rows,visible=choices.filter(r=>kind==='all'||r.product.modelIdentity!.kind===kind),selected=visible.find(r=>r.product.id===product.id);
 const shown=expanded?visible:visible.slice(0,5);
 if(!expanded&&selected&&!shown.includes(selected))shown.push(selected);
 const modelIds=useMemo(()=>[...new Set([...products.filter(p=>p.modelIdentity?.modelId===identity.modelId).map(p=>p.id),product.id])],[products,product.id,identity.modelId]);
 const allWatched=modelIds.every(id=>watchIds.includes(id)),busy=watchBatchBusy||modelIds.some(id=>watchBusy.includes(id));
 const allListingsLoaded=modelIds.length>=(products.find(p=>p.id===product.id)?.modelIdentity?.listingCount||identity.listingCount);
 const href=(id:string)=>'/products/'+encodeURIComponent(id)+(builderMode?'?builder=1':'');
 const highlight=report.cheaperBundle||report.cheapest;
 return <section className="model-purchase-options" aria-label="Model purchase options">
  <div className="section-heading"><strong>Compare purchase options</strong><span className="muted small-text">{choices.length} packages · {identity.listingCount} listings</span></div>
  {highlight?<div className="model-deal-highlight" role="status"><TrendingDown size={18}/><div><strong>{report.cheaperBundle?`Bundle priced ${money(highlight.belowUnit!)} below the unit`:'Lowest current purchase'}</strong><span>{highlight.product.modelIdentity!.packageLabel} · <b>{money(highlight.purchasePrice!)}</b> · {highlight.offer!.condition} · {highlight.offer!.retailer}</span></div><Link className="text-link small-text" href={href(highlight.product.id)}>{highlight.product.id===product.id?'Viewing':'View deal'} <ArrowRight size={14}/></Link></div>:<p className="inline-note" role="status">No fresh, in-stock offers to compare. Previous checks remain in each package’s history.</p>}
  <div className="model-purchase-tabs" role="group" aria-label="Package type">{(['all','unit','pack','bundle'] as const).map(k=>{const count=k==='all'?choices.length:choices.filter(r=>r.product.modelIdentity!.kind===k).length;return <button key={k} className={'button small '+(kind===k?'dark':'outline')} disabled={!count} aria-pressed={kind===k} onClick={()=>{setKind(k);setExpanded(false);}}>{k==='all'?'All options':labels[k]} <span>{count}</span></button>;})}</div>
  <label className="field">Jump to a package<select aria-label="Choose purchase package" value={selected?.product.id||''} onChange={e=>{if(!e.target.value)return;const target=href(e.target.value);navigatePage(target,()=>router.push(target));}}>{!selected&&<option value="" disabled>Select a package…</option>}{visible.map(r=><option value={r.product.id} key={r.product.id}>{r.product.modelIdentity!.packageLabel} · {r.offer?money(r.purchasePrice!)+(r.offer.condition==='used'?' used':''):'No fresh offer'}</option>)}</select></label>
  <div className="model-option-list" role="list" aria-label="Packages sorted by total purchase price">{shown.map(r=><div role="listitem" className={'model-option-row'+(r.product.id===product.id?' selected':'')} key={r.product.id}>
   <div><Link className="text-link" href={href(r.product.id)} aria-current={r.product.id===product.id?'page':undefined}>{r.product.modelIdentity!.packageLabel}</Link><small>{labels[r.product.modelIdentity!.kind]}{r.product.id===product.id?' · Viewing':''}{r.belowUnit!==undefined?` · ${money(r.belowUnit)} below unit`:''}</small></div>
   <div className="model-option-price"><strong>{r.offer?money(r.purchasePrice!):'No fresh offer'}</strong><small>{r.offer?`${r.offer.retailer} · ${r.offer.condition}${r.offer.packQuantity>1?' · '+r.offer.packQuantity+' units':''}`:'Check price history'}{r.offer&&<><br/>Checked {r.offer.observedAt.slice(0,16).replace('T',' ')} UTC</>}</small></div><WatchButton product={r.product}/>
  </div>)}</div>
  {visible.length>5&&<button className="text-link small-text model-show-options" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Show fewer options':`Show all ${visible.length} options`}</button>}
  <p className="inline-note">Total purchase prices, lowest first. Shipping and tax excluded. Bundle contents and finishes vary; compare the retailer selection. “Below unit” compares the same condition against the lowest standalone-unit price.</p>
  <div className="model-watch-all"><button className="button outline small" aria-pressed={allWatched} disabled={!watchReady||!allListingsLoaded||busy||modelIds.length>500} onClick={()=>watchMany(modelIds,!allWatched)}>{allWatched?<EyeOff size={16}/>:<Eye size={16}/>} {!allListingsLoaded?'Loading model options…':busy?'Saving options…':allWatched?'Stop watching all options':'Watch all model options'}</button><Link className="text-link small-text" href="/watchlist">Open watch list <ArrowRight size={13}/></Link></div>
  <p className="inline-note">Watches all {modelIds.length} current retailer listings, including bundle aliases, for your watch list and price-drop filters. New configurations are not added automatically. Target-price notifications still use each package’s separate alert.</p>
  {watchError&&<p className="inline-note" role="alert">Watch list: {watchError}</p>}
  <p className="inline-note">Currently viewing: <strong>{identity.packageLabel}</strong>. Prices, history, build selection and alerts below apply to this package.</p>
  {identity.kind==='bundle'&&<p className="inline-note"><strong>Included equipment:</strong> {identity.packageLabel}. Component names/counts follow the retailer selection; confirm full contents. Specifications below describe the listed core equipment and published bundle details.</p>}
  <details><summary className="small-text">Matching details & original retailer title</summary><p className="inline-note">{identity.note}</p><p className="inline-note">{product.name}</p></details>
 </section>;
}
