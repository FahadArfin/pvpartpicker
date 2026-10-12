import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importReviewedSpecification} from '../lib/reviewed-specifications.ts';
import type {Product} from '../lib/types.ts';
const records=JSON.parse(readFileSync(new URL('../data/specification-research-reviewed.json',import.meta.url),'utf8'));
test('AGM and kit reviewed identities remain valid after refreshed metadata omits enrichment-only ratings',()=>{for(const id of ['renogy-43178674782323','renogy-43756629295219','renogy-45276322660467','renogy-43178678714483']){const r=records.find((r:any)=>r.productIds.includes(id)),i=r.expected[id],specs={...i.anchors};delete specs.maxChargeCurrent;delete specs.maxPvVoltage;const p:Product={id,name:i.name,sourceUrl:i.sourceUrl,category:i.category,specs,brand:'Renogy',description:'',image:'',images:[],offers:[],verifiedAt:''};const d=importReviewedSpecification(p,[r]);assert.ok(d?.identity,id);assert.ok(d.groups.flatMap(g=>g.fields).some(f=>f.kind!=='listing'));}});
