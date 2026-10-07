'use client';
import {useEffect,useState} from 'react';
import {api} from './pv-provider';
import type {DropPeriod,PriceDrop} from '../lib/price-drops';
export function usePriceDrops(period:DropPeriod,enabled=true){
 const[drops,setDrops]=useState<PriceDrop[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[loaded,setLoaded]=useState(''),[checkedAt,setCheckedAt]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!enabled){setLoaded('');return;}const controller=new AbortController();setLoading(true);setError('');api('deals?period='+period,{signal:controller.signal}).then(d=>{if(!controller.signal.aborted){setDrops(d.drops);setLoaded(period);setCheckedAt(d.checkedAt);}}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setLoaded(period);setDrops([]);}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[period,attempt,enabled]);
 return {drops,loading:loading||loaded!==period,error,checkedAt,retry:()=>setAttempt(n=>n+1)};
}
