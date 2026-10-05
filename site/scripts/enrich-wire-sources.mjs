// Reconcile the collected wire variants with explicit source-page facts. No
// electrical ratings are estimated, and existing specification records are kept.
import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {categorizeProduct,robotsAllows} from '../lib/retailers.ts';
import {buildSpecification} from '../lib/specifications.ts';
import {specificationRowsFromHtml} from '../lib/specification-html.ts';
const data=new URL('../data/',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('catalog.json',data),'utf8'));
const details=JSON.parse(await readFile(new URL('specifications.json',data),'utf8'));
const audit=JSON.parse(await readFile(new URL('specification-audit.json',data),'utf8'));
const temco=new Map();let lastRequest=0;
async function request(url){await new Promise(r=>setTimeout(r,Math.max(0,10000-(Date.now()-lastRequest))));lastRequest=Date.now();const response=await fetch(url,{headers:{'User-Agent':'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)'},redirect:'error',signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('Source fetch failed: '+response.status);return response.text();}
const robots=await request('https://temcoindustrial.com/robots.txt');
for(const product of catalog.products.filter(p=>p.offers.some(o=>o.retailerId==='temco'))){
 if(!robotsAllows(robots,new URL(product.sourceUrl).pathname))throw new Error('Robots policy disallows product page');
 const html=await request(product.sourceUrl);const rows=specificationRowsFromHtml(html,product.sourceUrl);
 for(const [key,value]of rows)if(key.length<70&&value.length<180)product.specs[key.replace(/:$/,'').trim()]=value;
 product.description=load(html)('.productView-description').text().replace(/\s+/g,' ').trim().slice(0,6500)||product.description;
 temco.set(product.id,rows);
}
catalog.products=catalog.products.map(categorizeProduct);
let added=0;
for(const p of catalog.products){
 if(details[p.id])continue;
 const rows=temco.get(p.id)||[];
 const d=buildSpecification(p,rows.length?{url:p.sourceUrl,kind:'manufacturer',label:'TEMCo product specifications',checkedAt:p.verifiedAt,rows}:undefined);
 details[p.id]=d;added++;
 const sourced=d.groups.flatMap(g=>g.fields).some(f=>f.kind!=='listing');
 if(!sourced)audit.missing.push({productId:p.id,name:p.name,url:p.sourceUrl,category:p.category,reason:'Exact variant gauge and length come from the source listing. A separate technical table has not been collected.'});
}
audit.generatedAt=new Date().toISOString();audit.products=catalog.products.length;audit.categories={};
audit.datasheetProducts=0;audit.manualProducts=0;audit.tableProducts=0;audit.listingOnlyProducts=0;
for(const p of catalog.products){const d=details[p.id],kinds=new Set(d.groups.filter(g=>g.title!=='Identity').flatMap(g=>g.fields.map(f=>f.kind)));const sheet=kinds.has('datasheet'),manual=kinds.has('manual'),table=kinds.has('manufacturer')||kinds.has('retailer'),listingOnly=!sheet&&!manual&&!table;
 audit.datasheetProducts+=Number(sheet);audit.manualProducts+=Number(manual);audit.tableProducts+=Number(table);audit.listingOnlyProducts+=Number(listingOnly);
 const c=audit.categories[p.category]||{products:0,sheet:0,manual:0,table:0,listingOnly:0};c.products++;c.sheet+=Number(sheet);c.manual+=Number(manual);c.table+=Number(table);c.listingOnly+=Number(listingOnly);audit.categories[p.category]=c;
}
await writeFile(new URL('catalog.json',data),JSON.stringify(catalog,null,2));
await writeFile(new URL('specifications.json',data),JSON.stringify(details));
await writeFile(new URL('specification-audit.json',data),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({added,catalog:catalog.products.length,temcoTechnicalPages:temco.size}));
