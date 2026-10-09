const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const studio=document.querySelector('[data-studio]');
document.querySelectorAll('[data-process-key]').forEach(button=>button.addEventListener('click',()=>{
 const panel=button.closest('[data-work-panel]');panel.querySelector(`[data-frame="${button.dataset.processKey}"]`)?.click();
 if(!reduced.matches)panel.querySelector('.exhibit-window').animate([{filter:'brightness(.86)'},{filter:'brightness(1)'}],{duration:330});
}));
document.querySelectorAll('[data-tour-next]').forEach(a=>a.addEventListener('click',e=>{
 if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();
 studio?.querySelector(`[data-select-work="${a.dataset.tourNext}"]`)?.click();
 const heading=document.getElementById(a.dataset.tourNext)?.querySelector('h2');heading?.focus({preventScroll:true});
 document.querySelector('.exhibition-topline')?.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
}));
document.querySelectorAll('[data-prev-work]').forEach(button=>{if(studio?.dataset.studio==='reading')return;button.addEventListener('click',()=>{
 const items=[...studio.querySelectorAll('[data-select-work]')],index=items.findIndex(e=>e.getAttribute('aria-current')==='true');items[(index-1+items.length)%items.length]?.click();
 studio.querySelector('[data-work-panel]:not([hidden]) [data-prev-work]')?.focus({preventScroll:true});
 if(innerWidth<700)studio.querySelector('[data-work-panel]:not([hidden]) .reading-surface')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
});});
if(studio?.dataset.studio==='reading'){
 let turn;
 studio.addEventListener('studio-before-change',event=>{
  turn?.remove();turn=null;
  if(reduced.matches||!event.detail.from||event.detail.from===event.detail.to)return;
  const surface=document.getElementById(event.detail.from)?.querySelector('.reading-surface');if(!surface)return;
  const r=surface.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
  const leaf=surface.cloneNode(true);leaf.removeAttribute('id');leaf.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));leaf.classList.add('turning-leaf');leaf.setAttribute('aria-hidden','true');leaf.inert=true;
  Object.assign(leaf.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.append(leaf);turn=leaf;
  const indexes=[...studio.querySelectorAll('[data-select-work]')].map(e=>e.dataset.selectWork),forward=indexes.indexOf(event.detail.to)>indexes.indexOf(event.detail.from);
  leaf.style.transformOrigin=forward?'left center':'right center';
  const animation=leaf.animate([{transform:'perspective(1700px) rotateY(0deg)',opacity:1},{offset:.55,opacity:.8},{transform:`perspective(1700px) rotateY(${forward?-105:105}deg)`,opacity:0}],{duration:460,easing:'cubic-bezier(.35,.05,.2,1)'});
  animation.finished.then(()=>leaf.remove()).catch(()=>leaf.remove());
 });
 addEventListener('pagehide',()=>turn?.remove());
}
