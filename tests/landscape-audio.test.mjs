import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('both transport icons follow the media element and a pause survives scene audio sync',()=>{
 const elements=new Map();const make=()=>({style:{},setAttribute(k,v){this[k]=v;},outerHTML:'<svg></svg>',firstElementChild:{style:{},removeAttribute(){}},parentElement:{setAttribute(){}}});
 for(const key of ['#playStatus','.play-icon','.pause-icon','#core-play','.disc-anim svg'])elements.set(key,make());
 function Script(){}const context={pc:{createScript:()=>Script},gsap:{killTweensOf(){}},window:{}};
 vm.runInNewContext(fs.readFileSync('public/portfolio.js','utf8'),context);
 const p=new Script();p.songIndex=0;p.content={songs:[{title:'Honeypie'}]};p.laptopAccess={querySelector:k=>elements.get(k)};
 p.song={paused:false,ended:false,readyState:4,error:null,pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()}};
 p.updateMusicState();assert.equal(elements.get('#core-play')['aria-label'],'Pause music');assert.equal(elements.get('.pause-icon').style.display,'');
 p.toggleSong();assert(p.song.paused);assert(p.songUserPaused);assert.equal(elements.get('#core-play')['aria-label'],'Play music');assert.equal(elements.get('.play-icon').style.display,'');
 p.toggleSong();assert(!p.song.paused);assert(!p.songUserPaused);assert.equal(elements.get('#playStatus').checked,true);
 p.song.error={};p.updateMusicState();assert.equal(elements.get('#core-play')['aria-label'],'Play music');
});
test('Himalayan terrain and full-bleed contact assets are shipped',()=>{
 const c=JSON.parse(fs.readFileSync('public/config.json'));assert.equal(c.assets['298350544'].file.url,'portfolio/environment/himalayan-terrain.webp');
 for(const file of ['environment/himalayan-terrain.webp','environment/himalayan-window.webp','ending/blackhole-refined.webp'])assert(fs.statSync('public/portfolio/'+file).size>10000);
 const flock=fs.readFileSync('public/himalayan-birds.js','utf8');assert(flock.includes('time+=Math.min(dt,.05)'));assert(flock.includes('Wind-swaying alpine flower'));
});
