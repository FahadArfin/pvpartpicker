import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {buildSales,currentSales,saleHistoryQuery} from '../lib/sales.ts';
import {selectDrops} from '../lib/price-drops.ts';
import type {Product} from '../lib/types.ts';
const now=Date.parse('2026-10-06T22:00:00Z');
const product={id:'panel',category:'panels',offers:[{id:'offer',retailer:'Retailer',currency:'USD',price:800,referencePrice:1000,packQuantity:10,stock:'in_stock',condition:'new',observedAt:'2026-10-06T21:00:00Z'}]} as Product;
test('retailer markdowns are discoverable without inventing earlier observations and retain package costs',()=>{
 const s=buildSales([product],[],now)[0];assert.equal(s.basis,'retailer');assert.equal(s.sampleDays,0);assert.equal(s.previous,100);assert.equal(s.current,80);assert.equal(s.dollars,20);assert.equal(s.percent,20);assert.equal(s.purchasePrice,800);assert.equal(s.packQuantity,10);
 assert.equal(selectDrops([s],{minPercent:21}).length,0);
});
test('sales reject unavailable, stale, future, non-USD, invalid packs and missing or invalid reference prices',()=>{
 for(const override of [{stock:'unknown'},{stock:'out_of_stock'},{observedAt:'2026-10-04T00:00:00Z'},{observedAt:'2026-10-07T00:00:00Z'},{currency:'CAD'},{packQuantity:0},{price:NaN},{referencePrice:undefined},{referencePrice:800},{referencePrice:Infinity}])assert.equal(buildSales([{...product,offers:[{...product.offers[0],...override}]}] as Product[],[],now).length,0);
});
test('well-sampled recent usual prices take precedence over advertised reference prices',()=>{
 const h={offerId:'offer',usualPrice:900,sampleDays:7,firstDay:'2026-09-20',lastDay:'2026-09-26'};
 const s=buildSales([product],[h],now)[0];assert.equal(s.basis,'history');assert.equal(s.previous,90);assert.equal(s.sampleDays,7);
 assert.equal(buildSales([product],[{...h,usualPrice:700}],now).length,0,'do not fall back to an inflated retailer reference when tracked usual price is lower');
 assert.equal(buildSales([product],[{...h,sampleDays:6}],now)[0].basis,'retailer');
 assert.equal(buildSales([product],[{...h,firstDay:'2024-01-01',lastDay:'2024-02-01'}],now)[0].basis,'retailer');
});
test('new catalog data or freshness expiry removes outdated sale comparisons immediately',()=>{
 const sales=buildSales([product],[],now);assert.equal(currentSales(sales,[product],now).length,1);
 for(const override of [{price:1100},{packQuantity:20},{referencePrice:800},{stock:'out_of_stock'}])assert.equal(currentSales(sales,[{...product,offers:[{...product.offers[0],...override}]}] as Product[],now).length,0);
 assert.equal(currentSales(sales,[product],now+86400000).length,0);
});
test('a tracked usual price uses the median of distinct daily checks, excluding current day, archives and different packs',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE offers(id TEXT,json TEXT);CREATE TABLE observations(offer_id TEXT,price REAL,pack_quantity INTEGER,stock TEXT,observed_at TEXT,source_id TEXT)');
 db.prepare('INSERT INTO offers VALUES (?,?)').run('offer',JSON.stringify(product.offers[0]));const insert=db.prepare('INSERT INTO observations VALUES (?,?,?,?,?,?)');
 for(let day=20;day<=26;day++){insert.run('offer',day===26?10000:1000,10,'in_stock',`2026-09-${day}T08:00:00Z`,null);for(let repeat=10;repeat<20;repeat++)insert.run('offer',10000,10,'in_stock',`2026-09-${day}T${repeat}:00:00Z`,null);insert.run('offer',day===26?10000:1000,10,'in_stock',`2026-09-${day}T21:00:00Z`,null);}
 for(const [price,pack,stock,at,source] of [[50,10,'in_stock','2026-10-06T12:00:00Z',null],[9999,20,'in_stock','2026-09-28T12:00:00Z',null],[9999,10,'unknown','2026-09-29T12:00:00Z',null],[9999,10,'in_stock','2026-09-30T12:00:00Z','archive'],[9999,10,'in_stock','2025-09-30T12:00:00Z',null]] as const)insert.run('offer',price,pack,stock,at,source);
 const query=db.prepare(saleHistoryQuery),bounds=['2026-09-06T00:00:00.000Z','2026-10-06T00:00:00.000Z'];
 const rows=query.all(...bounds) as any[];assert.equal(rows.length,1);assert.equal(rows[0].sampleDays,7);assert.equal(rows[0].usualPrice,1000);
 insert.run('offer',2000,10,'in_stock','2026-09-27T21:00:00Z',null);assert.equal((query.all(...bounds)[0] as any).usualPrice,1000,'even sample median averages its two central daily prices');
 db.exec("DELETE FROM observations WHERE observed_at>='2026-09-26' AND observed_at<'2026-09-28'");assert.equal(query.all(...bounds).length,0,'frequent checks over six days do not establish a usual price');db.close();
});
