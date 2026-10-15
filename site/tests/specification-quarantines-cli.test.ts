import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,readFile,rm,mkdir}from'node:fs/promises';import {tmpdir}from'node:os';import {join,dirname}from'node:path';import {spawnSync}from'node:child_process';import {fileURLToPath}from'node:url';
import data from './fixtures/specification-quarantines.json' with {type:'json'};
import {quarantineLedger}from'../lib/specification-quarantine-guard.ts';
const script=fileURLToPath(new URL('../scripts/apply-reviewed-quarantines.mjs',import.meta.url));
test('offline quarantine CLI refuses input aliases and mismatched source bytes without writing artifacts',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pv-quarantine-'));try{
  const index=join(dir,'index.json'),catalog=join(dir,'catalog.json'),output=join(dir,'output.json'),report=join(dir,'report.json');await writeFile(index,JSON.stringify(Object.fromEntries(data.map(f=>[f.product.id,f.before]))));await writeFile(catalog,JSON.stringify({products:data.map(f=>f.product)}));const before=await readFile(index,'utf8');
  const run=(out:string,rep:string)=>spawnSync(process.execPath,['--experimental-strip-types',script,'--index',index,'--catalog',catalog,'--source-root',dir,'--output',out,'--report',rep],{encoding:'utf8'});
  const aliases=run(index,report);assert.notEqual(aliases.status,0);assert.match(aliases.stderr,/Destination/);assert.equal(await readFile(index,'utf8'),before);
  for(const a of quarantineLedger.entries.flatMap(e=>e.sourceArtifacts)){const path=join(dir,a.path);await mkdir(dirname(path),{recursive:true});await writeFile(path,'wrong source');}
  const wrong=run(output,report);assert.notEqual(wrong.status,0);assert.match(wrong.stderr,/Source bytes/);await assert.rejects(readFile(output),/ENOENT/);await assert.rejects(readFile(report),/ENOENT/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
