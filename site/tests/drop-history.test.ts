import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDropHistory,dropIdentity,historyUrl,historySourcesNote} from '../lib/drop-history.ts';
const product={id:'ss-11059',name:'EG4 FlexBOSS21 16kW AC Hybrid Inverter',productUrl:'https://signaturesolar.com/flexboss21/'};
const history=[{productId:product.id,price:4199,date:'2025-11-09T16:46:12.010Z'},{productId:product.id,price:3599.99,date:'2026-06-18T01:16:25.401Z'}];
const html=(data:unknown)=>'<script>self.__next_f.push('+JSON.stringify([1,'a:'+JSON.stringify(['$','$component',null,data])+'\n'])+')</script>';
test('reads chart observations as inert JSON, preserves exact timestamps and ignores live price',()=>{
 const result=parseDropHistory(html({product:{...product,price:3000},history}),'/products/ss-11059');
 assert.equal(result.history.length,2);assert.equal(result.history[0].date,history[0].date);
 assert.throws(()=>parseDropHistory(html({product,history:[{...history[0],productId:'other'}]}),'/products/ss-11059'),/history/i);
 assert.throws(()=>parseDropHistory(html({product,history:[{...history[0],price:-10}]}),'/products/ss-11059'),/history/i);
 assert.throws(()=>parseDropHistory(html({product,history:[history[0],{...history[0],price:1}]}),'/products/ss-11059'),/conflict/i);
 assert.throws(()=>parseDropHistory('<script>throw new Error("executed")</script>','/products/ss-11059'),/missing/i);
});
test('retailer identity refuses parent variants, used items, changed packages, bundles and similar models',()=>{
 const p:any={id:'eg4-flexboss21',name:product.name,category:'inverters'};
 const o:any={url:product.productUrl,condition:'new',currency:'USD',packQuantity:1};
 assert.ok(dropIdentity(p,o,product));
 assert.equal(dropIdentity(p,{...o,packQuantity:2},product),false);
 assert.equal(dropIdentity(p,{...o,condition:'used'},product),false);
 assert.equal(dropIdentity(p,{...o,url:o.url+'?variant=1'},product),false);
 assert.equal(dropIdentity(p,o,{...product,name:product.name+' + battery bundle'}),false);
 assert.equal(dropIdentity(p,o,{...product,name:product.name.replace('21','18')}),false);
 for(const suffix of [' | x2',' | Quantity 2',' | 2 Units',' ×2',' | x10',' | 10 Units',' ×10',' | Pair of inverters'])assert.equal(dropIdentity(p,o,{...product,name:product.name+suffix}),false);
 assert.equal(dropIdentity({...p,category:'kits'},o,product),false);
 const pallet={...product,name:'Peimar 450W Solar Panel · 31 Panels Pallet'},panel:any={...p,category:'panels',name:pallet.name};assert.ok(dropIdentity(panel,{...o,packQuantity:31},pallet));assert.equal(dropIdentity(panel,{...o,packQuantity:30},pallet),false);
 assert.equal(historyUrl(o.url+'?utm_source=test'),historyUrl(o.url));
 assert.notEqual(historyUrl(o.url+'?variant=1'),historyUrl(o.url));
});
test('source explanation distinguishes day archive from timestamped price change records',()=>{
 assert.match(historySourcesNote('timestamp'),/price changes/);assert.match(historySourcesNote('day'),/day precision/);
});
