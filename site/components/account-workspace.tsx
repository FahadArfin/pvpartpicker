'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from './site-link';
import {Bookmark,Bell,Trash2,ArrowRight,Check} from 'lucide-react';
import {BuildOpenAction} from './build-open-action';
import {api,usePV} from './pv-provider';
import {money} from '../lib/domain';
import type {Build} from '../lib/types';
import type {SavedBuild} from '../lib/build-library';
import {purposeLabel} from '../lib/build-library';
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from './ui/alert-dialog';

export function draftAfterSavedBuildDeletion(current:Build,id:string):Build{
 return current.id===id?{name:current.name,lines:current.lines,settings:current.settings}:current;
}
interface AccountAlert{id:string;productId:string;quantity:number;target:number;emailEnabled:boolean;lastPrice:number|null;active:boolean;}
interface AccountNotification{id:string;productId:string;title:string;body:string;createdAt:string;read:boolean;}

export function AccountWorkspace({initialTab='builds'}:{initialTab?:string}){
 const {user,products,notify,setBuild,saving}=usePV();
 const [tab,setTab]=useState(['builds','alerts','notifications'].includes(initialTab)?initialTab:'builds');
 const [builds,setBuilds]=useState<SavedBuild[]>([]),[alerts,setAlerts]=useState<AccountAlert[]>([]),[notifications,setNotifications]=useState<AccountNotification[]>([]);
 const [error,setError]=useState(''),[loading,setLoading]=useState(true),[emailConfigured,setEmailConfigured]=useState(false),[admin,setAdmin]=useState(false);
 const [busy,setBusy]=useState(false),[deleting,setDeleting]=useState<SavedBuild|null>(null),[deleteError,setDeleteError]=useState('');
 const mutationLock=useRef(false),request=useRef(0);
 const reload=useCallback(async(signal?:AbortSignal)=>{
  if(!user){setLoading(false);return;}
  const revision=++request.current;setLoading(true);setError('');
  try{
   const [b,a,n,m]=await Promise.all([api('builds',{signal}),api('alerts',{signal}),api('notifications',{signal}),api('me',{signal})]);
   if(signal?.aborted||revision!==request.current)return;
   setBuilds(b.builds);setAlerts(a.alerts);setNotifications(n.notifications);setEmailConfigured(m.emailConfigured);setAdmin(m.isAdmin);
  }catch(e){if(!signal?.aborted&&revision===request.current)setError((e as Error).message);}
  finally{if(!signal?.aborted&&revision===request.current)setLoading(false);}
 },[user]);
 useEffect(()=>{const controller=new AbortController();queueMicrotask(()=>{if(!controller.signal.aborted)void reload(controller.signal);});return()=>controller.abort();},[reload]);
 async function remove(kind:'builds'|'alerts',id:string){
  if(mutationLock.current)return;
  mutationLock.current=true;setBusy(true);setDeleteError('');
  try{
   await api(kind+'/'+encodeURIComponent(id),{method:'DELETE'});
   if(kind==='builds'){
    setBuild(current=>draftAfterSavedBuildDeletion(current,id));
    setBuilds(saved=>saved.filter(b=>b.id!==id));setDeleting(null);
   }else setAlerts(saved=>saved.filter(a=>a.id!==id));
   notify(kind==='builds'?'Saved build deleted. Your current draft has been kept.':'Price alert disabled.');
   await reload();
  }catch(e){if(kind==='builds')setDeleteError((e as Error).message);else setError((e as Error).message);}
  finally{mutationLock.current=false;setBusy(false);}
 }
 async function markRead(id:string){
  if(mutationLock.current)return;
  mutationLock.current=true;setBusy(true);
  try{await api('notifications/'+encodeURIComponent(id),{method:'PATCH',body:'{}'});await reload();}
  catch(e){setError((e as Error).message);}
  finally{mutationLock.current=false;setBusy(false);}
 }
 if(!user)return <main className="page-container"><div className="auth-empty"><Bookmark size={30} style={{margin:'auto'}}/><h1 style={{fontSize:25,marginTop:15}}>Keep your solar plans together.</h1><p>Sign in with ChatGPT to save builds, watch prices, and share product experience.</p><a className="button dark" href="/signin-with-chatgpt?return_to=%2Faccount" target="_top">Sign in with ChatGPT <ArrowRight size={15}/></a></div></main>;
 const canShowEmpty=!loading&&!error;
 return <main className="page-container">
  <div className="page-intro"><div><div className="eyebrow">YOUR SOLAR WORKSPACE</div><h1>My account</h1><p>{user.email}</p></div><div className="flex-actions">{admin&&<><Link className="button outline small" href="/admin">Administration</Link><Link className="button outline small" href="/price-scraper">Price Scraper</Link></>}<a className="text-link small-text" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a></div></div>
  <nav className="tab-nav" aria-label="Account sections">{[['builds',`Saved builds (${builds.length})`],['alerts',`Price alerts (${alerts.filter(a=>a.active).length})`],['notifications',`Notifications (${notifications.filter(n=>!n.read).length})`]].map(([value,label])=><button key={value} aria-pressed={tab===value} className={tab===value?'active':''} onClick={()=>setTab(value)}>{label}</button>)}</nav>
  {error&&<div role="alert" className="error-message"><p>{error}</p><button className="button outline small" disabled={loading||busy} onClick={()=>reload()}>Retry account data</button></div>}
  {loading&&<p className="inline-note" role="status">Loading your workspace…</p>}
  {tab==='builds'&&<div className="account-list">{builds.length?builds.map(b=><article className="account-item" key={b.id}><div><h3>{b.name}</h3><p>{b.lines.length} parts · {purposeLabel[b.settings.purpose]} · saved {b.updatedAt.slice(0,10)}</p></div><div className="flex-actions"><BuildOpenAction target={b} navigate/>{b.shareId&&<Link className="button outline small" href={'/share/'+b.shareId}>Shared view</Link>}
   <AlertDialog open={deleting?.id===b.id} onOpenChange={open=>{if(!busy){setDeleting(open?b:null);setDeleteError('');}}}><AlertDialogTrigger asChild><button className="icon-button" disabled={busy||saving} aria-label={'Delete '+b.name}><Trash2 size={15}/></button></AlertDialogTrigger><AlertDialogContent className="build-dialog"><AlertDialogHeader><AlertDialogTitle>Delete “{b.name}”?</AlertDialogTitle><AlertDialogDescription>This removes the saved version{b.communityShareId?' and its community publication':''}. Your current draft stays available.</AlertDialogDescription></AlertDialogHeader>{deleteError&&<p className="error-message" role="alert">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy} className="button outline small">Cancel</AlertDialogCancel><button className="button dark small" disabled={busy||saving} onClick={()=>remove('builds',b.id)}>{busy?'Deleting…':'Delete saved build'}</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></article>):canShowEmpty&&<div className="empty-state"><Bookmark size={28}/><h3>A place for your next system.</h3><p>Save a build to return to its parts and quantities from any device.</p><Link className="button dark" href="/build">Create a build</Link></div>}</div>}
  {tab==='alerts'&&<>{canShowEmpty&&!emailConfigured&&<div className="notice-panel" style={{marginBottom:18}}>Website alerts are available. Email delivery awaits the site’s verified sender configuration.</div>}<div className="account-list">{alerts.filter(a=>a.active).map(a=><article className="account-item" key={a.id}><div><Link href={'/products/'+a.productId}><h3>{products.find(p=>p.id===a.productId)?.name||'Product'}</h3></Link><p>{a.quantity} requested units · target {money(a.target)} · {a.emailEnabled?'Email + website':'Website'}</p>{a.lastPrice!==null&&<p>Last eligible equipment cost: {money(a.lastPrice)}</p>}</div><button className="button outline small" disabled={busy||loading} onClick={()=>remove('alerts',a.id)}>{busy?'Working…':'Disable alert'}</button></article>)}{!alerts.some(a=>a.active)&&canShowEmpty&&<div className="empty-state"><Bell size={28}/><h3>Let the price come to you.</h3><p>Open a product and set a target-price alert.</p><Link className="button dark" href="/parts">Find a product</Link></div>}</div></>}
  {tab==='notifications'&&<div className="account-list">{notifications.map(n=><article className="account-item" key={n.id}><div><Link href={'/products/'+n.productId}><h3>{n.title}</h3></Link><p>{n.body}</p><p>{n.createdAt.slice(0,16).replace('T',' ')} UTC</p></div>{!n.read&&<button className="button outline small" disabled={busy||loading} onClick={()=>markRead(n.id)}><Check size={13}/>{busy?'Working…':'Mark read'}</button>}</article>)}{!notifications.length&&canShowEmpty&&<div className="empty-state"><Bell size={28}/><h3>You’re all caught up.</h3><p>Notifications appear when an eligible price reaches your target.</p></div>}</div>}
 </main>;
}
