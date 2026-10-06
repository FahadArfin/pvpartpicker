import test from 'node:test';
import assert from 'node:assert/strict';
import {navigatePage,pageCommitted,pageIdentity,isPageTransitionActive,stopPageTransition} from '../lib/page-navigation.ts';

test('page identity tolerates query ordering and the catalog default without ignoring filters',()=>{
 assert.equal(pageIdentity('/parts'),pageIdentity('/parts?category=panels'));
 assert.equal(pageIdentity('/parts?q=&builder=1&category=batteries'),pageIdentity('/parts?category=batteries&builder=1'));
 assert.notEqual(pageIdentity('/parts?category=panels'),pageIdentity('/parts?category=batteries'));
});

test('navigation waits for the destination, falls back once, and superseded callbacks cannot navigate',async()=>{
 const keys=['document','location','matchMedia'] as const;
 const original=keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
 const set=(key:string,value:unknown)=>Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 let reduced=false,starts=0;
 const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
 const native=(update:()=>void|Promise<void>)=>{
  starts++;const updated=Promise.resolve().then(update);
  return {skipTransition(){},ready:updated,updateCallbackDone:updated,finished:updated};
 };
 try{
  set('location',{href:'https://pvpartpicker.test/'});set('matchMedia',()=>({matches:reduced}));
  set('document',{hidden:false,startViewTransition:native});
  let calls=0;
  navigatePage('/guide',()=>{calls++;});await flush();
  assert.equal(calls,1);assert.equal(isPageTransitionActive(),true);
  pageCommitted('/parts');await flush();assert.equal(isPageTransitionActive(),true);
  pageCommitted('/guide');await flush();assert.equal(isPageTransitionActive(),false);

  reduced=true;navigatePage('/build',()=>{calls++;});assert.equal(calls,2);assert.equal(starts,1);
  reduced=false;set('document',{hidden:false,startViewTransition(){throw Error('unsupported');}});
  navigatePage('/build',()=>{calls++;});assert.equal(calls,3);assert.equal(isPageTransitionActive(),false);

  set('document',{hidden:false,startViewTransition:native});
  const destinations:string[]=[];
  navigatePage('/guide',()=>destinations.push('guide'));
  navigatePage('/build',()=>destinations.push('build'));await flush();
  assert.deepEqual(destinations,['build']);
  pageCommitted('/build');await flush();assert.equal(isPageTransitionActive(),false);
  navigatePage('/tiers',()=>{calls++;});await flush();
  assert.equal(isPageTransitionActive(),true);
  await new Promise(resolve=>setTimeout(resolve,1850));
  assert.equal(isPageTransitionActive(),false);assert.equal(calls,4);
 }finally{stopPageTransition();for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});
