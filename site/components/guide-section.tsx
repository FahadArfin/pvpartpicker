/* eslint-disable @next/next/no-img-element -- Original vector diagrams are lazy-loaded. */
import type {GuideSection} from '../lib/guide-content';
import {sectionId} from '../lib/guide-content';
export default function GuideLessonSection({section:s,index:i}:{section:GuideSection;index:number}){
 return <section id={sectionId(i)} className="guide-lesson-section">
  <div className="guide-section-label">{String(i+1).padStart(2,'0')}</div><h2>{s.title}</h2>
  {s.paragraphs?.map((p,j)=><p key={j}>{p}</p>)}
  {s.figures?.map((f,j)=><figure className="guide-textbook-figure" key={j}><a href={'/guide/diagrams/'+f.diagram+'.svg'} target="_blank" rel="noopener noreferrer" aria-label={'Open full-size diagram: '+f.alt}><img src={'/guide/diagrams/'+f.diagram+'.svg'} alt={f.alt} width="960" height="540" loading="lazy" decoding="async"/></a><figcaption><strong>Figure {i+1}.{j+1}.</strong> {f.caption} <span>Original PVPartPicker illustration · <a href={'/guide/diagrams/'+f.diagram+'.svg'} target="_blank" rel="noopener noreferrer">View full size ↗</a></span></figcaption></figure>)}
  {s.formula&&<div className="guide-formula"><span>REFERENCE EQUATION</span><code>{s.formula}</code></div>}
  {s.bullets&&<ul>{s.bullets.map((b,j)=><li key={j}>{b}</li>)}</ul>}
  {s.steps&&<ol className="guide-procedure">{s.steps.map((b,j)=><li key={j}>{b}</li>)}</ol>}
  {s.columns&&s.rows&&<div className="guide-table-wrap" role="region" aria-label={s.title+' reference table'} tabIndex={0}><table><thead><tr>{s.columns.map((c,j)=><th scope="col" key={j}>{c}</th>)}</tr></thead><tbody>{s.rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td key={k}>{c}</td>)}</tr>)}</tbody></table></div>}
  {s.workedExample&&<aside className="guide-worked-example" aria-label={s.workedExample.title}><span className="guide-example-label">WORKED EXAMPLE</span><h3>{s.workedExample.title}</h3>{s.workedExample.givens&&<ul className="guide-example-givens">{s.workedExample.givens.map((g,j)=><li key={j}>{g}</li>)}</ul>}<ol>{s.workedExample.steps.map((step,j)=><li key={j}>{step}</li>)}</ol><p className="guide-example-result"><strong>Result:</strong> {s.workedExample.result}</p>{s.workedExample.discussion&&<p>{s.workedExample.discussion}</p>}</aside>}
  {s.callout&&<p className="guide-callout">{s.callout}</p>}
  {s.exercise&&<aside className="guide-lesson-exercise"><span className="guide-example-label">CHECK YOUR UNDERSTANDING</span><p>{s.exercise.question}</p><details><summary>Show answer and reasoning</summary><p><strong>{s.exercise.answer}</strong></p><p>{s.exercise.explanation}</p></details></aside>}
  {!!s.sources?.length&&<p className="guide-inline-source">References: {s.sources.map((source,j)=><span key={source.url}>{j>0?' · ':''}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></span>)}</p>}
 </section>;
}
