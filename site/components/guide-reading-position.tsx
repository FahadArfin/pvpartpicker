'use client';
import {useEffect,useState} from 'react';
import {guideReadingKey,readGuidePosition,saveGuidePosition,type ReadingPosition} from '../lib/guide-reading';
export default function GuideReadingPosition({slug,sections}:{slug:string;sections:string[]}){
 const [saved,setSaved]=useState<ReadingPosition>();
 useEffect(()=>{
  setSaved(undefined);
  try{const position=readGuidePosition(localStorage.getItem(guideReadingKey),slug);if(position&&sections.includes(position.section))setSaved(position);}catch{}
  let timer:ReturnType<typeof setTimeout>|undefined;
  const persist=()=>{const candidates=sections.map(id=>document.getElementById(id)).filter((e):e is HTMLElement=>Boolean(e));const section=candidates.filter(e=>e.getBoundingClientRect().top<=160).at(-1);if(!section)return;try{localStorage.setItem(guideReadingKey,saveGuidePosition(localStorage.getItem(guideReadingKey),slug,{section:section.id,offset:Math.max(-9999,Math.min(9999,section.getBoundingClientRect().top)),updatedAt:Date.now()}));}catch{}};
  const scroll=()=>{clearTimeout(timer);timer=setTimeout(persist,500);};window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pagehide',persist);
  return()=>{clearTimeout(timer);window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',persist);};
 },[slug,sections]);
 if(!saved)return null;
 return <button className="guide-resume-reading reset-filters" onClick={()=>{const node=document.getElementById(saved.section);if(node)window.scrollTo({top:window.scrollY+node.getBoundingClientRect().top-saved.offset,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});setSaved(undefined);}}>Resume saved reading position →</button>;
}
