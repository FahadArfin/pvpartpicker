'use client';
import Link from './site-link';
import {CheckCircle2,AlertTriangle,HelpCircle,Plus,Minus,Trash2,Bookmark,Link2} from 'lucide-react';
import {usePV,ProductImage,api} from './pv-provider';
import {categories} from '../lib/types';
import type {BuildSettings} from '../lib/types';
import {builderPickerHref} from '../lib/build-flow';
import {bestOffer,costForQuantity,money,checkCompatibility} from '../lib/domain';

export function BuildWorkspace(){
 const {products,build,setBuild,save,notify}=usePV();
 const selected=build.lines.map(l=>products.find(p=>p.id===l.productId)).filter(Boolean) as typeof products;
 const checks=checkCompatibility(selected,build.settings);
 let total=0,unpriced=0;
 const rows=build.lines.map(l=>{
  const p=products.find(p=>p.id===l.productId);
  const o=p?(l.offerId?bestOffer({...p,offers:p.offers.filter(o=>o.id===l.offerId)},l.quantity):bestOffer(p,l.quantity)):undefined;
  const cost=o?costForQuantity(o,l.quantity):undefined;
  if(cost)total+=cost.subtotal;else unpriced++;
  return {l,p,o,cost};
 });
 const watts=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='panels')?.specs.watts||0)*l.quantity,0);
 const kwh=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='batteries'&&p.specs.batteryKind!=='Battery cabinets')?.specs.capacityKwh||0)*l.quantity,0);
 const stationKwh=build.lines.reduce((s,l)=>s+Number(products.find(p=>p.id===l.productId&&p.category==='all-in-one')?.specs.capacityKwh||0)*l.quantity,0);
 function setting<K extends 'purpose'|'mount'>(key:K,value:BuildSettings[K]){setBuild(b=>({...b,settings:{...b.settings,[key]:value}}));}
 function qty(id:string,n:number){setBuild(b=>({...b,lines:b.lines.map(l=>l.productId===id?{...l,quantity:Math.max(1,Math.min(10000,n||1))}:l)}));}
 async function share(){const savedId=await save();if(!savedId)return;try{const d=await api('builds/'+savedId,{method:'PATCH',body:'{}'});await navigator.clipboard.writeText(location.origin+'/share/'+d.shareId);notify('Read-only build link copied.');}catch(e){notify((e as Error).message);}}
 function selectedRow({l,p,cost}:typeof rows[number],label:string,category?:typeof categories[number]){return <tr className="builder-selected-row" key={l.productId}>
  <th scope="row" className="builder-component"><span>{label}</span>{category&&<Link href={builderPickerHref(category.id)}>Add another</Link>}</th>
  <td className="builder-selection"><Link className="row-link" href={'/products/'+l.productId}>{p&&<ProductImage product={p}/>}<span>{p?.name||'Unavailable product'}</span></Link></td>
  <td className="builder-quantity"><div className="quantity-control"><button aria-label={'Decrease quantity of '+(p?.name||'unavailable product')} disabled={l.quantity<=1} onClick={()=>qty(l.productId,l.quantity-1)}><Minus size={12}/></button><input aria-label={'Quantity for '+(p?.name||'unavailable product')} type="number" min="1" max="10000" value={l.quantity} onChange={e=>qty(l.productId,Number(e.target.value))}/><button aria-label={'Increase quantity of '+(p?.name||'unavailable product')} disabled={l.quantity>=10000} onClick={()=>qty(l.productId,l.quantity+1)}><Plus size={12}/></button></div>{cost&&cost.extraUnits>0&&<small>{cost.packs} packs · {cost.extraUnits} extra units</small>}</td>
  <td className="builder-retailer"><select aria-label={'Retailer for '+(p?.name||'unavailable product')} value={l.offerId||''} onChange={e=>setBuild(b=>({...b,lines:b.lines.map(line=>line.productId===l.productId?{...line,offerId:e.target.value||undefined}:line)}))}><option value="">Lowest current purchase cost</option>{p?.offers.map(o=><option key={o.id} value={o.id}>{o.retailer} · {money(o.price)} / {o.packQuantity}</option>)}</select></td>
  <td className="builder-cost">{cost?<strong>{money(cost.subtotal)}</strong>:<small>Needs a current offer</small>}</td>
  <td className="builder-remove"><button className="icon-button" aria-label={'Remove '+(p?.name||'unavailable product')} onClick={()=>setBuild(b=>({...b,lines:b.lines.filter(line=>line.productId!==l.productId)}))}><Trash2 size={15}/></button></td>
 </tr>;}
 return <main className="page-container builder-page">
  <header className="builder-heading"><div><div className="eyebrow">SYSTEM BUILDER</div><h1>Choose your parts.</h1><p>A place for every part of your solar system.</p></div><div className="flex-actions"><button className="button outline small" onClick={share}><Link2 size={15}/>Share</button><button className="button dark small" onClick={save}><Bookmark size={15}/>Save build</button></div></header>
  <section className="builder-direction" aria-labelledby="direction-heading"><div className="builder-direction-heading"><h2 id="direction-heading">1. Set your direction</h2><Link className="text-link small-text" href="/learn">Need a hand?</Link></div><div className="builder-direction-controls">
   <label className="field builder-name">Build name<input maxLength={100} value={build.name} onChange={e=>setBuild(b=>({...b,name:e.target.value}))}/></label>
   <div className="builder-preference"><span>System purpose</span><div className="builder-toggles" role="group" aria-label="System purpose">{([['offgrid','Off-grid'],['hybrid','Hybrid / backup'],['gridtie','Grid-tied']] as const).map(([value,label])=><button key={value} aria-pressed={build.settings.purpose===value} onClick={()=>setting('purpose',value)}>{label}</button>)}</div></div>
   <div className="builder-preference"><span>Panel mounting</span><div className="builder-toggles" role="group" aria-label="Panel mounting">{([['roof','Roof'],['ground','Ground']] as const).map(([value,label])=><button key={value} aria-pressed={build.settings.mount===value} onClick={()=>setting('mount',value)}>{label}</button>)}</div></div>
  </div><p className="builder-filter-note">These choices narrow inverter and mount options when you choose a part. You can show all options in the picker.</p></section>
  <section className="builder-equipment" aria-labelledby="equipment-heading"><div className="builder-equipment-heading"><h2 id="equipment-heading">2. Pick your equipment</h2><span>{build.lines.length} selected {build.lines.length===1?'part':'parts'}</span></div>
   <a className={'builder-check-strip '+(checks.some(c=>c.status==='mismatch')?'has-mismatch':'')} href="#compatibility"><AlertTriangle size={16}/><span>{checks.some(c=>c.status==='mismatch')?'Compatibility mismatches need attention':'System needs verification'} <small>Review checks below</small></span></a>
   <table className="builder-parts-table"><thead><tr><th>Component</th><th>Selection</th><th>Quantity</th><th>Retailer</th><th>Cost</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{categories.map(c=>{const items=rows.filter(row=>row.p?.category===c.id);return items.length?items.map(row=>selectedRow(row,c.label,c)):<tr className="builder-empty-row" key={c.id}><th scope="row">{c.label}</th><td colSpan={5}><Link className="button outline small" href={builderPickerHref(c.id)}><Plus size={14}/>Choose {c.label.toLowerCase()}</Link></td></tr>;})}{rows.filter(row=>!row.p).map(row=>selectedRow(row,'Unavailable'))}</tbody></table>
   <div className="builder-totals"><div className="builder-metrics"><span><strong>{watts?(watts/1000).toFixed(1):'—'}</strong> kW PV</span><span><strong>{kwh?kwh.toFixed(1):'—'}</strong> kWh DC storage</span>{stationKwh>0&&<span><strong>{stationKwh.toFixed(2)}</strong> kWh integrated stations</span>}</div><div className="builder-subtotal"><span>Equipment subtotal</span><strong>{money(total)}</strong></div></div>
   <p className="builder-price-note">{unpriced?`${unpriced} items need current prices. `:''}Package quantities included. Shipping and tax excluded. Totals cover selected equipment, not a complete installation.</p>
  </section>
  <section className="section-card builder-compatibility" id="compatibility"><h2>3. Review compatibility</h2><p className="inline-note">Checks use documented specifications. Items needing verification keep the system unverified.</p><details><summary className="small-text">Enter PV string details for voltage checks</summary><div className="form-grid" style={{marginTop:18}}>{([['series','Panels per series string'],['parallel','Parallel strings per MPPT'],['minimumTemperature','Minimum ambient temperature (°C)']] as const).map(([key,label])=><label className="field" key={key}>{label}<input type="number" min={key==='minimumTemperature'?-70:1} max={key==='minimumTemperature'?60:200} value={build.settings[key]??''} onChange={e=>setBuild(b=>({...b,settings:{...b.settings,[key]:e.target.value===''?undefined:Number(e.target.value)}}))}/></label>)}</div></details>{checks.map((c,i)=>{const Icon=c.status==='match'?CheckCircle2:c.status==='mismatch'?AlertTriangle:HelpCircle;return <div className={'compatibility-item status-'+c.status} key={i}><Icon size={19}/><div><strong>{c.title} · {c.status==='unknown'?'Needs verification':c.status==='match'?'Documented check passed':'Mismatch'}</strong><p>{c.detail}</p>{c.source&&<a className="text-link small-text" href={c.source} target="_blank" rel="noreferrer">Source documentation</a>}</div></div>;})}</section>
  <div className="builder-footer"><span>Your draft stays on this device. Save it to your account to keep it across devices.</span><button className="reset-filters" onClick={()=>{setBuild(b=>({...b,id:undefined,lines:[]}));notify('Draft cleared. Saved account builds are unchanged.');}}>Clear draft</button></div>
 </main>;
}
