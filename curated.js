const reduce=matchMedia('(prefers-reduced-motion:reduce)');
// Sample switches stay on the same printed page; document history retains the choice.
const specimenGroups=[...document.querySelectorAll('[data-specimen-group]')];
const commercialSources=[...document.querySelectorAll('[data-commercial-source]')];
const sourceKey=detail=>`${detail.closest('[data-specimen-group]').dataset.specimenGroup}:${detail.closest('[data-specimen]').dataset.specimen}`;
function restoreCommercialSources(){commercialSources.forEach(detail=>{detail.open=Boolean(history.state?.writingSourceOpen?.[sourceKey(detail)]);});}
commercialSources.forEach(detail=>detail.addEventListener('toggle',()=>{
 const key=sourceKey(detail),saved=history.state?.writingSourceOpen||{};
 if(Boolean(saved[key])===detail.open)return;
 history.replaceState({...history.state,writingSourceOpen:{...saved,[key]:detail.open}},'',location.href);
}));
function selectSpecimen(group,id,{remember=false,animate=false}={}){
 const switcher=group.querySelector('.specimen-switch');if(switcher)switcher.hidden=false;
 const samples=[...group.querySelectorAll('[data-specimen]')],sample=samples.find(s=>s.dataset.specimen===id)||samples[0];
 if(!sample)return;
 samples.forEach(s=>s.hidden=s!==sample);
 group.querySelectorAll('[data-select-specimen]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectSpecimen===sample.dataset.specimen)));
 group.dataset.selectedSpecimen=sample.dataset.specimen;
 if(remember){const state=history.state||{};history.replaceState({...state,writingSamples:{...state.writingSamples,[group.dataset.specimenGroup]:sample.dataset.specimen}},'');}
 if(animate&&!reduce.matches)sample.animate([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
}
function restoreSpecimens(){restoreCommercialSources();specimenGroups.forEach(group=>selectSpecimen(group,history.state?.writingSamples?.[group.dataset.specimenGroup]));}
specimenGroups.forEach(group=>group.querySelectorAll('[data-select-specimen]').forEach(b=>b.addEventListener('click',()=>selectSpecimen(group,b.dataset.selectSpecimen,{remember:true,animate:true}))));
restoreSpecimens();addEventListener('popstate',restoreSpecimens);
const readingPage=document.querySelector('[data-studio="reading"]');
if(readingPage){
 readingPage.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(link.href),work=readingPage.querySelector('[data-work-panel]:not([hidden])')?.id;
  if(url.origin===location.origin&&url.pathname==='/echo-gallery/contact/'&&work)history.replaceState({...history.state,writingReturnPosition:{work,top:scrollY}},'',location.href);
 },{capture:true});
 function restoreReadingPosition(){requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const position=history.state?.writingReturnPosition,work=readingPage.querySelector('[data-work-panel]:not([hidden])')?.id;
  if(position?.work===work&&Number.isFinite(position.top))scrollTo({top:Math.max(0,position.top),behavior:'instant'});
 }));}
 addEventListener('pageshow',restoreReadingPosition);addEventListener('popstate',restoreReadingPosition);
}
// Real document links remain the navigation mechanism, including Back/Forward.
document.querySelector('main')?.classList.add('passage-enter');
const lace=document.querySelector('.lace-reading');let laceReturn;
document.querySelectorAll('[data-read-lace]').forEach(b=>b.addEventListener('click',()=>{laceReturn=b;lace.showModal();}));
lace?.querySelector('[data-close-lace]').addEventListener('click',()=>lace.close());lace?.addEventListener('close',()=>laceReturn?.focus({preventScroll:true}));
const viewer=document.querySelector('.artifact-viewer');let viewerReturn;
document.querySelectorAll('[data-fullscreen]').forEach(button=>button.addEventListener('click',()=>{const img=button.querySelector('img'),target=viewer.querySelector('img');viewerReturn=button;target.src=(img.currentSrc||img.src).replace(/-(480|960)\.webp$/,'-1600.webp');target.alt=img.alt;viewer.querySelector('figcaption').textContent=img.alt;viewer.showModal();}));
viewer?.querySelector('button').addEventListener('click',()=>viewer.close());viewer?.addEventListener('close',()=>viewerReturn?.focus({preventScroll:true}));
document.querySelectorAll('[data-proof-frame]').forEach(button=>button.addEventListener('click',()=>{button.closest('[data-work-panel]').querySelector(`[data-frame="${button.dataset.proofFrame}"]`)?.click();}));
document.querySelectorAll('[data-next-work]').forEach(button=>{if(button.closest('[data-studio]')?.dataset.studio==='reading')return;button.addEventListener('click',()=>{const root=button.closest('[data-studio]'),items=[...root.querySelectorAll('[data-select-work]')].filter(x=>!x.hidden),index=items.findIndex(x=>x.getAttribute('aria-current')==='true');items[(index+1)%items.length]?.click();root.querySelector('[data-work-panel]:not([hidden]) [data-next-work]')?.focus({preventScroll:true});if(innerWidth<700)root.querySelector('[data-work-panel]:not([hidden]) .reading-surface')?.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});});});

// Contact choices and project context are handled together by contact-intents.js.
// Remember the entry object, so returning to the mobile keeps a sense of place.
document.querySelectorAll('.kinetic-labels a').forEach(a=>a.addEventListener('click',()=>{try{sessionStorage.setItem('echo-last-room',a.dataset.mobileRoom);sessionStorage.setItem('echo-last-angle',document.querySelector('#kinetic-canvas')?.dataset.angle||'0');}catch{}}));

