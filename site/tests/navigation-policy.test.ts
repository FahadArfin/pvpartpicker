import test from 'node:test';
import assert from 'node:assert/strict';
import {appDestination,allowsPrefetch,createPrefetchBudget} from '../lib/navigation-policy.ts';
const current='https://pvpartpicker.example/parts?category=panels';

test('soft navigation preserves route queries and hashes but leaves files/auth/external/private endpoints native',()=>{
 assert.equal(appDestination('/parts?category=batteries&builder=1',current),'/parts?category=batteries&builder=1');
 assert.equal(appDestination('/guide/module-datasheet#section-2',current),'/guide/module-datasheet#section-2');
 assert.equal(appDestination('/products/model-123',current),'/products/model-123');
 assert.equal(appDestination('/',current),'/');
 for(const href of ['#section-2','/parts?category=panels','/api/catalog','/account','/admin','/price-scraper','/signin-with-chatgpt','/signout-with-chatgpt','/callback','/guide/diagrams/panel.svg','https://retailer.example/parts','//retailer.example/parts','javascript:alert(1)'])assert.equal(appDestination(href,current),null,href);
});
test('intent preload respects data saving and bounds rapid hover traffic, allowing retry after expiry',()=>{
 assert.equal(allowsPrefetch({saveData:true}),false);
 assert.equal(allowsPrefetch({effectiveType:'2g'}),false);
 assert.equal(allowsPrefetch({effectiveType:'4g'}),true);
 let now=1000;const budget=createPrefetchBudget(()=>now);
 assert.equal(budget.take('/guide'),true);assert.equal(budget.take('/guide'),false);
 for(let i=0;i<7;i++)assert.equal(budget.take('/products/'+i),true);
 assert.equal(budget.take('/build'),false);
 budget.release('/guide');assert.equal(budget.take('/build'),true);
 now+=30000;assert.equal(budget.take('/guide'),true);
});
