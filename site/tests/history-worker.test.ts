import test from 'node:test';import assert from 'node:assert/strict';
import {runBackfill,withWorkerCheckIn} from '../scripts/drop-history-worker.mjs';
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
