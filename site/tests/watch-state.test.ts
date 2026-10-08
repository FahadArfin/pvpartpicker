import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitWatchChange,commitWatchBatch} from '../lib/watch-state.ts';

test('opposite completed watch mutations persist desired state before any render commits',async()=>{
 const state={current:['existing']},pending:string[][]=[];let stored=['existing'];
 const set=async(watched:boolean)=>commitWatchChange(state,'panel',watched,async()=>{stored=watched?['panel',...stored.filter(id=>id!=='panel')]:stored.filter(id=>id!=='panel');},ids=>pending.push(ids));
 await set(true);await set(false);
 assert.deepEqual(stored,['existing']);assert.deepEqual(state.current,stored);
 assert.deepEqual(pending,[['panel','existing'],['existing']]);
});
test('failed persistence does not change current or rendered watch state',async()=>{
 const state={current:['panel']};let renders=0;
 await assert.rejects(commitWatchChange(state,'panel',false,async()=>{throw Error('write failed');},()=>renders++),/write failed/);
 assert.deepEqual(state.current,['panel']);assert.equal(renders,0);
});
test('overlapping different-product writes preserve both completed changes',async()=>{
 const state={current:['existing']};let release!:()=>void;
 const first=commitWatchChange(state,'panel',true,()=>new Promise<void>(resolve=>{release=resolve;}),()=>{});
 await commitWatchChange(state,'battery',true,async()=>{},()=>{});release();await first;
 assert.deepEqual(state.current,['panel','battery','existing']);
});
test('watching all current model listings adds in one persistence operation and removes only that model',async()=>{
 const state={current:['other','unit']};let calls=0;
 await commitWatchBatch(state,['unit','bundle','bundle'],true,async()=>{calls++;},()=>{});
 assert.equal(calls,1);assert.deepEqual(state.current,['unit','bundle','other']);
 await commitWatchBatch(state,['unit','bundle'],false,async()=>{},()=>{});assert.deepEqual(state.current,['other']);
});
test('batch failure or capacity overflow preserves the existing watch list',async()=>{
 const state={current:['other']};await assert.rejects(commitWatchBatch(state,['unit'],true,async()=>{throw Error('offline');},()=>{}),/offline/);assert.deepEqual(state.current,['other']);
 const full={current:Array.from({length:500},(_,i)=>'p'+i)};let called=false;await assert.rejects(commitWatchBatch(full,['unit'],true,async()=>{called=true;},()=>{}),/500/);assert.equal(called,false);assert.equal(full.current.length,500);
});
