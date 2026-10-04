import { env } from 'cloudflare:workers';
import {applyOverride} from './overrides';
import {categorizeProduct} from './retailers';
import snapshot from '../data/catalog.json';
import type { Product, Offer, CollectionReport } from './types.ts';
export interface RuntimeEnv { DB: D1Database; COLLECTOR_TOKEN?: string; ADMIN_EMAIL?: string; RESEND_API_KEY?: string; EMAIL_FROM?: string; SITE_ORIGIN?: string; }
export function runtime() { return env as unknown as RuntimeEnv; }
export function database() { const db = runtime().DB; if (!db) throw new Error('Database is unavailable. Please try again later.'); return db; }
export async function getCatalog(): Promise<{ products: Product[]; reports: CollectionReport[]; generatedAt: string | null; storage: string }> {
  const stored = snapshot as unknown as { products: Product[]; reports: CollectionReport[]; generatedAt: string | null };
  const initial = {...stored,products:stored.products.map(categorizeProduct)};
  try {
    const db = database(); const rows = await db.prepare('SELECT json FROM products LIMIT 5000').all<{ json: string }>();
    if (!rows.results.length) return { ...initial, storage: 'snapshot' };
    const productMap = new Map(initial.products.map(p => [p.id, { ...p, offers: [...p.offers] }]));
    for (const row of rows.results) { const p = categorizeProduct(JSON.parse(row.json) as Product); productMap.set(p.id, { ...p, offers: [] }); }
    const offerRows = await db.prepare('SELECT product_id, json FROM offers LIMIT 20000').all<{ product_id: string; json: string }>();
    for (const row of offerRows.results) {const p=productMap.get(row.product_id);const o=JSON.parse(row.json) as Offer;p?.offers.push((p.category==='kits'||p.category==='all-in-one')?{...o,packQuantity:1}:o);}
    const corrections=await db.prepare('SELECT id,json FROM product_overrides').all<{id:string;json:string}>();for(const row of corrections.results){const p=productMap.get(row.id);if(p)productMap.set(row.id,applyOverride(p,JSON.parse(row.json)));}
    const mappings=await db.prepare('SELECT id,product_id FROM offer_mappings').all<{id:string;product_id:string}>();for(const m of mappings.results){const target=productMap.get(m.product_id);if(!target)continue;for(const p of productMap.values()){if(p.id===target.id)continue;const offer=p.offers.find(o=>o.id===m.id);if(offer){p.offers=p.offers.filter(o=>o.id!==m.id);target.offers.push(offer);}}}
    const runs = await db.prepare('SELECT json, created_at FROM collection_runs ORDER BY created_at DESC LIMIT 7').all<{ json: string; created_at: string }>();
    const reports = new Map<string, CollectionReport>(); for (const row of runs.results) for (const r of JSON.parse(row.json) as CollectionReport[]) if (!reports.has(r.retailerId)) reports.set(r.retailerId, r);
    return { products: [...productMap.values()].filter(p=>p.offers.length>0), reports: reports.size ? [...reports.values()] : initial.reports, generatedAt: runs.results[0]?.created_at || initial.generatedAt, storage: 'database' };
  } catch { return { ...initial, storage: 'snapshot_unavailable_database' }; }
}
export async function rateLimit(userId: string, scope: string, limit = 40) {
  const db = database(), hour = Math.floor(Date.now() / 3600000), id = `${scope}:${userId}:${hour}`;
  await db.prepare('INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count = count + 1').bind(id, (hour + 2) * 3600000).run();
  const row = await db.prepare('SELECT count FROM rate_limits WHERE id = ?').bind(id).first<{ count: number }>(); if ((row?.count || 0) > limit) throw new Error('Too many requests. Please try again later.');
}
