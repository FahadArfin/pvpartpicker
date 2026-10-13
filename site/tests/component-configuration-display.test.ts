import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configurationForDisplay} from '../lib/bundles.ts';
import type {Product} from '../lib/types.ts';

const fixtures=JSON.parse(readFileSync(new URL('./fixtures/reviewed-component-role-products.json',import.meta.url),'utf8'));
test('component category corrections preserve raw configurations without displaying a different equipment type',()=>{
 for(const row of fixtures.approved){const p={...row.product,category:row.target.category,specs:{...row.product.specs,...row.target.specs}} as Product,before=structuredClone(p);
  assert.equal(configurationForDisplay(p),undefined,p.id);assert.deepEqual(p,before,'source metadata stays available for audit');
 }
});
test('real standalone power stations, inverters and kits retain their configuration presentation',()=>{
 const base=fixtures.approved[0].product as Product;
 const station={kind:'standalone',family:'station',title:'Station',selection:'Main unit only',type:'Power station',components:[{type:'power-station',quantity:1}]} as const;
 const inverter={...station,family:'inverter',type:'Inverter',components:[{type:'inverter',quantity:1}]} as const;
 const combo={...station,kind:'combo',family:'combo',type:'Solar system',components:[{type:'panels',quantity:2},{type:'inverter',quantity:1}]} as const;
 for(const [category,config]of [['all-in-one',station],['inverters',inverter],['kits',combo]] as const){const p={...base,category,configuration:structuredClone(config)} as unknown as Product;assert.equal(configurationForDisplay(p),p.configuration);}
 assert.equal(configurationForDisplay({...base,category:'accessories',configuration:structuredClone(station)} as unknown as Product),undefined);
 assert.equal(configurationForDisplay({...base,category:'monitoring',configuration:structuredClone(inverter)} as unknown as Product),undefined);
 assert.equal(configurationForDisplay({...base,category:'electrical',configuration:structuredClone(combo)} as unknown as Product),undefined);
});
