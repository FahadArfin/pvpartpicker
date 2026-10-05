import test from 'node:test';
import assert from 'node:assert/strict';
import {specificationRowsFromHtml} from '../lib/specification-html.ts';
import {buildSpecification} from '../lib/specifications.ts';
import type {Product} from '../lib/types.ts';
test('manufacturer grid specs and independent table cells are collected without sales prose',()=>{
 const rows=specificationRowsFromHtml('<body><main><div class="specs-item"><div class="specs-left">Nominal Voltage</div><div class="specs-right">12.8V</div></div><table><tr><td>Rated Current: 500A</td><td>Connector: M8 Busbar</td></tr></table><p>World leading battery with great performance</p></main></body>');
 assert.deepEqual(rows,[['Rated Current: 500A','Connector: M8 Busbar'],['Nominal Voltage','12.8V']]);
});
test('labelled comparison panels preserve variant columns and exclude links to other products',()=>{
 const item=(url:string,w:number,v:number)=>`<div class="rg-compare-blocks-content-item"><a class="compare-learn-more-btn" href="${url}">Details</a><ul data-parameters-list><li data-parameter-name="Maximum Power at STC">${w}W</li><li data-parameter-name="Open-Circuit Voltage (Voc)">${v}V</li></ul></div>`;
 const rows=specificationRowsFromHtml('<main>'+item('/products/panel',200,44.1)+item('/products/panel',100,33.6)+item('/products/other',100,999)+'</main>','https://renogy.com/products/panel');
 const p={id:'100',name:'Panel',category:'panels',brand:'Test',specs:{watts:100},description:'',image:'',images:[],sourceUrl:'https://renogy.com/products/panel',offers:[],verifiedAt:''} as Product;
 assert.equal(buildSpecification(p,{url:p.sourceUrl,kind:'manufacturer',rows}).panelRatings?.stc.voc,'33.6V');
 assert.deepEqual(specificationRowsFromHtml('<main>'+item('/products/panel',100,33)+item('/products/panel',100,44)+'</main>','https://renogy.com/products/panel'),[]);
 assert.deepEqual(specificationRowsFromHtml('<main>'+item('/products/panel',100,33)+'</main>'),[]);
});
test('only explicit labelled bullets in the product description are collected',()=>{
 const rows=specificationRowsFromHtml('<body><nav><dl><dt>Voltage</dt><dd>999 V</dd></dl></nav><main><div class="about__accordion-description"><ul><li>AC Output: 3600 W</li><li>Great value for your home</li></ul></div><ul><li>Promotion: Buy now</li></ul></main></body>');
 assert.deepEqual(rows,[['AC Output','3600 W']]);
});
