import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Solar4U chapters retain provenance and technical structures without route collisions',()=>{
 const imported=JSON.parse(readFileSync(new URL('../data/guide-solar4u.json',import.meta.url),'utf8'));
 const foundation=JSON.parse(readFileSync(new URL('../data/guide-foundations.json',import.meta.url),'utf8'));
 assert.ok(imported.length>=12);
 const slugs=new Set(foundation.map((a:{slug:string})=>a.slug));
 for(const a of imported){
  assert.ok(!slugs.has(a.slug),a.slug);slugs.add(a.slug);
  assert.equal(a.adaptedFrom.project,'Solar4U');
  assert.ok(a.adaptedFrom.commit.match(/^[a-f0-9]{40}$/));
  assert.ok(a.sections.length>=3,a.slug);
  for(const s of a.sections)if(s.rows)for(const r of s.rows)assert.equal(r.length,s.columns.length);
  assert.ok(a.sources.every((s:{url:string})=>s.url.startsWith('https://')));
 }
 for(const slug of ['battery-bank-architecture','battery-monitoring','commissioning','troubleshooting','permits-and-inspection','module-datasheet'])assert.ok(slugs.has(slug));
});
