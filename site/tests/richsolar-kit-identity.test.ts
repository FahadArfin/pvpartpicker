import test from 'node:test';
import assert from 'node:assert/strict';
import {categorizeProduct,parseProductPage} from '../lib/retailers.ts';
import {normalizeCatalogProduct} from '../lib/catalog-cleanup.ts';
import {richSolarCbk1302Contents,richSolarCbk1302Source,richSolarCbk1302Title} from '../lib/exact-kits.ts';
import type {Product} from '../lib/types.ts';

const sourceUrl='https://richsolar.com/products/off-grid-system-kit-13-000w-120-240v-output-48vdc28-8kwh-alpha-5-server-lithium-iron-phosphate-battery?variant=39981933690929';
function target(overrides:Partial<Product>={}):Product{return {id:'rich-solar-39981933690929',name:richSolarCbk1302Title,brand:'RICH SOLAR',category:'batteries',description:'',image:'',images:[],sourceUrl,specs:{watts:13000,outputWatts:13000,voltage:240,capacityKwh:30.72,capacityAh:100,batteryKind:'Battery modules',formFactor:'Server rack',chemistry:'LiFePO4',inverterType:'Off-grid'},offers:[{id:'rich-solar-rs-cbk1302',retailerId:'rich-solar',retailer:'Rich Solar',url:sourceUrl,price:12999.99,currency:'USD',packQuantity:1,stock:'in_stock',observedAt:'2026-10-12T01:25:10.257Z',sku:'RS-CBK1302',condition:'new'}],verifiedAt:'2026-10-12T01:25:10.257Z',...overrides};}

test('exact RS-CBK1302 source identity wins before generic battery classification and emits only reviewed kit contents',()=>{
 const product=categorizeProduct(target());
 assert.equal(product.category,'kits');
 assert.deepEqual(product.comparisonSpecs?.contents,{value:richSolarCbk1302Contents,source:richSolarCbk1302Source});
 assert.equal(product.specs.kitType,'Solar system kits');
 for(const key of ['watts','outputWatts','voltage','capacityKwh','capacityAh','batteryKind','formFactor','chemistry','inverterType'])assert.equal(product.specs[key],undefined,key);
 assert.equal(product.configuration,undefined);
 assert.equal(product.offers[0].packQuantity,1);
});
test('late snapshot normalization applies the same exact correction and is idempotent',()=>{
 const categorized=categorizeProduct(target()),replayed=categorizeProduct(categorized);
 assert.deepEqual(categorized,replayed);
 const first=normalizeCatalogProduct(target()),second=normalizeCatalogProduct(first);
 assert.equal(first.category,'kits');assert.deepEqual(first,second);
 assert.equal(first.comparisonSpecs?.contents?.source,richSolarCbk1302Source);
 for(const key of ['watts','outputWatts','voltage','capacityKwh','capacityAh','batteryKind','formFactor','chemistry','inverterType'])assert.equal(first.specs[key],undefined,key);
});
test('exact correction changes pack quantity only for the identity-matched offer',()=>{
 const unrelated={...target().offers[0],id:'other-retailer-offer',retailerId:'other-retailer',retailer:'Other retailer',url:'https://other.example/solar-kit',sku:'OTHER-SKU',packQuantity:6};
 const wrongVariant={...target().offers[0],id:'rich-solar-other-variant',url:sourceUrl.replace('39981933690929','39981933690928'),sku:'RS-CBK1301',packQuantity:2};
 const source=target({offers:[target().offers[0],unrelated,wrongVariant]});
 const categorized=categorizeProduct(source),normalized=normalizeCatalogProduct(source);
 assert.equal(categorized.offers[0].packQuantity,1);
 assert.deepEqual(categorized.offers.slice(1),[unrelated,wrongVariant]);
 assert.equal(normalized.offers[0].packQuantity,1);
 assert.deepEqual(normalized.offers.slice(1),[unrelated,wrongVariant]);
 assert.deepEqual(normalizeCatalogProduct(normalized),normalized);
});
test('stored exact catalog SKU alias is accepted only with exact identity and stale comparison rows are removed',()=>{
 const staleComparisonSpecs={outputWatts:{value:'13000 W'},voltage:{value:'240 V'},capacityKwh:{value:'30.72 kWh'},inverterType:{value:'Off-grid'},contents:{value:'Old guessed bundle'},model:{value:'RS-CBK1302'}};
 const canonical=target({id:'rich-solar-39981933690929',comparisonSpecs:staleComparisonSpecs,offers:target().offers.map(o=>({...o,sku:'39981933690929'}))});
 const categorized=categorizeProduct(canonical);assert.equal(categorized.category,'kits');assert.deepEqual(Object.keys(categorized.comparisonSpecs||{}).sort(),['contents','model']);
 const normalized=normalizeCatalogProduct(canonical);assert.equal(normalized.category,'kits');assert.deepEqual(Object.keys(normalized.comparisonSpecs||{}).sort(),['contents','model']);
 assert.equal(normalized.comparisonSpecs?.contents.value,richSolarCbk1302Contents);assert.equal(normalized.comparisonSpecs?.model.value,'RS-CBK1302');
 assert.equal(normalizeCatalogProduct(normalized).comparisonSpecs?.contents.value,richSolarCbk1302Contents);
 const wrongRetailer=target({id:'rich-solar-39981933690929',offers:target().offers.map(o=>({...o,sku:'39981933690929',retailerId:'other'}))});assert.equal(normalizeCatalogProduct(wrongRetailer).category,'batteries');
 const missingAliasSku=target({id:'rich-solar-39981933690929',offers:target().offers.map(o=>({...o,sku:undefined}))});assert.equal(normalizeCatalogProduct(missingAliasSku).category,'batteries');
});
test('identity guard rejects title-prefix lookalikes and exact target with changed variant, SKU, or brand',()=>{
 const otherBrand=normalizeCatalogProduct(target({id:'other-brand-copy',brand:'Other Brand'}));assert.equal(otherBrand.category,'batteries');assert.equal(otherBrand.comparisonSpecs?.contents,undefined);
 const changedVariant=target({id:'rich-solar-39981933690928',sourceUrl:sourceUrl.replace('39981933690929','39981933690928'),offers:target().offers.map(o=>({...o,url:o.url.replace('39981933690929','39981933690928')}))});assert.equal(categorizeProduct(changedVariant).category,'batteries');
 const changedSku=target({id:'rich-solar-39981933690929',offers:target().offers.map(o=>({...o,sku:'RS-CBK1301'}))});assert.equal(categorizeProduct(changedSku).category,'batteries');
 const canonicalIdMissingSku=target({id:'rich-solar-rs-cbk1302',offers:target().offers.map(o=>({...o,sku:undefined}))});assert.equal(categorizeProduct(canonicalIdMissingSku).category,'batteries');
 const canonicalIdWrongSku=target({id:'rich-solar-rs-cbk1302',offers:target().offers.map(o=>({...o,sku:'RS-CBK1301'}))});assert.equal(categorizeProduct(canonicalIdWrongSku).category,'batteries');
 const wrongBrand=target({id:'rich-solar-rs-cbk1302',brand:'Other Brand'});assert.equal(categorizeProduct(wrongBrand).category,'batteries');
});
test('exact JSON-LD offer identity parses as the kit before generic title classification',()=>{
 const html=`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Product',name:richSolarCbk1302Title,sku:'RS-CBK1302',brand:{'@type':'Brand',name:'RICH SOLAR'},description:'Kit Includes 2 x 6500W 48V Off-grid Hybrid Solar Inverters (RS-H6548); 6 x ALPHA 5 PRO 51.2V 100Ah Server Rack Lithium Batteries (RS-B5121P); 2 x 600 AMP Busbars; 4 x 4 ft 2/0 AWG Wire Sets (3/8 in)',offers:{'@type':'Offer',url:sourceUrl,price:'12999.99',priceCurrency:'USD',sku:'RS-CBK1302',availability:'https://schema.org/InStock'}})}</script>`;
 const rows=parseProductPage(html,{id:'rich-solar',name:'Rich Solar',origin:'https://richsolar.com'},sourceUrl,'2026-10-16T00:00:00.000Z');
 const product=rows.find(p=>p.offers.some(o=>o.sku==='RS-CBK1302'));assert.ok(product,'captured page should yield the exact RS-CBK1302 product');assert.equal(product.category,'kits');
 assert.deepEqual(product.comparisonSpecs?.contents,{value:richSolarCbk1302Contents,source:richSolarCbk1302Source});
 for(const key of ['watts','outputWatts','voltage','capacityKwh','capacityAh','batteryKind','formFactor','chemistry'])assert.equal(product.specs[key],undefined,key);
 const wrongBrandRows=parseProductPage(html.replace('RICH SOLAR','OTHER BRAND'),{id:'rich-solar',name:'Rich Solar',origin:'https://richsolar.com'},sourceUrl,'2026-10-16T00:00:00.000Z');assert.equal(wrongBrandRows.find(p=>p.offers.some(o=>o.sku==='RS-CBK1302'))?.category,'batteries');
});
