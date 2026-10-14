import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {skillsIndex,skillsZoom} from '../src/skills-layout.js';
import {isConsoleSetup} from '../src/room-cutouts.js';
import {PIKACHU_POSITION} from '../src/pikachu-layout.js';
test('six holograms and text share reversible scroll thresholds',()=>{
 assert.equal(skillsZoom(.198),0);assert.equal(skillsZoom(.214),1);
 for(let i=0;i<6;i++){const p=.214+(i+.5)/6*.052;assert.equal(skillsIndex(p),i);}
 assert.equal(skillsIndex(.3),5);assert.equal(skillsIndex(.19),0);
});
test('console removal includes lamp/console but excludes floor, shelf and chess table',()=>{
 assert(isConsoleSetup({x:2,y:.6,z:-3.5}));assert(isConsoleSetup({x:4.4,y:2.9,z:-3.6}));
 assert(!isConsoleSetup({x:2,y:0,z:-3.5}));assert(!isConsoleSetup({x:-3,y:1,z:-2}));assert(!isConsoleSetup({x:3,y:3.74,z:3.8}));
 assert(!isConsoleSetup({x:2,y:.1482,z:-3.5}),'Preserve the actual floor top below the console');
 assert(PIKACHU_POSITION[0]>3.1);assert(PIKACHU_POSITION[2]>3.7&&PIKACHU_POSITION[2]<3.9);
});
test('replacement music is byte-identical to supplied file and phoenix textures are present',()=>{
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 assert.equal(hash('../quentingaming-interstellar-580133.mp3'),hash('public/portfolio/ending/interstellar-quentingaming.mp3'));
 assert(fs.statSync('public/portfolio/models/phoenix/source/fly.fbx').size>1000000);
 for(const suffix of ['01a_D_A','01b_D_A','01a_E','01b_E'])assert(fs.existsSync('public/portfolio/models/phoenix/textures/Tex_Ride_FengHuang_'+suffix+'.tga.png'));
 const content=fs.readFileSync('public/portfolio-content.js','utf8');assert(content.includes('/portfolio/ending/interstellar-quentingaming.mp3'));
});
test('all skill categories use the supplied shared robot without resetting its animation',()=>{
 const source=fs.readFileSync('src/skills-scene.js','utf8');
 assert(source.includes("robotBase+'source/Robot_Holo_5.fbx'"));
 assert(source.includes('robotMixer?.update(dt)'));
 assert(!source.includes('m.visible=i===index'));
 assert(fs.statSync('public/portfolio/models/robot-playground/source/Robot_Holo_5.fbx').size>6000000);
 for(const name of ['bot_sg_albedo','bot_sg_emissive','holo_sg_albedo','holo_sg_opacity'])assert(fs.existsSync('public/portfolio/models/robot-playground/textures/'+name+'.jpg'));
});
