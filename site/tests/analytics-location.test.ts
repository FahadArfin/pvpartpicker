import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchAddresses,addressApi} from '../lib/analytics-location.ts';
test('address search rejects malformed provider coordinates and returns result precision',async()=>{
 let called='';const fetcher=(async(url:URL)=>{called=String(url);return Response.json({features:[{geometry:{type:'Point',coordinates:[-78.88,42.88]},properties:{street:'Niagara Square',housenumber:'65',city:'Buffalo',country:'United States'}},{geometry:{type:'Point',coordinates:[0,999]},properties:{name:'invalid'}}]});}) as unknown as typeof fetch;
 const rows=await searchAddresses('Buffalo City Hall',fetcher);
 assert.match(called,/photon.komoot.io/);assert.equal(rows.length,1);assert.equal(rows[0].latitude,42.88);assert.equal(rows[0].precision,'Address point');assert.match(rows[0].label,/65 Niagara Square/);
 await assert.rejects(()=>searchAddresses('x',fetcher),/address/i);
});
test('address API keeps queries out of URLs and public caches and rejects oversized input',async()=>{
 const request=new Request('https://example.org/api/solar-calculator?kind=address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'Buffalo'})});
 const result=await addressApi(request,(async()=>Response.json({features:[]})) as typeof fetch);
 assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'no-store');assert.deepEqual(await result.json(),{locations:[]});
 const bad=await addressApi(new Request(request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'x'.repeat(300)})}));assert.equal(bad.status,400);
});
