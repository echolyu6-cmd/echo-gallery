import * as THREE from './vendor/three/three.module.min.js?v=1a14f6017b36';

// Two pleated textile meshes. Each has an anchored outer edge and a gathered inner edge.
// The textile is an illustrative material; the room behind it is a supplied project photograph.
export async function mountLace(container){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,20);camera.position.z=5;
 const texture=await new THREE.TextureLoader().loadAsync('/echo-gallery/images/lace-mask.webp');texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);texture.repeat.set(1.25,1.8);
 const lace=new THREE.MeshStandardMaterial({color:0xf7efdb,alphaMap:texture,alphaTest:.12,transparent:true,opacity:.98,roughness:1,side:THREE.DoubleSide,depthWrite:false});
 const voile=new THREE.MeshStandardMaterial({color:0xeee7d2,transparent:true,opacity:.54,roughness:1,side:THREE.DoubleSide,depthWrite:false});
 const sheets=[-1,1].map(side=>{const group=new THREE.Group(),geometry=new THREE.PlaneGeometry(1,1,72,52);const backing=new THREE.Mesh(geometry,voile),fabric=new THREE.Mesh(geometry,lace);fabric.position.z=.012;group.add(backing,fabric);scene.add(group);return {side,geometry};});
 scene.add(new THREE.HemisphereLight(0xfffae7,0x5e644d,2.1));const sun=new THREE.DirectionalLight(0xfff6d9,2.1);sun.position.set(-3,4,5);scene.add(sun);const fill=new THREE.DirectionalLight(0xe4ecdc,.5);fill.position.set(4,0,2);scene.add(fill);
 container.append(renderer.domElement);let aspect=1,last={progress:0,time:0,pointer:0};
 function draw(progress,time=0,pointer=0){last={progress,time,pointer};
  for(const {side,geometry} of sheets){const pos=geometry.attributes.position,uv=geometry.attributes.uv;
   for(let i=0;i<pos.count;i++){
    const u=uv.getX(i),v=1-uv.getY(i),gather=progress*(.85+.1*Math.cos(v*Math.PI*2)),outer=side*aspect*1.065,inner=side*(-.035+aspect*gather),width=inner-outer;
    const pleat=Math.sin(u*Math.PI*Math.max(6,Math.round(aspect*12))+side*.3),breeze=(Math.sin(time*1.1+v*5+u*7)*.009+Math.sin(v*7+time*.8)*pointer*.022)*Math.pow(v,.7);
    const x=outer+width*u+side*breeze*u;
    const y=1.13-v*2.3+Math.sin(u*Math.PI)*.022+progress*.09*Math.sin(u*Math.PI)*Math.pow(v,2);
    const z=pleat*(.042+.026*progress)+Math.sin(u*Math.PI)*.09+breeze*2;
    pos.setXYZ(i,x,y,z);
   }pos.needsUpdate=true;geometry.computeVertexNormals();
  }renderer.render(scene,camera);
 }
 function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;aspect=w/h;texture.repeat.x=aspect/2.3*1.8;camera.left=-aspect;camera.right=aspect;camera.updateProjectionMatrix();renderer.setSize(w,h);draw(last.progress,last.time,last.pointer);}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();container.dataset.renderer='webgl';
 return {draw,dispose(){observer.disconnect();sheets.forEach(s=>s.geometry.dispose());texture.dispose();lace.dispose();voile.dispose();renderer.dispose();renderer.domElement.remove();}};
}
