'use client';
import {FloatingSections} from './floating-sections';
import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Link from './site-link';
import {SiteNavigation} from './site-navigation';
import {usePageTransition} from './use-page-transition';
import {navigatePage} from '../lib/page-navigation';
import {Sun,Bell,Bookmark,Menu,X,ArrowRight,Plus,Eye,EyeOff} from 'lucide-react';
import type {PageCatalog} from '../lib/catalog-transport';
import {loadPageCatalog,readRecentPageCatalog,needsPageCatalog} from '../lib/catalog-client';
import type {Build,Product,CollectionReport} from '../lib/types';
import {bestOffer,costForQuantity,money} from '../lib/domain';
import {createPVTools,createToolCatalog,registerTools,browserToolRegistry} from '../lib/webmcp';
import {addBuildPart} from '../lib/build-flow';
import {normalizeWatchIds} from '../lib/price-drops';
import {restoreBuildDraft,replaceStoredDraft} from '../lib/build-ux';
import {validateBuild} from '../lib/domain';
import {deviceBuildsKey,readDeviceBuilds,saveDeviceBuild,isDeviceBuild,applySavedBuildIdentity} from '../lib/build-library';
type User={displayName:string;email:string}|null;
interface Context{products:Product[];reports:CollectionReport[];user:User;build:Build;draftReady:boolean;saving:boolean;setBuild:React.Dispatch<React.SetStateAction<Build>>;replaceDraft:(target:Build)=>void;add:(id:string,offerId?:string)=>void;chooseForBuild:(id:string,offerId?:string)=>void;save:(options?:{asNew?:boolean;name?:string})=>Promise<string|undefined>;notify:(s:string)=>void;compare:string[];setCompare:React.Dispatch<React.SetStateAction<string[]>>;watchIds:string[];watchReady:boolean;watchError:string;watchBusy:string[];toggleWatch:(id:string)=>Promise<boolean>;reloadWatch:()=>Promise<void>;}
const initial:Build={name:'My solar build',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
const ctx=createContext<Context|null>(null);
export function usePV(){const value=useContext(ctx);if(!value)throw new Error('PV provider missing');return value;}
export async function api(path:string,options?:RequestInit):Promise<any>{const r=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...options?.headers}});const d:any=await r.json();if(!r.ok)throw new Error(d.error||'Please try again.');return d;}
export function PVProvider({user,children}:{user:User;children:React.ReactNode}){
 const path=usePathname()||'/',needsCatalog=needsPageCatalog(path),router=useRouter();
 const[catalog,setCatalog]=useState<PageCatalog>({products:[],reports:[]}),[catalogReady,setCatalogReady]=useState(false),[catalogError,setCatalogError]=useState(''),[catalogAttempt,setCatalogAttempt]=useState(0);
 const pageContent=usePageTransition(path,!needsCatalog||catalogReady||path.startsWith('/products/'));
 const{products,reports}=catalog;
 useEffect(()=>{
  if(!needsCatalog)return;let live=true,timer:ReturnType<typeof setTimeout>|undefined;setCatalogError('');
  let storage:Storage|null=null;try{storage=sessionStorage;}catch{}
  const recent=readRecentPageCatalog(storage);if(recent){setCatalog(recent);setCatalogReady(true);}
  const refresh=()=>{
   if(document.hidden)return;
   clearTimeout(timer);
   loadPageCatalog(storage).then(data=>{if(live){setCatalog(data);setCatalogReady(true);setCatalogError('');timer=setTimeout(refresh,Math.max(30000,(data.expiresAt||Date.now()+120000)-Date.now()));}}).catch(e=>{if(live){setCatalogError((e as Error).message);timer=setTimeout(refresh,30000);}});
  };
  refresh();document.addEventListener('visibilitychange',refresh);
  return()=>{live=false;clearTimeout(timer);document.removeEventListener('visibilitychange',refresh);};
 },[needsCatalog,catalogAttempt]);
 useEffect(()=>{if(catalogReady)performance.mark('pv-catalog-ready');},[catalogReady]);
 const[build,setBuild]=useState<Build>(initial),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[compare,setCompare]=useState<string[]>([]);
 const[draftIssue,setDraftIssue]=useState('');const draftWriteBlocked=useRef(false);
 const[saving,setSaving]=useState(false);const saveLock=useRef(false);
 const[watchIds,setWatchIds]=useState<string[]>([]),[watchReady,setWatchReady]=useState(false),[watchError,setWatchError]=useState(''),[watchBusy,setWatchBusy]=useState<string[]>([]);
 const watchLocks=useRef(new Set<string>()),watchVersion=useRef(0);
 const reloadWatch=useCallback(async()=>{
  if((user&&needsCatalog&&!catalogReady)||watchLocks.current.size)return;const version=++watchVersion.current;
  setWatchReady(false);setWatchError('');
  try{
   let guest:string[]=[];try{const stored=localStorage.getItem('pvpartpicker-watchlist');if(stored)guest=normalizeWatchIds(JSON.parse(stored));}catch{localStorage.setItem('pvpartpicker-watchlist','[]');setNotice('Could not read your device watch list. You can start a new list.');}
   if(user){const result=await api('watchlist');if(version!==watchVersion.current)return;const cloud:string[]=result.items.map((i:{productId:string})=>i.productId);const imported=guest.filter(id=>!cloud.includes(id)&&products.some(p=>p.id===id)).slice(0,Math.max(0,500-cloud.length));if(imported.length)await api('watchlist',{method:'POST',body:JSON.stringify({productIds:imported})});if(version!==watchVersion.current)return;setWatchIds([...imported,...cloud]);try{localStorage.setItem('pvpartpicker-watchlist',JSON.stringify(guest.filter(id=>!imported.includes(id)&&!cloud.includes(id))));}catch{} }
   else setWatchIds(guest);
   if(version===watchVersion.current)setWatchReady(true);
  }catch(e){if(version===watchVersion.current)setWatchError((e as Error).message);}
 },[user,products,catalogReady,needsCatalog]);
 useEffect(()=>{reloadWatch();},[reloadWatch]);
 useEffect(()=>{if(user)return;const changed=(e:StorageEvent)=>{if(e.key==='pvpartpicker-watchlist')reloadWatch();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[user,reloadWatch]);
 const toggleWatch=async(id:string)=>{
  if(!watchReady||watchLocks.current.has(id))return false;
  const removing=watchIds.includes(id);if(!removing&&watchIds.length>=500){setNotice('Your watch list can hold up to 500 products.');return false;}
  watchVersion.current++;watchLocks.current.add(id);setWatchBusy(ids=>[...ids,id]);
  try{if(user)await api(removing?'watchlist/'+encodeURIComponent(id):'watchlist',{method:removing?'DELETE':'POST',...(removing?{}:{body:JSON.stringify({productIds:[id]})})});
   else{const stored=normalizeWatchIds(JSON.parse(localStorage.getItem('pvpartpicker-watchlist')||'[]'));const next=removing?stored.filter(p=>p!==id):[id,...stored.filter(p=>p!==id)];if(next.length>500)throw new Error('Your watch list can hold up to 500 products.');localStorage.setItem('pvpartpicker-watchlist',JSON.stringify(next));}
   setWatchIds(ids=>removing?ids.filter(p=>p!==id):[id,...ids.filter(p=>p!==id)]);setWatchError('');setNotice(removing?'Removed from your watch list.':user?'Added to your watch list.':'Added to your watch list on this device.');return true;
  }catch(e){setWatchError((e as Error).message);setNotice('Could not save your watch list: '+(e as Error).message);return false;}finally{watchLocks.current.delete(id);setWatchBusy(ids=>ids.filter(p=>p!==id));}
 };
 useEffect(()=>{try{const v=localStorage.getItem('pvpartpicker-draft');if(v)setBuild(restoreBuildDraft(v));}catch{draftWriteBlocked.current=true;setDraftIssue('Could not restore your device draft. Its stored data has been kept.');}try{const c=localStorage.getItem('pvpartpicker-compare');if(c){const ids=JSON.parse(c);if(Array.isArray(ids))setCompare(ids.filter(id=>typeof id==='string').slice(0,4));}}catch{}setReady(true);},[]);
 useEffect(()=>{if(catalogReady)setCompare(ids=>ids.filter(id=>products.some(p=>p.id===id)));},[catalogReady,products]);
 useEffect(()=>{if(ready){try{if(!draftWriteBlocked.current)localStorage.setItem('pvpartpicker-draft',JSON.stringify(build));localStorage.setItem('pvpartpicker-compare',JSON.stringify(compare));}catch{setNotice('Could not keep your draft on this device. Enable browser storage or save it to your account.');}}},[build,compare,ready]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6500);return()=>clearTimeout(t);},[notice]);
 const replaceDraft=(target:Build)=>{const next=replaceStoredDraft(localStorage,target,draftWriteBlocked.current);draftWriteBlocked.current=false;setDraftIssue('');setBuild(next);};
 const add=(id:string,offerId?:string)=>{setBuild(b=>addBuildPart(b,id,offerId));setNotice('Added to your build.');};
 const chooseForBuild=(id:string,offerId?:string)=>{
  if(!ready||draftWriteBlocked.current){setNotice('Recover your device draft before choosing equipment.');return;}
  const next=addBuildPart(build,id,offerId);
  // Persist before leaving the picker, including the native fallback path.
  try{localStorage.setItem('pvpartpicker-draft',JSON.stringify(next));}
  catch{setNotice('Could not save your draft on this device. Please enable browser storage and try again.');return;}
  setBuild(next);navigatePage('/build',()=>router.push('/build'));
 };
 const save=async(options?:{asNew?:boolean;name?:string})=>{
  if(!ready||saveLock.current)return;saveLock.current=true;setSaving(true);
  const draft=build;
  try{
   const clean=validateBuild({...draft,...(options?.name!==undefined?{name:options.name}:{})});let id:string;
   if(user){const result=await api('builds',{method:'POST',body:JSON.stringify({...clean,...(!options?.asNew&&draft.id&&!isDeviceBuild(draft.id)?{id:draft.id}:{})})});id=result.id;}
   else{id=!options?.asNew&&isDeviceBuild(draft.id)?draft.id!:'device:'+crypto.randomUUID();const saved=readDeviceBuilds(localStorage.getItem(deviceBuildsKey));localStorage.setItem(deviceBuildsKey,JSON.stringify(saveDeviceBuild(saved,clean,id,new Date().toISOString())));}
   setBuild(current=>applySavedBuildIdentity(current,draft,{...clean,id}));
   setNotice(user?'Build saved privately to your account.':'Build saved on this device. Find it in My builds.');return id;
  }catch(e){setNotice((e as Error).message);return undefined;}finally{saveLock.current=false;setSaving(false);}
 };
 // Register once; handlers read committed session state rather than render snapshots.
 const toolState=useRef({path,build,compare,watchIds,draftReady:ready,watchReady,authenticated:Boolean(user),catalogReady,catalog,toggleWatch});
 toolState.current={path,build,compare,watchIds,draftReady:ready&&!draftWriteBlocked.current,watchReady,authenticated:Boolean(user),catalogReady,catalog,toggleWatch};
 useEffect(()=>registerTools(createPVTools({
  state:()=>({...toolState.current,path:window.location.pathname+window.location.search}),
  catalog:createToolCatalog(()=>toolState.current.catalog,async()=>{let storage:Storage|null=null;try{storage=sessionStorage;}catch{}return loadPageCatalog(storage);},data=>{toolState.current.catalog=data;toolState.current.catalogReady=true;setCatalog(data);setCatalogReady(true);}),
  request:(path,options)=>api(path,{...options,signal:options?.signal?AbortSignal.any([options.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)}),
  updateBuild:fn=>{if(!toolState.current.draftReady)throw new Error('Resolve draft loading/recovery first.');const current=toolState.current.build,next={...current,...validateBuild(fn(current))};localStorage.setItem('pvpartpicker-draft',JSON.stringify(next));toolState.current.build=next;setBuild(next);setNotice('Draft updated.');return next;},
  setCompare:ids=>{if(!toolState.current.draftReady)throw new Error('Wait for device state to load.');localStorage.setItem('pvpartpicker-compare',JSON.stringify(ids));toolState.current.compare=ids;setCompare(ids);},
  setWatch:async(id,watched)=>{if(toolState.current.watchIds.includes(id)===watched)return;const ok=await toolState.current.toggleWatch(id);if(!ok)throw new Error('Watch change was not saved. Check the visible error or retry.');toolState.current.watchIds=watched?[id,...toolState.current.watchIds.filter(p=>p!==id)]:toolState.current.watchIds.filter(p=>p!==id);},
  navigate:href=>navigatePage(href,()=>router.push(href))
 }),browserToolRegistry(),message=>console.warn(message)),[]);
 return <ctx.Provider value={{products,reports,user,build,draftReady:ready,saving,setBuild,replaceDraft,add,chooseForBuild,save,notify:setNotice,compare,setCompare,watchIds,watchReady,watchError,watchBusy,toggleWatch,reloadWatch}}><a className="skip-link" href="#main-content">Skip to main content</a><SiteNavigation path={path}/><div ref={pageContent} id="main-content" className={path==='/'?'home-content-shell':undefined} tabIndex={-1}>{draftIssue&&<div className="workspace-recovery" role="alert"><p>{draftIssue}</p><button className="button outline small" onClick={()=>{try{const raw=localStorage.getItem('pvpartpicker-draft');if(raw)localStorage.setItem('pvpartpicker-draft-recovery',raw);localStorage.setItem('pvpartpicker-draft',JSON.stringify(initial));draftWriteBlocked.current=false;setBuild(initial);setDraftIssue('');setNotice('New draft started. The previous data is retained in device recovery storage.');}catch{setNotice('Could not access device storage. Enable it and try again.');}}}>Start a recoverable new draft</button></div>}{needsCatalog&&catalogReady&&catalogError&&<div className="workspace-recovery" role="status"><p>Showing recently cached parts. Prices have not been refreshed: {catalogError}</p><button className="button outline small" onClick={()=>setCatalogAttempt(n=>n+1)}>Retry current prices</button></div>}{needsCatalog&&!catalogReady&&!path.startsWith('/products/')?<main className="page-container catalog-loading" aria-busy={!catalogError}><h1>{path==='/build'?'System builder':'Your solar workspace'}</h1>{catalogError?<div role="alert"><p>{catalogError}</p><button className="button dark" onClick={()=>setCatalogAttempt(n=>n+1)}>Try again</button></div>:<><p role="status">Loading current parts and prices…</p><div className="catalog-loading-rows" aria-hidden="true"><span/><span/><span/></div></>}</main>:children}</div>{path==='/'?<footer className="home-footer"><Link href="/">PVPartPicker</Link><span>Made for your next build.</span></footer>:<footer className="site-footer"><Link className="footer-brand" href="/">☀ PVPartPicker</Link><span>Prices are observed, not guaranteed. Check retailer shipping, tax, and availability.</span><Link href="/guide">Guide</Link><Link href="/admin">Administration</Link><Link href="/price-scraper">Price Scraper</Link></footer>}{compare.length>0&&<div className="compare-dock"><span><strong>{compare.length}</strong> parts selected</span><Link className="button dark small" href="/compare">Compare parts <ArrowRight size={14}/></Link><button aria-label="Clear comparison" className="icon-button" onClick={()=>setCompare([])}><X size={16}/></button></div>}{notice&&<div className={'toast'+(compare.length?' above-compare':'')} role="status">{notice}<button className="icon-button" onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={15}/></button></div>}<FloatingSections path={path} compareCount={compare.length} hasNotice={Boolean(notice)}/></ctx.Provider>;
}
export function ProductImage({product,className=''}:{product:Product;className?:string}){const[failed,setFailed]=useState(false);return <div className={'product-image '+className}>{product.image&&!failed?<img src={product.image} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="image-fallback"><Sun size={30}/><span>Image unavailable</span></div>}</div>;}
export function BuildSummary(){const{build,products,setBuild,save,user}=usePV();let subtotal=0,unpriced=0;const lines=build.lines.map(line=>{const p=products.find(p=>p.id===line.productId);const offer=p?(line.offerId?p.offers.find(o=>o.id===line.offerId&&bestOffer({...p,offers:[o]},line.quantity)):bestOffer(p,line.quantity)):undefined;const cost=offer?costForQuantity(offer,line.quantity):null;if(cost)subtotal+=cost.subtotal;else unpriced++;return{line,p,cost};});return <aside className="build-summary"><div className="eyebrow">YOUR SOLAR SYSTEM</div><h3>One part at a time <Sun size={19}/></h3><div className="summary-body">{lines.length?lines.slice(0,4).map(({line,p,cost})=><div className="summary-item" key={line.productId}><span className="qty-pill">{line.quantity}×</span><div><Link href={'/products/'+line.productId}>{p?.name||'Unavailable product'}</Link><small>{cost?money(cost.subtotal):'Needs a current offer'}</small></div><button className="icon-button" aria-label={'Remove '+p?.name} onClick={()=>setBuild(b=>({...b,lines:b.lines.filter(l=>l.productId!==line.productId)}))}><X size={13}/></button></div>):<div className="summary-empty"><span className="empty-sun"><Plus size={23}/></span><p>Your build starts here.</p><small>Add parts to compare your system’s cost and compatibility.</small></div>}{lines.length>4&&<p className="muted small-text">+ {lines.length-4} more parts in your build</p>}</div><div className="summary-total"><span>Equipment subtotal</span><strong>{money(subtotal)}</strong></div><p className="micro">{unpriced?`${unpriced} items need current pricing. `:''}Shipping and tax calculated by retailers.</p><Link className="button dark full" href="/build">{lines.length?'Review your build':'Open system builder'} <ArrowRight size={16}/></Link>{lines.length>0&&<button className="button outline full" onClick={()=>save()}><Bookmark size={15}/>Save build</button>}<div className="summary-tip"><Sun size={17}/><span>New to solar? <Link href="/guide">Start with the essentials.</Link></span></div></aside>;}

export function WatchButton({product,compact=true}:{product:Product;compact?:boolean}){const{watchIds,watchReady,watchBusy,toggleWatch}=usePV();const watched=watchIds.includes(product.id),busy=watchBusy.includes(product.id);return <button className={'watch-button '+(watched?'watched ':'')+(compact?'':'watch-button-label')} aria-label={(watched?'Remove from watch list: ':'Watch ')+product.name} aria-pressed={watched} disabled={!watchReady||busy} onClick={()=>toggleWatch(product.id)} title={watched?'Remove from watch list':'Watch this product'}>{watched?<EyeOff size={17}/>:<Eye size={17}/>} {!compact&&<span>{busy?'Saving…':watched?'Watching':'Watch price'}</span>}</button>;}
