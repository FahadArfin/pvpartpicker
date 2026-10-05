/** Estimates remain in a separate detail-only index. No catalog measurements are changed. */
import {readFile,writeFile} from 'node:fs/promises';
import {estimateSpecifications,estimateIdentity} from '../lib/specification-estimates.ts';
import {categorizeProduct} from '../lib/retailers.ts';
const data=new URL('../data/',import.meta.url),catalog=JSON.parse(await readFile(new URL('catalog.json',data),'utf8'));
const specs=JSON.parse(await readFile(new URL('specifications.json',data),'utf8'));
const peers=catalog.products.map(p=>({...categorizeProduct(p),specification:specs[p.id]}));
const index={};for(const p of peers){const fields=estimateSpecifications(p,peers);if(fields.length)index[p.id]={identity:estimateIdentity(p),fields};}
await writeFile(new URL('specification-estimates.json',data),JSON.stringify(index));
console.log(JSON.stringify({products:Object.keys(index).length,fields:Object.values(index).reduce((n,r)=>n+r.fields.length,0),byField:Object.values(index).flatMap(r=>r.fields).reduce((a,f)=>(a[f.key]=(a[f.key]||0)+1,a),{})},null,2));
