"use client";
import {ArrowRight,Search} from 'lucide-react';
import {HomePriceDrops} from './home-price-drops';
import {useRouter} from 'next/navigation';
import {navigatePage} from '../lib/page-navigation';

export function HomeWorkspace() {
  const router=useRouter();
  return <><main className="home-simple" aria-labelledby="home-title">
    <div className="home-simple-content">
      <h1 id="home-title">Build your solar system.</h1>
      <p className="home-simple-intro">Find parts. Compare prices. Put it all together.</p>
      <form className="home-simple-search" action="/parts" role="search" aria-label="Find solar equipment" onSubmit={event=>{
        event.preventDefault();const data=new FormData(event.currentTarget);
        const href='/parts?'+new URLSearchParams({category:'all',q:String(data.get('q')||'')}).toString();
        navigatePage(href,()=>router.push(href));
      }}>
        <Search size={24} aria-hidden="true"/>
        <input type="hidden" name="category" value="all"/>
        <input type="search" name="q" aria-label="Search solar equipment" placeholder="Search solar parts…" maxLength={100}/>
        <button type="submit" aria-label="Search parts"><ArrowRight size={24} aria-hidden="true"/></button>
      </form>
    </div>
  </main><HomePriceDrops/></>;
}
