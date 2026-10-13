/** Explicit offline artifact copies only. No canonical write, source script or network client. */
import {readFile,writeFile,mkdir,realpath,stat,readdir,copyFile,rename,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {resolve,dirname,basename,relative,sep} from 'node:path';import {fileURLToPath} from 'node:url';
import {applyWattcycleIdentityMigration,assertWattcycleMigrationWriteBoundary,wattcycleApprovedSourceManifestSha256} from '../lib/wattcycle-identity-migration.ts';
import {assertCorrectionWriteBoundary} from '../lib/specification-correction-guard.ts';
const sha=b=>createHash('sha256').update(b).digest('hex'),args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error('Required '+name+' path');return resolve(args[i+1]);};
const indexPath=arg('--index'),catalogPath=arg('--catalog'),packet=arg('--packet'),outputPath=arg('--output'),reportPath=arg('--report'),site=fileURLToPath(new URL('..',import.meta.url));
const key=p=>process.platform==='win32'?p.toLowerCase():p,within=(p,root)=>key(p)===key(root)||key(p).startsWith(key(root)+sep);
async function canonical(p){try{return await realpath(p);}catch(e){if(e.code!=='ENOENT')throw e;const parent=dirname(p);if(parent===p)throw e;return resolve(await canonical(parent),basename(p));}}
async function identity(p){let info;try{info=await stat(p,{bigint:true});}catch(e){if(e.code!=='ENOENT')throw e;}return{canonical:await canonical(p),info};}
const aliases=(a,b)=>key(a.canonical)===key(b.canonical)||Boolean(a.info&&b.info&&a.info.dev===b.info.dev&&a.info.ino===b.info.ino);
const dataFiles=(await readdir(resolve(site,'data'))).map(n=>resolve(site,'data',n));
const packetPhysical=await canonical(packet),primaryInputs=await Promise.all([indexPath,catalogPath,resolve(packet,'manifest.json'),...dataFiles].map(identity));
let protectedSourcePaths=[];
async function preflight(){
 const dests=await Promise.all([outputPath,reportPath].map(identity));
 for(const d of dests){if(primaryInputs.some(p=>aliases(d,p)))throw Error('Destination aliases protected canonical/index/catalog/source input');if(within(d.canonical,packetPhysical))throw Error('Destination is within immutable source packet');if(d.info&&!d.info.isFile())throw Error('Output destination must be a regular file or absent');
  let root=dirname(d.canonical);while(root!==dirname(root)&&!(basename(root)==='specification-research'&&basename(dirname(root))==='output'))root=dirname(root);
  if(!(basename(root)==='specification-research'&&basename(dirname(root))==='output'))throw Error('Output artifacts must stay in an ignored output/specification-research directory');
  const repo=resolve(root,'../..'),probe=spawnSync('git',['-C',repo,'check-ignore','-q','--',relative(repo,d.canonical)],{encoding:'utf8'});if(probe.status!==0)throw Error('Output artifact directory must be Git-ignored in its repository');
 }
 if(aliases(dests[0],dests[1]))throw Error('Output and report destinations alias each other');
 if(dests.some(d=>d.info)){const sources=await Promise.all(protectedSourcePaths.map(identity));if(dests.some(d=>sources.some(s=>aliases(d,s))))throw Error('Destination aliases protected frozen source bytes');}
 return dests;
}
await preflight();
const manifestBytes=await readFile(resolve(packet,'manifest.json'));if(sha(manifestBytes)!==wattcycleApprovedSourceManifestSha256)throw Error('Approved frozen source manifest hash rejected');
const manifest=JSON.parse(manifestBytes),files={'manifest.json':manifestBytes};
for(const f of manifest.files){const p=resolve(packet,f.path);if(!within(p,packet))throw Error('Frozen source path escapes packet');files[f.path]=await readFile(p);protectedSourcePaths.push(p);}
await preflight();
const inputBytes=await readFile(indexPath),catalogBytes=await readFile(catalogPath),index=JSON.parse(inputBytes),catalog=JSON.parse(catalogBytes);if(!Array.isArray(catalog.products))throw Error('Explicit full catalog products required');
const result=applyWattcycleIdentityMigration(index,catalog.products,files);assertWattcycleMigrationWriteBoundary(catalog.products,result.index,files);assertCorrectionWriteBoundary(catalog.products,result.index);
const again=applyWattcycleIdentityMigration(result.index,catalog.products,files);if(again.identitiesChanged||again.correctedExistingFields||JSON.stringify(again.index)!==JSON.stringify(result.index))throw Error('Exact migration idempotence rejected');
const targetIds=new Set(['wattcycle-67838376313128','wattcycle-67838376345896','wattcycle-67838376378664']);let untouchedObjects=0,retainedFieldObjects=0,retainedSourceObjects=0,retainedPanelObjects=0,correctedFieldObjects=0;
for(const [id,old]of Object.entries(index)){const next=result.index[id];if(!targetIds.has(id)){if(JSON.stringify(old)!==JSON.stringify(next))throw Error('Untargeted full object changed '+id);untouchedObjects++;}
 if(JSON.stringify(old.notes)!==JSON.stringify(next.notes)||JSON.stringify(old.panelRatings)!==JSON.stringify(next.panelRatings))throw Error('Notes/panel provenance changed '+id);
 for(const field of old.groups.flatMap(g=>g.fields)){if(id==='wattcycle-67838376313128'&&field.key==='compatibility'&&JSON.stringify(field)!==JSON.stringify(next.groups.flatMap(g=>g.fields).find(f=>f.key==='compatibility'))){correctedFieldObjects++;continue;}if(!next.groups.flatMap(g=>g.fields).some(f=>JSON.stringify(f)===JSON.stringify(field)))throw Error('Existing field lost '+id+':'+field.key);retainedFieldObjects++;}
 for(const s of old.sources){if(!next.sources.some(t=>JSON.stringify(s)===JSON.stringify(t)))throw Error('Original source object lost '+id);retainedSourceObjects++;}retainedPanelObjects+=Number(Boolean(old.panelRatings));
}
if(correctedFieldObjects!==result.correctedExistingFields)throw Error('Correction scope differs from approved operation');
if(sha(await readFile(indexPath))!==sha(inputBytes)||sha(await readFile(catalogPath))!==sha(catalogBytes))throw Error('Protected input changed during offline review');
const output=Buffer.from(JSON.stringify(result.index)),report={...result,index:undefined,inputIndexSha256:sha(inputBytes),catalogSha256:sha(catalogBytes),outputIndexSha256:sha(output),untouchedObjects,retainedFieldObjects,correctedFieldObjects,retainedSourceObjects,retainedPanelObjects,inputIndexUnchanged:true,catalogUnchanged:true,packetWrites:false,canonicalWrites:false,networkCalls:0,sourceScriptsExecuted:false,existingRenogyBoundaryPassed:true,proposedWattcycleBoundaryPassed:true,originalFieldAndFullObjectAudit:result.audit};
// Stage both copies before publishing; roll back a partial pair on rename failure.
async function publish(payloads){await preflight();for(const p of payloads)await mkdir(dirname(p.path),{recursive:true});const ds=await preflight(),items=payloads.map((p,i)=>({...p,exists:Boolean(ds[i].info),stage:resolve(dirname(p.path),'.'+basename(p.path)+'.'+randomUUID()+'.stage'),backup:resolve(dirname(p.path),'.'+basename(p.path)+'.'+randomUUID()+'.backup'),saved:false,published:false}));
 try{for(const p of items){await writeFile(p.stage,p.bytes,{flag:'wx',flush:true});if(p.exists){await copyFile(p.path,p.backup,constants.COPYFILE_EXCL);p.saved=true;}}await preflight();for(const p of items){await rename(p.stage,p.path);p.published=true;}}
 catch(error){const failed=[];for(const p of [...items].reverse())if(p.published){try{if(p.saved)await rename(p.backup,p.path);else await unlink(p.path);}catch(e){failed.push(e);}}if(failed.length)throw new AggregateError([error,...failed],'Offline artifact rollback failed; recover retained backup files');for(const p of items){await unlink(p.stage).catch(()=>{});await unlink(p.backup).catch(()=>{});}throw error;}
 for(const p of items){await unlink(p.stage).catch(()=>{});await unlink(p.backup).catch(()=>{});}
}
await publish([{path:outputPath,bytes:output},{path:reportPath,bytes:Buffer.from(JSON.stringify(report,null,2)+'\n')}]);console.log(JSON.stringify({...report,audit:undefined,originalFieldAndFullObjectAudit:undefined}));
