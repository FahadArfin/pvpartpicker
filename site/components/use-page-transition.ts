'use client';
import {useLayoutEffect,useRef} from 'react';
import {useSearchParams} from 'next/navigation';

/** Animate the committed page, without delaying navigation or remounting state. */
export function usePageTransition(path:string,ready:boolean){
 const content=useRef<HTMLDivElement>(null),previous=useRef<string|null>(null),animation=useRef<Animation|null>(null);
 const query=useSearchParams();
 // Category destinations are pages; typing/filtering and calculator edits stay immediate.
 const pageKey=path+(path==='/parts'?':'+(query.get('category')||'panels'):'');
 useLayoutEffect(()=>{
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>{if(motion.matches)animation.current?.cancel();};
  motion.addEventListener('change',stop);
  return()=>{motion.removeEventListener('change',stop);animation.current?.cancel();};
 },[]);
 useLayoutEffect(()=>{
  if(previous.current===pageKey)return;
  const initial=previous.current===null;
  if(!initial&&!ready)return;
  previous.current=pageKey;
  animation.current?.cancel();
  if(initial||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const page=content.current?.querySelector('main');
  if(!page?.animate)return;
  animation.current=page.animate([
   {opacity:.76,transform:'translateY(4px)'},
   {opacity:1,transform:'translateY(0)'},
  ],{id:'pv-page-enter',duration:160,easing:'cubic-bezier(.2,.7,.3,1)'});
  return()=>{animation.current?.cancel();};
 },[pageKey,ready]);
 return content;
}
