'use client';
import {useEffect,useState} from 'react';
import {api,usePV} from './pv-provider';
import type {SaleOffer} from '../lib/sales';
export function useSales(enabled:boolean){
 const {products}=usePV();
 const[sales,setSales]=useState<SaleOffer[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[checkedAt,setCheckedAt]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!enabled){setLoaded(false);return;}
  const controller=new AbortController();setLoading(true);setError('');
  api('deals?view=sales',{signal:controller.signal}).then(d=>{if(!controller.signal.aborted){setSales(d.sales);setLoaded(true);setCheckedAt(d.checkedAt);}}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setLoaded(true);setSales([]);}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[enabled,attempt,products]);
 useEffect(()=>{if(!enabled)return;const refresh=()=>{if(!document.hidden)setAttempt(n=>n+1);};document.addEventListener('visibilitychange',refresh);return()=>document.removeEventListener('visibilitychange',refresh);},[enabled]);
 return {sales,loading:loading||!loaded,error,checkedAt,retry:()=>setAttempt(n=>n+1)};
}
