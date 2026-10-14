import fs from 'node:fs';
let s=fs.readFileSync(new URL('./inspect-photo-frames.mjs',import.meta.url),'utf8');
s=s.replace("['frame','deskShelfStuf']","['roomFurniture','deskShelfStuf']").replace("n.name==='frame'||g.box.min.y>3.7&&g.box.max.z>3.65","g.box.max.z < -2 && g.box.min.y < 3");
s=s.replace("from 'draco3d'","from '"+new URL('../node_modules/draco3d/draco3d.js',import.meta.url).href+"'").replace("from 'three'","from '"+new URL('../node_modules/three/build/three.module.js',import.meta.url).href+"'");
await import('data:text/javascript,'+encodeURIComponent(s));
