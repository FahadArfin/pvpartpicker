import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import fixture from './fixtures/wattcycle-reviewed-migration.json' with {type:'json'};
import {importReviewedSpecification} from '../lib/reviewed-specifications.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
const products=fixture.products as unknown as Product[],evidence=fixture.evidence as Record<string,ProductSpecification>;
const writerScripts=['collect-specifications.mjs','import-reviewed-specifications.mjs','enrich-wire-sources.mjs','update-connection-evidence.mjs'];
const seededEvidence={...evidence,...Object.fromEntries(['eg4-18kpv','eg4-6000xp','santan-solar-eg4-lifepower4v2-48v-100ah'].map(id=>[id,{summary:'Fixture EG4',groups:[],sources:[],notes:[]}]))};
const reviewed=products.map(p=>({productIds:[p.id],expected:{[p.id]:evidence[p.id].identity},url:'https://example.test/reviewed-weight.pdf',kind:'manual',rows:[['Weight','12 kg']]}));
const root=fileURLToPath(new URL('../',import.meta.url));
async function sandbox(){
 const dir=await mkdtemp(join(tmpdir(),'wattcycle-writers-'));
 await cp(join(root,'lib'),join(dir,'lib'),{recursive:true});await mkdir(join(dir,'scripts'));await mkdir(join(dir,'data'));await mkdir(join(dir,'cache'));
 await symlink(join(root,'node_modules'),join(dir,'node_modules'),'junction');
 await writeFile(join(dir,'package.json'),'{"type":"module"}');
 for(const name of writerScripts)await cp(join(root,'scripts',name),join(dir,'scripts',name));
 for(const name of ['specification-corrections.json','specification-quarantines.json','retailer-sources.json'])await cp(join(root,'data',name),join(dir,'data',name));
 await writeFile(join(dir,'data/specification-reviewed.json'),'[]');await writeFile(join(dir,'reviewed.json'),'[]');
 await writeFile(join(dir,'cache/sources.json'),'{"sources":{},"failures":[]}');
 await writeFile(join(dir,'data/specifications.json'),JSON.stringify(seededEvidence));
 await writeFile(join(dir,'data/specification-audit.json'),'{"missing":[]}');
 await writeFile(join(dir,'offline.mjs'),"globalThis.fetch=async url=>{if(url!=='https://temcoindustrial.com/robots.txt')throw Error('Unexpected network request '+url);return new Response('User-agent: *\\nAllow: /');};");
 return dir;
}
function run(dir:string,script:string){return spawnSync(process.execPath,['--experimental-strip-types','--import',pathToFileURL(join(dir,'offline.mjs')).href,join(dir,'scripts',script),'--catalog',join(dir,'catalog.json'),'--reviewed',join(dir,'reviewed.json'),'--report',join(dir,'report'),'--cache',join(dir,'cache')],{encoding:'utf8'});}
test('reviewed single-record imports preserve a held protected prior without requiring sibling records',()=>{
 for(const original of products){const p=structuredClone(original);p.name+=' changed';const prior=structuredClone(evidence[p.id]);assert.deepEqual(importReviewedSpecification(p,[],prior),prior);assert.deepEqual(prior,evidence[p.id]);}
});
test('reviewed single-record imports reject missing protected source objects even without new records',()=>{
 for(const p of products){const prior=structuredClone(evidence[p.id]);prior.sources.shift();assert.throws(()=>importReviewedSpecification(p,[],prior),/WattCycle/);}
});
test('all canonical writers preserve all protected objects during held and partial-category raw catalogs',async()=>{
 for(const script of writerScripts)for(const categorySubset of [false,true]){
  const dir=await sandbox();try{
   const raw=structuredClone(products);raw[0].category='batteries';raw[1].offers[0].packQuantity=9;raw[2].offers=[];
   const catalog=JSON.stringify({products:categorySubset?[]:raw});await writeFile(join(dir,'catalog.json'),catalog);await writeFile(join(dir,'data/catalog.json'),catalog);await writeFile(join(dir,'reviewed.json'),JSON.stringify(reviewed));
   const result=run(dir,script);assert.equal(result.status,0,result.stderr);
   const next=JSON.parse(await readFile(join(dir,'data/specifications.json'),'utf8'));for(const p of products)assert.deepEqual(next[p.id],evidence[p.id]);
   if(script==='import-reviewed-specifications.mjs'){const report=JSON.parse(await readFile(join(dir,'report/import-report.json'),'utf8'));assert(report.rows.every((row:{status:string;addedTechnicalFields:unknown[];resolvedComparisonFields:unknown[]})=>row.status!=='reviewed-imported'&&!row.addedTechnicalFields.length&&!row.resolvedComparisonFields.length));}
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});
test('all canonical writers reject invalid protected priors before changing index bytes',async()=>{
 for(const script of writerScripts){
  const dir=await sandbox();try{
   const invalid=structuredClone(seededEvidence);invalid[products[0].id].sources.shift();const before=JSON.stringify(invalid);
   await writeFile(join(dir,'data/specifications.json'),before);await writeFile(join(dir,'catalog.json'),'{"products":[]}');await writeFile(join(dir,'data/catalog.json'),'{"products":[]}');
   const result=run(dir,script);assert.notEqual(result.status,0);assert.match(result.stderr,/WattCycle/);assert.equal(await readFile(join(dir,'data/specifications.json'),'utf8'),before);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});



test('single-record approved additions require raw selection and preserve protected fields and prior bytes',()=>{
 for(const p of products){
  const prior=structuredClone(evidence[p.id]),records=reviewed as Parameters<typeof importReviewedSpecification>[1];
  const next=importReviewedSpecification(p,records,prior)!;
  assert.equal(next.groups.flatMap(g=>g.fields).find(f=>f.key==='weight')?.value,'12 kg');
  assert.deepEqual(prior,evidence[p.id]);
  for(const q of [{...p,offers:[]},{...p,offers:[{...p.offers[0],recordedPackQuantity:9}]}])assert.deepEqual(importReviewedSpecification(q,records,prior),prior);
 }
});
import quarantineFixture from './fixtures/specification-quarantines.json' with {type:'json'};
test('wire and connection writers reject restored quarantine tuples before any canonical write',async()=>{
 for(const script of ['enrich-wire-sources.mjs','update-connection-evidence.mjs']){
  const dir=await sandbox();try{
   const {product,before:bad}=quarantineFixture[1];
   const prior={...seededEvidence,[product.id]:bad},bytes=JSON.stringify(prior),catalog=JSON.stringify({products:[product]});
   await writeFile(join(dir,'data/specifications.json'),bytes);await writeFile(join(dir,'catalog.json'),catalog);await writeFile(join(dir,'data/catalog.json'),catalog);
   const audit=await readFile(join(dir,'data/specification-audit.json'),'utf8');
   const result=run(dir,script);assert.notEqual(result.status,0,script+' accepted restored quarantine');assert.match(result.stderr,/quarantine write boundary/);
   assert.equal(await readFile(join(dir,'data/specifications.json'),'utf8'),bytes);assert.equal(await readFile(join(dir,'data/catalog.json'),'utf8'),catalog);assert.equal(await readFile(join(dir,'data/specification-audit.json'),'utf8'),audit);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});
