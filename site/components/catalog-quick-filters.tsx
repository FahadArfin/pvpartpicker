'use client';
import type {Category,Product} from '../lib/types';
import {matchesQuickFilter,quickFilterGroups} from '../lib/quick-filters';
export function CatalogQuickFilters({category,products,selection,onChange}:{category:Category|'all';products:Product[];selection:Record<string,string>;onChange:(key:string,value:string)=>void}){
 const groups=quickFilterGroups(category,selection);if(!groups.length)return null;
 return <section className="catalog-quick-filters" aria-label="Quick product filters"><div className="quick-filter-heading"><span>Quick filters</span>{groups.some(g=>selection[g.key])&&<button onClick={()=>onChange('*','')}>Clear quick filters</button>}</div>{groups.map(g=>{
  const candidates=products.filter(p=>Object.entries(selection).every(([key,value])=>key===g.key||(g.key==='electricalPart'&&key==='fuseType')||matchesQuickFilter(p,key,value)));
  return <div className="quick-filter-group" key={g.key} role="group" aria-label={g.label}><span className="quick-filter-label">{g.label}</span><div className="quick-filter-chips"><button aria-pressed={!selection[g.key]} onClick={()=>onChange(g.key,'')}>All <small>{candidates.length}</small></button>{g.options.map(o=>{
   const count=candidates.filter(p=>matchesQuickFilter(p,g.key,o.value)).length,active=selection[g.key]===o.value;
   return <button key={o.value} aria-pressed={active} disabled={!count&&!active} onClick={()=>onChange(g.key,o.value)} title={!count?'No products match the other active filters':undefined}>{o.label} <small>{count}</small></button>;
  })}</div></div>;
 })}</section>;
}
