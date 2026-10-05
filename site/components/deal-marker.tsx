import {Flame} from 'lucide-react';
import type {Product} from '../lib/types';
import {productDeal} from '../lib/deals';
export function DealMarker({product}:{product:Product}){const deal=productDeal(product);return deal?<span className={'deal-marker deal-'+deal.kind} role="img" aria-label={deal.label+'. '+deal.detail} title={deal.label+' · '+deal.detail}><Flame size={15} fill="currentColor" strokeWidth={1.5}/></span>:null;}
