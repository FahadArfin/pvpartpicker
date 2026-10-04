import {readFile,writeFile} from 'node:fs/promises';
import {categorizeProduct} from '../lib/retailers.ts';
import {categories} from '../lib/types.ts';
const file=new URL('../data/catalog.json',import.meta.url);
const data=JSON.parse(await readFile(file,'utf8'));
data.products=data.products.map(categorizeProduct);
await writeFile(file,JSON.stringify(data,null,2));
console.log(JSON.stringify({products:data.products.length,categories:Object.fromEntries(categories.map(c=>[c.id,data.products.filter(p=>p.category===c.id).length]))}));
