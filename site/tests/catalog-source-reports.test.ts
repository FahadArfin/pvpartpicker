import test from 'node:test';
import assert from 'node:assert/strict';
import {readCatalog} from '../lib/catalog-reader.ts';
import type {Product,CollectionReport} from '../lib/types.ts';
test('new snapshot retailers remain visible alongside live database source reports',async()=>{
 const report=(id:string):CollectionReport=>({retailerId:id,retailer:id,status:'ok',products:1,checkedAt:'2026-10-05T00:00:00Z'});
 const p:Product={id:'wire',name:'Wire',brand:'Test',category:'wiring',description:'',image:'',images:[],specs:{},offers:[],sourceUrl:'https://example.com/wire',verifiedAt:''};
 const db={prepare:()=>({}),batch:async()=>[{results:[{json:JSON.stringify(p)}]},{results:[]},{results:[]},{results:[]},{results:[{json:JSON.stringify([report('live-retailer')]),created_at:'2026-10-05T00:00:00Z'}]}]} as unknown as D1Database;
 const c=await readCatalog(db,{products:[],reports:[report('windynation'),report('temco')],generatedAt:null});
 assert.deepEqual(new Set(c.reports.map(r=>r.retailerId)),new Set(['live-retailer','windynation','temco']));
});
