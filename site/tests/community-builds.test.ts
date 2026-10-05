import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import type {Build} from '../lib/types.ts';
const build:Build={name:'Weekend cabin',lines:[{productId:'panel',quantity:4,offerId:'seller'}],settings:{purpose:'offgrid',mount:'ground'}};
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE builds(id TEXT PRIMARY KEY,user_id TEXT,json TEXT,share_id TEXT,updated_at TEXT); CREATE TABLE community_builds(build_id TEXT PRIMARY KEY REFERENCES builds(id) ON DELETE CASCADE,share_id TEXT NOT NULL UNIQUE,json TEXT NOT NULL,description TEXT NOT NULL,published_at TEXT NOT NULL); PRAGMA foreign_keys=ON;');
 sql.prepare('INSERT INTO builds VALUES (?,?,?,?,?)').run('mine','owner',JSON.stringify({...build,id:'mine',email:'private@example.test'}),'unlisted-link','2026-10-04');
 sql.prepare('INSERT INTO builds VALUES (?,?,?,?,?)').run('other','someone-else',JSON.stringify(build),null,'2026-10-04');
 const db={prepare(query:string){let args:any[]=[];const statement={bind(...values:any[]){args=values;return statement;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}};}};return statement;}} as unknown as D1Database;
 return {sql,db};
}
test('community discovery requires explicit publication, excludes private identity, and copies a fixed snapshot',async()=>{
 const {listCommunityBuilds,publishCommunityBuild,getCommunityBuild}=await import('../lib/community-builds.ts');const {db,sql}=fixture();
 assert.deepEqual(await listCommunityBuilds(db),[]);
 const published=await publishCommunityBuild(db,'owner','mine','Small cabin equipment list.');
 const listed=await listCommunityBuilds(db);assert.equal(listed.length,1);assert.equal(listed[0].shareId,published.shareId);
 assert.equal(listed[0].build.name,'Weekend cabin');assert.equal(listed[0].build.id,undefined);
 assert.ok(!JSON.stringify(listed).includes('private@example'));assert.ok(!JSON.stringify(listed).includes('unlisted-link'));assert.ok(!JSON.stringify(listed).includes('owner'));
 sql.prepare('UPDATE builds SET json=? WHERE id=?').run(JSON.stringify({...build,name:'Private unfinished changes'}),'mine');
 assert.equal((await getCommunityBuild(db,published.shareId))?.build.name,'Weekend cabin');
 assert.equal((await publishCommunityBuild(db,'owner','mine','Updated list.')).shareId,published.shareId);
 assert.equal((await getCommunityBuild(db,published.shareId))?.build.name,'Private unfinished changes');
 sql.close();
});
test('only an owner can publish or withdraw, and withdrawn links stop being accessible',async()=>{
 const {publishCommunityBuild,unpublishCommunityBuild,getCommunityBuild}=await import('../lib/community-builds.ts');const {db,sql}=fixture();
 await assert.rejects(publishCommunityBuild(db,'owner','other',''),/not found/i);
 const published=await publishCommunityBuild(db,'owner','mine','');
 assert.equal(await unpublishCommunityBuild(db,'someone-else','mine'),false);assert.ok(await getCommunityBuild(db,published.shareId));
 assert.equal(await unpublishCommunityBuild(db,'owner','mine'),true);assert.equal(await getCommunityBuild(db,published.shareId),null);
 await assert.rejects(publishCommunityBuild(db,'owner','mine','x'.repeat(501)),/500/);
 sql.prepare('UPDATE builds SET json=? WHERE id=?').run(JSON.stringify({...build,lines:[]}),'mine');
 await assert.rejects(publishCommunityBuild(db,'owner','mine',''),/part/i);sql.close();
});
