import test from 'node:test';
import assert from 'node:assert/strict';
import {specificationRowsFromHtml} from '../lib/specification-html.ts';
test('manufacturer grid specs and independent table cells are collected without sales prose',()=>{
 const rows=specificationRowsFromHtml('<body><main><div class="specs-item"><div class="specs-left">Nominal Voltage</div><div class="specs-right">12.8V</div></div><table><tr><td>Rated Current: 500A</td><td>Connector: M8 Busbar</td></tr></table><p>World leading battery with great performance</p></main></body>');
 assert.deepEqual(rows,[['Rated Current: 500A','Connector: M8 Busbar'],['Nominal Voltage','12.8V']]);
});
test('only explicit labelled bullets in the product description are collected',()=>{
 const rows=specificationRowsFromHtml('<body><nav><dl><dt>Voltage</dt><dd>999 V</dd></dl></nav><main><div class="about__accordion-description"><ul><li>AC Output: 3600 W</li><li>Great value for your home</li></ul></div><ul><li>Promotion: Buy now</li></ul></main></body>');
 assert.deepEqual(rows,[['AC Output','3600 W']]);
});
