// Repeatable mechanical patching of the exported scene; never rebuild from old originals.
import fs from 'node:fs';
const scenePath='public/2509662.json',configPath='public/config.json',codePath='public/__game-scripts.js';
const scene=JSON.parse(fs.readFileSync(scenePath)),config=JSON.parse(fs.readFileSync(configPath));
const original=JSON.parse(fs.readFileSync('original-export/2509662.json'));
const roots=new Set(Object.values(scene.entities).filter(e=>['sceneDatacenter','sceneCar','sceneChip'].includes(e.name)).map(e=>e.resource_id));
const removed=new Set();
function underneath(e){return roots.has(e.parent)||removed.has(e.parent);}
let again=true;while(again){again=false;for(const [id,e] of Object.entries(scene.entities))if(!removed.has(id)&&underneath(e)){removed.add(id);again=true;}}
const candidate=new Set();
function references(value,set){if(typeof value==='number'&&config.assets[value])set.add(String(value));else if(typeof value==='string'&&config.assets[value])set.add(value);else if(value&&typeof value==='object')for(const v of Object.values(value))references(v,set);}
for(const id of removed){references(scene.entities[id].components,candidate);references(original.entities[id]?.components,candidate);scene.entities[id].components={};scene.entities[id].enabled=false;}
function expand(set){let previous=-1;while(previous!==set.size){previous=set.size;for(const id of [...set])if(config.assets[id])references(config.assets[id].data,set);}}
expand(candidate);
const live=new Set();for(const e of Object.values(scene.entities))references(e.components,live);references(scene.settings,live);references(config.application_properties,live);expand(live);
let deferredBytes=0;const deferred=[];
for(const id of candidate){const a=config.assets[id];if(a&&!live.has(id)&&a.type!=='script'&&a.preload){a.preload=false;deferredBytes+=a.file?.size||0;deferred.push({id,name:a.name,size:a.file?.size||0});}}
// Later card images need no blocking preload; PlayCanvas loads their material
// dependencies when the UI scene is prepared.
for(const a of Object.values(config.assets))if(a.type==='texture'&&a.file?.url?.startsWith('portfolio/'))a.preload=false;
fs.writeFileSync(scenePath,JSON.stringify(scene));fs.writeFileSync(configPath,JSON.stringify(config));
let code=fs.readFileSync(codePath,'utf8');
code=code.replace('SceneManager.WARMUP_SETTLE_MS=2500','SceneManager.WARMUP_SETTLE_MS=120');
code=code.replace('SceneManager.WARMUP_FRAMES_PER_STEP=3','SceneManager.WARMUP_FRAMES_PER_STEP=1');
// Warm only the first two authored scenes; the custom room is prepared during scrolling.
code=code.replace('SceneManager.SEGMENTS.forEach((function(t){var n=t.end-t.start;e.push(t.start+.25*n,t.start+.75*n)}))','SceneManager.SEGMENTS.slice(0,2).forEach((function(t){var n=t.end-t.start;e.push(t.start+.25*n)}))');
fs.writeFileSync(codePath,code);
fs.mkdirSync('evidence/revision',{recursive:true});fs.writeFileSync('evidence/revision/loading-changes.json',JSON.stringify({disabledLegacyEntities:removed.size,deferredBytes,deferred},null,2));
console.log({disabledLegacyEntities:removed.size,deferredBytes});
