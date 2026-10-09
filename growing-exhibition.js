import {createExhibitionReader} from './exhibition-reader.js?v=1a14f6017b36';
import {createSpatialExhibit} from './spatial-exhibits.js?v=1a14f6017b36';
import {createGalleryEvidence} from './exhibition-evidence.js?v=1a14f6017b36';
const root=document.querySelector('[data-exhibition-home]');
if(root&&root.dataset.renderState!=='static'){
 const works=JSON.parse(document.getElementById('exhibition-data').textContent),byId=new Map(works.map(w=>[w.id,w]));
 const host=document.getElementById('exhibition-canvas'),stage=document.getElementById('exhibition-stage'),dock=root.querySelector('.exhibition-dock'),labels=root.querySelector('.exhibition-labels'),tour=root.querySelector('.exhibition-tour'),hint=document.getElementById('exhibition-hint'),status=root.querySelector('[data-exhibition-status]'),cursor=root.querySelector('.exhibition-cursor');
 const openingControl=root.querySelector('[data-exhibition-opening]'),motionPreference=matchMedia('(prefers-reduced-motion:reduce)'),openingSessionKey='echo-gallery-opening-v5';
 const evidence=createGalleryEvidence({root,works,labels});
 const siteHeader=document.querySelector('.site-header');
 function fitViewport(){if(siteHeader)root.style.setProperty('--gallery-header-height',`${siteHeader.getBoundingClientRect().height}px`);}
 fitViewport();const headerObserver=typeof ResizeObserver==='function'?new ResizeObserver(fitViewport):null;headerObserver?.observe(siteHeader);addEventListener('resize',fitViewport,{passive:true});
 let overviewId=works[0].id;
 const panels=new Map([...root.querySelectorAll('[data-exhibition-panel]')].map(el=>[el.dataset.exhibitionPanel,el]));
 const frameSelections=new Map(works.map(w=>[w.id,Math.max(0,w.frames.findIndex(f=>f.image===w.media.image))]));
 const renderedFrames=new Map(frameSelections);
 let engine=null,chosen=null,back=false,closing=false,sceneExpired=false,openingActive=false,loadingTimer,reader=null,readerReturnOrbit=0;
 const surfaces=new Map();
 function dismissSurfaces(except=null){for(const [id,surface]of surfaces)if(id!==except)surface.dismiss();const viewer=document.querySelector('.artifact-viewer');if(viewer?.open)viewer.close();}
 const loadingController=new AbortController();
 const readingController=new AbortController();
 const readingBodies=[...root.querySelectorAll('[data-exhibition-front],[data-exhibition-back]')];
 function scrollCue(body){body.dataset.moreBelow=String(body.clientHeight>0&&body.scrollHeight-body.clientHeight-body.scrollTop>3);}
 const scrollObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>entries.forEach(({target})=>scrollCue(target))):null;
 readingBodies.forEach(body=>{scrollObserver?.observe(body);body.addEventListener('scroll',()=>scrollCue(body),{passive:true});body.addEventListener('toggle',()=>scrollCue(body),true);});
 function fallback(reason='unavailable'){evidence.hide();root.querySelector('[data-gallery-evidence]').hidden=true;dismissSurfaces();sceneExpired=true;clearTimeout(loadingTimer);readingController.abort();loadingController.abort();engine?.dispose();engine=null;root.classList.remove('is-ready','is-loading');root.dataset.mode='overview';root.dataset.renderState='static';root.dataset.fallbackReason=typeof reason==='string'?reason:'unavailable';labels.hidden=true;openingControl.hidden=true;dock.hidden=true;tour.hidden=true;hint.textContent='选一件，打开看看。';}
 function updateOpeningControl(){openingControl.hidden=!engine||Boolean(chosen)||motionPreference.matches;openingControl.querySelector('[data-exhibition-opening-label]').textContent=openingActive?'直接看作品':'再看开场';}
 function openingState(active){openingActive=active;root.dataset.opening=active?'playing':'done';labels.hidden=active&&!engine?.isMobile();updateOpeningControl();}
 function savedState(){return {...history.state,exhibitionFrames:Object.fromEntries(frameSelections),exhibitionOverview:overviewId,exhibitionOrbit:chosen?readerReturnOrbit:engine?.overviewOrbit()||0};}
 function browsed(id,phone){overviewId=id;evidence.browse(id,phone);if(!chosen)hint.textContent=phone?'左右滑动，点击作品。':'拖动看看，选一件走近。';if(engine&&!chosen)history.replaceState(savedState(),'',location.href);}
 function browseWork(id){engine?.browse(id);}
 function requestWork(id,{direct=false}={}){if(engine.isMobile()&&!chosen&&!direct&&id!==overviewId){browseWork(id);return;}if(!chosen)history.replaceState(savedState(),'',location.href);state(id,false,{focusHeading:true});}
 function writeHash(id,side=false,replace=false){const hash=id?`#exhibit-${id}${side?'/back':''}`:'';if(location.hash!==hash)history[replace?'replaceState':'pushState'](savedState(),'',location.pathname+location.search+hash);}
 function restoreFrame(id){const work=byId.get(id),index=frameSelections.get(id),content=work.frames[index],p=panels.get(id);if(!content)return;p.querySelectorAll('[data-exhibition-artwork]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.frameIndex)===index)));p.querySelector('[data-exhibition-caption]').textContent=content.caption;const note=p.querySelector('[data-exhibition-note]');if(note){note.textContent=content.note||'';note.hidden=!content.note;}if(surfaces.has(id))return;if(renderedFrames.get(id)!==index){renderedFrames.set(id,index);engine.setArtwork(id,content).catch(()=>{renderedFrames.delete(id);status.textContent='这张材料暂时没有加载成功，可打开完整作品查看。';});}}
 function state(id=null,side=false,{historyMode='push',focusHeading=false,restoreOrbit=null,readingOrbit=null}={}){
  if(!engine)return;if(id&&!byId.has(id))id=null;
  const sameOverview=!id&&!chosen&&root.dataset.mode==='overview';
  const surface=!side&&surfaces.get(id),willRead=Boolean(surface);
  const overviewOrbit=restoreOrbit??readerReturnOrbit;
  if(surface&&Number.isFinite(readingOrbit))readerReturnOrbit=readingOrbit;
  else if(surface&&!surface.isActive()&&!chosen)readerReturnOrbit=engine.overviewOrbit();
  dismissSurfaces(willRead?id:null);
  chosen=id;back=Boolean(id&&side);cursor.hidden=true;
  engine.finishOpening();updateOpeningControl();
  root.dataset.mode=id?'focus':'overview';root.dataset.side=back?'back':'front';root.dataset.exhibit=id||'';dock.hidden=!id||Boolean(willRead);
  if(surface&&!surface.isActive())root.dataset[id==='hroot'?'readerState':'exhibitState']='approaching';
  for(const [key,p]of panels){p.hidden=key!==id;p.querySelector('[data-exhibition-front]').hidden=key===id&&back;p.querySelector('[data-exhibition-back]').hidden=!(key===id&&back);const button=p.querySelector('[data-exhibition-flip]');button.setAttribute('aria-pressed',String(key===id&&back));button.querySelector('[data-exhibition-flip-label]').textContent=key===id&&back?'回到正面':'看看背面';const materials=p.querySelector('[data-exhibition-materials]');if(materials)materials.hidden=key!==id||back;if(key===id)scrollCue(p.querySelector(back?'[data-exhibition-back]':'[data-exhibition-front]'));}
  if(id){if(willRead&&id==='hroot')frameSelections.set(id,0);engine.focus(id,{reading:Boolean(willRead)});engine.flip(id,back);restoreFrame(id);const work=byId.get(id);hint.textContent=`${String(works.indexOf(work)+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')} · ${work.displayTitle||work.title}`;status.textContent=willRead?(id==='hroot'?'正在展开文字作品。':'正在走近作品。'):`${work.title}，${back?'创作背面':'作品正面'}。`;if(willRead){surface.select?.(frameSelections.get(id));surface.open({orbit:readerReturnOrbit});}else if(focusHeading)panels.get(id).querySelector('h2').focus({preventScroll:true});}
  else{if(!sameOverview||restoreOrbit!==null)engine.overview({restoreOrbit:overviewOrbit});hint.textContent=engine.isMobile()?'左右滑动，点击作品。':'拖动看看，选一件走近。';status.textContent='回到展馆。';}
  if(historyMode!=='none')writeHash(id,back,historyMode==='replace');
 }
 function fromHash(){
  if(!engine)return;const snapshot=history.state;
  for(const [id,index]of Object.entries(snapshot?.exhibitionFrames||{})){if(byId.has(id)&&Number.isInteger(index)&&index>=0&&index<byId.get(id).frames.length)frameSelections.set(id,index);}
  const raw=decodeURIComponent(location.hash.slice(1)),match=raw.match(/^exhibit-([^/]+)(\/back)?$/),alias={'room-fuli':'fuli','room-shanyao':'shanyao','room-words':'hroot'},id=match?.[1]||alias[raw]||null;
  const remembered=byId.has(snapshot?.exhibitionOverview)?snapshot.exhibitionOverview:engine.isMobile()&&byId.has(id)?id:overviewId;
  if(remembered!==overviewId){overviewId=remembered;engine.browse(remembered,{immediate:true,notify:false});}evidence.browse(overviewId,engine.isMobile());
  const orbit=Number.isFinite(snapshot?.exhibitionOrbit)?snapshot.exhibitionOrbit:readerReturnOrbit;
  state(id,Boolean(match?.[2]),{historyMode:'none',readingOrbit:orbit,restoreOrbit:!id&&(chosen||Math.abs(engine.overviewOrbit()-orbit)>.001)?orbit:null});
 }
 function step(delta){if(!chosen&&engine.isMobile()){const i=works.findIndex(w=>w.id===overviewId);browseWork(works[(i+delta+works.length)%works.length].id);return;}const i=works.findIndex(w=>w.id===chosen),next=i<0?(delta>0?0:works.length-1):(i+delta+works.length)%works.length;state(works[next].id,false,{focusHeading:true});}
 root.addEventListener('click',e=>{
  const a=e.target.closest('a[data-exhibit],a[data-open-exhibit]');if(a&&engine&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();requestWork(a.dataset.exhibit||a.dataset.openExhibit,{direct:true});return;}
  if(!engine)return;
  if(e.target.closest('[data-exhibition-opening]')){if(openingActive)engine.finishOpening();else engine.playOpening();return;}
  if(e.target.closest('[data-exhibition-overview]')){const previous=chosen;state();if(previous)labels.querySelector(`[data-exhibit="${previous}"]`)?.focus({preventScroll:true});}
  if(e.target.closest('[data-exhibition-next]'))step(1);
  if(e.target.closest('[data-exhibition-prev]'))step(-1);
  if(e.target.closest('[data-exhibition-flip]')&&chosen)state(chosen,!back,{historyMode:'replace'});
  const button=e.target.closest('[data-exhibition-artwork]');if(button&&chosen){frameSelections.set(chosen,Number(button.dataset.frameIndex));restoreFrame(chosen);const body=panels.get(chosen).querySelector('[data-exhibition-front]'),note=body.querySelector('[data-exhibition-note]');if(note&&!note.hidden&&body.scrollHeight>body.clientHeight){const top=note.getBoundingClientRect().top-body.getBoundingClientRect().top+body.scrollTop;body.scrollTo({top:Math.max(0,top-4),behavior:'auto'});}history.replaceState(savedState(),'',location.href);}
 });
 root.addEventListener('pointerover',e=>{const a=e.target.closest('a[data-exhibit]');if(a)engine?.hover(a.dataset.exhibit);else if(e.target.closest('.exhibition-dock,.exhibition-bottom')){cursor.hidden=true;engine?.hover(null);}});
 root.addEventListener('pointerout',e=>{const a=e.target.closest('a[data-exhibit]');if(a&&!a.contains(e.relatedTarget))engine?.hover(null);});
 root.addEventListener('focusin',e=>{const a=e.target.closest('a[data-exhibit]');if(a&&!chosen)evidence.show(engine?.isMobile()?overviewId:a.dataset.exhibit);});
 root.addEventListener('keydown',e=>{if(!engine||[...surfaces.values()].some(s=>s.isActive())||e.target.matches('input,textarea'))return;if(e.key==='Escape'&&chosen){e.preventDefault();const previous=chosen;state(null,false,{restoreOrbit:readerReturnOrbit});labels.querySelector(`[data-exhibit="${previous}"]`)?.focus({preventScroll:true});}else if(e.target===stage||chosen&&e.target===panels.get(chosen)?.querySelector('h2')){if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}});
 root.classList.add('is-loading');root.dataset.renderState='loading';
 // Keep native work links usable while the optional 3D scene downloads.
 loadingTimer=setTimeout(()=>fallback('timeout'),8000);
 root.addEventListener('exhibition-load-timeout',()=>fallback('bootstrap-timeout'),{once:true});
 // Once the visitor starts reading the native works, keep that view stable.
 // This listener disappears when loading succeeds or is cancelled.
 const retainReading=()=>{if(!engine&&!sceneExpired&&root.dataset.renderState==='loading')fallback('reading');};
 addEventListener('wheel',retainReading,{passive:true,signal:readingController.signal});
 addEventListener('touchmove',retainReading,{passive:true,signal:readingController.signal});
 addEventListener('keydown',event=>{if(['PageDown','PageUp','End','Home','ArrowDown','ArrowUp',' '].includes(event.key)&&[document.body,stage].includes(event.target))retainReading();},{signal:readingController.signal});
 import('./growing-exhibition-scene.js?v=1a14f6017b36').then(({mountExhibition})=>{
  if(closing||sceneExpired)return null;
  return mountExhibition(host,{works,signal:loadingController.signal,onOpening:openingState,onBrowse:browsed,onSelect:id=>requestWork(id),onPositions:points=>{for(const [id,p]of Object.entries(points)){const a=labels.querySelector(`[data-exhibit="${id}"]`);if(!a)continue;a.style.left=`${p.x}px`;a.style.top=`${p.y}px`;a.dataset.canvasX=p.centerX.toFixed(2);a.dataset.canvasY=p.centerY.toFixed(2);a.dataset.canvasWidth=p.displayWidth.toFixed(2);a.dataset.canvasHeight=p.displayHeight.toFixed(2);a.dataset.sourceRatio=p.sourceRatio.toFixed(4);a.dataset.surfaceRatio=p.surfaceRatio.toFixed(4);a.dataset.visible=String(p.visible);}},onHover:id=>{labels.querySelectorAll('[data-exhibit]').forEach(a=>a.classList.toggle('is-hovered',a.dataset.exhibit===id));if(id)evidence.show(id);cursor.textContent='走近';cursor.hidden=!id;},onPointer:p=>{cursor.style.left=`${p.x+18}px`;cursor.style.top=`${p.y+18}px`;},onError:fallback});
 }).then(value=>{
  if(!value)return;if(closing||sceneExpired){value.dispose();return;}clearTimeout(loadingTimer);readingController.abort();engine=value;root.classList.remove('is-loading');root.classList.add('is-ready');root.dataset.renderState='interactive';labels.hidden=false;tour.hidden=false;
  for(const work of works){const p=panels.get(work.id),selected=frameSelections.get(work.id);p.querySelectorAll('[data-exhibition-artwork]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.frameIndex)===selected)));}
  const returnToGallery=({orbit,id})=>{state(null,false,{restoreOrbit:orbit});labels.querySelector(`[data-exhibit="${id}"]`)?.focus({preventScroll:true});};
  reader=createExhibitionReader({root,dialog:root.querySelector('[data-exhibition-reader]'),host,getScene:()=>engine,onReturn:returnToGallery});surfaces.set('hroot',reader);
  for(const id of ['fuli','shanyao'])surfaces.set(id,createSpatialExhibit({root,dialog:root.querySelector(`[data-spatial-exhibit="${id}"]`),host,getScene:()=>engine,work:byId.get(id),onReturn:returnToGallery,onFrame:(key,index)=>{frameSelections.set(key,index);restoreFrame(key);history.replaceState(savedState(),'',location.href);}}));
  fromHash();history.replaceState(savedState(),'',location.href);updateOpeningControl();
  if(!chosen&&!motionPreference.matches){let firstVisit=true;try{firstVisit=!sessionStorage.getItem(openingSessionKey);}catch{}if(firstVisit&&engine.playOpening()){try{sessionStorage.setItem(openingSessionKey,'1');}catch{}}}
 }).catch(fallback);
 motionPreference.addEventListener('change',()=>{if(motionPreference.matches)engine?.finishOpening();updateOpeningControl();});
 window.addEventListener('popstate',fromHash);window.addEventListener('hashchange',fromHash);
 window.addEventListener('pagehide',e=>{if(e.persisted)engine?.suspend();else{closing=true;dismissSurfaces();clearTimeout(loadingTimer);readingController.abort();loadingController.abort();engine?.dispose();scrollObserver?.disconnect();headerObserver?.disconnect();}});
 window.addEventListener('pageshow',e=>{if(e.persisted){engine?.resume();fromHash();}});
 const dialogs=[...document.querySelectorAll('dialog')];if(dialogs.length){const observer=new MutationObserver(()=>{if(dialogs.some(d=>d.open))engine?.suspend();else engine?.resume();});dialogs.forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));}
}
