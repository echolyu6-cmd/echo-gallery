// One attributed work moves from its real scene surface into a stable reading area.
export function createExhibitSurface({root,dialog,host,getScene,onReturn,id,stateKey,sheetSelector,scrollerSelector,closeSelector,titleSelector,announcement='作品已展开。'}) {
 const paper=dialog.querySelector(sheetSelector),scroller=dialog.querySelector(scrollerSelector);
 const preference=matchMedia('(prefers-reduced-motion:reduce)');
 let sequence=0,active=false,returnOrbit=0,animation=null;
 const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 function clearAnimation(){animation?.cancel();animation=null;}
 function dismiss(){const wasActive=active;sequence++;active=false;clearAnimation();if(dialog.open)dialog.close();if(wasActive){document.body.classList.remove('has-exhibition-reader');delete root.dataset[stateKey];}}
 function transformFrom(rect){
  const target=paper.getBoundingClientRect();
  if(!rect||!target.width||!target.height)return 'translateY(12px)';
  const sx=rect.width/target.width,sy=rect.height/target.height;
  return `translate(${rect.left-target.left}px,${rect.top-target.top}px) scale(${sx},${sy})`;
 }
 async function flight(rect,reverse=false){
  if(preference.matches||typeof paper.animate!=='function')return;
  const from=transformFrom(rect);paper.style.transformOrigin='0 0';
  animation=paper.animate(reverse?[{transform:'none',opacity:1},{transform:from,opacity:.12}]:[{transform:from,opacity:.12},{transform:'none',opacity:1}],{duration:reverse?320:460,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});
  try{await animation.finished;}catch{/* A new navigation cancels this transition. */}
 }
 async function open({orbit=0}={}){
  if(active)return;active=true;returnOrbit=orbit;const current=++sequence;
  root.dataset[stateKey]='approaching';
  // Let the camera and the responsive stage finish before projecting its paper.
  await nextFrame();await nextFrame();
  const deadline=performance.now()+1800;
  while(current===sequence&&host.dataset.transition!=='false'&&performance.now()<deadline)await nextFrame();
  if(current!==sequence)return;
  const source=getScene()?.surfaceRect(id);scroller.scrollTop=0;
  document.body.classList.add('has-exhibition-reader');dialog.showModal();
  dialog.querySelector(closeSelector).focus({preventScroll:true});
  root.dataset[stateKey]='opening';
  await flight(source);
  if(current!==sequence)return;clearAnimation();root.dataset[stateKey]='open';
  root.querySelector('[data-exhibition-status]').textContent=`${dialog.querySelector(titleSelector).textContent}，${announcement}`;
 }
 async function close(){
  if(!active)return;const current=++sequence;clearAnimation();
  if(dialog.open){root.dataset[stateKey]='closing';await flight(getScene()?.surfaceRect(id),true);}
  if(current!==sequence)return;const orbit=returnOrbit;dismiss();onReturn({orbit,id});
 }
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.querySelector(closeSelector).addEventListener('click',event=>{event.stopPropagation();close();});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||event.ctrlKey||event.metaKey||event.altKey)return;
  const elements=[...dialog.querySelectorAll('button:not([disabled]),a[href],summary,[tabindex="0"]')].filter(element=>element.getClientRects().length);
  const first=elements[0],last=elements.at(-1);if(!first)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
 });
 // Native modal focus remains trapped; native Back and deep links belong to the gallery.
 preference.addEventListener('change',()=>{if(preference.matches)animation?.finish();});
 return {open,close,dismiss,isActive:()=>active,isOpen:()=>dialog.open};
}

export function createExhibitionReader(options){
 const {dialog,root}=options,scroller=dialog.querySelector('.reader-scroller');
 const panels=new Map([...dialog.querySelectorAll('[data-reader-panel]')].map(panel=>[panel.dataset.readerPanel,panel]));
 const opening=dialog.querySelector('[data-reader-invitation-reading]'),contacts=dialog.querySelectorAll('[data-reader-contact],[data-reader-contact-end]'),contactLabel=dialog.querySelector('[data-reader-contact-label]'),record=dialog.querySelector('[data-reader-record]');
 const preference=matchMedia('(prefers-reduced-motion:reduce)');
 const surface=createExhibitSurface({...options,id:'hroot',stateKey:'readerState',sheetSelector:'[data-reader-sheet]',scrollerSelector:'.reader-scroller',closeSelector:'[data-close-exhibition-reader]',titleSelector:'[data-reader-panel]:not([hidden]) [data-reader-title]',announcement:'原文节选已展开。'});
 let material='article',animation=null,scrollFrame=0,restoring=false;
 const reading=()=>history.state?.exhibitionReading?.hroot||{};
 function remember(){
  if(restoring||!surface.isActive())return;
  const state={material,invitationOpen:Boolean(opening?.open),scroll:Math.round(scroller.scrollTop)},saved=reading();
  if(state.material===saved.material&&state.invitationOpen===saved.invitationOpen&&state.scroll===saved.scroll)return;
  history.replaceState({...history.state,exhibitionReading:{...history.state?.exhibitionReading,hroot:{...saved,...state}}},'',location.href);
 }
 function selectMaterial(id,{animate=false,persist=false}={}){
  const panel=panels.get(id)||panels.get('article');if(!panel)return;
  const next=panel.dataset.readerPanel,changed=next!==material;material=next;
  panels.forEach(value=>value.hidden=value!==panel);
  dialog.dataset.readerMaterial=material;
  dialog.querySelectorAll('[data-reader-material]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.readerMaterial===material)));
  const title=panel.querySelector('[data-reader-title]');
  dialog.setAttribute('aria-labelledby',title.id);scroller.setAttribute('aria-labelledby',title.id);
  contacts.forEach(contact=>{const url=new URL(contact.href);url.searchParams.set('intent',material==='invitation'?'event':'writing');contact.href=url.href;});
  if(contactLabel)contactLabel.textContent=material==='invitation'?'聊聊活动文案':'聊聊内容写作';
  record.href=`/echo-gallery/projects/hroot/#${material==='invitation'?'hroot-event':'hroot-original'}`;
  if(changed)scroller.scrollTop=0;
  animation?.cancel();
  if(changed&&animate&&!preference.matches&&typeof panel.animate==='function'){
   animation=panel.animate([{opacity:.55,transform:'perspective(1400px) rotateY(7deg) translateX(10px)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.75,.2,1)'});
  }
  if(changed&&persist){remember();root.querySelector('[data-exhibition-status]').textContent=`${title.textContent}，原文节选已展开。`;}
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button[data-reader-material]');
  if(button)selectMaterial(button.dataset.readerMaterial,{animate:true,persist:true});
 });
 // Capture the latest reading position before a native navigation or close.
 dialog.addEventListener('click',event=>{if(event.target.closest('a[href],[data-close-exhibition-reader]'))remember();},{capture:true});
 dialog.addEventListener('cancel',remember);
 opening?.addEventListener('toggle',remember);
 scroller.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;remember();});},{passive:true});
 preference.addEventListener('change',()=>{if(preference.matches)animation?.finish();});
 selectMaterial('article');
 return {...surface,selectMaterial,async open(settings){
  const wasActive=surface.isActive();if(wasActive)return;
  const saved=reading();restoring=true;selectMaterial(saved.material);if(opening)opening.open=saved.invitationOpen??true;
  try{
   await surface.open(settings);
   if(surface.isOpen())scroller.scrollTop=Number.isFinite(saved.scroll)?Math.max(0,saved.scroll):0;
  }finally{restoring=false;}
  if(surface.isOpen())remember();
 }};
}
