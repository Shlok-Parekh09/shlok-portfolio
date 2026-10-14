import fs from 'node:fs';
import * as T from 'three';
import draco3d from 'draco3d';
const decoderModule=await draco3d.createDecoderModule({});
const scene=new T.Scene();
for(const file of ['RoomModel.glb','chairtopDraco.glb']){
 const b=fs.readFileSync('public/portfolio/room/'+file),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length)),bin=b.subarray(28+length);
 for(const n of j.nodes){
  if(n.mesh===undefined)continue;
  const group=new T.Group();group.name=n.name;
  group.position.fromArray(n.translation||[0,0,0]);group.quaternion.fromArray(n.rotation||[0,0,0,1]);group.scale.fromArray(n.scale||[1,1,1]);scene.add(group);
  for(const p of j.meshes[n.mesh].primitives){
   const ext=p.extensions?.KHR_draco_mesh_compression;if(!ext)continue;
   const v=j.bufferViews[ext.bufferView],d=decoderModule,buffer=new d.DecoderBuffer(),decoder=new d.Decoder(),mesh=new d.Mesh(),values=new d.DracoFloat32Array(),face=new d.DracoInt32Array();
   buffer.Init(new Int8Array(bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)),v.byteLength);decoder.DecodeBufferToMesh(buffer,mesh);
   decoder.GetAttributeFloatForAllPoints(mesh,decoder.GetAttributeByUniqueId(mesh,ext.attributes.POSITION),values);
   const pos=Float32Array.from({length:mesh.num_points()*3},(_,i)=>values.GetValue(i)),indices=[];
   for(let i=0;i<mesh.num_faces();i++){decoder.GetFaceFromMesh(mesh,i,face);indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setIndex(indices);
   const object=new T.Mesh(geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));object.name=n.name;group.add(object);
   for(const x of [face,values,mesh,decoder,buffer])d.destroy(x);
  }
 }
}
scene.updateMatrixWorld(true);
const center=new T.Box3().setFromObject(scene.getObjectByName('monitor')).getCenter(new T.Vector3());
console.log('monitor',center.toArray());
const ray=new T.Raycaster();
for(const ratio of [16/9,9/16]){
 const dist=Math.max(1.6,1.96/(2*Math.tan(T.MathUtils.degToRad(58)/2)*ratio)*1.17);
 const pos=center.clone().add(new T.Vector3(.03,.07,-dist));ray.set(pos,center.clone().sub(pos).normalize());
 console.log('aspect',ratio,'camera',pos.toArray(),'hits',ray.intersectObjects(scene.children,true).slice(0,4).map(h=>({name:h.object.name,distance:h.distance,point:h.point.toArray()})));
}
