import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {parseDropHistory,dropIdentity} from '../lib/drop-history.ts';

// This helper talks only to our API. Source navigation belongs to the connected
// browser UI; there is intentionally no Drop.solar HTTP client or proxy here.
export function browserHistoryPayload(job,html,path){
 const data=parseDropHistory(html,path);
 if(!dropIdentity(job.p,job.o,data.product))return null;
 if(!data.history.length)return {empty:true};
 const sourceUrl='https://drop.solar'+path;
 const source={id:createHash('sha256').update(JSON.stringify({sourceUrl,product:data.product,history:data.history})).digest('hex'),label:'Drop.solar · '+job.o.retailer,url:sourceUrl,precision:'timestamp',startDate:data.history[0].date,endDate:data.history.at(-1).date};
 return {source,dropProduct:data.product,rows:data.history.map(r=>({...r,name:data.product.name,link:data.product.productUrl,packQuantity:job.o.packQuantity,offerId:job.o.id}))};
}
async function main(){
 const args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1];
 const command=args[0],statePath=option('--state'),envPath=option('--env-file');
 if(!statePath||!envPath)throw Error('Explicit --state and --env-file paths required');
 const env=await fs.readFile(envPath,'utf8'),token=env.match(/^COLLECTOR_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^(["'])(.*)\1$/,'$2');
 if(!token)throw Error('Existing collector credential unavailable');
 const api=async(action,data={})=>{
  const response=await fetch('https://pvpartpicker.fwad101.chatgpt.site/api/'+(action==='import'?'history-import':'history-backfill'),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(action==='import'?data:{action,...data}),signal:AbortSignal.timeout(90000)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Backfill API '+response.status);return result;
 };
 const report=async()=>{const s=await api('status');return {queue:s.queue,importedRows:s.importedRows,paused:s.paused,reason:s.reason,active:s.active};};
 if(command==='status'){console.log(await report());return;}
 if(command==='resume'){
  if(!args.includes('--reviewed-browser-access'))throw Error('Verified browser access, robots and correct lookup review required');
  const s=await api('status');console.log(await api('resume',{reviewedRateLimit:true,expectedReason:s.reason}));return;
 }
 if(command==='claim'){
  // Never overwrite an outstanding owned lease, even across agent restarts.
  try{await fs.access(statePath);throw Error('Resolve or release the saved browser claim first');}catch(e){if(e.code!=='ENOENT')throw e;}
  const claim=await api('claim');if(claim.job){await fs.writeFile(statePath,JSON.stringify(claim));await api('heartbeat',{phase:'started'});console.log({claimed:true,job:claim.job});}else console.log(claim);return;
 }
 const current=JSON.parse(await fs.readFile(statePath,'utf8')),{lease,job}=current;
 if(command==='reserve'){
  const s=await api('status'),elapsed=s.lastRequestAt?Date.now()-Date.parse(s.lastRequestAt):Infinity;
  console.log(await api('permit',{lease,delayMs:Math.max(0,60000-elapsed)}));return;
 }
 if(command==='confirm'){console.log(await api('confirm',{lease}));return;}
 if(command==='release'){console.log(await api('release',{lease}));await fs.unlink(statePath);await api('heartbeat',{phase:'finished'});return;}
 if(command==='pause'){
  const kind=option('--kind'),reason=option('--reason');
  if(!['rate_limit','access_denied','policy','lookup_integrity'].includes(kind)||!reason)throw Error('Explicit source pause evidence required');
  console.log(await api('pause',{lease,kind,reason,retryAfter:args.includes('--retry-after')?option('--retry-after'):undefined}));await fs.unlink(statePath);await api('heartbeat',{phase:'finished'});return;
 }
 let result;
 if(command==='not-found'){
  if(!args.includes('--verified-ui'))throw Error('Verify a visible no-results response first');
  result={status:'not_found',reason:'Browser URL search visibly returned no matching product'};
 }else if(command==='accept'){
  const path=option('--path'),html=await fs.readFile(option('--html'),'utf8');
  const payload=browserHistoryPayload(job,html,path),sourceUrl='https://drop.solar'+path;
  const validation=await api('validate_lookup',{lease,sourceUrl});
  if(validation.valid===false){await api('pause',{lease,kind:'lookup_integrity',reason:validation.reason});await fs.unlink(statePath);await api('heartbeat',{phase:'finished'});console.log({paused:true,reason:validation.reason});return;}
  if(!payload)result={status:'unmatched',sourceUrl,reason:'Retailer/model/package identity requires review'};
  else{let inserted=0;if(!payload.empty)for(let i=0;i<payload.rows.length;i+=200){const r=await api('import',{...payload,rows:payload.rows.slice(i,i+200)});inserted+=r.inserted;}result={status:'complete',sourceUrl,rows:inserted};}
 }else throw Error('Unknown browser history command');
 console.log(await api('finish',{lease,id:job.id,...result}));await fs.unlink(statePath);await api('heartbeat',{phase:'finished'});console.log(await report());
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
