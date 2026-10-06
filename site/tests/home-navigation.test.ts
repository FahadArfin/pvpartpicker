import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyCatalogDestination} from '../lib/home-navigation.ts';
import {needsPageCatalog} from '../lib/catalog-client.ts';

test('home renders without catalog loading, including campaign-only links',()=>{
  assert.equal(legacyCatalogDestination({}),null);
  assert.equal(legacyCatalogDestination({utm_source:'newsletter'}),null);
  assert.equal(needsPageCatalog('/'),false);
  for(const path of ['/parts','/build','/builds','/community','/deals'])assert.equal(needsPageCatalog(path),true);
});
test('old catalog bookmarks retain builder context, filters and encoded searches',()=>{
  const result=legacyCatalogDestination({category:'panels',builder:'1','f.panelFace':'Bifacial',q:'A&B + 48V',stock:'1'});
  const url=new URL(result!,'https://pvpartpicker.invalid');
  assert.equal(url.pathname,'/parts');
  assert.equal(url.searchParams.get('builder'),'1');
  assert.equal(url.searchParams.get('f.panelFace'),'Bifacial');
  assert.equal(url.searchParams.get('q'),'A&B + 48V');
  assert.equal(url.searchParams.get('stock'),'1');
  assert.equal(legacyCatalogDestination({builder:'1'}),'/parts?builder=1');
});
