// Amber, rose and violet clock tunnel, colour-matched to the contact horizon.
// Scroll controls depth; real seconds keep the clocks ticking.
const TAU=Math.PI*2;
const fract=x=>x-Math.floor(x);
const random=n=>fract(Math.sin(n*127.1)*43758.5453);

function makeDial(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
 const c=canvas.getContext('2d');c.translate(512,512);
 c.strokeStyle='#eab698';c.fillStyle='#fff0df';c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<60;i++){
  const a=i*TAU/60-Math.PI/2,outer=460,inner=i%5===0?428:446;
  c.lineWidth=i%5===0?7:3;c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();
 }
 c.font='500 64px "Arial",sans-serif';
 for(let i=1;i<=12;i++){const a=i*TAU/12-Math.PI/2;c.fillText(String(i),Math.cos(a)*379,Math.sin(a)*379);}
 return canvas;
}

export function createClockJourney(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});
 const dial=makeDial();let width=1,height=1,dpr=1,disposed=false;
 const particles=Array.from({length:2600},(_,i)=>({angle:random(i+1)*TAU,depth:random(i+2701),radius:.77+random(i+5401)*.48,size:.3+random(i+8201)*1.4,light:random(i+10901)}));
 function resize(){dpr=Math.min(devicePixelRatio||1,1.5);width=canvas.clientWidth||innerWidth;height=canvas.clientHeight||innerHeight;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 function hand(angle,length,weight,color){
  ctx.rotate(angle);ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,length*.10);ctx.lineTo(0,-length);ctx.stroke();ctx.rotate(-angle);
 }
 function render(travel=0,elapsed=0){
  if(disposed)return;
  const unit=Math.min(width,height),cx=width*.5,cy=height*.51;
  const advance=travel*.105;
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#110d18';ctx.fillRect(0,0,width,height);
  const fog=ctx.createRadialGradient(cx,cy,0,cx,cy,unit*.94);
  fog.addColorStop(0,'#bf7951');fog.addColorStop(.10,'#754339');fog.addColorStop(.35,'#392037');fog.addColorStop(.7,'#211628');fog.addColorStop(1,'#090910');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.25);ctx.scale(1,.92);ctx.globalCompositeOperation='screen';
  // Layered luminous dust currents define the spiral's depth without a movie texture.
  for(let i=0;i<30;i++){
   const z=.4+fract(i/30-advance*.22)*5.8,r=unit*.43/z;
   const tint=i%3===0?'238,150,92':i%3===1?'223,106,163':'147,113,204';
   ctx.strokeStyle=`rgba(${tint},${.035+(1-z/6.2)*.035})`;ctx.lineWidth=unit*.020/z;
   ctx.beginPath();ctx.ellipse(0,0,r,r,0,i*.8+travel*.045,i*.8+travel*.045+4.2);ctx.stroke();
  }
  for(const p of particles){
   const z=.33+fract(p.depth-advance*.18)*7.4,r=unit*.46*p.radius/z;
   if(r>Math.hypot(width,height)*.7)continue;
   const a=p.angle+z*.32+travel*.028,x=Math.cos(a)*r,y=Math.sin(a)*r;
   ctx.fillStyle=p.light>.72?'#ffe2b5':p.light>.35?'#d88dab':'#9b86be';
   ctx.globalAlpha=Math.min(.56,(.10+p.light*.40)/Math.sqrt(z));
   const s=Math.min(3.5,p.size/z);ctx.fillRect(x,y,s,s);
  }
  ctx.globalAlpha=1;ctx.restore();
  // Far clocks are rendered first; each near dial grows and moves past the viewer.
  const layers=Array.from({length:7},(_,i)=>({z:.58+fract(i/7-advance*.105)*10.4,i})).sort((a,b)=>b.z-a.z);
  const seconds=10*3600+10*60+elapsed+travel*45;
  for(const layer of layers){
   const r=unit*.77/layer.z,rotation=-.28+layer.z*.22-travel*.055;
   const opacity=Math.min(.9,.28+1/layer.z)*Math.min(1,(11-layer.z)*1.4);
   ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);ctx.scale(1,.91);
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity;
   ctx.drawImage(dial,-r,-r,r*2,r*2);
   ctx.shadowColor='#f6a7b7';ctx.shadowBlur=Math.min(18,r*.035);
   hand((seconds/43200%1)*TAU,r*.43,Math.max(1,r*.014),'#e8af89');
   hand((seconds/3600%1)*TAU,r*.66,Math.max(1,r*.009),'#ffe6cf');
   // A distinct, discrete second-hand tick; minute/hour hands retain correct ratios.
   hand((Math.floor(seconds)%60)/60*TAU,r*.77,Math.max(.6,r*.003),'#f3b7d2');
   ctx.shadowBlur=0;ctx.fillStyle='#fff2e2';ctx.beginPath();ctx.arc(0,0,Math.max(1,r*.015),0,TAU);ctx.fill();ctx.restore();
  }
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=1;
  const core=ctx.createRadialGradient(cx,cy,0,cx,cy,unit*.095);core.addColorStop(0,'#fff7e9');core.addColorStop(.08,'#ffdbb0');core.addColorStop(.30,'#e79a7880');core.addColorStop(1,'#a9517b00');ctx.fillStyle=core;ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation='source-over';
  const edge=ctx.createRadialGradient(cx,cy,unit*.28,cx,cy,Math.max(width,height)*.64);edge.addColorStop(0,'#110b1900');edge.addColorStop(1,'#09070fba');ctx.fillStyle=edge;ctx.fillRect(0,0,width,height);
 }
 resize();return {resize,render,dispose(){disposed=true;dial.width=dial.height=1;}};
}
