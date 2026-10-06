'use client';
import {useCallback,useEffect,useState} from 'react';
import {FolderOpen,RefreshCw} from 'lucide-react';
import Link from './site-link';
import {api,usePV} from './pv-provider';
import {BuildOpenAction} from './build-open-action';
import {CommunityWorkspace} from './community-workspace';
import {deviceBuildsKey,readDeviceBuilds,isDeviceBuild,purposeLabel,type SavedBuild} from '../lib/build-library';

export function BuildsWorkspace({view}:{view:'saved'|'community'}) {
  const {user,build,draftReady}=usePV();
  const [saved,setSaved]=useState<SavedBuild[]>([]),[loading,setLoading]=useState(true),[errors,setErrors]=useState<string[]>([]),[query,setQuery]=useState('');
  const reload=useCallback(async()=>{
    setLoading(true);setErrors([]);
    const issues:string[]=[];let device:SavedBuild[]=[],account:SavedBuild[]=[];
    try{device=readDeviceBuilds(localStorage.getItem(deviceBuildsKey));}catch(e){issues.push((e as Error).message);}
    if(user)try{account=(await api('builds')).builds;}catch(e){issues.push('Account builds: '+(e as Error).message);}
    setSaved([...account,...device]);setErrors(issues);setLoading(false);
  },[user]);
  useEffect(()=>{if(view==='saved')void reload();},[view,reload]);
  const visible=saved.filter(b=>b.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="page-container builds-page">
    <header className="page-intro"><div><Link className="builds-back" href="/builds">← Builds</Link><h1>{view==='saved'?'Saved builds':'Popular builds'}</h1><p>{view==='saved'?'Reopen a system saved on this device or in your account.':'Explore systems shared by the community and make them your own.'}</p></div><Link className="button dark small" href="/build">Start Your Build</Link></header>
    <nav className="tab-nav" aria-label="Build collections"><Link href="/builds/saved" className={view==='saved'?'active':''} aria-current={view==='saved'?'page':undefined}>Saved builds</Link><Link href="/builds/community" className={view==='community'?'active':''} aria-current={view==='community'?'page':undefined}>Popular builds</Link></nav>
    {view==='community'?<CommunityWorkspace embedded/>:<section aria-label="Saved builds">
      <div className="home-current"><FolderOpen size={20} aria-hidden="true"/><div><span className="eyebrow">CURRENT DRAFT</span><h2>{draftReady?build.name:'Loading current draft…'}</h2><p>{draftReady?`${build.lines.length} part selection${build.lines.length===1?'':'s'} · Your draft is separate from saved versions.`:'Restoring this device’s draft.'}</p></div><Link className="button outline small" href="/build">Continue editing</Link></div>
      <div className="builds-toolbar"><label className="field">Find a saved build<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by build name"/></label><button className="button outline small" disabled={loading} onClick={reload}><RefreshCw size={14}/>Refresh</button></div>
      <p className="inline-note">{user?'Showing private account builds and builds saved on this device.':'Device builds stay in this browser.'} {!user&&<a className="text-link" href="/signin-with-chatgpt?return_to=%2Fbuilds%2Fsaved" target="_top">Sign in for your account builds</a>}</p>
      {errors.map(message=><p className="error-message" role="alert" key={message}>{message}</p>)}
      {loading?<p role="status">Loading saved builds…</p>:<div className="saved-build-list">{visible.map(b=><article className="saved-build-item" key={b.id}><div><h2>{b.name}</h2><p>{b.lines.length} part{b.lines.length===1?'':'s'} · {purposeLabel[b.settings.purpose]} · {b.settings.mount==='roof'?'Roof':'Ground'}</p><small>{isDeviceBuild(b.id)?'This device':'Account'} · saved {new Date(b.updatedAt).toLocaleDateString()}</small></div><BuildOpenAction target={b} navigate/></article>)}</div>}
      {!loading&&!errors.length&&!visible.length&&<div className="empty-state"><FolderOpen size={26}/><h2>{saved.length?'No saved builds match.':'Save your first system'}</h2><p>{saved.length?'Try a different build name.':'In System Builder, name your setup and choose Save build. You can reopen it here whenever you’re ready.'}</p>{saved.length?<button className="button outline small" onClick={()=>setQuery('')}>Clear search</button>:<Link className="button dark small" href="/build">Open System Builder</Link>}</div>}
    </section>}
  </main>;
}
