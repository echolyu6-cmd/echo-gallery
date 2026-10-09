import * as THREE from './vendor/three/three.module.min.js?v=1a14f6017b36';
import {unfurlSheet} from './material-opening.js?v=1a14f6017b36';

// Display surfaces belong to the website; photographs and text belong to the works.
export async function mountExhibition(host, {works, signal, ...callbacks}) {
 if(signal?.aborted)throw new DOMException('Exhibition cancelled','AbortError');
 const stage=host.parentElement, reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,80);
 const geometrySet=new Set(),materialSet=new Set(),textureSet=new Set(),cache=new Map(),backCache=new Map(),boards=new Map();
 const loader=new THREE.TextureLoader(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const eye=new THREE.Vector3(),aim=new THREE.Vector3();
 let width=1,height=1,span=7,mobile=false,selected=null,hovered=null,disposed=false,suspended=false;
 let transition=null,opening=null,frame=0,last=0,drag=null,orbit=0,orbitTarget=0,restingOrbit=0,readingFocus=false,observer,handlers={};
 const openingDuration=2900;
 let overviewId=works[0].id;
 host.dataset.opening='done';
 const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.82,...extra});materialSet.add(m);return m;};
 const basic=extra=>{const m=new THREE.MeshBasicMaterial(extra);materialSet.add(m);return m;};
 const cream=mat('#fffaf0',{roughness:.96,emissive:'#f8f1e3',emissiveIntensity:.085}),edge=mat('#ebe3d4',{roughness:1}),metal=mat('#8b7157',{metalness:.4,roughness:.55});
 function owned(material){const m=material.clone();materialSet.add(m);return m;}
 function mesh(geometry,material,parent,pos=[0,0,0]){geometrySet.add(geometry);const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(parent,w,h,d,pos,material)=>mesh(new THREE.BoxGeometry(w,h,d),material,parent,pos);
 function textTexture(work,back=false,content=work.media,aspect=.8){
  if(!back&&work.presentation?.editorial&&!content.image)return editorialTexture(work,content);
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.round(1200/aspect);const ch=canvas.height;
  const type=work.presentation?.type||'print',hanging=back&&type==='hanging',manuscript=back&&type==='manuscript';
  const c=canvas.getContext('2d');c.fillStyle=hanging?'#f4ecdc':back?'#fbfaf4':'#fffdf5';c.fillRect(0,0,1200,ch);
  c.fillStyle=hanging?'#8c6c51':'#536b5c';c.font='25px "Microsoft YaHei",sans-serif';
  c.fillText(back?(work.id==='hroot'?'HRoot / 2019.07.09':work.title):work.kind,100,115);
  c.strokeStyle=hanging?'#d8c9af':'#c8cebf';c.lineWidth=2;c.beginPath();c.moveTo(100,150);c.lineTo(1100,150);c.stroke();
  function wrap(text,size,maxWidth){c.font=`${size}px "Songti SC", "SimSun", serif`;const lines=[];let line='';for(const char of text){if(c.measureText(line+char).width>maxWidth&&line){lines.push(line);line=char;}else line+=char;}if(line)lines.push(line);return lines;}
  const main=back?work.back.artifact?.lines.join('\n')||work.back.details[0]?.text||work.back.summary:(content.lines||[]).join('\n');
  const size=content.overview?135:hanging?88:back?64:67;
  const lines=main.split('\n').flatMap(line=>wrap(line,size,970));
  c.fillStyle=hanging?'#80543f':'#294f42';c.font=`${size}px "Songti SC", "SimSun", serif`;
  const lineHeight=content.overview?185:hanging?132:106;
  const start=hanging?Math.max(260,Math.min(ch*.58,ch-200-lines.length*lineHeight)):manuscript?Math.max(290,ch*.27):Math.max(260,(ch-lines.length*lineHeight)/2+30);
  lines.slice(0,9).forEach((line,i)=>c.fillText(line,100,start+i*lineHeight));
  c.fillStyle='#798474';c.font='25px "Microsoft YaHei",sans-serif';c.fillText(back?work.back.artifact?.caption||'创作笔记 · Echo':work.year+' · Echo',100,ch-100);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textureSet.add(texture);return texture;
 }
 function editorialTexture(work,content){
  // This is the website's typesetting of an attributed original, not a scan of its publication.
  const editorial=work.presentation.editorial,canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1500;
  const c=canvas.getContext('2d'),left=106,right=1094;c.fillStyle='#faf7ee';c.fillRect(0,0,1200,1500);
  const wrap=(text,size,width)=>{c.font=`${size}px "Songti SC","SimSun",serif`;const lines=[];let line='';for(const char of text){if(c.measureText(line+char).width>width&&line){lines.push(line);line=char;}else line+=char;}if(line)lines.push(line);return lines;};
  c.fillStyle='#925c43';c.fillRect(left,94,8,66);c.font='27px "Microsoft YaHei",sans-serif';c.fillText(editorial.kicker,left+31,121);
  c.fillStyle='#6c7669';c.font='26px "Microsoft YaHei",sans-serif';c.fillText(editorial.deck,left+31,159);
  c.strokeStyle='#cbd0c0';c.lineWidth=2;c.beginPath();c.moveTo(left,206);c.lineTo(right,206);c.stroke();
  const configuredLines=work.presentation.overviewLines;
  const titleParts=configuredLines?.join('')===editorial.title.replace(/\n/g,'')?configuredLines:editorial.title.split('\n');
  const titleLines=titleParts.flatMap(line=>wrap(line,121,right-left));
  c.font='121px "Songti SC","SimSun",serif';c.fillStyle='#284a3d';titleLines.forEach((line,i)=>c.fillText(line,left,385+i*166));
  const excerpt=content.overview?'':(content.lines||[]).join('');
  if(excerpt){const start=445+titleLines.length*166;const lines=wrap(excerpt,39,right-left);c.fillStyle='#596756';c.font='39px "Songti SC","SimSun",serif';lines.slice(0,Math.max(0,Math.floor((1270-start)/66))).forEach((line,i)=>c.fillText(line,left,start+i*66));}
  c.strokeStyle='#cbd0c0';c.beginPath();c.moveTo(left,1360);c.lineTo(right,1360);c.stroke();
  c.fillStyle='#6c7669';c.font='26px "Microsoft YaHei",sans-serif';c.fillText(editorial.credit,left,1416);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textureSet.add(texture);return texture;
 }
 async function imageTexture(key){
  if(disposed||signal?.aborted)throw new DOMException('Exhibition cancelled','AbortError');
  if(cache.has(key))return cache.get(key);
  const size=host.clientWidth<760?480:960;
  const pending=loader.loadAsync(`/echo-gallery/images/${key}-${size}.webp`).then(t=>{if(disposed){t.dispose();throw new Error('Exhibition disposed');}t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textureSet.add(t);return t;});
  let cancelTexture;
  const cancellation=signal?new Promise((resolve,reject)=>{cancelTexture=()=>reject(new DOMException('Exhibition cancelled','AbortError'));signal.addEventListener('abort',cancelTexture,{once:true});}):null;
  const promise=(cancellation?Promise.race([pending,cancellation]):pending).catch(err=>{cache.delete(key);throw err;}).finally(()=>{if(cancelTexture)signal.removeEventListener('abort',cancelTexture);});
  cache.set(key,promise);return promise;
 }
 function paperGeometry(w=1,h=1,amount=.06){const geo=new THREE.PlaneGeometry(w,h,28,30),pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++){const u=uv.getX(i),v=uv.getY(i);pos.setZ(i,Math.sin(u*Math.PI)*amount+Math.pow(1-v,3)*Math.sin(u*Math.PI*1.4)*amount*.5);}geo.computeVertexNormals();return geo;}
 function smallPrint(text){const canvas=document.createElement('canvas');canvas.width=900;canvas.height=120;const c=canvas.getContext('2d');c.fillStyle='#8b593f';c.font='30px "Microsoft YaHei",sans-serif';c.fillText(text,22,75);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textureSet.add(t);return t;}
 scene.add(new THREE.HemisphereLight(0xfffcf2,0xb9b8a7,1.85));
 const sun=new THREE.DirectionalLight(0xfff3df,1.9);sun.position.set(-6,11,7);sun.castShadow=true;const shadowSize=host.clientWidth<760?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-12,right:12,top:11,bottom:-8,near:.1,far:35});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xeef3f1,.80);fill.position.set(8,4,3);scene.add(fill);
 sun.shadow.radius=3.5;
 const abort=()=>cleanup();signal?.addEventListener('abort',abort,{once:true});
 try{
  await Promise.all(works.map(async (work,i)=>{
   const g=new THREE.Group();g.userData.exhibit=work.id;scene.add(g);
   const sheet=!work.media.image,type=work.presentation?.type||(sheet?'manuscript':'print'),texture=sheet?textTexture(work):await imageTexture(work.media.image);
   const ratio=texture.image.width/texture.image.height,w=type==='hanging'?Math.min(5.1,6.2*ratio):sheet?2.75:3.65,h=sheet?3.45:type==='foldout'?2.65:w/ratio,center=h/2+.4;
   const localCream=owned(cream),localEdge=owned(edge),localMetal=owned(metal);
   const pivot=new THREE.Group();pivot.position.y=center;g.add(pivot);
   const paper=mesh(paperGeometry(type==='hanging'?1:w,type==='hanging'?1:h,type==='hanging'?.035:.055),localCream,pivot,[0,0,0]);paper.material.side=THREE.DoubleSide;
   const surface=mesh(paperGeometry(1,1,type==='hanging'?.018:.025),basic({map:texture,toneMapped:false}),pivot,[0,type==='foldout'?.16:0,.10]);surface.castShadow=false;
   const backTexture=textTexture(work,true,work.media,w/h);backCache.set(`${work.id}/${(w/h).toFixed(4)}`,backTexture);
   const rear=mesh(new THREE.PlaneGeometry(type==='hanging'?1:w-.02,type==='hanging'?1:h-.02),basic({map:backTexture,toneMapped:false}),pivot,[0,0,type==='manuscript'?-.205:-.034]);rear.rotation.y=Math.PI;rear.castShadow=false;
   const leaves=[],wings=[],rig=[],supports=[];
   if(type==='hanging'){
    rig.push({mesh:box(pivot,1,.025,.025,[0,h/2+.025,-.025],localMetal),kind:'rail'});
    for(const sign of [-1,1]){rig.push({mesh:box(pivot,.07,.10,.035,[sign*w*.37,h/2-.018,.04],localMetal),kind:'clip',sign});const cord=mesh(new THREE.CylinderGeometry(.004,.004,.5,8),localEdge,pivot,[sign*w*.37,h/2+.27,-.023]);cord.castShadow=false;rig.push({mesh:cord,kind:'cord',sign});}
   }else if(type==='foldout'){
    const note=mesh(new THREE.PlaneGeometry(w-.16,.34),basic({map:smallPrint('方案 / 入口形象区'),transparent:true,toneMapped:false}),pivot,[0,-h/2+.19,.13]);note.castShadow=false;
    for(const [side,content]of (work.presentation?.wings||[]).entries()){
     const sign=side===0?-1:1,wing=new THREE.Group();wing.position.x=sign*w/2;pivot.add(wing);const ww=1.10;
     const fold=mesh(new THREE.PlaneGeometry(ww,h),owned(localCream),wing,[sign*ww/2,0,0]);fold.material.side=THREE.DoubleSide;
     const wt=await imageTexture(content.image),ratio=wt.image.width/wt.image.height,iw=Math.min(ww-.13,(h-.55)*ratio),ih=iw/ratio;
     const wm=mesh(new THREE.PlaneGeometry(iw,ih),basic({map:wt,toneMapped:false}),wing,[sign*ww/2,.10,.023]);wm.castShadow=false;
     const tag=mesh(new THREE.PlaneGeometry(ww-.07,.25),basic({map:smallPrint(content.caption),transparent:true,toneMapped:false}),wing,[sign*ww/2,-h/2+.17,.026]);tag.castShadow=false;
     const wingMaterials=new Set();wing.traverse(o=>{if(o.material)wingMaterials.add(o.material);});wings.push({group:wing,sign,materials:wingMaterials});
    }
   }else if(type==='manuscript'){
    for(let j=0;j<2;j++){const leaf=mesh(paperGeometry(w,h,.09+j*.02),owned(cream),pivot,[.055*(j+1),-.022*(j+1),-.08*(j+1)]);leaf.rotation.y=-.025*(j+1);leaf.material.side=THREE.DoubleSide;leaves.push(leaf);}
    box(pivot,.035,h-.04,.022,[-w/2+.024,0,-.19],mat('#925c43',{roughness:.9}));
   }
   const overviewTexture=work.presentation?.openingImage?await imageTexture(work.presentation.openingImage):work.presentation?.overviewLines?textTexture(work,false,{lines:work.presentation.overviewLines,overview:true}):null;
   const board={id:work.id,work,g,pivot,paper,rear,rig,supports,surface,w,h,center,type,leaves,wings,overviewTexture,currentTexture:texture,baseAngle:0,baseTilt:0,angle:0,targetAngle:0,attention:0,opacity:1,scale:1,baseScale:1,basePosition:new THREE.Vector3(),request:0,swap:null};boards.set(work.id,board);
   board.materials=new Set();g.traverse(o=>{if(o.material)board.materials.add(o.material);});for(const m of board.materials){m.userData.baseOpacity=m.opacity;m.transparent=true;}
   fitSurface(board,texture);board.index=i;
   if(overviewTexture)fitSurface(board,overviewTexture);
  }));
 }catch(error){cleanup();throw error;}
 function fitSurface(b,t){const ratio=t.image.width/t.image.height;
  if(b.type==='hanging'){
   b.w=Math.min(5.1,6.2*ratio);b.h=b.w/ratio;b.center=b.h/2+.4;b.pivot.position.y=b.center;b.paper.scale.set(b.w,b.h,1);b.rear.scale.set(b.w-.02,b.h-.02,1);
   const key=`${b.id}/${(b.w/b.h).toFixed(4)}`;if(!backCache.has(key))backCache.set(key,textTexture(b.work,true,b.work.media,b.w/b.h));b.rear.material.map=backCache.get(key);
   for(const part of b.rig){if(part.kind==='rail'){part.mesh.scale.x=b.w+.12;part.mesh.position.y=b.h/2+.025;}else{part.mesh.position.x=part.sign*b.w*.37;part.mesh.position.y=b.h/2+(part.kind==='clip'?-.018:.27);}}
  }
  const fw=Math.min(b.w-.025,(b.h-(b.type==='foldout'?.46:.025))*ratio);b.surface.scale.set(fw,fw/ratio,1);b.surface.material.map=t;b.surface.material.needsUpdate=true;
 }
 function arrange(){const n=works.length;for(const [id,b]of boards){const i=b.index;
   if(n===3){const poses=mobile?[[-1.1,.35,1.8],[1.15,.65,-2.0],[2.5,.81,2.65]]:[[-3.8,.18,.70],[.75,-.38,-.50],[4.1,1.50,.30]];b.g.position.set(...poses[i]);b.baseAngle=[.05,-.12,-.13][i];b.baseTilt=(mobile?[-.02,.025,-.035]:[-.035,.065,-.095])[i];b.baseScale=(mobile?[.9,.8,.70]:[1.04,.94,.88])[i];}
   else{b.g.position.set((i-(n-1)/2)*4.85,0,i%2?-.40:.4);b.baseAngle=(i-(n-1)/2)*-.18;b.baseTilt=i%2?.04:-.04;b.baseScale=1;}
   b.scale=selected===id?1:b.baseScale;b.g.scale.setScalar(b.scale);
   b.basePosition.copy(b.g.position);b.g.rotation.set(0,b.baseAngle,b.baseTilt);
   b.wings.forEach(wing=>{wing.group.visible=!mobile||selected===id;});
  }
 }
 function targetView(){const aspect=width/height;
  if(!selected){
   if(mobile){const b=boards.get(overviewId),a=b.basePosition.clone();a.y+=b.center*b.baseScale+.12;return {aim:a,eye:a.clone().add(new THREE.Vector3(1.3,2.3,18)),span:Math.max(b.h*b.baseScale+.85,(b.w*b.baseScale+.70)/aspect)};}
   const a=new THREE.Vector3(.1,2.1,.15);return {aim:a,eye:a.clone().add(new THREE.Vector3(1.4,2.0,20)),span:Math.max(6.5,14.8/aspect)};
  }
  const b=boards.get(selected),center=b.basePosition.clone();center.y+=b.center;
  const offset=new THREE.Vector3(1,1.15,18),right=new THREE.Vector3(offset.z,0,-offset.x).normalize();
  center.addScaledVector(right,mobile||readingFocus?0:1.95);
  return {aim:center,eye:center.clone().add(offset),span:mobile?Math.max(b.h+.50,(b.w+(b.type==='foldout'?1.75:.5))/aspect):Math.max(b.h+.7,4.0)};
 }
 function applyView(v){eye.copy(v.eye);aim.copy(v.aim);span=v.span;const direction=eye.clone().sub(aim).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),orbit*.7),distance=span/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2));camera.position.copy(aim).addScaledVector(direction,distance);camera.lookAt(aim);camera.aspect=width/height;camera.updateProjectionMatrix();}
 function finishSwap(b){if(!b.swap)return;const old=b.swap.old;if(old){old.removeFromParent();geometrySet.delete(old.geometry);materialSet.delete(old.material);old.geometry.dispose();old.material.dispose();}b.surface.material.opacity=b.opacity;b.swap=null;}
 function finishOpening(wakeFrame=true){
  if(!opening)return;opening=null;host.dataset.opening='done';
  applyView(targetView());
  for(const b of boards.values()){
   b.g.position.copy(b.basePosition);b.g.rotation.set(0,b.baseAngle+(selected===b.id?-.045:0),selected===b.id?0:b.baseTilt);b.g.scale.setScalar(b.scale);
   b.pivot.rotation.x=0;b.pivot.rotation.z=0;
   if(b.type==='hanging')unfurlSheet(b,1);bendPaper(b,0);
   for(const wing of b.wings){wing.group.visible=!mobile||selected===b.id;wing.group.rotation.y=wing.sign*.62;for(const m of wing.materials)m.opacity=m.userData.baseOpacity*b.opacity;}
   b.leaves.forEach((leaf,j)=>{leaf.position.set(.055*(j+1),-.022*(j+1),-.08*(j+1));leaf.rotation.set(0,-.025*(j+1),0);});
  }
  callbacks.onOpening?.(false);if(wakeFrame)wake();
 }
 function playOpening(){
  if(disposed||suspended||document.hidden||selected||reduced.matches)return false;
  finishOpening();resize();opening={start:performance.now(),duration:mobile?1800:openingDuration};transition=null;hovered=null;orbit=orbitTarget=restingOrbit=0;
  for(const b of boards.values()){b.angle=b.targetAngle=0;b.attention=0;finishSwap(b);b.wings.forEach(w=>w.group.visible=true);}
  applyOpeningView(0);host.dataset.opening='playing';callbacks.onOpening?.(true);wake();return true;
 }
 function applyOpeningView(progress){
  const end=targetView(),t=THREE.MathUtils.smootherstep(progress,.04,1);
  const fromAim=mobile?end.aim.clone():new THREE.Vector3(-.30,1.15,.15),fromEye=mobile?end.eye.clone().add(new THREE.Vector3(-.4,1.5,.8)):fromAim.clone().add(new THREE.Vector3(4.0,10,16));
  applyView({aim:fromAim.lerp(end.aim,t),eye:fromEye.lerp(end.eye,t),span:THREE.MathUtils.lerp(end.span*1.09,end.span,t)});
 }
 function bendPaper(b,amount){
  for(const sheet of [b.paper,b.surface]){const geometry=sheet.geometry,positions=geometry.attributes.position,uv=geometry.attributes.uv;
   if(!geometry.userData.restZ)geometry.userData.restZ=Array.from({length:positions.count},(_,i)=>positions.getZ(i));
   for(let i=0;i<positions.count;i++)positions.setZ(i,geometry.userData.restZ[i]+amount*Math.sin(uv.getX(i)*Math.PI)*Math.sin(uv.getY(i)*Math.PI*1.3));
   positions.needsUpdate=true;geometry.computeVertexNormals();
  }
 }
 function animateTo(){const v=targetView();if(reduced.matches){transition=null;applyView(v);}else transition={from:{eye:eye.clone(),aim:aim.clone(),span},to:v,start:performance.now()};wake();}
 function browse(id,{immediate=false,notify=true}={}){
  if(disposed||!boards.has(id))return false;overviewId=id;host.dataset.overviewExhibit=id;
  if(!selected){finishOpening();if(immediate){transition=null;applyView(targetView());wake();}else animateTo();}
  if(notify)callbacks.onBrowse?.(id,mobile);return true;
 }
 function focus(id,{reading=false}={}){if(!boards.has(id)||disposed)return;finishOpening();const changed=selected!==id||readingFocus!==reading;selected=id;readingFocus=reading;hovered=null;orbitTarget=restingOrbit=0;const b=boards.get(id);if(b.overviewTexture)fitSurface(b,b.currentTexture);b.wings.forEach(w=>w.group.visible=true);if(changed)animateTo();else wake();callbacks.onView?.({id,mode:'focus'});}
 function overview({restoreOrbit=0}={}){finishOpening();selected=null;readingFocus=false;hovered=null;orbitTarget=restingOrbit=reduced.matches?0:THREE.MathUtils.clamp(restoreOrbit,-.65,.65);for(const b of boards.values()){b.targetAngle=0;finishSwap(b);if(b.overviewTexture)fitSurface(b,b.overviewTexture);b.wings.forEach(w=>w.group.visible=!mobile);}animateTo();callbacks.onView?.({id:null,mode:'overview'});}
 function surfaceRect(id){
  const b=boards.get(id);if(!b||disposed)return null;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const bounds=host.getBoundingClientRect(),corners=[[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5]].map(([x,y])=>b.surface.localToWorld(new THREE.Vector3(x,y,0)).project(camera));
  const xs=corners.map(p=>bounds.left+(p.x*.5+.5)*width),ys=corners.map(p=>bounds.top+(-p.y*.5+.5)*height);
  const rect={left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  return Object.values(rect).every(Number.isFinite)&&rect.width>0&&rect.height>0?rect:null;
 }
 function flip(id,value){const b=boards.get(id);if(!b)return;finishOpening();b.targetAngle=value?Math.PI:0;wake();}
 function hover(id){if(hovered===id)return;hovered=id;callbacks.onHover?.(id);wake();}
 function draw(now){frame=0;if(disposed||suspended||document.hidden)return;const dt=Math.min(.05,Math.max(.016,(now-last)/1000));last=now;let settling=false;
  if(transition){const t=Math.min(1,(now-transition.start)/650),e=t*t*(3-2*t);applyView({eye:new THREE.Vector3().lerpVectors(transition.from.eye,transition.to.eye,e),aim:new THREE.Vector3().lerpVectors(transition.from.aim,transition.to.aim,e),span:THREE.MathUtils.lerp(transition.from.span,transition.to.span,e)});if(t===1)transition=null;settling=true;}
  if(opening&&now-opening.start>=opening.duration)finishOpening(false);
  const openingTime=opening?now-opening.start:null,openingProgress=opening?openingTime/opening.duration:1;if(opening){settling=true;applyOpeningView(openingProgress);}
  const smooth=reduced.matches?1:1-Math.exp(-dt*10);orbit+=(orbitTarget-orbit)*smooth;if(Math.abs(orbitTarget-orbit)>.001)settling=true;if(orbit!==0)applyView({eye,aim,span});
  for(const [id,b]of boards){const wanted=!opening&&!reduced.matches&&id===hovered?1:0,targetOpacity=selected&&id!==selected?0:mobile&&!selected&&id!==overviewId?0:1,targetScale=selected===id?1:b.baseScale;b.attention+=(wanted-b.attention)*smooth;b.angle+=(b.targetAngle-b.angle)*smooth;b.opacity+=(targetOpacity-b.opacity)*smooth;b.scale+=(targetScale-b.scale)*smooth;if(Math.abs(b.targetAngle-b.angle)>.001||Math.abs(wanted-b.attention)>.001||Math.abs(targetOpacity-b.opacity)>.001||Math.abs(targetScale-b.scale)>.001)settling=true;b.g.visible=b.opacity>.001;b.pivot.rotation.y=b.angle;b.pivot.rotation.x=0;b.pivot.rotation.z=0;b.g.rotation.set(0,b.baseAngle+(selected===id?-.045:0),selected===id?0:b.baseTilt);b.g.position.copy(b.basePosition);b.g.scale.setScalar(b.scale);
   const response=reduced.matches?0:b.attention;
   const paperTilt=b.type==='hanging'?response*.013:0;b.paper.rotation.z=b.surface.rotation.z=paperTilt;b.rear.rotation.z=-paperTilt;
   for(const m of b.materials){m.opacity=m.userData.baseOpacity*b.opacity;m.depthWrite=b.opacity>.9;}
   for(const wing of b.wings)wing.group.rotation.y=wing.sign*(.62-response*.18);
   b.leaves.forEach((leaf,j)=>{leaf.position.set(.075*(j+1)+response*.06*(j+1),-.022*(j+1),-.08*(j+1));leaf.rotation.set(0,-.025*(j+1)-response*.035,-.035*(j+1));});
   if(opening){
    const t=THREE.MathUtils.clamp((openingTime-(mobile?50:180)-b.index*(mobile?80:170))/(mobile?1450:2250),0,1),p=THREE.MathUtils.smootherstep(t,0,1);
    const start=mobile?b.basePosition.clone():new THREE.Vector3((b.index-1)*.75,.40,1.25);
    if(b.type==='hanging'){start.x+=mobile?.45:0;start.y-=.35;}
    b.g.position.lerpVectors(start,b.basePosition,p);b.g.rotation.x=-(b.type==='hanging'?.16:b.type==='foldout'?.62:Math.PI/2)*(1-p);b.g.rotation.z=b.baseTilt*p;
    const unfolded=THREE.MathUtils.smootherstep(p,.12,.86);
    for(const wing of b.wings){wing.group.visible=true;wing.group.rotation.y=wing.sign*THREE.MathUtils.lerp(1.46,.62,unfolded);if(mobile){const fade=1-THREE.MathUtils.smoothstep(p,.92,1);for(const m of wing.materials)m.opacity*=fade;}}
    const fan=Math.sin(unfolded*Math.PI);b.leaves.forEach((leaf,j)=>{leaf.position.x+=fan*.18*(j+1);leaf.position.y-=fan*.07*(j+1);leaf.rotation.z=fan*.075*(j+1);});
    if(b.type==='hanging')unfurlSheet(b,(mobile?.6:0)+(mobile?.4:1)*THREE.MathUtils.smootherstep(p,.05,.94));else bendPaper(b,Math.sin(p*Math.PI)*.075);
   }
   if(b.swap){const t=reduced.matches?1:Math.min(1,(now-b.swap.start)/380),e=t*t*(3-2*t);b.surface.material.opacity=b.opacity*e;if(b.swap.old)b.swap.old.material.opacity=b.opacity*(1-e);if(t===1)finishSwap(b);else settling=true;}
  }
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const points={};for(const [id,b]of boards){const center=b.pivot.localToWorld(new THREE.Vector3(0,0,.2)).project(camera),corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>b.pivot.localToWorld(new THREE.Vector3(x*b.w/2,y*b.h/2,.1)).project(camera));const xs=corners.map(p=>(p.x*.5+.5)*width),ys=corners.map(p=>(-p.y*.5+.5)*height),map=b.surface.material.map;points[id]={x:(center.x*.5+.5)*width,y:Math.max(...ys)+20,centerX:(center.x*.5+.5)*width,centerY:(-center.y*.5+.5)*height,displayWidth:Math.max(...xs)-Math.min(...xs),displayHeight:Math.max(...ys)-Math.min(...ys),sourceRatio:map.image.width/map.image.height,surfaceRatio:b.surface.scale.x/b.surface.scale.y,visible:!selected&&center.z<1};}callbacks.onPositions?.(points);
  renderer.render(scene,camera);host.dataset.transition=transition||settling?'true':'false';host.dataset.viewAngle=orbit.toFixed(3);host.dataset.visibleExhibits=String([...boards.values()].filter(b=>b.opacity>.09).length);host.dataset.hoverExhibit=hovered||'';
  host.dataset.materialResponse=JSON.stringify(Object.fromEntries([...boards].map(([id,b])=>[id,{type:b.type,objectY:b.g.position.y,objectRotation:b.g.rotation.y,paperTilt:b.surface.rotation.z,railY:b.rig.find(part=>part.kind==='rail')?.mesh.position.y??null,wingAngles:b.wings.map(wing=>wing.group.rotation.y),leafOffsets:b.leaves.map(leaf=>leaf.position.x)}])));
  host.dataset.openingProgress=opening?Math.min(1,openingTime/openingDuration).toFixed(3):'1';
  if(transition||settling)frame=requestAnimationFrame(draw);
 }
 function wake(){if(!frame&&!disposed&&!suspended&&!document.hidden){host.dataset.transition='true';last=performance.now();frame=requestAnimationFrame(draw);}}
 function resize(){const nextWidth=host.clientWidth,nextHeight=host.clientHeight;if(!nextWidth||!nextHeight||nextWidth===width&&nextHeight===height)return;finishOpening();width=nextWidth;height=nextHeight;mobile=width<=760;arrange();callbacks.onBrowse?.(overviewId,mobile);host.dataset.overviewExhibit=overviewId;host.dataset.galleryLayout=mobile?'close':'overview';transition=null;renderer.setSize(width,height);applyView(targetView());wake();}
 function pick(event){const r=host.getBoundingClientRect();pointer.set((event.clientX-r.left)/width*2-1,-(event.clientY-r.top)/height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...boards.values()].filter(b=>b.g.visible&&(!selected||b.id===selected)&&(!mobile||selected||b.id===overviewId)).map(b=>b.g),true)[0];let o=hit?.object;while(o&&!o.userData.exhibit)o=o.parent;return o?.userData.exhibit||null;}
 function down(e){if(e.button!==0||e.target.closest('a,button'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,startOrbit:restingOrbit};}
 function move(e){const bounds=host.getBoundingClientRect();callbacks.onPointer?.({x:e.clientX-bounds.left,y:e.clientY-bounds.top});if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)){finishOpening();drag.moved=true;stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');if(!mobile||selected){const limit=selected?.23:.65;orbitTarget=reduced.matches?0:THREE.MathUtils.clamp(drag.startOrbit+dx/width*(selected?.9:1.5),-limit,limit);}wake();}}else if(e.pointerType==='mouse'&&!e.target.closest('a,button')){if(!mobile&&!selected&&!opening&&!reduced.matches){orbitTarget=restingOrbit+THREE.MathUtils.clamp((e.clientX-bounds.left)/width-.5,-.5,.5)*.14;wake();}hover(pick(e));}}
 function up(e){if(!drag||drag.id!==e.pointerId)return;const d=drag,dx=e.clientX-d.x;cancel();if(mobile&&!selected&&d.moved&&Math.abs(dx)>35){const i=works.findIndex(w=>w.id===overviewId);browse(works[(i+(dx<0?1:-1)+works.length)%works.length].id);return;}if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<9){const id=pick(e);if(id)callbacks.onSelect?.(id);}}
 function cancel(){if(drag&&stage.hasPointerCapture(drag.id))stage.releasePointerCapture(drag.id);if(drag?.moved&&!selected)restingOrbit=orbitTarget;drag=null;stage.classList.remove('is-dragging');orbitTarget=selected?0:restingOrbit;wake();}
 handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,pointerleave:()=>{if(!drag){hover(null);orbitTarget=restingOrbit;wake();}}};
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();}
 function preference(){finishOpening();transition=null;applyView(targetView());wake();}
 function lost(e){e.preventDefault();callbacks.onError?.();cleanup();}
 function cleanup(){if(disposed)return;finishOpening(false);disposed=true;signal?.removeEventListener('abort',abort);cancelAnimationFrame(frame);observer?.disconnect();Object.entries(handlers).forEach(([name,fn])=>stage.removeEventListener(name,fn));document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);renderer.domElement.removeEventListener('webglcontextlost',lost);geometrySet.forEach(g=>g.dispose());materialSet.forEach(m=>m.dispose());textureSet.forEach(t=>t.dispose());sun.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();}
 host.append(renderer.domElement);Object.entries(handlers).forEach(([name,fn])=>stage.addEventListener(name,fn));document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);renderer.domElement.addEventListener('webglcontextlost',lost);observer=new ResizeObserver(resize);observer.observe(host);host.dataset.renderer='webgl';resize();callbacks.onReady?.();
 return {focus,overview,browse,isMobile:()=>mobile,overviewId:()=>overviewId,flip,hover,playOpening,finishOpening,surfaceRect,overviewOrbit:()=>restingOrbit,async setArtwork(id,content){const b=boards.get(id);if(!b)return;const request=++b.request;const t=content.image?await imageTexture(content.image):textTexture(works.find(w=>w.id===id),false,content);if(disposed||b.request!==request)return;finishSwap(b);let old=null;if(!reduced.matches&&selected===id){old=mesh(b.surface.geometry.clone(),basic({map:b.surface.material.map,transparent:true,depthWrite:false,toneMapped:false}),b.pivot);old.position.copy(b.surface.position);old.position.z+=.008;old.scale.copy(b.surface.scale);old.castShadow=false;old.renderOrder=1;}b.currentTexture=t;fitSurface(b,selected===id?t:b.overviewTexture||t);b.swap=old?{start:performance.now(),old}:null;if(selected===id&&b.type==='hanging')animateTo();else wake();},dispose:cleanup,suspend(){finishOpening();suspended=true;cancel();cancelAnimationFrame(frame);frame=0;},resume(){suspended=false;wake();}};
}
