import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseHistoryCsv,historyIdentity,archiveUrl} from '../lib/historical-import.ts';
const args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1],has=k=>args.includes(k);
if(!has('--plan'))throw Error('Use --plan PATH; planning also requires --csv PATH --catalog PATH --archive PATH. --apply submits an existing reviewed plan.');
const planPath=option('--plan');
if(!has('--apply')){
 for(const key of ['--csv','--catalog','--archive'])if(!has(key))throw Error('Missing '+key);
 const csv=await fs.readFile(option('--csv'),'utf8'),catalog=JSON.parse(await fs.readFile(option('--catalog'),'utf8'));
 const archiveHash=createHash('sha256').update(await fs.readFile(option('--archive'))).digest('hex');
 const records=parseHistoryCsv(csv),index=new Map();
 for(const p of catalog.products)for(const o of p.offers)if(o.retailerId==='signature-solar'){const key=archiveUrl(o.url);if(key)index.set(key,[...(index.get(key)||[]),{p,o}]);}
 const rows=[],unresolved=new Map(),dedup=new Map();let duplicates=0;
 for(const r of records){const matches=(index.get(archiveUrl(r.link))||[]).filter(({p,o})=>historyIdentity(p,o,r));
  if(matches.length!==1){unresolved.set(r.link,(unresolved.get(r.link)||0)+1);continue;}
  const {o}=matches[0],key=o.id+'|'+r.date,price=Number(r.price);
  if(!Number.isFinite(price)||price<=0)throw Error('Invalid archive price');
  if(dedup.has(key)){if(dedup.get(key)!==price)throw Error('Conflicting historical daily price');duplicates++;continue;}
  dedup.set(key,price);rows.push({offerId:o.id,name:r.name,link:r.link,packQuantity:o.packQuantity,date:r.date,price});
 }
 rows.sort((a,b)=>a.offerId.localeCompare(b.offerId)||a.date.localeCompare(b.date));
 const dates=records.map(r=>r.date).sort();const source={id:archiveHash,label:'Signature Solar archive shared by warklantd',url:'https://diysolarforum.com/threads/price-history-tool-for-signature-solar-current-connected-shopsolar-rich-solar.117159/post-1651990',precision:'day',startDate:dates[0],endDate:dates.at(-1)};
 const summary={archiveHash,csvHash:createHash('sha256').update(csv).digest('hex'),archiveRows:records.length,dates:new Set(dates).size,matchedRows:rows.length,matchedOffers:new Set(rows.map(r=>r.offerId)).size,duplicates,unresolvedRows:[...unresolved.values()].reduce((a,b)=>a+b,0),unresolvedUrls:unresolved.size,startDate:source.startDate,endDate:source.endDate};
 await fs.writeFile(planPath,JSON.stringify({source,summary,rows},null,2)+'\n');await fs.writeFile(planPath+'.unresolved.json',JSON.stringify([...unresolved].map(([url,rows])=>({url,rows})),null,2)+'\n');console.log(summary);
}else{
 const plan=JSON.parse(await fs.readFile(planPath,'utf8')),origin=option('--origin');
 if(!origin||!/^https:\/\/pvpartpicker\.fwad101\.chatgpt\.site$/.test(origin))throw Error('Explicit production origin required');
 let token=process.env.COLLECTOR_TOKEN;
 if(!token&&has('--env-file')){const env=await fs.readFile(option('--env-file'),'utf8');token=env.match(/^COLLECTOR_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^(["'])(.*)\1$/,'$2');}
 if(!token)throw Error('Collector credential required');
 let inserted=0;for(let i=0;i<plan.rows.length;i+=200){const rows=plan.rows.slice(i,i+200);const res=await fetch(origin+'/api/history-import',{method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({source:plan.source,rows}),signal:AbortSignal.timeout(30000)});const data=await res.json();if(!res.ok)throw Error('Import stopped: '+(data.error||res.status));inserted+=data.inserted;console.log({submitted:Math.min(i+200,plan.rows.length),total:plan.rows.length,inserted});}
 await fs.writeFile(planPath+'.result.json',JSON.stringify({sourceId:plan.source.id,submitted:plan.rows.length,inserted,finishedAt:new Date().toISOString()},null,2)+'\n');
}
