'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="page-container"><div className="empty-state"><h2>This page couldn’t load.</h2><p>Please try again. Your draft stays on this device.</p><button className="button dark" onClick={reset}>Try again</button></div></main>;}
