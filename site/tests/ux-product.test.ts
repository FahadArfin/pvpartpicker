import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleCoreProduct,historyCoverage} from '../lib/ux-product.ts';
import type {Product} from '../lib/types.ts';
const item=(id:string,modelId:string,kind:string,category='all-in-one')=>({id,category,modelIdentity:{modelId,kind},offers:[]}) as unknown as Product;
test('bundle component links require a reviewed shared model and standalone core category',()=>{
 const bundle=item('kit','pecron-f3000','bundle','kits');
 assert.equal(bundleCoreProduct(bundle,[item('other','pecron-f3000','bundle','kits'),item('wrong','pecron-e3800','unit'),item('core','pecron-f3000','unit')])?.id,'core');
 assert.equal(bundleCoreProduct(bundle,[{...item('unreviewed','x','unit'),modelIdentity:undefined},item('panel','pecron-f3000','unit','panels')]),undefined);
 assert.equal(bundleCoreProduct(item('notkit','pecron-f3000','unit'),[item('core','pecron-f3000','unit')]),undefined);
});
test('history summary uses actual recorded dates and offer values, not chart metadata or missing days',()=>{
 const result=historyCoverage([{date:'2026-10-04T12:00:00Z',time:1,dayOnly:1,a:100},{date:'2026-10-04T18:00:00Z',time:2,a:100},{date:'2026-10-07T12:00:00Z',time:3,b:90}],['a','b']);
 assert.deepEqual(result,{days:2,first:'2026-10-04',last:'2026-10-07',low:90,high:100,unchanged:false});
 assert.equal(historyCoverage([{date:'2026-10-04',time:1,a:100}],['a'])?.unchanged,true);
 assert.equal(historyCoverage([],['a']),undefined);
 assert.equal(historyCoverage([{date:'2026-10-04',time:1,dayOnly:1}],['a']),undefined);
});
