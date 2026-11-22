/* ===============================================================================================
   FICHA · transporte.js
   Qué hay:          Últimos detalles del barrio (sección 8: montaña y mirador, farolas, coches aparcados, locales en venta y pisos), isla pequeña con su pueblo pesquero (9) y transporte (10.1 autobuses, 10.2 aviones, 10.3 avionetas, 10.4 aeródromo de la isla).
   Tócalo si quieres: cambiar autobuses, aviones o avionetas, la montaña o la isla pequeña
   Ojo:              El metro (10.5) está en isla-grande-metro.js.
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 8. ÚLTIMOS DETALLES DEL BARRIO PRINCIPAL
//     Decoración de la montaña y mirador de la cima, halos de las farolas, coches aparcados,
//     locales que se ponen en venta y pisos de los edificios de apartamentos.
// =================================================================================================

// ---------- 8.1 Montaña: decoración y mirador con tienda de souvenirs en la cima ----------
(function(){let sd=7;const R=()=>(sd=sd*16807%2147483647)/2147483647,rd=(x,z)=>{let d=1e9;for(const p of HW.mt)d=Math.min(d,Math.hypot(p[0]-x,p[1]-z));return d};
 const trees=[],rocks=[];
 for(let k=0;k<5000&&(trees.length<650||rocks.length<260);k++){const a=R()*6.283,r=16+Math.sqrt(R())*(MR-18),x=MX+Math.cos(a)*r,z=MZ+Math.sin(a)*r,h=heightAt(x,z);
  if(trees.length<650&&h<85&&r>28&&R()<1-h/95&&rd(x,z)>13&&!inFac(x,z,4))trees.push([x,h,z,.8+R()*.9,R()*6.28]);
  else if(rocks.length<260&&r>20&&R()<.35+h/150&&rd(x,z)>8&&!inFac(x,z,4))rocks.push([x,h,z,1+R()*2.6,R()*6.28,.6+R()*.8])}
 const d=new THREE.Object3D(),mk=(geo,c,arr,fn)=>{const im=new THREE.InstancedMesh(geo,mat(c),arr.length);arr.forEach((q,i)=>{fn(q);d.updateMatrix();im.setMatrixAt(i,d.matrix)});im.userData.full=arr.length;(globalThis.QINST=globalThis.QINST||[]).push(im);scene.add(im)};
 d.rotation.set(0,0,0);
 const bump=(g,a)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=Math.sin(x*12.9+y*78.2+z*37.7)*43758.5,k=1+a*(h-Math.floor(h)-.5);p.setXYZ(i,x*k,y*k,z*k)}g.computeVertexNormals();return g},
  mergeG=parts=>{const P=[],Nn=[],C=[],col=new THREE.Color();for(const[g,c]of parts){const q=g.index?g.toNonIndexed():g,p=q.attributes.position,n=q.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));Nn.push(n.getX(i),n.getY(i),n.getZ(i));col.set(typeof c==='function'?c(p.getY(i)):c);C.push(col.r,col.g,col.b)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g},
  vm=(amp,side)=>{const m=new THREE.MeshLambertMaterial({vertexColors:true,side:side||THREE.FrontSide});m.userData.wind=amp;return m},
  inst=(geo,m,arr,fn,tint)=>{const im=new THREE.InstancedMesh(geo,m,arr.length),cc=new THREE.Color();arr.forEach((q,i)=>{fn(q);d.updateMatrix();im.setMatrixAt(i,d.matrix);if(tint){const k=.85+R()*.3;cc.setRGB(k,k*(.92+R()*.16),k*(.9+R()*.15));im.setColorAt(i,cc)}});im.frustumCulled=false;im.userData.full=arr.length;(globalThis.QINST=globalThis.QINST||[]).push(im);scene.add(im);return im},
  T=(g,x,y,z)=>g.translate(x,y,z),ico=(r,x,y,z)=>T(bump(new THREE.IcosahedronGeometry(r,1),.3),x,y,z),
  blade=(a,h,w,l)=>{const c=Math.cos(a),s=Math.sin(a),v=[-w,0,0,w,0,0,l,h,0],P=[];for(let i=0;i<9;i+=3)P.push(v[i]*c-v[i+2]*s,v[i+1],v[i]*s+v[i+2]*c);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3));return g},
  gConi=mergeG([[T(new THREE.CylinderGeometry(.2,.3,2.2,6),0,1.1,0),0x5b4028],[T(new THREE.ConeGeometry(2,3,7),0,3,0),0x2c5f36],[T(new THREE.ConeGeometry(1.55,2.6,7),0,4.7,0),0x2f6b3a],[T(new THREE.ConeGeometry(1.05,2.2,7),0,6.2,0),0x3a7a43]]),
  gBroad=mergeG([[T(new THREE.CylinderGeometry(.25,.38,3,6),0,1.5,0),0x5b4028],[ico(1.9,0,4,0),0x4f8a3c],[ico(1.4,1.2,3.4,.4),0x5a9644],[ico(1.3,-1.1,3.6,-.5),0x468034],[ico(1.2,.2,5.1,-.2),0x63a04a]]),
  gBush=mergeG([[T(bump(new THREE.IcosahedronGeometry(.8,1),.3).scale(1,.75,1),0,.5,0),0x3f7a3a],[ico(.55,.6,.4,.2),0x4a8a42]]),
  gTuft=mergeG([0,1,2,3,4,5].map(k=>[blade(k*1.05,.5+((k*7)%3)*.14,.07,(k%2?1:-1)*.09),y=>y<.05?0x2f5a25:y<.4?0x5a8a33:0x93b552])),
  gRock=mergeG([[bump(new THREE.IcosahedronGeometry(1,1),.5),0x80828a]]),
  tc=trees.filter((q,i)=>q[1]>40||i%2),tb=trees.filter((q,i)=>!(q[1]>40||i%2)),
  out={t:[],b:[],g:[]};
 for(let k=0;k<26000&&(out.t.length<420||out.b.length<260||out.g.length<7000);k++){const x=LAND0+R()*(720-LAND0),z=LAND0+R()*(720-LAND0),u=R();
  if(x>-24&&x<294&&z>-24&&z<294||Math.hypot(x-MX,z-MZ)<MR+4||isl(x,z)<16||heightRaw(x,z)<.2||inFac(x,z,4))continue;
  const kind=u<.07&&out.t.length<420?'t':u<.17&&out.b.length<260?'b':u<.2&&rocks.length<380?'r':out.g.length<7000?'g':null;if(!kind||hwNear(x,z).d<(kind==='g'?10:16))continue;
  const y=heightAt(x,z);if(kind==='r')rocks.push([x,y,z,1+R()*2.2,R()*6.28,.6+R()*.8]);else out[kind].push([x,y,z,.8+R()*.8,R()*6.28])}
 for(let k=0;k<5000&&out.g.length<9500;k++){const a=R()*6.283,r=16+Math.sqrt(R())*(MR-26),x=MX+Math.cos(a)*r,z=MZ+Math.sin(a)*r,h=heightAt(x,z);if(h<70&&rd(x,z)>6&&!inFac(x,z,4))out.g.push([x,h,z,.8+R()*.8,R()*6.28])}
 const place=q=>{d.position.set(q[0],q[1],q[2]);d.scale.set(q[3],q[3],q[3]);d.rotation.set(0,q[4],0)},wt=vm(.016),wg=vm(.14,THREE.DoubleSide);
 out.t.forEach((q,i)=>(i%2?tc:tb).push(q));
 inst(gConi,wt,tc,place,1);inst(gBroad,wt,tb,place,1);inst(gBush,vm(.03),out.b,place,1);inst(gTuft,wg,out.g,place,1);
 inst(gRock,vm(0),rocks,q=>{d.position.set(q[0],q[1]+q[3]*.2,q[2]);d.scale.set(q[3],q[3]*q[5],q[3]*(.8+q[5]*.3));d.rotation.set(0,q[4],0)},1);
 // cima: mirador y tienda de souvenirs
 const bx=(cx,y,cz,w,h,dd,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),mat(c));m.position.set(cx,MH+y+h/2,cz);m.userData.st=1;scene.add(m);return m},
  col=(x0,x1,z0,z1,y0,y1)=>colliders.push({x0,x1,z0,z1,y0:MH+y0,y1:MH+y1,on:true});
 bx(MX,0,MZ-17,8.4,3.2,.4,0xd9b27c);col(MX-4.2,MX+4.2,MZ-17.2,MZ-16.8,0,3.2);
 for(const sx of[-4,4]){bx(MX+sx,0,MZ-14.5,.4,3.2,5,0xd9b27c);col(MX+sx-.2,MX+sx+.2,MZ-17,MZ-12,0,3.2)}
 bx(MX,3.2,MZ-14.3,9.2,.4,6.2,0x8a3b2b);bx(MX,0,MZ-12.8,6,1.1,.8,0x6b4a2b);col(MX-3,MX+3,MZ-13.2,MZ-12.4,0,1.1);
 [0xe74c3c,0xf1c40f,0x2980b9,0x27ae60,0x8e44ad,0xecf0f1].forEach((c,i)=>bx(MX-3+i*1.2,1.2,MZ-16.5,.7,.7,.4,c));
 const sc=document.createElement('canvas');sc.width=256;sc.height=64;const g=sc.getContext('2d');g.fillStyle='#b3261e';g.fillRect(0,0,256,64);g.fillStyle='#fff';g.font='bold 34px sans-serif';g.textAlign='center';g.fillText('SOUVENIRS',128,44);
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc)}));sg.position.set(MX,MH+3.9,MZ-11.4);scene.add(sg);
 const io=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),mat(0xffffff));io.position.set(MX,MH+1.2,MZ-11.6);io.visible=false;scene.add(io);IA(io,'souv');
 bx(MX,0,MZ+9,14,.4,14,0x9a9a9f);FLOORS.push({x0:MX-7,x1:MX+7,z0:MZ+2,z1:MZ+16,y:MH+.4});
 bx(MX,.4,MZ+16,14,1,.15,0xa9aeb5);col(MX-7,MX+7,MZ+15.9,MZ+16.1,.4,1.6);
 for(const sx of[-7,7]){bx(MX+sx,.4,MZ+9,.15,1,14,0xa9aeb5);col(MX+sx-.1,MX+sx+.1,MZ+2,MZ+16,.4,1.6)}
 bx(MX+4,.4,MZ+14.5,.3,1.4,.3,0x3a3f44);bx(MX+4,1.8,MZ+14.5,.8,.3,.4,0x3a3f44)})();

// ---------- 8.2 Halos de luz de las farolas ----------
const haloMat=new THREE.PointsMaterial({map:glowTex([[0,'rgba(255,255,255,1)'],[.1,'rgba(255,255,255,.75)'],[.3,'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,0)']]),color:0xffcf8a,size:3.6,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
{const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(LAMPS.flatMap(l=>[l.x,l.y-.05,l.z])),3));const halo=new THREE.Points(pg,haloMat);halo.frustumCulled=false;scene.add(halo)}

// ---------- 8.3 Coches aparcados, locales en venta y pisos ----------
// coches aparcados
const PK=[[0,1,0],[1,0,0],[2,1,0]];
function parkAt(i,j,side,a,t){const x0=i*P,z0=j*P;let x,z,h;
 if(side==0){x=x0+a;z=z0-1.4;h=Math.PI/2}else if(side==1){x=x0+a;z=z0+41.4;h=-Math.PI/2}else if(side==2){x=x0-1.4;z=z0+a;h=Math.PI}else{x=x0+41.4;z=z0+a;h=0}
 spawnCar(t,pick([0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0xecf0f1,0x34495e,0xe67e22]),x,z,h,'parked')}
parkAt(0,0,0,20,'hatch');
{const LT=[[14000,.8],[20000,1],[28000,1.35]],used=new Set();[.06,.14,.2,.27,.34,.41,.5,.57,.64,.71,.79,.87,.94].forEach((f,k)=>{let i=Math.floor((HOUSES.length+1)*f);while(used.has(i)&&i<HOUSES.length)i++;const h=HOUSES[i];if(!h||used.has(i))return;used.add(i);const t=LT[k%3];h.local=true;h.price=t[0];h.mul=t[1];setHouseColor(h,0xe67e22);localIn(h)})}
DOORS.filter(d=>d.apt).forEach(d=>{d.house=true;HOUSES.push({id:HOUSES.length,x:Math.round(d.x),z:Math.round(d.z),door:d,owned:false,apt:true,price:6000+d.fl*600,inner:null})});


// =================================================================================================
// 9. ISLA PEQUEÑA: PUEBLO PESQUERO
//     Casas, caminos y muelle del pueblo pesquero de la isla.
// =================================================================================================
let ISLDOCK=null; // final del camino N-S del pueblo (lo rellena el pueblo; lo usa su muelle)
// 1) Zonas válidas: tierra firme y plana (sin playa, sin agua) y sin edificios encima
function buildOK(cx,cz,hw,hd,lg){for(let a=-1;a<=1;a+=.5)for(let b=-1;b<=1;b+=.5){const x=cx+a*hw,z=cz+b*hd;if((lg?islV0(x,z):islV(x,z))<12||heightAt(x,z)!==0)return false}
 return !BLD.some(q=>cx+hw>q[0]&&cx-hw<q[0]+q[2]&&cz+hd>q[1]&&cz-hd<q[1]+q[3])}
(function(){const sd0=seed,SAND=0xcdb98a,PAD=0xbfb59a,slab=(x,z,w,d,c,hex)=>{box(x,0,z,w,G,d,c,false);BLD.push([x-w/2,z-d/2,w,d,hex])};
 // 2) Camino principal (E-O) por la parte válida de la isla
 const Z0=Math.round(ISL.z);let xa=null,xb=null;for(let x=ISL.x-80;x<=ISL.x+80;x+=2)if(buildOK(x,Z0,1,2.5,1)){if(xa===null)xa=x;xb=x}
 if(xa===null)return;
 const homes=[];for(const sd of[-1,1])for(let px=xa;px<=xb;px+=1){const pz=Z0+sd*11.8;if(!buildOK(px,pz,8.9,9,1))continue;homes.push([px,pz,-sd]);px+=19.5}
 if(!homes.length)return;
 const hx0=Math.min(...homes.map(h=>h[0]))-9,hx1=Math.max(...homes.map(h=>h[0]))+9;
 slab((hx0+hx1)/2,Z0,hx1-hx0,4,SAND,'#cdb98a');
 // 3) Casas: las mismas que ya existen en la ciudad (house()), cada una sobre su parcela
 homes.forEach(([px,pz,fz])=>{slab(px,pz,17.4,17.4,PAD,'#bfb59a');const n=HOUSES.length;house(px,pz,fz);for(let i=n;i<HOUSES.length;i++){HOUSES[i].isl=true;HOUSES[i].price=9000}});
 // 4) Camino hacia la playa (N-S) hasta donde acaba la tierra firme
 let cx=null;for(let x=hx0;x<=hx1;x+=.5)if(homes.every(h=>h[2]!==-1||Math.abs(h[0]-x)>=9.6)&&(cx===null||Math.abs(x-ISL.x)<Math.abs(cx-ISL.x)))cx=x;if(cx===null)cx=ISL.x;
 let zs=Z0+2;while(buildOK(cx,zs+4,1,2.5)&&zs<ISLC.z+ISLC.r)zs+=4; // el camino llega hasta la playa de la isla grande
 if(zs>Z0+6)slab(cx,(Z0+2+zs)/2,3,zs-Z0-2,SAND,'#cdb98a');ISLDOCK={x:cx,z:zs};
 // barriles y cajas junto a la playa
 [[cx-1.5,zs+1],[cx+1.5,zs+2.5],[cx+9,zs+1]].forEach(([x,z],i)=>{if(!buildOK(x,z,.6,.6))return;box(x,G,z,i?1.1:.8,i?.7:.9,i?1.1:.8,i?0x8a6a45:0x5a4028,true)});
 // árboles sueltos en parcelas libres (palmeras sencillas)
 for(let k=0,n=0;k<400&&n<9;k++){const a=(k*2.399)%6.283,r=8+(k*7%36),x=ISL.x+Math.cos(a)*r,z=ISL.z+Math.sin(a)*r;if(!buildOK(x,z,1.6,1.6,1))continue;
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,4.4,6),mat(0x7a5a3a));t.position.set(x,2.2,z);t.rotation.z=(k%3-1)*.07;scene.add(t);t.userData.st=1;
  const l=new THREE.Mesh(new THREE.IcosahedronGeometry(1.9,0),mat(0x4f8a3c));l.scale.set(1.5,.5,1.5);l.position.set(x,4.6,z);scene.add(l);l.userData.st=1;
  colliders.push({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3,y0:0,y1:4.4,on:true});BLD.push([x-1.6,z-1.6,3.2,3.2,'#4f8a3c']);n++}
 seed=sd0})();
// muelle del pueblo pesquero (fase 1): pasarela de madera desde la playa hacia el mar, con barcos a los lados
(function(){if(!ISLDOCK)return;const x=ISLDOCK.x,DY=.45,W=3;let zl=ISLDOCK.z;
 for(let z=ISLDOCK.z;z<ISLC.z+ISLC.r+40;z+=.5){if(heightAt(x,z)>=-.02)zl=z;else break} // última z de tierra firme
 const z0=zl-2;let ze=zl+4;for(let z=zl;z<zl+40&&z<z0+26;z+=1){ze=z;if(heightAt(x,z)<-2.2)break}ze+=2;if(ze-zl<6)return;
 const WOOD=0x8a6a45,WOODD=0x5a4028,STEEL=0x3a3f44,len=ze-z0,zc=(z0+ze)/2;
 box(x,DY-.3,zc,W,.3,len,WOOD,false);FLOORS.push({x0:x-W/2,x1:x+W/2,z0:z0,z1:ze,y:DY});BLD.push([x-W/2,z0,W,len,'#8a6a45']);
 for(let z=z0+.8;z<ze;z+=1.5)box(x,DY,z,W,.015,.1,WOODD,false);
 for(let z=z0+.4;z<ze;z+=3.6)for(const sx of[-1,1])box(x+sx*(W/2-.25),-3.2,z,.4,3.2+DY+.35,.4,WOODD,false);
 for(let z=z0+3;z<ze;z+=4)for(const sx of[-1,1])box(x+sx*(W/2-.2),DY,z,.4,.4,.4,0x1f2328,false);
 box(x,DY,ze-.15,W,.5,.3,WOODD,false);
 // cartel con dos postes
 for(const sx of[-1,1])box(x+sx*1.35,DY,z0+1.5,.12,2.1,.12,STEEL,false);
 const sg=boatTxtMesh('MUELLE · PUEBLO PESQUERO',2.6,.7,'#8a5a2b','#ffffff');sg.position.set(x,DY+2.15,z0+1.5);sg.rotation.y=Math.PI;scene.add(sg);
 // barcos a ambos lados, de la punta hacia la orilla; si falta agua, se corta ese lado
 const used={'-1':ze,'1':ze},stop={'-1':false,'1':false};
 [['velero',-1,0xf2f2f2,'Estrella del Sur'],['pesquero',1,0x1f4f8a,'Mar Brava'],['lancha',-1,0xe67e22,'Gaviota'],['lancha',1,0x2ca25f,'Delfín'],['pesquero',-1,0xb03a2e,'La Sardina']].forEach(([t,sd,c,nm])=>{
  if(stop[sd])return;const sp=BOATSPEC[t],zb=used[sd]-sp.L/2-1.2,xb=x+sd*(W/2+sp.B/2+.5);
  if(!mkBoat(t,xb,zb,Math.PI/2,c,nm,true)){stop[sd]=true;return}used[sd]=zb-sp.L/2})})();
for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let s=0;s<4;s++)if(rnd()<.3&&!(i==0&&j==0&&s==0)&&!(i==PKI&&j==PKJ&&s==0))parkAt(i,j,s,rr(6,34),pick(['hatch','hatch','sport','van','moto','moto','bici','bici','patinete','patinete']));
// tráfico
for(let n=0;n<26;n++){const ax=rnd()<.5?0:1,line=rnd()*(N+1)|0,dir=rnd()<.5?1:-1,al=rr(-5,CE+4),c=-7+line*P,lat=ax==0?c+2.5*dir:c-2.5*dir;
 const k=spawnCar(pick(['hatch','hatch','sport','van','moto']),pick([0xe74c3c,0x3498db,0xf39c12,0x1abc9c,0xbdc3c7,0x8e44ad]),ax==0?al:lat,ax==0?lat:al,0,'ai',{axis:ax,line,dir,spd:rr(8,13)})}
// peatones y animales
const peds=[];
for(let n=0;n<80;n++){const dog=n>=72,g=dog?new THREE.Group():person(pick([0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0xecf0f1,0x8e44ad,0xe67e22]),{noIdle:1});
 if(dog){part(new THREE.BoxGeometry(.4,.4,.9),0x8a5a2b,0,.45,0,g);part(new THREE.BoxGeometry(.3,.3,.3),0x6a4420,0,.7,.55,g)}
 scene.add(g);peds.push({g,x0:(rnd()*N|0)*P,z0:(rnd()*N|0)*P,s:dog?rr(.5,1):rr(.9,2.4),t:rnd()*150,dir:rnd()<.5?1:-1,sp:dog?1.9:rr(1.1,1.8)})}
peds.forEach(p=>{if(p.x0===PKI*P&&p.z0===PKJ*P)p.x0=0;p.trav=!p.g.userData.P?Math.random()<.3:Math.random()<.55;p.nt=5+Math.random()*50});
function startTrip(p){const L=40-2*p.s,T=((p.t%(4*L))+4*L)%(4*L),e=T/L|0,q=ringPos(p,p.t),lo=-32,hi=N*P+18,ex=q[0]<N*P/2?lo:hi,ez=q[1]<N*P/2?lo:hi;let P1,P2;
 if(e==0){P1=[q[0],p.z0-7];P2=[ex,p.z0-7]}else if(e==1){P1=[p.x0+47,q[1]];P2=[p.x0+47,ez]}else if(e==2){P1=[q[0],p.z0+47];P2=[ex,p.z0+47]}else{P1=[p.x0-7,q[1]];P2=[p.x0-7,ez]}
 const pts=[q,P1,P2],l1=Math.hypot(P1[0]-q[0],P1[1]-q[1]),l2=Math.hypot(P2[0]-P1[0],P2[1]-P1[1]);p.trip={pts,l1,L:l1+l2,u:0,d:1,w:0}}
function tripPos(T,u){u=clamp(u,0,T.L);const A=T.pts;if(u<=T.l1){const f=T.l1?u/T.l1:1;return[A[0][0]+(A[1][0]-A[0][0])*f,A[0][1]+(A[1][1]-A[0][1])*f]}const l2=T.L-T.l1,f=l2?(u-T.l1)/l2:1;return[A[1][0]+(A[2][0]-A[1][0])*f,A[1][1]+(A[2][1]-A[1][1])*f]}
function ringPos(p,t){const L=40-2*p.s,T=((t%(4*L))+4*L)%(4*L),e=T/L|0,u=T-e*L,a=p.s,b=40-p.s;let x,z;
 if(e==0){x=a+u;z=a}else if(e==1){x=b;z=a+u}else if(e==2){x=b-u;z=b}else{x=a;z=b-u}return[p.x0+x,p.z0+z]}

// =================================================================================================
// 10. TRANSPORTE: AUTOBUSES Y AVIACIÓN
//     Autobuses con sus rutas y paradas, aviones y avionetas del aeropuerto y aeródromo de la isla.
// =================================================================================================

// ---------- 10.1 Autobuses ----------
const BUSES=[],STOPS=[],BUSROUTES=[],BUSFARE=10;let riding=null;
function busMesh(col){
 const L=[],gl=0x1b2a38,A=(sx,sy,sz,x,y,z,c)=>{const g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);L.push([g,c])},
 Cy=(r,wd,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,wd,14);g.rotateZ(Math.PI/2);g.translate(x,y,z);L.push([g,c])};
 A(2.6,2.4,10.8,0,1.8,0,col);A(2.64,.22,10.84,0,1.2,0,0xffffff);
 A(.06,.9,9,1.31,2.45,-.3,gl);A(.06,.9,7,-1.31,2.45,-1.3,gl);A(.06,1.9,1.5,-1.32,1.85,3.7,0x3a566e);
 A(2.3,1.2,.06,0,2.35,5.43,gl);A(2.3,.9,.06,0,2.45,-5.43,gl);A(1.8,.28,.06,0,3.2,5.43,0xffcc33);
 A(2.5,.14,10.6,0,3.07,0,0xeeeeee);A(1.3,.3,2.6,0,3.28,-1.5,0xcccccc);
 A(.45,.25,.06,.9,.95,5.43,0xfff3c0);A(.45,.25,.06,-.9,.95,5.43,0xfff3c0);A(.45,.25,.06,.9,.95,-5.43,0xcc1111);A(.45,.25,.06,-.9,.95,-5.43,0xcc1111);
 A(2.66,.28,.2,0,.75,5.45,0x222222);A(2.66,.28,.2,0,.75,-5.45,0x222222);
 [3.4,-3.4].forEach(z=>[-1,1].forEach(k=>{Cy(.5,.32,k*1.2,.5,z,0x151515);Cy(.28,.34,k*1.2,.5,z,0xb8bcc2)}));
 const Pp=[],Nn=[],Cc=[];L.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;
  for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
 const g=new THREE.Group();g.add(new THREE.Mesh(bg,carMat));return g}
function busShelter(x,z,T,nv,col,hex,num){
 const S=(a,y,d,wa,h,wd,c,sol)=>box(x+T[0]*a+nv[0]*d,y,z+T[1]*a+nv[1]*d,Math.abs(T[0])*wa+Math.abs(nv[0])*wd,h,Math.abs(T[1])*wa+Math.abs(nv[1])*wd,c,sol);
 S(0,2.35,0,4.6,.15,2.2,col,false);S(0,.3,.9,4.2,2.05,.08,0x9fd0e6,false);[-2.1,2.1].forEach(a=>S(a,.3,0,.08,2.05,1.7,0x9fd0e6,false));
 [-2.1,2.1].forEach(a=>[-.9,.9].forEach(d=>S(a,0,d,.14,2.35,.14,0x777777,true)));
 S(0,0,.55,2.6,.5,.5,0x8b5a2b,true);S(2.9,0,-.7,.1,3.3,.1,0x666666,false);
 const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle=hex;g.fillRect(0,0,128,64);g.fillStyle='#fff';g.fillRect(4,4,120,56);g.fillStyle=hex;g.font='bold 34px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('BUS '+num,64,34);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));
 m.position.set(x+T[0]*2.9-nv[0]*.7,3.1,z+T[1]*2.9-nv[1]*.7);m.rotation.y=Math.atan2(T[0],T[1]);scene.add(m)}
function mkRoute(name,hex,col,ia,ib,list,nb,dwell){
 const ca=-7+ia*P,cb=-7+ib*P,l=ca+2.5,r=cb-2.5,t=ca+2.5,bt=cb-2.5,C=[[l,t],[r,t],[r,bt],[l,bt]],D=[[1,0],[0,1],[-1,0],[0,-1]],NR=[[0,1],[-1,0],[0,-1],[1,0]],RAD=5,V=[],TG=[];
 for(let i=0;i<4;i++){const q=C[i],u=D[(i+3)%4],w=D[i],p0=[q[0]-u[0]*RAD,q[1]-u[1]*RAD],p1=[q[0]+w[0]*RAD,q[1]+w[1]*RAD];
  for(let k=0;k<=8;k++){const s=k/8,a=(1-s)*(1-s),b=2*s*(1-s),c=s*s;V.push([a*p0[0]+b*q[0]+c*p1[0],a*p0[1]+b*q[1]+c*p1[1]]);TG.push(k==8?i:-1)}}
 V.push(V[0]);TG.push(-1);
 const cum=[0];for(let k=1;k<V.length;k++)cum.push(cum[k-1]+Math.hypot(V[k][0]-V[k-1][0],V[k][1]-V[k-1][1]));
 const len=cum[cum.length-1],n=Math.round(len),step=len/n,X=[],Z=[],E=[];let k0=0;
 for(let j=0;j<n;j++){const d=j*step;while(cum[k0+1]<d)k0++;const u=(d-cum[k0])/((cum[k0+1]-cum[k0])||1);X.push(V[k0][0]+(V[k0+1][0]-V[k0][0])*u);Z.push(V[k0][1]+(V[k0+1][1]-V[k0][1])*u);E.push(TG[k0])}
 const R={name,hex,len,n,step,X,Z,E,stops:[],dwell,ia,ib},ST=[],num=name.slice(-1);
 for(let e=0;e<4;e++)for(const m of list){
  if((e==0||e==2)&&m===1&&(e==0?ia:ib-1)===1)continue; // bloque con el súper: la puerta queda en el centro
  const co=m*P+20,lx=(e==0||e==2)?co:(e==1?r:l),lz=(e==1||e==3)?co:(e==0?t:bt);
  let bi=0,bd=1e9;for(let j=0;j<n;j++){const d=Math.hypot(X[j]-lx,Z[j]-lz);if(d<bd){bd=d;bi=j}}
  ST.push({s:bi*step,lx,lz,T:D[e],n:NR[e],x:lx+NR[e][0]*6,z:lz+NR[e][1]*6})}
 ST.sort((a,b)=>a.s-b.s);R.stops=ST;
 ST.forEach((q,i)=>{let bn=null,bd=45;PLACES.forEach(p=>{const S=SHOPS[p.key];if(!S)return;const d=Math.hypot(p.x-q.x,p.z-q.z);if(d<bd){bd=d;bn=S.n}});
  q.name=(i+1)+'. '+(bn?bn.charAt(0)+bn.slice(1).toLowerCase():'Calle');busShelter(q.x,q.z,q.T,q.n,col,hex,num);STOPS.push({x:q.x,z:q.z,route:R,st:q})});
 for(let k=0;k<nb;k++){const m=busMesh(col);scene.add(m);const s0=k*len/nb;let ns=0,bd=1e9;ST.forEach((q,i)=>{let d=q.s-s0;if(d<0)d+=len;if(d<bd){bd=d;ns=i}});
  const b={route:R,m,s:s0,v:0,state:'run',t:0,vmax:11+(k%2),x:0,z:0,h:0,axis:-1,dir:1,line:0,ns,mode:'bus',spec:{w:2.6,l:10.8}};busPose(b);BUSES.push(b)}
 BUSROUTES.push(R);return R}
function busPose(b){const R=b.route,L=R.len,f=(((b.s%L)+L)%L)/R.step,i=Math.floor(f)%R.n,j=(i+1)%R.n,k=(i+4)%R.n,u=f-Math.floor(f);
 b.x=R.X[i]+(R.X[j]-R.X[i])*u;b.z=R.Z[i]+(R.Z[j]-R.Z[i])*u;b.h=Math.atan2(R.X[k]-R.X[i],R.Z[k]-R.Z[i]);
 const e=R.E[i];if(e<0)b.axis=-1;else{b.axis=e%2;b.dir=e<2?1:-1;b.line=(e==0||e==3)?R.ia:R.ib}
 b.m.position.set(b.x,0,b.z);b.m.rotation.y=b.h}
function busBlocked(b){const fx=Math.sin(b.h),fz=Math.cos(b.h),lim=9+b.v*.6;
 const chk=(x,z)=>{const rx=x-b.x,rz=z-b.z,f=rx*fx+rz*fz,l=rx*fz-rz*fx;return f>3&&f<lim&&Math.abs(l)<2.4};
 for(const o of cars)if((o.mode==='ai'||o.mode==='player')&&chk(o.x,o.z))return true;
 for(const o of BUSES)if(o!==b&&chk(o.x,o.z))return true;
 if(!riding&&!inCar&&py>-1&&py<1&&chk(pl.x,pl.z))return true;return false}
// líneas de detención de la ruta: para cada cruce con semáforo por el que pasa el autobús, la posición s (arco) donde debe parar el centro del bus
function busTLS(R){const out=[],so=9.5+5.4,{n,step,X,Z,E,ia,ib}=R;
 for(let j=0;j<n;j++){const j2=(j+1)%n,e=E[j];if(e<0||E[j2]!==e)continue;
  const ax=e%2,dir=e<2?1:-1,line=(e==0||e==3)?ia:ib,q0=ax?Z[j]:X[j],q1=ax?Z[j2]:X[j2];
  for(let m=ia;m<=ib;m++){const tl=TLK.get(ax?line*16+m:m*16+line);if(!tl)continue;const sl=-7+m*P-dir*so;
   if((q0-sl)*dir<=0&&(q1-sl)*dir>0)out.push({s:(j+(sl-q0)/(q1-q0))*step,tl,axis:ax})}}
 return out}
function busStep(b,dt){const R=b.route,L=R.len;
 if(b.state==='dwell'){b.v=0;b.t-=dt;if(b.t<=0){b.state='run';b.ns=(b.ns+1)%R.stops.length}}
 else{const st=R.stops[b.ns];let dist=st.s-(((b.s%L)+L)%L);if(dist<-.5)dist+=L;
  let vt=Math.min(b.vmax,Math.sqrt(2*3.2*Math.max(0,dist))+.9),room=1e9;if(busBlocked(b))vt=0;
  // semáforos: frena ante ámbar/rojo y se detiene en la línea; si ya no puede frenar a tiempo, pasa
  {if(!R.tls)R.tls=busTLS(R);const T=R.tls,sm=((b.s%L)+L)%L;
   if(b.go!=null){let d=T[b.go].s-sm;if(d<-.5)d+=L;if(d>30)b.go=null}
   for(let q=0;q<T.length;q++){const g=T[q];let d=g.s-sm;if(d<-.5)d+=L;if(d>60||q===b.go)continue;
    if(tlState(g.tl,g.axis)===0)continue;
    if(b.v>1&&d<b.v*b.v/14){b.go=q;continue}
    vt=Math.min(vt,d<.15?0:Math.sqrt(6.4*d));room=Math.min(room,Math.max(0,d))}}
  b.v+=clamp(vt-b.v,-7*dt,2.4*dt);if(b.v<0)b.v=0;
  if(dist<=.3||b.v*dt>=dist){b.s=st.s;b.v=0;b.state='dwell';b.t=R.dwell}else b.s+=Math.min(b.v*dt,room)}
 busPose(b)}
function boardBus(b){if(riding||!pay(BUSFARE))return;riding=b;body.visible=false;toast('Billete '+b.route.name+': −'+BUSFARE+' €')}
function leaveBus(){const b=riding,st=b.route.stops[b.ns];riding=null;body.visible=true;
 pl.x=st.lx+st.n[0]*4.9-st.T[0]*3.6;pl.z=st.lz+st.n[1]*4.9-st.T[1]*3.6;py=0;vy=0;body.position.set(pl.x,0,pl.z);toast('Has bajado en la parada '+st.name)}
function rideStep(){const b=riding;pl.x=b.x;pl.z=b.z;py=(b.plane||b.avion||b.heli||b.metro)?b.alt:0;vy=0;grounded=true;body.visible=false;body.position.set(b.x,py,b.z);body.rotation.y=b.h}
const bh=document.createElement('div');bh.style.cssText='top:184px;left:14px;font:700 17px system-ui;max-width:360px;white-space:pre-line';$('hud').appendChild(bh);
function busHud(){if(!riding||riding.metro){setTx(bh,metroHud());return}if(riding.boat){const a=riding;bh.textContent='⛵ '+a.name+' · '+Math.round(Math.abs(a.v)*3.6)+' km/h · '+(a.v>.5?'navegando':a.v<-.5?'marcha atrás':'a la deriva')+' · W/S motor · A/D timón';return}if(riding.avion){const a=riding,km=Math.round(Math.abs(a.v)*3.6),rdy=!a.air&&a.v>=AVR&&onRunway(a.x,a.z);bh.textContent='🛩 '+a.name+' · '+(a.air?'en vuelo · altitud '+Math.round(a.alt)+' m':rdy?'¡VELOCIDAD DE DESPEGUE! Pulsa Espacio':a.v>.5?'rodando · '+km+' km/h':'motor al ralentí')+' · gas '+Math.round(a.thr*100)+'%';return}if(riding.heli){const a=riding,km=Math.round(Math.abs(a.v)*3.6),rdy=a.rs>=HELIFLY*.8;bh.textContent='🚁 '+a.name+' · '+(a.air?'en vuelo · altitud '+Math.round(a.alt)+' m · '+km+' km/h':!rdy?'arrancando rotor…':'rotor listo · Espacio para despegar');return}if(riding.plane){bh.textContent='✈ '+riding.name+' · '+PSTX[riding.state]+(riding.alt>1?' · altitud '+Math.round(riding.alt)+' m':'');return}const R=riding.route,st=R.stops[riding.ns];bh.textContent='🚌 '+R.name+' · '+(riding.state==='dwell'?'Parada '+st.name:'Próxima parada: '+st.name)}
// Línea 1 (circuito interior, rojo) y Línea 2 (circuito exterior, azul); ambas en sentido horario por el carril interior
mkRoute('Línea 1','#d62828',0xd62828,1,4,[1,3],3,7);
mkRoute('Línea 2','#1d6fd6',0x1d6fd6,0,5,[0,2,4],4,7);
// fusionar geometría estática (rendimiento)
(function(){const groups=new Map(),rm=[];
 scene.children.forEach(o=>{if(o.isMesh&&o.userData.st){o.updateMatrixWorld();let a=groups.get(o.material);if(!a)groups.set(o.material,a=[]);a.push(o);rm.push(o)}});
 groups.forEach((list,m)=>{let np=0,ni=0;list.forEach(o=>{np+=o.geometry.attributes.position.count;ni+=o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count});
  const Pp=new Float32Array(np*3),Nn=new Float32Array(np*3),U=new Float32Array(np*2),I=new Uint32Array(ni);let po=0,io=0;const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  list.forEach(o=>{const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;nm.getNormalMatrix(o.matrixWorld);
   for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);Pp.set([v.x,v.y,v.z],(po+i)*3);
    if(na){v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();Nn.set([v.x,v.y,v.z],(po+i)*3)}if(ua){U[(po+i)*2]=ua.getX(i);U[(po+i)*2+1]=ua.getY(i)}}
   const ic=g.index?g.index.count:pa.count;for(let i=0;i<ic;i++)I[io+i]=(g.index?g.index.array[i]:i)+po;po+=pa.count;io+=ic});
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.BufferAttribute(Nn,3));
  bg.setAttribute('uv',new THREE.BufferAttribute(U,2));bg.setIndex(new THREE.BufferAttribute(I,1));scene.add(new THREE.Mesh(bg,m))});
 rm.forEach(o=>{scene.remove(o);o.geometry.dispose()})})();

// ---------- 10.2 Aviones (aeropuerto) ----------
// Dos aviones: puerta → marcha atrás (pushback) → giro → rodaje → pista → despegue → vuelta al circuito → aterrizaje → rodaje → puerta.
// Solo uno a la vez usa la pista (RWY). Puedes subir como pasajero (60 €) mientras están en la puerta.
const PLANES=[],PLANEFARE=60,PSTX={park:'en la puerta',push:'retrocediendo de la puerta',pivot:'girando',taxi:'rodando hacia la pista',line:'en cabecera de pista',roll:'despegando',fly:'en vuelo',rollout:'frenando en pista',arr:'rodando hacia la terminal'};
let RWY=null;const PLO=[[0,-9,2.3],[0,-6,2.3],[0,-3,2.3],[0,0,2.3],[0,3,2.3],[0,6,2.3],[0,9,2.2],[0,11.5,1.4],[4.8,1.2,1.4],[-4.8,1.2,1.4]];
function mergeParts(list){const Pp=[],Nn=[],Cc=[];
 list.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;
  for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
 return new THREE.Mesh(bg,carMat)}
function planeParts(col){
 const Y=3.4,R=1.7,W=0xf2f4f6,WG=0xdfe3e8,GL=0x1b2a38,L=[],LG=[],
 add=(a,g,c)=>{a.push([g,c])},
 A=(a,sx,sy,sz,x,y,z,c)=>{const g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);add(a,g,c)},
 Cz=(a,r1,r2,len,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r1,r2,len,16);g.rotateX(Math.PI/2);g.translate(x,y,z);add(a,g,c)},
 Cx=(a,r,w,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,w,12);g.rotateZ(Math.PI/2);g.translate(x,y,z);add(a,g,c)};
 // fuselaje, morro y cola
 Cz(L,R,R,17.5,0,Y,-.25,W);Cz(L,.3,R,4.5,0,Y-.05,10.75,W);Cz(L,R,.45,6,0,Y+.15,-12,W);
 // franja de color y ventanillas
 [-1,1].forEach(k=>{A(L,.06,.5,14.5,k*1.71,Y-.2,-.4,col);for(let z=-7.2;z<=7.5;z+=1.15)A(L,.1,.34,.5,k*1.62,Y+.45,z,GL)});
 A(L,1.5,.42,.9,0,Y+.6,10.15,GL);
 // alas con flecha, motores, winglets y estabilizadores
 const SW=.5,cs=Math.cos(SW),sn=Math.sin(SW),zr=1.8;
 for(const k of[-1,1]){
  let g=new THREE.BoxGeometry(11,.28,3.4);g.rotateY(k*SW);g.translate(k*(1.2+5.5*cs),Y-.7,zr-5.5*sn);add(L,g,WG);
  A(L,.14,1.3,1.1,k*(1.2+11*cs),Y-.2,zr-11*sn-.1,col);
  Cz(L,.8,.8,3.4,k*4.8,Y-1.55,1.2,0xc9ced4);Cz(L,.62,.62,.25,k*4.8,Y-1.55,2.95,0x2b2f35);A(L,.3,.9,1.8,k*4.8,Y-1.0,.5,0xb7bcc3);
  g=new THREE.BoxGeometry(4.6,.2,2.2);g.rotateY(k*.5);g.translate(k*(.6+2.3*Math.cos(.5)),Y+.4,-13.2-2.3*Math.sin(.5));add(L,g,WG)}
 {const g=new THREE.BoxGeometry(.3,4.8,3.8);g.rotateX(-.45);g.translate(0,Y+3.35,-12);add(L,g,col)}
 // tren de aterrizaje (se recoge en vuelo)
 A(LG,.16,1.5,.16,0,1.15,8.2,0x9aa0a6);[-1,1].forEach(k=>Cx(LG,.4,.2,k*.2,.4,8.2,0x151515));
 [-1,1].forEach(k=>{A(LG,.2,1.7,.2,k*2.9,1.75,.5,0x9aa0a6);[-1,1].forEach(j=>Cx(LG,.5,.28,k*2.9+j*.28,.5,.5,0x151515))});
 return{L,LG}}
function planeMesh(col){const P=planeParts(col),g=new THREE.Group();g.rotation.order='YXZ';
 g.add(mergeParts(P.L));const gear=mergeParts(P.LG);g.add(gear);
 const lm=(c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,.35),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);g.add(m);return m};
 lm(0xff2020,10.85,3.2,-3.6);lm(0x20ff40,-10.85,3.2,-3.6);const st=lm(0xffffff,0,8.95,-13.1);
 g.userData={gear,st};return g}
// trayectorias: polilínea con esquinas redondeadas, remuestreada cada ~3 m
function mkPath(pts,R,closed){
 const n=pts.length,D=[],d2=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
 for(let i=0;i<n;i++){const q=pts[i];
  if(!closed&&(i===0||i===n-1)){D.push([q[0],q[1]]);continue}
  const p0=pts[(i+n-1)%n],p1=pts[(i+1)%n],a=d2(p0,q),b=d2(q,p1),la=(!closed&&i===1)?a:a/2,lb=(!closed&&i===n-2)?b:b/2,r=Math.min(R,la,lb),
   u=[(q[0]-p0[0])/a,(q[1]-p0[1])/a],w=[(p1[0]-q[0])/b,(p1[1]-q[1])/b],e=[q[0]-u[0]*r,q[1]-u[1]*r],x=[q[0]+w[0]*r,q[1]+w[1]*r];
  for(let k=0;k<=10;k++){const s=k/10,a1=(1-s)*(1-s),b1=2*s*(1-s),c1=s*s;D.push([a1*e[0]+b1*q[0]+c1*x[0],a1*e[1]+b1*q[1]+c1*x[1]])}}
 if(closed)D.push([D[0][0],D[0][1]]);
 const cum=[0];for(let i=1;i<D.length;i++)cum.push(cum[i-1]+d2(D[i-1],D[i]));
 const len=cum[cum.length-1],m=Math.max(2,Math.round(len/3)),step=len/m,X=[],Z=[];let k=0;
 for(let j=0;j<=m;j++){const d=j*step;while(k<D.length-2&&cum[k+1]<d)k++;const u=clamp((d-cum[k])/((cum[k+1]-cum[k])||1),0,1);X.push(D[k][0]+(D[k+1][0]-D[k][0])*u);Z.push(D[k][1]+(D[k+1][1]-D[k][1])*u)}
 return{X,Z,len,m,step,closed}}
function pathAt(P,s){let f;if(P.closed){s=((s%P.len)+P.len)%P.len;f=s/P.step}else f=clamp(s,0,P.len)/P.step;
 const m=P.m,i=Math.min(Math.floor(f),m-1),u=f-i,j=i+1,x=P.X[i]+(P.X[j]-P.X[i])*u,z=P.Z[i]+(P.Z[j]-P.Z[i])*u;let a,b;
 if(P.closed){a=i;b=(i+3)%m}else{b=Math.min(m,i+3);a=Math.max(0,b-3)}
 return[x,z,Math.atan2(P.X[b]-P.X[a],P.Z[b]-P.Z[a])]}
// circuito de vuelo (sentido horario visto desde arriba): pista 09 hacia el este, viento en cola hacia el oeste, final desde el oeste
const RING=mkPath([[-330,425],[400,425],[400,600],[-330,600]],80,true),
 ringN=(x,z)=>{let bi=0,bd=1e9;for(let i=0;i<RING.m;i++){const d=Math.hypot(RING.X[i]-x,RING.Z[i]-z);if(d<bd){bd=d;bi=i}}return bi},
 nRoll=ringN(78,425),nTD=ringN(40,425),nEX=ringN(128,425),nCom=ringN(-100,600),
 sRoll=nRoll*RING.step,sTD=nTD*RING.step,sEX=nEX*RING.step,sCom=nCom*RING.step,xRoll=RING.X[nRoll],xEX=RING.X[nEX];
function placePlane(p){const m=p.m;m.position.set(p.x,G+p.alt,p.z);m.rotation.set(-p.pt,p.h,p.bk);m.userData.gear.visible=p.alt<10}
function addPlane(i,xg,col){
 const o1=mkPath([[xg,381],[xg,396]],0,false),
  o2=mkPath(xg===58?[[58,396],[58,425],[xRoll,425]]:[[144,396],[144,409],[58,409],[58,425],[xRoll,425]],10,false),
  ar=mkPath(xg===144?[[xEX,425],[144,425],[144,381]]:[[xEX,425],[144,425],[144,409],[58,409],[58,381]],10,false),m=planeMesh(col);scene.add(m);
 const p={plane:1,hex:col,name:['AV-101','AV-202'][i],i,xg,m,state:'park',t:i?50:12,x:xg,z:381,h:Math.PI,alt:0,pt:0,ptT:0,bk:0,bkT:0,v:0,vz:0,s:0,ps:0,rev:false,land:false,fin:false,pass:0,need:1,boarded:false,o1,o2,ar,path:o1,ph:0,sPrev:0};
 PLANES.push(p);placePlane(p);return p}

// ---------- 10.3 Avionetas (aeropuerto) ----------
// Paso 1: modelo 3D y aparcamiento. Pasos siguientes: subir (E), rodar/despegar, vuelo arcade, compra/alquiler.
// Cada avioneta: {x,z,h,m (malla), m.userData.prop (hélice), col (colisión), price, rent, own, fuel, tank, state:'park'}
const AVIO=[];
function avionParts(col){
 const W=0xf2f4f6,WG=0xdfe3e8,GL=0x1b2a38,GR=0x9aa0a6,TY=0x151515,L=[],PR=[],
 add=(a,g,c)=>{a.push([g,c])},
 A=(a,sx,sy,sz,x,y,z,c)=>{const g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);add(a,g,c)},
 Cz=(a,r1,r2,len,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r1,r2,len,14);g.rotateX(Math.PI/2);g.translate(x,y,z);add(a,g,c)},
 Cx=(a,r,w,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,w,12);g.rotateZ(Math.PI/2);g.translate(x,y,z);add(a,g,c)};
 // fuselaje: cabina, cono de cola, capó (color) y cono de la hélice
 Cz(L,.66,.62,3.2,0,1.5,.4,W);Cz(L,.62,.16,4.4,0,1.55,-3.1,W);Cz(L,.5,.66,1.7,0,1.35,2.85,col);Cz(L,.02,.28,.5,0,1.35,3.95,0xb0b5bb);
 [-1,1].forEach(k=>{A(L,.06,.2,3.2,k*.6,1.2,.4,col);A(L,.08,.42,1.7,k*.56,1.88,.55,GL)});
 A(L,.9,.4,.08,0,1.95,1.9,GL);
 // ala alta con puntas de color y montantes
 A(L,11,.14,1.7,0,2.38,.7,WG);A(L,.5,.2,1.2,0,2.26,.7,W);
 [-1,1].forEach(k=>{A(L,.5,.16,1.72,k*5.3,2.38,.7,col);const g=new THREE.BoxGeometry(.08,2.7,.1);g.rotateZ(-k*1.1);g.translate(k*1.8,1.72,.7);add(L,g,GR)});
 // cola: deriva y estabilizador
 {const g=new THREE.BoxGeometry(.12,1.5,1.3);g.rotateX(-.35);g.translate(0,2.3,-4.85);add(L,g,col)}
 A(L,3.6,.1,1,0,1.65,-5,WG);
 // tren fijo (rueda de morro y dos principales)
 Cx(L,.3,.16,0,.3,2.5,TY);A(L,.08,.7,.08,0,.7,2.5,GR);
 [-1,1].forEach(k=>{Cx(L,.3,.16,k*.95,.3,.4,TY);const g=new THREE.BoxGeometry(.08,.95,.08);g.rotateZ(k*.4);g.translate(k*.65,.62,.4);add(L,g,GR)});
 // hélice bipala (centrada en su propio origen para poder girarla)
 add(PR,new THREE.BoxGeometry(.16,2.1,.05),0x2b2f35);
 [-1,1].forEach(k=>{const g=new THREE.BoxGeometry(.17,.3,.06);g.translate(0,k*.9,0);add(PR,g,0xf1c40f)});
 return{L,PR}}
function avionMesh(col){const P=avionParts(col),g=new THREE.Group();g.rotation.order='YXZ';
 g.add(mergeParts(P.L));const pr=mergeParts(P.PR);pr.position.set(0,1.35,3.82);pr.rotation.z=.6;g.add(pr);g.userData={prop:pr};
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
function addAvion(i,x,z,h,col,name){const m=avionMesh(col);m.position.set(x,G,z);m.rotation.y=h;scene.add(m);
 const c={x0:x-1,x1:x+1,z0:z-5.2,z1:z+4.2,y0:G,y1:G+2.3,on:true};colliders.push(c); // el ala va alta: se puede pasar por debajo
 const a={avion:1,hex:col,name,i,x,z,h,m,col:c,state:'park',price:45000,rent:150,own:false,fuel:60,tank:60,v:0,alt:0,vz:0,pt:0,bk:0,thr:0,air:false,tw:0};AVIO.push(a);return a}
// subir / bajar (el jugador usa el mecanismo "riding" como en el bus: se oculta y la cámara sigue a la avioneta)
function boardAvion(a){if(riding||inCar)return;riding=a;a.col.on=false;a.v=0;a.thr=0;body.visible=false;toast('Avioneta '+a.name+' · W/S acelerador · A/D timón · a '+Math.round(AVR*3.6)+' km/h en pista: Espacio para despegar · E: bajar')}
function leaveAvion(){const a=riding;if(a.air||a.alt>.4||Math.abs(a.v)>1.5){toast('Detén la avioneta en tierra para bajar');return}
 const c=Math.cos(a.h),s=Math.sin(a.h),sd=[[c*2.4,-s*2.4],[-c*2.4,s*2.4],[-s*7,-c*7]],fx=s*.5,fz=c*.5;
 let o=sd[0];for(const q of sd)if(!blockHit(a.x+q[0]+fx,a.z+q[1]+fz,.5,0)){o=q;break}
 // la colisión sigue a la avioneta (caja que contiene el rectángulo girado)
 const hx=[[-1,-5.2],[1,-5.2],[-1,4.2],[1,4.2]].map(p=>[a.x+p[0]*c+p[1]*s,a.z-p[0]*s+p[1]*c]);
 a.col.x0=Math.min(...hx.map(p=>p[0]));a.col.x1=Math.max(...hx.map(p=>p[0]));a.col.z0=Math.min(...hx.map(p=>p[1]));a.col.z1=Math.max(...hx.map(p=>p[1]));
 a.v=0;a.thr=0;$('spd').textContent='';riding=null;a.col.on=true;body.visible=true;pl.x=a.x+o[0]+fx;pl.z=a.z+o[1]+fz;py=0;vy=0;body.position.set(pl.x,0,pl.z);toast('Has bajado de la avioneta')}
// ---- rodaje y despegue ----
// W: acelerar · S: frenar y marcha atrás · A/D: timón · velocidad de rotación AVR sobre la pista: Espacio para despegar
// en el aire: W acelera, S reduce, Espacio sube, Mayús baja, A/D vira
const AVR=80/3.6,AVMAX=50; // AVR = velocidad de despegue: 80 km/h
const onRunway=(x,z)=>x>28&&x<292&&z>408&&z<442||x>204&&x<498&&z>599+ISLDZ+130&&z<621+ISLDZ+130; // pista del aeropuerto y pista del aeródromo de la isla
function avionBump(a,x,z){const c=Math.cos(a.h),s=Math.sin(a.h),yb=G+a.alt;
 for(const p of [[0,3.6,.8],[0,-4.2,.8],[5.4,0,2.3],[-5.4,0,2.3]]){const px=x+p[0]*c+p[1]*s,pz=z-p[0]*s+p[1]*c;
  if(px<WLIM0||px>WLIM1||pz<WLIM0||pz>WLIM1||wallHit(px,pz,1.2,a.alt)||hits(px,yb+p[2],pz))return true}
 if(a.alt<5)for(const q of PLANES)if(q.alt<5&&Math.hypot(q.x-x,q.z-z)<18)return true;
 return false}
function avionStep(dt){for(const a of AVIO){
 if(riding!==a)continue;
 const w=K.KeyW||K.ArrowUp,s=K.KeyS||K.ArrowDown,up=K.Space,dn=K.ShiftLeft||K.ShiftRight,str=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0);
 a.thr+=((w?1:0)-a.thr)*Math.min(1,2.5*dt);
 const hg=heightAt(a.x,a.z),water=hg<-.3,gAlt=hg>G?hg-G:0;
 if(!a.air){
  if(a.v>=AVR&&up&&onRunway(a.x,a.z)){a.air=true;a.vz=4.5;a.alt+=.05;toast('¡Despegue!')}
  else{
   if(a.v>=AVR&&up&&!onRunway(a.x,a.z)&&tm>a.tw){a.tw=tm+4;toast('Solo se puede despegar desde la pista')}
   a.v+=a.thr*5.2*(1-Math.max(0,a.v)/AVMAX)*dt;
   const fr=1.4+Math.abs(a.v)*.05;if(!(w&&a.v<0)||true)a.v-=Math.sign(a.v)*Math.min(Math.abs(a.v),fr*dt);
   if(s){if(a.v>.2)a.v-=Math.min(a.v,10*dt);else a.v=Math.max(-4,a.v-3*dt)}
   a.h+=str*dt*1.1*Math.min(1,Math.abs(a.v)/6)*Math.sign(a.v)/(1+Math.abs(a.v)/28);
   a.alt+=(gAlt-a.alt)*Math.min(1,10*dt)}}
 else{
  a.v+=clamp((w?AVMAX:s?AVR*1.1:AVR*1.3)-a.v,-6*dt,4*dt);
  const vzT=up?7:dn?-8:0;a.vz+=clamp(vzT-a.vz,-14*dt,14*dt);
  a.alt=Math.min(200,a.alt+a.vz*dt);
  a.h+=str*dt*.75;
  const fl=water?4:gAlt;
  if(a.alt<=fl){a.alt=fl;if(!water){a.air=false;toast(a.vz<-6?'Aterrizaje duro':'Aterrizaje');if(a.vz<-6)a.v*=.6}a.vz=0}}
 const ox=a.x,oz=a.z;a.x+=Math.sin(a.h)*a.v*dt;a.z+=Math.cos(a.h)*a.v*dt;
 if(avionBump(a,a.x,a.z)||(!a.air&&water)){a.x=ox;a.z=oz;if(Math.abs(a.v)>8&&tm>a.tw){a.tw=tm+2;toast('¡Choque!')}a.v=a.air?a.v*.5:-a.v*.2}
 const k=Math.min(1,4*dt),ptT=a.air?clamp(a.vz/Math.max(a.v,20),-.35,.35):(a.v>=AVR?.12:0);
 a.pt+=(ptT-a.pt)*k;a.bk+=((a.air?-str*.5:0)-a.bk)*k;
 a.m.position.set(a.x,G+a.alt,a.z);a.m.rotation.set(-a.pt,a.h,a.bk);
 a.m.userData.prop.rotation.z+=dt*(8+a.thr*55);
 $('spd').textContent=Math.round(Math.abs(a.v)*3.6)+' km/h'}}
// aparcadas en la plataforma, entre las dos puertas de los aviones grandes, con el morro hacia la pista
[[82,0xd33a2f,'EC-AV1'],[101,0x2f7fe0,'EC-AV2'],[120,0xf1c40f,'EC-AV3']].forEach((a,i)=>addAvion(i,a[0],389,0,a[1],a[2]));

// ---------- 10.4 Aeródromo de la isla (costa sur de la isla pequeña, junto al muelle) ----------
// pista 09/27 (x 236..526, z 601..619: la avioneta necesita ~230 m de carrera para despegar), plataforma al norte con 2 avionetas, terminal, hangar, luces de borde y manga de viento
(function(){const sd0=seed,AS=0x3b3b40,WH=0xf4f4f4,YL=0xf1c40f,X0=206,X1=496,ZC=610+ISLDZ+130,ZW=18,
 A=(x,z,sx,sz,c)=>box(x,0,z,sx,G,sz,c||AS,false),M=(x,z,sx,sz,c)=>box(x,G,z,sx,.03,sz,c,false),
 TP=(t,x,z,sx,sz,rz)=>{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.fillStyle='#f4f4f4';g.font='bold 110px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,68);const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.set(-Math.PI/2,0,rz);m.position.set(x,G+.06,z);scene.add(m)};
 // pista: asfalto, líneas de borde, eje discontinuo, umbrales, números y luces de borde (se encienden de noche)
 A((X0+X1)/2,ZC,X1-X0,ZW);
 M((X0+X1)/2,ZC-ZW/2+1.2,X1-X0-4,.35,WH);M((X0+X1)/2,ZC+ZW/2-1.2,X1-X0-4,.35,WH);
 for(let x=X0+22;x<=X1-22;x+=14)M(x,ZC,7,.5,WH);
 for(let k=-3;k<=3;k++){if(!k)continue;const z=ZC+k*2.1;M(X0+3.5,z,4,.9,WH);M(X1-3.5,z,4,.9,WH)}
 TP('09',X0+14,ZC,8,4,0);TP('27',X1-14,ZC,8,4,Math.PI);
 for(let x=X0+4;x<=X1-3;x+=16){box(x,G,ZC-ZW/2-.5,.4,.3,.4,lampMat,false);box(x,G,ZC+ZW/2+.5,.4,.3,.4,lampMat,false)}
 // plataforma de estacionamiento y explanadas delante de hangar y terminal
 A(266,593+ISLDZ+130,80,16,0x55555c);A(217,598.5+ISLDZ+130,22,5,0x55555c);A(315,597.5+ISLDZ+130,22,7,0xc9c6bd);
 M(266,585.6+ISLDZ+130,78,.35,YL);[240,258].forEach(x=>M(x,598+ISLDZ+130,.35,6,YL));
 // terminal pequeña (puerta al sur, hacia la plataforma)
 {const cx=315,cz=589+ISLDZ+130,w=16,d=9,H=3.8,zf=cz+d/2,dr=hollow(cx,cz,w,d,H,1,0xe8edf2,3.2,0xcfd3d6);dr.leaf.material=mat(0x5a6370);
  box(cx,G+H+.25,cz,w+.6,.5,d+.6,0x2f7fe0,false);
  box(cx,G+.03,cz-2.8,6,1.05,1.2,0x5a6370,true);box(cx,G+1.08,cz-2.8,6.2,.08,1.3,0xdfe3e8,false);
  [-4.6,4.6].forEach(x=>box(cx+x,G+.03,cz+1.6,3.6,.45,1,0x2f7fe0,true));
  const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#1f5fa8';g.fillRect(0,0,512,96);g.fillStyle='#fff';g.font='bold 52px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('AERÓDROMO',256,50);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(9,1.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(cx,G+3.35,zf+.45);scene.add(m)}
 // hangar (puerta al sur)
 {const dr=hollow(217,590+ISLDZ+130,18,12,6.5,1,0xc9ced4,3.2,0xb8bcc0);dr.leaf.material=mat(0x5a6370);box(217,G+6.75,590+ISLDZ+130,18.6,.4,12.6,0x7a8088,false)}
 // manga de viento junto a la pista
 box(390,0,627+ISLDZ+130,.18,7,.18,0x888888,false);[[1.6,0xe67e22],[1.3,0xf4f4f4],[1,0xe67e22],[.7,0xf4f4f4]].forEach((a,i)=>box(390.9+i*1.2,G+6.2,627+ISLDZ+130,1.2,a[0]*.6,a[0]*.6,a[1],false));
 // avionetas aparcadas con el morro hacia la pista
 [[240,0x27ae60,'EC-AV4'],[258,0xe67e22,'EC-AV5']].forEach((a,i)=>addAvion(3+i,a[0],591+ISLDZ+130,0,a[1],a[2]));
 // mapa: pista, plataforma y marcador
 BLD.push([X0,ZC-ZW/2,X1-X0,ZW,'#3b3b40'],[226,585+ISLDZ+130,80,16,'#55555c']);
 PLACES.push({x:315,z:601+ISLDZ+130,key:'airstrip',l:'✈',c:'#1f8a70',nt:1});
 seed=sd0})();

