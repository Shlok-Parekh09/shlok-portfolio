import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createRoomTV } from './room-tv.js';
import {LIST_TOP,LIST_BOTTOM,ROW_HEIGHT,maxScroll,clampScroll,laptopPoint,songAt} from './laptop-scroll.js';
import {PIKACHU_HEIGHT,PIKACHU_POSITION} from './pikachu-layout.js';
import {isConsoleSetup} from './room-cutouts.js';

const base='/portfolio/room/';
const clamp=x=>Math.max(0,Math.min(1,x));
const range=(p,a,b)=>clamp((p-a)/(b-a));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const bakedFragment=`varying vec2 vUv;uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D lightMap;uniform float nightMix;void main(){vec3 c=mix(texture2D(dayMap,vUv).rgb,texture2D(nightMap,vUv).rgb,nightMix);vec3 l=texture2D(lightMap,vUv).rgb;c=mix(c,max(c,vec3(1.,.13,.35)),l.r*.45);c=mix(c,max(c,vec3(1.,.44,.21)),l.g*.7);c=mix(c,max(c,vec3(.29,.49,1.)),l.b*.65);gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>
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
  // Remove the three actual shelf photo-frame casings as well as their pictures.
  // These measured bounds exclude the clock, books, plants, and chess pieces.
  const frame=(p.x>3.47&&p.x<4.10&&p.y>3.68&&p.y<4.42&&p.z>3.60&&p.z<4.13)
    ||(p.x>.70&&p.x<1.19&&p.y>4.49&&p.y<5.11&&p.z>3.69&&p.z<4.12)
    ||(p.x>3.12&&p.x<3.52&&p.y>3.68&&p.y<4.19&&p.z>3.64&&p.z<4.10);
  const consoleSetup=p.y>.150&&isConsoleSetup(p);
  remove[i]=(mesh.name==='deskShelfStuf'&&(panel||feet||frame))||consoleSetup?1:0;
 }
 const kept=[];for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(remove[a]&&remove[b]&&remove[c])removed++;else kept.push(a,b,c);}
 mesh.geometry=geo.clone();mesh.geometry.setIndex(kept);mesh.geometry.computeBoundingSphere();
 return removed;
}
function image(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Image unavailable: '+src));img.src=src;});}
function canvasTexture(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;texture.anisotropy=4;return {canvas,ctx:canvas.getContext('2d'),texture};}
function fit(ctx,img,x,y,w,h){const k=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*k)/2,y+(h-img.height*k)/2,img.width*k,img.height*k);}

export async function createRoom(host,content,{onCertificate,onSong,onReady,onLaptopFocus}={}){
 const mobile=matchMedia('(max-width: 768px), (pointer: coarse)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const canvas=renderer.domElement;canvas.className='sp-room-canvas';canvas.setAttribute('aria-label','Shlok’s 3D room. Scroll through certificates on the PC; select the laptop to choose music.');host.prepend(canvas);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c6a2a1');
 const camera=new THREE.PerspectiveCamera(58,1,.05,80);
 const draco=new DRACOLoader();draco.setDecoderPath(base+'draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 const textures=new THREE.TextureLoader();
 let disposed=false,frame=0,progress=0,active=false,laptopMode=false,time=0,lastStamp=0,lastCert=-1,lastDraw=-1,selectedSong=0,musicScroll=0,touchY=null,touchStartY=0,ignoreClickUntil=0;
 const [room,chair,clock,day,night,light,certImages,logoImages]=await Promise.all([
  loader.loadAsync(base+'RoomModel.glb'),loader.loadAsync(base+'chairtopDraco.glb'),loader.loadAsync(base+'clock.glb'),
  textures.loadAsync(base+'bakedTextureDaycmp.webp'),textures.loadAsync(base+'roomTextureNightcmp.webp'),textures.loadAsync(base+'roomTextureLightMapcmp.webp'),Promise.all(content.projects.map(c=>image(c.image))),Promise.all(content.songs.map(s=>s.logo?image(s.logo):Promise.resolve(null)))
 ]);
 for(const t of [day,night,light]){t.flipY=false;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 let nightTarget=0;
 // Resample a clean plank in the atlas where the removed console's baked shadow
 // remains. This modifies the existing floor surface, not an overlay/platform.
 const floorVertex=vertex.replace('varying vec2 vUv;','varying vec2 vUv; varying vec3 floorWorld;').replace('vUv=uv;','vUv=uv;floorWorld=(modelMatrix*vec4(position,1.)).xyz;');
 const floorFragment=bakedFragment.replace('varying vec2 vUv;','varying vec2 vUv; varying vec3 floorWorld;').replace('void main(){','void main(){vec2 sampleUv=vUv;if(floorWorld.y>.125&&floorWorld.y<.135&&floorWorld.x>-.15&&floorWorld.x<5.28&&floorWorld.z< -2.80&&floorWorld.z> -4.061){vec2 tile=fract(vec2((floorWorld.x+.9634)/3.723,(floorWorld.z+4.0543)/.6258));sampleUv=vec2(mix(.180,.270,tile.x),mix(.309,.315,tile.y));}').replaceAll('texture2D(dayMap,vUv)','texture2D(dayMap,sampleUv)').replaceAll('texture2D(nightMap,vUv)','texture2D(nightMap,sampleUv)').replaceAll('texture2D(lightMap,vUv)','texture2D(lightMap,sampleUv)');
 // Use the authored wood and its day/night lighting, without a flat colour override.
 const baked=new THREE.ShaderMaterial({uniforms:{dayMap:{value:day},nightMap:{value:night},lightMap:{value:light},nightMix:{value:0}},vertexShader:floorVertex,fragmentShader:floorFragment.replaceAll('floorWorld.y<.135','floorWorld.y<.151')});
 const source=room.scene;source.updateMatrixWorld(true);
 let removedTriangles=0;
 for(const name of ['roomFurniture','deskShelfStuf']){const mesh=source.getObjectByName(name);removedTriangles+=removeTelevision(mesh);mesh.material=baked;scene.add(mesh);}
 const chairMesh=chair.scene.getObjectByName('chairTop');chairMesh.material=baked;scene.add(chairMesh);const chairRotation=chairMesh.rotation.y;
 const windowMesh=source.getObjectByName('window');
 // Map a continuous landscape across the actual glass geometry, not its baked atlas UVs.
 windowMesh.geometry=windowMesh.geometry.clone();windowMesh.geometry.computeBoundingBox();
 const windowBounds=windowMesh.geometry.boundingBox,windowSize=windowBounds.getSize(new THREE.Vector3());
 const horizontal=windowSize.x>windowSize.z?'x':'z',windowPositions=windowMesh.geometry.attributes.position;
 const windowUV=new Float32Array(windowPositions.count*2),windowPoint=new THREE.Vector3();
 for(let i=0;i<windowPositions.count;i++){windowPoint.fromBufferAttribute(windowPositions,i);windowUV[i*2]=(windowPoint[horizontal]-windowBounds.min[horizontal])/windowSize[horizontal];windowUV[i*2+1]=(windowPoint.y-windowBounds.min.y)/windowSize.y;}
 windowMesh.geometry.setAttribute('uv',new THREE.BufferAttribute(windowUV,2));
 windowMesh.material=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false});scene.add(windowMesh);
 textures.load('/portfolio/environment/himalayan-window.webp',texture=>{
  if(disposed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  windowMesh.material.map=texture;windowMesh.material.needsUpdate=true;
 });
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
 const tv=createRoomTV(scene,content.roomTV);
 let pikachu=null,mixer=null,musicPlaying=false,musicTitle='',groundCharacter=()=>{};
 const characterFill=new THREE.HemisphereLight('#e9f4ff','#a18b69',2.0);scene.add(characterFill);
 const characterKey=new THREE.DirectionalLight('#fff1db',2.4);characterKey.position.set(6,7,0);characterKey.target.position.set(...PIKACHU_POSITION);scene.add(characterKey,characterKey.target);
 characterKey.castShadow=true;characterKey.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);Object.assign(characterKey.shadow.camera,{left:-1.3,right:1.3,top:1.3,bottom:-1.3,near:.1,far:15});characterKey.shadow.bias=-.0003;characterKey.shadow.normalBias=.015;characterKey.shadow.radius=3;
 const shelfShadow=new THREE.Mesh(new THREE.PlaneGeometry(.85,.48),new THREE.ShadowMaterial({opacity:.22,depthWrite:false}));shelfShadow.rotation.x=-Math.PI/2;shelfShadow.position.set(3.64,3.734,3.76);shelfShadow.receiveShadow=true;scene.add(shelfShadow);
 new GLTFLoader().load('/portfolio/models/pikachu-dancing.glb',g=>{
  if(disposed)return;
  pikachu=g.scene;
  mixer=new THREE.AnimationMixer(pikachu);
  const clip=g.animations.find(c=>/mixamo|danc/i.test(c.name))||g.animations[0];
  if(clip)mixer.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();
  mixer.update(0);pikachu.updateMatrixWorld(true);
  pikachu.traverse(o=>{if(o.isSkinnedMesh)o.computeBoundingBox();});
  const box=new THREE.Box3().setFromObject(pikachu),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=PIKACHU_HEIGHT/size.y;
  // White pen cup: x=2.73–3.10, base y=3.733, z=3.73–4.00.
  // Separate non-animated normalization group keeps the imported rig untouched.
  const mount=new THREE.Group(),normalized=new THREE.Group();
  mount.position.set(...PIKACHU_POSITION);mount.rotation.y=Math.PI;scene.add(mount);
  normalized.scale.setScalar(scale);normalized.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);mount.add(normalized);normalized.add(pikachu);
  // Dedicated fill/key lights shade the character without relighting the baked room.
  const characterMaterials=new Map();
  const litAlbedo=m=>{if(!characterMaterials.has(m)){if(m.map)m.map.colorSpace=THREE.SRGBColorSpace;characterMaterials.set(m,new THREE.MeshStandardMaterial({map:m.map,color:m.color,roughness:.86,metalness:0,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest}));}return characterMaterials.get(m);};
  pikachu.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(litAlbedo):litAlbedo(o.material);}});
  // Correct root drift using the animated foot bones; no per-frame mesh scans.
  const feet=['LFoot','RFoot','LToe','RToe'].map(name=>pikachu.getObjectByName(name)).filter(Boolean),footPoint=new THREE.Vector3();
  mount.updateMatrixWorld(true);
  const footHeight=()=>Math.min(...feet.map(foot=>foot.getWorldPosition(footPoint).y));
  const restFoot=feet.length?footHeight():0;
  groundCharacter=()=>{if(!feet.length)return;mount.position.y=PIKACHU_POSITION[1];mount.updateMatrixWorld(true);mount.position.y+=restFoot-footHeight();};
  host.dataset.pikachuClip=clip?.name||'missing';
 },undefined,error=>console.warn('Pikachu could not load',error));
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),target=new THREE.Vector3(),desiredPos=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
 const monitorCenter=new THREE.Box3().setFromObject(monitor).getCenter(new THREE.Vector3());
 const monitorBounds=new THREE.Box3().setFromObject(monitor);
 const monitorCorners=[];
 for(const x of [monitorBounds.min.x,monitorBounds.max.x])for(const y of [monitorBounds.min.y,monitorBounds.max.y])for(const z of [monitorBounds.min.z,monitorBounds.max.z])monitorCorners.push(new THREE.Vector3(x,y,z));
 const projectedCorner=new THREE.Vector3();let clipKey='',lastNight=-1,lastDance=null;
 const nightColors=['#30496e','#342944','#333b54','#312938'].map(c=>new THREE.Color(c));
 const laptopCenter=new THREE.Box3().setFromObject(musicScreen).getCenter(new THREE.Vector3());
 let width=1,height=1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){width=host.clientWidth||innerWidth;height=host.clientHeight||innerHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);if(active)start();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
 function drawMusic(){
  const c=laptop.ctx,w=1200,h=720;
  c.save();c.translate(w/2,h/2);c.scale(-1,-1);c.translate(-w/2,-h/2);
  c.fillStyle='#111625';c.fillRect(0,0,w,h);c.fillStyle='#1db954';c.font='bold 22px monospace';c.fillText("SPOTIFY / SHLOK'S MIX",65,64);
  c.fillStyle='#ffffff';c.font='bold 53px sans-serif';c.fillText('On repeat.',65,138);c.fillStyle='#9bacbe';c.font='24px sans-serif';c.fillText('A soundtrack for curiosity.',65,179);
  c.fillStyle='#d2d8de';c.font='20px monospace';c.textAlign='right';c.fillText(laptopMode?'← BACK TO ROOM':'',1135,64);c.textAlign='left';
  c.save();c.beginPath();c.rect(48,LIST_TOP,1104,LIST_BOTTOM-LIST_TOP);c.clip();
  content.songs.forEach((song,i)=>{
   const y=LIST_TOP+i*ROW_HEIGHT-musicScroll;if(y+ROW_HEIGHT<LIST_TOP||y>LIST_BOTTOM)return;
   c.fillStyle=i===selectedSong?'#282828':'#121212';
   c.fillRect(48,y,1104,ROW_HEIGHT-4);
   
   c.fillStyle=i===selectedSong?'#1db954':'#b3b3b3';c.font='31px monospace';c.fillText(i===selectedSong?'▶':String(i+1).padStart(2,'0'),78,y+67);

   if(logoImages && logoImages[i]) {
     c.save(); c.beginPath(); c.roundRect(140,y+19,80,80,8); c.clip();
     c.drawImage(logoImages[i],140,y+19,80,80); c.restore();
   }
   c.fillStyle=i===selectedSong?'#1db954':'#ffffff';c.font='bold 32px sans-serif';c.fillText(song.title,245,y+49);
   c.fillStyle='#b3b3b3';c.font='21px sans-serif';c.fillText(song.artist,245,y+86);
  });
  c.restore();
  const max=maxScroll(content.songs.length),thumb=Math.max(32,(LIST_BOTTOM-LIST_TOP)**2/(content.songs.length*ROW_HEIGHT));
  c.fillStyle='#60656b';c.fillRect(1165,LIST_TOP+(max?musicScroll/max:0)*(LIST_BOTTOM-LIST_TOP-thumb),7,thumb);
  c.fillStyle='#9bacbe';c.font='20px monospace';c.fillText(laptopMode?'Scroll / swipe here · tap a song · tap outside to leave':'Click laptop to browse all '+content.songs.length+' songs',65,702);
  c.restore();
  laptop.texture.needsUpdate=true;
 }
 function drawCertificates(value){
  const count=content.projects.length;
  const sequence=range(value,.385,.525)*(count-1),i=Math.min(count-1,Math.floor(sequence)),fraction=smooth(range(sequence-i,.55,1));
  const drawKey=`${i}:${fraction.toFixed(3)}:${value<.535}`;
  if(drawCertificates.key===drawKey)return;drawCertificates.key=drawKey;
  const c=certificate.ctx,w=1800,h=1014;
  c.fillStyle='#edf0f5';c.fillRect(0,0,w,h);
  c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
  for(let n=i;n<=Math.min(i+1,count-1);n++)fit(c,certImages[n],(n-i-fraction)*w,0,w,h);
  c.restore();
  const shown=fraction>.5?Math.min(i+1,count-1):i;
  if(value<.535){
   c.fillStyle='#181717';c.fillRect(w-320,h-80,140,50);c.fillRect(w-160,h-80,140,50);
   c.fillStyle='#fff';c.font='bold 18px sans-serif';c.fillText('Website',w-285,h-49);c.fillText('GitHub',w-122,h-49);
  }
  certificate.texture.needsUpdate=true;
  if(shown!==lastCert){lastCert=shown;onCertificate?.(shown,true);host.dataset.certificate=String(shown);}
 }
 function pose(){
  const portrait=camera.aspect<.85;
  // A close interior view, not the original small room on a purple backdrop.
  // Back up and look toward the floor's center: the chess table must stay in
  // frame along with the desk, bed, board-TV, and beanbag before the PC zoom.
  const wideTarget=new THREE.Vector3(-.20,2.05,.10);
  const widePos=new THREE.Vector3(portrait?11.6:8.0,portrait?9.0:6.8,portrait?-13.2:-9.0);
  const zoom=smooth(range(progress,.359,.385));
  const dist=Math.max(1.60,1.96/(2*Math.tan(THREE.MathUtils.degToRad(58)/2)*camera.aspect)*1.17);
  const close=monitorCenter.clone().add(new THREE.Vector3(.03,.07,-dist));
  desiredPos.copy(widePos).lerp(close,zoom);desiredTarget.copy(wideTarget).lerp(monitorCenter,zoom);
  // Stop in front of the glass; its projected bounds expand to the viewport below.
  if(laptopMode){desiredTarget.copy(laptopCenter);desiredPos.copy(laptopCenter).add(new THREE.Vector3(1.85,1.05,-1.30).multiplyScalar(portrait?1.22:1));}
 }
 function tick(stamp){frame=0;if(disposed||!active||document.hidden)return;const dt=Math.min((stamp-lastStamp)/1000||.016,.05);lastStamp=stamp;time+=dt;
  pose();const damping=1-Math.exp(-dt*5);if(laptopMode){camera.position.lerp(desiredPos,damping);target.lerp(desiredTarget,damping);}else{camera.position.copy(desiredPos);target.copy(desiredTarget);}camera.lookAt(target);
  if(Math.abs(lastDraw-progress)>.000025){drawCertificates(progress);lastDraw=progress;}
  uniforms.dissolve.value=0;
  const nextClipKey=progress>=.535?`${progress.toFixed(6)}:${width}:${height}`:'none';
  if(nextClipKey!==clipKey){clipKey=nextClipKey;
  const expand=smooth(range(progress,.548,.583));
  camera.updateMatrixWorld();monitor.updateMatrixWorld(true);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const corner of monitorCorners){projectedCorner.copy(corner).project(camera);minX=Math.min(minX,projectedCorner.x);maxX=Math.max(maxX,projectedCorner.x);minY=Math.min(minY,projectedCorner.y);maxY=Math.max(maxY,projectedCorner.y);}
  const l=(minX+1)*width/2,r=(maxX+1)*width/2,top=(1-maxY)*height/2,bottom=(1-minY)*height/2;
  // Cut a rectangular aperture through the room to the actual live realm below.
  // It opens inside the monitor first, then grows diagonally to all four edges.
  if(progress>=.535){
   const opening=smooth(range(progress,.535,.548)),cx=(l+r)/2,cy=(top+bottom)/2;
   const x0=(cx+(l-cx)*opening)*(1-expand),x1=(cx+(r-cx)*opening)*(1-expand)+width*expand;
   const y0=(cy+(top-cy)*opening)*(1-expand),y1=(cy+(bottom-cy)*opening)*(1-expand)+height*expand;
   host.style.clipPath=`polygon(evenodd,0px 0px,${width}px 0px,${width}px ${height}px,0px ${height}px,0px 0px,${x0}px ${y0}px,${x1}px ${y0}px,${x1}px ${y1}px,${x0}px ${y1}px,${x0}px ${y0}px)`;
  }else host.style.clipPath='none';
  }
  const dancing=musicPlaying&&!/namo\s*namo/i.test(musicTitle);
  if(mixer&&dancing){mixer.update(dt);groundCharacter();}
  if(lastDance!==dancing){lastDance=dancing;host.dataset.pikachuState=dancing?'dancing':'still';}
  baked.uniforms.nightMix.value+=(nightTarget-baked.uniforms.nightMix.value)*damping;
  const night=baked.uniforms.nightMix.value;
  if(Math.abs(night-lastNight)>.0001){lastNight=night;
   characterKey.intensity=2.4-night*1.25;characterFill.intensity=2-night*.8;
   windowMesh.material.color.set('#ffffff').lerp(nightColors[0],night);
   back.material.color.set('#b47d81').lerp(nightColors[1],night);
   left.material.color.set('#d0cbc1').lerp(nightColors[2],night);
   floor.material.color.set('#9e674c').lerp(nightColors[3],night);
  }
  if(!reduced)chairMesh.rotation.y=chairRotation+Math.sin(time*.38)*.025;
  const date=new Date(),sec=date.getSeconds()+date.getMilliseconds()/1000,min=date.getMinutes()+sec/60,hrs=date.getHours()+min/60;
  [hrs*30,min*6,sec*6].forEach((a,i)=>hands[i].rotation.z=THREE.MathUtils.degToRad(a));
  renderer.render(scene,camera);frame=requestAnimationFrame(tick);
 }
 function start(){if(!frame&&!disposed&&active&&!document.hidden){lastStamp=performance.now();frame=requestAnimationFrame(tick);}}
 function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects([monitor,musicScreen],false)[0];}
 function click(event){
  if(performance.now()<ignoreClickUntil)return;
  const h=hit(event);if(!h){setLaptopMode(false);return;}
  if(laptopMode&&h.object!==musicScreen){setLaptopMode(false);return;}
  if(h.object===monitor){
   if(progress>=.535)return;
   const project=content.projects[lastCert],px=(1-h.uv.x)*1800,py=(1-h.uv.y)*1014;
   const url=py>934&&py<984?(px>1480&&px<1620?project?.url:px>1640&&px<1780?project?.repository:null):null;
   if(url)window.open(url,'_blank','noopener,noreferrer');return;
  }
  if(!laptopMode){setLaptopMode(true);return;}
  const point=laptopPoint(h.uv);host.dataset.laptopHit=`${Math.round(point.x)},${Math.round(point.y)}`;if(point.y<100&&point.x>850){setLaptopMode(false);return;}
  const row=songAt(h.uv,musicScroll,content.songs.length);
  if(row>=0&&row<content.songs.length){selectedSong=row;host.dataset.selectedSong=content.songs[row].title;drawMusic();onSong?.(row);}
 }
 function move(event){canvas.style.cursor=hit(event)?'pointer':'default';}
 function setLaptopMode(value){if(laptopMode===value)return;laptopMode=value;host.dataset.focus=value?'laptop':'room';canvas.style.touchAction=value?'none':'pan-y';onLaptopFocus?.(value);drawMusic();}
 function scrollMusic(delta){musicScroll=clampScroll(musicScroll+delta,content.songs.length);drawMusic();}
 function wheel(event){if(!laptopMode)return;event.preventDefault();event.stopImmediatePropagation();scrollMusic(event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?440:1));}
 function touchStart(event){if(!laptopMode||event.touches.length!==1)return;touchY=touchStartY=event.touches[0].clientY;event.stopPropagation();}
 function touchMove(event){if(!laptopMode||touchY===null||!event.touches[0])return;event.preventDefault();event.stopImmediatePropagation();const y=event.touches[0].clientY;scrollMusic((touchY-y)*720/(height*.6));touchY=y;if(Math.abs(y-touchStartY)>5)ignoreClickUntil=performance.now()+400;}
 function touchEnd(){touchY=null;}
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();}
 canvas.addEventListener('click',click);canvas.addEventListener('pointermove',move);document.addEventListener('visibilitychange',visibility);
 canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('touchstart',touchStart,{passive:true});canvas.addEventListener('touchmove',touchMove,{passive:false});canvas.addEventListener('touchend',touchEnd);canvas.addEventListener('touchcancel',touchEnd);
 drawMusic();drawCertificates(.385);pose();camera.position.copy(desiredPos);target.copy(desiredTarget);camera.lookAt(target);renderer.render(scene,camera);
 host.dataset.roomReady='true';host.dataset.removedTvTriangles=String(removedTriangles);onReady?.();draco.dispose();
 return {
  setProgress(p){if(Math.abs(p-progress)>.0003)setLaptopMode(false);progress=p;},
  setActive(value){active=value;tv.setActive(value);host.dataset.tvState=tv.status.state;if(active)start();else{cancelAnimationFrame(frame);frame=0;}},
  setMusicState(playing,title){musicPlaying=playing;musicTitle=title;},
  setNight(value){nightTarget=value?1:0;host.dataset.lighting=value?'night':'morning';},
  blurLaptop(){setLaptopMode(false);},
  focusLaptop(){setLaptopMode(true);start();},
  selectSong(i){selectedSong=i;if(i*ROW_HEIGHT<musicScroll)musicScroll=i*ROW_HEIGHT;else if((i+1)*ROW_HEIGHT>musicScroll+LIST_BOTTOM-LIST_TOP)musicScroll=(i+1)*ROW_HEIGHT-(LIST_BOTTOM-LIST_TOP);musicScroll=clampScroll(musicScroll,content.songs.length);drawMusic();},
  dispose(){disposed=true;cancelAnimationFrame(frame);mixer?.stopAllAction();tv.dispose();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('click',click);canvas.removeEventListener('pointermove',move);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());[day,night,light,certificate.texture,laptop.texture].forEach(t=>t.dispose());renderer.dispose();canvas.remove();}
 };
}
