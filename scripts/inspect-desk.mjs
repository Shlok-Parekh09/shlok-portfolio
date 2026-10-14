import fs from 'node:fs';
let source=fs.readFileSync(new URL('./inspect-photo-frames.mjs',import.meta.url),'utf8');
source=source.replace("n.name==='frame'||g.box.min.y>3.7&&g.box.max.z>3.65","g.box.min.y>1.8&&g.box.max.y<2.6&&g.n>40");
source=source.replace("from 'draco3d'","from '"+new URL('../node_modules/draco3d/draco3d.js',import.meta.url).href+"'");
source=source.replace("from 'three'","from '"+new URL('../node_modules/three/build/three.module.js',import.meta.url).href+"'");
await import('data:text/javascript,'+encodeURIComponent(source));
