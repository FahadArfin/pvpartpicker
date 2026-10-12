import {validateBuild,money} from './domain.ts';
import {buildEquipmentTarget} from './build-purchase.ts';
import type {Build,Product} from './types.ts';
export function buildAlertSignature(build:Pick<Build,'lines'>,target:number){return JSON.stringify([target,build.lines.map(l=>[l.productId,l.quantity,l.offerId||null]).sort((x,y)=>String(x[0]).localeCompare(String(y[0])))]);}
export interface SavedBuildAlert {id:string;buildId:string;buildName:string;target:number;emailEnabled:boolean;active:boolean;lastPrice:number|null;}
export async function listBuildAlerts(db:D1Database,userId:string):Promise<SavedBuildAlert[]> {
 const rows=await db.prepare('SELECT a.id,a.build_id AS buildId,a.target,a.email_enabled AS emailEnabled,a.active,a.last_price AS lastPrice,b.json FROM build_alerts a JOIN builds b ON b.id=a.build_id AND b.user_id=a.user_id WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 100').bind(userId).all<any>();
 return rows.results.map(({json,...a})=>({...a,buildName:validateBuild(JSON.parse(json)).name,emailEnabled:Boolean(a.emailEnabled),active:Boolean(a.active)}));
}
export async function saveBuildAlert(db:D1Database,user:{userId:string;email:string},buildId:string,data:{target:number;emailEnabled:boolean}){
 if(!Number.isFinite(data.target)||data.target<0.01||data.target>1000000||typeof data.emailEnabled!=='boolean')throw new Error('Enter a target between $0.01 and $1,000,000 and choose email delivery.');
 if(typeof buildId!=='string'||buildId.length>100)throw new Error('Build not found.');
 const own=await db.prepare('SELECT json FROM builds WHERE id=? AND user_id=?').bind(buildId,user.userId).first<{json:string}>();if(!own)throw new Error('Build not found.');
 if(!validateBuild(JSON.parse(own.json)).lines.length)throw new Error('Save at least one part before creating a build alert.');
 const id=crypto.randomUUID();
 const write=db.prepare(`INSERT INTO build_alerts (id,user_id,build_id,email,target,email_enabled,active,token,created_at)
 SELECT ?,?,?,?,?,?,1,?,? WHERE EXISTS(SELECT 1 FROM builds WHERE id=? AND user_id=?)
 AND ((SELECT COUNT(*) FROM build_alerts WHERE user_id=? AND active=1)<100 OR EXISTS(SELECT 1 FROM build_alerts WHERE user_id=? AND build_id=? AND active=1))
 ON CONFLICT(user_id,build_id) DO UPDATE SET target=excluded.target,email=excluded.email,email_enabled=excluded.email_enabled,active=1,last_price=NULL,build_signature=NULL,revision=build_alerts.revision+1`).bind(id,user.userId,buildId,user.email,data.target,Number(data.emailEnabled),crypto.randomUUID(),new Date().toISOString(),buildId,user.userId,user.userId,user.userId,buildId);
 await db.batch([write,db.prepare("UPDATE notifications SET email_status='disabled' WHERE email_status='pending' AND user_id=? AND alert_id IN(SELECT id FROM build_alerts WHERE user_id=? AND build_id=?)").bind(user.userId,user.userId,buildId)]);
 const saved=await db.prepare('SELECT id FROM build_alerts WHERE user_id=? AND build_id=? AND active=1').bind(user.userId,buildId).first<{id:string}>();if(!saved)throw new Error('Maximum 100 active build alerts, or the build was removed.');return saved;
}
export async function disableBuildAlert(db:D1Database,userId:string,id:string){const r=await db.batch([db.prepare('UPDATE build_alerts SET active=0,email_enabled=0,revision=revision+1 WHERE id=? AND user_id=?').bind(id,userId),db.prepare("UPDATE notifications SET email_status='disabled' WHERE alert_id=? AND user_id=? AND email_status='pending'").bind(id,userId)]);return Boolean(r[0].meta.changes);}
export async function processBuildAlerts(db:D1Database,products:Product[],now=Date.now()){
 // A rotating bounded cursor keeps large accounts from monopolising a scheduled pass.
 const cursor=(await db.prepare("SELECT value FROM job_state WHERE id='build-alerts-cursor'").first<{value:string}>())?.value||'';
 let rows=await db.prepare('SELECT a.*,b.json FROM build_alerts a LEFT JOIN builds b ON b.id=a.build_id AND b.user_id=a.user_id WHERE a.active=1 AND a.id>? ORDER BY a.id LIMIT 500').bind(cursor).all<any>();
 if(!rows.results.length&&cursor)rows=await db.prepare('SELECT a.*,b.json FROM build_alerts a LEFT JOIN builds b ON b.id=a.build_id AND b.user_id=a.user_id WHERE a.active=1 ORDER BY a.id LIMIT 500').all<any>();
 let generated=0;
 for(const a of rows.results){
  if(!a.json){await disableBuildAlert(db,a.user_id,a.id);continue;}
  let build;try{build=validateBuild(JSON.parse(a.json));}catch{continue;}
  // Only equipment identity affects crossings. Names, private location and analytics never enter this signature or notification.
  const signature=buildAlertSignature(build,a.target);
  const result=buildEquipmentTarget(build,products,now),edited=signature!==a.build_signature,evaluationId=crypto.randomUUID();
  const cancelSuperseded=db.prepare("UPDATE notifications SET email_status='disabled' WHERE alert_id=? AND email_status='pending' AND EXISTS(SELECT 1 FROM build_alerts WHERE id=? AND revision=? AND build_signature=? AND evaluation_token=?)").bind(a.id,a.id,a.revision+1,signature,evaluationId);
  if(!result.complete||result.subtotal===null){if(edited)await db.batch([db.prepare('UPDATE build_alerts SET build_signature=?,last_price=NULL,evaluation_token=?,revision=revision+1 WHERE id=? AND revision=? AND active=1 AND EXISTS(SELECT 1 FROM builds WHERE id=build_alerts.build_id AND user_id=build_alerts.user_id AND json=?)').bind(signature,evaluationId,a.id,a.revision,a.json),cancelSuperseded]);continue;}
  const crossed=result.subtotal<=a.target&&(edited||a.last_price===null||a.last_price>a.target);
  const next=a.revision+1,id=`build-${a.id}-${next}`,stamp=new Date(now).toISOString();
  const update=db.prepare('UPDATE build_alerts SET build_signature=?,last_price=?,evaluation_token=?,revision=revision+1 WHERE id=? AND revision=? AND active=1 AND EXISTS(SELECT 1 FROM builds WHERE id=build_alerts.build_id AND user_id=build_alerts.user_id AND json=?)').bind(signature,result.subtotal,evaluationId,a.id,a.revision,a.json);
  const statements=[update];if(edited)statements.push(cancelSuperseded);
  if(crossed)statements.push(db.prepare(`INSERT OR IGNORE INTO notifications (id,user_id,alert_id,product_id,build_id,build_signature,title,body,email_status,attempts,read,created_at)
 SELECT ?,user_id,id,'',build_id,build_signature,?,?,CASE WHEN email_enabled=1 THEN 'pending' ELSE 'disabled' END,0,0,? FROM build_alerts WHERE id=? AND revision=? AND evaluation_token=? AND active=1 AND EXISTS(SELECT 1 FROM builds WHERE id=build_alerts.build_id AND user_id=build_alerts.user_id AND json=?)`).bind(id,'Saved build reached your equipment target',`${money(result.subtotal)} equipment subtotal for your saved build's current parts and quantities, at or below ${money(a.target)}. Shipping and tax are excluded. Only complete fresh in-stock USD coverage qualifies.`,stamp,a.id,next,evaluationId,a.json));
  const written=await db.batch(statements);if(crossed)generated+=written.at(-1)!.meta.changes||0;
 }
 await db.prepare("INSERT INTO job_state(id,value) VALUES('build-alerts-cursor',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(rows.results.length===500?rows.results.at(-1).id:'').run();
 return {evaluated:rows.results.length,generated};
}
export async function queuedBuildAlertEligible(db:D1Database,n:{id:string;alert_id:string;build_signature:string},products:Product[],now=Date.now()){
 const current=await db.prepare("SELECT a.target,b.json FROM build_alerts a JOIN builds b ON b.id=a.build_id AND b.user_id=a.user_id JOIN notifications n ON n.alert_id=a.id AND n.user_id=a.user_id AND n.build_id=a.build_id WHERE n.id=? AND n.email_status='pending' AND n.attempts<3 AND a.id=? AND a.active=1 AND a.email_enabled=1 AND a.build_signature=? AND n.build_signature=a.build_signature").bind(n.id,n.alert_id,n.build_signature).first<{target:number;json:string}>();
 if(!current)return false;
 try{const build=validateBuild(JSON.parse(current.json));if(buildAlertSignature(build,current.target)!==n.build_signature)return false;const price=buildEquipmentTarget(build,products,now);return price.complete&&price.subtotal!==null&&price.subtotal<=current.target;}catch{return false;}
}

export async function recordEmailStatus(db:D1Database,id:string,status:string){
 if(!['pending','sent','failed','disabled'].includes(status))throw new Error('Invalid email status.');
 return db.prepare("UPDATE notifications SET email_status=?,attempts=attempts+1 WHERE id=? AND email_status='pending'").bind(status,id).run();
}
