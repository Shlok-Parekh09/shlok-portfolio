import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sanitizeSolves} from '../scripts/build-solves.mjs';
import {filterMachines} from '../public/htb-solves.js';
const context={};vm.runInNewContext(fs.readFileSync('public/portfolio-timeline.js','utf8'),context);const T=context.PortfolioTimeline;
test('ending crossfade retraces identical values when scrolling backwards',()=>{
 const points=[.69,.704,.73,.80,.87,.91,.96,1];const forward=points.map(p=>JSON.stringify([T.iris(p),T.ending(p)]));
 const backward=[...points].reverse().map(p=>JSON.stringify([T.iris(p),T.ending(p)])).reverse();assert.deepEqual(forward,backward);
 assert.equal(T.ending(.87).contact,0);assert.equal(T.ending(1).contact,1);assert(T.ending(.95).travel>T.ending(.80).travel);
});
test('public solves omit incomplete records, notes and private fields',()=>{
 const data=sanitizeSolves({machines:[{title:'Cap',systemOwned:true,userOwned:true,body:'PRIVATE',token:'SECRET'},{title:'Incomplete',systemOwned:false}]});
 assert.equal(data.machines.length,1);assert(!JSON.stringify(data).includes('PRIVATE'));assert(!JSON.stringify(data).includes('SECRET'));assert.equal(data.sync.connected,false);
});
test('All Machines includes completed machines regardless of retired/active status',()=>{
 const input=[{title:'Cap',os:'Linux',difficulty:'Easy',systemOwned:true,status:'Retired'},{title:'Layover',os:'Linux',difficulty:'Medium',systemOwned:true,status:'Active'}];
 assert.equal(filterMachines(input).length,2);assert.equal(filterMachines(input,{query:'cap'}).length,1);assert.equal(filterMachines(input,{difficulty:'Medium'})[0].title,'Layover');
});
test('Earth video registry resolves to a local file without blocking preload',()=>{
 const config=JSON.parse(fs.readFileSync('public/config.json'));const asset=config.assets['297340642'];assert(asset);assert(fs.existsSync('public/'+asset.file.url));assert.equal(asset.preload,false);
});
