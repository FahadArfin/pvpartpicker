'use client';
import {Battery,Sun,Zap,Wrench,Package,SlidersHorizontal,Plug,ArrowUpRight} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {navigatePage} from '../lib/page-navigation';
import {usePV} from './pv-provider';
import {bestOffer,money} from '../lib/domain';
import {bundleComponentLabels} from '../lib/bundles';
import Link from './site-link';
import {bundleCoreProduct} from '../lib/ux-product';
import {partColumns,partValue,productListName} from '../lib/part-comparison';
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
 const router=useRouter();
 const {products}=usePV(),config=product.configuration;if(!config)return null;
 const choices=[product,...products.filter(p=>p.id!==product.id&&p.configuration?.family===config.family)].sort((a,b)=>Number(a.configuration?.kind==='combo')-Number(b.configuration?.kind==='combo')||a.configuration!.selection.localeCompare(b.configuration!.selection));
 return <section className="configuration-picker" aria-label="Selected configuration">
  <div className="configuration-heading"><Package size={15}/><strong>{config.kind==='combo'?'Bundle configuration':'Selected configuration'}</strong><span>{config.kind==='combo'?config.type:'Standalone unit'}</span></div>
  {choices.length>1?<label><span className="sr-only">Choose product configuration</span><select value={product.id} onChange={e=>{const href='/products/'+encodeURIComponent(e.target.value)+(builderMode?'?builder=1':'');navigatePage(href,()=>router.push(href));}}>{choices.map(p=>{const offer=bestOffer(p)||p.offers[0];return <option key={p.id} value={p.id}>{p.configuration!.selection}{offer?' — '+money(offer.price):''}</option>;})}</select></label>:<p className="configuration-selection">{config.selection}</p>}
  <p>{config.kind==='combo'?'The price covers this entire selected bundle. Quantity 1 adds one bundle to your build.':config.type==='Inverter'?'Inverter only. Battery modules and solar panels are not included in this selected variant.':'Standalone power station. Solar panels and expansion batteries are not included in this selected variant.'} Retailer photos may show other configurations.</p>
  <details><summary>Original retailer title</summary><p>{product.name}</p></details>
 </section>;
}

export function BundleContents({product,products=[]}:{product:Product;products?:Product[]}){
 const config=product.configuration;if(config?.kind!=='combo')return null;
 const core=bundleCoreProduct(product,products);
 return <section className="section-card bundle-contents" aria-label="Bundle contents">
  <div className="section-heading"><div><div className="eyebrow"><Package size={13}/>THE SELECTED COMBO</div><h2>Included in this bundle</h2></div><span className="bundle-sale-unit">1 bundle · 1 purchase</span></div>
  {config.components.length?<div className="table-scroll"><table className="data-table bundle-components-table"><caption className="sr-only">Selected bundle components and verified model references</caption><thead><tr><th>Equipment</th><th>Included</th><th>Model / specifications</th></tr></thead><tbody>{config.components.map(c=>{const linked=core&&((c.type==='power-station'&&core.category==='all-in-one')||(c.type==='inverter'&&core.category==='inverters')||(c.type==='batteries'&&core.category==='batteries'))?core:undefined;return <tr key={c.type}><th scope="row">{bundleComponentLabels[c.type]}</th><td>{c.quantity??'Not listed'}</td><td><span>{c.detail}</span>{linked?<><Link href={'/products/'+linked.id}>{productListName(linked)} specifications ↗</Link><small>{partColumns[linked.category].slice(0,3).map(col=>partValue(linked,col.key).value).filter(v=>v!=='—').join(' · ')}</small><small>Per core unit; other bundle components are separate.</small></>:<small>Exact component ratings: check retailer contents and datasheets.</small>}</td></tr>;})}</tbody></table></div>:<p className="inline-note">The retailer labels this as a kit. Its component list has not been published in the collected variant details.</p>}
  <div className="bundle-contents-source"><p>Contents above come from the selected retailer listing. Confirm exact models, cables and installation hardware before purchase. Included parts stay inside this bundle in your build.</p><a className="text-link small-text" href={product.sourceUrl} target="_blank" rel="noreferrer">Check retailer contents <ArrowUpRight size={12}/></a></div>
 </section>;
}
