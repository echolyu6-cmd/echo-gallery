import {createExhibitSurface} from './exhibition-reader.js?v=1a14f6017b36';

// Material choices change within one exhibit, with the gallery's history preserved.
export function createSpatialExhibit({root,dialog,host,getScene,work,onReturn,onFrame}){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 dialog.classList.add('is-enhanced');
 const surface=createExhibitSurface({root,dialog,host,getScene,onReturn,id:work.id,stateKey:'exhibitState',sheetSelector:'[data-spatial-sheet]',scrollerSelector:'.spatial-scroller',closeSelector:'[data-close-spatial]',titleSelector:'[data-spatial-title]'});
 const note=dialog.querySelector('details.spatial-frame-note'),poem=dialog.querySelector('#spatial-lace-text'),scroller=dialog.querySelector('.spatial-scroller'),contact=dialog.querySelector('a[href^="/echo-gallery/contact/"]');
 let currentFrame=-1,animation=null,scrollFrame=0,restoring=false,openSequence=0;
 const reading=()=>history.state?.exhibitionReading?.[work.id]||{};
 function ownsEntry(){
  try{const hash=decodeURIComponent(location.hash.slice(1));return hash===`exhibit-${work.id}`||hash===`room-${work.id}`;}catch{return false;}
 }
 function remember(){
  if(restoring||!surface.isOpen()||!ownsEntry())return;
  const state={frame:currentFrame,noteOpen:Boolean(note?.open),scroll:Math.round(Math.max(0,scroller.scrollTop))},saved=reading();
  if(state.frame===saved.frame&&state.noteOpen===saved.noteOpen&&state.scroll===saved.scroll)return;
  history.replaceState({...history.state,exhibitionReading:{...history.state?.exhibitionReading,[work.id]:{...saved,...state}}},'',location.href);
 }
 function cancelRestore(){if(restoring){openSequence++;restoring=false;}}
 function dismiss(){
  openSequence++;restoring=false;if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;
  surface.dismiss();
 }
 function contactIntent(intent){if(contact){const url=new URL(contact.href);url.searchParams.set('intent',intent);contact.href=url.href;}}
 function showPoem({animate=false,focus=false}={}){
  if(!poem)return;
  contactIntent('writing');
  const top=poem.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-24;
  scroller.scrollTo({top:Math.max(0,top),behavior:animate&&!reduced.matches?'smooth':'auto'});
  if(focus)poem.focus({preventScroll:true});
 }
 note?.addEventListener('toggle',remember);
 function syncScene(){
  if(restoring||!surface.isOpen())return;
  const threshold=scroller.getBoundingClientRect().top+Math.min(110,scroller.clientHeight*.24);
  if(work.id==='fuli'){contactIntent(poem.getBoundingClientRect().top<=threshold?'writing':'space');return;}
  let scene='entry';
  dialog.querySelectorAll('[data-spatial-scene-panel]').forEach(panel=>{if(panel.getBoundingClientRect().top<=threshold)scene=panel.dataset.spatialScenePanel;});
  const index={entry:0,kiln:1,story:4}[scene];
  if(index!==currentFrame)select(index,{notify:true,navigate:false});
 }
 scroller.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;syncScene();remember();});},{passive:true});
 scroller.addEventListener('pointerdown',cancelRestore,{passive:true});
 scroller.addEventListener('wheel',cancelRestore,{passive:true});
 dialog.addEventListener('click',event=>{
  if(event.target.closest('a[href],[data-close-spatial]'))remember();
  if(event.target.closest('[data-close-spatial],summary'))cancelRestore();
 },{capture:true});
 dialog.addEventListener('cancel',()=>{remember();cancelRestore();});
 addEventListener('pagehide',remember,{capture:true});
 function select(index,{notify=false,animate=false,navigate=true}={}){
  const frame=work.frames[index];if(!frame)return;
  if(notify)cancelRestore();
  currentFrame=index;let visible;
  if(work.id==='fuli'){
   dialog.querySelectorAll('[data-spatial-frame-panel]').forEach(panel=>{panel.hidden=Number(panel.dataset.spatialFramePanel)!==index;if(!panel.hidden)visible=panel;});
   dialog.querySelectorAll('[data-spatial-frame]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.spatialFrame)===index)));
   dialog.querySelector('[data-spatial-caption]').textContent=frame.caption;
   dialog.querySelector('[data-spatial-note]').textContent=frame.note||'';
   dialog.querySelector('[data-spatial-count]').textContent=`${String(index+1).padStart(2,'0')} / ${String(work.frames.length).padStart(2,'0')}`;
  }else{
   const scene=index===4?'story':index===1||index===3?'kiln':'entry';
   contactIntent(scene==='story'?'writing':'space');
   dialog.dataset.scene=scene;
   dialog.querySelectorAll('[data-spatial-scene-panel]').forEach(panel=>{panel.hidden=false;if(panel.dataset.spatialScenePanel===scene)visible=panel;});
   dialog.querySelectorAll('[data-spatial-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.spatialScene===scene)));
   if(notify&&navigate&&visible){const top=visible.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-24;scroller.scrollTo({top:Math.max(0,top),behavior:animate&&!reduced.matches?'smooth':'auto'});}
  }
  visible?.querySelectorAll('img').forEach(image=>image.loading='eager');
  animation?.cancel();if(animate&&!reduced.matches&&visible?.animate)animation=visible.animate([{opacity:.4},{opacity:1}],{duration:220,easing:'ease-out'});
  if(notify){onFrame(work.id,index);remember();}
 }
 dialog.addEventListener('click',event=>{
  const material=event.target.closest('[data-spatial-frame]'),scene=event.target.closest('[data-spatial-scene]');
  if(material)select(Number(material.dataset.spatialFrame),{notify:true,animate:true});
  if(scene)select({entry:0,kiln:1,story:4}[scene.dataset.spatialScene],{notify:true,animate:true});
  if(event.target.closest('[data-spatial-read-lace]')){cancelRestore();showPoem({animate:true,focus:true});}
 });
 return {...surface,dismiss,select,async open(options){
  if(surface.isActive())return;
  const saved=reading(),current=++openSequence;restoring=true;
  if(work.id==='fuli')contactIntent('space');
  if(note)note.open=Boolean(saved.noteOpen);
  try{
   await surface.open(options);
   if(current!==openSequence||!surface.isOpen())return;
   const hasPosition=Number.isFinite(saved.scroll)&&(!Number.isInteger(saved.frame)||saved.frame===currentFrame);
   if(hasPosition)scroller.scrollTop=Math.max(0,saved.scroll);
   else scroller.scrollTop=0;
  }finally{if(current===openSequence)restoring=false;}
  if(current===openSequence&&surface.isOpen())remember();
 }};
}
