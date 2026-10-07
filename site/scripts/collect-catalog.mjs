import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { retailers, parseProductPage, mergeProducts, robotsAllows, classify, categorizeProduct } from '../lib/retailers.ts';
import {categories} from '../lib/types.ts';
const directory = new URL('../data/', import.meta.url); await mkdir(directory, { recursive: true });
const observedAt = new Date().toISOString(); const maxPages = Math.min(80, Number(process.env.COLLECT_MAX_PAGES || 24));
const progressFile = new URL('collection-progress.json', directory); let progress = {}; try { progress = JSON.parse(await readFile(progressFile, 'utf8')); } catch {}
const runId=process.env.COLLECT_RUN_ID || observedAt;
if (progress.runId !== runId) progress = { runId, observedAt, completed: {} };
let all = []; let reports = [];
const serialize = html => load(html)('body').text().replace(/\s+/g, ' ').trim();
const locs = text => [...text.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'));
async function source(retailer) {
  if(process.env.COLLECT_RUN_ID && progress.completed[retailer.id]){all.push(...progress.completed[retailer.id]);reports.push({retailerId:retailer.id,retailer:retailer.name,status:'ok',products:progress.completed[retailer.id].length,checkedAt:progress.observedAt,message:'Resumed completed retailer from this collection run.'});return;}
  let lastRequest = 0, robots = ''; const products = []; let checked = 0;
  const request = async (url, policy = false) => {
    const parsed = new URL(url); if (parsed.origin !== retailer.origin) throw new Error('Cross-origin source rejected');
    if (!policy && !robotsAllows(robots, parsed.pathname + parsed.search)) throw new Error('robots_disallowed');
    await new Promise(r => setTimeout(r, Math.max(0, 10000 - (Date.now() - lastRequest)))); lastRequest = Date.now();
    const response = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)', Accept: 'application/json,text/html,application/xml' }, signal: AbortSignal.timeout(25000) });
    if (response.status >= 300 && response.status < 400) { const dest = new URL(response.headers.get('location'), url); if (dest.origin !== retailer.origin) throw new Error('Cross-origin redirect rejected'); return request(dest.href); }
    if ([401, 403, 429].includes(response.status)) throw new Error('source_rejected_' + response.status);
    if (policy && response.status === 404) return '';
    if (!response.ok) throw new Error('http_' + response.status);
    const text = await response.text(); if (text.length > 6000000) throw new Error('Response exceeds 6MB limit');
    if (/verify you are human|cf-chl-|captcha-container/i.test(text)) throw new Error('bot_challenge_no_bypass'); return text;
  };
  const collect = (html, url) => { products.push(...parseProductPage(html, retailer, url, observedAt)); checked++; };
  const synthetic = (name, description, image, sku, price, stock, url, brand, referencePrice) => collect('<script type="application/ld+json">' + JSON.stringify({ '@type': 'Product', name, description, image, sku, brand, offers: { '@type': 'Offer', price, referencePrice, priceCurrency: 'USD', availability: 'https://schema.org/' + (stock ? 'InStock' : 'OutOfStock'), url } }).replace(/<\//g, '<\\/') + '</script>', url);
  try {
    robots = await request(retailer.origin + '/robots.txt', true);
    if (!robotsAllows(robots, '/')) throw new Error('robots_disallows_site');
    const delays = [...robots.matchAll(/crawl-delay:\s*(\d+)/gi)].map(m => Number(m[1])); if (delays.some(d => d > 10)) { reports.push({ retailerId: retailer.id, retailer: retailer.name, status: 'policy_review', products: 0, checkedAt: observedAt, message: 'Requires slower adapter for published crawl delay.' }); return; }
    if (retailer.adapter==='shopify'||['renogy', 'emporia', 'shopsolar'].includes(retailer.id)) {
      for (let page = 1; page <= (retailer.id === 'renogy' ? 2 : 1); page++) {
        const feedUrl = `${retailer.origin}${retailer.startPath||'/products.json'}?limit=250&page=${page}`;
        const data = JSON.parse(await request(feedUrl));
        for (const p of data.products || []) for (const v of p.variants || []) {
          const name = serialize(p.title) + (v.title && v.title !== 'Default Title' ? ' — ' + v.title : ''); if (!classify(name)) continue;
          const url = `${retailer.origin}/products/${p.handle}?variant=${v.id}`;
          synthetic(name, p.body_html || '', p.images?.[0]?.src || '', String(v.id), v.price, v.available === true, url, p.vendor, v.compare_at_price);
        }
      }
    } else if(retailer.adapter==='pages') {
      for(const url of (retailer.urls||[]).slice(0,maxPages))collect(await request(url),url);
    } else if (retailer.adapter==='woocommerce'||retailer.id === 'santan-solar') {
      for (let page = 1; page <= 2; page++) {
        const rows = JSON.parse(await request(`${retailer.origin}/wp-json/wc/store/v1/products?per_page=100&page=${page}`));
        for (const p of rows) { if (!classify(serialize(p.name)) || p.type === 'variable'||p.prices?.currency_code!=='USD') continue; synthetic(serialize(p.name), p.description || p.short_description, p.images?.[0]?.src || '', p.sku || String(p.id), Number(p.prices?.price) / 10 ** Number(p.prices?.currency_minor_unit ?? 2), p.is_in_stock, p.permalink, p.brands?.[0]?.name, Number(p.prices?.regular_price) / 10 ** Number(p.prices?.currency_minor_unit ?? 2)); }
      }
    } else {
      const rootSitemap = retailer.id === 'signature-solar' ? '/xmlsitemap.php?type=products&page=1' : '/sitemap.xml';
      const queue = [retailer.origin + rootSitemap]; const urls = new Set(); let documents = 0;
      while (queue.length && documents++ < 5) {
        const xml = await request(queue.shift());
        for (const url of locs(xml)) { if (new URL(url).origin !== retailer.origin) continue; if (/sitemapindex/i.test(xml) && /\.xml|xmlsitemap/.test(url)) queue.push(url); else if (!/category|blog|learn|\?/.test(new URL(url).pathname)) urls.add(url); }
        if (urls.size > 400) break;
      }
      const priority = [...urls].filter(url => /eg4|panel|pv-wire|battery-cable|lug|rail|mount|ground|conduit|junction|busbar|breaker|fuse|disconnect|emporia|mppt|charge-controller|smartsolar|bluesolar|rapid-shutdown|optimizer|transmitter|tigo|transfer/i.test(url));
      const ordered = priority.sort((a, b) => Number(/6000xp|lifepower4|flexboss|18kpv|ll-s/i.test(b)) - Number(/6000xp|lifepower4|flexboss|18kpv|ll-s/i.test(a)));
      // Round-robin categories prevents a panel-only sitemap from starving mounting/electrical.
      const chosen = retailer.id==='signature-solar' ? ['https://signaturesolar.com/eg4-6000xp-off-grid-inverter-split-phase/','https://signaturesolar.com/eg4-18kpv-hybrid-inverter-eg4-18kpv-12lv-48v-split-phase-120-240vac-ul1741-cec/','https://signaturesolar.com/eg4-flexboss21-16kw-ac-hybrid-inverter-w32y/'] : []; const buckets = ['6000xp|lifepower4|flexboss|18kpv|ll-s', 'charge-controller|smartsolar|bluesolar|mppt100', 'rapid-shutdown|optimizer|transmitter|ts4|tigo', 'lug|pv-wire|battery-cable|mc4', 'rail|mount|clamp', 'conduit|junction|busbar|breaker|fuse|disconnect|grounding', 'panel', 'battery', 'inverter', 'emporia|monitor|gridboss|transfer|cerbo|shunt', 'solar-kit|power-station|solar-generator'].map(pattern => ordered.filter(u => new RegExp(pattern, 'i').test(u)));
      for (let i = 0; chosen.length < maxPages && i < 40; i++) for (const b of buckets) { const u = b[i]; if (u && !chosen.includes(u)) chosen.push(u); if (chosen.length >= maxPages) break; }
      for (const url of chosen) { try { collect(await request(url), url); } catch (e) { if (/source_rejected|bot_challenge/.test(e.message)) throw e; } }
    }
    reports.push({ retailerId: retailer.id, retailer: retailer.name, status: products.length ? 'ok' : 'no_products', products: products.length, checkedAt: observedAt, message: `Public catalog; robots checked; ${checked} product variants parsed.` }); all.push(...products);
    progress.completed[retailer.id] = products; await writeFile(progressFile, JSON.stringify(progress));
    console.log(JSON.stringify({ retailer: retailer.name, products: products.length, checked }));
  } catch (e) { reports.push({ retailerId: retailer.id, retailer: retailer.name, status: 'unavailable', products: products.length, checkedAt: observedAt, message: e.message }); all.push(...products); console.log(JSON.stringify({ retailer: retailer.name, error: e.message, products: products.length })); }
}
const filter = process.env.COLLECT_RETAILERS?.split(','); await Promise.all(retailers.filter(r => r.enabled!==false&&!(r.adapter==='shopify'&&r.usdConfirmed===false)&&(!filter || filter.includes(r.id))).map(source));
const catalog = mergeProducts(all);
const result = { generatedAt: observedAt, products: catalog, reports };
const path = new URL('catalog.json', directory);
if (!process.argv.includes('--publish')) {
  let previous; try { previous = JSON.parse(await readFile(path, 'utf8')); } catch {}
  if (previous) { result.products = mergeProducts([...previous.products.map(categorizeProduct), ...catalog]); result.reports = [...previous.reports.filter(r => !reports.some(n => n.retailerId === r.retailerId)), ...reports]; }
  await writeFile(path, JSON.stringify(result, null, 2));
} else {
  if (!process.env.PV_API_ORIGIN || !process.env.PV_COLLECTOR_TOKEN) throw new Error('PV_API_ORIGIN and PV_COLLECTOR_TOKEN are required for publishing.');
  for (let i = 0; i < Math.max(1,catalog.length); i += 15) { const response = await fetch(new URL('/api/ingest', process.env.PV_API_ORIGIN), { method: 'POST', headers: { Authorization: `Bearer ${process.env.PV_COLLECTOR_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ products: catalog.slice(i, i + 15), reports: i === 0 ? reports : [] }) }); if (!response.ok) throw new Error(`Ingestion failed ${response.status}: ${(await response.text()).slice(0, 300)}`); }
  const response = await fetch(new URL('/api/process-alerts', process.env.PV_API_ORIGIN), { method: 'POST', headers: { Authorization: `Bearer ${process.env.PV_COLLECTOR_TOKEN}` } }); if (!response.ok) throw new Error(`Alert processing failed ${response.status}`);
}
console.log(JSON.stringify({ products: result.products.length, categories: Object.fromEntries(categories.map(c => [c.id, result.products.filter(p => p.category === c.id).length])), reports }));
