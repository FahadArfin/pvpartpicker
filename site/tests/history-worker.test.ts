import test from 'node:test';import assert from 'node:assert/strict';
import {runBackfill,withWorkerCheckIn,sleepWithCheckIn} from '../scripts/drop-history-worker.mjs';
test('long published crawl-delay waits check in every minute without shortening the delay',async()=>{
 const waits:number[]=[];let checks=0;
 await sleepWithCheckIn(135000,async(ms:number)=>{waits.push(ms);},async()=>{checks++;});
 assert.deepEqual(waits,[60000,60000,15000]);assert.equal(checks,3);
});
test('worker reports start and terminal outcome without hiding errors',async()=>{
 const calls:any[]=[];const api=async(a:string,d:any)=>{calls.push({a,...d});};
 await withWorkerCheckIn(api,async()=>{},'https://github.com/FahadArfin/pvpartpicker/actions/runs/123');
 assert.deepEqual(calls.map(x=>x.phase),['started','finished']);assert.equal(calls[0].runUrl,calls[1].runUrl);
 calls.length=0;await assert.rejects(withWorkerCheckIn(api,async()=>{throw Error('lost connection');}),/lost connection/);
 assert.deepEqual(calls.map(x=>x.phase),['started','failed']);
 await assert.rejects(withWorkerCheckIn(async()=>{throw Error('check-in failed');},async()=>{throw Error('must not run');}),/check-in failed/);
});
test('all public requests are spaced, not-found jobs finish and completed queues send no public requests',async()=>{
 let now=0,next=0,done=false;const calls:number[]=[],actions:string[]=[];
 const api=async(action:string)=>{actions.push(action);if(action==='claim')return done?{done:true}:{lease:'lease',job:{id:'job',url:'https://signaturesolar.com/item',p:{},o:{}}};if(action==='permit'){const at=Math.max(now,next);next=at+30000;return {waitMs:at-now};}if(action==='confirm')return {waitMs:0};if(action==='finish'){done=true;return {};}return {};};
 await runBackfill({api,now:()=>now,sleep:async(ms:number)=>{now+=ms;},request:async(path:string)=>{calls.push(now);return {status:path==='/robots.txt'?404:200,body:path==='/robots.txt'?'not found':'{"found":null}'};},budgetMs:120000,log:()=>{}});
 assert.deepEqual(calls,[0,30000]);assert.ok(actions.includes('finish'));assert.equal(actions.includes('process-alerts'),false);
 calls.length=0;await runBackfill({api,now:()=>now,sleep:async()=>{},request:async()=>{throw Error('Unexpected fetch');},budgetMs:120000,log:()=>{}});assert.equal(calls.length,0);
});
test('403 blocks the source globally without trying more URLs',async()=>{
 const actions:string[]=[];let requests=0;
 await runBackfill({api:async(action:string)=>{actions.push(action);return action==='claim'?{lease:'lease',job:{id:'job'}}:action==='permit'?{waitMs:0}:{};},request:async()=>{requests++;return {status:403,body:''};},now:()=>0,sleep:async()=>{},budgetMs:120000,log:()=>{}});
 assert.equal(requests,1);assert.ok(actions.includes('pause'));assert.equal(actions.includes('finish'),false);
});

test('server errors are recorded and the next listing runs without a queue pause or retry delay',async()=>{
 let now=0,next=0,finished=0;const actions:string[]=[],times:number[]=[],results:any[]=[];
 const api=async(a:string,d:any)=>{actions.push(a);if(a==='claim')return finished===2?{done:true}:{lease:'lease',job:{id:'job'+finished,url:'https://example.test/'+finished,p:{id:'p'+finished},o:{}}};if(a==='permit')return {waitMs:Math.max(0,next-now)};if(a==='confirm'){next=now+30000;return {waitMs:0};}if(a==='finish'){results.push(d);finished++;return {};}};
 await runBackfill({api,continuous:true,now:()=>now,sleep:async(ms:number)=>{now+=ms;},request:async(path:string)=>{times.push(now);return {status:path==='/robots.txt'?404:finished===0?500:200,body:'{"found":null}'};},budgetMs:600000,log:()=>{}});
 assert.deepEqual(times,[0,30000,60000]);assert.equal(actions.includes('pause'),false);assert.deepEqual(results.map(x=>x.status),['failed','not_found']);assert.match(results[0].reason,/500.*url-lookup/);
});

test('a network timeout is recorded as a failed listing rather than retried in place',async()=>{
 const actions:string[]=[];let done=false,finished:any;
 await runBackfill({api:async(a:string,d:any)=>{actions.push(a);if(a==='claim')return done?{done:true}:{lease:'lease',job:{id:'job',p:{}}};if(a==='permit')return {waitMs:0};if(a==='finish'){finished=d;done=true;return {}; }return {};},request:async(path:string)=>{if(path==='/robots.txt')return {status:404,body:''};throw Error('fetch failed');},now:()=>0,sleep:async()=>{},budgetMs:120000,log:()=>{}});
 assert.equal(finished.status,'failed');assert.match(finished.reason,/fetch failed/);assert.equal(actions.includes('pause'),false);
});

test('a robots setup outage records a recoverable error without failing unrelated listings',async()=>{
 let now=0;const actions:string[]=[],paths:string[]=[];
 await runBackfill({api:async(a:string)=>{actions.push(a);if(a==='claim')return {lease:'lease',job:{id:'job',p:{}}};if(a==='permit')return {waitMs:0};return {};},request:async(path:string)=>{paths.push(path);return {status:500,body:''};},continuous:true,now:()=>now,sleep:async(ms:number)=>{now+=ms;},budgetMs:180000,log:()=>{}});
 assert.ok(actions.includes('setup_error'));assert.equal(actions.includes('finish'),false);assert.equal(actions.includes('pause'),false);assert.deepEqual(paths,['/robots.txt','/robots.txt']);
});
test('budget exit releases its reserved request without making the source request',async()=>{
 let now=0;const actions:string[]=[];
 await runBackfill({api:async(action:string)=>{actions.push(action);return action==='claim'?{lease:'lease',job:{id:'job'}}:action==='permit'?{waitMs:300000}:{};},request:async()=>{throw Error('No source request allowed');},now:()=>now,sleep:async(ms:number)=>{now+=ms;},budgetMs:120000,log:()=>{}});
 assert.ok(actions.includes('release'));assert.equal(actions.includes('confirm'),false);
});
test('unsupported lookup URLs finish as not found instead of backing off the whole queue',async()=>{
 let now=0,done=false;let finished:any;
 const api=async(action:string,data:any)=>action==='claim'?(done?{done:true}:{lease:'lease',job:{id:'job',url:'https://example.com/item',p:{},o:{}}}):action==='permit'?{waitMs:0}:action==='confirm'?{waitMs:0}:action==='finish'?(finished=data,done=true,{}):{};
 await runBackfill({api,now:()=>now,sleep:async(ms:number)=>{now+=ms;},request:async(path:string)=>({status:path==='/robots.txt'?404:400,body:''}),budgetMs:120000,log:()=>{}});assert.equal(finished.status,'not_found');
});
test('a late waking worker confirms ownership and stops before another source request',async()=>{
 let now=0,requests=0,permits=0;const api=async(action:string)=>{if(action==='claim')return {lease:'lease',job:{id:'job',url:'https://signaturesolar.com/item',p:{},o:{}}};if(action==='permit')return {waitMs:permits++?30000:0};if(action==='confirm'){if(now>300000)throw Error('Active backfill lease required');return {waitMs:0};}if(action==='finish')throw Error('Active backfill lease required');return {};};
 await assert.rejects(runBackfill({api,now:()=>now,sleep:async(ms:number)=>{now+=ms+(ms?600000:0);},request:async()=>{requests++;return {status:404,body:''};},budgetMs:1200000,log:()=>{}}),/lease/);assert.equal(requests,1);
});
test('continuous mode waits through cooldown instead of exiting and keeps source pacing',async()=>{
 let now=0,done=false,claims=0;const requests:number[]=[],actions:string[]=[];
 const api=async(action:string)=>{actions.push(action);if(action==='claim'){claims++;return done?{done:true}:now<360000?{deferred:true,nextRequestAt:new Date(360000).toISOString()}:{lease:'lease',job:{id:'job',url:'https://example.test',p:{},o:{}}};}if(action==='permit')return {waitMs:requests.length?30000:0};if(action==='confirm')return {waitMs:0};if(action==='finish'){done=true;return {};}};
 const result=await runBackfill({api,continuous:true,now:()=>now,sleep:async(ms:number)=>{assert.ok(ms<=60000);now+=ms;},request:async(path:string)=>{requests.push(now);return {status:path==='/robots.txt'?404:200,body:'{"found":null}'};},budgetMs:600000,log:()=>{}});
 assert.deepEqual(requests,[360000,390000]);assert.equal(result.continuation,false);assert.ok(claims>2);
});
test('continuous mode signals handoff at deadline, never handoff on source refusal',async()=>{
 let now=0;const result=await runBackfill({api:async()=>({busy:true}),continuous:true,now:()=>now,sleep:async(ms:number)=>{now+=ms;},request:async()=>{throw Error('Busy worker must not fetch');},budgetMs:180000,log:()=>{}});
 assert.equal(result.continuation,true);
 const paused=await runBackfill({api:async()=>({paused:true}),continuous:true,now:()=>0,sleep:async()=>{},request:async()=>{throw Error('Paused worker must not fetch');},budgetMs:180000,log:()=>{}});
 assert.equal(paused.continuation,false);
});
