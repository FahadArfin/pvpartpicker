import test from 'node:test';
import assert from 'node:assert/strict';
import fixtures from './fixtures/specification-source-identity.json' with {type:'json'};
import index from '../data/specifications.json' with {type:'json'};
import {applySpecificationEvidence} from '../lib/specifications.ts';
import type {Product,ProductSpecification} from '../lib/types.ts';
const evidence=index as unknown as Record<string,ProductSpecification>;
const observed=fixtures as unknown as Pick<Product,'id'|'name'|'sourceUrl'|'category'|'specs'>[];
// These are observed pre-enrichment metadata from the live failed release,
// independently bound to retained original model, SKU and selected variants.
for(const fixture of observed)test('source identity applies before adding its own ratings: '+fixture.id,()=>{
 const raw:Product={...fixture,brand:'',description:'',image:'',images:[],offers:[],verifiedAt:''};
 const applied=applySpecificationEvidence(raw,evidence);
 assert.ok(applied.specification,'The original selected product must not require derived ratings first');
 assert.ok(applied.specification.sources.some(s=>s.kind!=='listing'));
 for(const changed of [{...raw,name:raw.name+' different model'},{...raw,sourceUrl:raw.sourceUrl.replace(/variant=\d+/,'variant=0')},{...raw,category:'kits' as const}])assert.equal(applySpecificationEvidence(changed,evidence),changed);
 for(const key of Object.keys(evidence[raw.id].identity!.anchors)){const changed={...raw,specs:{...raw.specs,[key]:'different source anchor'}};assert.equal(applySpecificationEvidence(changed,evidence),changed);}
});
