import test from 'node:test';
import assert from 'node:assert/strict';
import {exampleBuilds,exampleProducts,resolveExample,exampleBudget} from '../lib/example-builds.ts';
import {validateBuild} from '../lib/domain.ts';
import type {Product} from '../lib/types.ts';
const now=Date.parse('2026-10-09T00:00:00Z');
const example=exampleBuilds[1];
const products=example.build.lines.map(l=>({id:l.productId,name:l.productId,brand:'Test',category:'panels',description:'',image:'',images:[],sourceUrl:'https://example.com',specs:{},verifiedAt:'',offers:[{id:l.productId+'-offer',retailerId:'test',retailer:'Test',url:'https://example.com',price:100,currency:'USD',packQuantity:l.quantity===8?8:1,stock:'in_stock',observedAt:new Date(now).toISOString(),condition:'new'}]})) as Product[];
test('every example opens a nonempty valid build with unique lines',()=>{for(const e of exampleBuilds){assert.ok(e.build.lines.length>0);assert.deepEqual(validateBuild(e.build),e.build);}});
test('examples price whole packages and copy the exact quantities and selected offers',()=>{const r=resolveExample(example,products,now);assert.equal(r.total,400);assert.equal(r.missing,0);assert.equal(r.unpriced,0);assert.equal(r.selections[0].cost?.packs,1);assert.deepEqual(r.build.lines.map(l=>l.quantity),[8,1,2]);assert.ok(r.build.lines.every(l=>l.offerId));r.build.lines[0].quantity=1;assert.equal(example.build.lines[0].quantity,8);});
test('missing products do not silently remove build lines',()=>{const r=resolveExample(example,products.slice(1),now);assert.equal(r.missing,1);assert.equal(r.unpriced,1);assert.equal(r.build.lines.length,3);});
test('stale and out-of-stock prices never become current example totals',()=>{const stale=resolveExample(example,products,now+86400001);assert.equal(stale.unpriced,3);assert.equal(stale.total,0);assert.ok(stale.build.lines.every(l=>!l.offerId));const unavailable=resolveExample(example,products.map(p=>({...p,offers:p.offers.map(o=>({...o,stock:'out_of_stock' as const}))})),now);assert.equal(unavailable.unpriced,3);});
test('example endpoint selection omits unrelated catalog products',()=>{assert.equal(exampleProducts([...products,{...products[0],id:'not-selected'}]).length,3);});

test('budget ranges exclude incomplete prices and have exact boundaries',()=>{assert.equal(exampleBudget(4999.99,0),'Low');assert.equal(exampleBudget(5000,0),'Mid');assert.equal(exampleBudget(10000,0),'High');assert.equal(exampleBudget(100,1),'Unpriced');});
test('Enphase examples copy one microinverter per panel and a gateway combiner',()=>{const examples=exampleBuilds.filter(e=>e.useCase==='On-grid');assert.equal(examples.length,2);for(const e of examples){assert.equal(e.build.settings.purpose,'gridtie');assert.equal(e.build.lines[0].quantity,e.build.lines[1].quantity);assert.equal(e.build.lines[2].quantity,1);assert.match(e.description,/No battery or outage backup/);}});
test('expanded options include multiple hybrid systems and unique identities',()=>{assert.ok(exampleBuilds.filter(e=>e.useCase==='Hybrid / backup').length>=4);assert.equal(new Set(exampleBuilds.map(e=>e.id)).size,exampleBuilds.length);});
