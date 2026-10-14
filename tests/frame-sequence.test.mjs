import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sequenceFrame} from '../public/frame-sequence.js';
test('WebP sequence indexes are clamped and exactly reversible',()=>{
 assert.equal(sequenceFrame(0,.55,.582,120),0);assert.equal(sequenceFrame(1,.55,.582,120),119);
 const values=Array.from({length:121},(_,i)=>.55+i/120*.032);
 const forward=values.map(p=>sequenceFrame(p,.55,.582,120));
 assert.deepEqual(values.reverse().map(p=>sequenceFrame(p,.55,.582,120)).reverse(),forward);
 assert.equal(forward[60],60);
});
