import {BookOpen,Calculator} from 'lucide-react';
import Link from './site-link';

export default function GuideViewNavigation({view,articleHref='/guide',calculatorHref='/guide/calculators'}:{view:'articles'|'calculators';articleHref?:string;calculatorHref?:string}){
 return <nav className="guide-view-navigation" aria-label="Guide sections">
  <Link href={articleHref} aria-current={view==='articles'?'page':undefined}><BookOpen size={19} aria-hidden="true"/><span><strong>Articles</strong><small>Learn & explore</small></span></Link>
  <Link href={calculatorHref} aria-current={view==='calculators'?'page':undefined}><Calculator size={19} aria-hidden="true"/><span><strong>Calculators</strong><small>Plan with your numbers</small></span></Link>
 </nav>;
}
