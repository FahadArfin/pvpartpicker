export interface ReadingPosition{section:string;offset:number;updatedAt:number;}
export const guideReadingKey='pvpartpicker-guide-reading';
export function readGuidePosition(stored:string|null,slug:string):ReadingPosition|undefined{
 try{const p=JSON.parse(stored||'{}')[slug];return p&&typeof p.section==='string'&&p.section.length<100&&Number.isFinite(p.offset)&&Math.abs(p.offset)<10000&&Number.isFinite(p.updatedAt)?p:undefined;}catch{return;}
}
export function saveGuidePosition(stored:string|null,slug:string,position:ReadingPosition):string{
 let data:Record<string,ReadingPosition>={};try{const parsed=JSON.parse(stored||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))data=parsed;}catch{}
 data[slug]=position;return JSON.stringify(Object.fromEntries(Object.entries(data).sort((a,b)=>(b[1]?.updatedAt||0)-(a[1]?.updatedAt||0)).slice(0,60)));
}
