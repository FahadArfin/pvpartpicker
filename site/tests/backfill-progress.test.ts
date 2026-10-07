import test from 'node:test';import assert from 'node:assert/strict';
import {backfillDisplay} from '../lib/backfill-progress.ts';
const now=Date.parse('2026-10-07T10:00:00Z');
const data={queue:{total:100,checked:5,remaining:95,preReview:20},paused:false,now:new Date(now).toISOString(),worker:{at:new Date(now-60000).toISOString(),phase:'finished'},active:null};
test('monitor distinguishes completed, paused, awaiting and stale check-ins from active work',()=>{
 assert.equal(backfillDisplay(data).label,'Between runs');
 assert.equal(backfillDisplay({...data,worker:null}).label,'Awaiting check-in');
 assert.equal(backfillDisplay({...data,worker:{...data.worker,at:new Date(now-3*3600000).toISOString()}}).label,'Check-in overdue');
 assert.equal(backfillDisplay({...data,paused:true}).label,'Paused');
 assert.equal(backfillDisplay({...data,queue:{...data.queue,checked:100,remaining:0}}).label,'Queue checked');
 assert.equal(backfillDisplay({...data,queue:{...data.queue,total:0,checked:0,remaining:0}}).label,'No queued listings');
 const active={until:new Date(now+60000).toISOString(),requestAt:null};
 assert.equal(backfillDisplay({...data,active,lastRequestAt:new Date(now-30000).toISOString()}).label,'Working');
 assert.equal(backfillDisplay({...data,active:{...active,requestAt:new Date(now+20000).toISOString()}}).label,'Waiting for request slot');
 assert.equal(backfillDisplay({...data,active:{...active,until:new Date(now-1).toISOString()}}).label,'Between runs');
 assert.equal(backfillDisplay({...data,worker:{...data.worker,phase:'failed'}}).label,'Worker error');
});
