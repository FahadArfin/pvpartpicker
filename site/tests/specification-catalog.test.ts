import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categorizeProduct} from '../lib/retailers.ts';
import type {ProductSpecification,Product} from '../lib/types.ts';
const catalog=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8')) as {products:Product[]};
const details=JSON.parse(readFileSync(new URL('../data/specifications.json',import.meta.url),'utf8')) as Record<string,ProductSpecification>;
type TechnicalField=ProductSpecification['groups'][number]['fields'][number];
function hasTechnicalSourceValue(d:ProductSpecification,f:TechnicalField):boolean {
 if(/regular price|sale price|rated [1-5] out of/i.test(f.value))return false;
 if(!/batteries in parallel/i.test(f.value))return true;
 return f.key==='expansion'&&Boolean(d.identity)&&['manufacturer','manual','datasheet'].includes(f.kind||'')&&d.sources.some(s=>s.url===f.source&&s.kind===f.kind&&Boolean(s.model)&&Number.isFinite(Date.parse(s.checkedAt||'')));
}

test('every stored listing has a brief, source-linked specification record with unique technical fields',()=>{
 assert.ok(Object.keys(details).length>=catalog.products.length);
 for(const [id,d] of Object.entries(details)){const stored=catalog.products.find(p=>p.id===id);const p=stored?categorizeProduct(stored):{id,specs:d.identity?.anchors||{}};assert.ok(catalog.products.some(p=>p.id===id)||d.identity,id+' needs identity guard');assert.ok(d,p.id);assert.ok(d.summary.length<=220,p.id);const fields=d.groups.flatMap(g=>g.fields);assert.equal(new Set(fields.map(f=>f.key)).size,fields.length,p.id);
  for(const f of fields){assert.ok(d.sources.some(s=>s.url===f.source),p.id+' '+f.key);assert.ok(hasTechnicalSourceValue(d,f),p.id+' '+f.key);}
  if(d.panelRatings?.stc.pmax&&p.specs.watts)assert.equal(Number(d.panelRatings.stc.pmax.replace(/,/g,'').match(/\d+(?:\.\d+)?/)?.[0]),Number(p.specs.watts),p.id);
 }
});
test('published example ratings match the visually reviewed manufacturer sheets',()=>{
 const p=details['renogy-43232667697267'];assert.equal(p.panelRatings?.stc.voc,'24.48 V');assert.equal(p.panelRatings?.stc.imp,'8.38 A');assert.deepEqual(p.panelRatings?.noct,{});assert.ok(p.sources.some(s=>s.url.includes('RSP175DC-G1')));
 const canadian=details['shopsolar-61670049054860'];assert.equal(canadian.panelRatings?.noctLabel,'NMOT');assert.equal(canadian.panelRatings?.stc.imp,'17.35 A');assert.equal(canadian.panelRatings?.noct.imp,'13.88 A');
});

test('parallel expansion evidence requires an identity and matching dated primary source, while sales noise stays excluded',()=>{
 const d=details['sungoldpower-46451893502089'],f=d.groups.flatMap(g=>g.fields).find(f=>f.key==='expansion')!;
 assert.ok(hasTechnicalSourceValue(d,f));
 assert.equal(hasTechnicalSourceValue(d,{...f,key:'dimensions'}),false);
 assert.equal(hasTechnicalSourceValue(d,{...f,kind:'listing'}),false);
 assert.equal(hasTechnicalSourceValue({...d,identity:undefined},f),false);
 assert.equal(hasTechnicalSourceValue({...d,sources:d.sources.filter(s=>s.url!==f.source)},f),false);
 assert.equal(hasTechnicalSourceValue({...d,sources:d.sources.map(s=>s.url===f.source?{...s,checkedAt:'unknown'}:s)},f),false);
 for(const value of ['regular price','sale price','rated 5 out of 5'])assert.equal(hasTechnicalSourceValue(d,{...f,value}),false);
});
