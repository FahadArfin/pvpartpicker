'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Build,Product} from '../lib/types';
import {cachedConnections,fetchConnections} from '../lib/connection-client';
export function useConnectionProducts(build:Build,catalog:Product[]){
 const key=JSON.stringify(build.lines.map(l=>l.productId).filter(id=>catalog.some(p=>p.id===id&&['panels','inverters','charging','all-in-one','batteries'].includes(p.category))).sort());
 const [evidence,setEvidence]=useState<{key:string;data:Pick<Product,'id'|'connectionSpecs'>[]}|null>(null),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();if(key==='[]'){setLoading(false);setLoadError('');return ()=>controller.abort();}const cached=cachedConnections(key);if(cached){setEvidence({key,data:cached});setLoading(false);setLoadError('');return ()=>controller.abort();}setLoading(true);setLoadError('');fetchConnections(key,controller.signal).then(data=>{if(!controller.signal.aborted)setEvidence({key,data});}).catch(e=>{if(!controller.signal.aborted)setLoadError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return ()=>controller.abort();},[key,retry]);
 const products=useMemo(()=>{const fields=new Map(evidence?.key===key?evidence.data.map(p=>[p.id,p.connectionSpecs]):[]);return catalog.map(p=>fields.has(p.id)?{...p,connectionSpecs:fields.get(p.id)}:p);},[catalog,evidence,key]);
 return {products,loading,loadError,onRetry:()=>setRetry(n=>n+1)};
}
