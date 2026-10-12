import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSpecification,applySpecificationEvidence} from '../lib/specifications.ts';
import {partValue} from '../lib/part-comparison.ts';
import type {Product} from '../lib/types.ts';
const p:Product={id:'kit',name:'Exact kit',brand:'Brand',category:'kits',sourceUrl:'https://example.test/kit?variant=1',description:'',specs:{},image:'',images:[],offers:[],verifiedAt:''};
const source='https://example.test/manual.pdf',e={url:source,kind:'manual' as const,rows:[['Kit contents','1 × 100 W panel; 1 × 30 A controller; 1 × mounting set'],['Kit type','Solar starter kit']]};
test('exact sourced kit contents override parsed shorthand and keep their source without deriving electrical ratings',()=>{const d=buildSpecification(p,e),q=applySpecificationEvidence(p,{kit:d});assert.equal(partValue(q,'contents').value,e.rows[0][1]);assert.equal(partValue(q,'contents').source,source);assert.equal(partValue(q,'kitType').value,'Solar starter kit');for(const key of ['watts','chargeCurrentA','outputWatts','capacityKwh'])assert.equal(q.specs[key],undefined);});
test('package contents labels do not populate component fields on standalone equipment',()=>{const d=buildSpecification({...p,category:'panels'},e);assert.ok(!d.groups.flatMap(g=>g.fields).some(f=>['contents','kitType'].includes(f.key)));});
test('existing parsed kit contents remain available when technical evidence is absent',()=>{const q={...p,configuration:{kind:'combo' as const,title:'Kit',family:'Kit',selection:'Kit',type:'Kit',components:[{type:'panels' as const,quantity:2,detail:'Panels'}]}};assert.equal(partValue(q,'contents').value,'2 × panels');});

