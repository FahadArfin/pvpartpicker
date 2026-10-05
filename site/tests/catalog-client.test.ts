import test from 'node:test';
import assert from 'node:assert/strict';

test('page catalog is reused across page loads only until its server expiry',async()=>{
 const {loadPageCatalog}=await import('../lib/catalog-client.ts');
 let data:string|null=null,calls=0,now=1000;
 const storage={getItem:()=>data,setItem:(_key:string,v:string)=>{data=v;}};
 const fetcher=async()=>{calls++;return Response.json({version:1,expiresAt:now+30000,products:[],reports:[]});};
 await loadPageCatalog(storage,fetcher,()=>now);
 now+=29999;await loadPageCatalog(storage,fetcher,()=>now);assert.equal(calls,1);
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
