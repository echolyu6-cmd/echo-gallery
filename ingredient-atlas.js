// Slice the atlas once; neutral matte pixels are removed during sprite decoding.
// The warm food pixels retain their original colour and texture.
export const loadIngredientSprites = ()=>new Promise((resolve,reject)=>{
 const atlas=new Image();atlas.onerror=reject;atlas.onload=()=>{
  const names=['bread','beef','arugula','cheese','pepper'],sprites={};
  names.forEach((name,i)=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=480;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(atlas,(i%3)*atlas.width/3,Math.floor(i/3)*atlas.height/2,atlas.width/3,atlas.height/2,0,0,480,480);
   const pixels=ctx.getImageData(0,0,480,480),d=pixels.data;
   for(let k=0;k<d.length;k+=4){const chroma=Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2]);d[k+3]=Math.round(255*Math.max(0,Math.min(1,(chroma-12)/12)));}
   ctx.putImageData(pixels,0,0);sprites[name]=canvas.toDataURL('image/png');
  });resolve(sprites);
 };atlas.src='/echo-gallery/images/ingredients/atlas-v2.webp';
});
