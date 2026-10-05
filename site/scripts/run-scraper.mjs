import {scrapeSource} from './scrape-source.mjs';
if(!process.env.PV_API_ORIGIN||!process.env.PV_COLLECTOR_TOKEN)throw new Error('Collector API origin and token are required');
const origin=new URL(process.env.PV_API_ORIGIN);if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Collector API must use HTTPS');
const headers={Authorization:'Bearer '+process.env.PV_COLLECTOR_TOKEN,'Content-Type':'application/json'};
async function api(path,data){
 let last;
 for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(new URL('/api/'+path,origin),{method:'POST',headers,body:JSON.stringify(data),signal:AbortSignal.timeout(120000)});if(!r.ok){const message=(await r.text()).slice(0,300);if(r.status<500)throw Object.assign(new Error('Collector API '+r.status+': '+message),{permanent:true});throw new Error('Collector API '+r.status);}return await r.json();}catch(e){last=e;if(e.permanent)throw e;if(attempt<2)await new Promise(r=>setTimeout(r,2000*(attempt+1)));}}
 throw last;
}
const worker=d=>api('scraper/worker',d),start=Date.now();let total=0;
while(Date.now()-start<30*60000){
 const results=await Promise.allSettled(Array.from({length:2},async()=>{
  const {jobs}=await worker({action:'claim',claimId:crypto.randomUUID(),runUrl:process.env.GITHUB_RUN_ID?`https://github.com/FahadArfin/pvpartpicker/actions/runs/${process.env.GITHUB_RUN_ID}`:undefined});const job=jobs[0];if(!job)return false;
  const base={id:job.id,lease:job.lease};let lastProgress=job.progress;
  try{const result=await scrapeSource(job,{event:(progress,event)=>{lastProgress=progress;return worker({...base,action:'event',progress,event});},publish:products=>api('ingest',{products,reports:[]})});await worker({...base,action:'finish',...result});console.log(JSON.stringify({site:job.site.name,...result}));total++;return true;}
  catch(e){lastProgress={...lastProgress,message:e.message.slice(0,1500)};try{await worker({...base,action:'finish',status:lastProgress.inserted?'partial':'failed',progress:lastProgress});}catch{/* Lease recovery handles an unreachable API. */}console.error(JSON.stringify({site:job.site.name,error:e.message}));throw e;}
 }));if(results.some(r=>r.status==='rejected')){process.exitCode=1;break;}if(results.every(r=>r.status==='fulfilled'&&!r.value))break;
}
if(total)await api('process-alerts',{});
console.log(JSON.stringify({completedJobs:total}));
