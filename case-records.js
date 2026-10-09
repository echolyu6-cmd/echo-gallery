const record=document.querySelector('[data-case-record]');
if(record){
 const links=[...record.querySelectorAll('[data-case-chapter]')];
 const ids=new Set(links.map(a=>a.dataset.caseChapter));
 const sections=[...record.querySelectorAll('[id]')].filter(section=>ids.has(section.id));
 function mark(){
  let active=sections[0];for(const section of sections)if(section.getBoundingClientRect().top<=120)active=section;
  // The final chapter can be visible at the document end without ever reaching
  // the top threshold, because the remaining contact/footer content is short.
  const last=sections.at(-1);
  if(last&&Math.ceil(scrollY+innerHeight)>=document.documentElement.scrollHeight-2&&last.getBoundingClientRect().top<innerHeight)active=last;
  links.forEach(a=>{if(a.dataset.caseChapter===active?.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 }
 let frame=0;const update=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;mark();});};
 addEventListener('scroll',update,{passive:true});addEventListener('resize',update);addEventListener('hashchange',update);addEventListener('pageshow',update);mark();
}
