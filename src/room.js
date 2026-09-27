import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const base='/portfolio/room/';
const clamp=x=>Math.max(0,Math.min(1,x));
const range=(p,a,b)=>clamp((p-a)/(b-a));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const bakedFragment=`varying vec2 vUv;uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D lightMap;void main(){vec3 c=mix(texture2D(dayMap,vUv).rgb,texture2D(nightMap,vUv).rgb,.12);vec3 l=texture2D(lightMap,vUv).rgb;c=mix(c,max(c,vec3(1.,.13,.35)),l.r*.45);c=mix(c,max(c,vec3(1.,.44,.21)),l.g*.7);c=mix(c,max(c,vec3(.29,.49,1.)),l.b*.65);gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>
#include <colorspace_fragment>
}`.replace(';#include',';\n#include');

// Screen-only transition: the last credential stays flat while electricity erases it.
const screenFragment=`varying vec2 vUv;uniform sampler2D screen;uniform float dissolve;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=vec2(1.0 - vUv.x, vUv.y);float noise=hash(floor(uv*vec2(70.,40.)));float edge=dissolve*1.4-uv.x-.15*sin(uv.y*23.+time*8.);vec4 c=texture2D(screen,uv);float scan=.985+.015*sin(uv.y*900.);c.rgb*=scan;float bolt=1.-smoothstep(.008,.035,abs(edge+noise*.06));c.rgb+=vec3(.36,.72,1.)*bolt*2.*step(.001,dissolve);c.rgb*=1.-smoothstep(.015,.08,edge)*step(.001,dissolve);gl_FragColor=vec4(c.rgb,1.);
#include <colorspace_fragment>
}`;

function removeTelevision(mesh){
 // The author merged the TV casing/feet into deskShelfStuf. Coordinates below
 // are measured in the source room's world space; cabinet and chess props stay.
 mesh.updateMatrixWorld(true); const geo=mesh.geometry, pos=geo.attributes.position,index=geo.index;
 const p=new THREE.Vector3(),remove=new Uint8Array(pos.count);let removed=0;
 for(let i=0;i<pos.count;i++){
  p.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  const panel=p.x>.36&&p.x<4.20&&p.y>1.61&&p.y<3.78&&p.z>-3.75&&p.z<-3.59;
  const feet=((p.x>.87&&p.x<.95)||(p.x>3.65&&p.x<3.73))&&p.y>1.40&&p.y<1.62&&p.z>-3.96&&p.z<-3.38;
  remove[i]=panel||feet?1:0;
 }
 const kept=[];for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(remove[a]&&remove[b]&&remove[c])removed++;else kept.push(a,b,c);}
 mesh.geometry=geo.clone();mesh.geometry.setIndex(kept);mesh.geometry.computeBoundingSphere();
 return removed;
}
function image(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Image unavailable: '+src));img.src=src;});}
function canvasTexture(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;texture.anisotropy=4;return {canvas,ctx:canvas.getContext('2d'),texture};}
function fit(ctx,img,x,y,w,h){const k=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*k)/2,y+(h-img.height*k)/2,img.width*k,img.height*k);}

export async function createRoom(host,content,{onCertificate,onSong,onReady}={}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const canvas=renderer.domElement;canvas.className='sp-room-canvas';canvas.setAttribute('aria-label','Shlok’s 3D room. Scroll through certificates on the PC; select the laptop to choose music.');host.prepend(canvas);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c6a2a1');
 const camera=new THREE.PerspectiveCamera(58,1,.05,80);
 const draco=new DRACOLoader();draco.setDecoderPath(base+'draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 const textures=new THREE.TextureLoader();
 let disposed=false,frame=0,progress=0,active=false,laptopMode=false,time=0,lastStamp=0,lastCert=-1,lastDraw=-1,selectedSong=0;
 const [room,chair,clock,day,night,light,certImages,logoImages]=await Promise.all([
  loader.loadAsync(base+'RoomModel.glb'),loader.loadAsync(base+'chairtopDraco.glb'),loader.loadAsync(base+'clock.glb'),
  textures.loadAsync(base+'bakedTextureDaycmp.webp'),textures.loadAsync(base+'roomTextureNightcmp.webp'),textures.loadAsync(base+'roomTextureLightMapcmp.webp'),Promise.all(content.projects.map(c=>image(c.image))),Promise.all(content.songs.map(s=>s.logo?image(s.logo):Promise.resolve(null)))
 ]);
 for(const t of [day,night,light]){t.flipY=false;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 const baked=new THREE.ShaderMaterial({uniforms:{dayMap:{value:day},nightMap:{value:night},lightMap:{value:light}},vertexShader:vertex,fragmentShader:bakedFragment});
 const source=room.scene;source.updateMatrixWorld(true);
 let removedTriangles=0;
 for(const name of ['roomFurniture','deskShelfStuf']){const mesh=source.getObjectByName(name);if(name==='deskShelfStuf')removedTriangles=removeTelevision(mesh);mesh.material=baked;scene.add(mesh);}
 const chairMesh=chair.scene.getObjectByName('chairTop');chairMesh.material=baked;scene.add(chairMesh);const chairRotation=chairMesh.rotation.y;
 const windowMesh=source.getObjectByName('window');windowMesh.material=new THREE.MeshBasicMaterial({color:'#ffdeb3',toneMapped:false});scene.add(windowMesh);
 // No author photos, photo-frame display texture, TV, emulator, or wall profile icons are imported.
 const certificate=canvasTexture(1800,1014),laptop=canvasTexture(1200,720);
 const uniforms={screen:{value:certificate.texture},dissolve:{value:0},time:{value:0}};
 const monitor=source.getObjectByName('monitor');monitor.material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:screenFragment,side:THREE.DoubleSide});scene.add(monitor);
 laptop.texture.flipY = false;
 const musicScreen=source.getObjectByName('laptop');musicScreen.material=new THREE.MeshBasicMaterial({map:laptop.texture,toneMapped:false,side:THREE.DoubleSide});scene.add(musicScreen);
 const phone=source.getObjectByName('smartphoneDisp');phone.material=new THREE.MeshBasicMaterial({color:'#1b2435'});scene.add(phone);
 const hands=[];for(const name of ['clockHour','clockMinute','clockSecond']){const mesh=clock.scene.getObjectByName(name);mesh.material=new THREE.MeshBasicMaterial({color:'#181926'});scene.add(mesh);hands.push(mesh);}
 // Continue the room surfaces beyond the cutaway edges, avoiding a floating diorama / empty border.
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshBasicMaterial({color:'#9e674c'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.035;scene.add(floor);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(70,20),new THREE.MeshBasicMaterial({color:'#b47d81'}));back.rotation.y=Math.PI;back.position.set(0,5,4.33);scene.add(back);
 const left=new THREE.Mesh(new THREE.PlaneGeometry(70,20),new THREE.MeshBasicMaterial({color:'#d0cbc1'}));left.rotation.y=Math.PI/2;left.position.set(-5.60,5,0);scene.add(left);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),target=new THREE.Vector3(),desiredPos=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
 const monitorCenter=new THREE.Box3().setFromObject(monitor).getCenter(new THREE.Vector3());
 const laptopCenter=new THREE.Box3().setFromObject(musicScreen).getCenter(new THREE.Vector3());
 let width=1,height=1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){width=host.clientWidth||innerWidth;height=host.clientHeight||innerHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);if(active)start();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
 function drawMusic(){
  const c=laptop.ctx,w=1200,h=720;
  c.save();c.translate(w/2,h/2);c.scale(-1,-1);c.translate(-w/2,-h/2);
  c.fillStyle='#111625';c.fillRect(0,0,w,h);c.fillStyle='#1db954';c.font='bold 22px monospace';c.fillText("SPOTIFY / SHLOK'S MIX",65,64);
  c.fillStyle='#ffffff';c.font='bold 53px sans-serif';c.fillText('On repeat.',65,138);c.fillStyle='#9bacbe';c.font='24px sans-serif';c.fillText('A soundtrack for curiosity.',65,179);
  content.songs.forEach((song,i)=>{
   const y=229+i*137;
   c.fillStyle=i===selectedSong?'#282828':'#121212';
   c.fillRect(48,y,1104,118);
   
   c.fillStyle=i===selectedSong?'#1db954':'#b3b3b3';c.font='31px monospace';c.fillText(i===selectedSong?'▶':String(i+1).padStart(2,'0'),78,y+67);

   if(logoImages && logoImages[i]) {
     c.save(); c.beginPath(); c.roundRect(140,y+19,80,80,8); c.clip();
     c.drawImage(logoImages[i],140,y+19,80,80); c.restore();
   }
   c.fillStyle=i===selectedSong?'#1db954':'#ffffff';c.font='bold 32px sans-serif';c.fillText(song.title,245,y+49);
   c.fillStyle='#b3b3b3';c.font='21px sans-serif';c.fillText(song.artist,245,y+86);
  });
  c.restore();
  laptop.texture.needsUpdate=true;
 }
 function drawCertificates(value){
  const sequence=range(value,.385,.545)*(content.projects.length-1),i=Math.min(content.projects.length-1,Math.floor(sequence)),fraction=smooth(range(sequence-i,.55,1));
  const c=certificate.ctx,w=1800,h=1014;
  c.fillStyle='#dfe1e5';c.fillRect(0,0,w,45);
  c.fillStyle='#ffffff';c.beginPath();c.roundRect(16,8,280,37,[8,8,0,0]);c.fill();
  c.fillStyle='#ffffff';c.fillRect(0,45,w,50);
  c.fillStyle='#f1f3f4';c.beginPath();c.roundRect(100,55,w-200,30,15);c.fill();
  c.save();c.beginPath();c.rect(0,95,w,h-95);c.clip();
  for(let n=i;n<=Math.min(i+1,content.projects.length-1);n++){const x=(n-i-fraction)*w;fit(c,certImages[n],x,95,w,h-95);}
  c.restore();
  const current=fraction>.5?Math.min(i+1,content.projects.length-1):i;
  
  // Draw buttons on bottom right
  c.fillStyle='#181717'; c.beginPath(); c.roundRect(w-320, h-80, 140, 50, 5); c.fill();
  c.fillStyle='white'; c.font='bold 18px sans-serif'; c.fillText('Website', w-285, h-49);
  
  c.fillStyle='#181717'; c.beginPath(); c.roundRect(w-160, h-80, 140, 50, 5); c.fill();
  c.fillStyle='white'; c.font='bold 18px sans-serif'; c.fillText('GitHub', w-122, h-49);

  c.fillStyle='#3c4043';c.font='18px sans-serif';c.fillText(content.projects[current].title, 32, 33);
  c.fillStyle='#5f6368';c.font='16px monospace';c.fillText(content.projects[current].url || `https://${content.projects[current].title.toLowerCase().replace(/[^a-z0-9]/g,'')}.example.com`, 115, 76);
  certificate.texture.needsUpdate=true;
  if(current!==lastCert){lastCert=current;onCertificate?.(current, true);host.dataset.certificate=String(current);}
 }
 function pose(){
  const portrait=camera.aspect<.85;
  // A close interior view, not the original small room on a purple backdrop.
  const widePos=new THREE.Vector3(portrait?2.4:3.6,portrait?3.6:3.7,-3.5);
  const wideTarget=new THREE.Vector3(portrait?.5:-.6,portrait?2.35:1.9,2.2);
  const zoom=smooth(range(progress,.35,.385));
  const dist=Math.max(1.60,1.96/(2*Math.tan(THREE.MathUtils.degToRad(58)/2)*camera.aspect)*1.17);
  const close=monitorCenter.clone().add(new THREE.Vector3(.03,.07,-dist));
  desiredPos.copy(widePos).lerp(close,zoom);desiredTarget.copy(wideTarget).lerp(monitorCenter,zoom);
  if(laptopMode){desiredTarget.copy(laptopCenter);desiredPos.copy(laptopCenter).add(new THREE.Vector3(1.85,1.05,-1.30).multiplyScalar(portrait?1.22:1));}
 }
 function tick(stamp){frame=0;if(disposed||!active||document.hidden)return;const dt=Math.min((stamp-lastStamp)/1000||.016,.05);lastStamp=stamp;time+=dt;
  pose();const damping=1-Math.exp(-dt*5);camera.position.lerp(desiredPos,damping);target.lerp(desiredTarget,damping);camera.lookAt(target);
  if(Math.abs(lastDraw-progress)>.000025){drawCertificates(progress);lastDraw=progress;}
  uniforms.time.value=time;uniforms.dissolve.value=smooth(range(progress,.550,.566));
  if(!reduced)chairMesh.rotation.y=chairRotation+Math.sin(time*.38)*.025;
  const date=new Date(),sec=date.getSeconds()+date.getMilliseconds()/1000,min=date.getMinutes()+sec/60,hrs=date.getHours()+min/60;
  [hrs*30,min*6,sec*6].forEach((a,i)=>hands[i].rotation.z=THREE.MathUtils.degToRad(a));
  renderer.render(scene,camera);frame=requestAnimationFrame(tick);
 }
 function start(){if(!frame&&!disposed&&active&&!document.hidden){lastStamp=performance.now();frame=requestAnimationFrame(tick);}}
 function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects([monitor,musicScreen],false)[0];}
 function click(event){
  const h=hit(event);if(!h){laptopMode=false;host.dataset.focus='room';return;}
  if(h.object===monitor){
   let px = (1 - h.uv.x) * 1800;
   let py = (1 - h.uv.y) * 1014;
   const proj = content.projects[lastCert];
   if(px > 1800-320 && px < 1800-180 && py > 1014-80 && py < 1014-30 && proj.url) {
    const a = document.createElement('a'); a.href = proj.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
   } else if (px > 1800-160 && px < 1800-20 && py > 1014-80 && py < 1014-30 && proj.repository) {
    const a = document.createElement('a'); a.href = proj.repository; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
   }
   return;
  }
  if(!laptopMode){laptopMode=true;host.dataset.focus='laptop';return;}
  const row=Math.floor(((h.uv.y)*720-229)/137);
  if(row>=0&&row<content.songs.length){selectedSong=row;drawMusic();onSong?.(row);}
 }
 function move(event){canvas.style.cursor=hit(event)?'pointer':'default';}
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();}
 canvas.addEventListener('click',click);canvas.addEventListener('pointermove',move);document.addEventListener('visibilitychange',visibility);
 drawMusic();drawCertificates(.385);pose();camera.position.copy(desiredPos);target.copy(desiredTarget);camera.lookAt(target);renderer.render(scene,camera);
 host.dataset.roomReady='true';host.dataset.removedTvTriangles=String(removedTriangles);onReady?.();draco.dispose();
 return {
  setProgress(p){if(Math.abs(p-progress)>.0003){laptopMode=false;host.dataset.focus='room';}progress=p;},
  setActive(value){active=value;if(active)start();else{cancelAnimationFrame(frame);frame=0;}},
  focusLaptop(){laptopMode=true;host.dataset.focus='laptop';start();},
  selectSong(i){selectedSong=i;drawMusic();},
  dispose(){disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('click',click);canvas.removeEventListener('pointermove',move);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());[day,night,light,certificate.texture,laptop.texture].forEach(t=>t.dispose());renderer.dispose();canvas.remove();}
 };
}
