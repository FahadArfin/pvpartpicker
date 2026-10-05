import {bestOffer} from './domain.ts';
import type {Product} from './types.ts';
export interface CatalogState {category:string;ecosystem:string;q:string;brand:string;maxPrice:string;inStock:boolean;condition:string;sort:string;attributes:Record<string,string>;}
/** Automatic pricing is the default; an explicit condition selection keeps its offer. */
export function catalogBuildOfferId(product:Product|undefined,condition:string):string|undefined{
 if(!product||condition==='all')return;
 const selected={...product,offers:product.offers.filter(o=>o.condition===condition)};
 return bestOffer(selected)?.id||selected.offers[0]?.id;
}
export function readCatalogState(params:URLSearchParams):CatalogState{
 const attributes:Record<string,string>={};
 for(const [key,value] of params)if(/^f\.[a-zA-Z][a-zA-Z0-9]{0,35}$/.test(key)&&value.length<=100)attributes[key.slice(2)]=value;
 const price=params.get('maxPrice')||'';
 return {category:params.get('category')||'panels',ecosystem:params.get('ecosystem')||'',q:(params.get('q')||'').slice(0,100),brand:(params.get('brand')||'').slice(0,100),maxPrice:price&&Number.isFinite(Number(price))&&Number(price)>=0?price:'',inStock:params.get('stock')==='1',condition:['new','used'].includes(params.get('condition')||'')?params.get('condition')!:'all',sort:params.get('sort')||'recommended',attributes};
}
export function catalogStateUrl(current:string,state:CatalogState):string{
 const url=new URL(current,'https://pvpartpicker.invalid');
 for(const key of [...url.searchParams.keys()])if(key.startsWith('f.')||['category','ecosystem','q','brand','maxPrice','stock','condition','sort'].includes(key))url.searchParams.delete(key);
 for(const [key,value] of Object.entries({category:state.category,ecosystem:state.ecosystem,q:state.q,brand:state.brand,maxPrice:state.maxPrice,stock:state.inStock?'1':'',condition:state.condition==='all'?'':state.condition,sort:state.sort==='recommended'?'':state.sort}))if(value)url.searchParams.set(key,value);
 for(const [key,value] of Object.entries(state.attributes))if(value)url.searchParams.set('f.'+key,value);
 return url.pathname+'?'+url.searchParams.toString()+url.hash;
}
