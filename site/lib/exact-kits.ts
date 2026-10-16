import type { Offer, Product } from './types.ts';

export const richSolarCbk1302Title = 'Off-Grid System Kit | 13,000W 120/240V Output, 48VDC(30.72kWh ALPHA 5 PRO Server Lithium Iron Phosphate Battery)';
export const richSolarCbk1302Path = '/products/off-grid-system-kit-13-000w-120-240v-output-48vdc28-8kwh-alpha-5-server-lithium-iron-phosphate-battery';
export const richSolarCbk1302Variant = '39981933690929';
export const richSolarCbk1302Sku = 'RS-CBK1302';
export const richSolarCbk1302Source = `https://richsolar.com${richSolarCbk1302Path}?variant=${richSolarCbk1302Variant}`;
export const richSolarCbk1302Contents = '2 × RS-H6548 6500 W 48 V off-grid hybrid solar inverters; 6 × RS-B5121P ALPHA 5 PRO 51.2 V 100 Ah server-rack lithium batteries; 2 × 600 A busbars; 4 × 4 ft 2/0 AWG wire sets (3/8 in)';
const richSolarCbk1302Ids = new Set(['rich-solar-39981933690929', 'rich-solar-rs-cbk1302']);

function exactVariantUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return url.origin === 'https://richsolar.com' && url.pathname === richSolarCbk1302Path && url.searchParams.get('variant') === richSolarCbk1302Variant;
  } catch { return false; }
}

export function isRichSolarCbk1302Source(input: { retailerId: string; brand: string; name: string; sourceUrl: string; sku: string }) {
  return input.retailerId === 'rich-solar' && input.brand === 'RICH SOLAR' && input.name === richSolarCbk1302Title && input.sku === richSolarCbk1302Sku && exactVariantUrl(input.sourceUrl);
}

export function isRichSolarCbk1302Offer(product: Pick<Product, 'id'>, offer: Offer) {
  return offer.retailerId === 'rich-solar' && exactVariantUrl(offer.url) && (offer.sku === richSolarCbk1302Sku || (product.id === 'rich-solar-39981933690929' && offer.sku === richSolarCbk1302Variant));
}

export function isRichSolarCbk1302Product(product: Product) {
  const skuMatches = product.offers.some(offer => isRichSolarCbk1302Offer(product, offer));
  return richSolarCbk1302Ids.has(product.id) && skuMatches && product.brand === 'RICH SOLAR' && product.name === richSolarCbk1302Title && exactVariantUrl(product.sourceUrl);
}

export const richSolarCbk1302DerivedComparisonKeys = ['watts','outputWatts','voltage','capacityKwh','capacityAh','batteryKind','formFactor','chemistry','inverterType','acOutput','gridForming'];
