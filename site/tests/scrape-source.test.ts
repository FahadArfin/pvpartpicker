import test from 'node:test';
import assert from 'node:assert/strict';
import {scrapeSource} from '../scripts/scrape-source.mjs';
const site={id:'test-solar',name:'Solar Store',origin:'https://solar-store.com',enabled:true,adapter:'pages',startPath:'/sitemap.xml',urls:['https://solar-store.com/panel'],schedule:'manual',frequencyMinutes:360,dailyTime:'06:17',weekdays:[0],delaySeconds:0,jitterSeconds:0,maxPages:5,feedPages:1};
const html='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'400W Solar Panel',sku:'pv400',offers:{'@type':'Offer',price:'120',priceCurrency:'USD',availability:'https://schema.org/InStock'}})+'</script>';
const makeHooks=()=>{const events:any[]=[],saved:any[]=[];return {events,saved,hooks:{event:async (_p:any,e:any)=>{if(e)events.push(e);return {cancel:false};},publish:async (products:any[])=>{saved.push(...products);return {inserted:products.length,quarantined:0};}}};};
test('job records real request events and publishes parsed USD prices with the registered source identity',async()=>{
 const h=makeHooks();const result=await scrapeSource({site,knownUrls:[]},h.hooks,async url=>({status:200,text:url.endsWith('/robots.txt')?'User-agent: *\nAllow: /':html}));
 assert.equal(result.status,'succeeded');assert.equal(result.progress.requests,2);assert.equal(h.saved[0].offers[0].price,120);assert.equal(h.saved[0].offers[0].retailerId,site.id);assert.equal(h.events.length,2);
});
test('full existing catalogs reserve rotating sitemap discovery slots across runs',async()=>{
 const h=makeHooks(),urls:string[]=[];const sitemap='<urlset>'+['new-a','new-b','old-a','old-b'].map(p=>'<url><loc>'+site.origin+'/'+p+'</loc></url>').join('')+'</urlset>';
 const job={site:{...site,adapter:'sitemap',urls:[],maxPages:2},knownUrls:[site.origin+'/old-a',site.origin+'/old-b']};
 const transport=async (url:string)=>{urls.push(url);return {status:200,text:url.endsWith('/robots.txt')?'':url.endsWith('/sitemap.xml')?sitemap:html};};
 const first=await scrapeSource(job,h.hooks,transport);assert.ok(urls.includes(site.origin+'/new-a'));assert.ok(urls.includes(site.origin+'/old-a'));assert.equal(first.progress.checked,2);
 urls.length=0;await scrapeSource({...job,discoveryOffset:first.discoveryNext},h.hooks,transport);assert.ok(urls.includes(site.origin+'/new-b'));
});
test('specific-page sources inspect configured URLs without resurrecting unrelated tracked listings',async()=>{
 const h=makeHooks(),urls:string[]=[];await scrapeSource({site,knownUrls:[site.origin+'/unwanted']},h.hooks,async url=>{urls.push(url);return {status:200,text:url.endsWith('/robots.txt')?'':html};});assert.ok(!urls.includes(site.origin+'/unwanted'));
});
test('specific-page budgets rotate through later configured URLs on subsequent runs',async()=>{
 const h=makeHooks(),urls:string[]=[];const job={site:{...site,urls:[site.origin+'/first',site.origin+'/second'],maxPages:1},knownUrls:[]};
 const transport=async (url:string)=>{urls.push(url);return {status:200,text:url.endsWith('/robots.txt')?'':html};};
 const first=await scrapeSource(job,h.hooks,transport);assert.ok(urls.includes(site.origin+'/first'));urls.length=0;
 await scrapeSource({...job,discoveryOffset:first.discoveryNext},h.hooks,transport);assert.ok(urls.includes(site.origin+'/second'));assert.ok(!urls.includes(site.origin+'/first'));
});
test('slow pacing and time budget preserve unvisited configured targets for the next run',async()=>{
 const h=makeHooks(),urls:string[]=[];const job={site:{...site,delaySeconds:300,urls:['a','b','c','d'].map(p=>site.origin+'/'+p),maxPages:4},knownUrls:[]};
 const realNow=Date.now,realTimer=globalThis.setTimeout;let now=realNow();
 Date.now=()=>now;globalThis.setTimeout=((fn:()=>void,ms:number)=>{now+=ms;queueMicrotask(fn);return 0;}) as unknown as typeof setTimeout;
 try{
  const transport=async (url:string)=>{urls.push(url);return {status:200,text:url.endsWith('/robots.txt')?'':html};};
  const first=await scrapeSource(job,h.hooks,transport);assert.equal(first.progress.checked,2);assert.equal(first.discoveryNext,2);urls.length=0;
  const second=await scrapeSource({...job,discoveryOffset:first.discoveryNext},h.hooks,transport);assert.equal(second.progress.checked,2);assert.ok(urls.includes(site.origin+'/c'));assert.ok(urls.includes(site.origin+'/d'));assert.ok(!urls.includes(site.origin+'/a'));
 }finally{Date.now=realNow;globalThis.setTimeout=realTimer;}
});
test('robots-disallowed product pages are recorded without fetching or ingesting them',async()=>{
 const h=makeHooks(),urls:string[]=[];const result=await scrapeSource({site,knownUrls:[]},h.hooks,async url=>{urls.push(url);return {status:200,text:'User-agent: *\nDisallow: /panel'};});
 assert.equal(result.status,'failed');assert.deepEqual(urls,[site.origin+'/robots.txt']);assert.equal(h.saved.length,0);assert.equal(h.events[1].status,'skipped');
});
test('a 429 stops the source and preserves successfully parsed pages as a partial run',async()=>{
 const h=makeHooks();const result=await scrapeSource({site:{...site,urls:[...site.urls,site.origin+'/other']},knownUrls:[]},h.hooks,async url=>({status:url.endsWith('other')?429:200,text:url.endsWith('/robots.txt')?'':html}));
 assert.equal(result.status,'partial');assert.equal(h.saved.length,1);assert.equal(result.progress.errors,1);assert.equal(h.events.at(-1).httpStatus,429);
});
test('cancel before the next request does not fetch or publish anything',async()=>{
 let fetched=false;const result=await scrapeSource({site,knownUrls:[]},{event:async()=>({cancel:true}),publish:async()=>{throw new Error('Must not ingest');}},async()=>{fetched=true;return {status:200,text:''};});
 assert.equal(result.status,'cancelled');assert.equal(fetched,false);
});
test('Shopify variants retain unknown stock and reject cross-origin offer URLs',async()=>{
 const h=makeHooks();const feed=JSON.stringify({products:[{title:'400W Solar Panel',handle:'panel',vendor:'Maker',variants:[{id:123,price:'110',title:'Default Title'}]}]});
 const result=await scrapeSource({site:{...site,adapter:'shopify'},knownUrls:[]},h.hooks,async url=>({status:200,text:url.endsWith('/robots.txt')?'':feed}));
 assert.equal(result.status,'succeeded');assert.equal(h.saved[0].offers[0].stock,'unknown');assert.equal(h.saved[0].offers[0].sku,'123');
});
test('Shopify collection sources honor their configured feed rather than crawling the whole store',async()=>{
 const h=makeHooks(),urls:string[]=[];
 const feed=JSON.stringify({products:[{title:'10 AWG PV Wire 100 ft',handle:'wire',variants:[{id:123,price:'75',title:'Default Title',available:true}]}]});
 await scrapeSource({site:{...site,adapter:'shopify',startPath:'/collections/solar-cable/products.json'},knownUrls:[]},h.hooks,async url=>{urls.push(url);return {status:200,text:url.endsWith('/robots.txt')?'':feed};});
 assert.equal(urls[1],site.origin+'/collections/solar-cable/products.json?limit=250&page=1');assert.equal(h.saved[0].offers[0].price,75);
});
test('source redirects to another origin fail without contacting the destination',async()=>{
 const h=makeHooks();let n=0;const result=await scrapeSource({site,knownUrls:[]},h.hooks,async()=>{n++;return {status:302,location:'https://other-store.com/private',text:''};});
 assert.equal(result.status,'failed');assert.equal(n,1);assert.equal(h.saved.length,0);
});
test('same-origin relative redirects are followed and retain the source URL checks',async()=>{
 const h=makeHooks(),urls:string[]=[];const result=await scrapeSource({site,knownUrls:[]},h.hooks,async url=>{urls.push(url);return url.endsWith('/robots.txt')?{status:200,text:''}:url.endsWith('/panel')?{status:302,location:'/new-panel',text:''}:{status:200,text:html};});
 assert.equal(result.status,'succeeded');assert.equal(urls.at(-1),site.origin+'/new-panel');assert.equal(h.saved.length,1);
});
