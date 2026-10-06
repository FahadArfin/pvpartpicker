import test from 'node:test';
import assert from 'node:assert/strict';
import {ecosystems,resolveEcosystem,matchesEcosystem,ecosystemHref} from '../lib/ecosystems.ts';
import type {Product} from '../lib/types.ts';

test('ecosystem aliases group catalog brands without guessing from product titles',()=>{
 for(const [alias,id] of [['Victron Energy','victron'],['EG4 Electronics','eg4'],['EcoFlow US','ecoflow'],['Renogy US','renogy'],['ECO-WORTHY','eco-worthy'],['Ecoworthy','eco-worthy'],['Sol Ark','sol-ark'],['Solar edge','solaredge'],['FranklinWH','franklin']]) {
  assert.equal(resolveEcosystem(alias)?.id,id);
 }
 assert.equal(resolveEcosystem('unknown-brand'),undefined);
 assert.equal(matchesEcosystem({brand:'EcoFlow US'} as Product,'ecoflow'),true);
 assert.equal(matchesEcosystem({brand:'EcoFlow'} as Product,'ecoflow'),true);
 assert.equal(matchesEcosystem({brand:'Third Party',name:'Compatible with Victron'} as Product,'victron'),false);
 assert.equal(matchesEcosystem({brand:'Third Party'} as Product,''),true);
 assert.equal(matchesEcosystem({brand:'SolaX'} as Product,'solaredge'),false);
});

test('an ecosystem includes its products across equipment categories',()=>{
 const products=[{brand:'EG4',category:'inverters'},{brand:'EG4 Electronics',category:'monitoring'},{brand:'EG4',category:'batteries'},{brand:'Anker',category:'batteries'}] as Product[];
 assert.deepEqual(products.filter(p=>matchesEcosystem(p,'eg4')).map(p=>p.category),['inverters','monitoring','batteries']);
 assert.equal(products.filter(p=>matchesEcosystem(p,'tesla')).length,0);
 for(const id of ['victron','eg4','ecoflow','anker','pecron','eco-worthy','enphase','tesla','sol-ark','growatt','solaredge','generac','franklin'])assert.ok(ecosystems.some(e=>e.id===id));
});

test('product ecosystem links open all categories and safely reject unknown brands',()=>{
 assert.equal(ecosystemHref('EG4 Electronics'),'/parts?ecosystem=eg4&category=all');
 assert.equal(ecosystemHref('Renogy'),'/parts?ecosystem=renogy&category=all');
 assert.equal(ecosystemHref('Not a supported ecosystem'),undefined);
});
