import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {scraperDashboard,scraperOwnerAction,scraperWorkerAction,scraperJobEvents} from '../lib/scraper-service.ts';
import {emptyProgress} from '../lib/scraper-config.ts';
import {retailers} from '../lib/retailers.ts';
function database(){
 const sql=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const db={prepare(query:string){let args:any[]=[];const stmt=sql.prepare(query);const wrapper={bind(...values:any[]){args=values;return wrapper;},async all(){return {results:stmt.all(...args)};},async first(){return stmt.get(...args)||null;},async run(){return {meta:{changes:Number(stmt.run(...args).changes)}};}};return wrapper;},async batch(statements:any[]){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};return {db:db as unknown as D1Database,sql};
}
test('local NAZ execution is isolated from hosted collection and retains snapshot targets',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:s.id==='naz'}});
 const hosted=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.equal(hosted.jobs?.length,0);
 const local=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID(),execution:'local',siteId:'naz'});assert.equal(local.jobs?.[0]?.site.id,'naz');assert.ok(local.jobs?.[0]?.knownUrls.some(u=>u.includes('cerbo-gx')));sql.close();
});
test('refresh cursor survives leased completion for catalogs larger than eighty URLs',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});
 const source={...initial.sites.find(s=>s.id==='current-connected'),enabled:true,schedule:'manual'};await scraperOwnerAction(db,{action:'save',id:source.id,site:source});
 for(let i=0;i<95;i++)sql.prepare('INSERT INTO offers(id,product_id,json,updated_at) VALUES(?,?,?,?)').run('offer-'+i,'p',JSON.stringify({id:'offer-'+i,retailerId:source.id,url:source.origin+'/target-'+i}),'2026-10-01T00:00:00Z');
 await scraperOwnerAction(db,{action:'queue',id:source.id});const first=(await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs![0];assert.ok(first.knownUrls.length>=95);
 await scraperWorkerAction(db,{action:'finish',id:first.id,lease:first.lease,status:'partial',progress:emptyProgress(),refreshNext:84});await scraperOwnerAction(db,{action:'queue',id:source.id});const next=(await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs![0];assert.equal(next.refreshOffset,84);sql.close();
});
test('feed continuation never overrides owner schedule changes made during a run',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});
 const source={...initial.sites.find(s=>s.id==='renogy'),enabled:true,schedule:'interval'};await scraperOwnerAction(db,{action:'save',id:source.id,site:source});const job=(await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs![0];
 await scraperOwnerAction(db,{action:'save',id:source.id,site:{...source,schedule:'manual'}});await scraperWorkerAction(db,{action:'finish',id:job.id,lease:job.lease,status:'succeeded',progress:{...emptyProgress(),found:250,inserted:250},discoveryNext:1});assert.equal((await scraperDashboard(db)).sites.find(s=>s.id===source.id)?.nextAt,null);assert.equal((await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs?.length,0);sql.close();
});
test('unfinished page refreshes schedule continuation, then return to the regular interval',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});const source={...initial.sites.find(s=>s.id==='current-connected'),enabled:true,schedule:'interval'};await scraperOwnerAction(db,{action:'save',id:source.id,site:source});
 const job=(await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs![0];await scraperWorkerAction(db,{action:'finish',id:job.id,lease:job.lease,status:'partial',progress:emptyProgress(),refreshNext:24,continuation:true});const nextAt=Date.parse((await scraperDashboard(db)).sites.find(s=>s.id===source.id)!.nextAt!);assert.ok(nextAt-Date.now()<=15*60000);
 sql.prepare('UPDATE scraper_sites SET next_at=? WHERE id=?').run('2020-01-01',source.id);const second=(await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()})).jobs![0];await scraperWorkerAction(db,{action:'finish',id:second.id,lease:second.lease,status:'succeeded',progress:emptyProgress(),refreshNext:0,continuation:false});assert.ok(Date.parse((await scraperDashboard(db)).sites.find(s=>s.id===source.id)!.nextAt!)-Date.now()>5*3600000);sql.close();
});
test('real SQLite queue deduplicates active runs, snapshots settings and honors pause/cancellation',async()=>{
 const {db,sql}=database();const first=await scraperDashboard(db);assert.equal(first.sites.length,retailers.length);
 assert.equal(first.sites.find(s=>s.id==='windynation')?.startPath,'/collections/solar-cable/products.json');
 assert.equal(first.sites.find(s=>s.id==='temco')?.adapter,'pages');
 for(const s of first.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});
 const source={...first.sites[0],enabled:true,schedule:'manual',delaySeconds:30};await scraperOwnerAction(db,{action:'save',id:source.id,site:source});
 await scraperOwnerAction(db,{action:'queue',id:source.id});await scraperOwnerAction(db,{action:'queue',id:source.id});assert.equal((await scraperDashboard(db)).jobs.length,1);
 await scraperOwnerAction(db,{action:'save',id:source.id,site:{...source,delaySeconds:60}});
 const {jobs}=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.ok(jobs);assert.equal(jobs.length,1);assert.equal(jobs[0].site.delaySeconds,30);
 const j=jobs[0];await scraperOwnerAction(db,{action:'cancel',id:j.id});const answer=await scraperWorkerAction(db,{action:'event',id:j.id,lease:j.lease,progress:emptyProgress()});assert.equal(answer.cancel,true);
 await scraperWorkerAction(db,{action:'finish',id:j.id,lease:j.lease,status:'succeeded',progress:emptyProgress()});assert.equal((await scraperDashboard(db)).jobs[0].status,'cancelled');
 await scraperOwnerAction(db,{action:'queue',id:source.id});await scraperOwnerAction(db,{action:'save',id:source.id,site:{...source,enabled:false}});assert.equal((await scraperDashboard(db)).jobs.filter(j=>j.status==='queued').length,0);sql.close();
});
test('expanded retailer seeds include verified feeds, pause review sources, and preserve owner settings',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);
 assert.equal(initial.sites.length,39);assert.equal(initial.sites.filter(s=>s.enabled).length,30);
 assert.equal(initial.sites.find(s=>s.id==='rich-solar')?.adapter,'shopify');assert.equal(initial.sites.find(s=>s.id==='rich-solar')?.frequencyMinutes,1440);
 assert.equal(initial.sites.find(s=>s.id==='anker-solix')?.enabled,false);assert.equal(initial.sites.find(s=>s.id==='anker-solix')?.nextAt,null);
 const owner=initial.sites.find(s=>s.id==='rich-solar')!;await scraperOwnerAction(db,{action:'save',id:owner.id,site:{...owner,delaySeconds:60,enabled:false}});
 const after=await scraperDashboard(db);assert.equal(after.sites.find(s=>s.id===owner.id)?.delaySeconds,60);assert.equal(after.sites.find(s=>s.id===owner.id)?.enabled,false);sql.close();
});
test('lost claim responses recover the same allocation; finish retries preserve history and discovery cursor',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);
 for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});
 for(const s of initial.sites.slice(0,2)){await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:true,schedule:'manual',adapter:'sitemap'}});await scraperOwnerAction(db,{action:'queue',id:s.id});}
 const claimId=crypto.randomUUID(),first=await scraperWorkerAction(db,{action:'claim',claimId}),retry=await scraperWorkerAction(db,{action:'claim',claimId});
 assert.deepEqual(retry.jobs,first.jobs);assert.equal(first.jobs?.length,1);assert.equal((await scraperDashboard(db)).jobs.filter(j=>j.status==='running').length,1);
 const second=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.notEqual(second.jobs?.[0].id,first.jobs?.[0].id);
 const j=first.jobs![0],finish={action:'finish',id:j.id,lease:j.lease,status:'succeeded',progress:emptyProgress(),discoveryNext:17};
 await scraperWorkerAction(db,finish);assert.deepEqual(await scraperWorkerAction(db,finish),{finished:true});
 assert.equal((sql.prepare('SELECT COUNT(*) AS n FROM collection_runs WHERE id=?').get(j.id) as any).n,1);
 await scraperOwnerAction(db,{action:'queue',id:j.siteId});const next=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.equal(next.jobs?.[0].discoveryOffset,17);
 assert.deepEqual((await scraperWorkerAction(db,{action:'claim',claimId})).jobs,[]);sql.close();
});
test('job leases reject other workers and decreasing counters; events replay idempotently and expired runs recover',async()=>{
 const {db,sql}=database();const initial=await scraperDashboard(db);for(const s of initial.sites)await scraperOwnerAction(db,{action:'save',id:s.id,site:{...s,enabled:false}});
 const source={...initial.sites[0],enabled:true,schedule:'interval'};await scraperOwnerAction(db,{action:'save',id:source.id,site:source});const {jobs}=await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.ok(jobs);const j=jobs[0];assert.ok(j);
 const progress={...emptyProgress(),requests:1};const event={id:crypto.randomUUID(),url:source.origin+'/robots.txt',status:'ok',durationMs:5,message:'Policy checked'};
 await assert.rejects(()=>scraperWorkerAction(db,{action:'event',id:j.id,lease:'wrong',progress}));
 await scraperWorkerAction(db,{action:'event',id:j.id,lease:j.lease,progress,event});await scraperWorkerAction(db,{action:'event',id:j.id,lease:j.lease,progress,event});assert.equal((await scraperJobEvents(db,j.id)).events.length,1);
 await assert.rejects(()=>scraperWorkerAction(db,{action:'event',id:j.id,lease:j.lease,progress:emptyProgress()}));
 await assert.rejects(()=>scraperWorkerAction(db,{action:'event',id:j.id,lease:j.lease,progress,event:{...event,id:crypto.randomUUID(),url:'https://other.com/'}}));
 sql.prepare("UPDATE scraper_jobs SET lease_until='2000-01-01T00:00:00Z' WHERE id=?").run(j.id);await scraperWorkerAction(db,{action:'claim',claimId:crypto.randomUUID()});assert.equal((await scraperDashboard(db)).jobs.find(r=>r.id===j.id)?.status,'failed');
 await assert.rejects(()=>scraperWorkerAction(db,{action:'finish',id:j.id,lease:j.lease,status:'succeeded',progress}));sql.close();
});
