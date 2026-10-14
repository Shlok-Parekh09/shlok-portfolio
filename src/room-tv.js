import * as THREE from 'three';

// A locally supplied or explicitly permitted direct video URL can be set in
// portfolio-content.js. No episode is scraped, downloaded, or silently substituted.
export function createRoomTV(scene,config={}){
 const group=new THREE.Group();group.name='TV replacing the photo board';group.position.set(-5.17,2.92,-1.94);group.rotation.y=Math.PI/2;scene.add(group);
 const bezel=new THREE.Mesh(new THREE.BoxGeometry(2.93,1.73,.10),new THREE.MeshBasicMaterial({color:'#131922'}));group.add(bezel);
 const poster=document.createElement('canvas');poster.width=1280;poster.height=720;const c=poster.getContext('2d');
 const g=c.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#16273c');g.addColorStop(1,'#080d19');c.fillStyle=g;c.fillRect(0,0,1280,720);
 c.textAlign='center';c.fillStyle='#a9cde8';c.font='20px monospace';c.fillText('SHLOK / ROOM TV',640,245);c.fillStyle='#f1f5fa';c.font='bold 47px sans-serif';c.fillText('Ash × Alain',640,330);c.fillStyle='#98acc0';c.font='25px sans-serif';c.fillText('Battle video ready to connect',640,394);c.font='19px monospace';c.fillText('Add your permitted video file',640,468);
 const texture=new THREE.CanvasTexture(poster);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.77,1.558),material);screen.position.z=.056;group.add(screen);
 const led=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),new THREE.MeshBasicMaterial({color:'#a9d8ff',toneMapped:false}));led.position.set(1.35,-.83,.059);group.add(led);
 let video=null,videoTexture=null,active=false;
 const status={state:config.src?'loading':'awaiting-video'};
 if(config.src){video=document.createElement('video');video.src=config.src;video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;video.addEventListener('loadeddata',()=>{material.map=videoTexture;material.needsUpdate=true;status.state='playing';});video.addEventListener('error',()=>{material.map=texture;material.needsUpdate=true;status.state='unavailable';});}
 function sync(){if(!video)return;if(active&&!document.hidden)video.play().catch(()=>{status.state='awaiting-gesture';});else video.pause();}
 document.addEventListener('visibilitychange',sync);
 return {status,setActive(v){if(v===active)return;active=v;sync();},dispose(){document.removeEventListener('visibilitychange',sync);video?.pause();if(video){video.removeAttribute('src');video.load();}group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});texture.dispose();videoTexture?.dispose();scene.remove(group);}};
}
