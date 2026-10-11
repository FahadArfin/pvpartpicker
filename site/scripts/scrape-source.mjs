import {load} from 'cheerio';
import {parseProductPage,robotsAllows,classify,mergeProducts} from '../lib/retailers.ts';
import {publicSourceUrl,emptyProgress} from '../lib/scraper-config.ts';
import {fetchSource} from './scraper-network.mjs';
const locs=xml=>[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
const text=html=>load(html||'')('body').text().replace(/\s+/g,' ').trim();
export async function scrapeSource(job,{event,publish},transport=fetchSource){
 const site=job.site,progress=emptyProgress(),products=[],deadline=Date.now()+12*60000;let robots='',last=0,cancelled=false,budget=false,delay=site.delaySeconds,discoveryNext=job.discoveryOffset||0,refreshNext=job.refreshOffset||0,malformedFeed=false,refreshComplete=false,refreshAdvanced=false,blocked=false;
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
   const feedEnd=response.status===400&&/\/wp-json\/wc\/store\/v1\/products/.test(url)&&/"code"\s*:\s*"(?:woocommerce_)?rest_(?:product|post)_invalid_page_number"/.test(response.text);
   if(!(policy&&response.status===404)&&!feedEnd&&(response.status<200||response.status>=300))throw new Error('HTTP '+response.status);
   if(/verify you are human|cf-chl-|captcha-container/i.test(response.text))throw new Error('Bot challenge; no bypass attempted');
   await report({url,status:'ok',httpStatus:response.status,durationMs:Date.now()-start,message:policy?'Robots policy checked':'Fetched public source'});return response.status===404?'':response.text;
  }catch(e){progress.errors++;progress.message=e.message;await report({url,status:'error',httpStatus:response?.status||null,durationMs:Date.now()-start,message:e.message.slice(0,1000)});throw e;}
 }
 function collect(html,url){const found=parseProductPage(html,site,url,new Date().toISOString());products.push(...found);progress.checked++;progress.found+=found.length;return found.length;}
 async function feedData(body,url){
  if(/^(?:forbidden|access denied|unauthorized|authentication required)\b/i.test(text(body))||/^\s*(?:<!doctype|<html)/i.test(body)&&/forbidden|access denied/i.test(body.slice(0,4000))){progress.errors++;await report({url,status:'error',httpStatus:200,durationMs:0,message:'Source access denied; no fallback attempted'});throw new Error('Source access denied; no fallback attempted');}
  try{return JSON.parse(body);}catch{malformedFeed=true;progress.errors++;await report({url,status:'error',httpStatus:200,durationMs:0,message:'Product feed returned malformed JSON; known listings will be checked.'});throw new Error('Malformed product feed');}
 }
 function synthetic(p){collect('<script type="application/ld+json">'+JSON.stringify(p).replace(/<\//g,'<\\/')+'</script>',p.offers.url);}
 let failed=false;
 try{
  robots=await request(site.origin+'/robots.txt',true);
  const published=[...robots.matchAll(/crawl-delay:\s*(\d+(?:\.\d+)?)/gi)].map(m=>Number(m[1]));delay=Math.max(delay,...published,0);
  if(delay>300)throw new Error('Published crawl delay exceeds the supported 300-second limit. Pause this source for policy review.');
  if(site.adapter==='shopify'||site.adapter==='woocommerce'){
   progress.planned=site.feedPages;await report();
   const firstPage=discoveryNext+1;
   for(let page=firstPage;page<firstPage+site.feedPages;page++){
    let finalPage=false;
    if(site.adapter==='shopify'){
     const feed=new URL(/\/products\.json(?:\?|$)/.test(site.startPath)?site.startPath:'/products.json',site.origin);feed.searchParams.set('limit','250');feed.searchParams.set('page',String(page));
     const data=await feedData(await request(feed.href),feed.href);if(!Array.isArray(data.products))throw new Error('Source is not a Shopify product feed');
     if(!data.products.length){discoveryNext=0;break;}
     finalPage=data.products.length<250;
     for(const p of data.products)for(const v of p.variants||[]){const name=text(p.title)+(v.title&&v.title!=='Default Title'?' — '+v.title:'');if(!classify(name))continue;synthetic({'@type':'Product',name,description:p.body_html||'',image:p.images?.[0]?.src||'',sku:String(v.id),brand:p.vendor,offers:{'@type':'Offer',price:v.price,referencePrice:v.compare_at_price,priceCurrency:'USD',availability:v.available===true?'https://schema.org/InStock':v.available===false?'https://schema.org/OutOfStock':'',url:site.origin+`/products/${p.handle}?variant=${v.id}`}});}
    }else{
     const feedUrl=site.origin+`/wp-json/wc/store/v1/products?per_page=100&page=${page}`,rows=await feedData(await request(feedUrl),feedUrl);
     if(!Array.isArray(rows)&&/^(?:woocommerce_)?rest_(?:product|post)_invalid_page_number$/.test(rows.code||'')){discoveryNext=0;break;}
     if(!Array.isArray(rows))throw new Error('Source is not a WooCommerce Store API feed');
     if(!rows.length){discoveryNext=0;break;}
     finalPage=rows.length<100;
     for(const p of rows){if(p.type==='variable'||p.prices?.currency_code!=='USD')continue;synthetic({'@type':'Product',name:text(p.name),description:p.description||p.short_description||'',image:p.images?.[0]?.src||'',sku:p.sku||String(p.id),brand:p.brands?.[0]?.name,offers:{'@type':'Offer',price:Number(p.prices?.price)/10**Number(p.prices?.currency_minor_unit??2),referencePrice:Number(p.prices?.regular_price)/10**Number(p.prices?.currency_minor_unit??2),priceCurrency:'USD',availability:p.is_in_stock===true?'https://schema.org/InStock':p.is_in_stock===false?'https://schema.org/OutOfStock':'',url:p.permalink}});}
    }discoveryNext=finalPage||page>=1999?0:page;await report();if(finalPage)break;
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
   const tracked=valid(known),refreshOffset=tracked.length?refreshNext%tracked.length:0,rotatedTracked=[...tracked.slice(refreshOffset),...tracked.slice(0,refreshOffset)];
   // Refresh one tracked listing before discovery so slow source pacing cannot
   // permanently consume the entire run on previously unknown URLs.
   const urls=site.adapter==='pages'?[...configured.slice(pageOffset),...configured.slice(0,pageOffset)].slice(0,site.maxPages):[...new Set([...rotatedTracked.slice(0,1),...selected,...rotatedTracked.slice(1),...rotated])].slice(0,site.maxPages);
   progress.planned=urls.length;await report();
   for(const [index,url] of urls.entries()){
    let consumed=false;
    try{const html=await request(url);consumed=true;const found=collect(html,url);progress.message=found?'Product page checked':'No supported USD offer on this page';await report(found?undefined:{url,status:'skipped',httpStatus:200,durationMs:0,message:progress.message});}
    catch(e){if(!budget&&!cancelled)consumed=true;if(cancelled||budget||/HTTP (401|403|429)|challenge|non-public|Cross-origin/.test(e.message))throw e;progress.message='Skipped page: '+e.message;await report();}
    finally{if(consumed){if(site.adapter==='pages'){discoveryNext=(pageOffset+index+1)%configured.length;refreshAdvanced=true;if(pageOffset+index+1>=configured.length)refreshComplete=true;}else{const at=tracked.indexOf(url);if(at>=0&&at===refreshNext%tracked.length){refreshNext=(at+1)%tracked.length;refreshAdvanced=true;if(at===tracked.length-1)refreshComplete=true;}if(discovery.includes(url)&&(!known.includes(url)||selected.includes(url)))discoveryNext=(discovery.indexOf(url)+1)%discovery.length;}}}
   }
  }
 }catch(e){failed=true;progress.message=e.message;blocked=/HTTP (401|403|429)|challenge|access denied|non-public|Cross-origin|robots_disallowed/.test(e.message);}
 if(malformedFeed&&!cancelled&&!budget){
  discoveryNext=0;
  // Only verified WooCommerce offer IDs may be refreshed from the page fallback.
  // Shopify parent pages cannot establish the selected variant's price.
  if(site.adapter==='woocommerce'){
   const known=[...new Set(job.knownUrls||[])],offset=known.length?refreshNext%known.length:0,allowed=new Set(job.knownOfferIds||[]),urls=[...known.slice(offset),...known.slice(0,offset)].slice(0,site.maxPages);
   progress.planned+=urls.length;
   for(const url of urls){let consumed=false;try{
    const body=await request(url);consumed=true;const found=parseProductPage(body,site,url,new Date().toISOString()).map(p=>({...p,offers:p.offers.filter(o=>allowed.has(o.id))})).filter(p=>p.offers.length);products.push(...found);progress.checked++;progress.found+=found.length;await report();
   }catch(e){if(!budget&&!cancelled)consumed=true;progress.message=e.message;blocked=/HTTP (401|403|429)|challenge|access denied|non-public|Cross-origin|robots_disallowed/.test(e.message);if(cancelled||budget||blocked)break;}
   finally{if(consumed){const at=known.indexOf(url);refreshNext=(at+1)%known.length;refreshAdvanced=true;if(at===known.length-1)refreshComplete=true;}}}
  }
 }
 // Keep successfully parsed pages from partial runs. Cancellation retains only observations already committed.
 if(!cancelled){const rows=mergeProducts(products);for(let i=0;i<rows.length;i+=15){const result=await publish(rows.slice(i,i+15));progress.inserted+=result.inserted;progress.quarantined+=result.quarantined;await report();if(cancelled)break;}}
 const status=cancelled?'cancelled':failed||progress.errors?(progress.inserted?'partial':'failed'):progress.found?'succeeded':'partial';
 if(status==='succeeded')progress.message=`Completed: ${progress.checked} parsed entries, ${progress.inserted} accepted observations.`;
 else if(!failed&&!cancelled)progress.message=progress.found?'Completed with request errors':'No supported USD product offers found. Check the adapter or URLs.';
 const continuation=!cancelled&&!blocked&&((['shopify','woocommerce'].includes(site.adapter)&&discoveryNext>0&&progress.found>0)||(refreshAdvanced&&!refreshComplete));
 return {status,progress,discoveryNext,refreshNext,continuation};
}
