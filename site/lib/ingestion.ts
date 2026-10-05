import { retailers } from './retailers.ts';
import type { Product } from './types.ts';
import {categories} from './types.ts';
export function validateIngestion(data: unknown, sources: Pick<(typeof retailers)[number],'id'|'origin'>[] = retailers): { products: Product[]; reports: unknown[] } {
  const d = data as { products: Product[]; reports?: unknown[] }; if (!d || !Array.isArray(d.products) || d.products.length > 20 || (d.reports && (!Array.isArray(d.reports) || d.reports.length > 7))) throw new Error('Invalid collection batch.');
  for (const p of d.products) {
    if (!p || typeof p.id !== 'string' || !/^[a-z0-9-]{1,180}$/.test(p.id) || typeof p.name !== 'string' || p.name.length > 500 || !categories.some(c=>c.id===p.category) || !Array.isArray(p.offers) || p.offers.length > 50 || typeof p.description !== 'string' || p.description.length > 10000 || !p.specs || typeof p.specs !== 'object') throw new Error('Invalid product.');
    for (const o of p.offers) { const retailer = sources.find(r => r.id === o.retailerId); if (!retailer || new URL(o.url).origin !== retailer.origin || !/^[a-z0-9-]{1,200}$/.test(o.id) || !Number.isFinite(o.price) || o.price <= 0 || o.price > 1000000 || (o.referencePrice!==undefined&&(!Number.isFinite(o.referencePrice)||o.referencePrice<=o.price||o.referencePrice>1000000)) || o.currency !== 'USD' || !Number.isInteger(o.packQuantity) || o.packQuantity < 1 || o.packQuantity > 10000 || !['in_stock','out_of_stock','unknown'].includes(o.stock) || !Number.isFinite(Date.parse(o.observedAt)) || Date.parse(o.observedAt) > Date.now() + 60000) throw new Error('Invalid offer.'); }
  }
  return { products: d.products, reports: d.reports || [] };
}
