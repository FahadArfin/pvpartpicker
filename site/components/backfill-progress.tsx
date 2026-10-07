'use client';
import Link from './site-link';
import {backfillDisplay,type BackfillStatus} from '../lib/backfill-progress';
const number=(n:number)=>n.toLocaleString();
const time=(s?:string|null)=>s?new Date(s).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'}):'Not recorded yet';
/** Temporary owner monitor; isolated so it can be removed after the backfill. */
export function BackfillProgress({data,live}:{data:BackfillStatus;live:boolean}){
 const {queue:q}=data,state=backfillDisplay(data),percent=q.total?100*q.checked/q.total:0,recent=data.recent.filter(j=>j.finishedAt).slice(0,10);
 return <section className="backfill-monitor" aria-labelledby="backfill-heading" id="historical-backfill">
  <div className="backfill-heading"><h2 id="backfill-heading">Historical backfill <small>Temporary monitor · Drop.solar</small></h2><span className={'backfill-state tone-'+state.tone}>{state.label}</span></div>
  <div className="backfill-progress-label"><label htmlFor="backfill-bar">{number(q.checked)} / {number(q.total)} queued listings checked</label><strong>{percent.toFixed(1)}%</strong></div>
  <progress id="backfill-bar" max={Math.max(1,q.total)} value={q.checked}>{percent.toFixed(1)}%</progress>
  <div className="backfill-counts"><span><strong>{number(q.remaining)}</strong> remaining</span><span><strong>{number(data.importedRows)}</strong> historical prices stored</span><span><strong>{number(data.counts.unmatched||0)}</strong> need identity review</span><span><strong>{number(data.counts.not_found||0)}</strong> not tracked by source</span>{!!data.counts.failed&&<span><strong>{number(data.counts.failed)}</strong> failed</span>}</div>
  <div className="backfill-activity"><span>Worker check-in: <strong>{time(data.worker?.at)}</strong></span><span>Last source request started: <strong>{time(data.lastRequestAt)}</strong></span>{data.worker?.runUrl&&<a href={data.worker.runUrl} target="_blank" rel="noreferrer">View worker run ↗</a>}</div>
  {data.active&&<p className="backfill-current">Reserved listing: <Link href={'/products/'+data.active.productId}>{data.active.name}</Link> · {data.active.retailer}{data.active.requestAt&&<> · request slot {time(data.active.requestAt)}</>}</p>}
  {data.reason&&<p className="error-message">{data.reason}</p>}
  <p className="backfill-note">{live?'Auto-refreshes every 10 seconds while this page is visible.':'Live updates are off; use Refresh above for a new snapshot.'} Updated {time(data.now)}. Processes continuously with automatic worker handoffs; at least 30 seconds between source requests.{!data.active&&data.nextRequestAt&&Date.parse(data.nextRequestAt)>Date.parse(data.now)&&<> Next request allowed after {time(data.nextRequestAt)}.</>}</p>
  <details><summary>Recent results & queue details</summary>
   <p className="backfill-note">{number(q.preReview)} listings require identity review before entering the queue and are excluded from the bar. Checked includes matches, unavailable history, and review outcomes; it does not mean every listing has imported prices. Current prices and alerts are unchanged.</p>
   {recent.length?<div className="table-scroll"><table className="data-table"><thead><tr><th>Recent listing (last 10)</th><th>Retailer</th><th>Result / checked</th><th>Imported prices / reason</th></tr></thead><tbody>{recent.map((j,i)=><tr key={i}><td><Link href={'/products/'+j.productId}>{j.name}</Link>{j.sourceUrl&&<small><a href={j.sourceUrl} target="_blank" rel="noreferrer">Source history ↗</a></small>}</td><td>{j.retailer}</td><td>{j.status.replaceAll('_',' ')}<small>{time(j.finishedAt)}</small></td><td>{number(j.rows)}{j.reason&&<small>{j.reason}</small>}</td></tr>)}</tbody></table></div>:<p className="backfill-note">Completed checks will appear here when the worker processes the queue.</p>}
  </details>
 </section>;
}
