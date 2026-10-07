export interface BackfillStatus {
 queue:{total:number;checked:number;remaining:number;preReview:number};
 counts:Record<string,number>;importedRows:number;paused:boolean;reason?:string;now:string;
 nextRequestAt?:string|null;lastRequestAt?:string|null;
 worker:{at:string;phase:string;runUrl?:string}|null;
 active:{productId?:string;name?:string;retailer?:string;until:string;requestAt:string|null}|null;
 recent:{productId:string;name:string;retailer:string;status:string;rows:number;reason?:string;sourceUrl?:string;finishedAt?:string}[];
}
type Activity=Pick<BackfillStatus,'queue'|'paused'|'now'|'worker'|'active'|'lastRequestAt'>;
// Status reflects a server snapshot. The UI labels its refresh time separately.
export function backfillDisplay(d:Activity){
 const now=Date.parse(d.now),active=d.active&&Date.parse(d.active.until)>now;
 if(d.paused)return {label:'Paused',tone:'warning'};
 if(!d.queue.total)return {label:'No queued listings',tone:'muted'};
 if(!d.queue.remaining)return {label:'Queue checked',tone:'success'};
 if(active){
  if(d.active?.requestAt&&Date.parse(d.active.requestAt)>now)return {label:'Waiting for request slot',tone:'muted'};
  if(d.lastRequestAt&&now-Date.parse(d.lastRequestAt)<120000)return {label:'Working',tone:'accent'};
  return {label:'Listing reserved',tone:'muted'};
 }
 if(!d.worker)return {label:'Awaiting check-in',tone:'muted'};
 if(d.worker.phase==='failed')return {label:'Worker error',tone:'danger'};
 if(now-Date.parse(d.worker.at)>2*3600000)return {label:'Check-in overdue',tone:'warning'};
 return {label:'Between runs',tone:'muted'};
}
