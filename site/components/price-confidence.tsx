'use client';
import './price-confidence.css';
import type {Offer,CollectionReport} from '../lib/types';
import {offerConfidence} from '../lib/price-confidence';
export function PriceConfidence({offer,reports=[],hideFresh=false}:{offer?:Offer;reports?:CollectionReport[];hideFresh?:boolean}){
 const state=offerConfidence(offer,reports);if(hideFresh&&state.status==='fresh')return null;return <span className={'price-confidence price-confidence-'+state.status} title={state.detail}><span>{state.label}</span>{offer&&<time dateTime={offer.observedAt} className="sr-only">{state.detail}</time>}</span>;
}
