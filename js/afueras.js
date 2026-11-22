/* ===============================================================================================
   FICHA · afueras.js
   Qué hay:          Edificios de las afueras (sección 6): biblioteca, universidad, aeropuerto (el edificio) y hospital.
   Tócalo si quieres: cambiar cómo son por dentro o por fuera la biblioteca, la universidad, el aeropuerto o el hospital
   Ojo:              Lo que se hace DENTRO de la biblioteca y la universidad (minijuegos, clases) está en estudios-gimnasio.js.
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 6. EDIFICIOS DE LAS AFUERAS
//     Biblioteca, universidad y aeropuerto (solo los edificios; los aviones están en la sección 10).
// =================================================================================================

// ---------- 6.1 Biblioteca (oeste, tras la autopista; solo el edificio, sin mecánicas) ----------
// Cuerpo 8x32 m (sala central + dos alas) + pórtico + escalinata, de cara al oeste (la ciudad), junto a las fábricas del este (x≈277..290, z≈60..92). Al sur (z>92) queda libre el solar para ampliarla con la universidad.
(function(){
const s0=scene.children.length,c0=colliders.length,f0=FLOORS.length,i0=INTERACTS.length,h0=HB.length; // se construye en coordenadas locales y al final se gira 180° hasta su sitio (junto a las fábricas, mirando a la ciudad)
const PA=214.7,PB=150,hA=(x,z)=>heightAt(PA-x,PB-z),X0=-75,XB=-67,XP=-64.5,XS=-60.3,Z0=58,Z1=90,ZC=74,H=5,T=.4,
 ok=(x,z)=>isl(PA-x,PB-z)>BEACH+2&&hwNear(PA-x,PB-z).d>6; // chequeo de terreno válido: ni agua, ni playa, ni pegado a la autopista
for(let x=X0;x<=XS;x+=1)for(let z=Z0;z<=Z1;z+=1)if(!ok(x,z)){console.warn('Biblioteca: terreno no válido en ('+x+', '+z+'); no se coloca');return}
let gmin=1e9,gf=-1e9,ga=-1e9;for(let x=X0;x<=XS;x+=1)for(let z=Z0;z<=Z1;z+=1){const h=hA(x,z);gmin=Math.min(gmin,h);if(x<=XP)ga=Math.max(ga,h)}
for(let x=XP;x<=XS;x+=.5)for(let z=Z0;z<=Z1;z+=1)gf=Math.max(gf,hA(x,z));
const F=Math.max(gf+.75,ga+.2),NS=Math.max(3,Math.ceil((F-gf)/.3)),SH=(F-gf)/NS,st=0xcfc8b8,wl=0xe9e2d0,wd=0x5a3d26,s2s=[7],r2=()=>(s2s[0]=s2s[0]*16807%2147483647)/2147483647, // r2: azar propio para no alterar la semilla del mundo
 W=(xa,xb,za,zb,y,h,c)=>box((xa+xb)/2,y,(za+zb)/2,xb-xa,h,zb-za,c,true),B=(x,y,z,w,h,d,c)=>box(x,y,z,w,h,d,c,false);
if(NS>10){console.warn('Biblioteca: terreno demasiado irregular; no se coloca');return}
// base (estilóbato): rellena la pendiente
W(X0,XP,Z0,Z1,gmin-.6,F-gmin+.6,st);FLOORS.push({x0:X0,x1:XP,z0:Z0,z1:Z1,y:F});B((X0+XB)/2,F,ZC,XB-X0,.04,Z1-Z0,0x8b6b4a);
// muros: trasero, laterales y fachada con puerta (hueco de 3 m, sin hoja)
W(X0,X0+T,Z0,Z1,F,H,wl);W(X0,XB,Z0,Z0+T,F,H,wl);W(X0,XB,Z1-T,Z1,F,H,wl);
W(XB-T,XB,Z0,ZC-1.5,F,H,wl);W(XB-T,XB,ZC+1.5,Z1,F,H,wl);W(XB-T,XB,ZC-1.5,ZC+1.5,F+3.2,H-3.2,wl);
// ventanas
for(let z=Z0+1.6;z<=Z1-1.5;z+=3.2)if(Math.abs(z-ZC)>2.6)B(XB+.03,F+1.2,z,.06,2.4,1.2,0x6f8fa8);
for(const x of[-73,-71,-69]){B(x,F+1.2,Z0-.03,1.2,2.4,.06,0x6f8fa8);B(x,F+1.2,Z1+.03,1.2,2.4,.06,0x6f8fa8)}
// cubierta, friso con el cartel y frontón
W(X0-.3,XP+.3,Z0-.3,Z1+.3,F+H,.5,st);B(XP+.15,F+H+.5,ZC,.3,.9,Z1-Z0+.6,st);
{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(Z1-Z0+.6,0);sh.lineTo((Z1-Z0+.6)/2,2.6);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:XP-XB,bevelEnabled:false});g.rotateY(-Math.PI/2);
 const m=new THREE.Mesh(g,mat(st));m.position.set(XP,F+H+.5,Z0-.3);m.userData.st=1;scene.add(m)}
{const cv=document.createElement('canvas');cv.width=1024;cv.height=96;const g=cv.getContext('2d');g.fillStyle='#2c2a3a';g.fillRect(0,0,1024,96);g.fillStyle='#e8cf8a';g.font='bold 70px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('B I B L I O T E C A',512,52);
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(9,.84),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}));sg.rotation.y=Math.PI/2;sg.position.set(XP+.31,F+H+.95,ZC);scene.add(sg)}
// 6 columnas del pórtico
for(let i=0;i<10;i++){const z=Z0+.9+i*(Z1-Z0-1.8)/9,x=XP-.4,c=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,H,14),mat(0xeae6dc));c.position.set(x,F+H/2,z);c.userData.st=1;scene.add(c);
 B(x,F,z,1,.3,1,st);B(x,F+H-.3,z,1,.3,1,st);colliders.push({x0:x-.45,x1:x+.45,z0:z-.45,z1:z+.45,y0:F,y1:F+H,on:true})}
// escalinata (3 peldaños; el jugador sube por FLOORS) y camino corto hacia la autopista
const dx=(XS-XP)/NS;for(let k=1;k<=NS;k++){const y=gf+SH*k,xa=XS-k*dx;{const xe=XS-(k-1)*dx;B((xa+xe)/2,gf-.6,ZC,xe-xa,y-gf+.6,12,st)}FLOORS.push({x0:xa,x1:XS-(k-1)*dx,z0:ZC-6,z1:ZC+6,y})}
{const gy=hA(-57,ZC);B((XS-53.5)/2,gy-.15,ZC,-(XS+53.5),.21,4,0xb8b2a4)}
// interior: recepción con bibliotecario, estanterías y mesas de lectura
const BK=[0x8e2b2b,0x2b5d8e,0x2b7a4a,0xc29b2e,0x5b3a7a,0x7a4a2b,0xd8d2c0],
 shelf=(x,za,zb,dbl)=>{const d=dbl?.7:.45;W(x-d/2,x+d/2,za,zb,F,2.5,wd);for(const s of dbl?[-1,1]:[1])for(let l=0;l<4;l++){const y=F+.35+l*.55;for(let z=za+.1;z<zb-.2;){const w=Math.min(.3+r2()*.5,zb-.1-z);B(x+s*(d/2+.03),y,z+w/2,.08,.42,w-.04,BK[r2()*7|0]);z+=w}}},
 table=(x,z)=>{W(x-.45,x+.45,z-.9,z+.9,F+.72,.08,0xb08a5a);for(const a of[-1,1])for(const b of[-1,1])B(x+a*.38,F,z+b*.82,.08,.72,.08,wd);
  for(const a of[-1,1])for(const b of[-1,1]){const cx=x+a*.75,cz=z+b*.45;B(cx,F+.42,cz,.4,.05,.4,wd);B(cx,F,cz,.06,.42,.06,wd);B(cx+a*.18,F+.47,cz,.05,.45,.4,wd)}};
shelf(X0+T+.25,Z0+.7,Z1-.7,false);const shelfW=(ax,c,a,b,s)=>{const d=.45,x=ax==='x';if(x)W(a,b,c-d/2,c+d/2,F,2.5,wd);else W(c-d/2,c+d/2,a,b,F,2.5,wd);
 for(let l=0;l<4;l++){const y=F+.35+l*.55;for(let t=a+.1;t<b-.2;){const w=Math.min(.3+r2()*.5,b-.1-t),k=BK[r2()*7|0];if(x)B(t+w/2,y,c+s*(d/2+.03),w-.04,.42,.08,k);else B(c+s*(d/2+.03),y,t+w/2,.08,.42,w-.04,k);t+=w}}};
shelfW('x',Z0+T+.225,-74.1,-67.6,1);shelfW('x',Z1-T-.225,-74.1,-67.6,-1); // estanterías solo pegadas a las paredes: extremos de las alas y fachada (a ambos lados de las mesas/ordenadores)
shelfW('z',XB-T-.225,Z0+.9,67.3,-1);shelfW('z',XB-T-.225,81,Z1-.9,-1);
table(-68.7,68.4);table(-68.7,79.6);
// parte 1: zonas de estudio (las interacciones están en IDEF: libcalc, libcomm, libatlas, libpc)
for(const z of[68.4,79.6])IA(B(-68.7,F+.8,z,.5,.07,.38,0x2b5d8e),'libcalc'); // libro de contabilidad sobre cada mesa
W(-73.65,-72.95,71.6,72.8,F,1,wd);B(-73.3,F+1,72.2,.8,.06,1.1,0xd8c7a0);IA(B(-73.3,F+1.09,72.2,.35,.12,.5,0x8e2b2b),'libcomm'); // atril de manuales de Comunicación
W(-73.65,-72.95,75.2,76.4,F,1,wd);B(-73.3,F+1,75.8,.8,.06,1.1,0xd8c7a0);IA(B(-73.3,F+1.05,75.8,.55,.03,.8,0x7fb27f),'libatlas'); // atril con el atlas
for(const z of[71.2,76.8]){W(-68.3,-67.5,z-.8,z+.8,F,.75,wd);B(-67.75,F+.75,z,.08,.45,.6,0x222222);IA(B(-67.84,F+.98,z,.04,.38,.52,0x4aa3ff),'libpc')} // rincón de ordenadores
// ampliación: ala norte (z local 58..66): tertulia (Sociales) y regateo (Negociación); ala sur (82..90): mesa de juntas (Liderazgo)
const chair=(x,z,ax,az)=>{B(x,F+.42,z,.4,.05,.4,wd);B(x,F,z,.06,.42,.06,wd);B(x+ax*.18,F+.47,z+az*.18,ax?.05:.4,.45,az?.05:.4,wd)};
{const tm2=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.08,18),mat(0xb08a5a));tm2.position.set(-70.8,F+.76,61.2);tm2.userData.st=1;scene.add(tm2);B(-70.8,F,61.2,.3,.72,.3,wd);
 colliders.push({x0:-71.9,x1:-69.7,z0:60.1,z1:62.3,y0:F+.72,y1:F+.8,on:true});chair(-72.3,61.2,-1,0);chair(-69.3,61.2,1,0);chair(-70.8,59.7,0,-1);chair(-70.8,62.7,0,1);
 IA(B(-70.8,F+.84,61.2,.4,.12,.4,0xc9a227),'libsoc')}
W(-73.65,-72.95,64,65.2,F,1,wd);B(-73.3,F+1,64.6,.8,.06,1.1,0xd8c7a0);IA(B(-73.3,F+1.09,64.6,.4,.12,.5,0x2b4d8e),'libneg');
W(-71.6,-69.9,84.2,88.4,F+.72,.08,0xb08a5a);for(const a of[-1,1])for(const b of[-1,1])B(-70.75+a*.75,F,86.3+b*2,.08,.72,.08,wd);
for(const z of[85,86.3,87.6]){chair(-72.3,z,-1,0);chair(-69.2,z,1,0)}IA(B(-70.75,F+.84,86.3,.3,.14,.5,0xe0b020),'liblid');
scene.children.slice(s0).forEach(m=>{m.position.x=PA-m.position.x;m.position.z=PB-m.position.z;m.rotation.y+=Math.PI});
const fx=o=>{const a=PA-o.x1,b=PA-o.x0,c=PB-o.z1,d=PB-o.z0;o.x0=a;o.x1=b;o.z0=c;o.z1=d};colliders.slice(c0).forEach(fx);FLOORS.slice(f0).forEach(fx);HB.slice(h0).forEach(fx);INTERACTS.slice(i0).forEach(o=>{o.x=PA-o.x;o.z=PB-o.z});
BLD.push([PA-XS,PB-Z1,XS-X0,Z1-Z0,'#d9cfb8']);
})();

// ---------- 6.2 Universidad (al sur de la biblioteca; solo el edificio, sin mecánicas) ----------
// Cuerpo 11x36 m: vestíbulo central con secretaría y dos alas de aulas (norte: FP; sur: Grados) + pórtico, escalinata y torre central. De cara al oeste (la ciudad).
(function(){
const s0=scene.children.length,c0=colliders.length,f0=FLOORS.length,i0=INTERACTS.length,h0=HB.length; // se construye en coordenadas locales y al final se gira 180° hasta su sitio
const PA=214.7,PB=188,hA=(x,z)=>heightAt(PA-x,PB-z),X0=-77,XB=-66,XP=-63,XS=-60.3,Z0=56,Z1=92,ZC=74,H=6,T=.4,
 ok=(x,z)=>isl(PA-x,PB-z)>BEACH+2&&hwNear(PA-x,PB-z).d>6;
for(let x=X0;x<=XS;x+=1)for(let z=Z0;z<=Z1;z+=1)if(!ok(x,z)){console.warn('Universidad: terreno no válido en ('+x+', '+z+'); no se coloca');return}
let gmin=1e9,gf=-1e9,ga=-1e9;for(let x=X0;x<=XS;x+=1)for(let z=Z0;z<=Z1;z+=1){const h=hA(x,z);gmin=Math.min(gmin,h);if(x<=XP)ga=Math.max(ga,h)}
for(let x=XP;x<=XS;x+=.5)for(let z=Z0;z<=Z1;z+=1)gf=Math.max(gf,hA(x,z));
const F=Math.max(gf+.75,ga+.2),NS=Math.max(3,Math.ceil((F-gf)/.3)),SH=(F-gf)/NS,st=0xc2b9a4,wl=0xe8dcc0,wd=0x5a3d26,
 W=(xa,xb,za,zb,y,h,c)=>box((xa+xb)/2,y,(za+zb)/2,xb-xa,h,zb-za,c,true),B=(x,y,z,w,h,d,c)=>box(x,y,z,w,h,d,c,false),
 plq=(t,w,fs)=>{const cv=document.createElement('canvas');cv.width=Math.round(w*113.8);cv.height=96;const g=cv.getContext('2d');g.fillStyle='#1f2a44';g.fillRect(0,0,cv.width,96);g.fillStyle='#e8cf8a';g.font='bold '+fs+'px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,cv.width/2,52);
  return new THREE.Mesh(new THREE.PlaneGeometry(w,.84),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}))};
if(NS>10){console.warn('Universidad: terreno demasiado irregular; no se coloca');return}
// base, suelo, muros exteriores (puerta de 4 m), particiones del vestíbulo (con puerta a cada ala)
W(X0,XP,Z0,Z1,gmin-.6,F-gmin+.6,st);FLOORS.push({x0:X0,x1:XP,z0:Z0,z1:Z1,y:F});B((X0+XB)/2,F,ZC,XB-X0,.04,Z1-Z0,0x9b8466);
W(X0,X0+T,Z0,Z1,F,H,wl);W(X0,XB,Z0,Z0+T,F,H,wl);W(X0,XB,Z1-T,Z1,F,H,wl);
W(XB-T,XB,Z0,ZC-2,F,H,wl);W(XB-T,XB,ZC+2,Z1,F,H,wl);W(XB-T,XB,ZC-2,ZC+2,F+3.4,H-3.4,wl);
for(const z of[67.85,79.85]){W(X0+T,-72.7,z,z+.3,F,H,wl);W(-70.3,XB-T,z,z+.3,F,H,wl);W(-72.7,-70.3,z,z+.3,F+2.7,H-2.7,wl)}
for(let z=Z0+1.6;z<=Z1-1.5;z+=3.2)if(Math.abs(z-ZC)>4.5)B(XB+.03,F+1.3,z,.06,2.6,1.2,0x6f8fa8);
for(const x of[-74.5,-71.5,-68.5]){B(x,F+1.3,Z0-.03,1.2,2.6,.06,0x6f8fa8);B(x,F+1.3,Z1+.03,1.2,2.6,.06,0x6f8fa8)}
// cubierta, friso con cartel, frontón central y torre
W(X0-.3,XP+.3,Z0-.3,Z1+.3,F+H,.5,0x8a5a4a);B(XP+.15,F+H+.5,ZC,.3,.9,Z1-Z0+.6,st);
{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(12.6,0);sh.lineTo(6.3,2.8);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:XP-XB,bevelEnabled:false});g.rotateY(-Math.PI/2);
 const m=new THREE.Mesh(g,mat(st));m.position.set(XP,F+H+.5,ZC-6.3);m.userData.st=1;scene.add(m);
 B(-71.5,F+H+.5,ZC,6,4.5,6,wl);const c=new THREE.Mesh(new THREE.CylinderGeometry(0,4.6,3.4,4),mat(0x5a6a7a));c.rotation.y=Math.PI/4;c.position.set(-71.5,F+H+.5+4.5+1.7,ZC);c.userData.st=1;scene.add(c)}
{const sg=plq('U N I V E R S I D A D',10,66);sg.rotation.y=Math.PI/2;sg.position.set(XP+.31,F+H+.95,ZC);scene.add(sg)}
for(let i=0;i<12;i++){const z=Z0+.9+i*(Z1-Z0-1.8)/11,x=XP-.4,c=new THREE.Mesh(new THREE.CylinderGeometry(.45,.5,H,14),mat(0xeae6dc));c.position.set(x,F+H/2,z);c.userData.st=1;scene.add(c);
 B(x,F,z,1.05,.3,1.05,st);B(x,F+H-.3,z,1.05,.3,1.05,st);colliders.push({x0:x-.5,x1:x+.5,z0:z-.5,z1:z+.5,y0:F,y1:F+H,on:true})}
// escalinata y camino hacia la ciudad
const dx=(XS-XP)/NS;for(let k=1;k<=NS;k++){const y=gf+SH*k,xa=XS-k*dx,xe=XS-(k-1)*dx;B((xa+xe)/2,gf-.6,ZC,xe-xa,y-gf+.6,14,st);FLOORS.push({x0:xa,x1:xe,z0:ZC-7,z1:ZC+7,y})}
{const gy=hA(-57,ZC);B((XS-53.5)/2,gy-.15,ZC,-(XS+53.5),.21,5,0xb8b2a4)}
// vestíbulo: secretaría (mostrador y archivadores), rótulo y bancos; aulas (pizarra, mesa del profesor y pupitres) y rótulos sobre las puertas
W(-75.9,-74.9,70.2,77.8,F,1.1,0x6b4a2f);B(-75.4,F+1.1,ZC,1.3,.07,8,0xd8c7a0);IA(B(-75.4,F+1.2,ZC,.5,.12,.6,0xe0b020),'unisec');for(let z=69.4;z<=78.6;z+=1.2)W(-76.55,-76.1,z-.55,z+.55,F,1.8,0x6d7a82);
{const p=plq('SECRETARÍA',4.5,60);p.rotation.y=Math.PI/2;p.position.set(X0+T+.03,F+2.7,ZC);scene.add(p)}
for(const z of[71,77]){W(-69.3,-68.7,z-1,z+1,F+.42,.06,wd);B(-69,F,z-.9,.5,.42,.05,wd);B(-69,F,z+.9,.5,.42,.05,wd)}
{const p=plq('AULAS · FP',3.4,56);p.position.set(-71.5,F+3.9,68.17);scene.add(p)}
{const p=plq('AULAS · GRADOS',3.4,46);p.rotation.y=Math.PI;p.position.set(-71.5,F+3.9,79.83);scene.add(p)}
for(const zc of[62.1,85.9]){B(X0+T+.03,F+1.1,zc,.05,1.4,5.5,0x2f4a3a);W(-75.9,-75.1,zc-1,zc+1,F+.72,.06,0xb08a5a);IA(B(-75.5,F+.84,zc,.4,.12,.5,0x2b5d8e),zc<70?'unifp':'unigr');B(-75.5,F,zc-.9,.06,.72,.06,wd);B(-75.5,F,zc+.9,.06,.72,.06,wd);
 for(const x of[-72.8,-70.6,-68.4])for(const o of[-3.9,-1.3,1.3,3.9]){const z=zc+o;W(x-.3,x+.3,z-.55,z+.55,F+.72,.06,0xb08a5a);B(x,F,z-.5,.5,.72,.05,wd);B(x,F,z+.5,.5,.72,.05,wd);B(x+.65,F+.42,z,.4,.05,.4,wd);B(x+.65,F,z,.06,.42,.06,wd);B(x+.85,F+.47,z,.05,.45,.4,wd)}}
scene.children.slice(s0).forEach(m=>{m.position.x=PA-m.position.x;m.position.z=PB-m.position.z;m.rotation.y+=Math.PI});
const fx=o=>{const a=PA-o.x1,b=PA-o.x0,c=PB-o.z1,d=PB-o.z0;o.x0=a;o.x1=b;o.z0=c;o.z1=d};colliders.slice(c0).forEach(fx);FLOORS.slice(f0).forEach(fx);HB.slice(h0).forEach(fx);INTERACTS.slice(i0).forEach(o=>{o.x=PA-o.x;o.z=PB-o.z});
BLD.push([PA-XS,PB-Z1,XS-X0,Z1-Z0,'#c9bfa6']);
})();



// ---------- 6.3 Aeropuerto (afueras, al sur del barrio): terminal con torre de control, plataforma y pista ----------
function airport(){const sd0=seed,px=101,pz=352,w=64,d=24,H=9,fz=-1,L=d/2-.4,zf=pz-d/2,zb=pz+d/2,AS=0x3b3b40,Zl=l=>pz+fz*l,
 F=(x,y,l,sx,sy,sz,c,sol)=>box(px+x,G+.03+y,Zl(l),sx,sy,sz,c,sol),
 A=(x,z,sx,sz,c)=>box(x,0,z,sx,G,sz,c||AS,false),M=(x,z,sx,sz,c)=>box(x,G,z,sx,.03,sz,c,false),
 TP=(t,x,z,sx,sz,rz)=>{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.fillStyle='#f4f4f4';g.font='bold 110px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,68);const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.set(-Math.PI/2,0,rz);m.position.set(x,G+.06,z);scene.add(m)};
 // pista (x 30..290, z 410..440), plataforma y explanada
 A(160,425,260,30);A(101,387,110,46);A(px,332,92,16);A(px,339.8,70,2.6,0xc9c6bd);
 M(160,411.6,256,.5,0xf4f4f4);M(160,438.4,256,.5,0xf4f4f4);
 for(let x=44;x<=276;x+=16)M(x,425,8,.6,0xf4f4f4);
 for(let k=-6;k<=6;k++){if(!k)continue;const z=425+k*2.0;M(36.5,z,5,1,0xf4f4f4);M(283.5,z,5,1,0xf4f4f4)}
 [80,240].forEach(x=>{M(x,420.5,7,1.2,0xf4f4f4);M(x,429.5,7,1.2,0xf4f4f4)});
 TP('09',55,425,9,4.5,0);TP('27',265,425,9,4.5,Math.PI);
 for(let x=34;x<=286;x+=18){box(x,G,410.3,.45,.3,.45,0xfff0b0,false);box(x,G,439.7,.45,.3,.45,0xfff0b0,false)}
 M(101,402,100,.5,0xf1c40f);[58,101,144].forEach(x=>M(x,386,.5,32,0xf1c40f));M(101,406,.5,8,0xf1c40f);M(58,406,.5,8,0xf1c40f);M(144,406,.5,8,0xf1c40f);
 for(let i=-6;i<=6;i++)M(px+i*6,331,.3,5,0xf4f4f4);
 [-38,-14,14,38].forEach(x=>lampPost(px+x,327.5,0,1));
 // manga de viento
 box(150,0,447,.18,7,.18,0x888888,false);[[1.6,0xe67e22],[1.3,0xf4f4f4],[1,0xe67e22],[.7,0xf4f4f4]].forEach((a,i)=>box(150.9+i*1.2,G+6.2,447,1.2,a[0]*.6,a[0]*.6,a[1],false));
 // terminal
 const dr=hollow(px,pz,w,d,H,fz,0xe8edf2,8,0xcfd3d6);dr.leaf.material=mat(0x5a6370);
 box(px,G+H+.25,pz,w+.6,.7,d+.6,0x2f7fe0,false);
 for(let i=-3;i<=3;i++)box(px+i*8.5,G+1,zb+.3,6.5,4.6,.1,0x7fb7d6,false);
 [-1,1].forEach(k=>[0,1,2].forEach(i=>box(px+k*(10+i*8.5),G+1,zf-.3,6.5,4.6,.1,0x7fb7d6,false)));
 box(px,G+4.9,zf-2.6,16,.3,5.4,0x2f7fe0,false);[-1,1].forEach(k=>F(k*7.5,0,d/2+2.4,.5,4.9,.5,0xdfe3e8,true));
 {const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#1f5fa8';g.fillRect(0,0,512,96);g.fillStyle='#fff';g.font='bold 52px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('AEROPUERTO',256,50);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(16,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(px,G+7,zf-.45);m.rotation.y=Math.PI;scene.add(m)}
 // torre de control
 {const tx=px+w/2-6,tz=pz+3.5;box(tx,G+H+.25,tz,4.4,14,4.4,0xdfe3e8,true);box(tx,G+H+10,tz-2.25,2,1.2,.1,0x7fb7d6,false);box(tx,G+H+14.25,tz,8,3,8,0x7fb7d6,false);box(tx,G+H+17.25,tz,9,.5,9,0x555a60,false);box(tx,G+H+17.75,tz,.2,5,.2,0x333333,false);box(tx,G+H+22.7,tz,.5,.5,.5,0xff3030,false)}
 // interior: mostradores de facturación, cintas, bancos, panel de salidas, cafetería y columnas
 [-24,-12,0,12,24].forEach((x,i)=>{F(x,0,-L+3,5,1.05,1.4,0x5a6370,true);F(x,1.05,-L+3,5.2,.08,1.5,0xdfe3e8,false);F(x,1.13,-L+3.3,.9,.6,.08,0x111418,false);F(x,0,-L+1.1,5,.7,1.2,0x2d3036,true);F(x,3.2,-L+.05,4,.9,.05,[0x2f7fe0,0xe67e22,0x27ae60,0xc0392b,0x8e44ad][i],false)});
 F(0,4.1,-L+.05,12,2.6,.08,0x101418,false);for(let r=0;r<4;r++)for(let c=0;c<5;c++)F(-4.8+c*2.4,4.35+r*.55,-L+.1,[1.6,.9,.6,.5,.4][c%5],.25,.04,[0x2ecc71,0xf1c40f,0xf4f4f4,0xe67e22,0xf4f4f4][c],false);
 [-1,1].forEach(k=>[11,20].forEach(x=>[1.8,5].forEach(l=>{IA(F(k*x,0,l,5,.45,1.1,0x2f7fe0,true),'sit');F(k*x,.45,l-.45,5,.6,.25,0x2f7fe0,false)})));
 [-16,16].forEach(x=>F(x,0,0,.8,H-.1,.8,0xdfe3e8,true));
 F(27,0,4.5,5,1.05,1.6,0x8b5a2b,true);F(27,1.05,4.5,5.2,.08,1.7,0x2f2f2f,false);F(28.5,1.13,4.5,.6,.5,.5,0x222222,false);
 [-29,29].forEach(x=>{F(x,0,-L+.9,.9,.6,.9,0x8a4a2a,false);F(x,.6,-L+.9,.8,1,.8,0x2a8a3a,false)});
 BLD.push([30,410,260,30,'#3b3b40'],[46,364,110,46,'#55555c']);
 PLACES.push({x:px,z:zf-4,key:'airport',l:'✈',c:'#2f7fe0',nt:1});
 seed=sd0}
airport();

// ---------- 6.4 Hospital (afueras, cerca de la ciudad): recepción, sala de espera y 3 habitaciones con cama ----------
// Cuerpo 16x26 m, de cara al oeste (la ciudad). El código busca SOLO un solar libre cerca de HOS_PREF: terreno llano, sin agua ni playa,
// lejos de la autopista y sin pisar otros edificios. Si no hay sitio, no se coloca (aviso en la consola) y el desmayo te deja en el punto de inicio.
// Al colocarse, HOSPITAL_SPAWN pasa a ser el suelo junto a la cama de la habitación central. Interacciones: IDEF.hosdesk (recepción) e IDEF.hosbed (cama).
const HOSPITAL_FEE=200,HOSPITAL_RECOVER=50,HOSPITAL_SPAWN={x:24,z:1.5,y:0};
function hospitalDesk(){openDlg();dlg.innerHTML='<h2>🏥 Hospital</h2><p>Recepcionista: «Buenos días. Por €'+HOSPITAL_FEE+' le hacemos un chequeo completo y le dejamos como nuevo.»</p><p><small>Ahora mismo: hambre '+Math.round(hunger)+'% · energía '+Math.round(energy)+'%</small></p><button onclick="hospitalHeal()">Atención médica (€'+HOSPITAL_FEE+')</button> <button onclick="closeDlg()">Cerrar</button>'}
function hospitalHeal(){if(!pay(HOSPITAL_FEE))return;hunger=100;energy=100;closeDlg();toast('🏥 Te han atendido: hambre y energía al 100 % (-€'+HOSPITAL_FEE+')');saveGame()}
(function(){
const HOS_PREF={x:285,z:150},RW=16,RD=26,M=4,H=4.2,T=.4,hA=(x,z)=>heightAt(x,z);
// ---- 1) buscar solar ----
const rects=[];BLD.forEach(b=>rects.push([b[0],b[1],b[0]+b[2],b[1]+b[3]]));FACS.forEach(s=>rects.push([s.x-s.w/2-4,s.z-s.d/2-14,s.x+s.w/2+4,s.z+s.d/2+3]));
rects.push([AP.x0-30,AP.z0-30,AP.x1+30,AP.z1+30],[-30,-30,N*P+2,N*P+2]);FLOORS.forEach(f=>rects.push([f.x0,f.z0,f.x1,f.z1]));PITS.forEach(f=>rects.push([f.x0,f.z0,f.x1,f.z1]));
const hit=(a0,a1,a2,a3,r)=>a0<r[2]&&a2>r[0]&&a1<r[3]&&a3>r[1];
const cand=[];for(let x=150;x<=312;x+=3)for(let z=-80;z<=330;z+=3)cand.push([x,z,Math.hypot(x-HOS_PREF.x,z-HOS_PREF.z)]);cand.sort((a,b)=>a[2]-b[2]);
let pos=null;
for(const[cx,cz]of cand){const xa=cx-RW/2,xb=cx+RW/2,za=cz-RD/2,zb=cz+RD/2,a0=xa-M,a1=za-M,a2=xb+M,a3=zb+M;
 if(a2>316)continue;if(rects.some(r=>hit(a0,a1,a2,a3,r)))continue;
 if(colliders.some(c=>c.x0<a2-4&&c.x1>a0+4&&c.z0<a3-4&&c.z1>a1+4))continue;
 let ok=true,gmin=1e9,gmax=-1e9;
 for(let x=a0;x<=a2&&ok;x+=3)for(let z=a1;z<=a3;z+=3){if(isl(x,z)<=BEACH+2||hwNear(x,z).d<=9||portPf(x,z)<1){ok=false;break}}
 if(!ok)continue;
 for(let x=xa;x<=xb;x+=2)for(let z=za;z<=zb;z+=2){const h=hA(x,z);gmin=Math.min(gmin,h);gmax=Math.max(gmax,h)}
 if(gmax-gmin>2.3)continue;
 let gf=1e9;for(let x=xa-6;x<=xa-1.5;x+=1.5)for(let z=cz-3;z<=cz+3;z+=1.5)gf=Math.min(gf,hA(x,z));
 const F=gmax+.2;if(F-gf>2.8)continue;
 pos={cx,cz,gmin,gf,F};break}
if(!pos){console.warn('Hospital: no hay un solar libre; no se coloca');return}
// ---- 2) construir ----
const{cx,cz,gmin,gf,F}=pos,XA=cx-RW/2,XB=cx+RW/2,ZA=cz-RD/2,ZB=cz+RD/2,XM=XA+8.2,
 wl=0xf4f6f7,fl=0xdfe9e4,rd=0xc62828,gl=0x6f8fa8,st=0xbdb7aa,wd=0x5a3d26,
 W=(xa,xb,za,zb,y,h,c)=>box((xa+xb)/2,y,(za+zb)/2,xb-xa,h,zb-za,c,true),B=(x,y,z,w,h,d,c)=>box(x,y,z,w,h,d,c,false);
// base, suelo y muros
W(XA,XB,ZA,ZB,gmin-.6,F-gmin+.6,st);FLOORS.push({x0:XA,x1:XB,z0:ZA,z1:ZB,y:F});B(cx,F,cz,RW-2*T,.04,RD-2*T,fl);
W(XB-T,XB,ZA,ZB,F,H,wl);W(XA,XB,ZA,ZA+T,F,H,wl);W(XA,XB,ZB-T,ZB,F,H,wl);
W(XA,XA+T,ZA,cz-1.5,F,H,wl);W(XA,XA+T,cz+1.5,ZB,F,H,wl);W(XA,XA+T,cz-1.5,cz+1.5,F+3.2,H-3.2,wl); // fachada con puerta de 3 m
// tabique entre el vestíbulo y las habitaciones (3 puertas) y divisiones entre habitaciones
const zc=[cz-8.5,cz,cz+8.5];{let z0=ZA+T;for(const c of zc){W(XM-T/2,XM+T/2,z0,c-1.1,F,H,wl);z0=c+1.1}W(XM-T/2,XM+T/2,z0,ZB-T,F,H,wl)}
for(const z of[cz-4.25,cz+4.25])W(XM+T/2,XB-T,z-T/2,z+T/2,F,H,wl);
// cubierta, franja roja y ventanas
W(XA-.3,XB+.3,ZA-.3,ZB+.3,F+H,.5,0xe8ebec);B(XA-.04,F+H-.9,cz,.08,.6,RD,rd);
for(let z=ZA+2;z<=ZB-1.5;z+=3.2)if(Math.abs(z-cz)>2.4)B(XA-.03,F+1.2,z,.06,1.6,1.3,gl);
for(const x of[cx-3,cx+3]){B(x,F+1.2,ZA-.03,1.3,1.6,.06,gl);B(x,F+1.2,ZB+.03,1.3,1.6,.06,gl)}
for(const c of zc)B(XB+.03,F+1.2,c,.06,1.6,1.6,gl);
// cartel sobre la cubierta
{const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const g=cv.getContext('2d');g.fillStyle='#ffffff';g.fillRect(0,0,1024,128);
 g.fillStyle='#c62828';g.fillRect(40,24,80,80);g.fillStyle='#ffffff';g.fillRect(70,34,20,60);g.fillRect(50,54,60,20);
 g.fillStyle='#c62828';g.font='bold 80px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('H O S P I T A L',580,68);
 B(XA+.5,F+H+.5,cz,.3,1.3,10,wl);const sg=new THREE.Mesh(new THREE.PlaneGeometry(9.6,1.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}));
 sg.rotation.y=-Math.PI/2;sg.position.set(XA+.33,F+H+1.15,cz);sg.userData.st=1;scene.add(sg)}
// escalinata de entrada (peldaños de ≤35 cm; el jugador sube por FLOORS)
{const NS=Math.max(2,Math.ceil((F-gf)/.35)),SH=(F-gf)/NS,dx=.9;for(let k=1;k<=NS;k++){const xe=XA-(NS-k)*dx,xa=xe-dx,y=gf+SH*k;B((xa+xe)/2,gf-.6,cz,dx,y-gf+.6,6,st);FLOORS.push({x0:xa,x1:xe,z0:cz-3,z1:cz+3,y})}}
// vestíbulo: mostrador de recepción con recepcionista, cruz en la pared y bancos de espera
W(XA+2.9,XA+3.9,cz-10,cz-3,F,1.1,0xb08a5a);B(XA+3.4,F+1.1,cz-6.5,1.3,.06,7.4,0xeceff1);IA(B(XA+3.4,F+1.16,cz-3.6,.35,.1,.35,rd),'hosdesk');
{const rp=person(0x2e9d6a,{fem:true});rp.position.set(XA+4.7,F,cz-6.5);rp.rotation.y=-Math.PI/2;scene.add(rp)}
B(XM-T/2-.03,F+1.6,cz-4.25,.05,1.4,.4,rd);B(XM-T/2-.03,F+2.1,cz-4.25,.05,.4,1.4,rd);
for(const z of[cz+4,cz+7.5,cz+11]){B(XA+1.4,F+.42,z,.5,.08,2.4,0x2b6cb0);B(XA+1.4,F,z-1,.08,.42,.08,wd);B(XA+1.4,F,z+1,.08,.42,.08,wd);B(XA+.8,F+.5,z,.08,.55,2.4,0x2b6cb0)}
// habitaciones: cama (sólida) con colchón, almohada y manta, y una mesilla
for(const c of zc){const bx=XM+3.9,bz=c+1.9;W(bx-1,bx+1,bz-.5,bz+.5,F,.5,0xcfd8dc);B(bx,F+.5,bz,2,.15,.95,0xffffff);B(bx+.7,F+.65,bz,.5,.1,.6,0xe3f2fd);B(bx-.2,F+.65,bz,1.2,.06,.97,0x4fc3f7);
 IA(B(bx-.6,F+.71,bz,.3,.06,.3,rd),'hosbed');W(XB-T-.6,XB-T,c-1.8,c-.8,F,.7,0xb0bec5)}
// minimapa, destino en el mapa y punto de aparición tras un desmayo (suelo junto a la cama de la habitación central)
BLD.push([XA,ZA,RW,RD,'#f4f6f7']);PLACES.push({x:XA-6,z:cz,key:'hospital',l:'H',c:'#c62828',nt:1});
HOSPITAL_SPAWN.x=XM+1.8;HOSPITAL_SPAWN.z=cz-.8;HOSPITAL_SPAWN.y=F;
console.info('Hospital colocado en x='+Math.round(cx)+', z='+Math.round(cz));
})();


