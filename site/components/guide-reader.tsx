/* eslint-disable @next/next/no-img-element -- Local compressed guide artwork. */
import Link from './site-link';
import GuideReadingPosition from './guide-reading-position';
import GuideNavigation from './guide-navigation';
import GuideLessonSection from './guide-section';
import GuideProductExamples,{hasGuideProductExamples} from './guide-product-examples';
import GuideViewNavigation from './guide-view-navigation';
import {guideEntries,guideArticles,readMinutes,sectionId,type GuideArticle} from '../lib/guide-content';
export default function GuideReader({article:a,home=false}:{article:GuideArticle;home?:boolean}){
 const calculatorTool=a.tool?.href.startsWith('/guide/calculators')?a.tool:undefined;
 const calculatorHref=(calculatorTool?.href??'/guide/calculators')+(calculatorTool?.href.includes('?')?'&':'?')+'article='+encodeURIComponent(a.slug);
 const ChapterTitle=home?'h2':'h1';
 const chapters=guideArticles.filter(x=>x.kind===a.kind),index=chapters.findIndex(x=>x.slug===a.slug),previous=chapters[index-1],next=chapters[index+1];
 const sections=[...a.sections.map((s,i)=>({id:sectionId(i),title:s.title})),...(hasGuideProductExamples(a.slug)?[{id:'product-examples',title:'See the equipment'}]:[]),...(a.quiz?[{id:'understanding',title:'Check your understanding'}]:[]),{id:'sources',title:'Sources & further reading'}];
 return <main className="page-container guide-field-manual">
  <div className="guide-manual-bar"><div><div className="eyebrow">PVPartPicker FIELD GUIDE</div>{home?<h1>Guide</h1>:<Link className="guide-manual-home" href="/guide">Guide</Link>}</div><p>Learn the fundamentals.<br/>Keep a reference for the details.</p></div>
  <GuideViewNavigation view="articles" articleHref={home?'/guide':'/guide/'+a.slug} calculatorHref={calculatorHref}/>
  <div className="guide-manual-layout"><GuideNavigation entries={guideEntries} currentSlug={a.slug} sections={sections}/><div className="guide-reader-main">
   <nav className="guide-reader-pager" aria-label="Chapter navigation">{previous?<Link href={'/guide/'+previous.slug}>← Previous</Link>:<span>Start here</span>}<span>{index+1} / {chapters.length} {a.kind==='Guide'?'chapters':'briefings'}</span>{next?<Link href={'/guide/'+next.slug}>Next →</Link>:<Link href="/guide?view=library">All articles →</Link>}</nav>
   <GuideReadingPosition key={a.slug} slug={a.slug} sections={sections.map(s=>s.id)}/>
   <article className="guide-prose" aria-labelledby="guide-chapter-title">
    <header className="guide-article-header"><div className="guide-row-tags"><span>{a.topic}</span><span>{a.level}</span><span>{readMinutes(a)} min read</span></div><ChapterTitle id="guide-chapter-title" className="guide-chapter-title">{a.title}</ChapterTitle><p className="guide-lead">{a.summary}</p><p className="guide-date">Editorial research review <time dateTime={a.reviewed}>{a.reviewed}</time>{a.adaptedFrom&&<> · Adapted <time dateTime={a.adaptedFrom.imported}>{a.adaptedFrom.imported}</time></>}{a.eventDate&&<> · Announcement <time dateTime={a.eventDate}>{a.eventDate}</time></>}</p>{a.outcome&&<p className="guide-outcome"><strong>You’ll learn:</strong> {a.outcome}</p>}</header>
    {calculatorTool&&<Link className="guide-related-tool" href={calculatorHref}><span><strong>Put this chapter into practice</strong><small>{calculatorTool.label}</small></span><span aria-hidden="true">Open calculator →</span></Link>}
    {a.image&&<figure><img src={a.image} alt={a.slug==='panel-technology'?'Concept illustration of solar panel construction':'Concept illustration of a solar equipment wall'} width="1536" height="1024" loading="lazy"/><figcaption>Original Solar4U concept illustration. Not an installation drawing.</figcaption></figure>}
    {a.sections.map((section,index)=><GuideLessonSection key={sectionId(index)} section={section} index={index}/>)}
    <GuideProductExamples slug={a.slug}/>
    {a.quiz&&<section id="understanding" className="guide-check"><h2>Check your understanding</h2><p>{a.quiz.question}</p><ol type="A">{a.quiz.options.map(o=><li key={o}>{o}</li>)}</ol><details><summary>Show answer and explanation</summary><p><strong>{a.quiz.options[a.quiz.answer]}</strong></p><p>{a.quiz.explanation}</p></details></section>}
    <section id="sources" className="guide-sources"><h2>Sources & further reading</h2><ul>{a.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul><p className="guide-origin">{a.origin??'PVPartPicker editorial guide. Worked examples use stated assumptions; exact equipment manuals and project conditions govern.'}</p>{a.adaptedFrom&&<p className="guide-origin">Adapted from <a href={'https://github.com/FahadArfin/Solar4U/blob/'+a.adaptedFrom.commit+'/app/guides-page.tsx'} target="_blank" rel="noopener noreferrer">Solar4U chapter “{a.adaptedFrom.chapter}”</a> and its professional reference notes. The expanded lesson uses the sources listed above; this link records the original curriculum provenance.</p>}</section>
    <div className="guide-article-actions">{a.tool&&<Link className="button dark" href={calculatorTool?calculatorHref:a.tool.href}>{a.tool.label} →</Link>}<Link className="button outline" href="/build">Open system builder</Link></div>
   </article>
   <nav className="guide-bottom-pager" aria-label="Continue reading">{previous&&<Link href={'/guide/'+previous.slug}><small>PREVIOUS CHAPTER</small><strong>← {previous.title}</strong></Link>}{next&&<Link href={'/guide/'+next.slug}><small>NEXT CHAPTER</small><strong>{next.title} →</strong></Link>}</nav>
  </div></div>
 </main>;
}
