// Progressive enhancement. Content and navigation remain available without JS.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

const search=document.querySelector('.index-search input');
if(search){
  let kind='all';
  const rows=[...document.querySelectorAll('.index-row,.pending-row')];
  const buttons=[...document.querySelectorAll('[data-filter]')];
  function filter(){
    const query=search.value.trim().toLocaleLowerCase();
    let count=0;
    rows.forEach(row=>{const show=(kind==='all'||kind===row.dataset.kind)&&row.dataset.search.toLocaleLowerCase().includes(query);row.hidden=!show;if(show)count++;});
    document.querySelectorAll('.index-group').forEach(group=>group.hidden=![...group.querySelectorAll('.index-row')].some(row=>!row.hidden));
    document.querySelector('.index-empty').hidden=count>0;
    document.querySelector('#index-status').textContent=`找到 ${count} 件内容`;
    const extra=document.querySelector('.index-pending');if(extra)extra.hidden=![...document.querySelectorAll('.pending-row')].some(row=>!row.hidden);
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.filter;buttons.forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});filter();}));
  search.addEventListener('input',filter);
}

const stack=document.querySelector('#sandwich-stack');
if(stack){
  const ingredients=[...document.querySelectorAll('[data-ingredient]')];
  const undo=document.querySelector('#undo-layer'),reset=document.querySelector('#reset-layers'),save=document.querySelector('#save-recipe');
  const layers=[];
  function render(message){
    stack.replaceChildren(...layers.map((layer,i)=>{
      const image=document.createElement('img');image.src=`/echo-gallery/images/ingredients/${layer.key}.webp`;image.alt=`第 ${i+1} 层：${layer.name}`;
      image.style.setProperty('--layer',i);image.style.setProperty('--tilt',`${i%2===0?-3:3}deg`);return image;
    }));
    document.querySelector('.sandwich-empty').hidden=layers.length>0;
    document.querySelector('#layer-count').textContent=`${layers.length} / 8 层`;
    ingredients.forEach(b=>b.disabled=layers.length>=8);
    undo.disabled=reset.disabled=save.disabled=layers.length===0;
    document.querySelector('.sandwich-status').textContent=message;
  }
  ingredients.forEach(b=>b.addEventListener('click',()=>{if(layers.length>=8)return;layers.push({key:b.dataset.ingredient,name:b.dataset.name});render(layers.length===8?'已经叠了八层。留下它，或重新组合。':`放好一层${b.dataset.name}。还想加点什么？`);}));
  undo.addEventListener('click',()=>{layers.pop();render('撤回一层。');});
  reset.addEventListener('click',()=>{layers.length=0;render('桌面清空了，可以重新来过。');});
  save.addEventListener('click',()=>{
    const recipe=`我的赛博三明治\n\n${layers.map((l,i)=>`${i+1}. ${l.name}`).join('\n')}\n\n来自 Echo 的网页实验。线上组合不代表线下菜单。\n`;
    const url=URL.createObjectURL(new Blob([recipe],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='my-sandwich.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.querySelector('.sandwich-status').textContent='这份组合已保存为文字文件。';
  });
}

document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const status=document.querySelector('#copy-status');
  const preview=document.querySelector('[data-copy-preview]'),value=button.dataset.copy;
  try{await navigator.clipboard.writeText(value);if(preview)preview.hidden=true;if(status)status.textContent='已复制。';}
  catch{if(preview){preview.textContent=value;preview.hidden=false;preview.focus();}if(status)status.textContent=preview?'自动复制暂不可用，可选中已显示的文字复制。':'未能自动复制，请选中联系方式复制。';}
}));
