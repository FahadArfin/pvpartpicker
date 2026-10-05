'use client';
import {Minus,Plus} from 'lucide-react';
import {usePV} from './pv-provider';
import type {Product} from '../lib/types';

export function BuildQuantity({product,offerId,className='',returnToBuild=false}:{product:Product;offerId?:string;className?:string;returnToBuild?:boolean}){
 const {build,draftReady,setBuild,add,chooseForBuild}=usePV();
 const quantity=build.lines.find(line=>line.productId===product.id)?.quantity||0;
 const decrease=()=>setBuild(current=>({...current,lines:current.lines.flatMap(line=>line.productId!==product.id?[line]:line.quantity>1?[{...line,quantity:line.quantity-1}]:[])}));
 return <div className={'build-quantity '+(quantity?'has-part ':'')+className} role="group" aria-label={'Build quantity for '+product.name}>
  <button type="button" disabled={quantity===0} onClick={decrease} aria-label={'Remove one '+product.name+' from build'} title="Remove one from build"><Minus size={14}/></button>
  <output aria-live="polite" aria-atomic="true" aria-label={'Quantity of '+product.name+' in build'}>{quantity}</output>
  <button type="button" disabled={quantity>=10000||(returnToBuild&&!draftReady)} onClick={()=>(returnToBuild?chooseForBuild:add)(product.id,offerId)} aria-label={'Add one '+product.name+' to build'} title="Add one to build"><Plus size={14}/></button>
 </div>;
}
