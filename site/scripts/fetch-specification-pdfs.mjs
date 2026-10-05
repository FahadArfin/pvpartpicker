import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {robotsAllows} from '../lib/retailers.ts';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2);const dir=pathToFileURL(resolve(args[args.indexOf('--cache')+1]||'../output/spec-research')+'/');await mkdir(new URL('pdf/',dir),{recursive:true});
const {sources}=JSON.parse(await readFile(new URL('sources.json',dir),'utf8'));
const selected=new Map();
for(const source of Object.values(sources)){
 const sheets=source.documents;
 for(const doc of sheets){const key=doc.url.split('?')[0];if(!selected.has(key))selected.set(key,{...doc,pages:[]});selected.get(key).pages.push(source.url);}
}
const groups=new Map();for(const [key,doc] of selected){const origin=new URL(key).origin;const a=groups.get(origin)||[];a.push(doc);groups.set(origin,a);}
const results=[],failures=[];const hash=url=>createHash('sha256').update(url.split('?')[0]).digest('hex').slice(0,16);
await Promise.all([...groups].map(async([origin,docs])=>{
 let robots='',blocked=false,delay=2000;try{const res=await fetch(origin+'/robots.txt',{signal:AbortSignal.timeout(20000)});if([401,403,429].includes(res.status)){blocked=true;throw Error('robots_rejected');}if(res.ok)robots=await res.text();else if(res.status!==404)throw Error('robots_unavailable');delay=Math.max(delay,...[...robots.matchAll(/crawl-delay:\s*(\d+)/gi)].map(m=>Number(m[1])*1000));}catch(e){failures.push({url:origin,error:e.message});blocked=true;}
 for(const doc of docs){const filename=hash(doc.url)+'.pdf';try{await readFile(new URL('pdf/'+filename,dir));results.push({...doc,filename});continue;}catch{}
  if(blocked||!robotsAllows(robots,new URL(doc.url).pathname)){failures.push({url:doc.url,error:'not_permitted'});continue;}
  await new Promise(r=>setTimeout(r,delay));
  try{const res=await fetch(doc.url,{headers:{'User-Agent':'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)'},signal:AbortSignal.timeout(25000)});if([401,403,429].includes(res.status)){blocked=true;throw Error('source_rejected_'+res.status);}if(!res.ok)throw Error('http_'+res.status);const length=Number(res.headers.get('content-length'));if(length>25e6)throw Error('file_too_large');const data=Buffer.from(await res.arrayBuffer());if(data.length>25e6||data.subarray(0,5).toString()!=='%PDF-')throw Error('invalid_pdf');await writeFile(new URL('pdf/'+filename,dir),data);results.push({...doc,filename});}catch(e){failures.push({url:doc.url,error:e.message});}
  await writeFile(new URL('pdf-progress.json',dir),JSON.stringify({complete:results.length,failures:failures.length,total:selected.size}));
 }
 console.log(JSON.stringify({origin,done:docs.length}));
}));
await writeFile(new URL('pdf-index.json',dir),JSON.stringify({documents:results,failures},null,2));console.log(JSON.stringify({complete:results.length,failures:failures.length,total:selected.size}));
