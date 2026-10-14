/* Preserve the original diamond, including its animated light children. */
(function(){
 window.installPortfolioScene=function(app){
  document.body.dataset.diamondModel='original';
  // Recolor the actual authored terrain material, preserving its mesh and camera.
  document.body.dataset.terrain='snowy-himalayas';
  const terrain=app.root.findByName('MAP');
  const terrainRenderers=terrain?.findComponents('render')||[];
  const diamond=app.root.findByName('DiamondV4');
  const diamondRenderers=diamond?.findComponents('render')||[];
  const cardEntities=app.root.findByName('cardsgroup')?.children||[];
  const realm=app.root.findByName('sceneUI');
  const cardRenderers=new Map(cardEntities.map(card=>[card,card.findComponents('render')]));
  const styledTerrain=new WeakSet();
  const gridColors={uGridCore:[.72,.87,1],uGridGlowA:[.16,.43,.72],uGridGlowB:[.32,.63,.9],uGridNodeCol:[.60,.80,1]};
  function styleTerrain(){
   for(const render of terrainRenderers)for(const instance of render.meshInstances){
    const material=instance.material;if(!material)return;
    for(const key in gridColors)material.setParameter(key,gridColors[key]);
    if(styledTerrain.has(material))continue;
    const chunks=material.getShaderChunks(pc.SHADERLANGUAGE_GLSL);
    const chunk=chunks.get('diffusePS')||pc.shaderChunks.diffusePS;
    if(chunk.includes('alpineLuma')){styledTerrain.add(material);continue;}
    chunks.set('diffusePS',chunk.replace(/}\s*$/,`
     float alpineLuma=dot(dAlbedo,vec3(.2126,.7152,.0722));
     float vegetation=smoothstep(.01,.12,dAlbedo.g-max(dAlbedo.r,dAlbedo.b));
     float snow=clamp(smoothstep(.06,.60,alpineLuma)+vegetation*.42,0.,1.);
     dAlbedo=mix(vec3(.22,.27,.34),vec3(.88,.93,1.),snow);
    }`));
    material.update();
    styledTerrain.add(material);
   }
  }
  const yellow=app.root.findByName('Chipcard');if(yellow)yellow.enabled=false;
  const zero=app.root.findByName('card0');if(zero)zero.enabled=false;
  const cards=app.root.findByName('cardsgroup')?.script?.cardSystem;
  if(cards){cards.widthFracDesktop=.37;cards.widthFracTablet=.60;cards.widthFracMobile=.75;cards.desktopMaxCss=630;}
  // The legacy monitor was removed. Render the certificate camera directly
  // instead of rendering the cards into a texture on that missing surface.
  const uiCamera=app.root.findByName('UICamera ');
  let progress=0;
  EventBus.on('scroll:progress',p=>{if(!window.__sceneWarmup)progress=p;});
  app.on('update',()=>{
   if(progress<.287)styleTerrain();
   // Keep the authored diamond intro, but show only the robot in the skills chapter.
   for(const r of diamondRenderers){if(r._portfolioEnabled===undefined)r._portfolioEnabled=r.enabled;const enabled=progress>=.198&&progress<.273?false:r._portfolioEnabled;if(r.enabled!==enabled)r.enabled=enabled;}
   if(!uiCamera?.camera)return;
   uiCamera.camera.renderTarget=null;
   uiCamera.camera.priority=10;
   uiCamera.camera.enabled=progress>=.535&&progress<.742;
   // Warm yellow wallpaper is revealed in the monitor aperture, without cards.
   if(progress>=.535&&progress<.583&&realm&&!realm.enabled)realm.enabled=true;
   for(const card of cardEntities){
    for(const render of cardRenderers.get(card)){const visible=progress>=.583;if(render.enabled!==visible)render.enabled=visible;}
    if(progress<.535||progress>=.742)continue;
    const design=card.script?.CardDesign;
    if(!design?._imgTex||!design._glassMat)continue;
    // Only the certificate image is opaque; remove the surrounding glass backing.
    design.fillOpacity=0;design.hoverFillOpacity=0;design._opCur=0;
    design._glassMat.setParameter('uFillOpacity',0);
    design._glassMat.setParameter('uGlowStrength',0);
    design._glassMat.setParameter('uBorderOpacity',0);
    design._glassMat.setParameter('uHoverGlowAmt',0);
    const ratio=design._pngAspect/(cards?.cardAspect||1.65);
    const w=Math.min(1,ratio)*.96,h=Math.min(1,1/ratio)*.96;
    design._glassMat.setParameter('uImgRect',[(1-w)/2,(1-h)/2,(1+w)/2,(1+h)/2]);
   }
  });
  // The room's monitor now expands directly into the certificate archive.
 };
})();
