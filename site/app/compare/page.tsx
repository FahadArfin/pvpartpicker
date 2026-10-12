'use client';

import {useEffect,useState} from 'react';
import Link from '../../components/site-link';
import {usePV,ProductImage} from '../../components/pv-provider';
import {BuildQuantity} from '../../components/build-quantity';
import {bestOffer,money} from '../../lib/domain';
import {categories} from '../../lib/types';
import {productListName,productListVariant} from '../../lib/part-comparison';
import {cachedComparison,fetchComparison} from '../../lib/comparison-client';
import type {ComparisonEvidence} from '../../lib/comparison-client';
import {comparisonRows,comparisonCoverage} from '../../lib/comparison-view';

export default function Compare(){
 const {products,compare,setCompare}=usePV();
 const [differences,setDifferences]=useState(false),[allSpecs,setAllSpecs]=useState(true),[pair,setPair]=useState<string[]>([]);
 const [evidence,setEvidence]=useState<ComparisonEvidence>([]),[evidenceError,setEvidenceError]=useState(''),[evidenceLoading,setEvidenceLoading]=useState(false),[retry,setRetry]=useState(0),[phone,setPhone]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:720px)');const sync=()=>setPhone(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const evidenceKey=JSON.stringify(compare.slice(0,4));
 useEffect(()=>{
  if(!allSpecs||!compare.length){setEvidenceLoading(false);return;}
  const abort=new AbortController();setEvidenceError('');
  const known=cachedComparison(evidenceKey);
  if(known){setEvidence(known);setEvidenceLoading(false);}
  else {setEvidence([]);setEvidenceLoading(true);fetchComparison(evidenceKey,abort.signal).then(data=>{if(!abort.signal.aborted){setEvidence(data);setEvidenceLoading(false);}}).catch(()=>{if(!abort.signal.aborted){setEvidenceLoading(false);setEvidenceError('Detailed sourced ratings could not be loaded. Listed fields remain available; missing ratings stay unknown.');}});}
  return()=>abort.abort();
 },[allSpecs,evidenceKey,retry]);
 const allChosen=compare.flatMap(id=>{const p=products.find(p=>p.id===id);return p?[{...p,...evidence.find(e=>e.id===id)}]:[];});
 const pairIds=[...pair.filter(id=>allChosen.some(p=>p.id===id)),...allChosen.map(p=>p.id).filter(id=>!pair.includes(id))].slice(0,2);
 const chosen=phone?pairIds.flatMap(id=>{const p=allChosen.find(p=>p.id===id);return p?[p]:[];}):allChosen;
 const allRows=comparisonRows(chosen,allSpecs),rows=allRows.filter(row=>!differences||row.different),coverage=comparisonCoverage(allRows,chosen);

 return <main className="page-container compare-page">
  <div className="page-intro"><div><h1>Compare parts</h1></div><Link className="button outline small" href="/parts">Add parts</Link></div>
  {chosen.length?<>
   <div className="comparison-controls">
    <label className="check-field"><input type="checkbox" checked={differences} onChange={e=>setDifferences(e.target.checked)}/>Differences only</label>
    <label className="check-field"><input type="checkbox" checked={allSpecs} onChange={e=>setAllSpecs(e.target.checked)}/>Detailed specs</label>

   </div>
   {allSpecs&&evidenceLoading&&<p className="inline-note" role="status">Loading sourced specifications…</p>}
   {evidenceError&&<p role="status" className="inline-note">{evidenceError} <button className="reset-filters" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>}
   {allChosen.length>2&&<div className="comparison-mobile-pair"><span>Choose two</span>{[0,1].map(index=><label key={index}>Product {index+1}<select value={pairIds[index]} onChange={e=>{const next=[...pairIds];const other=next[1-index];next[index]=e.target.value;if(e.target.value===other)next[1-index]=pairIds[index];setPair(next);}}>{allChosen.map(p=><option key={p.id} value={p.id}>{productListName(p)} · {productListVariant(p)}</option>)}</select></label>)}</div>}
   {new Set(chosen.map(p=>p.category)).size>1&&<p className="notice-panel">Different categories selected.</p>}
   <section className="section-card table-scroll comparison-sheet" role="region" aria-label="Selected product comparison" tabIndex={0}>
    <table className="data-table compare-table"><caption className="sr-only">Unit-aware specifications for selected products; missing values and source links are included</caption>
     <thead><tr><th scope="col">Product</th>{chosen.map((p,i)=><th scope="col" key={p.id}>
      <ProductImage product={p}/><Link href={'/products/'+encodeURIComponent(p.id)}>{productListName(p)}</Link>
      <small>{productListVariant(p)||'Package details not listed'}</small><small>{categories.find(c=>c.id===p.category)?.label}</small>
      <small className={coverage[i].missing?'comparison-missing-summary':''}>{coverage[i].missing} specs unknown</small>
      <button className="reset-filters" onClick={()=>setCompare(ids=>ids.filter(id=>id!==p.id))} aria-label={'Remove '+productListName(p)+' from comparison'}>Remove</button>
     </th>)}</tr></thead>
     <tbody>
      <tr><th scope="row">Current unit price</th>{chosen.map(p=>{const o=bestOffer(p);return <td key={p.id}>{o?<>
       <strong>{money(o.price/o.packQuantity)}</strong><small>{o.retailer} · {money(o.price)} purchase / {o.packQuantity} {o.packQuantity===1?'unit':'units'}</small>
       <small>{o.condition==='used'?'Used / refurbished':'New'} · Checked {o.observedAt.slice(0,16).replace('T',' ')} UTC</small>
       <a className="comparison-source" href={o.url} target="_blank" rel="noreferrer">Offer ↗</a>
      </>:'No fresh in-stock offer'}</td>;})}</tr>
      {rows.map(row=><tr key={row.key} className={row.different?'comparison-difference':''}>
       <th scope="row" title={row.help}>{row.label}</th>{row.values.map((value,i)=><td key={chosen[i].id}>
        <span title={value.note} className={value.value==='—'?'comparison-unknown':''}>{value.value==='—'?'Unknown':value.value==='N/A'?'Not applicable':value.value}</span>

        {value.source&&<a className="comparison-source" href={value.source} target="_blank" rel="noreferrer" aria-label={row.label+' source for '+productListName(chosen[i])}>Source ↗</a>}
       </td>)}
      </tr>)}
      {differences&&!rows.length&&<tr><td colSpan={chosen.length+1}>{chosen.length<2?'Choose another product to compare differences.':'No differences in the listed comparison fields.'}</td></tr>}
      <tr><th scope="row">Quantity in build</th>{chosen.map(p=><td key={p.id}><BuildQuantity product={p}/></td>)}</tr>
     </tbody>
    </table>
   </section>

  </>:<div className="empty-state"><h2>Select up to four products</h2><p>Use Compare beside a part in Browse parts, then open Compare parts.</p><Link className="button dark" href="/parts">Browse parts</Link></div>}
 </main>;
}
