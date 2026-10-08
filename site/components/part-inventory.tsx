'use client';
import {useEffect,useRef,useState} from 'react';
import {Sun,Battery,Zap,Cable,Wrench,Box,Plug,ShieldCheck,Gauge,PackageOpen,Check,ArrowUpRight,ArrowRight,X,Package} from 'lucide-react';
import Link from './site-link';
import {useRouter} from 'next/navigation';
import {navigatePage} from '../lib/page-navigation';
import {usePV,ProductImage,WatchButton} from './pv-provider';
import {BuildQuantity} from './build-quantity';
import {categories} from '../lib/types';
import type {Product} from '../lib/types';
import {bestOffer,costForQuantity,money} from '../lib/domain';
import {partColumns,partValue,productListName,productListVariant,type PartColumn} from '../lib/part-comparison';
import {DealMarker} from './deal-marker';
import {BundleTags} from './bundle-presentation';
import {manufacturerDisplay} from '../lib/manufacturer-display';
import {ProductPriceHistory} from './product-price-history';
const icons={panels:Sun,mounting:Wrench,wiring:Cable,batteries:Battery,inverters:Zap,electrical:Box,accessories:Plug,charging:Zap,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,'all-in-one':Battery};
function specs(product:Product){return partColumns[product.category].map(c=>({label:c.label,...partValue(product,c.key)})).filter(v=>v.value!=='—').slice(0,4);}
const bundled=(p:Product)=>p.modelIdentity?.kind==='bundle'||p.category==='kits';
function pricing(product:Product){const current=bestOffer(product);const last=[...product.offers].sort((a,b)=>a.price/a.packQuantity-b.price/b.packQuantity)[0];return {current,offer:current||last};}
export function PartRow({product,active,onInspect,onOpen,columns,builderMode=false,selectedOfferId}:{columns:PartColumn[];product:Product;active:boolean;onInspect:()=>void;onOpen:()=>void;builderMode?:boolean;selectedOfferId?:string}){
 const {build,compare,setCompare,notify}=usePV();const router=useRouter();const {current,offer}=pricing(product);const Icon=icons[product.category];const quantity=build.lines.find(l=>l.productId===product.id)?.quantity||0;const selected=compare.includes(product.id);
 return <article role="row" className={'part-row '+(active?'inspected ':'')+(quantity?'equipped':'')} onMouseEnter={onInspect} onFocus={onInspect} onDoubleClick={e=>{
  // A second click on the part opens its details; action controls stay separate.
  if((e.target as HTMLElement).closest('a,input,select,textarea,label,button:not(.part-inspect)'))return;
  const href='/products/'+encodeURIComponent(product.id)+(builderMode?'?builder=1':'');navigatePage(href,()=>router.push(href));
 }}>
  <div className="part-identity" role="cell"><span className="part-category-icon"><ProductImage product={product}/><DealMarker product={product}/></span>
  <button className="part-inspect" aria-label={'Inspect '+productListName(product)} aria-pressed={active} title={product.name+' · Click to preview. Double-click for details.'} onClick={onOpen} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){const rows=Array.from(e.currentTarget.closest('.part-list')!.querySelectorAll<HTMLButtonElement>('.part-inspect'));const index=rows.indexOf(e.currentTarget);const next=rows[index+(e.key==='ArrowDown'?1:-1)];if(next){e.preventDefault();next.focus();}}}}>
   <strong>{productListName(product)}</strong><span title={productListVariant(product)}>{productListVariant(product)}{product.modelIdentity&&product.modelIdentity.listingCount>1?` · ${product.modelIdentity.listingCount} listings · options`:null}</span>
  </button><Link className="part-details-link" href={'/products/'+encodeURIComponent(product.id)+(builderMode?'?builder=1':'')} aria-label={'View specs and history for '+productListName(product)} title="Open specifications & price history"><ArrowUpRight size={16}/></Link></div>
  {columns.map(c=>{const v=partValue(product,c.key);return <div className={'part-spec-cell'+(v.value==='—'?' missing':'')} role="cell" key={c.key} title={[v.value,c.help,v.note,v.source].filter(Boolean).join('\n')}><span className="part-spec-label">{c.label}</span><span>{v.value}</span></div>;})}
  <div role="cell" className="part-price"><strong>{offer?money(offer.price/offer.packQuantity):'Unpriced'}</strong>{offer&&offer.packQuantity>1&&<small className="part-package-total">{money(offer.price)} package purchase</small>}<span>{offer?.retailer||'No current offer'}{!current&&offer?' · Last observed':''}{offer&&offer.packQuantity>1?` · ${offer.packQuantity}-pack`:''}</span></div>
  <div className="part-actions" role="cell"><span className="part-watch-control"><WatchButton product={product}/><small aria-hidden="true">Watch</small></span><label className={'part-compare '+(selected?'selected':'')} title={selected?"Remove from comparison":"Compare this part"}><input type="checkbox" checked={selected} onChange={()=>{if(!selected&&compare.length>=4){notify('Compare up to four parts. Remove one to add another.');return;}setCompare(c=>selected?c.filter(id=>id!==product.id):[...c,product.id]);}}/><span><Check size={13}/></span><small aria-hidden="true">Compare</small><span className="sr-only">Compare {product.name}</span></label>
  <BuildQuantity product={product} offerId={selectedOfferId} returnToBuild={builderMode}/></div>
 </article>;
}
function PartPreview({product,builderMode=false,selectedOfferId}:{product:Product;builderMode?:boolean;selectedOfferId?:string}){
 const {build}=usePV();const {current,offer}=pricing(product);const quantity=build.lines.find(l=>l.productId===product.id)?.quantity||0;
 return <div className="part-preview">
  <div className="inspection-label"><span className="pulse-dot"/>PART INSPECTOR<span>{categories.find(c=>c.id===product.category)?.label}</span></div>
  <div className="inspection-image"><div className="inspection-grid"/><ProductImage key={product.id} product={product}/>{quantity>0&&<span className="equipped-badge"><Check size={12}/> In build ×{quantity}</span>}</div>
  <div className="inspection-content"><span className="brand-label">{manufacturerDisplay(product.brand)}</span><h3>{productListName(product)}</h3><BundleTags product={product}/><div className="spec-pills">{specs(product).map((s,i)=><span key={i} title={s.note}>{s.label}: {s.value}</span>)}</div>
   <div className="inspection-price"><div><small>{bundled(product)?(current?'Current bundle price':'Last observed bundle price'):current?'Current unit price':'Last observed unit price'}</small><strong>{offer?money(offer.price/offer.packQuantity):'Unpriced'}</strong></div><span className={current?'stock-dot':'muted'}>{current?'In stock':'Check stock'}</span></div>
   <ProductPriceHistory key={product.id} product={product} compact/>
   {offer&&<><div className="purchase-note"><Package size={15}/><span>{offer.packQuantity>1?`${money(offer.price)} purchase · ${offer.packQuantity} units`:`${money(offer.price)} ${bundled(product)?'whole-bundle':'single-unit'} purchase`}<small>{offer.retailer} · {offer.condition==='used'?'Used / refurbished':'New'}</small></span></div><p className="inspection-date">Observed {new Date(offer.observedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})} · {product.offers.length} {product.offers.length===1?'offer':'offers'}</p></>}
   <div className="inspection-quantity"><span>Quantity in build</span><BuildQuantity product={product} offerId={selectedOfferId} returnToBuild={builderMode}/></div>
   <WatchButton product={product} compact={false}/><Link className="inspection-details" href={'/products/'+product.id+(builderMode?'?builder=1':'')}>View specs & price history <ArrowUpRight size={15}/></Link>
  </div>
 </div>;
}
function Loadout(){
 const {build,products}=usePV();let subtotal=0,unpriced=0;const selected=new Set<string>();
 for(const line of build.lines){const p=products.find(p=>p.id===line.productId);if(p)selected.add(p.category);const offer=p?bestOffer(line.offerId?{...p,offers:p.offers.filter(o=>o.id===line.offerId)}:p,line.quantity):undefined;if(offer)subtotal+=costForQuantity(offer,line.quantity).subtotal;else unpriced++;}
 return <div className="inventory-loadout"><div className="loadout-heading"><span>YOUR LOADOUT</span><strong>{build.lines.length} {build.lines.length===1?'part':'parts'}</strong></div><div className="loadout-slots">{categories.map(c=>{const Icon=icons[c.id];return <span key={c.id} className={selected.has(c.id)?'filled':''} title={`${c.label}: ${selected.has(c.id)?'in your build':'no parts selected'}`}><Icon size={17}/><span className="sr-only">{c.label}: {selected.has(c.id)?'selected':'empty'}</span></span>;})}</div><div className="loadout-total"><span>Equipment subtotal</span><strong>{money(subtotal)}</strong></div><p>{unpriced?`${unpriced} parts need current pricing. `:''}Package quantities included. Before tax & shipping.</p><Link href="/build">Open system builder <ArrowRight size={15}/></Link></div>;
}
export function InventoryInspector({product,mobileOpen,onClose,visible=true,builderMode=false,selectedOfferId}:{visible?:boolean;product?:Product;mobileOpen:boolean;onClose:()=>void;builderMode?:boolean;selectedOfferId?:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [desktop,setDesktop]=useState(true);
 useEffect(()=>{const d=dialog.current;if(!d)return;const media=window.matchMedia('(max-width: 720px)');const sync=()=>{setDesktop(!media.matches);if(mobileOpen&&product&&media.matches){if(!d.open)d.showModal();}else if(d.open)d.close();};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[mobileOpen,product]);
 return <><aside hidden={!visible} className="inventory-inspector" aria-label="Product inspector">{desktop&&visible&&product?<PartPreview product={product} selectedOfferId={selectedOfferId} builderMode={builderMode}/>:<div className="inspection-empty"><Sun size={28}/><p>Select a part to inspect it.</p></div>}<p className="inspector-hint">{builderMode?'Double-click for specs and price history. Use + to add a part and return to your build.':'Hover to inspect. Click to keep the preview. Double-click for specs and price history. Use + or - to adjust your build.'}<br/>Use ↑ ↓ to explore the list with your keyboard.</p></aside><dialog ref={dialog} className="mobile-inspector" aria-label="Product preview" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><button autoFocus className="icon-button inspection-close" aria-label="Close product preview" onClick={onClose}><X size={20}/></button>{mobileOpen&&product&&<PartPreview product={product} selectedOfferId={selectedOfferId} builderMode={builderMode}/>}</dialog></>;
}
