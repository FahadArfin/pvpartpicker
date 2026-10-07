import {publicBuildCopy} from './build-analytics.ts';
import type {Build} from './types.ts';
export interface CommunityBuild {shareId:string;build:Build;description:string;publishedAt:string;}
interface Row {shareId:string;json:string;description:string;publishedAt:string;}
const columns='share_id AS shareId,json,description,published_at AS publishedAt';
function publicBuild(row:Row):CommunityBuild{return {shareId:row.shareId,build:publicBuildCopy(JSON.parse(row.json)),description:row.description,publishedAt:row.publishedAt};}
export async function listCommunityBuilds(db:D1Database):Promise<CommunityBuild[]>{
 const rows=await db.prepare(`SELECT ${columns} FROM community_builds ORDER BY published_at DESC,share_id LIMIT 100`).all<Row>();
 return rows.results.map(publicBuild);
}
export async function getCommunityBuild(db:D1Database,shareId:string):Promise<CommunityBuild|null>{
 const row=await db.prepare(`SELECT ${columns} FROM community_builds WHERE share_id=?`).bind(shareId).first<Row>();return row?publicBuild(row):null;
}
export async function publishCommunityBuild(db:D1Database,userId:string,buildId:string,description:unknown):Promise<{shareId:string}>{
 if(typeof description!=='string'||description.length>500)throw new Error('Describe your build in 500 characters or fewer.');
 const row=await db.prepare('SELECT json FROM builds WHERE id=? AND user_id=?').bind(buildId,userId).first<{json:string}>();
 if(!row)throw new Error('Build not found.');
 const build=publicBuildCopy(JSON.parse(row.json));if(!build.lines.length)throw new Error('Add at least one part before publishing a community build.');
 const result=await db.prepare('INSERT INTO community_builds (build_id,share_id,json,description,published_at) SELECT id,?,?,?,? FROM builds WHERE id=? AND user_id=? ON CONFLICT(build_id) DO UPDATE SET json=excluded.json,description=excluded.description,published_at=excluded.published_at').bind(crypto.randomUUID(),JSON.stringify(build),description.trim(),new Date().toISOString(),buildId,userId).run();
 if(!result.meta.changes)throw new Error('Build not found.');
 const published=await db.prepare('SELECT share_id AS shareId FROM community_builds WHERE build_id=?').bind(buildId).first<{shareId:string}>();
 if(!published)throw new Error('Could not publish your build. Please try again.');return published;
}
export async function unpublishCommunityBuild(db:D1Database,userId:string,buildId:string):Promise<boolean>{
 const result=await db.prepare('DELETE FROM community_builds WHERE build_id=? AND EXISTS (SELECT 1 FROM builds WHERE id=build_id AND user_id=?)').bind(buildId,userId).run();return Boolean(result.meta.changes);
}
