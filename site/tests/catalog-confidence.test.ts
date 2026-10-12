import test from 'node:test';
import assert from 'node:assert/strict';
import {manufacturerDisplay,manufacturerOptions} from '../lib/manufacturer-display.ts';
import {freshOffers,costForQuantity} from '../lib/domain.ts';
import {normalizeCatalogProduct,purchaseLabel} from '../lib/catalog-cleanup.ts';
import {offerConfidence} from '../lib/price-confidence.ts';
import type {Product,Offer} from '../lib/types.ts';
const now=Date.parse('2026-10-12T00:00:00Z');
const offer:Offer={id:'o',retailerId:'shop',retailer:'Shop',url:'https://shop.example/product',price:7494,currency:'USD',packQuantity:1,stock:'in_stock',observedAt:'2026-10-11T23:00:00Z',condition:'new'};
const product:Product={id:'alpha-six',name:'Rich Solar ALPHA 5 PRO Server Rack Battery — ALPHA 5 PRO [Standard] / 6 Batteries',brand:'RICH SOLAR',category:'batteries',description:'',image:'',images:[],sourceUrl:offer.url,verifiedAt:offer.observedAt,specs:{},offers:[offer]};
test('known brand spellings share one filter without fuzzy manufacturer merges',()=>{
 assert.deepEqual(manufacturerOptions(['APTOS','Aptos Solar','Aptos','GROWATT','Growatt','Midnite','MidNite Solar','Midnite Solar','LiTime-US','LiTime','Redodo Power','Redodo','Vatrer Power','Shop Vatrer Lthium Batteries']),['Aptos','Growatt','LiTime','MidNite Solar','Redodo','Vatrer']);
 assert.equal(manufacturerDisplay('SolaX'),'SolaX');assert.equal(manufacturerDisplay('Solis'),'Solis');
});
test('explicit selected battery count changes display purchase math without mutating source observations',()=>{
 const cleaned=normalizeCatalogProduct(product);assert.equal(cleaned.id,product.id);assert.equal(cleaned.offers[0].id,'o');assert.equal(cleaned.offers[0].price,7494);assert.equal(cleaned.offers[0].observedAt,offer.observedAt);assert.equal(cleaned.offers[0].packQuantity,6);assert.equal(costForQuantity(cleaned.offers[0],1).subtotal,7494);assert.equal(costForQuantity(cleaned.offers[0],7).subtotal,14988);assert.match(purchaseLabel(cleaned,cleaned.offers[0]),/6/);assert.equal(product.offers[0].packQuantity,1);
});
test('included bundle battery counts are never converted into counts of entire kits',()=>{
 const kit={...product,id:'bundle',category:'kits' as const,name:'Inverter + Battery kit — 6 Batteries + cabinet'};assert.equal(normalizeCatalogProduct(kit).offers[0].packQuantity,1);assert.match(purchaseLabel(kit,offer),/bundle|package/i);
});
test('open-box title is identified as used in read projection without overwriting sources',()=>{
 const p={...product,name:'[OPEN BOX] Rich Solar battery'};assert.equal(normalizeCatalogProduct(p).offers[0].condition,'used');assert.equal(p.offers[0].condition,'new');
});
test('fresh eligibility rejects invalid price and pack arithmetic',()=>{
 assert.equal(freshOffers([{...offer,price:Infinity},{...offer,packQuantity:0},{...offer,packQuantity:1.5},{...offer,price:NaN}],now).length,0);assert.equal(freshOffers([offer],now).length,1);
});
test('price confidence distinguishes fresh, old, unavailable, unknown and failed latest checks',()=>{
 assert.equal(offerConfidence(offer,[],now).status,'fresh');
 assert.equal(offerConfidence({...offer,observedAt:'2026-10-09T00:00:00Z'},[],now).status,'stale');
 assert.equal(offerConfidence({...offer,stock:'out_of_stock'},[],now).status,'unavailable');
 assert.equal(offerConfidence({...offer,stock:'unknown'},[],now).status,'unverified');
 assert.equal(offerConfidence({...offer,observedAt:'2099-01-01'},[],now).status,'unverified');
 const report={retailerId:'shop',retailer:'Shop',status:'failed',products:0,checkedAt:'2026-10-11T23:30:00Z',message:'HTTP 403'};
 assert.equal(offerConfidence(offer,[report],now).status,'check-failed');assert.equal(offerConfidence(offer,[{...report,checkedAt:'2026-10-10'}],now).status,'fresh');
});

test('reviewed Alpha Standard variants group one model but retain six distinct purchase packages',async()=>{
 const {buildModelCatalog,collapseModelListings,modelPurchaseOptions}=await import('../lib/model-identity.ts');const registry=(await import('../data/model-identities.json',{with:{type:'json'}})).default;
 const group=registry.find(m=>m.id==='rich-solar-alpha-5-pro-standard')!;assert.equal(group.listings.length,6);
 const products=group.listings.map(e=>normalizeCatalogProduct({...product,id:e.id,name:e.title,sourceUrl:e.parent+'?variant='+e.id.replace('shopsolar-',''),specs:e.hardware as Product["specs"],offers:[{...offer,id:e.id,url:e.parent+'?variant='+e.id.replace('shopsolar-','')}]}));
 const projected=buildModelCatalog(products,registry as any);assert.equal(collapseModelListings(projected).length,1);assert.equal(modelPurchaseOptions(projected[0],projected).length,6);assert.equal(projected[5].offers[0].packQuantity,6);assert.equal(projected[0].offers.length,1);
 const changed={...products[0],name:products[0].name+' revised'};assert.equal(buildModelCatalog([changed],registry as any)[0].modelIdentity,undefined);
});

test('package-history mode preserves raw purchase prices when current quantity corrections differ',async()=>{
 const {productHistoryPoints}=await import('../lib/product-price-history.ts');const p=normalizeCatalogProduct(product),obs=[{offerId:'o',price:7494,packQuantity:1,stock:'in_stock',observedAt:offer.observedAt}];assert.equal(p.offers[0].recordedPackQuantity,1);assert.equal(productHistoryPoints(p,obs,'package')[0].o,7494);assert.equal(obs[0].packQuantity,1);
});

test('a named inverter plus battery variant remains one bundle, not several inverters',()=>{
 const p={...product,name:'NOVA 6548 | 6500 Watt Off-Grid Hybrid Inverter — NOVA 6548 + 2 Pieces ALPHA 5 PRO',category:'inverters' as const,offers:[{...offer,packQuantity:2}]};const cleaned=normalizeCatalogProduct(p);assert.equal(cleaned.category,'kits');assert.equal(cleaned.offers[0].packQuantity,1);assert.equal(cleaned.configuration?.components.find(c=>c.type==='batteries')?.quantity,2);assert.equal(p.offers[0].packQuantity,2);
});
