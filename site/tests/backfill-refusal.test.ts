import test from 'node:test';import assert from 'node:assert/strict';
import {retryAfterDeadline,runBackfill} from '../scripts/drop-history-worker.mjs';
test('Retry-After supports seconds and HTTP dates but rejects unsafe or stale values',()=>{
 assert.equal(retryAfterDeadline('120',1000),121000);assert.equal(retryAfterDeadline('Thu, 01 Jan 1970 00:02:00 GMT',1000),120000);for(const v of ['no', '-1','99999999999999999999',undefined])assert.equal(retryAfterDeadline(v,1000),undefined);
});
test('429 retains source cooldown metadata and stops without finishing a pending job',async()=>{
 const events:any[]=[];let requests=0;
 await runBackfill({api:async(a:string,d:any)=>{events.push({a,...d});return a==='claim'?{lease:'l',job:{id:'j'}}:a==='permit'||a==='confirm'?{waitMs:0}:{};},request:async()=>{requests++;return {status:429,body:'Too many requests',retryAfter:'90000'};},now:()=>1000,sleep:async()=>{},budgetMs:120000,log:()=>{}});
 const pause=events.find(e=>e.a==='pause');assert.equal(pause.kind,'rate_limit');assert.equal(pause.retryAfter,'90000');assert.equal(pause.cooldownUntil,90001000);assert.equal(requests,1);assert.equal(events.some(e=>e.a==='finish'),false);
});
test('known wrong-product lookup stops before fetching or importing the candidate',async()=>{
 const paths:string[]=[],events:any[]=[];
 await runBackfill({api:async(a:string,d:any)=>{events.push({a,...d});return a==='claim'?{lease:'l',job:{id:'j',url:'https://other.test/product'}}:a==='permit'||a==='confirm'?{waitMs:0}:a==='validate_lookup'?{valid:false,reason:'Wrong product already rejected'}:{};},request:async(p:string)=>{paths.push(p);return {status:p==='/robots.txt'?404:200,body:p==='/robots.txt'?'':'{"found":"/products/sg-4882548064393"}'};},now:()=>0,sleep:async()=>{},budgetMs:120000,log:()=>{}});
 assert.deepEqual(paths,['/robots.txt','/api/url-lookup']);assert.equal(events.find(e=>e.a==='pause').kind,'lookup_integrity');assert.equal(events.some(e=>e.a==='finish'||e.a==='import'),false);
});
