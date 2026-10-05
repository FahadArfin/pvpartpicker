import {load} from 'cheerio';
import {parseProductPage,robotsAllows,classify,mergeProducts} from '../lib/retailers.ts';
import {publicSourceUrl,emptyProgress} from '../lib/scraper-config.ts';
import {fetchSource} from './scraper-network.mjs';
const locs=xml=>[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
const text=html=>load(html||'')('body').text().replace(/\s+/g,' ').trim();
export async function scrapeSource(job,{event,publish},transport=fetchSource){
 const site=job.site,progress=emptyProgress(),products=[],deadline=Date.now()+12*60000;let robots='',last=0,cancelled=false,budget=false,delay=site.delaySeconds,discoveryNext=job.discoveryOffset||0;
 const report=async(e)=>{const result=await event({...progress},e?{...e,id:crypto.randomUUID()}:undefined);if(result.cancel)cancelled=true;};
 async function request(url,policy=false,redirects=0){
  url=publicSourceUrl(url,site.origin).href;progress.currentUrl=url;
  if(cancelled)throw new Error('cancelled');if(Date.now()>=deadline){budget=true;throw new Error('Collection time budget reached');}
  if(!policy&&!robotsAllows(robots,new URL(url).pathname+new URL(url).search)){progress.errors++;await report({url,status:'skipped',durationMs:0,message:'Blocked by robots policy'});throw new Error('robots_disallowed');}
  const wait=Math.max(0,delay*1000+Math.random()*site.jitterSeconds*1000-(Date.now()-last));
  if(Date.now()+wait>=deadline){budget=true;throw new Error('Collection time budget reached');}
  progress.message=wait?'Waiting for the configured request spacing.':'Preparing source request.';await report();if(cancelled)throw new Error('cancelled');await new Promise(r=>setTimeout(r,wait));
  // A pause/cancel made during the delay applies before the next source request.
  progress.message='Fetching public source.';await report();if(cancelled)throw new Error('cancelled');last=Date.now();const start=Date.now();progress.requests++;let response;
  try{
   response=await transport(url);
   if(response.status>=300&&response.status<400){if(redirects>=3)throw new Error('Too many redirects');const dest=publicSourceUrl(response.location,url);if(dest.origin!==site.origin)throw new Error('Cross-origin redirect rejected');await report({url,status:'ok',httpStatus:response.status,durationMs:Date.now()-start,message:'Same-origin redirect'});return request(dest.href,policy,redirects+1);}
   if(!(policy&&response.status===404)&&(response.status<200||response.status>=300))throw new Error('HTTP '+response.status);
   if(/verify you are human|cf-chl-|captcha-container/i.test(response.text))throw new Error('Bot challenge; no bypass attempted');
   await report({url,status:'ok',httpStatus:response.status,durationMs:Date.now()-start,message:policy?'Robots policy checked':'Fetched public source'});return response.status===404?'':response.text;
  }catch(e){progress.errors++;progress.message=e.message;await report({url,status:'error',httpStatus:response?.status||null,durationMs:Date.now()-start,message:e.message.slice(0,1000)});throw e;}
 }
 function collect(html,url){const found=parseProductPage(html,site,url,new Date().toISOString());products.push(...found);progress.checked++;progress.found+=found.length;}
 function synthetic(p){collect('<script type="application/ld+json">'+JSON.stringify(p).replace(/<\//g,'<\\/')+'</script>',p.offers.url);}
 let failed=false;
 try{
  robots=await request(site.origin+'/robots.txt',true);
  const published=[...robots.matchAll(/crawl-delay:\s*(\d+(?:\.\d+)?)/gi)].map(m=>Number(m[1]));delay=Math.max(delay,...published,0);
  if(delay>300)throw new Error('Published crawl delay exceeds the supported 300-second limit. Pause this source for policy review.');
  if(site.adapter==='shopify'||site.adapter==='woocommerce'){
   progress.planned=site.feedPages;await report();
   for(let page=1;page<=site.feedPages;page++){
    if(site.adapter==='shopify'){
     const data=JSON.parse(await request(site.origin+`/products.json?limit=250&page=${page}`));if(!Array.isArray(data.products))throw new Error('Source is not a Shopify product feed');
     for(const p of data.products)for(const v of p.variants||[]){const name=text(p.title)+(v.title&&v.title!=='Default Title'?' — '+v.title:'');if(!classify(name))continue;synthetic({'@type':'Product',name,description:p.body_html||'',image:p.images?.[0]?.src||'',sku:String(v.id),brand:p.vendor,offers:{'@type':'Offer',price:v.price,priceCurrency:'USD',availability:v.available===true?'https://schema.org/InStock':v.available===false?'https://schema.org/OutOfStock':'',url:site.origin+`/products/${p.handle}?variant=${v.id}`}});}
    }else{
     const rows=JSON.parse(await request(site.origin+`/wp-json/wc/store/v1/products?per_page=100&page=${page}`));if(!Array.isArray(rows))throw new Error('Source is not a WooCommerce Store API feed');
     for(const p of rows){if(p.type==='variable'||p.prices?.currency_code!=='USD')continue;synthetic({'@type':'Product',name:text(p.name),description:p.description||p.short_description||'',image:p.images?.[0]?.src||'',sku:p.sku||String(p.id),brand:p.brands?.[0]?.name,offers:{'@type':'Offer',price:Number(p.prices?.price)/10**Number(p.prices?.currency_minor_unit??2),priceCurrency:'USD',availability:p.is_in_stock===true?'https://schema.org/InStock':p.is_in_stock===false?'https://schema.org/OutOfStock':'',url:p.permalink}});}
    }await report();
   }
  }else{
   const known=[...new Set([...site.urls,...(job.knownUrls||[])])],discovered=[];
   if(site.adapter==='sitemap'){
    const queue=[site.origin+site.startPath];let documents=0;
    while(queue.length&&documents++<5){const xml=await request(queue.shift());if(!/<(?:urlset|sitemapindex)\b/i.test(xml))throw new Error('Starting path is not a sitemap');for(const url of locs(xml)){try{publicSourceUrl(url,site.origin);}catch{continue;}if(/<sitemapindex/i.test(xml))queue.push(url);else if(!/\/category|\/blog|\/learn|\?/.test(url))discovered.push(url);}if(discovered.length>=2000)break;}
   }
   const valid=rows=>rows.filter(url=>{try{publicSourceUrl(url,site.origin);return true;}catch{return false;}});
   const discovery=valid([...new Set(discovered)].slice(0,2000));
   const offset=discovery.length?discoveryNext%discovery.length:0;
   const rotated=[...discovery.slice(offset),...discovery.slice(0,offset)];
   // Reserve discovery slots even when the existing catalog fills the page budget.
   const slots=discovery.length?Math.max(1,Math.ceil(site.maxPages/5)):0;
   const fresh=rotated.filter(u=>!known.includes(u)).slice(0,slots);
   const selected=fresh.length?fresh:rotated.slice(0,slots);
   const configured=valid([...new Set(site.urls)]),pageOffset=configured.length?discoveryNext%configured.length:0;
   const urls=site.adapter==='pages'?[...configured.slice(pageOffset),...configured.slice(0,pageOffset)].slice(0,site.maxPages):[...new Set([...selected,...valid(known),...rotated])].slice(0,site.maxPages);
   progress.planned=urls.length;await report();
   for(const [index,url] of urls.entries()){
    let consumed=false;
    try{const html=await request(url);consumed=true;collect(html,url);progress.message='Product page checked';await report();}
    catch(e){if(!budget&&!cancelled)consumed=true;if(cancelled||budget||/HTTP (401|403|429)|challenge|non-public|Cross-origin/.test(e.message))throw e;progress.message='Skipped page: '+e.message;await report();}
    finally{if(consumed){if(site.adapter==='pages')discoveryNext=(pageOffset+index+1)%configured.length;else if(discovery.includes(url)&&(!known.includes(url)||selected.includes(url)))discoveryNext=(discovery.indexOf(url)+1)%discovery.length;}}
   }
  }
 }catch(e){failed=true;progress.message=e.message;}
 // Keep successfully parsed pages from partial runs. Cancellation retains only observations already committed.
 if(!cancelled){const rows=mergeProducts(products);for(let i=0;i<rows.length;i+=15){const result=await publish(rows.slice(i,i+15));progress.inserted+=result.inserted;progress.quarantined+=result.quarantined;await report();if(cancelled)break;}}
 const status=cancelled?'cancelled':failed||progress.errors?(progress.inserted?'partial':'failed'):progress.found?'succeeded':'partial';
 if(status==='succeeded')progress.message=`Completed: ${progress.checked} parsed entries, ${progress.inserted} accepted observations.`;
 else if(!failed&&!cancelled)progress.message=progress.found?'Completed with request errors':'No supported USD product offers found. Check the adapter or URLs.';
 return {status,progress,discoveryNext};
}
