import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {normalizeTheme, themeBootstrap, themeStorageKey} from '../lib/theme.ts';

function boot(value: unknown, blocked = false) {
  const root = {dataset:{} as Record<string,string>,classList:{toggle(name:string,on:boolean){assert.equal(name,'dark');root.dark=on;}},dark:false};
  runInNewContext(themeBootstrap,{document:{documentElement:root},localStorage:{getItem(key:string){assert.equal(key,themeStorageKey);if(blocked)throw new Error('Storage unavailable');return value;}}});
  return root;
}
test('the approved night theme is the default before paint',()=>{
  for(const value of [null,undefined,'','invalid','system','DARK']){
    assert.equal(normalizeTheme(value),'dark');assert.equal(boot(value).dataset.theme,'dark');assert.equal(boot(value).dark,true);
  }
});
test('day preference survives a full document navigation without dark flash',()=>{
  assert.equal(normalizeTheme('light'),'light');assert.equal(boot('light').dataset.theme,'light');assert.equal(boot('light').dark,false);
});
test('blocked local storage does not break document startup',()=>{
  assert.equal(boot('light',true).dataset.theme,'dark');
});
