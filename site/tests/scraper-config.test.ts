import test from 'node:test';
import assert from 'node:assert/strict';
import {validateScraperSite,nextScrapeAt,publicSourceUrl,emptyProgress,validateProgress} from '../lib/scraper-config.ts';
const config={name:'Retailer',origin:'https://solar-store.com',enabled:true,adapter:'pages',startPath:'/sitemap.xml',urls:['/products/panel'],schedule:'interval',frequencyMinutes:360,dailyTime:'06:30',weekdays:[1,3,5],delaySeconds:10,jitterSeconds:0,maxPages:24,feedPages:1};
test('source URLs reject local networks, credentials, cross origin and non-HTTPS',()=>{
 for(const url of ['http://solar-store.com','https://127.0.0.1','https://[::1]','https://localhost','https://192.168.1.1','https://site.local','https://x.internal','https://user:pass@solar-store.com','https://solar-store.com:444'])assert.throws(()=>publicSourceUrl(url));
 assert.throws(()=>validateScraperSite({...config,urls:['https://other.com/p']},'store'));assert.equal(validateScraperSite(config,'store').urls[0],'https://solar-store.com/products/panel');
});
test('daily schedules use UTC weekdays and never repeat an already-started boundary',()=>{
 const s=validateScraperSite({...config,schedule:'daily'},'store');
 assert.equal(nextScrapeAt(s,Date.parse('2026-10-05T06:29:59Z')),'2026-10-05T06:30:00.000Z');
 assert.equal(nextScrapeAt(s,Date.parse('2026-10-05T06:30:00Z')),'2026-10-07T06:30:00.000Z');
 assert.equal(nextScrapeAt({...s,enabled:false}),null);assert.equal(nextScrapeAt({...s,schedule:'manual'}),null);
});
test('settings enforce pacing and bounded work; interval schedule advances correctly',()=>{
 for(const patch of [{delaySeconds:0},{maxPages:1000},{frequencyMinutes:0},{feedPages:0},{jitterSeconds:40},{weekdays:[]},{dailyTime:'25:00'},{urls:[]}])assert.throws(()=>validateScraperSite({...config,...patch},'store'));
 const s=validateScraperSite(config,'store');assert.equal(nextScrapeAt(s,0),'1970-01-01T06:00:00.000Z');
 assert.throws(()=>validateProgress({...emptyProgress(),inserted:NaN}));assert.throws(()=>validateProgress({...emptyProgress(),requests:-1}));
});

test('a custom Shopify source requires explicit USD verification',()=>{assert.throws(()=>validateScraperSite({...config,adapter:'shopify'},'store'));assert.equal(validateScraperSite({...config,adapter:'shopify',usdConfirmed:true},'store').usdConfirmed,true);});
