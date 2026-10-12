'use client';
import progress from '../data/specification-progress.json';
import {categories} from '../lib/types';
const number=(n:number)=>n.toLocaleString();
export function SpecificationResearchProgress(){
 return <section className="backfill-monitor" aria-labelledby="specification-research-heading" id="specification-research">
 <div className="backfill-heading"><h2 id="specification-research-heading">Specification research</h2><span className="backfill-state tone-muted">Saved research snapshot</span></div>
 <div className="backfill-counts"><span><strong>{number(progress.remainingListings)}</strong> listings with gaps</span><span><strong>{number(progress.remainingFields)}</strong> missing fields</span><span><strong>{number(progress.completeListings)}</strong> comparison coverage complete</span></div>
 <p className="backfill-note">{number(progress.awaitingReview)} awaiting review · {number(progress.blockedListings)} source unavailable · {number(progress.reviewedGaps)} reviewed with gaps</p>
 <details><summary>Remaining by category</summary><div className="table-scroll"><table className="data-table research-count-table"><thead><tr><th>Category</th><th>Listings with gaps</th><th>Missing fields</th></tr></thead><tbody>{progress.categories.map(c=><tr key={c.category}><th scope="row">{categories.find(x=>x.id===c.category)?.label||c.category}</th><td>{number(c.remainingListings)} / {number(c.listings)}</td><td>{number(c.remainingFields)}</td></tr>)}</tbody></table></div></details>
 <p className="backfill-note">As of {new Date(progress.checkedAt).toLocaleDateString()}. Counts include retailer and pack variants. Reviewed gaps may need another source or have unpublished ratings. Research updates after verified imports; price checks run separately.</p>
 </section>;
}

