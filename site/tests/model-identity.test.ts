import test from 'node:test';
import assert from 'node:assert/strict';
import {buildModelCatalog,collapseModelListings,modelPurchaseOptions,type ModelRegistry} from '../lib/model-identity.ts';
import {bestOffer,costForQuantity} from '../lib/domain.ts';
import {buildPriceHistory} from '../lib/build-price-history.ts';
import type {Product} from '../lib/types.ts';
const now=Date.parse('2026-10-08T12:00:00Z');
const make=(id:string,name:string,price:number,pack=1):Product=>({id,name,brand:'Pecron',category:'all-in-one',description:'',image:'',images:[],sourceUrl:'https://example.com/'+id+'?variant=12',verifiedAt:new Date(now).toISOString(),specs:{capacityKwh:3.072},offers:[{id:'offer-'+id,retailerId:id,retailer:id,url:'https://example.com/'+id,currency:'USD',price,packQuantity:pack,stock:'in_stock',condition:'new',observedAt:new Date(now).toISOString()}]});
const unit=make('unit','F3000LFP — Main unit only',899),other=make('other','F3000LFP — Main unit only',849),bundle=make('bundle','F3000LFP — F3000LFP+PV300',1168),pallet=make('pack','F3000LFP — 2 units',1600,2);
const registry:ModelRegistry=[{id:'pecron-f3000lfp',name:'Pecron F3000LFP',preferredId:'unit',listings:[unit,other,bundle,pallet].map(p=>({id:p.id,title:p.name,parent:'https://example.com/'+p.id,hardware:{capacityKwh:3.072},packageKey:p.id==='bundle'?'pv300':p.id==='pack'?'pack-2':'unit',packageLabel:p.id==='bundle'?'F3000LFP + PV300':p.id==='pack'?'2 units':'Main unit only',kind:p.id==='bundle'?'bundle':p.id==='pack'?'pack':'unit'}))}];
test('one model groups different retailers while selected packages and original IDs survive',()=>{
 const raw=[unit,other,bundle,pallet],before=JSON.stringify(raw),view=buildModelCatalog(raw,registry);
 assert.equal(JSON.stringify(raw),before);assert.deepEqual(view.map(p=>p.id),raw.map(p=>p.id));
 assert.deepEqual(view[0].offers.map(o=>o.id),['offer-unit','offer-other']);
 assert.deepEqual(view[2].offers.map(o=>o.id),['offer-bundle']);assert.equal(view[3].offers[0].packQuantity,2);
 assert.equal(collapseModelListings(view).length,1);assert.equal(collapseModelListings(view)[0].id,'unit');
 const options=modelPurchaseOptions(view[1],view);assert.equal(options.length,3);assert.ok(options.some(p=>p.id==='other'));
 assert.equal(bestOffer(view[0],1,now)?.id,'offer-other');
 assert.equal(costForQuantity(view[3].offers[0],3).subtotal,3200);
 const history=buildPriceHistory([{productId:'unit',offerId:'offer-other',quantity:1}],view,[],30,now);assert.equal(history.points.at(-1)?.subtotal,849);
});
test('identity fails closed when the title, retailer parent URL or hardware changes',()=>{
 for(const changed of [{...other,name:'F5000LFP — Main unit only'},{...other,sourceUrl:'https://elsewhere.example/other'},{...other,specs:{capacityKwh:5.12}}]){
  const view=buildModelCatalog([unit,changed],registry);assert.equal(view[1].modelIdentity,undefined);assert.equal(view[0].offers.length,1);assert.equal(collapseModelListings(view).length,2);
 }
});
test('unreviewed hardware remains independent and offers are deduplicated by ID',()=>{
 const unreviewed=make('unknown','F3000LFP-like station',799),copy={...other,offers:[...other.offers,{...unit.offers[0],price:875,observedAt:new Date(now+1000).toISOString()}]};
 const view=buildModelCatalog([unit,copy,unreviewed],registry);assert.equal(collapseModelListings(view).length,2);assert.equal(view[0].offers.length,2);assert.equal(view[0].offers.find(o=>o.id==='offer-unit')?.price,875);
});
