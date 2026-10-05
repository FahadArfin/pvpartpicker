'use client';
import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import Link from './site-link';
import {Sun,Bell,Bookmark,Menu,X,ArrowRight,Plus,Eye,EyeOff} from 'lucide-react';
import type {PageCatalog} from '../lib/catalog-transport';
import type {Build,Product,CollectionReport} from '../lib/types';
import {bestOffer,costForQuantity,money} from '../lib/domain';
import {registerPVTools} from '../lib/webmcp';
import {addBuildPart} from '../lib/build-flow';
import {normalizeWatchIds} from '../lib/price-drops';
import {validateBuild} from '../lib/domain';
import {deviceBuildsKey,readDeviceBuilds,saveDeviceBuild,isDeviceBuild,applySavedBuildIdentity} from '../lib/build-library';
type User={displayName:string;email:string}|null;
interface Context{products:Product[];reports:CollectionReport[];user:User;build:Build;draftReady:boolean;saving:boolean;setBuild:React.Dispatch<React.SetStateAction<Build>>;add:(id:string,offerId?:string)=>void;chooseForBuild:(id:string,offerId?:string)=>void;save:(options?:{asNew?:boolean;name?:string})=>Promise<string|undefined>;notify:(s:string)=>void;compare:string[];setCompare:React.Dispatch<React.SetStateAction<string[]>>;watchIds:string[];watchReady:boolean;watchError:string;watchBusy:string[];toggleWatch:(id:string)=>Promise<void>;reloadWatch:()=>Promise<void>;}
const initial:Build={name:'My solar build',lines:[],settings:{purpose:'offgrid',mount:'roof'}};
const ctx=createContext<Context|null>(null);
export function usePV(){const value=useContext(ctx);if(!value)throw new Error('PV provider missing');return value;}
export async function api(path:string,options?:RequestInit):Promise<any>{const r=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...options?.headers}});const d:any=await r.json();if(!r.ok)throw new Error(d.error||'Please try again.');return d;}
export function PVProvider({catalogJson,user,children}:{catalogJson:string;user:User;children:React.ReactNode}){
 const {products,reports}=React.useMemo(()=>JSON.parse(catalogJson) as PageCatalog,[catalogJson]);
 const[build,setBuild]=useState<Build>(initial),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[compare,setCompare]=useState<string[]>([]),[menu,setMenu]=useState(false);
 const[saving,setSaving]=useState(false);const saveLock=useRef(false);
 const[watchIds,setWatchIds]=useState<string[]>([]),[watchReady,setWatchReady]=useState(false),[watchError,setWatchError]=useState(''),[watchBusy,setWatchBusy]=useState<string[]>([]);
 const watchLocks=useRef(new Set<string>());
 const reloadWatch=useCallback(async()=>{
  setWatchReady(false);setWatchError('');
  try{
   let guest:string[]=[];try{const stored=localStorage.getItem('pvpartpicker-watchlist');if(stored)guest=normalizeWatchIds(JSON.parse(stored));}catch{localStorage.setItem('pvpartpicker-watchlist','[]');setNotice('Could not read your device watch list. You can start a new list.');}
   if(user){const result=await api('watchlist'),cloud:string[]=result.items.map((i:{productId:string})=>i.productId);const imported=guest.filter(id=>!cloud.includes(id)&&products.some(p=>p.id===id)).slice(0,Math.max(0,500-cloud.length));if(imported.length)await api('watchlist',{method:'POST',body:JSON.stringify({productIds:imported})});setWatchIds([...imported,...cloud]);try{localStorage.setItem('pvpartpicker-watchlist',JSON.stringify(guest.filter(id=>!imported.includes(id)&&!cloud.includes(id))));}catch{} }
   else setWatchIds(guest);
   setWatchReady(true);
  }catch(e){setWatchError((e as Error).message);}
 },[user,products]);
 useEffect(()=>{reloadWatch();},[reloadWatch]);
 useEffect(()=>{if(user)return;const changed=(e:StorageEvent)=>{if(e.key==='pvpartpicker-watchlist')reloadWatch();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[user,reloadWatch]);
 const toggleWatch=async(id:string)=>{
  if(!watchReady||watchLocks.current.has(id))return;
  const removing=watchIds.includes(id);if(!removing&&watchIds.length>=500){setNotice('Your watch list can hold up to 500 products.');return;}
  watchLocks.current.add(id);setWatchBusy(ids=>[...ids,id]);
  try{if(user)await api(removing?'watchlist/'+encodeURIComponent(id):'watchlist',{method:removing?'DELETE':'POST',...(removing?{}:{body:JSON.stringify({productIds:[id]})})});
   else{const stored=normalizeWatchIds(JSON.parse(localStorage.getItem('pvpartpicker-watchlist')||'[]'));const next=removing?stored.filter(p=>p!==id):[id,...stored.filter(p=>p!==id)];if(next.length>500)throw new Error('Your watch list can hold up to 500 products.');localStorage.setItem('pvpartpicker-watchlist',JSON.stringify(next));}
   setWatchIds(ids=>removing?ids.filter(p=>p!==id):[id,...ids.filter(p=>p!==id)]);setWatchError('');setNotice(removing?'Removed from your watch list.':user?'Added to your watch list.':'Added to your watch list on this device.');
  }catch(e){setWatchError((e as Error).message);setNotice('Could not save your watch list: '+(e as Error).message);}finally{watchLocks.current.delete(id);setWatchBusy(ids=>ids.filter(p=>p!==id));}
 };
 useEffect(()=>{try{const v=localStorage.getItem('pvpartpicker-draft');if(v){const p=JSON.parse(v);if(Array.isArray(p.lines)&&p.settings)setBuild(p);}const c=localStorage.getItem('pvpartpicker-compare');if(c){const ids=JSON.parse(c);if(Array.isArray(ids))setCompare(ids.filter(id=>products.some(p=>p.id===id)).slice(0,4));}}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready){try{localStorage.setItem('pvpartpicker-draft',JSON.stringify(build));localStorage.setItem('pvpartpicker-compare',JSON.stringify(compare));}catch{setNotice('Could not keep your draft on this device. Enable browser storage or save it to your account.');}}},[build,compare,ready]);
 useEffect(()=>registerPVTools(products,build,setBuild),[products,build]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6500);return()=>clearTimeout(t);},[notice]);
 const add=(id:string,offerId?:string)=>{setBuild(b=>addBuildPart(b,id,offerId));setNotice('Added to your build.');};
 const chooseForBuild=(id:string,offerId?:string)=>{
  if(!ready)return;
  const next=addBuildPart(build,id,offerId);
  // This site uses full page navigation. Persist before leaving the picker.
  try{localStorage.setItem('pvpartpicker-draft',JSON.stringify(next));}
  catch{setNotice('Could not save your draft on this device. Please enable browser storage and try again.');return;}
  setBuild(next);window.location.assign('/build');
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
 return <ctx.Provider value={{products,reports,user,build,draftReady:ready,saving,setBuild,add,chooseForBuild,save,notify:setNotice,compare,setCompare,watchIds,watchReady,watchError,watchBusy,toggleWatch,reloadWatch}}><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="PVPartPicker home"><span className="brand-symbol"><Sun size={23}/></span><span>PV<span className="brand-light">PartPicker</span><small>SOLAR, PIECE BY PIECE</small></span></Link><nav className={menu?'primary-nav open':'primary-nav'} aria-label="Main navigation"><Link href="/" onClick={()=>setMenu(false)}>Browse parts</Link><Link href="/build" onClick={()=>setMenu(false)}>System builder <span className="tiny-count">{build.lines.length}</span></Link><Link href="/deals" onClick={()=>setMenu(false)}>Price drops</Link><Link href="/watchlist" onClick={()=>setMenu(false)}>Watch list <span className="tiny-count">{watchIds.length}</span></Link><Link href="/tiers" onClick={()=>setMenu(false)}>Tier lists</Link><Link href="/guide" onClick={()=>setMenu(false)}>Guide</Link></nav><div className="header-actions"><Link href="/account?tab=alerts" className="icon-button" aria-label="Your price alerts"><Bell size={19}/></Link>{user?<Link className="account-button" href="/account"><span className="avatar">{user.displayName[0]?.toUpperCase()}</span><span className="desktop">My account</span></Link>:<a className="button small dark" href="/signin-with-chatgpt?return_to=%2Faccount" target="_top">Sign in <ArrowRight size={14}/></a>}<button className="icon-button mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Toggle menu">{menu?<X/>:<Menu/>}</button></div></div></header><div className="market-bar"><span><i/> US retailers · USD</span><span>Build your system. Compare the options. Buy with confidence.</span><span className="desktop">Independent product comparisons</span></div>{children}<footer className="site-footer"><Link className="footer-brand" href="/">☀ PVPartPicker</Link><span>Prices are observed, not guaranteed. Check retailer shipping, tax, and availability.</span><Link href="/guide">Guide</Link><Link href="/admin">Administration</Link></footer>{compare.length>0&&<div className="compare-dock"><span><strong>{compare.length}</strong> parts selected</span><Link className="button dark small" href="/compare">Compare parts <ArrowRight size={14}/></Link><button aria-label="Clear comparison" className="icon-button" onClick={()=>setCompare([])}><X size={16}/></button></div>}{notice&&<div className="toast" role="status">{notice}<button className="icon-button" onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={15}/></button></div>}</ctx.Provider>;
}
export function ProductImage({product,className=''}:{product:Product;className?:string}){const[failed,setFailed]=useState(false);return <div className={'product-image '+className}>{product.image&&!failed?<img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="image-fallback"><Sun size={30}/><span>Image unavailable</span></div>}</div>;}
export function BuildSummary(){const{build,products,setBuild,save,user}=usePV();let subtotal=0,unpriced=0;const lines=build.lines.map(line=>{const p=products.find(p=>p.id===line.productId);const offer=p?(line.offerId?p.offers.find(o=>o.id===line.offerId&&bestOffer({...p,offers:[o]},line.quantity)):bestOffer(p,line.quantity)):undefined;const cost=offer?costForQuantity(offer,line.quantity):null;if(cost)subtotal+=cost.subtotal;else unpriced++;return{line,p,cost};});return <aside className="build-summary"><div className="eyebrow">YOUR SOLAR SYSTEM</div><h3>One part at a time <Sun size={19}/></h3><div className="summary-body">{lines.length?lines.slice(0,4).map(({line,p,cost})=><div className="summary-item" key={line.productId}><span className="qty-pill">{line.quantity}×</span><div><Link href={'/products/'+line.productId}>{p?.name||'Unavailable product'}</Link><small>{cost?money(cost.subtotal):'Needs a current offer'}</small></div><button className="icon-button" aria-label={'Remove '+p?.name} onClick={()=>setBuild(b=>({...b,lines:b.lines.filter(l=>l.productId!==line.productId)}))}><X size={13}/></button></div>):<div className="summary-empty"><span className="empty-sun"><Plus size={23}/></span><p>Your build starts here.</p><small>Add parts to compare your system’s cost and compatibility.</small></div>}{lines.length>4&&<p className="muted small-text">+ {lines.length-4} more parts in your build</p>}</div><div className="summary-total"><span>Equipment subtotal</span><strong>{money(subtotal)}</strong></div><p className="micro">{unpriced?`${unpriced} items need current pricing. `:''}Shipping and tax calculated by retailers.</p><Link className="button dark full" href="/build">{lines.length?'Review your build':'Open system builder'} <ArrowRight size={16}/></Link>{lines.length>0&&<button className="button outline full" onClick={()=>save()}><Bookmark size={15}/>Save build</button>}<div className="summary-tip"><Sun size={17}/><span>New to solar? <Link href="/guide">Start with the essentials.</Link></span></div></aside>;}

export function WatchButton({product,compact=true}:{product:Product;compact?:boolean}){const{watchIds,watchReady,watchBusy,toggleWatch}=usePV();const watched=watchIds.includes(product.id),busy=watchBusy.includes(product.id);return <button className={'watch-button '+(watched?'watched ':'')+(compact?'':'watch-button-label')} aria-label={(watched?'Remove from watch list: ':'Watch ')+product.name} aria-pressed={watched} disabled={!watchReady||busy} onClick={()=>toggleWatch(product.id)} title={watched?'Remove from watch list':'Watch this product'}>{watched?<EyeOff size={17}/>:<Eye size={17}/>} {!compact&&<span>{busy?'Saving…':watched?'Watching':'Watch price'}</span>}</button>;}
