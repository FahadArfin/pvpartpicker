import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHistoryPayload} from '../scripts/browser-history-session.mjs';

const product={id:'cc-36455',name:'EG4 FlexBOSS21 48V Hybrid All-in-One Inverter, 12kW-16kW AC Output, UL 1741 &amp; UL 9540 Solar Inverter',productUrl:'https://www.currentconnected.com/product/eg4flexboss21/'};
const history=[{productId:product.id,price:4199,date:'2025-11-23T20:03:59.055Z'},{productId:product.id,price:3599.99,date:'2026-04-09T06:05:53.054Z'}];
const html='<script>self.__next_f.push('+JSON.stringify([1,'0:'+JSON.stringify({product,history})+'\n'])+')</script>';
const job={p:{id:'eg4-flexboss21',name:'EG4 FlexBOSS21 Hybrid Solar Inverter',category:'inverters'},o:{id:'offer',retailer:'Current Connected',url:product.productUrl,currency:'USD',condition:'new',packQuantity:1}};
test('browser history retains exact source timestamps and the worker source hash',()=>{
 const payload=browserHistoryPayload(job,html,'/products/cc-36455');
 assert.ok(payload?.rows&&payload?.source);
 assert.equal(payload.rows.length,2);assert.equal(payload.rows[0].date,history[0].date);
 assert.equal(payload.source.id,'c85410fd9e90f972380ca49d4b93df4aad4f5c66d4330e174ec4a69441baa43d');
 assert.equal(payload.rows[0].offerId,'offer');
});
test('browser access never makes a single-unit chart eligible for another package or retailer',()=>{
 assert.equal(browserHistoryPayload({...job,o:{...job.o,packQuantity:4}},html,'/products/cc-36455'),null);
 assert.equal(browserHistoryPayload({...job,o:{...job.o,url:'https://another.example/inverter'}},html,'/products/cc-36455'),null);
});
test('browser history rejects wrong source IDs and conflicting same-time prices',()=>{
 assert.throws(()=>browserHistoryPayload(job,html,'/products/sg-wrong'),/missing or ambiguous/);
 const conflict='<script>self.__next_f.push('+JSON.stringify([1,'0:'+JSON.stringify({product,history:[...history,{...history[0],price:1}]})+'\n'])+')</script>';
 assert.throws(()=>browserHistoryPayload(job,conflict,'/products/cc-36455'),/Conflicting/);
});
