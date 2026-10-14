// Small real mesh birds with independently hinged wings; flight is time-, not scroll-driven.
export function createHimalayanBirds(app,camera){
 const pc=window.pc,root=new pc.Entity('Himalayan birds');camera.addChild(root);
 const material=new pc.StandardMaterial();material.useLighting=false;material.diffuse=new pc.Color(0,0,0);material.emissive=new pc.Color(.035,.052,.065);material.cull=pc.CULLFACE_NONE;material.update();
 function polygon(name,points,parent){
  const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(points);
  const indices=[];for(let i=1;i<points.length/3-1;i++)indices.push(0,i,i+1);
  mesh.setIndices(indices);mesh.update(pc.PRIMITIVE_TRIANGLES);
  const e=new pc.Entity(name);parent.addChild(e);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,material)],castShadows:false});return e;
 }
 const birds=Array.from({length:0},(_,i)=>{
  const bird=new pc.Entity('Alpine bird '+i);root.addChild(bird);
  const body=new pc.Entity('Body');bird.addChild(body);body.addComponent('render',{type:'sphere',material,castShadows:false});body.setLocalScale(.028,.095,.026);
  polygon('Tail',[-.01,-.025,0,-.028,-.09,0,0,-.073,0,.028,-.09,0,.01,-.025,0],bird);
  polygon('Beak',[-.009,.04,0,0,.073,0,.009,.04,0],bird);
  const wings=[-1,1].map(side=>polygon('Wing',[0,.02,0,side*.055,.052,0,side*.14,.01,0,side*.12,-.012,0,side*.06,-.017,0,0,-.027,0],bird));
  const size=.65+(i%3)*.17;bird.setLocalScale(size,size,size);
  return {bird,wings,phase:i*.89,depth:9+i*.65};
 });
 // Lightweight, vertex-coloured wildflowers: stems, leaves and cupped petals share one mesh.
 const flowerMaterial=new pc.StandardMaterial();flowerMaterial.useLighting=false;flowerMaterial.diffuse=new pc.Color(0,0,0);flowerMaterial.emissive=new pc.Color(1,1,1);flowerMaterial.emissiveVertexColor=true;flowerMaterial.cull=pc.CULLFACE_NONE;flowerMaterial.update();
 function flowerMesh(tint){
  const positions=[],colors=[],indices=[];
  const tri=(a,b,c,color)=>{const n=positions.length/3;positions.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(...color,1);indices.push(n,n+1,n+2);};
  const green=[.19,.38,.10];
  tri([-.005,0,0],[.005,0,0],[.007,.20,0],green);tri([-.005,0,0],[.007,.20,0],[-.003,.20,0],green);
  tri([0,.055,0],[-.048,.11,.012],[0,.09,0],green);tri([0,.10,0],[.045,.15,-.005],[0,.13,0],green);
  for(let petal=0;petal<5;petal++){
   const angle=petal*Math.PI*2/5,cx=Math.cos(angle)*.026,cy=.20+Math.sin(angle)*.026;
   for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4;
    const p=t=>[cx+Math.cos(t)*.021,.20+(cy-.20)+Math.sin(t)*.022,0];
    tri([cx,cy,.012],p(a),p(b),tint);
   }
  }
  for(let j=0;j<10;j++){const a=j*Math.PI/5,b=(j+1)*Math.PI/5;tri([0,.20,.018],[Math.cos(a)*.012,.20+Math.sin(a)*.012,.017],[Math.cos(b)*.012,.20+Math.sin(b)*.012,.017],[1,.72,.16]);}
  const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setColors(colors);mesh.setIndices(indices);mesh.update(pc.PRIMITIVE_TRIANGLES);return mesh;
 }
 const flowerMeshes=[[.97,.91,.79],[.87,.57,.80],[1,.81,.28]].map(flowerMesh);
 const flowers=Array.from({length:30},(_,i)=>{const flower=new pc.Entity('Wind-swaying alpine flower');root.addChild(flower);flower.addComponent('render',{meshInstances:[new pc.MeshInstance(flowerMeshes[i%3],flowerMaterial)],castShadows:false});const scale=.8+(i%5)*.18;flower.setLocalScale(scale,scale,scale);return flower;});
 let time=0;
 return {
  update(dt,progress){
   root.enabled=progress>.198&&progress<.273;if(!root.enabled)return;
   time+=Math.min(dt,.05);
   const aspect=app.graphicsDevice.width/app.graphicsDevice.height;
   const nearHeight=7*Math.tan(camera.camera.fov*Math.PI/360);
   flowers.forEach((flower,i)=>{
    const fraction=(i/29)*2-1;
    flower.setLocalPosition(fraction*nearHeight*aspect*.95,-nearHeight*(.98-.035*Math.sin(i*2.1)),-7);
    flower.setLocalEulerAngles(5*Math.sin(time*.7+i),0,Math.sin(time*1.2+i*.73)*6);
   });
   birds.forEach(({bird,wings,phase,depth},i)=>{
    const halfHeight=depth*Math.tan(camera.camera.fov*Math.PI/360),halfWidth=halfHeight*aspect;
    const u=((time*.022+i*.113)%1);
    const y=-halfHeight*(.65+(i%3)*.085)+Math.sin(time*.33+phase)*.13;
    bird.setLocalPosition((u*2-1)*halfWidth*1.15,y,-depth);
    bird.setLocalEulerAngles(12*Math.sin(time*.4+phase),0,-82+8*Math.cos(time*.33+phase));
    const flap=Math.sin(time*6.5+phase)*43;
    wings[0].setLocalEulerAngles(0,flap,0);wings[1].setLocalEulerAngles(0,-flap,0);
   });
  },
  dispose(){root.destroy();material.destroy();flowerMaterial.destroy();flowerMeshes.forEach(mesh=>mesh.destroy());}
 };
}
