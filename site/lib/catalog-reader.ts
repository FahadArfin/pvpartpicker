import {normalizeCatalogProduct} from './catalog-cleanup.ts';
import {applyOverride} from './overrides.ts';
import {categorizeProduct,normalizeSelectedBatteryPackOffer} from './retailers.ts';
import {applySpecificationEvidence} from './specifications.ts';
import {applyReviewedStorageRole,isReviewedStorageRoleCandidate} from './reviewed-storage-roles.ts';
import type {Product,Offer,CollectionReport,ProductSpecification} from './types.ts';
export const latestSourceReportsQuery=`WITH reports AS (
 SELECT j.value AS report,r.created_at,ROW_NUMBER() OVER(PARTITION BY json_extract(j.value,'$.retailerId') ORDER BY r.created_at DESC,r.id DESC) AS rank
 FROM collection_runs r,json_each(r.json) j WHERE json_extract(j.value,'$.retailerId') IS NOT NULL
) SELECT json_array(json(report)) AS json,created_at FROM reports WHERE rank=1 ORDER BY created_at DESC LIMIT 1000`;
export interface CatalogSnapshot {products:Product[];reports:CollectionReport[];generatedAt:string|null;}
export interface Catalog extends CatalogSnapshot {storage:string;}

// Offers hydrate separately from metadata; preserve reviewed evidence and owner overrides.
function normalizeHydratedProduct(product:Product,skipReviewedStorageRole=false,evidence:Record<string,ProductSpecification>={}):Product{
 const hydrated=isReviewedStorageRoleCandidate(product)?product:{...product,offers:product.offers.map(o=>normalizeSelectedBatteryPackOffer(product,o))};
 const normalized=normalizeCatalogProduct(hydrated,{skipReviewedStorageRole});
 // Old-category evidence already attached before projection keeps its hold.
 // Newly reviewed target-category evidence applies only after the full role and
 // final selected-offer guard succeed; duplicate/owner holds cannot bypass it.
 return !skipReviewedStorageRole&&!normalized.specification&&applyReviewedStorageRole(normalized)?applySpecificationEvidence(normalized,evidence):normalized;
}

function duplicateIds(products:{id:string}[]):Set<string>{
 const seen=new Set<string>(),duplicates=new Set<string>();
 for(const p of products){if(seen.has(p.id))duplicates.add(p.id);seen.add(p.id);}
 return duplicates;
}

function applyPreProjectionEvidence(product:Product,evidence:Record<string,ProductSpecification>):Product{
 const identity=evidence[product.id]?.identity;
 // Reviewed kit/accessory evidence waits for the final selected-offer guard,
 // even when saved metadata already carries its precisely corrected category.
 if(isReviewedStorageRoleCandidate(product)&&identity&&['kits','accessories'].includes(identity.category))return product;
 return applySpecificationEvidence(product,evidence);
}

export async function readCatalog(db:D1Database,initial:CatalogSnapshot,evidence:Record<string,ProductSpecification>={}):Promise<Catalog>{
 const blockedRoles=duplicateIds(initial.products);
 const enrichedInitial={...initial,products:initial.products.map(p=>normalizeHydratedProduct(applyPreProjectionEvidence(p,evidence),blockedRoles.has(p.id),evidence))};
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
  const metadata=rows.results.map(row=>JSON.parse(row.json) as Product);
  const deferredRoles=new Set(metadata.filter(isReviewedStorageRoleCandidate).map(p=>p.id));
  const ownerCorrections=new Map<string,Parameters<typeof applyOverride>[1]>();
  for(const id of duplicateIds(metadata))blockedRoles.add(id);
  for(const raw of metadata){const p=applyPreProjectionEvidence(categorizeProduct({...raw,offers:[]}),evidence);productMap.set(p.id,{...p,offers:[]});}
  // Derive source-specific pack units before mappings can replace their metadata context.
  for(const row of offerRows.results){const p=productMap.get(row.product_id),o=JSON.parse(row.json) as Offer;p?.offers.push(isReviewedStorageRoleCandidate(p)?o:(p.category==='kits'||p.category==='all-in-one')?{...o,packQuantity:1}:normalizeSelectedBatteryPackOffer(p,o));}
  for(const row of corrections.results){const p=productMap.get(row.id);if(p){const correction=JSON.parse(row.json);ownerCorrections.set(p.id,correction);if(isReviewedStorageRoleCandidate(p)&&['batteryKind','accessoryType','kitType'].some(key=>Object.hasOwn(correction.specs||{},key)))blockedRoles.add(p.id);productMap.set(row.id,applyOverride(p,correction));}}
  for(const mapping of mappings.results){const target=productMap.get(mapping.product_id);if(!target)continue;for(const p of productMap.values()){if(p.id===target.id)continue;const offer=p.offers.find(o=>o.id===mapping.id);if(offer){p.offers=p.offers.filter(o=>o.id!==mapping.id);target.offers.push(offer);}}}
  // Metadata deferral is provisional. Resolve the final mapped selection before
  // output; rejected roles use the real generic path with fully hydrated offers.
  for(const id of deferredRoles){
   const p=productMap.get(id);
   if(!p||!p.offers.length||blockedRoles.has(id)||p.specification||applyReviewedStorageRole(p))continue;
   const generic=categorizeProduct(p),correction=ownerCorrections.get(id);
   productMap.set(id,correction?applyOverride(generic,correction):generic);
  }
  const reports=new Map<string,CollectionReport>();
  for(const row of runs.results)for(const report of JSON.parse(row.json) as CollectionReport[])if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  for(const report of initial.reports)if(!reports.has(report.retailerId))reports.set(report.retailerId,report);
  return {products:[...productMap.values()].filter(p=>p.offers.length>0).map(p=>normalizeHydratedProduct(p,blockedRoles.has(p.id),evidence)),reports:reports.size?[...reports.values()]:initial.reports,generatedAt:runs.results[0]?.created_at||initial.generatedAt,storage:'database'};
 }catch{return {...enrichedInitial,storage:'snapshot_unavailable_database'};}
}
