import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {ProductSpecification,Product} from '../lib/types.ts';
const catalog=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8')) as {products:Product[]};
const details=JSON.parse(readFileSync(new URL('../data/specifications.json',import.meta.url),'utf8')) as Record<string,ProductSpecification>;
test('every stored listing has a brief, source-linked specification record with unique technical fields',()=>{
 assert.equal(Object.keys(details).length,catalog.products.length);
 for(const p of catalog.products){const d=details[p.id];assert.ok(d,p.id);assert.ok(d.summary.length<=220,p.id);const fields=d.groups.flatMap(g=>g.fields);assert.equal(new Set(fields.map(f=>f.key)).size,fields.length,p.id);
  for(const f of fields){assert.ok(d.sources.some(s=>s.url===f.source),p.id+' '+f.key);assert.ok(!/batteries in parallel|regular price|sale price|rated [1-5] out of/i.test(f.value),p.id+' '+f.key);}
  if(d.panelRatings?.stc.pmax&&p.specs.watts)assert.equal(Number(d.panelRatings.stc.pmax.replace(/,/g,'').match(/\d+(?:\.\d+)?/)?.[0]),Number(p.specs.watts),p.id);
 }
});
test('published example ratings match the visually reviewed manufacturer sheets',()=>{
 const p=details['renogy-43232667697267'];assert.equal(p.panelRatings?.stc.voc,'24.48 V');assert.equal(p.panelRatings?.stc.imp,'8.38 A');assert.deepEqual(p.panelRatings?.noct,{});assert.ok(p.sources.some(s=>s.url.includes('RSP175DC-G1')));
 const canadian=details['shopsolar-61670049054860'];assert.equal(canadian.panelRatings?.noctLabel,'NMOT');assert.equal(canadian.panelRatings?.stc.imp,'17.35 A');assert.equal(canadian.panelRatings?.noct.imp,'13.88 A');
});
