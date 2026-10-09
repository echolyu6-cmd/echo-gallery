const act=document.querySelector('.first-act');
const legacyRoutes={'#room-field':'/echo-gallery/rooms/field/','#room-fuli':'/echo-gallery/rooms/field/#field-fuli','#room-reading':'/echo-gallery/rooms/reading/','#room-questions':'/echo-gallery/play/','#writing':'/echo-gallery/rooms/reading/','#play':'/echo-gallery/play/','#contact':'/echo-gallery/contact/'};
function legacy(){if(legacyRoutes[location.hash])location.replace(legacyRoutes[location.hash]);}addEventListener('hashchange',legacy);legacy();
if(act){
 const pull=document.querySelector('#curtain-pull'),replay=document.querySelector('.act-replay'),reveal=document.querySelector('#act-reveal'),stage=document.querySelector('#lace-stage'),status=document.querySelector('#act-status'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let cloth,progress=0,target=0,raf=0,lastTime=performance.now(),breezeUntil=performance.now()+3800,pointer=0,drag,dragged=false,opened=false,destroyed=false,focusAfter;
 pull.hidden=false;act.classList.add('has-curtain');
 function renderState(){
  act.style.setProperty('--curtain-open',progress);act.dataset.progress=progress.toFixed(3);
  const next=progress>.53;if(next!==opened){opened=next;act.classList.toggle('is-open',next);document.body.classList.toggle('has-opened',next);reveal.hidden=!next;replay.hidden=!next;
   act.querySelector('.act-question').setAttribute('aria-hidden',String(next));act.querySelector('.act-answer').setAttribute('aria-hidden',String(!next));pull.setAttribute('aria-expanded',String(next));
   if(next)status.textContent='蕾丝幕布打开了。福里农舍：奶奶的蕾丝展览。';else status.textContent='幕布合上了，可以再拉开一次。';
  }
  pull.hidden=opened&&!drag;
  if(focusAfter==='open'&&opened){act.querySelector('.act-enter').focus({preventScroll:true});focusAfter=null;}
  if(focusAfter==='close'&&!opened){pull.focus({preventScroll:true});focusAfter=null;}
 }
 function tick(now){raf=0;if(destroyed||document.hidden)return;const dt=Math.min(64,now-lastTime);lastTime=now;
  progress=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-dt/170));if(Math.abs(target-progress)<.0007)progress=target;
  renderState();cloth?.draw(progress,reduced.matches?0:now*.001,pointer);
  if(progress!==target||(!reduced.matches&&now<breezeUntil))raf=requestAnimationFrame(tick);
 }
 function wake(){if(!raf&&!destroyed){lastTime=performance.now();raf=requestAnimationFrame(tick);}}
 function moveTo(value){target=Math.max(0,Math.min(1,value));breezeUntil=performance.now()+1000;wake();}
 function open(){moveTo(1);}
 pull.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,start:progress,id:event.pointerId};dragged=false;pull.setPointerCapture(event.pointerId);});
 pull.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)){dragged=true;moveTo(drag.start+Math.abs(dx)/(innerWidth*.32));act.style.setProperty('--drag-x',`${Math.max(-innerWidth*.2,Math.min(innerWidth*.24,dx))}px`);}
 });
 function endDrag(){if(!drag)return;const didDrag=dragged;drag=null;act.style.setProperty('--drag-x','0px');if(didDrag)moveTo(target>.3?1:0);renderState();}
 pull.addEventListener('pointerup',endDrag);pull.addEventListener('pointercancel',()=>{drag=null;dragged=true;act.style.setProperty('--drag-x','0px');moveTo(0);});
 pull.addEventListener('click',event=>{if(dragged){dragged=false;return;}if(event.detail===0)focusAfter='open';open();});
 replay.addEventListener('click',()=>{focusAfter='close';moveTo(0);});
 act.addEventListener('pointermove',event=>{if(drag||event.pointerType!=='mouse'||reduced.matches)return;pointer=(event.clientX/innerWidth-.5)*.8;breezeUntil=performance.now()+700;wake();});
 act.addEventListener('pointerleave',()=>{pointer=0;breezeUntil=performance.now()+500;wake();});
 function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();}document.addEventListener('visibilitychange',visibility);
 reduced.addEventListener('change',()=>{progress=target;renderState();wake();});
 let leaving=false;
 act.querySelector('.act-enter').addEventListener('click',event=>{
  if(event.currentTarget.getAttribute('href').startsWith('#'))return;
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0||reduced.matches)return;
  event.preventDefault();if(leaving)return;leaving=true;act.classList.add('is-departing');document.body.classList.add('is-leaving');
  const destination=event.currentTarget.href;setTimeout(()=>location.assign(destination),320);
 });
 // The interactive CSS fallback works immediately while the enhanced textile loads.
 const enhance=()=>import('./lace-curtain.js?v=1a14f6017b36').then(m=>m.mountLace(stage)).then(instance=>{if(destroyed){instance.dispose();return;}cloth=instance;cloth.draw(progress);wake();}).catch(()=>{stage.dataset.renderer='fallback';});
 const record=document.querySelector('[data-case-record]');let recordEntry=null;
 try{const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target===record||record?.contains(target))recordEntry=target;}catch{}
 if(recordEntry){
  const watchOpening=()=>requestAnimationFrame(()=>{
   recordEntry.scrollIntoView({behavior:'instant',block:'start'});
   const observe=new IntersectionObserver(entries=>{if(entries.some(e=>e.intersectionRatio>=.15)){observe.disconnect();enhance();}},{threshold:.15});observe.observe(act);
  });
  if(document.readyState==='complete')watchOpening();else addEventListener('load',watchOpening,{once:true});
 }else enhance();
 if(recordEntry){progress=target=1;}renderState();wake();
 addEventListener('pagehide',event=>{if(!event.persisted){destroyed=true;cancelAnimationFrame(raf);cloth?.dispose();document.removeEventListener('visibilitychange',visibility);}});
 addEventListener('pageshow',event=>{if(event.persisted){leaving=false;act.classList.remove('is-departing');document.body.classList.remove('is-leaving');wake();}});
}
