import type {Product,CollectionReport} from './types.ts';
export interface PageCatalog {products:Product[];reports:CollectionReport[];}
export function serializePageCatalog(catalog:PageCatalog):string{
 // Detail routes receive their full product separately. The shared shell needs
 // names, thumbnails, specifications and offers, but not descriptions/galleries.
 // A single JSON value avoids Flight traversing thousands of nested objects.
 return JSON.stringify({products:catalog.products.map(p=>({...p,description:'',images:[]})),reports:catalog.reports});
}
