import {partColumns,partValue,type PartValue} from './part-comparison.ts';
import type {Product} from './types.ts';
export function comparisonRows(products:Product[]):{key:string;label:string;help:string;values:PartValue[];different:boolean}[]{
 const keys=new Map(products.flatMap(p=>partColumns[p.category]).map(c=>[c.key,c]));
 return [...keys.values()].map(c=>{const values=products.map(p=>partColumns[p.category].some(pc=>pc.key===c.key)?partValue(p,c.key):{value:'N/A',note:'Different equipment category.'});return {...c,values,different:new Set(values.map(v=>v.value)).size>1};});
}
