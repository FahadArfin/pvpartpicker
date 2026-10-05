import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {robotsAllows} from '../lib/retailers.ts';
import {specificationRowsFromHtml} from '../lib/specification-html.ts';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2);const dir=pathToFileURL(resolve(args[args.indexOf('--cache')+1]||'../output/spec-research')+'/');await mkdir(dir,{recursive:true});
const catalog=JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url),'utf8'));
const groups=new Map();
for(const p of catalog.products){const u=new URL(p.sourceUrl);u.search='';const list=groups.get(u.origin)||new Set();list.add(u.href);groups.set(u.origin,list);}
const hash=url=>createHash('sha256').update(url).digest('hex').slice(0,16);
const clean=t=>t.replace(/\s+/g,' ').trim();
const sources={};const failures=[];
function parse(html,url){const $=load(html);$('script,style,nav,header,footer').remove();let scope=$('main').first();if(!scope.length)scope=$('body');
 const docs=[];scope.find('a[href]').each((_,e)=>{const a=$(e),text=clean(a.text()+' '+a.find('img').attr('alt'));let href;try{href=new URL(a.attr('href'),url);}catch{return;}if(href.protocol!=='https:'||!(/\.pdf(?:$|\?)/i.test(href.href)&&/datasheet|spec(?:ification)?|manual|user.?guide|technical/i.test(text+' '+href.pathname)))return;const label=clean(a.text()||a.find('img').attr('alt')||href.pathname.split('/').at(-1));if(!docs.some(d=>d.url===href.href))docs.push({label:label.slice(0,150),url:href.href});});
 const title=clean($('h1').first().text());
 return {url,title,rows:specificationRowsFromHtml(html,url),documents:docs,checkedAt:new Date().toISOString()};
}
await Promise.all([...groups].map(async([origin,urls])=>{let last=0;let delay=2000;let blocked=false;let robots='';
 const request=async(url,policy=false)=>{await new Promise(r=>setTimeout(r,Math.max(0,delay-(Date.now()-last))));last=Date.now();if(!policy&&!robotsAllows(robots,new URL(url).pathname))throw Error('robots_disallowed');const res=await fetch(url,{headers:{'User-Agent':'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)'},signal:AbortSignal.timeout(25000)});if([401,403,429].includes(res.status)){blocked=true;throw Error('source_rejected_'+res.status);}if(!res.ok&&!(policy&&res.status===404))throw Error('http_'+res.status);const html=await res.text();if(html.length>8e6)throw Error('response_too_large');if(/cf-chl-|verify you are human|captcha-container/i.test(html)){blocked=true;throw Error('challenge_no_bypass');}return html;};
 try{robots=await request(origin+'/robots.txt',true);const delays=[...robots.matchAll(/crawl-delay:\s*(\d+)/gi)].map(m=>Number(m[1])*1000);delay=Math.max(delay,...delays);await writeFile(new URL(hash(origin)+'-robots.txt',dir),robots);}catch(e){blocked=true;failures.push({url:origin,error:e.message});}
 const ordered=[...urls].sort((a,b)=>Number(/renogy-n-type-solar-panel/.test(b))-Number(/renogy-n-type-solar-panel/.test(a)));
 for(const url of ordered){const cache=new URL(hash(url)+'.json',dir);try{sources[url]=JSON.parse(await readFile(cache,'utf8'));continue;}catch{}if(blocked){failures.push({url,error:'origin_blocked'});continue;}
  try{const html=await request(url);const result=parse(html,url);sources[url]=result;await writeFile(cache,JSON.stringify(result));await writeFile(new URL(hash(url)+'.html',dir),html);}catch(e){failures.push({url,error:e.message});}
  await writeFile(new URL('progress.json',dir),JSON.stringify({pages:Object.keys(sources).length,failures:failures.length,last:url}));
 }
 console.log(JSON.stringify({origin,complete:true,pages:[...urls].filter(u=>sources[u]).length,failures:failures.filter(f=>f.url.startsWith(origin)).length}));
}));
await writeFile(new URL('sources.json',dir),JSON.stringify({sources,failures},null,2));
console.log(JSON.stringify({pages:Object.keys(sources).length,failures:failures.length,documents:Object.values(sources).reduce((n,s)=>n+s.documents.length,0)}));
