'use client';
import {useEffect,useRef} from 'react';
import {Sun,Battery,Zap,Cable,Wrench,Box,Plug,ShieldCheck,Gauge,PackageOpen,Check,ArrowUpRight,ArrowRight,X,Package} from 'lucide-react';
import Link from './site-link';
import {usePV,ProductImage,WatchButton} from './pv-provider';
import {BuildQuantity} from './build-quantity';
import {categories} from '../lib/types';
import type {Product} from '../lib/types';
import {bestOffer,costForQuantity,money} from '../lib/domain';
import {productDisplayName} from '../lib/bundles';
import {BundleTags} from './bundle-presentation';

const icons={panels:Sun,mounting:Wrench,wiring:Cable,batteries:Battery,inverters:Zap,electrical:Box,accessories:Plug,charging:Zap,'module-electronics':ShieldCheck,monitoring:Gauge,kits:PackageOpen,'all-in-one':Battery};
const specKeys=['watts','face','technology','voltage','capacityKwh','formFactor','inverterType','gauge','mountType','controllerType','chargeCurrentA','moduleFunction','monitorType','kitType','stationType','outputWatts'];
function specs(product:Product){return Object.entries(product.specs).filter(([k])=>specKeys.includes(k)&&!(product.category==='inverters'&&k==='watts')).slice(0,3).map(([k,v])=>k==='watts'||k==='outputWatts'?`${v} W`:k==='voltage'?`${v} V`:k==='capacityKwh'?`${v} kWh`:k==='chargeCurrentA'?`${v} A`:String(v));}
function pricing(product:Product){const current=bestOffer(product);const last=[...product.offers].sort((a,b)=>a.price/a.packQuantity-b.price/b.packQuantity)[0];return {current,offer:current||last};}

export function PartRow({product,active,onInspect,onOpen,builderMode=false}:{product:Product;active:boolean;onInspect:()=>void;onOpen:()=>void;builderMode?:boolean}){
 const {build,compare,setCompare,notify}=usePV();const {current,offer}=pricing(product);const Icon=icons[product.category];const quantity=build.lines.find(l=>l.productId===product.id)?.quantity||0;const selected=compare.includes(product.id);
 return <article className={'part-row '+(active?'inspected ':'')+(quantity?'equipped':'')} onMouseEnter={onInspect} onFocus={onInspect} onDoubleClick={e=>{
  // A second click on the part opens its details; action controls stay separate.
  if((e.target as HTMLElement).closest('a,input,select,textarea,label,button:not(.part-inspect)'))return;
  window.location.assign('/products/'+encodeURIComponent(product.id)+(builderMode?'?builder=1':''));
 }}>
  <span className="part-category-icon"><Icon size={19}/></span>
  <button className="part-inspect" aria-label={'Inspect '+productDisplayName(product)} aria-pressed={active} title="Click to preview. Double-click for specs and price history." onClick={onOpen} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){const rows=Array.from(e.currentTarget.closest('.part-list')!.querySelectorAll<HTMLButtonElement>('.part-inspect'));const index=rows.indexOf(e.currentTarget);const next=rows[index+(e.key==='ArrowDown'?1:-1)];if(next){e.preventDefault();next.focus();}}}}>
   <strong>{productDisplayName(product)}</strong><BundleTags product={product}/><span>{product.brand}<i/> {specs(product).join(' · ')||categories.find(c=>c.id===product.category)?.label}</span>
  </button>
  <div className="part-price"><strong>{offer?money(offer.price/offer.packQuantity):'Unpriced'}</strong><span>{current?'In stock':'Last observed'}{offer&&offer.packQuantity>1?` · ${offer.packQuantity}-pack`:''}</span></div>
  <WatchButton product={product}/><label className={'part-compare '+(selected?'selected':'')} title="Compare part"><input type="checkbox" checked={selected} onChange={()=>{if(!selected&&compare.length>=4){notify('Compare up to four parts. Remove one to add another.');return;}setCompare(c=>selected?c.filter(id=>id!==product.id):[...c,product.id]);}}/><span><Check size={13}/></span><span className="sr-only">Compare {product.name}</span></label>
  <BuildQuantity product={product} offerId={offer?.id} returnToBuild={builderMode}/>
 </article>;
}

function PartPreview({product,builderMode=false}:{product:Product;builderMode?:boolean}){
 const {build}=usePV();const {current,offer}=pricing(product);const quantity=build.lines.find(l=>l.productId===product.id)?.quantity||0;
 return <div className="part-preview">
  <div className="inspection-label"><span className="pulse-dot"/>PART INSPECTOR<span>{categories.find(c=>c.id===product.category)?.label}</span></div>
  <div className="inspection-image"><div className="inspection-grid"/><ProductImage key={product.id} product={product}/>{quantity>0&&<span className="equipped-badge"><Check size={12}/> In build ×{quantity}</span>}</div>
  <div className="inspection-content"><span className="brand-label">{product.brand}</span><h3>{productDisplayName(product)}</h3><BundleTags product={product}/><div className="spec-pills">{specs(product).map((s,i)=><span key={i}>{s}</span>)}</div>
   <div className="inspection-price"><div><small>{product.category==='kits'?(current?'Current bundle price':'Last observed bundle price'):current?'Current unit price':'Last observed unit price'}</small><strong>{offer?money(offer.price/offer.packQuantity):'Unpriced'}</strong></div><span className={current?'stock-dot':'muted'}>{current?'In stock':'Check stock'}</span></div>
   {offer&&<><div className="purchase-note"><Package size={15}/><span>{offer.packQuantity>1?`${money(offer.price)} purchase · ${offer.packQuantity} units`:`${money(offer.price)} ${product.category==='kits'?'whole-bundle':'single-unit'} purchase`}<small>{offer.retailer} · {offer.condition==='used'?'Used / refurbished':'New'}</small></span></div><p className="inspection-date">Observed {new Date(offer.observedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})} · {product.offers.length} {product.offers.length===1?'offer':'offers'}</p></>}
   <div className="inspection-quantity"><span>Quantity in build</span><BuildQuantity product={product} offerId={offer?.id} returnToBuild={builderMode}/></div>
   <WatchButton product={product} compact={false}/><Link className="inspection-details" href={'/products/'+product.id+(builderMode?'?builder=1':'')}>View specs & price history <ArrowUpRight size={15}/></Link>
  </div>
 </div>;
}

function Loadout(){
 const {build,products}=usePV();let subtotal=0,unpriced=0;const selected=new Set<string>();
 for(const line of build.lines){const p=products.find(p=>p.id===line.productId);if(p)selected.add(p.category);const offer=p?bestOffer(line.offerId?{...p,offers:p.offers.filter(o=>o.id===line.offerId)}:p,line.quantity):undefined;if(offer)subtotal+=costForQuantity(offer,line.quantity).subtotal;else unpriced++;}
 return <div className="inventory-loadout"><div className="loadout-heading"><span>YOUR LOADOUT</span><strong>{build.lines.length} {build.lines.length===1?'part':'parts'}</strong></div><div className="loadout-slots">{categories.map(c=>{const Icon=icons[c.id];return <span key={c.id} className={selected.has(c.id)?'filled':''} title={`${c.label}: ${selected.has(c.id)?'in your build':'no parts selected'}`}><Icon size={17}/><span className="sr-only">{c.label}: {selected.has(c.id)?'selected':'empty'}</span></span>;})}</div><div className="loadout-total"><span>Equipment subtotal</span><strong>{money(subtotal)}</strong></div><p>{unpriced?`${unpriced} parts need current pricing. `:''}Package quantities included. Before tax & shipping.</p><Link href="/build">Open system builder <ArrowRight size={15}/></Link></div>;
}

export function InventoryInspector({product,mobileOpen,onClose,builderMode=false}:{product?:Product;mobileOpen:boolean;onClose:()=>void;builderMode?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=dialog.current;if(!d)return;const media=window.matchMedia('(max-width: 720px)');const sync=()=>{if(mobileOpen&&product&&media.matches){if(!d.open)d.showModal();}else if(d.open)d.close();};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[mobileOpen,product]);
 return <><aside className="inventory-inspector" aria-label="Product inspector">{product?<PartPreview product={product} builderMode={builderMode}/>:<div className="inspection-empty"><Sun size={28}/><p>Select a part to inspect it.</p></div>}<Loadout/><p className="inspector-hint">{builderMode?'Double-click for specs and price history. Use + to add a part and return to your build.':'Hover to inspect. Click to keep the preview. Double-click for specs and price history. Use + or - to adjust your build.'}<br/>Use ↑ ↓ to explore the list with your keyboard.</p></aside><dialog ref={dialog} className="mobile-inspector" aria-label="Product preview" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><button autoFocus className="icon-button inspection-close" aria-label="Close product preview" onClick={onClose}><X size={20}/></button>{product&&<PartPreview product={product} builderMode={builderMode}/>}</dialog></>;
}
