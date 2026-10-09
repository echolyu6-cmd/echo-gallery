// The shared studio controller owns image selection and enlargement. This small
// enhancement remembers only SOHO's evidence and reading position on return.
const soho=document.querySelector('[data-soho-exhibit]');
if(soho){
 const controls=soho.querySelector('[data-soho-frame-controls]'),buttons=[...controls.querySelectorAll('[data-frame]')],details=soho.querySelector('[data-soho-titles]');
 const image=soho.querySelector('.work-main-image img'),caption=soho.querySelector('.work-frame-caption'),counter=soho.querySelector('.frame-counter');
 let restoring=false;
 controls.hidden=false;
 const visible=()=>!soho.hidden&&soho.getClientRects().length>0;
 function remember(){
  if(restoring||!visible())return;
  const frame=buttons.findIndex(b=>b.getAttribute('aria-pressed')==='true');
  history.replaceState({...history.state,sohoExhibit:{frame,top:Math.round(scrollY),titlesOpen:details.open}},'',location.href);
 }
 function restore(){
  if(!visible())return;
  const saved=history.state?.sohoExhibit;if(!saved)return;
  const button=buttons[saved.frame];if(!button)return;
  restoring=true;
  const key=button.dataset.frame;image.src=`/echo-gallery/images/${key}-960.webp`;image.srcset=`/echo-gallery/images/${key}-480.webp 480w, /echo-gallery/images/${key}-960.webp 960w, /echo-gallery/images/${key}-1600.webp 1600w`;image.alt=button.dataset.caption;
  caption.textContent=button.dataset.caption;counter.textContent=`${String(saved.frame+1).padStart(2,'0')} / ${String(buttons.length).padStart(2,'0')}`;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));details.open=Boolean(saved.titlesOpen);
  // Let the shared work selection and layout settle before restoring the page.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(visible()&&Number.isFinite(saved.top))scrollTo({top:Math.max(0,saved.top),behavior:'instant'});restoring=false;}));
 }
 soho.addEventListener('click',event=>{if(event.target.closest('[data-frame]'))remember();});
 soho.addEventListener('click',event=>{if(event.target.closest('a[href]'))remember();},{capture:true});
 details.addEventListener('toggle',remember);
 document.querySelector('[data-studio]').addEventListener('studio-before-change',event=>{if(event.detail.from===soho.id)remember();});
 addEventListener('pagehide',remember);addEventListener('pageshow',restore);addEventListener('popstate',restore);addEventListener('studio-work-change',restore);
 restore();
}
