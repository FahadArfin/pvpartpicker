import {normalizeCatalogProduct} from './catalog-cleanup.ts';
import {applyOverride} from './overrides.ts';
import {categorizeProduct,normalizeSelectedBatteryPackOffer} from './retailers.ts';
import {applySpecificationEvidence} from './specifications.ts';
import type {Product,Offer,CollectionReport,ProductSpecification} from './types.ts';
export const latestSourceReportsQuery=`WITH reports AS (
 SELECT j.value AS report,r.created_at,ROW_NUMBER() OVER(PARTITION BY json_extract(j.value,'$.retailerId') ORDER BY r.created_at DESC,r.id DESC) AS rank
 FROM collection_runs r,json_each(r.json) j WHERE json_extract(j.value,'$.retailerId') IS NOT NULL
) SELECT json_array(json(report)) AS json,created_at FROM reports WHERE rank=1 ORDER BY created_at DESC LIMIT 1000`;
export interface CatalogSnapshot {products:Product[];reports:CollectionReport[];generatedAt:string|null;}
export interface Catalog extends CatalogSnapshot {storage:string;}

// Offers hydrate separately from metadata; preserve reviewed evidence and owner overrides.
function normalizeHydratedProduct(product:Product):Product{
 return normalizeCatalogProduct({...product,offers:product.offers.map(o=>normalizeSelectedBatteryPackOffer(product,o))});
}

export async function readCatalog(db:D1Database,initial:CatalogSnapshot,evidence:Record<string,ProductSpecification>={}):Promise<Catalog>{
 const enrichedInitial={...initial,products:initial.products.map(p=>normalizeHydratedProduct(applySpecificationEvidence(p,evidence)))};
 try{
  // All reads share one database round trip and a consistent read transaction.
  const [rows,offerRows,corrections,mappings,runs]=await db.batch([
   db.prepare('SELECT p.json FROM products p WHERE EXISTS (SELECT 1 FROM offers f WHERE f.product_id=p.id) ORDER BY p.id'),
   db.prepare('SELECT product_id, json FROM offers ORDER BY product_id,id'),
   db.prepare('SELECT id,json FROM product_overrides'),
   db.prepare('SELECT id,product_id FROM offer_mappings'),
   db.prepare(latestSourceReportsQuery),
  ]) as unknown as [D1Result<{json:string}>,D1Result<{product_id:string;json:string}>,D1Result<{id:string;json:string}>,D1Result<{id:string;product_id:string}>,D1Result<{json:string;created_at:string}>];
  if(!rows.results.length)return {...enrichedInitial,storage:'snapshot'};
  const productMap=new Map(enrichedInitial.products.map(p=>[p.id,{...p,offers:[...p.offers]}]));
  for(const row of rows.results){const p=applySpecificationEvidence(categorizeProduct(JSON.parse(row.json) as Product),evidence);productMap.set(p.id,{...p,offers:[]});}
  // Derive source-specific pack units before mappings can replace their metadata context.
  for(const row of offerRows.results){const p=productMap.get(row.product_id),o=JSON.parse(row.json) as Offer;p?.offers.push((p.category==='kits'||p.category==='all-in-one')?{...o,packQuantity:1}:normalizeSelectedBatteryPackOffer(p,o));}
  for(const row of corrections.results){const p=productMap.get(row.id);if(p)productMap.set(row.id,applyOverride(p,JSON.parse(row.json)));}
  for(const mapping of mappings.results){const target=productMap.get(mapping.product_id);if(!target)continue;for(const p of productMap.values()){if(p.id===target.id)continue;const offer=p.offers.find(o=>o.id===mapping.id);if(offer){p.offers=p.offers.filter(o=>o.id!==mapping.id);target.offers.push(offer);}}}
  const reports=new Map<string,CollectionReport>();
  for(const row of runs.results)for(const report of JSON.parse(row.json) as CollectionReport[])if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  for(const report of initial.reports)if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  return {products:[...productMap.values()].filter(p=>p.offers.length>0).map(normalizeHydratedProduct),reports:reports.size?[...reports.values()]:initial.reports,generatedAt:runs.results[0]?.created_at||initial.generatedAt,storage:'database'};
 }catch{return {...enrichedInitial,storage:'snapshot_unavailable_database'};}
}
