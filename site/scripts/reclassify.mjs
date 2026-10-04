import {readFile,writeFile} from 'node:fs/promises';
import {classify,extractSpecs,extractPackQuantity,canonicalId,mergeProducts} from '../lib/retailers.ts';
const file=new URL('../data/catalog.json',import.meta.url);const d=JSON.parse(await readFile(file,'utf8'));
const progress=JSON.parse(await readFile(new URL('../data/collection-progress.json',import.meta.url),'utf8'));
d.products=mergeProducts(Object.values(progress.completed).flat().filter(p=>classify(p.name)).map(p=>{const category=classify(p.name);const count=extractPackQuantity(p.name,category);const o=p.offers[0];return {...p,id:canonicalId(p.name,category,o.retailerId+'-'+o.sku),category,specs:{...p.specs,...extractSpecs(p.name,category)},offers:p.offers.map(o=>({...o,packQuantity:count}))};}).filter(p=>p.offers[0].packQuantity));
await writeFile(file,JSON.stringify(d,null,2));console.log(JSON.stringify({products:d.products.length}));
