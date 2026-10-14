import fs from 'node:fs';
const file='public/config.json',config=JSON.parse(fs.readFileSync(file,'utf8'));
let deferred=0;
for(const a of Object.values(config.assets))if(a.preload&&/\.otf$/i.test(a.file?.filename||'')){a.preload=false;deferred+=a.file.size||0;}
fs.writeFileSync(file,JSON.stringify(config));
const scripts='public/__game-scripts.js';let code=fs.readFileSync(scripts,'utf8');
// Compile the landing view only. The original diamond and terrain animate
// normally when reached; don't visit them behind a black loading screen.
code=code.replace('SceneManager.SEGMENTS.slice(0,2).forEach','SceneManager.SEGMENTS.slice(0,1).forEach');
code=code.replace('SceneManager.WARMUP_DELAY_FRAMES=5','SceneManager.WARMUP_DELAY_FRAMES=1');
code=code.replace('SceneManager.WARMUP_SETTLE_MS=120','SceneManager.WARMUP_SETTLE_MS=30');
fs.writeFileSync(scripts,code);
console.log({duplicateFontBytesRemovedFromBlockingPreload:deferred,warmupScenes:1});
