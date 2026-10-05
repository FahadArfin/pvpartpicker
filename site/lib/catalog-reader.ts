import {applyOverride} from './overrides.ts';
import {categorizeProduct} from './retailers.ts';
import {applySpecificationEvidence} from './specifications.ts';
import type {Product,Offer,CollectionReport,ProductSpecification} from './types.ts';
export interface CatalogSnapshot {products:Product[];reports:CollectionReport[];generatedAt:string|null;}
export interface Catalog extends CatalogSnapshot {storage:string;}

export async function readCatalog(db:D1Database,initial:CatalogSnapshot,evidence:Record<string,ProductSpecification>={}):Promise<Catalog>{
 const enrichedInitial={...initial,products:initial.products.map(p=>applySpecificationEvidence(p,evidence))};
 try{
  // All reads share one database round trip and a consistent read transaction.
  const [rows,offerRows,corrections,mappings,runs]=await db.batch([
   db.prepare('SELECT json FROM products LIMIT 5000'),
   db.prepare('SELECT product_id, json FROM offers LIMIT 20000'),
   db.prepare('SELECT id,json FROM product_overrides'),
   db.prepare('SELECT id,product_id FROM offer_mappings'),
   db.prepare('SELECT json, created_at FROM collection_runs ORDER BY created_at DESC LIMIT 7'),
  ]) as unknown as [D1Result<{json:string}>,D1Result<{product_id:string;json:string}>,D1Result<{id:string;json:string}>,D1Result<{id:string;product_id:string}>,D1Result<{json:string;created_at:string}>];
  if(!rows.results.length)return {...enrichedInitial,storage:'snapshot'};
  const productMap=new Map(enrichedInitial.products.map(p=>[p.id,{...p,offers:[...p.offers]}]));
  for(const row of rows.results){const p=applySpecificationEvidence(categorizeProduct(JSON.parse(row.json) as Product),evidence);productMap.set(p.id,{...p,offers:[]});}
  for(const row of offerRows.results){const p=productMap.get(row.product_id),o=JSON.parse(row.json) as Offer;p?.offers.push((p.category==='kits'||p.category==='all-in-one')?{...o,packQuantity:1}:o);}
  for(const row of corrections.results){const p=productMap.get(row.id);if(p)productMap.set(row.id,applyOverride(p,JSON.parse(row.json)));}
  for(const mapping of mappings.results){const target=productMap.get(mapping.product_id);if(!target)continue;for(const p of productMap.values()){if(p.id===target.id)continue;const offer=p.offers.find(o=>o.id===mapping.id);if(offer){p.offers=p.offers.filter(o=>o.id!==mapping.id);target.offers.push(offer);}}}
  const reports=new Map<string,CollectionReport>();
  for(const row of runs.results)for(const report of JSON.parse(row.json) as CollectionReport[])if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  for(const report of initial.reports)if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  return {products:[...productMap.values()].filter(p=>p.offers.length>0),reports:reports.size?[...reports.values()]:initial.reports,generatedAt:runs.results[0]?.created_at||initial.generatedAt,storage:'database'};
 }catch{return {...enrichedInitial,storage:'snapshot_unavailable_database'};}
}
