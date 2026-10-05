/** Rebuild source-audited detail specs from cached product tables and reviewed sheets.
 * node --experimental-strip-types scripts/collect-specifications.mjs --cache ../output/spec-research
 * See docs/product-specifications.md for the bounded fetch/extract workflow.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {buildSpecification,technicalRows} from '../lib/specifications.ts';
import {categorizeProduct} from '../lib/retailers.ts';
const args=process.argv.slice(2),cache=resolve(args[args.indexOf('--cache')+1]||'../output/spec-research');
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('data/catalog.json',root),'utf8'));
const {sources,failures}=JSON.parse(await readFile(resolve(cache,'sources.json'),'utf8'));
let pdfs={};try{pdfs=JSON.parse(await readFile(resolve(cache,'pdf-tables.json'),'utf8'));}catch{}
const reviewed=JSON.parse(await readFile(new URL('data/specification-reviewed.json',root),'utf8'));
const index={},audit={generatedAt:new Date().toISOString(),products:catalog.products.length,pages:Object.keys(sources).length,pageFailures:failures,downloadedDocuments:0,datasheetProducts:0,tableProducts:0,listingOnlyProducts:0,panelElectricalProducts:0,panelNoctProducts:0,categories:{},missing:[],excludedDocuments:[]};
audit.manualProducts=0;audit.extractedDocuments=Object.keys(pdfs).length;
try{const download=JSON.parse(await readFile(resolve(cache,'pdf-index.json'),'utf8'));audit.downloadedDocuments=download.documents.length;audit.documentDownloadFailures=download.failures;}catch{}
try{audit.documentExtractionFailures=JSON.parse(await readFile(resolve(cache,'pdf-extraction-failures.json'),'utf8'));}catch{}
const norm=s=>String(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
const n=s=>Number(String(s).replace(/,/g,'').match(/\d+(?:\.\d+)?/)?.[0]);
const technicalLabel=/^(?:model|sku|nominal|rated|maximum|max\b|capacity|chemistry|communication|dimensions?|weight|operating|temperature|module|cell|open circuit|short circuit|optimum|number of|charge|discharge|mppt|ac output|ip rating|material|efficiency|voltage|current|cycle|solar|front glass|frame|connector|warranty)/i;
for(const original of catalog.products){
 const p=categorizeProduct(original),base=p.sourceUrl.split('?')[0],source=sources[base];
 const evidence=[];
 const manual=reviewed.filter(r=>(r.productIds?.includes(p.id)||r.productUrl===base)&&(r.watts===undefined||r.watts===p.specs.watts));
 evidence.push(...manual.map(r=>({url:r.url,kind:'datasheet',model:r.model,label:r.label,checkedAt:r.checkedAt,rows:r.rows})));
 const rows=source?technicalRows(source.rows):[];
 // The current page's model is stronger evidence than a loose brand / watt match.
 const modelRow=rows.find(r=>/^(?:model|model number|sku|part number)\s*:?$/i.test(r[0]));
 const exactModel=modelRow?.[1]||p.specs.model||p.offers[0]?.sku?.replace(/(?:x\d+)?-US.*$/i,'');
 for(const doc of source?.documents||[]){const pdf=pdfs[doc.url.split('?')[0]];if(!pdf||manual.some(r=>r.url===doc.url))continue;
  const filename=decodeURIComponent(new URL(doc.url).pathname.split('/').at(-1));
  let matched=exactModel&&norm(exactModel).length>=5&&norm(pdf.text+' '+filename).includes(norm(exactModel));
  const titleModels=p.name.match(/\b(?:[a-z]{1,7}-?\d{2,5}[a-z]{0,5}(?:-[\da-z]+)?|\d{3,5}[a-z]{1,4})\b/gi)||[];
  const specificModels=titleModels.filter(m=>!/^\d+(?:w|wh|kwh|ah|v|kw|mm|awg)$/i.test(m)&&norm(m).length>=4);
  if(specificModels.some(m=>norm(filename).includes(norm(m))&&norm(pdf.text).includes(norm(m))))matched=true;
  if(p.category==='panels'){
   // A panel sheet must contain matching Pmax; file names or the shared description alone do not suffice.
   matched=technicalRows(pdf.rows).some(r=>/maximum power|rated power|nominal power|pmax/i.test(r[0])&&r.slice(1).some(v=>n(v)===Number(p.specs.watts)));
  }
  if(!matched){audit.excludedDocuments.push({productId:p.id,url:doc.url,reason:'Exact model / panel rating not established'});continue;}
  // Grids containing two independent key/value pairs are split, while multi-model columns are preserved.
  const selected=[];
  for(const row of pdf.rows){if(row.length===4&&technicalLabel.test(row[0])&&technicalLabel.test(row[2])){selected.push(row.slice(0,2),row.slice(2));}else selected.push(row);}
  const kind=/datasheet|data.?sheet|spec(?:ification|.?sheet)|technical/i.test(doc.label+' '+filename)?'datasheet':'manual';
  evidence.push({url:doc.url,kind,label:doc.label.length>3&&doc.label!=='here'?doc.label:filename,checkedAt:source.checkedAt,rows:selected,model:exactModel||undefined});
 }
 if(source&&rows.length){
  const expected=Number(p.specs.capacityAh),listed=rows.find(r=>/^(?:rated capacity|nominal capacity|capacity|battery capacity)/i.test(r[0])&&/ah\b/i.test(r[1]));
  const voltage=rows.find(r=>/^nominal voltage/i.test(r[0]));
  const energy=rows.find(r=>/^(?:energy|energy capacity|capacity|battery capacity)$/i.test(r[0])&&/wh\b/i.test(r[1]));
  const energyKwh=energy?n(energy[1])*(/kwh/i.test(energy[1])?1:.001):undefined;
  const differentBattery=['batteries','all-in-one'].includes(p.category)&&((expected&&listed&&Math.abs(n(listed[1])-expected)>1)||(p.specs.voltage&&voltage&&Math.abs(n(voltage[1])-Number(p.specs.voltage))/Number(p.specs.voltage)>.1)||(p.specs.capacityKwh&&energyKwh&&Math.abs(energyKwh-Number(p.specs.capacityKwh))/Number(p.specs.capacityKwh)>.05));
  const gauge=rows.find(r=>/^(?:wire gauge|gauge|wire size)$/i.test(r[0]));const length=rows.find(r=>/^(?:length|wire length|cable length)$/i.test(r[0])&&/ft|feet/i.test(r[1]));
  const feet=length?Number(length[1].match(/(\d+(?:\.\d+)?)\s*(?:ft|feet)\b/i)?.[1]):undefined;
  const differentWire=p.category==='wiring'&&((p.specs.gauge&&gauge&&n(p.specs.gauge)!==n(gauge[1]))||(p.specs.lengthFt&&feet&&Math.abs(Number(p.specs.lengthFt)-feet)>.5));
  if(!differentBattery&&!differentWire)evidence.push({url:p.sourceUrl,kind:new URL(base).hostname.includes('renogy')||new URL(base).hostname.includes('emporia')?'manufacturer':'retailer',label:'Product technical table',checkedAt:source.checkedAt,rows});
 }
 const details=buildSpecification(p,evidence);index[p.id]=details;
 const technicalSources=new Set([...details.groups.filter(g=>g.title!=='Identity').flatMap(g=>g.fields.filter(f=>f.kind!=='listing').map(f=>f.source)),...Object.values(details.panelRatings?.sources||{})]);
 const sheet=details.sources.some(s=>s.kind==='datasheet'&&technicalSources.has(s.url)),manualDoc=details.sources.some(s=>s.kind==='manual'&&technicalSources.has(s.url)),table=details.sources.some(s=>(s.kind==='manufacturer'||s.kind==='retailer')&&technicalSources.has(s.url));
 if(sheet)audit.datasheetProducts++;if(manualDoc)audit.manualProducts++;if(table)audit.tableProducts++;if(!sheet&&!manualDoc&&!table){audit.listingOnlyProducts++;audit.missing.push({productId:p.id,name:p.name,url:p.sourceUrl,category:p.category});}
 if(details.panelRatings?.stc.voc)audit.panelElectricalProducts++;if(details.panelRatings?.noct.voc)audit.panelNoctProducts++;
 const cat=audit.categories[p.category]||{products:0,sheet:0,manual:0,table:0,listingOnly:0};cat.products++;cat.sheet+=Number(sheet);cat.manual+=Number(manualDoc);cat.table+=Number(table);cat.listingOnly+=Number(!sheet&&!manualDoc&&!table);audit.categories[p.category]=cat;
}
await writeFile(new URL('data/specifications.json',root),JSON.stringify(index));
await writeFile(new URL('data/specification-audit.json',root),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({...audit,missing:audit.missing.length,excludedDocuments:audit.excludedDocuments.length},null,2));
