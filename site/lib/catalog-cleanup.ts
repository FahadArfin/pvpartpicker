import type {Product,Offer} from './types.ts';
function sameSelection(a:string,b:string){try{const x=new URL(a),y=new URL(b);return x.origin===y.origin&&x.pathname.replace(/\/$/,'')===y.pathname.replace(/\/$/,'')&&x.searchParams.get('variant')===y.searchParams.get('variant');}catch{return false;}}
/** Reversible presentation corrections. Never writes offers or historical prices. */
export function normalizeCatalogProduct(product:Product):Product{
 const selected=product.name.split(/\s—\s/).slice(1).join(' ');
 // These recorded variants explicitly include one NOVA inverter and ALPHA batteries.
 // Component counts are not counts of the entire inverter/battery purchase.
 const nova=/\bNOVA\s*6548\s*\+\s*(?:(\d+)\s+pieces?\s+)?ALPHA\s*5\s*PRO\b/i.exec(selected);
 if(nova){const quantity=Number(nova[1]||1);if(quantity>=1&&quantity<=10000)return {...product,category:'kits',specs:{...product.specs,kitType:'Inverter + batteries'},configuration:{kind:'combo',family:'nova6548-alpha5pro',title:'NOVA 6548 + ALPHA 5 PRO Bundle',selection:selected,type:'Inverter + batteries',components:[{type:'inverter',quantity:1,detail:'NOVA 6548'},{type:'batteries',quantity,detail:'ALPHA 5 PRO'}]},offers:product.offers.map(o=>({...o,packQuantity:1,...(o.packQuantity!==1?{recordedPackQuantity:o.packQuantity}:{})}))};}
 if(product.category==='batteries'&&/^Off[ -]Grid System Kit\b/i.test(product.name))return {...product,category:'kits',specs:{...product.specs,kitType:'Solar system kits'},offers:product.offers.map(o=>({...o,packQuantity:1}))};

 const count=product.category==='batteries'&&!/cabinet/i.test(product.name)?selected.match(/(?:^|\/)\s*(\d+)\s+batter(?:y|ies)(?:\s+only)?\s*$/i):null;
 const units=count?Number(count[1]):undefined;
 const used=/^(?:\s*\[(?:open[ -]?box|used|refurbished|scratch[^\]]*|b-stock)\]|\s*(?:open[ -]?box|refurbished|used)\b)/i.test(product.name);
 const offers=product.offers.map(o=>{
  const own=sameSelection(product.sourceUrl,o.url);const pack=own&&o.packQuantity===1&&units&&units>=1&&units<=10000?units:o.packQuantity;
  return pack!==o.packQuantity||used&&own&&o.condition==='new'?{...o,packQuantity:pack,...(pack!==o.packQuantity?{recordedPackQuantity:o.packQuantity}:{}),...(used&&own?{condition:'used' as const}:{})}:o;
 });
 return {...product,offers};
}
export function purchaseLabel(product:Product,offer?:Offer):string{
 if(product.modelIdentity)return product.modelIdentity.packageLabel;
 if(product.configuration?.kind==='combo'||product.category==='kits')return product.configuration?.selection||'Complete bundle';
 const variant=product.name.split(/\s—\s/).slice(1).join(' · ').trim();
 if(offer&&offer.packQuantity>1)return `Pack of ${offer.packQuantity}${variant?' · '+variant:''}`;
 return variant||'Single unit';
}
export function latestObservedOffer(offers:Offer[]):Offer|undefined{
 return offers.filter(o=>Number.isFinite(o.price)&&o.price>0&&Number.isInteger(o.packQuantity)&&o.packQuantity>=1&&Number.isFinite(Date.parse(o.observedAt))).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)||a.id.localeCompare(b.id))[0];
}
