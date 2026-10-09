// Unfurl a site's photographic sheet; the image is the original project photograph.
export function unfurlSheet(board,progress){
 const edge=1-progress;
 for(const sheet of [board.paper,board.surface]){
  const geo=sheet.geometry,pos=geo.attributes.position,uv=geo.attributes.uv;
  if(!geo.userData.restY)geo.userData.restY=Array.from({length:pos.count},(_,i)=>pos.getY(i));
  if(!geo.userData.restZ)geo.userData.restZ=Array.from({length:pos.count},(_,i)=>pos.getZ(i));
  for(let i=0;i<pos.count;i++){
   const v=uv.getY(i),u=uv.getX(i),y=geo.userData.restY[i],z=geo.userData.restZ[i];
   if(v<edge){const angle=(edge-v)*Math.PI*2,radius=.085;pos.setY(i,edge-.5+Math.sin(angle)*radius);pos.setZ(i,z+(1-Math.cos(angle))*radius*2.3);}
   else{pos.setY(i,y);pos.setZ(i,z+Math.sin(progress*Math.PI)*.085*Math.sin(u*Math.PI)*Math.exp(-(v-edge)*5));}
  }
  pos.needsUpdate=true;geo.computeVertexNormals();
 }
}
