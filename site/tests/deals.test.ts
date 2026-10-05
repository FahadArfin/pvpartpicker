import test from 'node:test';
import assert from 'node:assert/strict';
import {productDeal} from '../lib/deals.ts';
import {parseProductPage} from '../lib/retailers.ts';
import {validateIngestion} from '../lib/ingestion.ts';
const retailer={id:'renogy',name:'Renogy',origin:'https://www.renogy.com'};
function product(referencePrice?:number){return parseProductPage('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'200W Solar Panel',offers:{'@type':'Offer',price:100,referencePrice,priceCurrency:'USD',availability:'https://schema.org/InStock'}})+'</script>',retailer,retailer.origin+'/panel',new Date().toISOString())[0];}
test('sale markers require a fresh eligible offer with a real retailer reference price',()=>{
 const p=product(125);assert.equal(p.offers[0].referencePrice,125);assert.match(productDeal(p)!.detail,/20%/);assert.equal(productDeal(product(100)),null);
 assert.equal(productDeal({...p,offers:p.offers.map(o=>({...o,stock:'out_of_stock'}))}),null);
 assert.equal(productDeal({...p,offers:p.offers.map(o=>({...o,observedAt:'2000-01-01'}))}),null);
 assert.doesNotThrow(()=>validateIngestion({products:[p]}));
});
test('retailer best-value labels remain separate from proven markdowns and historical lows',()=>{
 const p={...product(),name:'200W Solar Panel — 4 pack (🔥 Best Value)'};assert.equal(productDeal(p)?.kind,'pick');assert.match(productDeal(p)!.detail,/not been verified/);
});
