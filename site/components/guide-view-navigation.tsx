import {BookOpen,Calculator} from 'lucide-react';
import Link from './site-link';

export default function GuideViewNavigation({view,articleHref='/guide',calculatorHref='/guide/calculators'}:{view:'articles'|'calculators';articleHref?:string;calculatorHref?:string}){
 return <nav className="guide-view-navigation section-pill-nav" aria-label="Guide sections">
  <Link href={articleHref} aria-current={view==='articles'?'page':undefined}><span className="section-pill-icon"><BookOpen size={23} aria-hidden="true"/></span><span><strong>Articles</strong></span></Link>
  <Link href={calculatorHref} aria-current={view==='calculators'?'page':undefined}><span className="section-pill-icon"><Calculator size={23} aria-hidden="true"/></span><span><strong>Calculators</strong></span></Link>
 </nav>;
}
