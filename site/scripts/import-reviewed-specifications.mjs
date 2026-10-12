/** Import only explicitly reviewed, exact-identity source transcriptions. No network or price writes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {importReviewedSpecification} from '../lib/reviewed-specifications.ts';
import {applySpecificationEvidence} from '../lib/specifications.ts';
import {comparisonRows} from '../lib/comparison-view.ts';
import {categorizeProduct} from '../lib/retailers.ts';
import {normalizeCatalogProduct} from '../lib/catalog-cleanup.ts';
const args=process.argv.slice(2),arg=name=>{const n=args.indexOf(name);if(n<0||!args[n+1]||args[n+1].startsWith('--'))throw Error('Required '+name+' path');return resolve(args[n+1]);};
const catalog=JSON.parse(await readFile(arg('--catalog'),'utf8')),records=JSON.parse(await readFile(arg('--reviewed'),'utf8')),directory=arg('--report');
const indexPath=new URL('../data/specifications.json',import.meta.url),prior=JSON.parse(await readFile(indexPath,'utf8')),index={...prior};
const acceptedIds=new Set(records.flatMap(r=>r.productIds));const rows=[],categories={};
for(const raw of catalog.products){const p=categorizeProduct(raw),before=applySpecificationEvidence(p,prior),next=importReviewedSpecification(p,records,prior[p.id]);if(next)index[p.id]=next;
 const after=applySpecificationEvidence(p,index),fields=q=>comparisonRows([normalizeCatalogProduct(q)],true).map(r=>({key:r.key,label:r.label,...r.values[0]}));
 const oldFields=fields(before),newFields=fields(after),resolved=newFields.filter(f=>f.value!=='—'&&oldFields.find(o=>o.key===f.key)?.value==='—');
 const newTechnical=(next?.groups.flatMap(g=>g.fields)||[]).filter(f=>f.kind!=='listing'&&!prior[p.id]?.groups.flatMap(g=>g.fields).some(o=>o.key===f.key&&o.kind!=='listing'));
 const row={productId:p.id,name:p.name,category:normalizeCatalogProduct(p).category,sourceUrl:p.sourceUrl,status:next!==prior[p.id]&&next?.identity?'reviewed-imported':acceptedIds.has(p.id)?'reviewed-not-imported':'remaining',resolvedComparisonFields:resolved,addedTechnicalFields:newTechnical,missing:newFields.filter(f=>f.value==='—').map(f=>f.label),conflicts:next?.notes.filter(n=>/conflict/i.test(n))||[]};rows.push(row);
 const c=categories[row.category]??={listings:0,reviewedListings:0,newTechnicalFields:0,resolvedComparisonFields:0,remainingListings:0};c.listings++;c.reviewedListings+=Number(row.status==='reviewed-imported');c.newTechnicalFields+=newTechnical.length;c.resolvedComparisonFields+=resolved.length;c.remainingListings+=Number(row.missing.length>0);
}
await mkdir(directory,{recursive:true});
const report={checkedAt:new Date().toISOString(),catalogListings:catalog.products.length,reviewedSources:records.length,categories,rows};
await writeFile(resolve(directory,'import-report.json'),JSON.stringify(report,null,2));
for(const category of Object.keys(categories)){const selected=rows.filter(r=>r.category===category),escape=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');await writeFile(resolve(directory,category+'.md'),'# '+category+' research results\n\n| Catalog item | Status | Filled comparison fields | Remaining fields | Source |\n|---|---|---|---|---|\n'+selected.map(r=>'| '+escape(r.name)+' | '+r.status+' | '+r.resolvedComparisonFields.map(f=>f.label).join('; ')+' | '+r.missing.join('; ')+' | [Listing]('+r.sourceUrl+') |').join('\n')+'\n');}
await writeFile(indexPath,JSON.stringify(index));
console.log(JSON.stringify({categories,reviewedSources:records.length,reviewedListings:rows.filter(r=>r.status==='reviewed-imported').length,newTechnicalFields:rows.reduce((n,r)=>n+r.addedTechnicalFields.length,0),resolvedComparisonFields:rows.reduce((n,r)=>n+r.resolvedComparisonFields.length,0)}));