'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {navigatePage} from '../lib/page-navigation';
import {modelPurchaseOptions,type PurchaseKind} from '../lib/model-identity';
import {bestOffer,money} from '../lib/domain';
import type {Product} from '../lib/types';

const labels:Record<PurchaseKind,string>={unit:'Unit only',pack:'Multipacks',bundle:'Bundles'};
export function ModelPurchaseOptions({product,products,builderMode=false}:{product:Product;products:Product[];builderMode?:boolean}){
 const router=useRouter(),identity=product.modelIdentity!;
 const choices=modelPurchaseOptions(product,products),[kind,setKind]=useState(identity.kind);
 const visible=choices.filter(p=>p.modelIdentity!.kind===kind),selected=visible.find(p=>p.id===product.id);
 return <section className="model-purchase-options" aria-label="Model purchase options">
  <div className="section-heading"><strong>Purchase options</strong><span className="muted small-text">{identity.listingCount} matched listings</span></div>
  <div className="model-purchase-tabs" role="group" aria-label="Package type">{(['unit','pack','bundle'] as PurchaseKind[]).map(k=>{const count=choices.filter(p=>p.modelIdentity!.kind===k).length;return <button key={k} className={'button small '+(kind===k?'dark':'outline')} disabled={!count} aria-pressed={kind===k} onClick={()=>setKind(k)}>{labels[k]} <span>{count}</span></button>;})}</div>
  <label className="field">Choose a purchase package<select aria-label="Choose purchase package" value={selected?.id||''} onChange={e=>{if(!e.target.value)return;const href='/products/'+encodeURIComponent(e.target.value)+(builderMode?'?builder=1':'');navigatePage(href,()=>router.push(href));}}>{!selected&&<option value="" disabled>Select a package…</option>}{visible.map(p=>{const offer=bestOffer(p)||p.offers[0];return <option value={p.id} key={p.id}>{p.modelIdentity!.packageLabel}{offer?' · '+money(offer.price)+(p.modelIdentity!.kind==='pack'?' total':''):''}</option>;})}</select></label>
  <p className="inline-note">Currently viewing: <strong>{identity.packageLabel}</strong>. Offers, price history, build selection and alerts apply to this package.</p>
  {identity.kind==='bundle'&&<p className="inline-note"><strong>Included equipment:</strong> {identity.packageLabel}. Component names/counts follow the retailer selection; confirm the full contents. Specifications below describe the listed core equipment and published bundle details.</p>}
  <p className="inline-note">{identity.note} Shipping and tax are excluded from comparisons.</p>
  <details><summary className="small-text">Original retailer title</summary><p className="inline-note">{product.name}</p></details>
 </section>;
}
