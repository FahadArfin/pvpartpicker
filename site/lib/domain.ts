import type { Offer, Product, Build, BuildSettings, Compatibility } from './types.ts';
export const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
export function costForQuantity(offer: Offer, quantity: number) { const packs = Math.ceil(quantity / offer.packQuantity); return { packs, purchasedUnits: packs * offer.packQuantity, extraUnits: packs * offer.packQuantity - quantity, subtotal: Math.round(packs * offer.price * 100) / 100 }; }
export function freshOffers(offers: Offer[], now = Date.now()) { return offers.filter(o => o.currency === 'USD' && o.price > 0 && o.stock === 'in_stock' && Date.parse(o.observedAt) <= now + 60000 && now - Date.parse(o.observedAt) <= 86400000).sort((a, b) => a.price / a.packQuantity - b.price / b.packQuantity); }
export function bestOffer(product: Product, quantity = 1, now = Date.now()) { return freshOffers(product.offers, now).sort((a, b) => costForQuantity(a, quantity).subtotal - costForQuantity(b, quantity).subtotal)[0]; }
export function alertCrossed(previous: number | null, current: number, target: number, eligible: boolean) { return eligible && current <= target && (previous === null || previous > target); }
export function validateBuild(value: unknown): Build {
  const b = value as Build;
  if (!b || typeof b.name !== 'string' || !b.name.trim() || b.name.length > 100 || !Array.isArray(b.lines) || b.lines.length > 100 || !b.settings || !['offgrid', 'hybrid', 'gridtie'].includes(b.settings.purpose) || !['roof', 'ground'].includes(b.settings.mount)) throw new Error('Invalid build. Enter a name and valid system settings.');
  const ids = new Set<string>();
  for (const l of b.lines) { if (!l || typeof l.productId !== 'string' || l.productId.length > 180 || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 10000 || ids.has(l.productId) || (l.offerId !== undefined && (typeof l.offerId !== 'string' || l.offerId.length > 200))) throw new Error('Invalid or duplicate build item.'); ids.add(l.productId); }
  for (const k of ['series', 'parallel'] as const) if (b.settings[k] !== undefined && (!Number.isInteger(b.settings[k]) || b.settings[k]! < 1 || b.settings[k]! > 200)) throw new Error('String counts must be between 1 and 200.');
  if (b.settings.minimumTemperature !== undefined && (!Number.isFinite(b.settings.minimumTemperature) || b.settings.minimumTemperature < -70 || b.settings.minimumTemperature > 60)) throw new Error('Minimum temperature must be between -70 and 60°C.');
  return { name: b.name.trim(), lines: b.lines.map(l => ({ productId: l.productId, quantity: l.quantity, ...(l.offerId ? { offerId: l.offerId } : {}) })), settings: { purpose: b.settings.purpose, mount: b.settings.mount, ...(b.settings.series ? { series: b.settings.series } : {}), ...(b.settings.parallel ? { parallel: b.settings.parallel } : {}), ...(b.settings.minimumTemperature !== undefined ? { minimumTemperature: b.settings.minimumTemperature } : {}) } };
}
export function checkCompatibility(products: Product[], settings: BuildSettings): Compatibility[] {
  const results: Compatibility[] = []; const inverters = products.filter(p => p.category === 'inverters'); const batteries = products.filter(p => p.category === 'batteries'); const panels = products.filter(p => p.category === 'panels');
  const add = (status: Compatibility['status'], title: string, detail: string, source?: string) => results.push({ status, title, detail, source });
  for (const inverter of inverters) {
    if (inverter.specs.inverterType) { const t = String(inverter.specs.inverterType); const mismatch = (['hybrid','gridtie'].includes(settings.purpose) && t === 'Off-grid') || (settings.purpose === 'offgrid' && ['Grid-tie', 'Microinverter'].includes(t)); add(mismatch ? 'mismatch' : 'unknown', 'System purpose', mismatch ? `${inverter.name} does not support the selected system purpose.` : `Review ${inverter.name}'s operating modes and required equipment.`, inverter.documentation || inverter.sourceUrl); }
    for (const battery of batteries) {
      const v = Number(battery.specs.voltage), min = Number(inverter.specs.batteryMinV), max = Number(inverter.specs.batteryMaxV);
      if (v && min && max) add(v >= min && v <= max ? 'match' : 'mismatch', 'Battery voltage', `${battery.name}: ${v}V. ${inverter.name} documented range: ${min}–${max}V.`, inverter.documentation || inverter.sourceUrl);
      else add('unknown', 'Battery voltage', 'A documented battery operating range is missing. Matching nominal voltages alone does not establish compatibility.');
      add('unknown', 'Battery communication & certification', 'Confirm the exact battery model, firmware, CAN/RS485 protocol, discharge limits, and approved system combination in the manufacturer documentation.', inverter.documentation || inverter.sourceUrl);
    }
    for (const panel of panels) {
      const voc = Number(panel.specs.voc), coefficient = Number(panel.specs.vocTempCoefficient), limit = Number(inverter.specs.maxPvVoltage);
      if (settings.series && settings.minimumTemperature !== undefined && voc && Number.isFinite(coefficient) && limit) { const coldV = voc * settings.series * (1 + coefficient / 100 * (settings.minimumTemperature - 25)); add(coldV <= limit ? 'match' : 'mismatch', 'Cold-weather PV voltage', `${settings.series} panels in series: ${coldV.toFixed(1)}V at ${settings.minimumTemperature}°C. Inverter limit: ${limit}V.`, panel.documentation || panel.sourceUrl); }
      else add('unknown', 'PV string voltage', 'Enter panels per string and minimum temperature; panel Voc, temperature coefficient, and inverter maximum voltage must all be documented.');
      const imp = Number(panel.specs.imp), limitA = Number(inverter.specs.maxMpptCurrent);
      if (settings.parallel && imp && limitA) add(imp * settings.parallel <= limitA ? 'match' : 'mismatch', 'MPPT operating current', `${(imp * settings.parallel).toFixed(1)}A across parallel strings; documented operating limit ${limitA}A.`);
      else add('unknown', 'PV input current', 'Verify string allocation, short-circuit current, and each MPPT input limit before connecting panels.');
    }
  }
  if (!inverters.length&&!products.some(p=>p.category==='kits')) add('unknown', 'Choose an inverter', 'Add an inverter to check electrical compatibility.');
  for(const controller of products.filter(p=>p.category==='charging')) add('unknown','Charge controller & battery','Confirm the controller’s battery operating range, chemistry/charging profile, maximum PV Voc and input current, and charge-current limits. Listed nominal voltage and amperage alone do not establish a match.',controller.documentation||controller.sourceUrl);
  if(products.some(p=>p.category==='module-electronics')) add('unknown','Module electronics & shutdown','Verify the exact module/inverter pairing, electrical limits, transmitter or gateway, shutdown protocol, and complete manufacturer-supported combination. An optimizer or shutdown device alone does not establish system compliance.');
  if(products.some(p=>p.category==='monitoring')) add('unknown','Monitoring & load control','Verify sensor ranges, communication protocols, transfer topology, supported equipment, and installation requirements for smart panels and load controls.');
  if(products.some(p=>p.category==='kits')) add('unknown','Bundled equipment','Review the kit’s included models and quantities. Integrated inverter/battery ratings and component compatibility are not established by the bundle title; avoid counting included parts twice.');
  const mount = products.find(p => p.category === 'mounting'); if (mount && panels.length) add('unknown', 'Mounting fit & structure', 'Check panel frame thickness, dimensions, clamp zones, roof attachment, and wind/snow requirements.', mount.sourceUrl);
  if (products.some(p => ['wiring', 'electrical'].includes(p.category))) add('unknown', 'Wiring & protection', 'Wire lengths, ampacity, voltage ratings, connectors, disconnects, and protection need installation-specific verification.');
  return results;
}
