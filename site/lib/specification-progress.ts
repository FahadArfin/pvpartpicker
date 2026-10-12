interface ResearchRow {productId:string;category:string;missing:string[];status:string;sourceUrl:string;}
interface Failure {url:string;status?:number;reason?:string;error?:string;}
export function researchProgress(report:{checkedAt:string;rows:ResearchRow[]},failures:Failure[]){
 const page=(url:string)=>{try{const u=new URL(url);u.search='';u.hash='';return u.href;}catch{return url;}};
 const refused=new Set(failures.filter(f=>[401,403,404,410,429].includes(f.status??0)||/http_(401|403|404|410|429)|challenge|refus|blocked|robots/i.test((f.reason??'')+' '+(f.error??''))).map(f=>page(f.url)));
 const seen=new Set<string>(),categories=new Map<string,{category:string;listings:number;remainingListings:number;remainingFields:number}>();
 let remainingListings=0,remainingFields=0,reviewedGaps=0,blockedListings=0,awaitingReview=0;
 for(const row of report.rows){if(seen.has(row.productId))throw Error('Duplicate research listing '+row.productId);seen.add(row.productId);
 const c=categories.get(row.category)??{category:row.category,listings:0,remainingListings:0,remainingFields:0};categories.set(row.category,c);c.listings++;
 const missing=new Set(row.missing).size;if(!missing)continue;c.remainingListings++;c.remainingFields+=missing;remainingListings++;remainingFields+=missing;
 if(row.status==='reviewed-imported')reviewedGaps++;else if(refused.has(page(row.sourceUrl)))blockedListings++;else awaitingReview++;
 }
 return {checkedAt:report.checkedAt,catalogListings:report.rows.length,completeListings:report.rows.length-remainingListings,remainingListings,remainingFields,reviewedGaps,blockedListings,awaitingReview,categories:[...categories.values()].sort((a,b)=>b.remainingFields-a.remainingFields)};
}
export type SpecificationProgress=ReturnType<typeof researchProgress>;

