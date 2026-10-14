export const sequenceFrame=(progress,start,end,count)=>Math.round(Math.max(0,Math.min(1,(progress-start)/(end-start)))*(count-1));

// No autoplay clock: the same scroll position always requests the same frame.
// Keep only a small decoded window, not hundreds of full-resolution bitmaps.
export function createFrameSequences(host,entries){
 const canvas=document.createElement('canvas');canvas.className='sp-frame-sequence';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');host.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:false}),cache=new Map(),pending=new Map(),failed=new Set();
 let progress=0,current=null,wanted=0,disposed=false,lastDraw='',queue=[];
 const key=(entry,n)=>`${entry.id}:${n}`;
 function active(){return entries.find(e=>e.ready&&progress>=e.start&&progress<e.end);}
 function resize(){canvas.width=Math.min(innerWidth*devicePixelRatio,1600);canvas.height=Math.round(canvas.width*innerHeight/innerWidth);lastDraw='';draw();}
 function draw(){if(disposed)return;current=active();if(!current){canvas.hidden=true;return;}
  wanted=sequenceFrame(progress,current.start,current.end,current.count);
  let item=cache.get(key(current,wanted)),id=key(current,wanted);
  if(!item){let distance=Infinity;for(const [k,v]of cache)if(v.entry===current&&Math.abs(v.n-wanted)<distance){distance=Math.abs(v.n-wanted);item=v;id=k;}}
  if(!item){canvas.hidden=true;return;}canvas.hidden=false;
  const u=(progress-current.start)/(current.end-current.start);canvas.style.opacity=String(Math.min(1,u/.04,(1-u)/.04));
  if(id===lastDraw)return;lastDraw=id;const image=item.image,s=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
  ctx.drawImage(image,(canvas.width-image.naturalWidth*s)/2,(canvas.height-image.naturalHeight*s)/2,image.naturalWidth*s,image.naturalHeight*s);
 }
 function pump(){if(disposed)return;while(pending.size<3&&queue.length){const job=queue.shift(),id=key(job.entry,job.n);if(cache.has(id)||pending.has(id)||failed.has(id))continue;
   const image=new Image();image.decoding='async';pending.set(id,image);
   image.onload=()=>{pending.delete(id);if(disposed)return;cache.set(id,{...job,image});
    if(cache.size>18){const victims=[...cache].sort((a,b)=>{const score=v=>v.entry===current?Math.abs(v.n-wanted):10000;return score(b[1])-score(a[1]);});while(cache.size>18)cache.delete(victims.shift()[0]);}
    draw();pump();};
   image.onerror=()=>{pending.delete(id);failed.add(id);pump();};
   image.src=`${job.entry.base}/frame-${String(job.n+1).padStart(4,'0')}.webp`;
  }}
 function setProgress(p){progress=p;draw();const near=current||entries.find(e=>e.ready&&p>=e.start-.018&&p<e.end);queue=[];
  if(near){const n=sequenceFrame(p,near.start,near.end,near.count);for(let d=0;d<=7;d++)for(const i of d?[n+d,n-d]:[n])if(i>=0&&i<near.count)queue.push({entry:near,n:i});pump();}}
 resize();window.addEventListener('resize',resize);
 return{setProgress,dispose(){disposed=true;window.removeEventListener('resize',resize);for(const image of pending.values()){image.onload=image.onerror=null;image.src='';}pending.clear();cache.clear();canvas.remove();}};
}
