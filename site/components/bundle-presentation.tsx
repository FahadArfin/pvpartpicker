'use client';
import {Battery,Sun,Zap,Wrench,Package,SlidersHorizontal,Plug,ArrowUpRight} from 'lucide-react';
import {usePV} from './pv-provider';
import {bestOffer,money} from '../lib/domain';
import {bundleComponentLabels} from '../lib/bundles';
import type {BundleComponentType,Product} from '../lib/types';

const icons:Record<BundleComponentType,typeof Battery>={'power-station':Battery,panels:Sun,batteries:Battery,inverter:Zap,mounting:Wrench,controls:SlidersHorizontal,charging:Plug,accessories:Package};

export function BundleTags({product}:{product:Product}){
 const config=product.configuration;if(!config)return null;
 return <span className="bundle-tags" aria-label={config.kind==='combo'?'Bundle equipment types':'Selected equipment type'}>
  {config.kind==='combo'&&<span className="bundle-tag bundle-tag-kind"><Package size={11}/>Combo</span>}
  {config.components.map(c=>{const Icon=icons[c.type];return <span className="bundle-tag" key={c.type}><Icon size={11}/>{bundleComponentLabels[c.type]}</span>;})}
 </span>;
}

export function ConfigurationPicker({product,builderMode=false}:{product:Product;builderMode?:boolean}){
 const {products}=usePV(),config=product.configuration;if(!config)return null;
 const choices=[product,...products.filter(p=>p.id!==product.id&&p.configuration?.family===config.family)].sort((a,b)=>Number(a.configuration?.kind==='combo')-Number(b.configuration?.kind==='combo')||a.configuration!.selection.localeCompare(b.configuration!.selection));
 return <section className="configuration-picker" aria-label="Selected configuration">
  <div className="configuration-heading"><Package size={15}/><strong>{config.kind==='combo'?'Bundle configuration':'Selected configuration'}</strong><span>{config.kind==='combo'?config.type:'Standalone unit'}</span></div>
  {choices.length>1?<label><span className="sr-only">Choose product configuration</span><select value={product.id} onChange={e=>window.location.assign('/products/'+encodeURIComponent(e.target.value)+(builderMode?'?builder=1':''))}>{choices.map(p=>{const offer=bestOffer(p)||p.offers[0];return <option key={p.id} value={p.id}>{p.configuration!.selection}{offer?' — '+money(offer.price):''}</option>;})}</select></label>:<p className="configuration-selection">{config.selection}</p>}
  <p>{config.kind==='combo'?'The price covers this entire selected bundle. Quantity 1 adds one bundle to your build.':config.type==='Inverter'?'Inverter only. Battery modules and solar panels are not included in this selected variant.':'Standalone power station. Solar panels and expansion batteries are not included in this selected variant.'} Retailer photos may show other configurations.</p>
  <details><summary>Original retailer title</summary><p>{product.name}</p></details>
 </section>;
}

export function BundleContents({product}:{product:Product}){
 const config=product.configuration;if(config?.kind!=='combo')return null;
 return <section className="section-card bundle-contents" aria-label="Bundle contents">
  <div className="section-heading"><div><div className="eyebrow"><Package size={13}/>THE SELECTED COMBO</div><h2>Included in this bundle</h2></div><span className="bundle-sale-unit">1 bundle · 1 purchase</span></div>
  {config.components.length?<ul className="bundle-component-grid">{config.components.map(c=>{const Icon=icons[c.type];return <li key={c.type}><span className="bundle-component-icon"><Icon size={21}/></span><div><strong>{bundleComponentLabels[c.type]}</strong><p>{c.detail}</p><small>{c.quantity?`${c.quantity} ${c.quantity===1?'unit':'units'} included`:'Quantity not listed'}</small></div></li>;})}</ul>:<p className="inline-note">The retailer labels this as a kit. Its component list has not been published in the collected variant details.</p>}
  <div className="bundle-contents-source"><p>Contents above come from the selected retailer listing. Confirm exact models, cables and installation hardware before purchase. Included parts stay inside this bundle in your build.</p><a className="text-link small-text" href={product.sourceUrl} target="_blank" rel="noreferrer">Check retailer contents <ArrowUpRight size={12}/></a></div>
 </section>;
}
