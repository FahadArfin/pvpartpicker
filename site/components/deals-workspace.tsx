'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {TrendingDown} from 'lucide-react';
import {api,usePV} from './pv-provider';
import {ProductCard} from './catalog-workspace';
import {money} from '../lib/domain';
export function DealsWorkspace(){const{products}=usePV(),[drops,setDrops]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');useEffect(()=>{api('deals').then(d=>setDrops(d.drops)).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);return <main className="page-container"><div className="eyebrow">RECORDED, NOT ESTIMATED</div><h1>Price drops worth a look.</h1><p>Fresh in-stock offers that fell since their previous recorded observation.</p>{error&&<p className="error-message">{error}</p>}{loading?<p className="inline-note">Checking recorded prices…</p>:drops.length?<div className="product-grid">{drops.map(d=>{const p=products.find(p=>p.id===d.productId);return p?<div key={d.offerId}><div className="tag" style={{marginBottom:10}}>{money(d.previous)} → {money(d.current)} per unit</div><ProductCard product={p}/></div>:null;})}</div>:<div className="empty-state"><TrendingDown size={32}/><h3>Price tracking has just begun.</h3><p>Confirmed drops will appear after prices change between recorded checks. Explore current offers in the meantime.</p><Link className="button dark" href="/">Compare current prices</Link></div>}</main>;}
