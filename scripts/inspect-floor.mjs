import fs from 'node:fs';
import draco from 'draco3d';
import * as T from 'three';
const b=fs.readFileSync('public/portfolio/room/RoomModel.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),bin=b.subarray(28+b.readUInt32LE(12));
const n=j.nodes.find(n=>n.name==='roomFurniture'),p=j.meshes[n.mesh].primitives[0],e=p.extensions.KHR_draco_mesh_compression,v=j.bufferViews[e.bufferView],d=await draco.createDecoderModule({}),decoder=new d.Decoder(),buffer=new d.DecoderBuffer(),mesh=new d.Mesh();buffer.Init(new Int8Array(bin.subarray(v.byteOffset,v.byteOffset+v.byteLength)),v.byteLength);decoder.DecodeBufferToMesh(buffer,mesh);
const values=new d.DracoFloat32Array(),uv=new d.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(mesh,decoder.GetAttributeByUniqueId(mesh,e.attributes.POSITION),values);decoder.GetAttributeFloatForAllPoints(mesh,decoder.GetAttributeByUniqueId(mesh,e.attributes.TEXCOORD_0),uv);
const matrix=new T.Matrix4().compose(new T.Vector3(...(n.translation||[0,0,0])),new T.Quaternion(...(n.rotation||[0,0,0,1])),new T.Vector3(...(n.scale||[1,1,1])));
const rows=[];for(let i=0;i<mesh.num_points();i++){const pos=new T.Vector3(values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2)).applyMatrix4(matrix);if(pos.y<.16)rows.push({p:pos.toArray().map(x=>+x.toFixed(4)),uv:[uv.GetValue(i*2),uv.GetValue(i*2+1)]});}
console.log([...new Set(rows.filter(r=>r.p[0]>0&&r.p[2]<-3).map(r=>r.p[1]))]);
