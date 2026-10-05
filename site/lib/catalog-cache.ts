export const catalogTtlMs=120_000;
export interface CachedCatalog<T>{value:T;expiresAt:number;}

// Public data only. Keep writes, ownership checks and alert evaluation uncached.
// Isolates can disappear at any time; D1 remains the authoritative store.
export function createCatalogCache<T>(load:()=>Promise<T>,healthy:(value:T)=>boolean=()=>true,now:()=>number=Date.now){
 let saved:CachedCatalog<T>|undefined,pending:Promise<CachedCatalog<T>>|undefined,generation=0;
 return {
  get():Promise<CachedCatalog<T>>{
   if(saved&&saved.expiresAt>now())return Promise.resolve(saved);
   if(pending)return pending;
   const current=generation;
   const reading=load().then(value=>{
    const valid=healthy(value),record={value,expiresAt:now()+(valid?catalogTtlMs:0)};
    if(valid&&current===generation)saved=record;
    return record;
   }).finally(()=>{if(pending===reading)pending=undefined;});
   pending=reading;return reading;
  },
  invalidate(){generation++;saved=undefined;pending=undefined;}
 };
}
