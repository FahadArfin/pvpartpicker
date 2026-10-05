import type {Product} from './types.ts';
import {bestOffer} from './domain.ts';
/** A retailer markdown is separate from historical savings or a value claim. */
export function productDeal(product:Product){
 const offer=bestOffer(product);if(!offer)return null;
 if(offer.referencePrice&&offer.referencePrice>offer.price){const percent=Math.round((1-offer.price/offer.referencePrice)*100);return {kind:'sale',label:'Hot deal',detail:`Retailer sale · ${percent}% below ${offer.retailer}’s reference price. This is a retailer markdown, not a historical low.`};}
 if(/best\s*value|fire\s*sale|clearance/i.test(product.name))return {kind:'pick',label:'Retailer value pick',detail:'The retailer labels this configuration as a value pick. A discount or historical low has not been verified; check price history.'};
 return null;
}
