'use client';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from 'recharts';
import type {Product} from '../lib/types';
import {money} from '../lib/domain';
import {historyTick} from '../lib/product-price-history';
export default function PriceHistoryChart({data,product,compact=false}:{data:Record<string,string|number>[];product:Product;compact?:boolean}){
 const times=data.map(p=>Number(p.time)),start=Math.min(...times),end=Math.max(...times);
 const domain=start===end?[start-43200000,end+43200000]:[start,end];
 return <div className={'history-chart'+(compact?' history-chart-compact':'')} role="img" aria-label="Recorded retailer prices over time"><ResponsiveContainer width="100%" height="100%" initialDimension={{width:compact?240:600,height:compact?165:300}}><LineChart data={data} margin={{left:0,right:compact?6:20,top:10,bottom:5}}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3"/><XAxis dataKey="time" type="number" scale="time" domain={domain} tickCount={compact?3:6} tickFormatter={v=>historyTick(Number(v),start,end)} tick={{fontSize:compact?9:10,fill:'var(--muted)'}}/><YAxis tickFormatter={v=>'$'+Number(v).toLocaleString('en-US',{maximumFractionDigits:0})} tick={{fontSize:compact?9:10,fill:'var(--muted)'}} width={compact?45:65} domain={['auto','auto']}/><Tooltip contentStyle={{background:'var(--surface-raised)',border:'1px solid var(--line)',color:'var(--text)',fontSize:compact?10:12}} labelStyle={{color:'var(--text)'}} labelFormatter={(v,payload)=>payload.some(p=>p.payload?.dayOnly===1)?new Date(Number(v)).toISOString().slice(0,10)+' · day precision':new Date(Number(v)).toISOString().replace('T',' ').slice(0,16)+' UTC'} formatter={v=>money(Number(v))}/><Legend wrapperStyle={{fontSize:10}}/>{product.offers.map((o,i)=>{
  const checks=data.filter(p=>typeof p[o.id]==='number');
  return checks.length?<Line key={o.id} dataKey={o.id} name={o.retailer} stroke={`var(--chart-${i%8+1})`} strokeWidth={2} dot={checks.length>80?false:{r:compact?3:4}} connectNulls={true} isAnimationActive={false}/>:null;
 })}</LineChart></ResponsiveContainer></div>;
}
