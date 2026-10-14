import * as T from 'three';

// Actual volumes, not flat category icons. Shared cyan materials keep the
// holograms lightweight and readable against the mountain landscape.
export function populateHolograms(groups){
 const shell=new T.MeshBasicMaterial({color:0x35cfff,transparent:true,opacity:.24,depthWrite:false});
 const edge=new T.LineBasicMaterial({color:0xa3f4ff,transparent:true,opacity:.95});
 const glow=new T.MeshBasicMaterial({color:0xc2ffff});
 function mesh(g,geometry,x=0,y=0,z=0,bright=false){const m=new T.Mesh(geometry,bright?glow:shell);m.position.set(x,y,z);g.add(m);if(!bright)m.add(new T.LineSegments(new T.EdgesGeometry(geometry,25),edge));return m;}
 const box=(g,w,h,d,x=0,y=0,z=0)=>mesh(g,new T.BoxGeometry(w,h,d),x,y,z);
 const ball=(g,r,x,y,z)=>mesh(g,new T.SphereGeometry(r,16,12),x,y,z);
 // Binary digits have tube/box depth and occupy three staggered spatial layers.
 for(let layer=0;layer<3;layer++)for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const x=(col-2)*.32,y=(row-1.5)*.36,z=(layer-1)*.34;
  if((col+row+layer)%3===0){box(groups[0],.045,.22,.045,x,y,z);}else{const digit=mesh(groups[0],new T.TorusGeometry(.073,.016,6,16),x,y,z);digit.scale.y=1.5;}
 }
 // Humanoid AI robot: head, faceplate, eyes, antenna, torso, articulated limbs.
 const robot=groups[1];box(robot,.72,.53,.44,0,.56);box(robot,.57,.24,.04,0,.57,.25);
 for(const x of [-.18,.18])mesh(robot,new T.SphereGeometry(.047,12,8),x,.59,.29,true);
 box(robot,.22,.025,.025,0,.43,.29);box(robot,.055,.22,.055,0,.94);ball(robot,.06,0,1.08,0);
 box(robot,.65,.65,.38,0,-.10);ball(robot,.10,0,-.04,.24);
 for(const side of [-1,1]){ball(robot,.12,side*.47,.13,0);box(robot,.16,.48,.19,side*.49,-.2,0);ball(robot,.10,side*.49,-.49,0);box(robot,.19,.38,.22,side*.2,-.65,0);box(robot,.25,.12,.38,side*.2,-.90,.08);}
 // Cryptography: mechanical cipher rotors around a lock and key.
 const crypto=groups[2];box(crypto,.62,.55,.32,0,-.12,.15);
 mesh(crypto,new T.TorusGeometry(.23,.047,8,32,Math.PI),0,.15,.15);
 mesh(crypto,new T.SphereGeometry(.05,12,8),0,-.1,.33,true);box(crypto,.025,.13,.025,0,-.18,.33);
 for(let i=0;i<3;i++){const ring=mesh(crypto,new T.TorusGeometry(.7+i*.13,.015,6,64),0,0,-i*.2);ring.rotation.y=(i-1)*.30;
  for(let j=0;j<16;j++){const a=j*Math.PI/8;box(crypto,.035,.06,.04,Math.cos(a)*(.7+i*.13),Math.sin(a)*(.7+i*.13),-i*.2);}}
 const key=mesh(crypto,new T.TorusGeometry(.1,.027,8,20),.62,-.60,.36);box(crypto,.35,.045,.045,.84,-.60,.36);box(crypto,.04,.12,.045,.93,-.65,.36);
 // Rack server, six individual chassis, drive bays, status lights and fans.
 const server=groups[3];box(server,1.15,1.8,.65);
 for(let row=0;row<6;row++){const y=.72-row*.285;box(server,1.02,.235,.72,0,y,.015);
  for(let k=0;k<3;k++)box(server,.16,.065,.03,-.35+k*.19,y,.39);
  mesh(server,new T.TorusGeometry(.067,.009,6,20),.37,y,.39);mesh(server,new T.SphereGeometry(.022,8,6),.14,y,.40,true);}
 // Globe: longitude / latitude circles and raised land silhouettes.
 const globe=groups[4];mesh(globe,new T.SphereGeometry(.82,24,16));
 for(let i=0;i<8;i++){const circle=mesh(globe,new T.TorusGeometry(.84,.007,4,64));circle.rotation.y=i*Math.PI/8;}
 for(const lat of [-.6,-.3,0,.3,.6]){const circle=mesh(globe,new T.TorusGeometry(Math.sqrt(.84*.84-lat*lat),.007,4,64),0,lat,0);circle.rotation.x=Math.PI/2;}
 const lands=[[-110,45],[-95,30],[-80,10],[-65,-10],[-60,-30],[10,50],[20,25],[20,0],[30,-20],[50,50],[80,40],[110,30],[135,-25]];
 for(const [lon,lat]of lands){const a=lon*Math.PI/180,b=lat*Math.PI/180;ball(globe,.10,.85*Math.cos(b)*Math.sin(a),.85*Math.sin(b),.85*Math.cos(b)*Math.cos(a));}
 // Database stack.
 for(let i=0;i<3;i++)mesh(groups[5],new T.CylinderGeometry(.58,.58,.28,32),0,.4-i*.4,0);
}
