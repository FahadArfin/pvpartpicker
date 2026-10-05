/* eslint-disable @next/next/no-img-element -- Existing sourced catalog photographs. */
import examples from '../data/guide-product-examples.json';
import Link from './site-link';
export const hasGuideProductExamples=(slug:string)=>examples.some(p=>p.articles.includes(slug));
export default function GuideProductExamples({slug}:{slug:string}){
 const products=examples.filter(p=>p.articles.includes(slug));
 if(!products.length)return null;
 return <section id="product-examples" className="guide-product-examples"><div className="guide-section-label">IN THE CATALOG</div><h2>See the equipment</h2><p>Photographs show the named catalog products. Worked calculations use the model or hypothetical inputs stated in the lesson.</p>{products.map(p=><figure key={p.id}><Link href={'/products/'+p.id} aria-label={'View '+p.name}><img src={p.image} alt={p.name} width="160" height="160" loading="lazy" decoding="async"/></Link><figcaption><Link href={'/products/'+p.id}><strong>{p.name} →</strong></Link><p>{p.caption}</p><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Photo / listing: {p.credit} ↗</a></figcaption></figure>)}</section>;
}
