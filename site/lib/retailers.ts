import { load } from 'cheerio';
import type { Category, Product, Specs } from './types.ts';
import {describeConfiguration} from './bundles.ts';
export interface Retailer { id: string; name: string; origin: string; seeds?: string[]; adapter?:'shopify'|'pages';startPath?:string;urls?:string[]; }
export const retailers: Retailer[] = [
  { id: 'signature-solar', name: 'Signature Solar', origin: 'https://signaturesolar.com', seeds: ['/', '/solar-panels/', '/solar-inverters/', '/batteries/', '/solar-mounting/', '/wiring-and-connectors/'] },
  { id: 'current-connected', name: 'Current Connected', origin: 'https://www.currentconnected.com', seeds: ['/product-category/solar-panels/', '/product-category/inverters/', '/product-category/batteries/', '/product-category/solar-components/'] },
  { id: 'santan-solar', name: 'SanTan Solar', origin: 'https://www.santansolar.com' },
  { id: 'shopsolar', name: 'ShopSolar', origin: 'https://shopsolarkits.com' },
  { id: 'naz', name: 'NAZ Solar Electric', origin: 'https://www.solar-electric.com' },
  { id: 'renogy', name: 'Renogy', origin: 'https://www.renogy.com' },
  { id: 'emporia', name: 'Emporia Energy', origin: 'https://shop.emporiaenergy.com' },
  { id:'windynation',name:'WindyNation',origin:'https://www.windynation.com',adapter:'shopify',startPath:'/collections/solar-cable/products.json' },
  { id:'temco',name:'TEMCo Industrial',origin:'https://temcoindustrial.com',adapter:'pages',urls:[
   'https://temcoindustrial.com/temco-10-awg-solar-pv-wire-100-ft-black-100-ft-red-bare-copper-made-in-usa/',
   'https://temcoindustrial.com/temco-10-awg-solar-pv-wire-50-ft-black-50-ft-red-bare-copper-made-in-usa/',
   'https://temcoindustrial.com/temco-wc0240-welding-cable-1-awg-50-ft-red/',
  ] },
];
export function classify(title: string): Category | null {
  const configuration=describeConfiguration(title);
  if(configuration?.kind==='combo')return 'kits';
  if(configuration?.kind==='standalone')return configuration.type==='Inverter'?'inverters':'all-in-one';
  // Classify the main equipment, not an optional variant cable/panel or a feature.
  const base = title.split(/\s—\s/)[0].toLowerCase();
  const t = base.split(/\s(?:for|with|including|featuring)\s/)[0];
  if(/\btilt kit\b/i.test(t))return 'mounting';
  if(/\bmicroinverter\b/i.test(t)&&!/\b(?:kit|bundle)\b/i.test(base))return 'inverters';
  const stationModel = /^(?:pecron\s*(?:e(?:1000|1500|2000|2400|3600|3800)|f(?:1000|3000|5000))\s*lfp|anker\s*(?:solix\s*)?(?:c(?:1000|2000)|f(?:2000|2600|3000|3800)|s2000)\b|ecoflow\s+delta\b|bluetti\s+(?:ac200l|apex\s*300|elite\s*\d+)\b|jackery\s+explorer\s+\d+)/.test(t);
  // Inspect the main sale item before optional additions and feature columns.
  // A cycle count such as "4,000+" does not turn an expansion battery into a station.
  const subject=t.split(/\+|\|/)[0];
  if (isBatteryCabinet(title)) return 'batteries';
  const stationAccessory=/cable|adapter|carrying|cover|\bcase\b|replacement|battery only|extra battery|expansion battery|solar panel/.test(subject);
  const inverterModule=/inverter/.test(subject)&&!/power station|solar generator/.test(subject);
  if ((/portable power station|solar generator|power bank/.test(subject) || stationModel) && !stationAccessory && !inverterModule) return 'all-in-one';
  if (/\b(?:kit|bundle)\b/.test(base)&&/\bkwh\b.*(?:storage|array)|storage.*array|inverter.*battery|battery.*inverter/.test(base)) return 'kits';
  if (/wirebox|wire box/.test(t)) return 'electrical';
  if (/rapid[ -]?shutdown|pv optimizer|module.level.*optimizer|\bts4[- ]|\brss transmitter|\brsd[- ]|tigo.*(?:\btap\b|\bcca\b|cloud connect)/.test(t)) return 'module-electronics';
  if (/charge controller|smartsolar|bluesolar|dc[ -]?dc.*charg|orion.*charg/.test(t) || /dc[ -]?dc/.test(t)&&/battery charger/.test(base)) return 'charging';
  if (/portable power station|solar generator|power bank|balcony solar|plug.?and.?play solar|solar.*\bkit\b|solar (?:power )?system/.test(t) && !/expansion battery|extra battery|replacement|carrying|cover|cable|adapter|mounting/.test(t)) return 'kits';
  if (/\b(?:kit|bundle)\b/.test(t) && /inverter.*battery|battery.*inverter|off.grid.*power/.test(t)) return 'kits';
  if (/smart.*(?:electrical|home|solar)?\s*panel|electrical panel|load center|breaker panel/.test(t)) return 'electrical';
  if (/\bEV\b.*charg|level 2.*charg/i.test(t)) return 'accessories';
  if (/smart panel|gridboss|energy management|smart transfer|system controller|automatic transfer switch|\bats\b|battery monitor|energy monitor|home energy|smart plug|multimeter|watt meter|\bcerbo\b|\bshunt\b|\bdongle\b|\bgateway\b|data logger|remote control|communication adapter/.test(t)) return 'monitoring';
  if (/battery base|battery stand|battery cover|battery tray|inverter cover plate/.test(t) || /lcd|screen kit/.test(subject)&&!/inverter/.test(subject)) return 'accessories';
  if (/inverter|multiplus|quattro|microinverter/.test(t) && !/adapter|screen kit|cable|wire|bracket|cover plate/.test(subject)) return 'inverters';
  if (/load center|electrical panel|breaker panel/.test(t)) return 'electrical';
  if (/cable|wire\b|wiring|\blug\b|\blugs\b|mc4|connector|ferrule/.test(t)) return 'wiring';
  if (/solar panel|pv module|bifacial|photovoltaic/.test(t) && !/kit|bundle|mount|bracket|clamp/.test(t)) return 'panels';
  if (/conduit|junction|combiner|disconnect|grounding|ground rod|busbar|bus bar|breaker|fuse|isolator|surge protect|electrical box/.test(t)) return 'electrical';
  if (/lcd|screen kit|battery base|battery stand|battery cover|battery tray/.test(t)) return 'accessories';
  if (/monitor|sensor|meter/.test(t)) return 'monitoring';
  if (/communication|display|adapter|control|battery charger/.test(t)) return 'accessories';
  if (/lifepo4|lifpo4|lfp48|\b\d+\s*(?:kwh|ah)\b/.test(t) && !/inverter|kit|bundle|cable/.test(t)) return 'batteries';
  if (/rail|mount|clamp|flashing|bracket|roof hook/.test(t) && !/wall.?mount.*battery|battery.*wall.?mount/.test(t)) return 'mounting';
  if (/battery|batteries|lifepo4|lithium/.test(t) && !/inverter|solar kit|solar system|bundle/.test(t)) return 'batteries';
  if (/inverter|multiplus|quattro|microinverter/.test(t) && !/bundle|solar kit|solar system/.test(t)) return 'inverters';
  if (/solar panel|pv module|bifacial|photovoltaic|mono.*\d+\s*w/.test(t) && !/kit|bundle/.test(t)) return 'panels';
  return null;
}
export function slug(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120); }
export function canonicalId(title: string, category: Category, fallback: string) {
  if (!/bundle|\bkit\b|pallet|used|refurb|open.?box|scratch|b-stock|\b\d+\s*(?:pack|pcs)\b|\bx\s*[2-9]\b/i.test(title)) {
    if (category === 'inverters' && /\beg4\b/i.test(title)) { for (const model of ['6000xp', '12000xp', '18kpv', '12kpv', 'flexboss21', 'flexboss18']) if (title.toLowerCase().replace(/\s/g, '').includes(model)) return 'eg4-' + model; }
    if (category === 'batteries' && /eg4/i.test(title) && /lifepower4/i.test(title) && /v2/i.test(title)) return 'eg4-lifepower4-v2';
    if (category === 'batteries' && /eg4/i.test(title) && /ll-s/i.test(title)) return 'eg4-ll-s';
  }
  return slug(fallback);
}
export function robotsAllows(text: string, path: string, agent = 'PVPartPickerBot') {
  const groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[] = []; let group = { agents: [] as string[], rules: [] as { allow: boolean; pattern: string }[] };
  for (const line of text.split(/\r?\n/)) { const m = line.replace(/#.*/, '').trim().match(/^([^:]+):\s*(.*)$/); if (!m) continue; const k = m[1].toLowerCase(), v = m[2].trim(); if (k === 'user-agent') { if (group.rules.length) { groups.push(group); group = { agents: [], rules: [] }; } group.agents.push(v.toLowerCase()); } else if (['allow', 'disallow'].includes(k) && v) group.rules.push({ allow: k === 'allow', pattern: v }); } groups.push(group);
  const specific = groups.filter(g => g.agents.some(a => a !== '*' && agent.toLowerCase().includes(a))); const selected = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
  const matches = selected.flatMap(g => g.rules).filter(r => { const end = r.pattern.endsWith('$'); const p = end ? r.pattern.slice(0, -1) : r.pattern; return new RegExp('^' + p.split('*').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (end ? '$' : '')).test(path); }).sort((a, b) => b.pattern.replace(/\*/g, '').length - a.pattern.replace(/\*/g, '').length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}
export function extractSpecs(title: string, category: Category, properties: Record<string, unknown> = {}): Specs {
  const selected = title.split(/\s—\s/).slice(1).join(' ');
  const specs: Specs = {}; const numeric = (key: string, pattern: RegExp) => { const m = selected.match(pattern) || title.match(pattern); if (m) specs[key] = Number(m[1].replace(/,/g, '')); };
  numeric('watts', /\b([\d,]+)\s*(?:w|watts?)\b/i); numeric('voltage', /\b([\d.]+)\s*v(?:dc|ac)?(?=\b|\d+(?:\.\d+)?\s*ah\b)/i); numeric('capacityKwh', /\b([\d.]+)\s*kwh\b/i); numeric('capacityAh', /\b([\d.]+)\s*ah\b/i);
  if (category === 'panels') { if (/bi[ -]?facial/i.test(title)) specs.face = 'Bifacial'; else if (/mono[ -]?facial/i.test(title)) specs.face = 'Monofacial'; if (/n[ -]?type/i.test(title)) specs.cellType = 'N-type'; if (/p[ -]?type/i.test(title)) specs.cellType = 'P-type'; if (/perovskite/i.test(title)) specs.cellType='Perovskite'; if (/back[ -]?contact/i.test(title)) specs.technology='Back contact'; for (const tech of ['TOPCon', 'HPBC', 'IBC', 'PERC', 'HJT', 'HBC', 'ABC', 'BC']) if (new RegExp('\\b' + tech + '\\b', 'i').test(title)) specs.technology = tech; }
  if (category === 'batteries') { specs.batteryKind=isBatteryCabinet(title)?'Battery cabinets':'Battery modules'; if(specs.batteryKind==='Battery modules'){if (/stackable|stacking/i.test(title)) specs.formFactor='Stackable'; else if (/\b(?:server|rack)\b|server[ -]?rack/i.test(title)) specs.formFactor = 'Server rack'; else if (/wall/i.test(title)) specs.formFactor = 'Wall mounted'; else if (/standing|cabinet/i.test(title)) specs.formFactor = 'Floor standing'; if (/lifepo4|lithium iron phosphate|\bLFP\b/i.test(title)) specs.chemistry = 'LiFePO4';} }
  if (category === 'inverters') { if (/microinverter/i.test(title)) specs.inverterType = 'Microinverter'; else if (/hybrid/i.test(title)) specs.inverterType = 'Hybrid'; else if (/off[ -]?grid/i.test(title)) specs.inverterType = 'Off-grid'; else if (/grid[ -]?tie/i.test(title)) specs.inverterType = 'Grid-tie'; if (/split[ -]?phase|120\s*\/\s*240/i.test(title)) specs.acOutput = '120/240V split-phase'; if (/grid[ -]?forming/i.test(title)) specs.gridForming = true; }
  if (category === 'inverters') {
    const output=extractInverterOutput(title);if(output!==undefined)specs.outputWatts=output;
    const lowVoltage=title.match(/\b(12(?:\.8)?|24|25\.6|48|51\.2)\s*v\b/i);
    const explicit=title.match(/\b(120|400)\s*v\s*(?:battery|dc|system)\b/i)||title.match(/(?:battery|dc|system)\s*(?:voltage\s*[:=]?\s*)?(120|400)\s*v\b/i);
    if(lowVoltage||explicit)specs.systemVoltageV=Number((lowVoltage||explicit)![1]);
  }
  if (category === 'electrical') specs.electricalType=electricalType(title);
  if (category === 'accessories') specs.accessoryType=accessoryType(title);
  if (category === 'charging') { specs.controllerType=/dc[ -]?dc/i.test(title)?'DC-DC charger':/mppt/i.test(title)?'MPPT':/pwm/i.test(title)?'PWM':'Solar controller';numeric('chargeCurrentA',/\b([\d.]+)\s*a(?:mp(?:s|ere)?)?\b/i); }
  if (category === 'module-electronics') specs.moduleFunction=/optimi[sz]er/i.test(title)?(/rapid[ -]?shutdown/i.test(title)?'Optimizer + rapid shutdown':'Optimizer'):/transmitter/i.test(title)?'Shutdown transmitter':/\btap\b|\bcca\b|cloud connect/i.test(title)?'Shutdown gateway / access point':'Rapid shutdown';
  if (category === 'monitoring') specs.monitorType=/smart panel|gridboss|energy management|transfer|system controller|\bats\b/i.test(title)?'System / load control':/smart plug/i.test(title)?'Smart plug':/shunt|battery monitor/i.test(title)?'Battery monitor':/sensor/i.test(title)?'Sensor':/dongle|gateway|cerbo|logger/i.test(title)?'Gateway / communications':'Energy monitor / meter';
  if (category === 'all-in-one') {
    specs.stationType=/\bdc portable power station|\btrail\b|\bexplorer\s*\d+d\b|dc-only/i.test(title)?'DC-only station (no AC inverter)':'Integrated power station';
    const main=title.split(/\s—\s/)[0],whPattern=/\b([\d,]+(?:\.\d+)?)\s*wh\b/i;
    const selectedWh=selected.match(whPattern),selectedKwh=selected.match(/\b([\d.]+)\s*kwh\b/i),mainWh=main.match(whPattern);
    if(selectedWh) specs.capacityKwh=Number(selectedWh[1].replace(/,/g,''))/1000;
    else if(selectedKwh) specs.capacityKwh=Number(selectedKwh[1]);
    else if(mainWh) specs.capacityKwh=Number(mainWh[1].replace(/,/g,''))/1000;
    // Generic W figures may describe bundled panels or input. Do not infer AC output.
    delete specs.watts;delete specs.voltage;
  }
  if (category === 'kits') {
    specs.kitType=describeConfiguration(title,'kits')?.type||'Other equipment kits';
    // A panel's watts or the station's internal storage are not whole-bundle ratings.
    delete specs.watts;delete specs.voltage;delete specs.capacityKwh;delete specs.capacityAh;
  }
  if (/all[ -]?black|black/i.test(title)) specs.color = 'Black'; else if (/silver/i.test(title)) specs.color = 'Silver';
  if (category === 'mounting') {const main=title.split(/\s—\s/)[0];specs.mountType=/DIN\s*rail|battery|inverter|monitor|EV charger/i.test(main)?'Hardware':/ground|pole mount/i.test(main)?'Ground':/roof|rail/i.test(main)?'Roof':'Hardware';}
  if (category === 'wiring') { const awg = title.match(/([\d/]+)\s*(?:awg|gauge)/i); if (awg) specs.gauge = awg[1] + ' AWG'; const feet = selected.match(/([\d.]+)\s*(?:ft\.?|feet|foot)/i)||title.match(/([\d.]+)\s*(?:ft\.?|feet|foot)/i); if (feet) specs.lengthFt = Number(feet[1]);
   if(!/\bCCA\b|copper[ -]?clad|alumin(?:um|ium)/i.test(title)&&/pure copper|tinned copper|bare copper|oxygen.free copper|\bOFC\b/i.test(title))specs.wireMaterial='Copper';
   if(/\bTHHN\b|\bTHWN/i.test(title))specs.wireInsulation='THHN / THWN';
  }
  for (const [key, value] of Object.entries(properties).slice(0, 35)) { if (key.length < 70 && ['string', 'number'].includes(typeof value)) specs[key] = String(value).slice(0, 180); }
  return specs;
}
function isBatteryCabinet(title:string) {
 const main=title.split(/\s—\s|\|/)[0];
 return /battery\s+(?:rack\s+)?cabinet|cabinet\s+(?:for\s+)?batter(?:y|ies)/i.test(main)&&!/\b[\d.,]+\s*(?:kwh|ah)\b|lifepo4|\bLFP\b|lithium/i.test(main);
}
function electricalType(title:string) {
 const main=title.split(/\s—\s/)[0];
 if(/combiner|junction|wirebox|wire box|load center|electrical panel|breaker panel|breaker box|bell box|electrical box/i.test(main))return 'Boxes & combiners';
 if(/conduit/i.test(main))return 'Conduit';
 if(/bus[ -]?bar/i.test(main))return 'Busbars';
 if(/breaker/i.test(main))return 'Circuit breakers';
 if(/fuse/i.test(main))return 'Fuses';
 if(/ground(?:ing| rod)/i.test(main))return 'Grounding';
 if(/surge/i.test(main))return 'Surge protection';
 if(/disconnect|isolator/i.test(main))return 'Disconnects';
 return 'Other electrical';
}
function accessoryType(title:string) {
 const main=title.split(/\s—\s/)[0];
 if(/\bEV\b.*charg|level 2.*charg/i.test(main))return 'EV charging';
 if(/battery charg|chargeverter/i.test(main))return 'Battery chargers';
 if(/battery base|battery stand|battery tray/i.test(main))return 'Battery bases & stands';
 if(/mini split|heat pump|appliance/i.test(main))return 'Appliances';
 if(/lcd|screen|display|control/i.test(main))return 'Displays & controls';
 if(/cover|carrying|\bcase\b|bag/i.test(main))return 'Covers & carrying';
 if(/adapter|communication|wifi|network|data module|\bhub\b/i.test(main))return 'Adapters & communications';
 return 'Other accessories';
}
function extractInverterOutput(title:string):number|undefined {
 const [main,...variants]=title.split(/\s—\s/);
 const selected=variants.join(' ').match(/^\s*([\d,]+(?:\.\d+)?)\s*(kw|w)(?:\s|$)/i);
 if(selected)return Number(selected[1].replace(/,/g,''))*(selected[2].toLowerCase()==='kw'?1000:1);
 for(const match of main.matchAll(/\b([\d,]+(?:\.\d+)?)\s*(kw|watts?|w)\b/gi)) {
  const before=main.slice(Math.max(0,match.index!-25),match.index).split(/[|;]/).at(-1)!,after=main.slice(match.index!+match[0].length,match.index!+match[0].length+24);
  if(/surge|peak|solar input|pv input|mppt|solar array/i.test(before)||/^\s*(?:surge|peak|pv|solar|input|mppt)|^\s*[–—/-]\s*\d/i.test(after)||/[\d.]\s*(?:kw|w)?[–—/-]\s*$/i.test(before))continue;
  return Number(match[1].replace(/,/g,''))*(match[2].toLowerCase()==='kw'?1000:1);
 }
}
export function extractPackQuantity(title: string, category: Category): number | null {
  if(category==='kits'||category==='all-in-one') return 1; // The sale unit is the complete kit/station bundle.
  // A mixed bundle is one sale unit; quantities of included plugs/sensors are not monitor counts.
  if (category !== 'panels' && /\bwith\b|\bbundle\b|\bkit\b/i.test(title)) return 1;
  const selected = title.split(/\s—\s/).slice(1).join(' ');
  const pattern = /(?:pallet\s*(?:of|with)?\s*(?:panels\s*[-:]?\s*)?|pack\s*of|quantity[:\s]+)\s*\(?\s*(\d+)|\b(\d+)\s*(?:(?:solar\s*)?panels?\b|pack\b|pcs\b|pieces?\b)|\b(\d+)\s*x\s*\d+\s*w\b/i;
  const m = selected.match(pattern) || title.match(pattern);
  if (m) { const count=Number(m[1]||m[2]||m[3]); return count>0 && count<=10000 ? count : null; }
  return /pallet|multi.?pack/i.test(title) ? null : 1;
}
// Reclassify old stored metadata without changing IDs, prices, or observation dates.
// Owner specification corrections are applied after this normalization in storage.
export function categorizeProduct(product: Omit<Product,'offers'> & {offers?:Product['offers']}): Product {
  const category=classify(product.name)||product.category;
  const specs={...product.specs};
  // Older substring matching read "bracket" as "rack". Remove only that
  // known title-parser artifact; genuine rack evidence/corrections survive.
  if(category==='batteries'&&specs.formFactor==='Server rack'&&/\bbrackets?\b/i.test(product.name)&&!/\b(?:server|rack)\b|server[ -]?rack/i.test(product.name))delete specs.formFactor;
  if(category!==product.category) for(const key of ['face','cellType','technology','formFactor','chemistry','inverterType','acOutput','gridForming','mountType','gauge','lengthFt','kitType','stationType','watts','voltage','capacityKwh']) delete specs[key];
  const offers=product.offers||[]; // D1 stores product metadata separately from offers.
  const panelDetails:Specs={};
  const extracted=extractSpecs(product.name,category);
  if(category==='batteries'&&extracted.batteryKind!=='Battery cabinets'&&!extracted.formFactor&&!specs.formFactor&&/(?:installation\s*:\s*(?:indoor\s*)?floor[ -]?standing|floor[ -]?standing design)/i.test(product.description||'')){
   extracted.formFactor='Floor standing';extracted.formFactorSource=product.sourceUrl;
  }
  if(category==='wiring'&&!/\bCCA\b|copper[ -]?clad|alumin(?:um|ium)/i.test(product.name)){
   const conductor=Object.entries(specs).find(([key])=>/^conductor material$/i.test(key))?.[1];
   if(/^(?:bare|tinned|pure|uncoated)?\s*copper$/i.test(String(conductor||''))||/\b(?:100%\s*(?:pure\s*)?copper|conductor(?:s| material)?\s*:\s*(?:bare|tinned|uncoated|pure)?\s*copper)\b/i.test(product.description||''))extracted.wireMaterial='Copper';
  }
  const configuration=describeConfiguration(product.name,category);
  if(category==='kits')for(const key of ['watts','voltage','capacityKwh','capacityAh','outputWatts','stationType'])delete specs[key];
  if(category==='panels') {
    // Read labeled product specs only: comparisons in marketing prose describe other modules.
    for(const pattern of [/\bcell (?:type|technology)\s*:?\s*([^.;]{1,80})/gi,/\bpanel face\s*:?\s*([^.;]{1,40})/gi]) {
      for(const match of (product.description||'').matchAll(pattern)) {
        const parsed=extractSpecs(match[1],'panels');
        for(const key of ['face','cellType','technology'])if(parsed[key]!==undefined)panelDetails[key]=parsed[key];
      }
    }
    // Renogy explicitly identifies its 100W N-type series as monofacial.
    // Apply only to that source product and wattage, never to every non-bifacial title.
    if(/renogy-n-type-solar-panel(?:\?|$)/.test(product.sourceUrl)&&Number(extracted.watts??specs.watts)===100&&!/bifacial/i.test(product.name)) {
      panelDetails.face='Monofacial';panelDetails.faceSource='https://www.renogy.com/pages/n-type-solar-panel';
    }
    // Model identity is explicit in the source SKU; SunPower's E20 disclosure identifies back-contact cells.
    if(/^santan-solar-spr-e20-327(?:-|$)/.test(product.id)&&/sunpower/i.test(product.name)) {
      panelDetails.technology='Back contact';panelDetails.technologySource='https://www.sec.gov/Archives/edgar/data/867773/000086777313000012/spwr_12302012x10-k.htm';
    }
  }
  return {...product,category,configuration,specs:{...specs,...panelDetails,...extracted},offers:category==='kits'||category==='all-in-one'?offers.map(o=>({...o,packQuantity:1})):offers};
}
function flatten(value: any): any[] { if (Array.isArray(value)) return value.flatMap(flatten); if (!value || typeof value !== 'object') return []; return [value, ...flatten(value['@graph']), ...flatten(value.itemListElement?.map((i: any) => i.item || i)), ...flatten(value.hasVariant)]; }
export function parseProductPage(html: string, retailer: Retailer, url: string, observedAt: string): Product[] {
  const $ = load(html); const nodes: any[] = []; $('script[type="application/ld+json"]').each((_, e) => { try { nodes.push(...flatten(JSON.parse($(e).text()))); } catch {} }); const output: Product[] = [];
  if (!nodes.some(n=>n['@type']==='Product') && ['signature-solar','temco'].includes(retailer.id)) {
    try { const match=html.match(/var\s+BCData\s*=\s*(\{[\s\S]*?\});/);const attributes=match?JSON.parse(match[1]).product_attributes:null;
      if(attributes?.price?.without_tax?.currency==='USD')nodes.push({'@type':'Product',name:$('meta[property="og:title"]').attr('content')||$('h1').first().text()||$('title').first().text(),description:$('meta[property="og:description"]').attr('content')||'',sku:attributes.sku,image:$('meta[property="og:image"]').attr('content'),offers:{'@type':'Offer',price:attributes.price.without_tax.value,priceCurrency:'USD',url,availability:attributes.instock===true?'https://schema.org/InStock':attributes.instock===false?'https://schema.org/OutOfStock':''}});
    }catch{}
  }
  for (const n of nodes) {
    if (![].concat(n['@type'] || []).some(t => String(t).toLowerCase() === 'product')) continue;
    const title = String(n.name || '').trim(); const category = classify(title); if (!category) continue;
    const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
    for (const o of offers) {
      if (o['@type'] === 'AggregateOffer' || o.priceCurrency !== 'USD') continue;
      const price = Number(String(o.price ?? o.priceSpecification?.price ?? '').replace(/[$,]/g, '')); if (!Number.isFinite(price) || price <= 0 || price > 1000000) continue;
      let offerUrl: URL; try { offerUrl = new URL(o.url || url, url); } catch { continue; } if (offerUrl.origin !== retailer.origin) continue;
      const sku = String(o.sku || n.sku || n.productID || slug(title)); const offerId = slug(retailer.id + '-' + sku + (offers.length>1 && !o.sku ? '-'+offerUrl.href : ''));
      const packQuantity = extractPackQuantity(title,category);
      if (!packQuantity || packQuantity > 10000) continue;
      const rawImages = [n.image].flat().filter(Boolean).map((x: any) => typeof x === 'object' ? x.url : x).filter((x: unknown) => typeof x === 'string' && /^https:\/\//.test(x as string));
      const properties: Record<string, unknown> = {}; for (const p of [n.additionalProperty].flat().filter(Boolean)) if (p.name && p.value !== undefined) properties[String(p.name)] = p.value;
      $('table tr').each((_, e) => { const cells = $(e).find('td,th'); if (cells.length === 2) { const k = $(cells[0]).text().replace(/\s+/g, ' ').trim(), v = $(cells[1]).text().replace(/\s+/g, ' ').trim(); if (k && v && k.length < 70 && v.length < 160) properties[k] = v; } });
      const description = load(String(n.description || ''))('body').text().replace(/\s+/g, ' ').trim().slice(0, 6500);
      const id = canonicalId(title, category, retailer.id + '-' + sku);
      const specs = extractSpecs(title, category, properties);
      const p: Product = { id, name: title, brand: typeof n.brand === 'string' ? n.brand : n.brand?.name || title.match(/^(EG4|Victron|Renogy|Emporia|IronRidge|APsystems|ZNShine|Aptos|Canadian Solar|Growatt|SOK|Pytes|Sol-Ark|TEMCo|WindyNation)/i)?.[0] || 'See manufacturer', category, description, image: rawImages[0] || $('meta[property="og:image"]').attr('content') || '', images: rawImages, sourceUrl: url, specs, offers: [{ id: offerId, retailerId: retailer.id, retailer: retailer.name, url: offerUrl.href, price, ...(Number(o.referencePrice)>price&&Number(o.referencePrice)<=1000000?{referencePrice:Number(o.referencePrice)}:{}), currency: 'USD', packQuantity, stock: /outofstock|soldout|discontinued/i.test(o.availability || '') ? 'out_of_stock' : /instock|limitedavailability/i.test(o.availability || '') ? 'in_stock' : 'unknown', observedAt, sku, condition: /used|refurbished/i.test(n.itemCondition || title) ? 'used' : 'new' }], verifiedAt: observedAt };
      if (id === 'eg4-6000xp') { p.documentation = 'https://eg4electronics.com/wp-content/uploads/2024/04/EG4-6000XP-Manual.pdf'; p.specs = { ...specs, batteryMinV: 46.4, batteryMaxV: 60, batteryChemistry: 'Lithium', maxPvVoltage: 500, maxMpptCurrent: 17, inverterType: 'Off-grid', acOutput: '120/240V split-phase', outputWatts: 6000, mpptCount: 2, specificationSource: p.documentation }; }
      output.push(p);
    }
  }
  return output;
}
export function mergeProducts(products: Product[]): Product[] { const map = new Map<string, Product>(); for (const p of products) { const existing = map.get(p.id); if (!existing) map.set(p.id, p); else { const offers = new Map(existing.offers.map(o => [o.id, o])); for (const o of p.offers) offers.set(o.id, o); existing.offers = [...offers.values()]; if (!existing.image && p.image) existing.image = p.image; if (p.description.length > existing.description.length) existing.description = p.description; existing.specs = { ...existing.specs, ...p.specs }; existing.verifiedAt = existing.verifiedAt>p.verifiedAt?existing.verifiedAt:p.verifiedAt; } } return [...map.values()].map(p=>p.id==='eg4-6000xp'?{...p,documentation:'https://eg4electronics.com/wp-content/uploads/2024/04/EG4-6000XP-Manual.pdf',specs:{...p.specs,batteryMinV:46.4,batteryMaxV:60,maxPvVoltage:500,maxMpptCurrent:17,inverterType:'Off-grid',specificationSource:'https://eg4electronics.com/wp-content/uploads/2024/04/EG4-6000XP-Manual.pdf'}}:p); }
