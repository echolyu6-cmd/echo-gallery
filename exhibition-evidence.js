export function createGalleryEvidence({root,works,labels}){
 const view=root.querySelector('[data-gallery-evidence]'),quotes=new Map([...view.querySelectorAll('[data-gallery-quote]')].map(q=>[q.dataset.galleryQuote,q]));
 let active=works[0].id,phone=false;
 function show(id){if(!quotes.has(id))return;for(const [key,quote]of quotes)quote.hidden=key!==id;view.hidden=false;root.dataset.evidenceExhibit=id;}
 function browse(id,isPhone){active=id;phone=isPhone;root.dataset.overviewExhibit=id;root.dataset.galleryLayout=phone?'close':'overview';labels.querySelectorAll('[data-exhibit]').forEach(link=>{if(phone&&link.dataset.exhibit===active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});if(phone)show(id);else hide();}
 function hide(){if(phone)show(active);else{view.hidden=true;delete root.dataset.evidenceExhibit;}}
 return {browse,show,hide};
}
