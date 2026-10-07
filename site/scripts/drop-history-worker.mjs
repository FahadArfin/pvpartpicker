import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {parseDropHistory,dropIdentity,dropPagePath} from '../lib/drop-history.ts';
import {robotsAllows} from '../lib/retailers.ts';
const pauseError=reason=>Object.assign(Error(reason),{pause:true});
/** One worker, one reserved request slot at a time. Restart state lives in the site's D1 job_state. */
export async function runBackfill({api,request,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),budgetMs=45*60000,maxJobs=10000,log=console.log}){
 const deadline=now()+budgetMs;let robots,delay=30000,lastRequest=-Infinity,processed=0;
 while(now()+60000<deadline&&processed<maxJobs){
  const claim=await api('claim');if(!claim.job){log(claim.paused?{paused:true,reason:claim.reason}:claim);return;}
  const {job,lease}=claim;let inserted=0,sourceUrl;
  const get=async(path,options={})=>{
   if(path!=='/robots.txt'&&!robotsAllows(robots||'',path))throw pauseError('Drop.solar robots.txt disallows '+path);
   const permit=await api('permit',{lease,delayMs:Math.max(delay-(now()-lastRequest),0)});const wait=permit.waitMs;
   if(now()+wait+30000>=deadline)throw Object.assign(Error('Run budget reached; job will resume after its lease expires'),{budget:true});
   await sleep(wait);
   // A suspended process must revalidate its lease before touching the external source.
   let confirmed=await api('confirm',{lease});while(confirmed.waitMs>0){await sleep(confirmed.waitMs);confirmed=await api('confirm',{lease});}
   lastRequest=now();const result=await request(path,options);
   if([401,403,429].includes(result.status)||/captcha|verify you are human|just a moment|cf-chl-/i.test(result.body.slice(0,20000)))throw pauseError('Drop.solar refused requests (HTTP '+result.status+'); owner review required');
   if(result.status>=500)throw pauseError('Drop.solar is unavailable (HTTP '+result.status+'); owner review required');
   return result;
  };
  try{
   if(robots===undefined){const r=await get('/robots.txt');if(r.status!==200&&r.status!==404)throw pauseError('Cannot verify Drop.solar robots policy (HTTP '+r.status+')');robots=r.status===200?r.body:'';
    const crawl=[...robots.matchAll(/^\s*crawl-delay\s*:\s*([\d.]+)/gim)].map(m=>Number(m[1])*1000);if(crawl.length)delay=Math.max(delay,...crawl);if(delay>900000)throw pauseError('Published crawl delay exceeds the bounded worker budget; owner review required');
   }
   const lookup=await get('/api/url-lookup',{method:'POST',body:JSON.stringify({url:job.url})});if(lookup.status!==200)throw Error('URL lookup failed (HTTP '+lookup.status+')');
   const found=JSON.parse(lookup.body).found;if(!found){await api('finish',{lease,id:job.id,status:'not_found',reason:'No Drop.solar page for this retailer URL'});processed++;continue;}
   const path=dropPagePath(found);if(!path)throw Error('Unexpected URL lookup response');sourceUrl='https://drop.solar'+path;
   const page=await get(path);if(page.status!==200)throw Error('Product page failed (HTTP '+page.status+')');
   const data=parseDropHistory(page.body,path);
   if(!dropIdentity(job.p,job.o,data.product)){await api('finish',{lease,id:job.id,status:'unmatched',sourceUrl,reason:'Retailer/model/package identity requires review'});processed++;continue;}
   if(!data.history.length){await api('finish',{lease,id:job.id,status:'complete',sourceUrl,rows:0,reason:'Source has no recorded changes'});processed++;continue;}
   const source={id:createHash('sha256').update(JSON.stringify({sourceUrl,product:data.product,history:data.history})).digest('hex'),label:'Drop.solar · '+job.o.retailer,url:sourceUrl,precision:'timestamp',startDate:data.history[0].date,endDate:data.history.at(-1).date};
   for(let i=0;i<data.history.length;i+=200){const rows=data.history.slice(i,i+200).map(r=>({...r,name:data.product.name,link:data.product.productUrl,packQuantity:job.o.packQuantity,offerId:job.o.id}));
    const result=await api('import',{source,dropProduct:data.product,rows});inserted+=result.inserted;
   }
   await api('finish',{lease,id:job.id,status:'complete',sourceUrl,rows:inserted});log({productId:job.p.id,retailer:job.o.retailer,status:'complete',inserted});processed++;
  }catch(e){
   if(e.pause){await api('pause',{lease,reason:e.message});log({paused:true,reason:e.message});return;}
   if(e.budget){log({deferred:true});return;}
   // Identity/parser failures are review items, not permission to guess or hammer the source.
   const review=/identity|ambiguous|conflict|history|timestamp/i.test(e.message);
   await api('finish',{lease,id:job.id,status:review?'unmatched':'retry',sourceUrl,rows:inserted,reason:e.message.slice(0,500)});log({productId:job.p?.id,status:review?'unmatched':'retry',reason:e.message.slice(0,200)});if(!review)return;processed++;
  }
 }
 log({processed,budgetReached:now()+60000>=deadline});
}
async function main(){
 const args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1];let token=process.env.PV_COLLECTOR_TOKEN||process.env.COLLECTOR_TOKEN;
 if(!token&&args.includes('--env-file')){const env=await readFile(option('--env-file'),'utf8');token=env.match(/^COLLECTOR_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^(["'])(.*)\1$/,'$2');}
 const origin=process.env.PV_API_ORIGIN||'https://pvpartpicker.fwad101.chatgpt.site';if(!['https://pvpartpicker.fwad101.chatgpt.site','http://127.0.0.1:5191'].includes(origin)||!token)throw Error('Configure the existing PV API origin and collector credential');
 const api=async(action,data={})=>{const r=await fetch(origin+'/api/'+(action==='import'?'history-import':'history-backfill'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(action==='import'?data:{action,...data}),signal:AbortSignal.timeout(90000)});const result=await r.json();if(!r.ok)throw Error(result.error||'Backfill API failed');return result;};
 if(args.includes('--status')){console.log(await api('status'));return;}if(args.includes('--seed'))console.log(await api('seed'));
 const minutes=args.includes('--minutes')?Number(option('--minutes')):45,maxJobs=args.includes('--max-jobs')?Number(option('--max-jobs')):10000;
 if(!Number.isFinite(minutes)||minutes<1||minutes>45||!Number.isInteger(maxJobs)||maxJobs<1)throw Error('Invalid worker budget');
 await runBackfill({api,budgetMs:minutes*60000,maxJobs,request:async(path,options)=>{
  const r=await fetch('https://drop.solar'+path,{...options,redirect:'error',headers:{'User-Agent':'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)','Content-Type':'application/json'},signal:AbortSignal.timeout(25000)});
  const reader=r.body?.getReader();let size=0,body='';if(reader){const decoder=new TextDecoder();while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>8_000_000){await reader.cancel();throw Error('Source page too large');}body+=decoder.decode(chunk.value,{stream:true});}body+=decoder.decode();}return {status:r.status,body};
 }});console.log(await api('status'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
