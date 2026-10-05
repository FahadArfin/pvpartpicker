import type {Product} from './types.ts';

// Exact manufacturer aliases only. Mentioning compatibility in a product title
// does not make a third-party part a member of that manufacturer's ecosystem.
export const ecosystems=[
 {id:'victron',label:'Victron',aliases:['Victron Energy']},
 {id:'eg4',label:'EG4',aliases:['EG4 Electronics']},
 {id:'ecoflow',label:'EcoFlow',aliases:['EcoFlow US']},
 {id:'anker',label:'Anker',aliases:[]},
 {id:'pecron',label:'Pecron',aliases:[]},
 {id:'eco-worthy',label:'Eco-Worthy',aliases:['Ecoworthy']},
 {id:'enphase',label:'Enphase',aliases:[]},
 {id:'tesla',label:'Tesla',aliases:[]},
 {id:'sol-ark',label:'Sol-Ark',aliases:['Sol Ark']},
 {id:'growatt',label:'Growatt',aliases:[]},
 {id:'solaredge',label:'SolarEdge',aliases:['Solar edge']},
 {id:'generac',label:'Generac',aliases:[]},
 {id:'franklin',label:'Franklin',aliases:['FranklinWH','Franklin WH','Franklin Whole Home']},
 {id:'renogy',label:'Renogy',aliases:['Renogy US']},
];
function normalize(value:string) {return value.toLowerCase().replace(/[^a-z0-9]/g,'');}
export function resolveEcosystem(value:string) {
 const key=normalize(value);
 return ecosystems.find(e=>[e.id,e.label,...e.aliases].some(alias=>normalize(alias)===key));
}
export function matchesEcosystem(product:Pick<Product,'brand'>,id:string) {
 return !id||resolveEcosystem(product.brand)?.id===id;
}
export function ecosystemHref(brand:string) {
 const ecosystem=resolveEcosystem(brand);
 return ecosystem?`/?ecosystem=${ecosystem.id}&category=all`:undefined;
}
