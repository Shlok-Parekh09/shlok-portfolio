import fs from 'node:fs';
for(const f of ['public/files/assets/298286654/1/MAP.glb','public/portfolio/models/diamond-satellite.glb','public/portfolio/models/pikachu-dancing.glb']){
 const b=fs.readFileSync(f),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 console.log(f,JSON.stringify({nodes:j.nodes?.slice(0,4),bounds:j.meshes?.flatMap(m=>m.primitives.map(p=>j.accessors[p.attributes.POSITION])).map(a=>[a.min,a.max]),animations:j.animations?.map(a=>({name:a.name,channels:a.channels.length})),images:j.images}));
}
const t=fs.readFileSync('public/__game-scripts.js','utf8');const i=t.indexOf('pc.createScript("mapblend")');console.log(t.slice(i-30,i+1600));
