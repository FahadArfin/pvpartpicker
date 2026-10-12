import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import type {Build,Product} from '../lib/types.ts';
import {saveBuildAlert,listBuildAlerts,disableBuildAlert,processBuildAlerts} from '../lib/build-alerts.ts';
const now=Date.parse('2026-10-11T12:00:00Z');
const build:Build={name:'Private cabin',lines:[{productId:'panel',quantity:5,offerId:'pack'}],settings:{purpose:'offgrid',mount:'ground'}};
const products=[{id:'panel',name:'Panel',offers:[{id:'pack',retailerId:'shop',retailer:'Shop',price:100,packQuantity:4,condition:'new',currency:'USD',stock:'in_stock',observedAt:new Date(now).toISOString()}]}] as Product[];
function fixture(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE job_state(id TEXT PRIMARY KEY,value TEXT);CREATE TABLE builds(id TEXT PRIMARY KEY,user_id TEXT,json TEXT,updated_at TEXT);CREATE TABLE notifications(id TEXT PRIMARY KEY,user_id TEXT,alert_id TEXT,product_id TEXT,title TEXT,body TEXT,email_status TEXT,attempts INTEGER,read INTEGER,created_at TEXT);');sql.exec(readFileSync(new URL('../drizzle/0007_build_alerts.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));sql.exec(readFileSync(new URL('../drizzle/0008_spooky_cassandra_nova.sql',import.meta.url),'utf8'));sql.prepare('INSERT INTO builds VALUES (?,?,?,?)').run('mine','owner',JSON.stringify(build),'today');
const db={prepare(query:string){let args:any[]=[];const s={bind(...v:any[]){args=v;return s},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},run(){const r=sql.prepare(query).run(...args);return Promise.resolve({meta:{changes:Number(r.changes)}})}};return s},async batch(statements:any[]){sql.exec('BEGIN');try{const r=[];for(const s of statements)r.push(s.run());sql.exec('COMMIT');return Promise.all(r)}catch(e){sql.exec('ROLLBACK');throw e}}} as unknown as D1Database;return {sql,db};}
test('build targets require ownership and consent and expose no private settings',async()=>{const {db,sql}=fixture();await assert.rejects(saveBuildAlert(db,{userId:'intruder',email:'x'},'mine',{target:200,emailEnabled:false}),/not found/i);await assert.rejects(saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:0,emailEnabled:false}),/target/i);const a=await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:200,emailEnabled:false});assert.equal(await disableBuildAlert(db,'intruder',a.id),false);const listed=await listBuildAlerts(db,'owner');assert.equal(listed.length,1);assert.ok(!JSON.stringify(listed).includes('settings'));assert.equal((sql.prepare('SELECT email_enabled FROM build_alerts').get() as any).email_enabled,0);sql.close()});
test('complete pack-aware crossing sends once, rearms above target and ignores stale coverage',async()=>{const {db,sql}=fixture();await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false});assert.equal((await processBuildAlerts(db,products,now)).generated,1);assert.equal((await processBuildAlerts(db,products,now)).generated,0);const high=structuredClone(products);high[0].offers[0].price=120;await processBuildAlerts(db,high,now);assert.equal((await processBuildAlerts(db,products,now+86400001)).generated,0);assert.equal((await processBuildAlerts(db,products,now)).generated,1);assert.equal((sql.prepare('SELECT COUNT(*) AS n FROM notifications').get() as any).n,2);sql.close()});
test('concurrent processors deduplicate, edits reset evaluation and deletion disables alerts',async()=>{const {db,sql}=fixture();await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false});await Promise.all([processBuildAlerts(db,products,now),processBuildAlerts(db,products,now)]);assert.equal((sql.prepare('SELECT COUNT(*) AS n FROM notifications').get() as any).n,1);sql.prepare('UPDATE builds SET json=?').run(JSON.stringify({...build,lines:[{productId:'panel',quantity:9,offerId:'pack'}]}));await processBuildAlerts(db,products,now);assert.equal((sql.prepare('SELECT last_price FROM build_alerts').get() as any).last_price,300);sql.prepare('UPDATE builds SET json=?').run(JSON.stringify({...build,lines:[{productId:'missing',quantity:1}]}));assert.equal((await processBuildAlerts(db,products,now)).generated,0);sql.exec('DELETE FROM builds');await processBuildAlerts(db,products,now);assert.equal((sql.prepare('SELECT active FROM build_alerts').get() as any).active,0);sql.close()});


test('missing selected offers and unknown stock never trigger, package and condition remain selected',async()=>{
 const {db,sql}=fixture();await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:true});
 const absent=structuredClone(products);absent[0].offers=[{...absent[0].offers[0],id:'other',price:1,packQuantity:1,condition:'used'}];assert.equal((await processBuildAlerts(db,absent,now)).generated,0);
 const unknown=structuredClone(products);unknown[0].offers[0].stock='unknown';assert.equal((await processBuildAlerts(db,unknown,now)).generated,0);
 const variants=structuredClone(products);variants[0].offers.push({...variants[0].offers[0],id:'cheap',price:1,condition:'used'},{...variants[0].offers[0],id:'single',price:1,packQuantity:1});assert.equal((await processBuildAlerts(db,variants,now)).generated,1);
 const n=sql.prepare('SELECT * FROM notifications').get() as any;assert.ok(n.body.includes('$200.00'));assert.equal(n.email_status,'pending');assert.equal(n.product_id,'');assert.equal(n.build_id,'mine');
 sql.close();
});
test('private analytics and build names never enter alert signatures or payloads; editing target resets crossing',async()=>{
 const {db,sql}=fixture();const privateBuild={...build,name:'Private address in name',settings:{...build.settings,analytics:{location:{label:'Secret location',latitude:42,longitude:-78}}}};
 // Legacy private fields are validated at evaluation; valid private settings remain confined to the saved build.
 const {analyticsDefaults}=await import('../lib/build-analytics.ts');privateBuild.settings.analytics={...analyticsDefaults,location:{label:'Secret location',latitude:42,longitude:-78}};
 sql.prepare('UPDATE builds SET json=?').run(JSON.stringify(privateBuild));await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false});await processBuildAlerts(db,products,now);
 const payload=JSON.stringify(sql.prepare('SELECT title,body,build_signature FROM notifications').get());assert.ok(!payload.includes('Secret'));assert.ok(!payload.includes('Private address'));assert.ok(!payload.includes('latitude'));
 await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:190,emailEnabled:false});assert.equal((await processBuildAlerts(db,products,now)).generated,0);await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false});assert.equal((await processBuildAlerts(db,products,now)).generated,1);sql.close();
});
test('100 active build alert cap is atomic and existing active targets can still update',async()=>{
 const {db,sql}=fixture();const insert=sql.prepare('INSERT INTO build_alerts(id,user_id,build_id,email,target,email_enabled,active,token,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<100;i++)insert.run('a'+i,'owner','b'+i,'x',100,0,1,'t'+i,'now');
 await assert.rejects(saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:200,emailEnabled:false}),/maximum/i);
 sql.prepare('UPDATE build_alerts SET build_id=? WHERE id=?').run('mine','a0');assert.equal((await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false})).id,'a0');
 assert.equal((sql.prepare('SELECT COUNT(*) AS n FROM build_alerts WHERE active=1').get() as any).n,100);sql.close();
});
test('queued email checks latest owner, consent, saved equipment and fresh complete target; disabling and re-enabling cancels old mail',async()=>{
 const {queuedBuildAlertEligible}=await import('../lib/build-alerts.ts');const {db,sql}=fixture();const a=await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:true});await processBuildAlerts(db,products,now);const n=sql.prepare('SELECT * FROM notifications').get() as any;assert.equal(await queuedBuildAlertEligible(db,n,products,now),true);assert.equal(await queuedBuildAlertEligible(db,n,products,now+86400001),false);
 const high=structuredClone(products);high[0].offers[0].price=120;assert.equal(await queuedBuildAlertEligible(db,n,high,now),false);
 sql.prepare('UPDATE builds SET json=?').run(JSON.stringify({...build,lines:[{productId:'panel',quantity:9,offerId:'pack'}]}));assert.equal(await queuedBuildAlertEligible(db,n,products,now),false);sql.prepare('UPDATE builds SET json=?').run(JSON.stringify(build));
 await disableBuildAlert(db,'owner',a.id);assert.equal(await queuedBuildAlertEligible(db,n,products,now),false);assert.equal((sql.prepare('SELECT email_status FROM notifications').get() as any).email_status,'disabled');await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:true});await processBuildAlerts(db,products,now);assert.equal((sql.prepare("SELECT COUNT(*) AS n FROM notifications WHERE email_status='pending'").get() as any).n,1);
 sql.prepare('UPDATE builds SET user_id=?').run('intruder');assert.equal(await queuedBuildAlertEligible(db,n,products,now),false);sql.close();
});

test('losing simultaneous lower-price evaluation cannot emit a false crossing',async()=>{
 const {db,sql}=fixture();await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:false});
 const initial=structuredClone(products);initial[0].offers[0].price=150;await processBuildAlerts(db,initial,now);
 const high=structuredClone(products);high[0].offers[0].price=120;let raced=false;
 const racing={...db,async batch(statements:any[]){if(!raced){raced=true;await processBuildAlerts(db,high,now);}return db.batch(statements);}} as D1Database;
 const r=await processBuildAlerts(racing,products,now);assert.equal(r.generated,0);assert.equal((sql.prepare('SELECT COUNT(*) AS n FROM notifications').get() as any).n,0);assert.equal((sql.prepare('SELECT last_price AS p FROM build_alerts').get() as any).p,240);sql.close();
});
test('disabled cached email cannot revive after the identical build alert is re-enabled',async()=>{
 const {queuedBuildAlertEligible}=await import('../lib/build-alerts.ts');const {db,sql}=fixture();
 await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:true});await processBuildAlerts(db,products,now);const old=sql.prepare('SELECT * FROM notifications').get() as any;
 await disableBuildAlert(db,'owner',old.alert_id);await saveBuildAlert(db,{userId:'owner',email:'x'},'mine',{target:210,emailEnabled:true});await processBuildAlerts(db,products,now);
 assert.equal((sql.prepare('SELECT email_status FROM notifications WHERE id=?').get(old.id) as any).email_status,'disabled');assert.equal(await queuedBuildAlertEligible(db,old,products,now),false);
 const current=sql.prepare("SELECT * FROM notifications WHERE email_status='pending'").get() as any;assert.ok(current);assert.equal(await queuedBuildAlertEligible(db,current,products,now),true);sql.close();
});

test('cached sender status writes cannot downgrade terminal delivery records',async()=>{
 const {recordEmailStatus}=await import('../lib/build-alerts.ts');const {db,sql}=fixture();sql.prepare('INSERT INTO notifications(id,email_status,attempts) VALUES(?,?,?)').run('sent','sent',1);await recordEmailStatus(db,'sent','disabled');assert.deepEqual(sql.prepare('SELECT email_status,attempts FROM notifications WHERE id=?').get('sent'),Object.assign(Object.create(null),{email_status:'sent',attempts:1}));
 sql.prepare('INSERT INTO notifications(id,email_status,attempts) VALUES(?,?,?)').run('pending','pending',0);await recordEmailStatus(db,'pending','sent');await recordEmailStatus(db,'pending','disabled');assert.equal((sql.prepare('SELECT email_status FROM notifications WHERE id=?').get('pending') as any).email_status,'sent');sql.close();
});
