interface Transition {skipTransition():void;ready:Promise<void>;finished:Promise<void>;updateCallbackDone:Promise<void>}
interface Pending {target:string;finish:()=>void;transition?:Transition;timer?:ReturnType<typeof setTimeout>}
let pending:Pending|undefined;

export function pageIdentity(href:string){
 const url=new URL(href,'https://pvpartpicker.invalid');
 url.hash='';
 for(const [key,value] of [...url.searchParams])if(value==='')url.searchParams.delete(key);
 if(url.pathname==='/parts'&&!url.searchParams.has('category'))url.searchParams.set('category','panels');
 url.searchParams.sort();return url.pathname+url.search;
}
export function isPageTransitionActive(){return !!pending;}
/** Resolve only after React commits the destination, including the catalog. */
export function pageCommitted(href:string){if(pending&&pageIdentity(href)===pending.target)pending.finish();}
export function stopPageTransition(){const entry=pending;pending=undefined;entry?.transition?.skipTransition();entry?.finish();}

/** Snapshot both pages; no exit delay, extra fetch, or cloned interactive DOM. */
export function navigatePage(href:string,navigate:()=>void){
 stopPageTransition();
 if(typeof document==='undefined'||!document.startViewTransition||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||pageIdentity(href)===pageIdentity(location.href)){navigate();return;}
 let invoked=false;
 const run=()=>{if(!invoked){invoked=true;navigate();}};
 let resolve!:()=>void;
 const committed=new Promise<void>(done=>{resolve=done;});
 const entry:Pending={target:pageIdentity(href),finish:()=>{clearTimeout(entry.timer);resolve();}};
 pending=entry;
 const clear=()=>{entry.finish();if(pending===entry)pending=undefined;};
 try{
  entry.transition=document.startViewTransition(()=>{if(pending!==entry)return;run();return committed;});
  // Release the snapshot if an error/slow response prevents a matching commit.
  entry.timer=setTimeout(()=>{entry.transition?.skipTransition();clear();},1800);
  void entry.transition.ready.catch(()=>{});
  void entry.transition.updateCallbackDone.catch(()=>{if(pending===entry)run();clear();});
  void entry.transition.finished.then(clear,clear);
 }catch{clear();run();}
}
