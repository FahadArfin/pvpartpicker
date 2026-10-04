import { database, runtime, getCatalog } from './storage';
import {sendQueuedEmails} from './overrides';
import { bestOffer, costForQuantity, money, alertCrossed } from './domain';
export async function processAlerts() {
  const db = database(), configuration = runtime(), catalog = await getCatalog();
  const cursor=(await db.prepare("SELECT value FROM job_state WHERE id='alerts-cursor'").first<{value:string}>())?.value || '';
  let rows = await db.prepare('SELECT * FROM alerts WHERE active = 1 AND id > ? ORDER BY id LIMIT 500').bind(cursor).all<any>(); if(!rows.results.length && cursor) rows=await db.prepare('SELECT * FROM alerts WHERE active = 1 ORDER BY id LIMIT 500').all<any>(); let generated = 0;
  for (const a of rows.results) {
    const product = catalog.products.find(p => p.id === a.product_id); if (!product) continue; const offer = bestOffer(product, a.quantity); if (!offer) continue;
    const price = costForQuantity(offer, a.quantity).subtotal;
    if (alertCrossed(a.last_price, price, a.target, true)) {
      const id = `${a.id}-${offer.observedAt}`; const title = `${product.name} reached your target`; const body = `${money(price)} for ${a.quantity} requested units at ${offer.retailer}. Shipping and tax may apply.`;
      await db.batch([db.prepare('INSERT OR IGNORE INTO notifications (id,user_id,alert_id,product_id,title,body,email_status,attempts,read,created_at) VALUES (?,?,?,?,?,?,?,0,0,?)').bind(id,a.user_id,a.id,a.product_id,title,body,a.email_enabled ? 'pending' : 'disabled',new Date().toISOString()), db.prepare('UPDATE alerts SET last_price = ? WHERE id = ?').bind(price,a.id)]); generated++;
    } else await db.prepare('UPDATE alerts SET last_price = ? WHERE id = ?').bind(price,a.id).run();
  }
  await db.prepare("INSERT INTO job_state (id,value) VALUES ('alerts-cursor',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(rows.results.length===500?rows.results.at(-1).id:'').run();
  let delivered = 0;
  if (configuration.RESEND_API_KEY && configuration.EMAIL_FROM && configuration.SITE_ORIGIN) {
    const queue = await db.prepare("SELECT n.*, a.email, a.token FROM notifications n JOIN alerts a ON a.id=n.alert_id WHERE n.email_status='pending' AND n.attempts < 3 AND a.active=1 ORDER BY n.created_at LIMIT 25").all<any>();
    delivered=await sendQueuedEmails(queue.results,configuration as {RESEND_API_KEY:string;EMAIL_FROM:string;SITE_ORIGIN:string},async(id,status)=>db.prepare('UPDATE notifications SET email_status=?, attempts=attempts+1 WHERE id=?').bind(status,id).run());
  }
  return { evaluated: rows.results.length, generated, delivered, emailConfigured: Boolean(configuration.RESEND_API_KEY && configuration.EMAIL_FROM && configuration.SITE_ORIGIN) };
}
