import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogTtlMs} from '../lib/catalog-cache.ts';

test('recent cached catalog can recover browsing without extending original price timestamps',async()=>{
 const {readRecentPageCatalog,pageCatalogKey}=await import('../lib/catalog-client.ts');
 const stored=JSON.stringify({version:1,expiresAt:1000,products:[],reports:[]});
 const storage={getItem:(key:string)=>key===pageCatalogKey?stored:null};
 assert.ok(readRecentPageCatalog(storage,()=>1100));
 assert.equal(readRecentPageCatalog(storage,()=>31*60*1000),null);
 assert.equal(readRecentPageCatalog({getItem:()=>'{broken'},()=>1100),null);
});

test('page catalog is reused across page loads only until its server expiry',async()=>{
 const {loadPageCatalog}=await import('../lib/catalog-client.ts');
 let data:string|null=null,calls=0,now=1000;
 const storage={getItem:()=>data,setItem:(_key:string,v:string)=>{data=v;}};
 const fetcher=async()=>{calls++;return Response.json({version:1,expiresAt:now+catalogTtlMs,products:[],reports:[]});};
 await loadPageCatalog(storage,fetcher,()=>now);
 now+=catalogTtlMs-1;await loadPageCatalog(storage,fetcher,()=>now);assert.equal(calls,1);
 now++;await loadPageCatalog(storage,fetcher,()=>now);assert.equal(calls,2);
 data='{invalid';await loadPageCatalog(storage,fetcher,()=>now);assert.equal(calls,3);
});
test('disabled browser storage still loads; invalid or unsuccessful responses do not overwrite cached data',async()=>{
 const {loadPageCatalog}=await import('../lib/catalog-client.ts');
 const unavailable={getItem:()=>{throw Error('disabled');},setItem:()=>{throw Error('disabled');}};
 const result=await loadPageCatalog(unavailable,async()=>Response.json({version:1,expiresAt:Date.now()+30000,products:[],reports:[]}));
 assert.deepEqual(result.products,[]);
 await assert.rejects(loadPageCatalog(null,async()=>Response.json({error:'offline'},{status:503})),/Could not load/);
 await assert.rejects(loadPageCatalog(null,async()=>Response.json({version:2,products:[]})),/Invalid catalog/);
});

test('hover warming and navigation share a request, preserve expiry, and retry after failure',async()=>{
 const {createPageCatalogLoader}=await import('../lib/catalog-client.ts');
 let calls=0,release!:(r:Response)=>void;
 const loader=createPageCatalogLoader(async()=>{calls++;return new Promise<Response>(resolve=>{release=resolve;});},()=>1000);
 const stored=new Map<string,string>();const storage={getItem:(key:string)=>stored.get(key)||null,setItem:(key:string,value:string)=>{stored.set(key,value);}};
 const warm=loader(storage),visible=loader(storage);assert.equal(calls,1);
 release(Response.json({version:1,expiresAt:1500,products:[],reports:[]}));
 const [a,b]=await Promise.all([warm,visible]);assert.equal(a,b);assert.equal(a.expiresAt,1500);
 await loader(storage);assert.equal(calls,1);
 let retries=0;const recovery=createPageCatalogLoader(async()=>{if(++retries===1)throw Error('offline');return Response.json({version:1,expiresAt:1500,products:[],reports:[]});},()=>1000);
 await assert.rejects(recovery(null),/Could not load/);await recovery(null);assert.equal(retries,2);
});
