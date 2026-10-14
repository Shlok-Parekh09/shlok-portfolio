/* global pc, EventBus, gsap, PortfolioTimeline, MapHud */
var ShlokPortfolio = pc.createScript('shlokPortfolio');
ShlokPortfolio.prototype.initialize = function () {
  this.content=window.PORTFOLIO_CONTENT;this.T=PortfolioTimeline;this.progress=0;this.phase='';this.elapsed=0;this.cleanups=[];
  this.certificateIndex=0;this.projectIndex=0;this.skillIndex=-1;this.endingActive=false;this.endingIndex=0;this.songIndex=0;
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.canvas=this.app.graphicsDevice.canvas;this.audioManager=this.entity.script.audioManager;this.originalMaster=this.audioManager.masterVolume;
  this.buildInterface();this.buildRoom();this.buildEnding();
  window.installPortfolioScene?.(this.app);
  this.listen(window,'keydown',e=>{if(this.laptopFocused){e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();this.room?.blurLaptop();}}},{capture:true});
  this.listen(window,'resize',()=>this.layout());this.listen(window,'pointerup',e=>this.pickProject(e));
  this.listen(window,'experienceStart',()=>{this.unlockAudio();const timer=setTimeout(()=>this.navigateChapter(),1600);this.cleanups.push(()=>clearTimeout(timer));});
  this.listen(window,'hashchange',()=>{if(this.audioUnlocked)this.navigateChapter();});
  this.listen(document,'visibilitychange',()=>{if(document.hidden){this.music.pause();this.song.pause();}else this.syncAudio();});
  this.bus('scroll:progress',p=>this.onProgress(p));this.bus('maphud:layout',rect=>this.layoutSkills(rect));
  this.bus('maphud:track',transform=>{this.skillsTracking.style.transform=transform;});
  this.on('destroy',this.cleanup,this);this.layout();
};
ShlokPortfolio.prototype.listen=function(target,name,fn,options){target.addEventListener(name,fn,options);this.cleanups.push(()=>target.removeEventListener(name,fn,options));};
ShlokPortfolio.prototype.navigateChapter=function(){const chapters={intro:.17,skills:.227,room:.315,certificates:.595,projects:.395,journey:.75,contact:1};const key=location.hash.slice(1);if(Object.hasOwn(chapters,key))EventBus.emit('scroll:setProgress',chapters[key]);};
ShlokPortfolio.prototype.bus=function(name,fn){EventBus.on(name,fn);this.cleanups.push(()=>EventBus.off(name,fn));};
ShlokPortfolio.prototype.el=function(tag,cls,text,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;if(parent)parent.append(e);return e;};
ShlokPortfolio.prototype.button=function(text,label,parent,action){const b=this.el('button','sp-button',text,parent);b.type='button';b.setAttribute('aria-label',label);this.listen(b,'click',action);return b;};
ShlokPortfolio.prototype.buildInterface=function(){
  this.ui=this.el('div','sp-ui','',document.body);this.ui.id='shlok-portfolio';
  this.skillsTracking=this.el('div','sp-skills-tracking','',this.ui);this.skillsTracking.hidden=true;
  this.skills=this.el('section','sp-skills-glass','',this.skillsTracking);this.skills.setAttribute('aria-label','Skills');
  this.skillCount=this.el('span','sp-eyebrow','',this.skills);
  this.skillPanel=this.el('div','sp-skill-panel','',this.skills);this.skillTitle=this.el('h2','','',this.skillPanel);
  this.skillTools=this.el('ul','sp-skill-tools','',this.skillPanel);this.setSkill(0);
  this.certificateControls=this.el('div','sp-controls sp-certificate-controls','',this.ui);this.certificateControls.hidden=true;
  this.certificateControls.style.cssText = 'right: 8vw; top: 50%; transform: translateY(-50%); left: auto; flex-direction: column; align-items: flex-end; text-align: right;';
  this.certificateLabel=this.el('span','sp-eyebrow','',this.certificateControls);
  this.button('VIEW CERTIFICATE ↗','View certificate details',this.certificateControls,()=>this.openCertificate(this.certificateIndex));
  this.projectControls=this.el('div','sp-controls sp-project-controls','',this.ui);this.projectControls.hidden=true;
  this.projectLabel=this.el('span','sp-eyebrow','',this.projectControls);
  this.button('VIEW PROJECT ↗','Read the current project',this.projectControls,()=>this.openProject(this.projectIndex));
  this.dialog=this.el('dialog','sp-dialog','',document.body);this.dialog.setAttribute('aria-labelledby','sp-detail-title');
  this.button('CLOSE ×','Close details',this.dialog,()=>this.dialog.close());
  this.detailImage=this.el('img','sp-detail-image','',this.dialog);
  for(const type of ['wheel','touchmove','keydown'])this.listen(this.dialog,type,e=>e.stopPropagation());
  this.listen(this.dialog,'click',e=>{if(e.target===this.dialog)this.dialog.close();});
};
ShlokPortfolio.prototype.setSkill=function(index){if(index===this.skillIndex)return;this.skillIndex=index;const s=this.content.skills[index];this.skillCount.textContent=`SKILLS / ${String(index+1).padStart(2,'0')} — 06`;this.skillTitle.textContent=s.title;this.skillTools.replaceChildren();s.tools.forEach(t=>this.el('li','',t,this.skillTools));};
ShlokPortfolio.prototype.layoutSkills=function(rect){if(!rect)return;const padding=innerWidth<600?17:35;Object.assign(this.skills.style,{left:`${rect.L+padding}px`,top:`${rect.T+padding}px`,width:`${Math.max(100,rect.W-padding*2)}px`,height:`${Math.max(100,rect.H-padding*2)}px`});};
ShlokPortfolio.prototype.layout=function(){if(typeof MapHud!=='undefined'&&MapHud.rect)this.layoutSkills(MapHud.rect);this.applyIris();};
ShlokPortfolio.prototype.setLaptopFocus=function(focused){
 if(this.laptopFocused===focused)return;this.laptopFocused=focused;
 const scroll=this.entity.script.scrollManager;
 if(scroll){scroll._targetRaw=scroll._currentRaw;if(focused){this.scrollWasEnabled=scroll.enabled;scroll.enabled=false;}else scroll.enabled=this.scrollWasEnabled;}
};
ShlokPortfolio.prototype.buildRoom=function(){
  this.roomHost=this.el('section','sp-room','',this.ui);this.roomHost.hidden=true;this.roomHost.setAttribute('aria-label','The learning room');
  this.roomLoading=this.el('div','sp-room-loading','Opening the room…',this.roomHost);this.roomLoading.setAttribute('role','status');
  const caption=this.el('div','sp-room-caption','',this.roomHost);this.roomEyebrow=this.el('span','sp-eyebrow','02 / THE LEARNING ROOM',caption);this.roomTitle=this.el('h2','','A space for curiosity.',caption);
  this.roomHint=this.el('p','','Scroll to explore the PC archive. Select the laptop for music.',caption);
  this.laptopAccess=this.el('div','sp-laptop-access','',this.roomHost);
  this.nightMode=false;
  this.lightButton=this.button('☀ MORNING','Switch to night lighting',this.roomHost,()=>{
   this.nightMode=!this.nightMode;this.room?.setNight(this.nightMode);
   this.lightButton.textContent=this.nightMode?'☾ NIGHT':'☀ MORNING';
   this.lightButton.setAttribute('aria-pressed',String(this.nightMode));
   this.lightButton.setAttribute('aria-label',this.nightMode?'Switch to morning lighting':'Switch to night lighting');
  });this.lightButton.classList.add('sp-room-light');this.lightButton.setAttribute('aria-pressed','false');
   this.laptopAccess.innerHTML=`
 <style>
   .sp-player { position:absolute; bottom:24px; right:24px; display:flex; flex-direction:column; align-items:center; user-select:none; color:#000; pointer-events:auto; }
   .sp-player .disc-anim { position:relative; z-index:0; height:64px; margin-bottom:-8px; transition:height .5s; overflow:hidden; }
   .sp-player:hover .disc-anim, .sp-player.expanded .disc-anim { height:0; }
   .sp-player .box { z-index:30; display:flex; flex-direction:column; width:160px; height:80px; transition:all .5s ease; background:#fff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,.12); overflow:hidden; position:relative; align-items:center; justify-content:center; }
   .sp-player:hover .box, .sp-player.expanded .box { width:320px; justify-content:flex-start; }
   .sp-player:hover .box { height:112px; }
   .sp-player.expanded .box { height:420px; }
   .sp-player .core-btns { display:flex; align-items:center; justify-content:center; gap:16px; padding:8px 0; flex-shrink:0; }
   .sp-player .core-btns > * { display:flex; align-items:center; justify-content:center; width:32px; height:32px; cursor:pointer; color:#000; }
   .sp-player:hover .core-btns, .sp-player.expanded .core-btns { display:none; }
   .sp-player .title-row { display:none; flex-direction:column; justify-content:center; width:100%; text-align:center; padding:8px 16px 0; transition:opacity .3s; flex-shrink:0; pointer-events:none; }
   .sp-player:hover .title-row, .sp-player.expanded .title-row { display:flex; opacity:1; }
   .sp-player .title-row .song-name { font-size:18px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2; }
   .sp-player .title-row .song-artist { font-size:12px; color:#71717a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
   .sp-player .controls { width:100%; display:none; flex-direction:column; flex-shrink:0; transition:opacity .3s; padding:4px 12px 8px; }
   .sp-player:hover .controls, .sp-player.expanded .controls { display:flex; opacity:1; }
   .sp-player .seek-row { display:flex; align-items:center; background:#e5e7eb; border-radius:6px; padding:2px 0; margin-bottom:4px; }
   .sp-player .seek-row span { font-size:11px; padding:0 8px; color:#000; flex-shrink:0; }
   .sp-player .seek-row input[type=range] { flex:1; height:4px; background:#9ca3af; border-radius:9999px; appearance:none; cursor:pointer; }
   .sp-player .seek-row input[type=range]::-webkit-slider-thumb { appearance:none; width:12px; height:12px; background:#fff; border:2px solid #000; border-radius:50%; cursor:pointer; }
   .sp-player .btn-row { display:flex; align-items:center; justify-content:center; gap:16px; }
   .sp-player .btn-row > * { display:flex; align-items:center; justify-content:center; width:32px; height:32px; cursor:pointer; }
   .sp-player .btn-row label { cursor:pointer; }
   .sp-player .btn-row input[type=checkbox] { display:none; }
   .sp-player .song-list { flex:1; overflow-y:auto; padding:4px 8px 8px; opacity:0; pointer-events:none; transition:opacity .3s; }
   .sp-player.expanded .song-list { opacity:1; pointer-events:auto; }
   .sp-player .song-item { cursor:pointer; padding:8px; border-radius:6px; transition:background .15s; text-align:left; }
   .sp-player .song-item:hover { background:#f4f4f5; }
   .sp-player .song-item .si-title { font-weight:700; font-size:14px; color:#000; }
   .sp-player .song-item .si-artist { font-size:12px; color:#71717a; }\n    .sp-player .disc-center { width:32px; height:32px; top:48px; left:48px; }
   
    @media (max-width: 800px) {
      .sp-player { position:fixed !important; bottom:calc(12px + env(safe-area-inset-bottom)) !important; left:12px !important; right:auto !important; align-items:flex-start !important; width:min(320px,calc(100vw - 24px)); }
      .sp-player .box { width:100% !important; height:auto !important; min-height:142px; justify-content:flex-start; margin:0; box-sizing:border-box; }
      .sp-player .core-btns { display:none; }
      .sp-player .title-row { display:flex; opacity:1; pointer-events:auto; box-sizing:border-box; min-height:64px; padding:10px 12px 6px 70px; text-align:left; }
      .sp-player .title-row .song-name { font-size:16px; }
      .sp-player .controls { box-sizing:border-box; }
      .sp-player .btn-row > * { width:44px; height:44px; }
      .sp-player .seek-row input { min-width:0; }
      .sp-player .controls { display:flex; opacity:1; }
      .sp-player .song-list { display:none !important; }
      .sp-player #custom-list-btn { display:none !important; }
      .sp-player .disc-anim { position:absolute; z-index:31; left:12px; top:12px; width:44px; height:44px; overflow:hidden; margin:0; border-radius:50%; pointer-events:none; transition:none; }
      .sp-player .disc-anim svg { width:44px; height:44px; box-sizing:border-box; border-width:2px!important; }
      .sp-player .disc-center { width:10px; height:10px; top:17px; left:17px; border-width:2px!important; box-sizing:border-box; }
      .sp-player:hover .disc-anim, .sp-player.expanded .disc-anim { height:44px; }
    }
 </style>
 <div class="sp-player" id="sp-player-root">
   <div class="disc-anim">
     <svg width="128" height="128" viewBox="0 0 128 128" style="border:4px solid #a1a1aa; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,.15); animation:spin 3s linear infinite;">
       <svg>
         <rect width="128" height="128" fill="black"></rect>
         <circle cx="20" cy="20" r="2" fill="white"></circle>
         <circle cx="40" cy="30" r="2" fill="white"></circle>
         <circle cx="60" cy="10" r="2" fill="white"></circle>
         <circle cx="80" cy="40" r="2" fill="white"></circle>
         <circle cx="100" cy="20" r="2" fill="white"></circle>
         <circle cx="120" cy="50" r="2" fill="white"></circle>
         <circle cx="90" cy="30" r="10" fill="white" fill-opacity="0.5"></circle>
         <circle cx="90" cy="30" r="8" fill="white"></circle>
         <path d="M0 128 Q32 64 64 128 T128 128" fill="purple" stroke="black" stroke-width="1"></path>
         <path d="M0 128 Q32 48 64 128 T128 128" fill="mediumpurple" stroke="black" stroke-width="1"></path>
         <path d="M0 128 Q32 32 64 128 T128 128" fill="rebeccapurple" stroke="black" stroke-width="1"></path>
         <path d="M0 128 Q16 64 32 128 T64 128" fill="purple" stroke="black" stroke-width="1"></path>
         <path d="M64 128 Q80 64 96 128 T128 128" fill="mediumpurple" stroke="black" stroke-width="1"></path>
       </svg>
     </svg>
     <div class="disc-center" style="position:absolute; z-index:10; background:#fff; border:4px solid #a1a1aa; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.1);"></div>
   </div>
   <div class="box">
     <div class="core-btns">
       <div id="core-prev"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg></div>
       <div id="core-play"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>
       <div id="core-next"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></div>
     </div>
     <div class="title-row">
       <div class="song-name" id="custom-song-title">Music Name</div>
       <div class="song-artist" id="custom-song-artist">Singer &amp; artist</div>
     </div>
     <div class="controls">
       <div class="seek-row">
         <span>0:00</span>
         <input type="range" min="0" max="100" value="0" />
         <span>3:45</span>
       </div>
       <div class="btn-row">
         <label for="playMode"><input type="checkbox" id="playMode" /><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></label>
         <div id="custom-prev"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg></div>
         <label for="playStatus"><input type="checkbox" name="playStatus" id="playStatus" /><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="play-icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pause-icon" style="display:none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></label>
         <div id="custom-next"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></div>
         <div id="custom-list-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></div>
       </div>
     </div>
     <div class="song-list" id="custom-song-items"></div>
   </div>
 </div>`;
   this.listen(this.laptopAccess, 'focus-laptop', () => this.room?.focusLaptop());
   const playerRoot = this.laptopAccess.querySelector('#sp-player-root');
   const playStatus = this.laptopAccess.querySelector('#playStatus');
   this.listen(playStatus, 'change', () => this.toggleSong());
   for(const id of ['custom-prev','core-prev'])this.listen(this.laptopAccess.querySelector('#'+id),'click',()=>this.selectSong((this.songIndex-1+this.content.songs.length)%this.content.songs.length));
   for(const id of ['custom-next','core-next'])this.listen(this.laptopAccess.querySelector('#'+id),'click',()=>this.selectSong((this.songIndex+1)%this.content.songs.length));
   const corePlay=this.laptopAccess.querySelector('#core-play');
   corePlay.setAttribute('role','button');corePlay.tabIndex=0;
   this.listen(corePlay,'click',()=>this.toggleSong());
   this.listen(corePlay,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.toggleSong();}});
   
   const itemsContainer = this.laptopAccess.querySelector('#custom-song-items');
   
   const collapseList = () => { playerRoot.classList.remove('expanded'); };
   const expandList = () => { playerRoot.classList.add('expanded'); };
   
   this.listen(this.laptopAccess.querySelector('#custom-list-btn'), 'click', (e) => {
     e.stopPropagation();
     if (playerRoot.classList.contains('expanded')) collapseList();
     else expandList();
   });
   
   this.content.songs.forEach((song, i) => {
     const item = document.createElement('div');
     item.className = 'song-item';
     item.style.display = 'flex';
     item.style.alignItems = 'center';
     item.style.gap = '12px';
     item.innerHTML = `
       ${song.logo ? `<img loading="lazy" decoding="async" src="${song.logo}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; flex-shrink: 0;" />` : `<div style="width: 40px; height: 40px; border-radius: 4px; background: #e4e4e7; flex-shrink: 0;"></div>`}
       <div>
         <div class="si-title">${song.title}</div>
         <div class="si-artist">${song.artist}</div>
       </div>
     `;
     item.addEventListener('click', (e) => {
       e.stopPropagation();
       this.selectSong(i);
       collapseList();
     });
     itemsContainer.appendChild(item);
   });
   
   const initialTitle=document.getElementById('custom-song-title'),initialArtist=document.getElementById('custom-song-artist');
   if(initialTitle&&this.content.songs[0])initialTitle.textContent=this.content.songs[0].title;
   if(initialArtist&&this.content.songs[0])initialArtist.textContent=this.content.songs[0].artist;
  this.loadRoom=()=>{if(this.roomRequested)return;this.roomRequested=true;
  import('/room.js').then(m=>m.createRoom(this.roomHost,this.content,{
    onCertificate:(i,open)=>{this.certificateIndex=i;},
    onSong:i=>this.selectSong(i),onLaptopFocus:focused=>this.setLaptopFocus(focused),onReady:()=>{this.roomLoading.hidden=true;}
  })).then(room=>{if(this.disposed){room.dispose();return;}this.room=room;room.setProgress(this.progress);room.setNight(this.nightMode);room.setActive(this.progress>=.273&&this.progress<.583);this.updateMusicState();}).catch(error=>{console.error('[SHLOK room]',error);this.roomLoading.textContent='The room could not load. You can still scroll onward to certificates and contact.';});};
};
ShlokPortfolio.prototype.buildEnding=function(){
  const data=this.content.ending;
  this.ending=this.el('section','sp-ending','',this.ui);this.ending.hidden=true;this.ending.setAttribute('aria-label','Journey and contact');
  // A still frame, not a second background video. The person and black hole remain visible.
  this.contactLayer=this.el('div','sp-film sp-contact-backdrop','',this.ending);
  this.loadContact=()=>{if(this.contactRequested)return;this.contactRequested=true;this.contactLayer.style.backgroundImage=`url("${data.posters[1]}")`;};
  this.el('div','sp-ending-shade','',this.ending);
  this.contact=this.el('div','sp-contact','',this.ending);this.contact.hidden=true;
  for(const type of ['wheel','touchmove'])this.listen(this.contact,type,e=>e.stopPropagation(),{passive:true});
  const portrait=this.el('figure','sp-portrait','',this.contact),photo=this.el('img','','',portrait);photo.loading='lazy';photo.src=data.photo;photo.alt='Shlok Parekh';photo.decoding='async';
  this.el('figcaption','','SHLOK PAREKH / ALWAYS EXPLORING',portrait);
  const copy=this.el('div','sp-contact-copy','',this.contact);this.el('span','sp-eyebrow',data.eyebrow,copy);this.el('h2','',data.title,copy);this.el('p','sp-about',data.description,copy);
  const links=this.el('div','sp-contact-links','',copy);
  const email=this.el('a','sp-contact-link',data.email,links);email.href=`mailto:${data.email}`;
  this.filmStatus=this.el('span','sp-film-status','SHLOK / THE JOURNEY CONTINUES',this.ending);
  this.music=new Audio(data.soundtrack);this.music.preload='none';this.music.loop=true;this.music.volume=0;this.music.hidden=true;this.music.setAttribute('aria-label','Interstellar soundtrack');this.ending.append(this.music);
  this.song=new Audio(this.content.songs[0].src);this.song.preload='metadata';this.song.loop=true;this.song.volume=0;this.song.hidden=true;this.song.setAttribute('aria-label','Laptop music');this.roomHost.append(this.song);
  for(const name of ['playing','play','canplay','pause','waiting','ended','error'])this.listen(this.song,name,()=>this.updateMusicState());
  import('/htb-link.js').then(({createHTB})=>{if(!this.disposed){this.htb=createHTB(this.ending,this.content.htb);this.htb.setVisible(this.endingIndex===1);}}).catch(console.error);
};
ShlokPortfolio.prototype.unlockAudio=function(){
  // The landing-page entry gesture unlocks local audio; no YouTube or playback toolbar.
  this.audioUnlocked=true;for(const audio of [this.music,this.song]){audio.volume=0;audio.play().then(()=>{if(!this.endingActive&&!(this.progress>=.273&&this.progress<.583)){audio.pause();audio.currentTime=0;}this.syncAudio();}).catch(()=>{});}
};
ShlokPortfolio.prototype.toggleSong=function(){
 gsap.killTweensOf(this.song);
 if(!this.song.paused&&!this.song.ended){this.songUserPaused=true;this.song.pause();}
 else {this.songUserPaused=false;this.audioUnlocked=true;this.song.volume=.48;this.song.play().then(()=>this.updateMusicState()).catch(()=>this.updateMusicState());}
 this.updateMusicState();
};
ShlokPortfolio.prototype.updateMusicState=function(){
 const song=this.content.songs[this.songIndex],playing=!this.song.paused&&!this.song.ended&&!this.song.error;
 this.room?.setMusicState(playing&&this.song.readyState>=3,song.title);
 const input=this.laptopAccess.querySelector('#playStatus');if(input)input.checked=playing;
 this.laptopAccess.querySelector('.play-icon').style.display=playing?'none':'';
 this.laptopAccess.querySelector('.pause-icon').style.display=playing?'':'none';
 const core=this.laptopAccess.querySelector('#core-play');
 core.innerHTML=this.laptopAccess.querySelector(playing?'.pause-icon':'.play-icon').outerHTML;
 core.firstElementChild.style.display='';core.firstElementChild.removeAttribute('class');
 for(const control of [core,input?.parentElement]){control?.setAttribute('aria-label',playing?'Pause music':'Play music');control?.setAttribute('aria-pressed',String(playing));}
 const disc=this.laptopAccess.querySelector('.disc-anim svg');if(disc)disc.style.animationPlayState=playing?'running':'paused';
};
ShlokPortfolio.prototype.selectSong=function(i){if(!this.content.songs[i])return;this.songUserPaused=false;this.songIndex=i;gsap.killTweensOf(this.song);this.song.src=this.content.songs[i].src;this.song.loop=true;this.song.volume=.48;this.room?.selectSong(i);const titleEl=document.getElementById('custom-song-title'),artistEl=document.getElementById('custom-song-artist');if(titleEl)titleEl.textContent=this.content.songs[i].title;if(artistEl)artistEl.textContent=this.content.songs[i].artist;this.audioUnlocked=true;this.updateMusicState();this.song.play().then(()=>this.updateMusicState()).catch(()=>this.updateMusicState());};
ShlokPortfolio.prototype.syncAudio=function(){
  if(!this.music||!this.song)return;const contact=this.endingActive&&this.endingIndex===1;
  const room=this.progress>=.273&&this.progress<.583&&!this.endingActive;
  for(const [audio,wanted] of [[this.music,contact],[this.song,room&&!this.songUserPaused]]){
    gsap.killTweensOf(audio);const play=wanted&&this.audioUnlocked&&!document.hidden;
    if(play){audio.play().then(()=>{if(document.hidden){audio.pause();return;}gsap.to(audio,{volume:audio===this.music ? .72 : .48,duration:1.5});}).catch(()=>{});}
    else gsap.to(audio,{volume:0,duration:.55,onComplete:()=>audio.pause()});
  }
};
ShlokPortfolio.prototype.applyIris=function(){if(!this.ending)return;const iris=this.T.iris(this.progress),radius=Math.hypot(innerWidth,innerHeight)/2+4;this.ending.style.clipPath=`circle(${radius*iris.reveal}px at 50% 50%)`;this.ending.style.filter=`saturate(${iris.color}) brightness(${.62+iris.color*.38})`;if(iris.reveal===1.0){this.canvas.style.opacity='0';}else{this.canvas.style.opacity='1';}};
ShlokPortfolio.prototype.onProgress=function(p){
  if(window.__sceneWarmup)return;this.progress=p;const T=this.T;
  // Do not decode the second 3D scene during the diamond landing (.14–.198).
  if(p>=.218)this.loadRoom?.();
  if(p>=.62)this.loadContact?.();
  const phase=p>=.704?'ending':p>=.582?'projects':p>=.273?'room':p>=.198?'land':p>=.14?'intro':'orbit';
  document.body.dataset.portfolioPhase=phase;this.ui.dataset.progress=p.toFixed(5);this.skillsTracking.hidden=phase!=='land';
  if(phase==='land'){this.skillsTracking.style.opacity=T.smooth(T.range(p,.208,.216))*(1-T.smooth(T.range(p,.268,.273)));this.setSkill(Math.min(5,Math.floor(T.range(p,.214,.266)*6)));}
  const inRoom=p>=.273&&p<.583;this.roomHost.hidden=!inRoom;
  // Keep script/audio updates alive, but do not draw the hidden PlayCanvas scene
  // underneath the opaque Three.js room or final contact image.
  this.app.autoRender=!((this.room&&p>=.287&&p<.535)||p>=.724);
  this.roomHost.style.opacity=T.smooth(T.range(p,.273,.287));
  this.room?.setProgress(p);this.room?.setActive(inRoom);
  this.laptopAccess.hidden=!inRoom||p>=.535;this.lightButton.hidden=!inRoom||p>=.535;this.roomHint.hidden=p>=.535;
  this.roomHost.querySelector('.sp-room-caption').style.opacity=String(1-T.smooth(T.range(p,.525,.545)));
  if(inRoom){this.roomEyebrow.textContent=p<.385?'02 / THE LEARNING ROOM':p>=.535?'03 / CERTIFICATES':`02 / PROJECT ARCHIVE · ${this.certificateIndex+1} OF ${this.content.projects.length}`;this.roomTitle.textContent=p<.385?'A space for curiosity.':p>=.535?this.content.certificates[0].title:(this.content.projects[this.certificateIndex]?.title||'');this.roomHint.textContent=p<.385?'Scroll to explore the PC archive. Select the laptop for music.':'Scroll through my projects, then enter the certificate realm.';}
  if(phase==='projects')this.certificateIndex=Math.round(T.range(p,.59,.705)*(this.content.certificates.length-1));
  this.certificateControls.hidden=phase!=='projects';
  if(phase==='projects')this.certificateLabel.textContent=this.content.certificates[this.certificateIndex]?.title||'Certificates';
  const active=p>=.704;
  if(active!==this.endingActive){this.endingActive=active;this.ending.hidden=!active;
  }
  const ending=T.ending(p),contactActive=active&&ending.contact>.5,oldEndingIndex=this.endingIndex;
  this.endingIndex=contactActive?1:0;
  this.htb?.setVisible(contactActive);
  this.contactLayer.style.opacity='1';
  this.contactLayer.style.transform=`scale(${1.08-.08*ending.contact})`;
  this.contact.hidden=!active||ending.contact===0;this.contact.style.opacity=String(ending.contact);
  this.contact.style.pointerEvents=contactActive?'auto':'none';this.contact.inert=!contactActive;
  this.filmStatus.textContent=contactActive?'INTERSTELLAR · QUENTINGAMING / CONTACT':'SHLOK / THE JOURNEY CONTINUES';
  if(oldEndingIndex!==this.endingIndex)this.syncAudio();
  if(phase!==this.phase)this.syncAudio();this.applyIris();this.phase=phase;
};
ShlokPortfolio.prototype.openDetail=function(item,meta,links){this.detailImage.src=item.image;this.detailImage.alt=item.title;if(!this.dialog.open)this.dialog.showModal();};
ShlokPortfolio.prototype.openCertificate=function(){const c=this.content.certificates[this.certificateIndex];if(c&&c.original)window.open(c.original,'_blank');};
ShlokPortfolio.prototype.pickProject=function(event){if(this.phase!=='projects'||event.target!==this.canvas||this.dialog.open)return;const camera=this.app.root.findByName('UICamera ').camera,r=this.canvas.getBoundingClientRect();const start=camera.entity.getPosition().clone(),end=camera.screenToWorld(event.clientX-r.left,event.clientY-r.top,camera.farClip),ray=new pc.Ray(start,end.sub(start).normalize());for(const card of this.app.root.findByName('cardsgroup').children)if(card.enabled&&card.name.startsWith('shlok-certificate-'))for(const render of card.findComponents('render'))if(render.meshInstances.some(m=>m.aabb.intersectsRay(ray))){this.certificateIndex=Number(card.name.split('-').pop());this.openCertificate();return;}};
ShlokPortfolio.prototype.update=function(dt){
  const target=this.phase==='room'||this.phase==='projects'||this.endingActive?0:this.originalMaster;
  if (Math.abs(target - this.audioManager.masterVolume) > 0.001) {
    this.audioManager.masterVolume += (target - this.audioManager.masterVolume) * (1 - Math.exp(-dt*3));
  } else if (this.audioManager.masterVolume !== target) {
    this.audioManager.masterVolume = target;
  }
};
ShlokPortfolio.prototype.cleanup=function(){this.disposed=true;this.setLaptopFocus(false);this.cleanups.forEach(fn=>fn());for(const a of[this.music,this.song]){gsap.killTweensOf(a);a.pause();}this.htb?.dispose();this.room?.dispose();this.app.autoRender=true;this.audioManager.masterVolume=this.originalMaster;this.ui.remove();this.dialog.remove();};

