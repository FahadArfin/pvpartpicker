'use client';
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip} from 'recharts';
import type {BuildHistory} from '../lib/build-price-history';
import {money} from '../lib/domain';
import {buildHistoryChartPoints} from '../lib/build-history-chart.ts';

export default function BuildHistoryChart({history}:{history:BuildHistory}){
 const tracked=history.series.filter(s=>s.hasHistory),checkpoints=buildHistoryChartPoints(history);
 // Start where shared records begin so a new build's first two checks do not
 // become a tiny sliver beside 88 days with no tracking. Keep later gaps.
 const first=checkpoints.findIndex(p=>p.total!==null),data=first>0?checkpoints.slice(first):checkpoints;
 const complete=data.filter(p=>p.total!==null),latest=complete.at(-1);
 const values=complete.map(p=>p.total!);
 return <>
  <div className="builder-history-summary"><span>{tracked.length===history.series.length?'Recorded build total':'Tracked subtotal'}<strong>{latest?money(latest.total!):'No shared checkpoint'}</strong><small>{latest?latest.date+' UTC':'Parts were checked on different dates'}</small></span>{values.length>0&&<><span>Period low<strong>{money(Math.min(...values))}</strong></span><span>Period high<strong>{money(Math.max(...values))}</strong></span></>}</div>
  {complete.length>0?<div className="builder-history-chart" aria-label="Stacked recorded purchase costs by selected part. Daily values are available in the table below."><ResponsiveContainer width="100%" height="100%" initialDimension={{width:900,height:310}}><AreaChart accessibilityLayer data={data} margin={{left:0,right:14,top:14,bottom:0}}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10,fill:'var(--muted)'}} tickFormatter={v=>String(v).slice(5)} minTickGap={35}/><YAxis domain={[0,'auto']} width={64} tick={{fontSize:10,fill:'var(--muted)'}} tickFormatter={v=>'$'+Number(v).toLocaleString()}/><Tooltip content={({active,payload})=>{
   const point=payload?.[0]?.payload as typeof data[number]|undefined;
   if(!active||!point)return null;
   return <div className="builder-history-tooltip"><strong>{point.date} UTC</strong>{tracked.map(s=><div key={s.productId}><span>{s.name} × {s.quantity}</span><b>{point.prices[s.productId]?money(point.prices[s.productId]!.cost):'No eligible check'}</b></div>)}<div><span>{tracked.length===history.series.length?'Build total':'Tracked subtotal'}</span><b>{point.total===null?'Incomplete checkpoint':money(point.total)}</b></div></div>;
  }}/>{tracked.map(s=>{const i=history.series.indexOf(s),color=`var(--chart-${i%8+1})`;return <Area key={s.productId} dataKey={'part'+i} name={s.name} type="stepAfter" stroke={color} fill={color} fillOpacity={.35} strokeWidth={1.5} connectNulls={false} dot={complete.length<3?{r:3}:false} activeDot={{r:4}} isAnimationActive={false}/>;})}</AreaChart></ResponsiveContainer></div>:<p className="builder-history-status">These parts do not yet have a shared daily checkpoint. Individual recorded costs are available in the table below.</p>}
  {complete.length===1&&<p className="builder-history-note">One shared checkpoint so far. More dated checks are needed to show a price trend.</p>}
  {complete.length>1&&first>0&&<p className="builder-history-note">Showing shared recorded checkpoints from {data[0].date} within the selected period.</p>}
 </>;
}
