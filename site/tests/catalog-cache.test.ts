import test from 'node:test';
import assert from 'node:assert/strict';

test('public catalog reads coalesce, expire, and invalidate without retaining an older in-flight read',async()=>{
 const {createCatalogCache}=await import('../lib/catalog-cache.ts');
 let now=1000,calls=0;
 const cache=createCatalogCache(async()=>++calls,()=>true,()=>now);
 const [a,b]=await Promise.all([cache.get(),cache.get()]);
 assert.equal(calls,1);assert.equal(a.value,b.value);
 now=a.expiresAt-1;assert.equal((await cache.get()).value,1);
 now++;assert.equal((await cache.get()).value,2);
 cache.invalidate();assert.equal((await cache.get()).value,3);
 let release!:(value:number)=>void;
 const racing=createCatalogCache(()=>new Promise<number>(resolve=>{release=resolve;}),()=>true,()=>now);
 const old=racing.get();racing.invalidate();release(7);await old;
 const fresh=racing.get();release(8);assert.equal((await fresh).value,8);
});
test('database fallback and errors are retried rather than cached as healthy prices',async()=>{
 const {createCatalogCache}=await import('../lib/catalog-cache.ts');
 let calls=0;
 const cache=createCatalogCache(async()=>({healthy:++calls>1}),r=>r.healthy,()=>1000);
 assert.equal((await cache.get()).expiresAt,1000);
 assert.equal((await cache.get()).value.healthy,true);assert.equal(calls,2);
 let failures=0;const broken=createCatalogCache(async()=>{if(++failures===1)throw Error('offline');return 2;});
 await assert.rejects(broken.get(),/offline/);assert.equal((await broken.get()).value,2);
});
