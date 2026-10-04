import {readFile} from 'node:fs/promises';
const origin=process.env.PV_API_ORIGIN||'http://127.0.0.1:5187';const token=process.env.PV_COLLECTOR_TOKEN;if(!token)throw new Error('PV_COLLECTOR_TOKEN is required.');
const data=JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url),'utf8'));let inserted=0,quarantined=0;
for(let i=0;i<data.products.length;i+=15){const response=await fetch(new URL('/api/ingest',origin),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({products:data.products.slice(i,i+15),reports:i===0?data.reports:[]})});if(!response.ok)throw new Error(`Seed failed (${response.status}): ${await response.text()}`);const result=await response.json();inserted+=result.inserted;quarantined+=result.quarantined;}
console.log(JSON.stringify({products:data.products.length,inserted,quarantined}));
