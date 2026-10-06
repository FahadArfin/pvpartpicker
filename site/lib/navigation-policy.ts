const routes=/^\/(?:parts|build|builds|deals|watchlist|tiers|compare|guide|products|community)(?:\/|$)/;

/** Only app pages, never auth endpoints, files, API calls or external URLs. */
export function appDestination(href:string|undefined,current:string):string|null{
 if(!href||href.startsWith('#'))return null;
 try{const here=new URL(current),url=new URL(href,here);
  if(url.origin!==here.origin||!(url.pathname==='/'||routes.test(url.pathname)))return null;
  if(url.pathname===here.pathname&&url.search===here.search)return null;
  if(/\.[a-z0-9]+$/i.test(url.pathname))return null;
  return url.pathname+url.search+url.hash;
 }catch{return null;}
}
export function allowsPrefetch(connection?:{saveData?:boolean;effectiveType?:string}):boolean{
 return !connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType||'');
}

/** Avoid warming every product in a dense list as the pointer moves across it. */
export function createPrefetchBudget(now:()=>number=Date.now){
 const recent=new Map<string,number>();
 return {take(href:string){
  for(const [key,time] of recent)if(time<=now()-30_000)recent.delete(key);
  if(recent.has(href)||recent.size>=8)return false;
  recent.set(href,now());return true;
 },release(href:string){recent.delete(href);}};
}
