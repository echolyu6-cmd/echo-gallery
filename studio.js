import {loadIngredientSprites} from './ingredient-atlas.js?v=1a14f6017b36';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const root=document.querySelector('[data-studio]');
if(root){
 const selectors=[...root.querySelectorAll('[data-select-work]')],panels=[...root.querySelectorAll('[data-work-panel]')];
 const aliases={'#commercial-writing':'shiseido','#commercial-shiseido':'shiseido','#uj':'soho','#field-materials':'field-materials'};
 let selected;
 function choose(id,{history=false}={}){
  const panel=panels.find(p=>p.id===id);if(!panel)return;
  if(root.dataset.studio==='reading'&&selected===id)return;
  root.dispatchEvent(new CustomEvent('studio-before-change',{detail:{from:selected,to:id}}));
  selected=id;panels.forEach(p=>{p.hidden=p!==panel;p.classList.remove('is-entering');});
  const selectedLink=selectors.find(a=>a.dataset.selectWork===id),other=root.querySelector('.other-exhibits');
  if(other){const secondary=selectedLink?.closest('.other-exhibits');other.querySelector('[data-more-label]').textContent=secondary?selectedLink.querySelector('strong').textContent:'更多作品';if(secondary&&history){const returnFocus=other.contains(document.activeElement);other.open=false;if(returnFocus)other.querySelector('summary').focus({preventScroll:true});}}
  selectors.forEach(a=>{if(a.dataset.selectWork===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  const count=root.querySelector('[data-book-count]');if(count)count.textContent=`${String(panels.indexOf(panel)+1).padStart(2,'0')} / ${String(panels.length).padStart(2,'0')}`;
  if(!reduced.matches){void panel.offsetWidth;panel.classList.add('is-entering');}
  if(history)window.history.pushState({...window.history.state,work:id},'',`#${id}`);
  root.classList.add('is-ready');
  const announcement=root.querySelector('#work-change-status');if(announcement)announcement.textContent='正在查看：'+(selectors.find(a=>a.dataset.selectWork===id)?.querySelector('strong')?.textContent||id);
  // Keep the current work visible on direct links and Back, without moving the page.
  if(innerWidth<700&&selectedLink?.getClientRects().length){
   const rail=selectedLink.closest('.project-selector');
   if(rail&&rail.scrollWidth>rail.clientWidth){const item=selectedLink.getBoundingClientRect(),view=rail.getBoundingClientRect();if(item.left<view.left)rail.scrollLeft+=item.left-view.left;else if(item.right>view.right)rail.scrollLeft+=item.right-view.right;}
  }
  window.dispatchEvent(new Event('studio-work-change'));
 }
 function fromHash(){let id;try{id=aliases[location.hash]||decodeURIComponent(location.hash.slice(1));}catch{id='';}const target=panels.some(p=>p.id===id)?id:panels[0].id;
  if(selectors.find(a=>a.dataset.selectWork===target)?.hidden){selectors.forEach(a=>a.hidden=false);root.querySelectorAll('[data-writing-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.writingFilter==='all')));}
  choose(target);
 }
 selectors.forEach(a=>a.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();choose(a.dataset.selectWork,{history:true});}));
 window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);fromHash();
 if(root.dataset.studio==='reading')root.querySelectorAll('[data-prev-work],[data-next-work]').forEach(button=>button.addEventListener('click',()=>{
  const visible=selectors.filter(link=>!link.hidden),index=visible.findIndex(link=>link.dataset.selectWork===selected),previous=button.hasAttribute('data-prev-work');
  const next=visible[(index+(previous?-1:1)+visible.length)%visible.length];if(!next)return;
  choose(next.dataset.selectWork,{history:true});
  const active=panels.find(panel=>panel.id===selected),target=active?.querySelector(previous?'[data-prev-work]':'[data-next-work]');target?.focus({preventScroll:true});
  if(innerWidth<700)active?.querySelector('.reading-surface')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
 }));
 selectors.forEach(a=>a.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const visible=selectors.filter(s=>!s.hidden&&s.getClientRects().length),current=visible.indexOf(a),direction=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;visible[(current+direction+visible.length)%visible.length]?.focus();}));
 root.querySelectorAll('[data-writing-filter]').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.writingFilter;root.querySelectorAll('[data-writing-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  selectors.forEach(a=>a.hidden=filter!=='all'&&a.dataset.category!==filter);
  const visible=selectors.filter(a=>!a.hidden);if(!visible.some(a=>a.dataset.selectWork===selected))choose(visible[0].dataset.selectWork,{history:true});
 }));
 root.querySelectorAll('[data-frame]').forEach(button=>button.addEventListener('click',()=>{
  const panel=button.closest('[data-work-panel]'),img=panel.querySelector('.work-main-image img'),key=button.dataset.frame;
  img.srcset=`/echo-gallery/images/${key}-480.webp 480w, /echo-gallery/images/${key}-960.webp 960w, /echo-gallery/images/${key}-1600.webp 1600w`;img.src=`/echo-gallery/images/${key}-960.webp`;img.alt=button.dataset.caption;
  panel.querySelector('.work-frame-caption').textContent=button.dataset.caption;
  const allFrames=[...panel.querySelectorAll('[data-frame]')],counter=panel.querySelector('.frame-counter');if(counter)counter.textContent=String(allFrames.indexOf(button)+1).padStart(2,'0')+' / '+String(allFrames.length).padStart(2,'0');
  panel.querySelectorAll('[data-proof-frame]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.proofFrame===key)));
  panel.querySelectorAll('[data-frame]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  panel.querySelectorAll('[data-process-key]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.processKey===key)));
 }));
}

const viewer=document.querySelector('.studio-lightbox');
if(viewer){let returnFocus;document.querySelectorAll('[data-enlarge]').forEach(button=>button.addEventListener('click',()=>{
 const original=button.dataset.imageSource?button.closest('[data-work-panel]').querySelector(button.dataset.imageSource):(button.querySelector('img')||button.closest('.photo-leaf')?.querySelector('img')),image=viewer.querySelector('img');if(!original)return;returnFocus=button;image.src=(original.currentSrc||original.src).replace(/-(480|960)\.webp$/,'-1600.webp');image.alt=original.alt;viewer.querySelector('figcaption').textContent=original.alt;viewer.showModal();
}));viewer.querySelector('[data-close-viewer]').addEventListener('click',()=>viewer.close());viewer.addEventListener('click',event=>{if(event.target===viewer){const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();}});viewer.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));}

const stack=document.querySelector('.toy-stack');
if(stack){
 let spriteUrls={};const spritesReady=loadIngredientSprites();
 const names={bread:'面包',beef:'牛肉',arugula:'芝麻菜',cheese:'奶酪',pepper:'甜椒'},recipeKey='echo-sandwich-recipe-v1';
 let layers=['bread','arugula','cheese','bread'];
 try{const saved=JSON.parse(sessionStorage.getItem(recipeKey));if(Array.isArray(saved)&&saved.length<=8&&saved.every(key=>Object.hasOwn(names,key)))layers=saved;}catch{/* Storage is optional; the recipe still works in memory. */}
 const buttons=[...document.querySelectorAll('[data-toy-ingredient]')],undo=document.querySelector('[data-toy-undo]'),reset=document.querySelector('[data-toy-reset]'),save=document.querySelector('[data-toy-save]'),note=document.querySelector('.toy-stack-note'),status=document.querySelector('.toy-save-status');
 function render(message){stack.replaceChildren(...layers.map((key,i)=>{const img=document.createElement('img');img.src=spriteUrls[key]||`/echo-gallery/images/ingredients/${key}.webp`;img.alt=`第 ${i+1} 层：${names[key]}`;img.style.setProperty('--layer',i);img.style.setProperty('--tilt',`${i%2?-3:2}deg`);return img;}));document.querySelector('#toy-count').textContent=`${layers.length} / 8 层`;buttons.forEach(b=>b.disabled=layers.length>=8);undo.disabled=reset.disabled=save.disabled=layers.length===0;if(message)note.textContent=message;status.textContent='';try{sessionStorage.setItem(recipeKey,JSON.stringify(layers));}catch{}}
 buttons.forEach(b=>b.addEventListener('click',()=>{if(layers.length>=8)return;layers.push(b.dataset.toyIngredient);render(layers.length===8?'够高了！留个纪念，或者撤回一层。':`放好一层${names[b.dataset.toyIngredient]}。还想加什么？`);}));
 undo.addEventListener('click',()=>{layers.pop();render(layers.length?'刚才那层先拿走。':'清空了。先放一片面包？');});reset.addEventListener('click',()=>{layers.length=0;render('桌面空出来了，换个搭配试试。');});
 document.querySelector('[data-toy-random]').addEventListener('click',()=>{const choices=['beef','arugula','cheese','pepper'];layers.splice(0,layers.length,'bread',...Array.from({length:3+Math.floor(Math.random()*3)},()=>choices[Math.floor(Math.random()*choices.length)]),'bread');render('运气给了你这一份。喜欢哪一层？');});
 save.addEventListener('click',async()=>{save.disabled=true;status.textContent='正在装进一张小卡片……';try{
  spriteUrls=await spritesReady;const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1100;const ctx=canvas.getContext('2d');ctx.fillStyle='#f2e6cb';ctx.fillRect(0,0,900,1100);ctx.fillStyle='#6f3e28';ctx.font='italic 72px Georgia';ctx.fillText('Today, made by you.',65,125);ctx.font='25px Arial';ctx.fillText('ECHO / SANDWICH EXPERIMENT',65,178);
  const images=await Promise.all(layers.map(key=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=spriteUrls[key];})));
  images.forEach((img,i)=>{ctx.save();ctx.translate(450,765-i*62);ctx.scale(1,.56);ctx.rotate(-.17+(i%2?.045:0));ctx.drawImage(img,-280,-280,560,560);ctx.restore();});ctx.strokeStyle='#bda983';ctx.beginPath();ctx.moveTo(65,933);ctx.lineTo(835,933);ctx.stroke();ctx.fillStyle='#745b3f';ctx.font='23px "Microsoft YaHei", Arial';ctx.fillText(layers.map(k=>names[k]).join(' · '),65,987,770);ctx.font='italic 35px Georgia';ctx.fillText('echo.',65,1050);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('export failed');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='echo-my-sandwich.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent='小卡片已保存。';
 }catch{status.textContent='暂时没能保存，可以再试一次。';}finally{save.disabled=layers.length===0;}});render();stack.dataset.controlsReady='true';spritesReady.then(urls=>{spriteUrls=urls;buttons.forEach(b=>b.querySelector('img').src=urls[b.dataset.toyIngredient]);render();stack.dataset.ready='true';}).catch(()=>{note.textContent='食材暂时没有载入，刷新后再试试。';});
}

const windowPhoto=document.querySelector('.window-photo');
if(windowPhoto){
 const image=windowPhoto.querySelector('img'),lens=windowPhoto.querySelector('.window-lens'),zoom=document.querySelector('#window-zoom'),detail=document.querySelector('[data-window-detail]');let x=.52,y=.7,close=false;
 function drawLens(){if(!image.complete||!image.naturalWidth)return;const r=image.getBoundingClientRect();const factor=Number(zoom.value);lens.style.left=`${x*100}%`;lens.style.top=`${y*100}%`;lens.style.backgroundImage=`url("${image.currentSrc}")`;lens.style.backgroundSize=`${r.width*factor}px ${r.height*factor}px`;lens.style.backgroundPosition=`${lens.clientWidth/2-x*r.width*factor}px ${lens.clientHeight/2-y*r.height*factor}px`;windowPhoto.classList.add('is-lens-ready');}
 windowPhoto.addEventListener('pointermove',event=>{const r=windowPhoto.getBoundingClientRect();x=Math.max(.15,Math.min(.85,(event.clientX-r.left)/r.width));y=Math.max(.18,Math.min(.8,(event.clientY-r.top)/r.height));drawLens();});
 windowPhoto.addEventListener('pointerdown',event=>{const r=windowPhoto.getBoundingClientRect();x=Math.max(.15,Math.min(.85,(event.clientX-r.left)/r.width));y=Math.max(.18,Math.min(.8,(event.clientY-r.top)/r.height));drawLens();});
 windowPhoto.addEventListener('keydown',event=>{const delta={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]}[event.key];if(!delta)return;event.preventDefault();x=Math.max(.15,Math.min(.85,x+delta[0]));y=Math.max(.18,Math.min(.8,y+delta[1]));drawLens();});
 zoom.addEventListener('input',drawLens);image.addEventListener('load',drawLens);window.addEventListener('resize',drawLens);window.addEventListener('studio-work-change',()=>requestAnimationFrame(drawLens));
 detail.addEventListener('click',()=>{close=!close;const key=close?'fuli-miniature':'fuli-photo-window-miniature';image.srcset=`/echo-gallery/images/${key}-480.webp 480w, /echo-gallery/images/${key}-960.webp 960w, /echo-gallery/images/${key}-1600.webp 1600w`;image.src=`/echo-gallery/images/${key}-960.webp`;image.alt=close?'微缩桌椅、蕾丝与手写纸条的近景':'福里窗台上的微缩柜子、桌椅和布料';detail.setAttribute('aria-pressed',String(close));detail.querySelector('[data-window-detail-label]').textContent=close?'退后看整扇窗':'再走近一点';x=.52;y=.55;});drawLens();
}

