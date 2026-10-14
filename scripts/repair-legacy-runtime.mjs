// Narrow, repeatable repairs to the minified PlayCanvas export.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const filename=path.join(root,'public/__game-scripts.js');
let code=fs.readFileSync(filename,'utf8');
const repairs=[
 [',EventBus.emit("audio:play",{track:"datacenter",fadeIn:1})',''],
 [',EventBus.emit("audio:play",{track:"chip",fadeIn:1})',''],
 [',EventBus.emit("audio:play",{track:"ui",fadeIn:.8})',''],
 [',EventBus.emit("audio:play",{track:"car",fadeIn:1.2})',''],
 [',EventBus.emit("audio:play",{track:"satellite",fadeIn:1.2})',''],
 [',EventBus.emit("audio:play",{track:"diamond",fadeIn:1})',''],
 ['this._lastH=-1,e.play(),this.resizeToFullscreen()', 'this._lastH=-1,e.play().catch(function(error){if(error.name!=="AbortError"&&error.name!=="NotAllowedError")console.warn("[videoEarth] Playback failed",error)}),this.resizeToFullscreen()'],
 ['this.video=t,this.texture=i,t.play();var o=this;', 'this.video=t,this.texture=i,t.play().catch(function(error){if(error.name!=="AbortError"&&error.name!=="NotAllowedError")console.warn("[video] Playback failed",error)});var o=this;'],
];
for(const [before,after] of repairs){
 const count=code.split(before).length-1;
 if(count>1)throw Error('Ambiguous runtime patch: '+before);
 if(count===1)code=code.replace(before,after);
 else if(after&&!code.includes(after))throw Error('Unknown export shape: '+before);
}
fs.writeFileSync(filename,code);
const sceneFile=path.join(root,'public/2509662.json');
const scene=JSON.parse(fs.readFileSync(sceneFile,'utf8'));
let removed=0;
for(const entity of Object.values(scene.entities)){
 const manager=entity.components?.script?.scripts?.lightManager;
 if(!manager)continue;
 manager.attributes.shots=manager.attributes.shots.filter(shot=>{
  const valid=Boolean(scene.entities[shot.light]?.components?.light);
  if(!valid)removed++;return valid;
 });
}
fs.writeFileSync(sceneFile,JSON.stringify(scene));
console.log(`Runtime repaired; ${removed} obsolete light bindings removed.`);
