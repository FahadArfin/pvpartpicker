import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {newTextbookChapters} from '../lib/guide-textbook-new.ts';
const read=(file:string)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const domains=['foundations','equipment','installation'];
const expanded=Object.assign({},...domains.map(d=>JSON.parse(read('data/guide-textbook-'+d+'.json'))));
const originals=[...JSON.parse(read('data/guide-foundations.json')),...JSON.parse(read('data/guide-solar4u.json'))].map(a=>a.slug);
const content=read('lib/guide-content.ts');
originals.push(...[...content.matchAll(/slug:'([^']+)'/g)].map(m=>m[1]),...[...content.matchAll(/briefing\('([^']+)'/g)].map(m=>m[1]),...[...read('lib/guide-research.ts').matchAll(/slug:'([^']+)'/g)].map(m=>m[1]));

test('every original Guide article receives a complete illustrated textbook replacement',()=>{
 assert.equal(new Set(originals).size,43);
 assert.equal(Object.keys(expanded).length,43);
 for(const slug of originals){
  const a=expanded[slug];assert.ok(a,'Missing chapter: '+slug);
  assert.ok(a.sections.length>=7,'Short chapter: '+slug);
  const text=a.sections.flatMap((s:any)=>[...s.paragraphs??[],...s.bullets??[],...s.steps??[],...s.rows?.flat()??[],s.workedExample?.title??'',...s.workedExample?.givens??[],...s.workedExample?.steps??[],s.workedExample?.result??'',s.workedExample?.discussion??'',s.exercise?.question??'',s.exercise?.answer??'',s.exercise?.explanation??'']).join(' ');
  const words=text.trim().split(/\s+/).length;
  const news=['china-export-rebates','sodium-storage-2026','back-contact-commercial-scale','anker-e10-system-brief','residential-credit-2026','supply-chain-resilience'].includes(slug);
  assert.ok(words>=(news?650:1000),slug+' has only '+words+' substantive words');
  assert.ok(a.sections.some((s:any)=>s.figures?.length),'Missing illustration: '+slug);
  assert.ok(a.sections.some((s:any)=>s.workedExample),'Missing worked example: '+slug);
  assert.ok(a.sections.some((s:any)=>s.exercise?.answer&&s.exercise?.explanation),'Missing explained exercise: '+slug);
  assert.ok(a.sections.some((s:any)=>s.rows?.length),'Missing comparison/reference table: '+slug);
  assert.ok(a.sources.length>=1,'Missing primary references: '+slug);
 }
});

test('chapter tables, citations and original figure assets remain usable',()=>{
 for(const [slug,a] of Object.entries<any>({...expanded,...Object.fromEntries(newTextbookChapters.map(a=>[a.slug,a]))})){
  for(const source of [...a.sources,...a.sections.flatMap((s:any)=>s.sources??[])])assert.equal(new URL(source.url).protocol,'https:',slug);
  for(const section of a.sections){
   if(section.rows){assert.ok(section.columns?.length);for(const row of section.rows)assert.equal(row.length,section.columns.length,slug+': '+section.title);}
   for(const f of section.figures??[]){
    assert.match(f.diagram,/^[a-z-]+$/);assert.ok(f.alt.length>20);assert.ok(f.caption.length>30);
    const asset='public/guide/diagrams/'+f.diagram+'.svg';assert.ok(existsSync(new URL('../'+asset,import.meta.url)),slug+': '+asset);
    const svg=read(asset);assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.doesNotMatch(svg,/<script|<foreignObject|href="https?:/);
   }
  }
 }
});

test('new chapters fill distinct system-design and ownership gaps',()=>{
 assert.deepEqual(newTextbookChapters.map(a=>a.slug),['ac-dc-coupling','storage-certification','flexible-loads-and-ev']);
 for(const a of newTextbookChapters){
  assert.ok(!expanded[a.slug]);assert.ok(a.sections.length>=8);
  assert.ok(a.sections.some(s=>s.workedExample));assert.ok(a.sections.some(s=>s.exercise));assert.ok(a.sources.length>=2);
  assert.ok(a.sections.flatMap(s=>s.paragraphs??[]).join(' ').split(/\s+/).length>=750,a.slug);
  if(a.tool?.href.startsWith('/guide/calculators'))assert.ok(['pv','battery','voltage','fuse','array','controller','cable','tou','payback'].includes(new URL(a.tool.href,'https://example.test').searchParams.get('tool')??''));
 }
});

test('worked-example arithmetic preserves stated boundaries',()=>{
 assert.ok(Math.abs(10*.97*.94*.95-8.6621)<1e-6);
 assert.ok(Math.abs(10*.96*.95*.94*.95-8.14416)<1e-6);
 assert.ok(Math.abs(40*.30/.90-13.3333333333)<1e-8);
 assert.equal(51.2*200,10240);
 assert.ok(Math.abs(2/Math.tan(20*Math.PI/180)-5.4949548389)<1e-8);
 const module=expanded['module-datasheet'];
 const text=JSON.stringify(module);assert.match(text,/NOCT/);assert.match(text,/STC/);assert.match(text,/Voc/);assert.match(text,/Vmp/);assert.match(text,/Imp/);assert.match(text,/Isc/);
 const ratings=module.sections.find((s:any)=>s.columns?.includes('STC: TSM-440NEG9R.28'));
 assert.deepEqual(ratings.rows,[['Maximum power Pmax','440 W','337 W'],['Maximum-power voltage Vmp','44.0 V','41.4 V'],['Maximum-power current Imp','10.01 A','8.14 A'],['Open-circuit voltage Voc','52.2 V','49.5 V'],['Short-circuit current Isc','10.67 A','8.60 A'],['Module efficiency','22.0%','Not published in this table']]);
});

test('reader remains server rendered and navigation receives compact metadata',()=>{
 const reader=read('components/guide-reader.tsx');assert.doesNotMatch(reader,/['"]use client['"]/);
 const nav=read('components/guide-navigation.tsx');assert.doesNotMatch(nav,/guide-textbook.*\.json/);
 assert.match(content,/export const guideEntries/);
 assert.match(reader,/GuideLessonSection/);
 assert.match(read('components/guide-section.tsx'),/loading="lazy"/);
});
