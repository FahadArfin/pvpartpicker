import { env } from 'cloudflare:workers';
import {cache} from 'react';
import {readCatalog} from './catalog-reader';
import {categorizeProduct} from './retailers';
import snapshot from '../data/catalog.json';
import type { Product, CollectionReport } from './types.ts';
export interface RuntimeEnv { DB: D1Database; COLLECTOR_TOKEN?: string; ADMIN_EMAIL?: string; RESEND_API_KEY?: string; EMAIL_FROM?: string; SITE_ORIGIN?: string; }
export function runtime() { return env as unknown as RuntimeEnv; }
export function database() { const db = runtime().DB; if (!db) throw new Error('Database is unavailable. Please try again later.'); return db; }
const stored=snapshot as unknown as {products:Product[];reports:CollectionReport[];generatedAt:string|null};
const initial={...stored,products:stored.products.map(categorizeProduct)};
export async function getCatalog(){
 try{return await readCatalog(database(),initial);}
 catch{return {...initial,storage:'snapshot_unavailable_database'};}
}
// Request-scoped only: prices and overrides are read afresh on the next request.
export const getPageCatalog=cache(getCatalog);
export async function rateLimit(userId: string, scope: string, limit = 40) {
  const db = database(), hour = Math.floor(Date.now() / 3600000), id = `${scope}:${userId}:${hour}`;
  await db.prepare('INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count = count + 1').bind(id, (hour + 2) * 3600000).run();
  const row = await db.prepare('SELECT count FROM rate_limits WHERE id = ?').bind(id).first<{ count: number }>(); if ((row?.count || 0) > limit) throw new Error('Too many requests. Please try again later.');
}
