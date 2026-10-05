import { env } from 'cloudflare:workers';
import {cache} from 'react';
import {readCatalog} from './catalog-reader';
import {createCatalogCache} from './catalog-cache';
import {serializePageCatalog} from './catalog-transport';
import {categorizeProduct} from './retailers';
import snapshot from '../data/catalog.json';
import specifications from '../data/specifications.json';
import {applySpecificationEvidence} from './specifications';
import type { Product, CollectionReport,ProductSpecification } from './types.ts';
export interface RuntimeEnv { DB: D1Database; COLLECTOR_TOKEN?: string; ADMIN_EMAIL?: string; RESEND_API_KEY?: string; EMAIL_FROM?: string; SITE_ORIGIN?: string; }
export function runtime() { return env as unknown as RuntimeEnv; }
export function database() { const db = runtime().DB; if (!db) throw new Error('Database is unavailable. Please try again later.'); return db; }
const stored=snapshot as unknown as {products:Product[];reports:CollectionReport[];generatedAt:string|null};
const evidence=specifications as unknown as Record<string,ProductSpecification>;
const initial={...stored,products:stored.products.map(p=>applySpecificationEvidence(categorizeProduct(p),evidence))};
export async function getCatalog(){
 try{return await readCatalog(database(),initial,evidence);}
 catch{return {...initial,storage:'snapshot_unavailable_database'};}
}
const publicCatalog=createCatalogCache(getCatalog,c=>c.storage==='database');
export const invalidatePublicCatalog=()=>publicCatalog.invalidate();
export const getPublicCatalog=async()=>(await publicCatalog.get()).value;
export const getPageCatalog=cache(getPublicCatalog);
// Serialize once per cached public catalog rather than once for every page.
const summaryBodies=new WeakMap<object,string>();
export async function getCatalogSummary(){
 const record=await publicCatalog.get();let body=summaryBodies.get(record);
 if(!body){const catalog=JSON.parse(serializePageCatalog(record.value));body=JSON.stringify({...catalog,version:1,expiresAt:record.expiresAt});summaryBodies.set(record,body);}
 return {body,expiresAt:record.expiresAt};
}
export async function rateLimit(userId: string, scope: string, limit = 40) {
  const db = database(), hour = Math.floor(Date.now() / 3600000), id = `${scope}:${userId}:${hour}`;
  await db.prepare('INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count = count + 1').bind(id, (hour + 2) * 3600000).run();
  const row = await db.prepare('SELECT count FROM rate_limits WHERE id = ?').bind(id).first<{ count: number }>(); if ((row?.count || 0) > limit) throw new Error('Too many requests. Please try again later.');
}
