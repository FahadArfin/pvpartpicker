'use client';
import {useId} from 'react';
export type ChartSeries={name:string;values:number[];color:string;dashed?:boolean};
const number=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
export default function CalculatorChart({title,labels,series,unit,xTitle='',bars=false}:{title:string;labels:string[];series:ChartSeries[];unit:string;xTitle?:string;bars?:boolean}){
 const id=useId(),all=series.flatMap(s=>s.values),min=Math.min(0,...all),max=Math.max(1,...all),range=max-min;
 const left=72,right=694,top=20,bottom=224,width=right-left,height=bottom-top;
 const y=(n:number)=>bottom-(n-min)/range*height;
 const x=(i:number)=>left+(bars?(i+0.5)/labels.length:i/Math.max(1,labels.length-1))*width;
 return <figure className="calc-chart"><figcaption id={id}>{title}<small>{unit}</small></figcaption><svg viewBox="0 0 730 290" role="img" aria-labelledby={id}>
 <desc>{series.map(s=>s.name).join(', ')}. Exact values are available in the data table below.</desc>
 {Array.from({length:5},(_,i)=>min+range*i/4).map((n,i)=><g key={i}><line x1={left} x2={right} y1={y(n)} y2={y(n)} stroke="#dce5e5" strokeDasharray="3 4"/><text x={left-10} y={y(n)+4} textAnchor="end">{number(n)}</text></g>)}
 {min<0&&<line x1={left} x2={right} y1={y(0)} y2={y(0)} stroke="#607475"/>}
 {series.map((s,si)=><g key={s.name}>{bars?s.values.map((n,i)=><rect key={i} x={x(i)-width/labels.length*.35+si*width/labels.length*.7/series.length} y={Math.min(y(n),y(0))} width={width/labels.length*.7/series.length} height={Math.abs(y(n)-y(0))} rx="3" fill={s.color}><title>{`${labels[i]} · ${s.name}: ${number(n)} ${unit}`}</title></rect>):<><polyline fill="none" stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed?'6 4':undefined} points={s.values.map((n,i)=>`${x(i)},${y(n)}`).join(' ')}/>{s.values.map((n,i)=><circle key={i} cx={x(i)} cy={y(n)} r="3.5" fill={s.color}><title>{`${labels[i]} · ${s.name}: ${number(n)} ${unit}`}</title></circle>)}</>}</g>)}
 {labels.map((l,i)=>(labels.length<=12||i===0||i===labels.length-1||i%Math.ceil(labels.length/8)===0)&&<text key={i} x={x(i)} y={246} textAnchor="middle">{l}</text>)}<text x={(left+right)/2} y="278" textAnchor="middle">{xTitle}</text></svg>
 <div className="calc-chart-legend">{series.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}{s.dashed?' · reference':''}</span>)}</div>
 <details className="calc-chart-data"><summary>View chart data</summary><div className="guide-table-wrap" tabIndex={0} role="region" aria-label={title+' data'}><table><caption>{title} · {unit}</caption><thead><tr><th scope="col">{xTitle||'Scenario'}</th>{series.map(s=><th scope="col" key={s.name}>{s.name}</th>)}</tr></thead><tbody>{labels.map((l,i)=><tr key={i}><th scope="row">{l}</th>{series.map(s=><td key={s.name}>{number(s.values[i])}</td>)}</tr>)}</tbody></table></div></details></figure>;
}
