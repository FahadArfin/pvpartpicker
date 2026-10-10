import test from 'node:test';
import assert from 'node:assert/strict';
import {readCatalogState,catalogStateUrl,catalogBuildOfferId} from '../lib/catalog-state.ts';
import {comparisonRows} from '../lib/comparison-view.ts';
import type {Product} from '../lib/types.ts';
import {classify} from '../lib/retailers.ts';

test('a charge controller display is an accessory, not a solar charger',()=>{
 assert.equal(classify('Victron Energy SmartSolar Pluggable Control Display for Victron Energy SmartSolar and BlueSolar Charge Controllers'),'accessories');
 assert.equal(classify('Victron SmartSolar MPPT 150/70-Tr VE.Can'),'charging');
});
test('explicit new-only choices keep the selected new offer instead of silently using cheaper used equipment',()=>{
 const observedAt=new Date().toISOString();
 const product={id:'p',offers:[{id:'used',condition:'used',price:60,packQuantity:1,stock:'in_stock',currency:'USD',observedAt},{id:'new',condition:'new',price:100,packQuantity:1,stock:'in_stock',currency:'USD',observedAt}]} as unknown as Product;
 assert.equal(catalogBuildOfferId(product,'new'),'new');
 assert.equal(catalogBuildOfferId(product,'all'),undefined);
 assert.equal(catalogBuildOfferId(product,'used'),'used');
});

test('catalog URLs preserve builder context and round trip search and grouped filters',()=>{
 const state={category:'wiring',ecosystem:'victron',q:'MC4 + cable',brand:'Renogy',maxPrice:'50',inStock:true,condition:'new',sort:'price-asc',attributes:{wireKind:'Premade cables',connector:'MC4'}};
 const url=catalogStateUrl('/?builder=1',state);
 assert.equal(new URL(url,'https://example.com').searchParams.get('builder'),'1');
 assert.deepEqual(readCatalogState(new URL(url,'https://example.com').searchParams),state);
 assert.equal(readCatalogState(new URLSearchParams('maxPrice=-1&condition=oops&stock=maybe')).maxPrice,'');
});
test('comparison uses unit-aware public fields and preserves missing values',()=>{
 const p=(id:string,watts?:number)=>({id,category:'panels',brand:'Test',name:id,specs:{...(watts?{watts}:{}),hasFancyFeature:true},sourceUrl:'https://example.com',offers:[]} as unknown as Product);
 const rows=comparisonRows([p('a',400),p('b',450)]);
 assert.equal(rows.find(r=>r.key==='watts')?.values[0].value,'400 W');
 assert.equal(rows.find(r=>r.key==='watts')?.different,true);
 assert.ok(!rows.some(r=>r.key==='hasFancyFeature'));
 assert.equal(comparisonRows([p('a'),p('b')]).find(r=>r.key==='watts')?.different,false);
});

test('catalog starts across all categories but retains explicit and builder selections',()=>{
 assert.equal(readCatalogState(new URLSearchParams()).category,'all');
 assert.equal(readCatalogState(new URLSearchParams('category=inverters')).category,'inverters');
 assert.equal(readCatalogState(new URLSearchParams('builder=1')).category,'panels');
});
