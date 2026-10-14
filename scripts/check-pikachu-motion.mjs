import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {PIKACHU_HEIGHT,PIKACHU_POSITION} from '../src/pikachu-layout.js';
// Load the actual skeleton/animation without browser-only texture decoding.
const b=fs.readFileSync('public/portfolio/models/pikachu-dancing.glb');
const length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length));
const bin=b.subarray(28+length);
j.buffers[0].uri='data:application/octet-stream;base64,'+bin.toString('base64');
j.materials=[];delete j.images;delete j.textures;
for(const mesh of j.meshes)for(const primitive of mesh.primitives)delete primitive.material;
globalThis.ProgressEvent=class {constructor(type,props){Object.assign(this,{type},props);}};
const g=await new GLTFLoader().parseAsync(JSON.stringify(j),'');
const mixer=new THREE.AnimationMixer(g.scene);mixer.clipAction(g.animations[0]).play();
console.log('clip',g.animations[0].duration,'tracks',g.animations[0].tracks.length);
let initial=null;
for(const t of [0,.25,.5,1,2]){
 mixer.setTime(t);g.scene.updateMatrixWorld(true);
 g.scene.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
 const box=new THREE.Box3().setFromObject(g.scene);
 if(initial===null)initial=box.clone();
 else assert(box.min.distanceTo(initial.min)>.001,'Dance must change the skinned pose');
 assert(box.getSize(new THREE.Vector3()).length()<3,'Animated model must retain its size');
 console.log(t,'min',box.min.toArray(),'max',box.max.toArray());
}
console.log('PASS: skinned pose changes without scale explosion.');
const scale=PIKACHU_HEIGHT/initial.getSize(new THREE.Vector3()).y,center=initial.getCenter(new THREE.Vector3());
let farthest=-Infinity,lowest=Infinity;
for(let t=0;t<g.animations[0].duration;t+=1/24){
 mixer.setTime(t);g.scene.updateMatrixWorld(true);g.scene.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
 const box=new THREE.Box3().setFromObject(g.scene);
 farthest=Math.max(farthest,PIKACHU_POSITION[2]-(box.min.z-center.z)*scale);
 lowest=Math.min(lowest,PIKACHU_POSITION[1]+(box.min.y-initial.min.y)*scale);
}
console.log('Full dance: maximum wall depth',farthest,'minimum height',lowest);
assert(farthest<4.08,'Entire dance must remain in front of the wall');
