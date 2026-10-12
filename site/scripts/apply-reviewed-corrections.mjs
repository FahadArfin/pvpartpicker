/** Required explicit paths; only writes a separate review artifact, never the input index. No network. */
import {readFile,writeFile,mkdir,realpath,stat,copyFile,rename,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,basename} from 'node:path';
import {applyReviewedCorrections,correctionSha256} from '../lib/specification-corrections.ts';
import {correctionLedger,assertCorrectionWriteBoundary} from '../lib/specification-correction-guard.ts';
import {categorizeProduct} from '../lib/retailers.ts';
const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error('Required '+name+' path');return resolve(args[i+1]);};
const indexPath=arg('--index'),catalogPath=arg('--catalog'),root=arg('--source-root'),outputPath=arg('--output'),reportPath=arg('--report');
const protectedPaths=[indexPath,catalogPath,fileURLToPath(new URL('../data/specification-corrections.json',import.meta.url)),...correctionLedger.sourceArtifacts.map(a=>resolve(root,a.path))];
const pathKey=p=>process.platform==='win32'?p.toLowerCase():p;
async function canonicalPath(path){try{return await realpath(path);}catch(e){if(e.code!=='ENOENT')throw e;const parent=dirname(path);if(parent===path)throw e;return resolve(await canonicalPath(parent),basename(path));}}
async function pathIdentity(path){const canonical=pathKey(await canonicalPath(path));let info;try{info=await stat(path,{bigint:true});}catch(e){if(e.code!=='ENOENT')throw e;}return {canonical,info};}
const aliases=(a,b)=>a.canonical===b.canonical||Boolean(a.info&&b.info&&a.info.dev===b.info.dev&&a.info.ino===b.info.ino);
async function preflightDestinations(){
 const inputs=await Promise.all(protectedPaths.map(pathIdentity)),destinations=await Promise.all([outputPath,reportPath].map(pathIdentity));
 for(const d of destinations){if(inputs.some(i=>aliases(d,i)))throw Error('Destination aliases protected correction input or source');if(d.info&&!d.info.isFile())throw Error('Destination must be a regular file or absent');}
 if(aliases(destinations[0],destinations[1]))throw Error('Output and report destinations alias each other');
 return destinations;
}
await preflightDestinations();
// Both complete payloads are staged before either destination is atomically replaced.
// If a later rename fails, restore previously published files from untouched backups.
async function publishPair(payloads){
 await preflightDestinations();for(const p of payloads)await mkdir(dirname(p.path),{recursive:true});
 const destinations=await preflightDestinations(),artifacts=payloads.map((p,i)=>({...p,existed:Boolean(destinations[i].info),stage:resolve(dirname(p.path),'.'+basename(p.path)+'.'+randomUUID()+'.stage'),backup:resolve(dirname(p.path),'.'+basename(p.path)+'.'+randomUUID()+'.backup'),published:false,backedUp:false}));
 try{
  for(const p of artifacts){await writeFile(p.stage,p.bytes,{flag:'wx',flush:true});if(p.existed){await copyFile(p.path,p.backup,constants.COPYFILE_EXCL);p.backedUp=true;}}
  await preflightDestinations();
  for(const p of artifacts){await rename(p.stage,p.path);p.published=true;}
 }catch(error){const failures=[];
  for(const p of [...artifacts].reverse())if(p.published){try{if(p.backedUp)await rename(p.backup,p.path);else await unlink(p.path);}catch(e){failures.push(e);}}
  if(failures.length)throw new AggregateError([error,...failures],'Correction publication and rollback failed; recover original bytes from retained .backup files');
  for(const p of artifacts){await unlink(p.stage).catch(()=>{});await unlink(p.backup).catch(()=>{});}throw error;
 }
 for(const p of artifacts){await unlink(p.stage).catch(()=>{});await unlink(p.backup).catch(()=>{});}
}
const beforeBytes=await readFile(indexPath),catalogBytes=await readFile(catalogPath),prior=JSON.parse(beforeBytes),catalog=JSON.parse(catalogBytes),products=catalog.products.map(categorizeProduct),sourceHashes={},sourceBytes={};
for(const a of correctionLedger.sourceArtifacts){sourceBytes[a.path]=await readFile(resolve(root,a.path));sourceHashes[a.path]=correctionSha256(sourceBytes[a.path]);}
// Parse the actual manufacturer variant object from the hash-verified inert retained HTML.
const html=sourceBytes['output/spec-research/ef6ccd32086f6a35.html'].toString('utf8'),selectedVariants={};
for(const e of correctionLedger.entries){const id=e.id.slice(7),variants=[];
 for(const start of html.matchAll(new RegExp('\\{"id":'+id+',','g'))){let depth=0,inString=false,escaped=false;
  for(let i=start.index;i<html.length;i++){const c=html[i];if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;}else if(c==='"')inString=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){try{variants.push(JSON.parse(html.slice(start.index,i+1)));}catch{}break;}}
 }
 const v=variants.find(v=>String(v.id)===id&&v.sku===e.exactControllerSku);if(!v)throw Error('Frozen source selected SKU missing '+e.id);
 selectedVariants[e.id]={id:String(v.id),sku:v.sku,sourceUrl:e.expected.sourceUrl};
}
const result=applyReviewedCorrections(prior,products,sourceHashes,selectedVariants);
assertCorrectionWriteBoundary(products,result.index);
const rerun=applyReviewedCorrections(result.index,products,sourceHashes,selectedVariants);if(rerun.changes!==0||JSON.stringify(rerun.index)!==JSON.stringify(result.index))throw Error('Idempotence failed');
let untouchedObjects=0,retainedFields=0,retainedSourceObjects=0,retainedPanelObjects=0;const differences=[];
for(const [id,old] of Object.entries(prior)){
 const entry=correctionLedger.entries.find(e=>e.id===id),next=result.index[id];
 if(!entry){if(JSON.stringify(old)!==JSON.stringify(next))throw Error('Untargeted change '+id);untouchedObjects++;}
 for(const g of old.groups)for(const f of g.fields){const change=entry?.changes.find(c=>c.key===f.key);if(change&&JSON.stringify(f)!==JSON.stringify(change.replacement)){differences.push({id,key:f.key,old:f,new:change.replacement});continue;}if(!next.groups.some(h=>h.title===g.title&&h.fields.some(x=>JSON.stringify(x)===JSON.stringify(f))))throw Error('Lost field '+id+':'+f.key);retainedFields++;}
 if(JSON.stringify(old.sources)!==JSON.stringify(next.sources)||JSON.stringify(old.identity)!==JSON.stringify(next.identity)||JSON.stringify(old.notes)!==JSON.stringify(next.notes)||JSON.stringify(old.panelRatings)!==JSON.stringify(next.panelRatings))throw Error('Lost provenance '+id);
 retainedSourceObjects+=old.sources.length;if(old.panelRatings)retainedPanelObjects++;
}
if(differences.length!==result.changes||differences.some(d=>!correctionLedger.entries.find(e=>e.id===d.id)?.changes.some(c=>c.key===d.key&&JSON.stringify(c.oldFullField)===JSON.stringify(d.old))))throw Error('Unexpected correction scope');
const negativeChecks=[];for(const key of ['name','sourceUrl','category','anchors']){const ps=structuredClone(products),p=ps.find(p=>p.id===correctionLedger.entries[0].id);if(key==='anchors')p.specs.chargeCurrentA=40;else p[key]='changed';try{applyReviewedCorrections(prior,ps,sourceHashes,selectedVariants);throw Error('accepted');}catch(e){if(e.message==='accepted')throw e;negativeChecks.push(key+': rejected');}}
for(const a of correctionLedger.sourceArtifacts){try{applyReviewedCorrections(prior,products,{...sourceHashes,[a.path]:'wrong'},selectedVariants);throw Error('accepted');}catch(e){if(e.message==='accepted')throw e;negativeChecks.push(a.path+': rejected');}}
for(const e of correctionLedger.entries){const altered=structuredClone(prior);altered[e.id].groups.flatMap(g=>g.fields).find(f=>f.key===e.changes[0].key).value='changed';try{applyReviewedCorrections(altered,products,sourceHashes,selectedVariants);throw Error('accepted');}catch(e){if(e.message==='accepted')throw e;negativeChecks.push(e.id+' fullfield/object: rejected');}}
const afterBytes=Buffer.from(JSON.stringify(result.index)),report={ledgerId:correctionLedger.id,selectedVariants,sourceHashes,inputIndexSha256:correctionSha256(beforeBytes),catalogSha256:correctionSha256(catalogBytes),outputIndexSha256:correctionSha256(afterBytes),changes:result.changes,numericReplacements:differences.filter(d=>d.new).length,genericLengthQuarantines:differences.filter(d=>!d.new).length,untouchedObjects,retainedFields,retainedSourceObjects,retainedPanelObjects,idempotentChanges:rerun.changes,differences,negativeChecks,sourceIndexUnchanged:correctionSha256(await readFile(indexPath))===correctionSha256(beforeBytes),catalogUnchanged:correctionSha256(await readFile(catalogPath))===correctionSha256(catalogBytes)};
await publishPair([{path:outputPath,bytes:afterBytes},{path:reportPath,bytes:Buffer.from(JSON.stringify(report,null,2)+'\n')}]);console.log(JSON.stringify({...report,sourceHashes:undefined,differences:undefined,negativeChecks:negativeChecks.length}));
