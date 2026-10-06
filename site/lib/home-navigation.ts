/** Preserve shared catalog links without treating campaign tags as catalog filters. */
export function legacyCatalogDestination(params:Record<string,string|string[]|undefined>):string|null {
  const keys=['category','ecosystem','q','brand','maxPrice','stock','condition','sort','builder'];
  if(!Object.keys(params).some(key=>keys.includes(key)||key.startsWith('f.')))return null;
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(params)) {
    if(Array.isArray(value))value.forEach(v=>query.append(key,v));
    else if(value!==undefined)query.set(key,value);
  }
  return '/parts?'+query.toString();
}
