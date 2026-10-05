/** Reparse cached HTML with current extraction rules. No retailer requests. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {specificationRowsFromHtml} from '../lib/specification-html.ts';
const root=resolve(process.argv[2]||'../output/spec-research');
const file=resolve(root,'sources.json'),data=JSON.parse(await readFile(file,'utf8'));let changed=0;
for(const [url,source] of Object.entries(data.sources)){const path=resolve(root,createHash('sha256').update(url).digest('hex').slice(0,16)+'.html');let html;try{html=await readFile(path,'utf8');}catch{continue;}const rows=specificationRowsFromHtml(html,url);if(JSON.stringify(rows)!==JSON.stringify(source.rows)){source.rows=rows;changed++;}}
await writeFile(file,JSON.stringify(data,null,2));console.log(JSON.stringify({changed,pages:Object.keys(data.sources).length}));
