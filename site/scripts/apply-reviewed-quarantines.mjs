/** Offline-only migration. Explicit inputs and new output paths are required. */
import {readFile,writeFile,mkdir,realpath,stat,unlink} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {quarantineLedger} from '../lib/specification-quarantine-guard.ts';
import {applyReviewedQuarantines,quarantineSha256} from '../lib/specification-quarantines.ts';
const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error('Required '+name+' path');return resolve(args[i+1]);};
const indexPath=arg('--index'),catalogPath=arg('--catalog'),sourceRoot=arg('--source-root'),outputPath=arg('--output'),reportPath=arg('--report');
const artifacts=quarantineLedger.entries.flatMap(e=>e.sourceArtifacts),protectedPaths=[indexPath,catalogPath,fileURLToPath(new URL('../data/specification-quarantines.json',import.meta.url)),...artifacts.map(a=>resolve(sourceRoot,a.path))];
async function canonical(path){try{return await realpath(path);}catch(e){if(e.code!=='ENOENT')throw e;return resolve(await canonical(dirname(path)),basename(path));}}
const key=p=>process.platform==='win32'?p.toLowerCase():p;
const inputs=await Promise.all(protectedPaths.map(async p=>key(await canonical(p)))),out=key(await canonical(outputPath)),rep=key(await canonical(reportPath));
if(out===rep||inputs.includes(out)||inputs.includes(rep))throw Error('Destination aliases protected input or another output');
// Exclusive creation also prevents hardlink aliases and accidental replacement.
for(const path of [outputPath,reportPath]){try{await stat(path);throw Error('Destination must be absent: '+path);}catch(e){if(e.code!=='ENOENT')throw e;}}
const beforeBytes=await readFile(indexPath),catalogBytes=await readFile(catalogPath),prior=JSON.parse(beforeBytes),products=JSON.parse(catalogBytes).products,hashes={},bytes={};
for(const a of artifacts){bytes[a.path]=await readFile(resolve(sourceRoot,a.path));hashes[a.path]=quarantineSha256(bytes[a.path]);if(hashes[a.path]!==a.sha256)throw Error('Source bytes rejected '+a.path);}
function objectAt(s,start){let depth=0,quoted=false,escaped=false;for(let i=start;i<s.length;i++){const c=s[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){try{return JSON.parse(s.slice(start,i+1));}catch{return;}}}}
const selected={};for(const e of quarantineLedger.entries){const html=bytes[e.sourceArtifacts[0].path].toString('utf8'),id=e.id.slice(7),variants=[];for(const match of html.matchAll(new RegExp('"id"\\s*:\\s*"?'+id+'"?','g'))){const v=objectAt(html,html.lastIndexOf('{',match.index));if(v&&String(v.id)===id&&v.sku===e.exactSourceSku)variants.push(v);}if(!variants.length)throw Error('Exact source SKU not found '+e.id);selected[e.id]={id,sku:e.exactSourceSku,sourceUrl:e.expected.sourceUrl};}
const result=applyReviewedQuarantines(prior,products,hashes,selected),rerun=applyReviewedQuarantines(result.index,products,hashes,selected);if(rerun.changes||JSON.stringify(rerun.index)!==JSON.stringify(result.index))throw Error('Quarantine idempotence failed');
let retainedFields=0,retainedSources=0,untouchedObjects=0;for(const [id,old]of Object.entries(prior)){const next=result.index[id];if(!quarantineLedger.entries.some(e=>e.id===id)){if(JSON.stringify(next)!==JSON.stringify(old))throw Error('Untargeted object changed '+id);untouchedObjects++;}for(const g of old.groups)for(const f of g.fields){if(result.differences.some(d=>d.id===id&&JSON.stringify(d.old)===JSON.stringify(f)))continue;if(!next.groups.some(h=>h.title===g.title&&h.fields.some(x=>JSON.stringify(x)===JSON.stringify(f))))throw Error('Lost non-target field '+id);retainedFields++;}for(const k of ['sources','identity','notes','panelRatings','summary'])if(JSON.stringify(old[k])!==JSON.stringify(next[k]))throw Error('Lost provenance '+id+':'+k);retainedSources+=old.sources.length;}
if(quarantineSha256(await readFile(indexPath))!==quarantineSha256(beforeBytes)||quarantineSha256(await readFile(catalogPath))!==quarantineSha256(catalogBytes))throw Error('Input changed during migration');
const output=Buffer.from(JSON.stringify(result.index)),report={ledgerId:quarantineLedger.id,approvedPacketSha256:quarantineLedger.approvedPacketSha256,independentReviewSha256:quarantineLedger.independentReviewSha256,inputIndexSha256:quarantineSha256(beforeBytes),catalogSha256:quarantineSha256(catalogBytes),outputIndexSha256:quarantineSha256(output),sourceHashes:hashes,selectedVariants:selected,changes:result.changes,newFactCredit:0,retainedFields,retainedSources,untouchedObjects,idempotentChanges:rerun.changes,differences:result.differences};
await mkdir(dirname(outputPath),{recursive:true});await mkdir(dirname(reportPath),{recursive:true});
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});try{await writeFile(outputPath,output,{flag:'wx'});}catch(error){await unlink(reportPath);throw error;}
console.log(JSON.stringify({...report,sourceHashes:undefined,selectedVariants:undefined,differences:undefined}));
