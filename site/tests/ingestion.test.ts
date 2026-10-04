import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateIngestion } from '../lib/ingestion.ts';
const p = { id: 'x', name: 'Panel', category: 'panels', description: '', specs: {}, offers: [{ id: 'o', retailerId: 'signature-solar', url: 'https://signaturesolar.com/p', price: 50, currency: 'USD', packQuantity: 1, stock: 'in_stock', observedAt: new Date().toISOString() }] };
test('ingestion rejects foreign origins and oversized batches', () => { assert.throws(() => validateIngestion({ products: [{ ...p, offers: [{ ...p.offers[0], url: 'https://evil.example/p' }] }] })); assert.throws(() => validateIngestion({ products: Array(21).fill(p) })); });
test('ingestion rejects future observations and invalid package counts', () => { assert.throws(() => validateIngestion({ products: [{ ...p, offers: [{ ...p.offers[0], observedAt: '2099-01-01' }] }] })); assert.throws(() => validateIngestion({ products: [{ ...p, offers: [{ ...p.offers[0], packQuantity: 0 }] }] })); });
test('bounded valid collection batch accepted', () => { assert.equal(validateIngestion({ products: [p] }).products.length, 1); });
