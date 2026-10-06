'use client';
import {useEffect,useRef,type AnchorHTMLAttributes} from 'react';
import {useRouter} from 'next/navigation';
import {appDestination,allowsPrefetch,createPrefetchBudget} from '../lib/navigation-policy';
import {loadPageCatalog,needsPageCatalog} from '../lib/catalog-client';
const budget=createPrefetchBudget();

// next/link's dynamic navigation namespace has broken exports in this beta build.
// The statically imported router API keeps the shared shell alive without that path.
export default function SiteLink(props:AnchorHTMLAttributes<HTMLAnchorElement>){
 const router=useRouter(),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const cancel=()=>{clearTimeout(timer.current);timer.current=undefined;};
 useEffect(()=>cancel,[]);
 const warm=()=>{
  if(props.download!==undefined||(props.target&&props.target!=='_self')||document.hidden)return;
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(!allowsPrefetch(connection))return;
  const href=appDestination(props.href,location.href);if(!href||!budget.take(href))return;
  // Full intent prefetch is supported by vinext; no viewport-wide speculation.
  const options={kind:'full',onInvalidate:()=>budget.release(href)};
  router.prefetch(href,options as Parameters<typeof router.prefetch>[1]);
  if(needsPageCatalog(new URL(href,location.href).pathname)){
   let storage:Storage|null=null;try{storage=sessionStorage;}catch{}
   void loadPageCatalog(storage).catch(()=>{});
  }
 };
 const schedule=()=>{cancel();timer.current=setTimeout(warm,150);};
 return <a {...props}
  onMouseEnter={e=>{props.onMouseEnter?.(e);if(!e.defaultPrevented)schedule();}}
  onMouseLeave={e=>{props.onMouseLeave?.(e);cancel();}}
  onFocus={e=>{props.onFocus?.(e);if(!e.defaultPrevented)schedule();}}
  onBlur={e=>{props.onBlur?.(e);cancel();}}
  onPointerDown={e=>{props.onPointerDown?.(e);if(!e.defaultPrevented&&e.button===0)warm();}}
  onClick={e=>{
   props.onClick?.(e);cancel();
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||props.download!==undefined||(props.target&&props.target!=='_self'))return;
   const href=appDestination(props.href,location.href);if(!href)return;
   e.preventDefault();router.push(href);
  }}/>;
}
