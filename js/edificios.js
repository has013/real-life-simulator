/* ===============================================================================================
   FICHA · edificios.js
   Qué hay:          Edificios del barrio principal (sección 4): comercios, casas y sus interiores, fábricas de las afueras (4.1) e imágenes de la tienda de ropa (4.2).
   Tócalo si quieres: añadir o cambiar un edificio o comercio del barrio principal, cambiar interiores de casas
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 4. EDIFICIOS
//     Piezas para construir edificios: paredes huecas, puertas, ventanas e interiores (casas, hotel y tiendas).
// =================================================================================================
function hollow(cx,cz,w,d,h,fz,wc,dw,fl,hole){
 const t=.4,zf=cz+fz*d/2,zb=cz-fz*d/2,sw=(w-dw)/2;
 box(cx,G+.01,cz,w,.03,d,fl,false);
 box(cx,G,zb,w,h,t,wc,true);box(cx-w/2+t/2,G,cz,t,h,d,wc,true);box(cx+w/2-t/2,G,cz,t,h,d,wc,true);
 box(cx-dw/2-sw/2,G,zf,sw,h,t,wc,true);box(cx+dw/2+sw/2,G,zf,sw,h,t,wc,true);
 box(cx,G+2.5,zf,dw,h-2.5,t,wc,false);if(hole){const W=w+.3,D=d+.3,xa=cx-W/2,xb=cx+W/2,za=cz-D/2,ze=cz+D/2,R=(a,b,c,e)=>box((a+b)/2,G+h,(c+e)/2,b-a,.25,e-c,0x555555,false);R(xa,hole[0],za,ze);R(hole[1],xb,za,ze);R(hole[0],hole[1],za,hole[2]);R(hole[0],hole[1],hole[3],ze)}else box(cx,G+h,cz,w+.3,.25,d+.3,0x555555,false);
 ROOMS.push({x0:cx-w/2+t,x1:cx+w/2-t,z0:cz-d/2+t,z1:cz+d/2-t,h:G+h});shell(cx,cz,w,d,h,fz,dw,hole);
 const pv=new THREE.Group();pv.position.set(cx-dw/2,G,zf);scene.add(pv);
 const lf=box(dw/2,0,0,dw,2.5,.12,0x6b4a2b,false,pv);
 const col={x0:cx-dw/2,x1:cx+dw/2,z0:zf-.15,z1:zf+.15,y1:2.7,on:true};colliders.push(col);
 const door={pv,col,x:cx,z:zf,fz,leaf:lf,open:false,ang:0};DOORS.push(door);BLD.push([cx-w/2,cz-d/2,w,d,wc]);return door}
function shell(cx,cz,w,d,h,fz,dw,hole){const ip=pick([0xf4efe6,0xe9f0f4,0xf6ead8,0xe8f0e4]),y=G+.03,ih=h-.06,iw=w-.8,id=d-.8,zf=cz+fz*d/2,zb=cz-fz*d/2,sw=(w-dw)/2;
 const wl=(x,z,sx,sz)=>{box(x,y,z,sx,ih,sz,ip,false);box(x,y,z,sx+.02,.18,sz+.02,0x6b5a4a,false)};
 wl(cx,cz-fz*(d/2-.23),iw,.06);wl(cx-(w/2-.23),cz,.06,id);wl(cx+(w/2-.23),cz,.06,id);
 if(hole){const xa=cx-iw/2,xb=cx+iw/2,za=cz-id/2,ze=cz+id/2,Rc=(a,b,c,e)=>{if(b-a>.01&&e-c>.01)box((a+b)/2,G+h-.04,(c+e)/2,b-a,.04,e-c,0xffffff,false)};Rc(xa,hole[0],za,ze);Rc(hole[1],xb,za,ze);Rc(hole[0],hole[1],za,hole[2]);Rc(hole[0],hole[1],hole[3],ze)}else box(cx,G+h-.04,cz,iw,.04,id,0xffffff,false);[-1,1].forEach(k=>box(cx+k*iw*.25,G+h-.12,cz,.8,.08,.8,0xfffbe0,false));
 const win=(x,z,ax,ww,wh)=>{box(x,G+1,z,ax?.52:ww+.2,wh+.2,ax?ww+.2:.52,0xffffff,false);box(x,G+1.1,z,ax?.56:ww,wh,ax?ww:.56,0x9fd0ea,false);box(x,G+1.1,z,ax?.58:.08,wh,ax?.08:.58,0xffffff,false)};
 if(sw>2.6)[-1,1].forEach(k=>win(cx+k*(dw/2+sw/2),zf,0,Math.min(3.6,sw-1),1.4));
 if(h<4){[-1,1].forEach(k=>win(cx+k*w*.28,zb,0,2.2,1.4));if(d>=10)[-1,1].forEach(k=>[-1,1].forEach(m=>win(cx+k*w/2,cz+m*d*.22,1,2.2,1.4)))}}
function houseIn(F,L){
 const Wl=(x,l,sx,sz)=>F(x,0,l,sx,2.7,sz,0xf2efe8,true);
 Wl(-4.9,-L+4.6,5,.15);Wl(-.7,-L+4.6,1,.15);Wl(-.2,-L+2.3,.15,4.6);
 IA(F(-4.2,0,-L+1.8,2.2,.35,3.4,0x6b4a2b,true),'bed');F(-4.2,.35,-L+1.8,2,.25,3.2,0xf4f4f4,false);F(-4.2,.5,-L+2.5,2,.15,2,0x3b6ea5,false);
 F(-4.7,.6,-L+.5,.7,.15,.4,0xffffff,false);F(-3.7,.6,-L+.5,.7,.15,.4,0xffffff,false);F(-4.2,.35,-L+.1,2.3,.9,.12,0x5a3b22,false);
 [-6,-2.4].forEach(x=>{F(x,0,-L+.5,.6,.5,.5,0x6b4a2b,true);F(x,.5,-L+.5,.2,.35,.2,0xffe9a0,false)});
 IA(F(-.9,0,-L+1.8,.7,2.2,2,0x7a5a3a,true),'wardrobe');F(-4.2,0,-L+2.4,3.4,.02,4,0xc0a060,false);
 F(4.4,0,-L+.5,5.6,.95,.8,0xe8e8e8,true);F(4.4,.95,-L+.5,5.6,.05,.85,0x3a3a3a,false);F(3,1,-L+.5,.9,.03,.5,0xb0b8c0,false);IA(F(5.6,1,-L+.5,.9,.03,.6,0x111111,false),'stove');
 F(4.4,1.7,-L+.3,5.6,.8,.4,0xdcd0b8,false);IA(F(.9,0,-L+.6,.9,1.9,.8,0xf4f4f4,true),'fridge');F(.45,1,-L+1.05,.05,.5,.05,0x888888,false);
 F(4.2,0,-L+3.4,2.2,.75,1.2,0x8b5a2b,true);[[3.2,2.5],[5.2,2.5],[3.2,4.3],[5.2,4.3]].forEach(a=>IA(F(a[0],0,-L+a[1],.5,.5,.5,0x6b4a2b,false),'sit'));
 IA(F(-5.2,0,L-1.4,3,.45,1.1,0x7a3b3b,true),'sit');F(-5.2,.45,L-.8,3,.6,.3,0x7a3b3b,false);F(-6.7,.45,L-1.4,.3,.35,1.1,0x7a3b3b,false);F(-3.7,.45,L-1.4,.3,.35,1.1,0x7a3b3b,false);
 F(-5.2,0,L-3.2,1.4,.4,.8,0x6b4a2b,true);F(-5.2,0,L-2.4,3.2,.02,3.2,0x5a7aa0,false);
 F(-5.2,0,-L+5.1,1.8,.45,.5,0x333333,true);IA(F(-5.2,.45,-L+5.1,1.4,.8,.08,0x050505,false),'tv');
 F(-7,0,L-.5,.5,.5,.5,0x8a4a2a,false);F(-7,.5,L-.5,.6,.7,.6,0x2a8a3a,false);F(-7.35,1.4,0,.05,.8,1.2,0xcc8844,false);
 Wl(5.3,L-3.6,4.2,.15);Wl(3.2,L-2.4,.15,2.4);F(5.4,0,L-1.8,4,.02,3.6,0xcfe3ea,false);
 IA(F(6.8,0,L-.9,.45,.4,.7,0xffffff,true),'toilet');F(6.8,.4,L-.35,.45,.45,.2,0xffffff,false);IA(F(4.2,0,L-.5,.7,.85,.4,0xffffff,true),'sink');F(4.2,1.3,L-.2,.6,.7,.04,0xaadcee,false);
 IA(F(5.8,0,L-3.1,2.4,.55,.8,0xffffff,true),'bath');F(5.8,.5,L-3.1,2.2,.05,.65,0x7fc8e8,false)}
function hotelUp(px,pz,w,d){const Y=[0,4.57,7.57,10.57,13.57],Y5=16.57,C=0xcfc8bc,
 tx=ww=>{const t=TEX[1].clone();t.needsUpdate=true;t.repeat.set(Math.round(ww/4),1);return new THREE.MeshLambertMaterial({map:t})},
 mL=tx(w),mS=tx(d),W=px-w/2,E=px+w/2,hl=w/2-.2,hd=d/2-.2,xs=px-16.35,rw=5.96,Z0=pz-d/2,Z1=pz+d/2,e0=px+13.9,e1=px+16.2,z0=pz-5.45,z1=pz-3.25,
 rm=ROOMS.find(r=>r.x0<px&&r.x1>px&&r.z0<pz&&r.z1>pz&&!r.fl);if(rm)rm.hot=Y;
 const sl=(a,b,c,e,y,o)=>box((a+b)/2,y-.3+(o||0),(c+e)/2,b-a,.3,e-c,C,false);
 for(let L=1;L<=4;L++){const y=Y[L],o=L===1?.02:0;
  box(px,y,pz-hd,w,3,.4,mL,true);box(px,y,pz+hd,w,3,.4,mL,true);box(px-hl,y,pz,.4,3,d,mS,true);box(px+hl,y,pz,.4,3,d,mS,true);
  sl(W,e0-.15,Z0,Z1,y,o);sl(e1+.15,E,Z0,Z1,y,o);sl(e0-.15,e1+.15,Z0,z0-.15,y,o);sl(e0-.15,e1+.15,z1,Z1,y,o);
  FLOORS.push({x0:xs,x1:e0-.15,z0:pz-5.6,z1:pz+5.6,y},{x0:e1+.15,x1:px+16.35,z0:pz-5.6,z1:pz+5.6,y},{x0:e0-.15,x1:e1+.15,z0:z1,z1:pz+5.6,y});
  [-10,0,10].forEach(x=>box(px+x,y+2.9,pz-2,.8,.06,.8,0xfffbe0,false));
  for(let r=0;r<4;r++){const x0=xs+r*rw,x1=x0+rw,xc=(x0+x1)/2,zr=pz+1.5;
   box(x1,y,pz+3.55,.15,3,4.1,0xf2efe8,true);
   box((x0+xc-.8)/2,y,zr,xc-.8-x0,3,.15,0xf2efe8,true);box((xc+.8+x1)/2,y,zr,x1-xc-.8,3,.15,0xf2efe8,true);box(xc,y+2.3,zr,1.6,.7,.15,0xf2efe8,false);
   IA(box(x0+1.5,y,pz+3.9,2.2,.45,3,0x6b4a2b,true),'hbed');box(x0+1.5,y+.45,pz+3.9,2,.2,2.8,0xf4f4f4,false);box(x0+1.5,y+.65,pz+5,1.6,.12,.5,0xffffff,false);
   box(x0+3.4,y,pz+5.2,.6,.5,.6,0x6b4a2b,false);box(xc,y+2.9,pz+3.5,.8,.06,.8,0xfffbe0,false)}}
 sl(W,E,Z0,Z1,Y5);box(px,Y5,pz,w+.3,.3,d+.3,0x555555,false);
 addElev(px,pz,5,{e0,e1,z0,z1,ys:Y,H:Y5-.3-G,bx:e0-.5})}
function shopIn(key,cx,cz,fz,w,d,zf){
 const S=SHOPS[key],L=d/2-.4,F=(x,y,l,sx,sy,sz,c,s)=>box(cx+x,G+.03+y,cz+fz*l,sx,sy,sz,c,s),big=w>20,bar=key==='bar'||key==='burger'||key==='pizza'||key==='ice',cl=()=>pick([0xd9473a,0x3a9ad9,0xe0b020,0x4aa35a,0xe8e8e8,0xff8a3a]);
 const gym=key==='gym';F(0,0,-L+3.3,bar?9:5,1,.9,gym?0x2b2f33:0x8b5a2b,true);F(0,1,-L+3.3,bar?9.2:5.2,.06,1.05,gym?0xf39c12:0x2f2f2f,false);if(!gym)F(1.5,1.06,-L+3.3,.6,.35,.45,0x222222,false);
 if(gym)gymIn(F,L,w,cl); // gimnasio: sin estanterías (gymIn gasta los mismos números aleatorios que una tienda, para no alterar el mapa)
 else{F(0,0,-L+.35,w-3,2.4,.5,0xd7dbde,true);for(let r=0;r<4;r++)for(let x=-(w-4)/2;x<=(w-4)/2;x+=1.2)F(x,.35+r*.55,-L+.85,.9,.4,.3,cl(),false)}
 const wk=person(0x2255aa),wz=cz+fz*(-L+1.8);wk.position.set(cx,G+.03,wz);wk.rotation.y=fz>0?0:Math.PI;scene.add(wk);
 WORKERS.push({x:cx,z:wz,key,name:S.worker,sp:{x:cx,z:zf+fz*4.8}});
 F(0,1.5,-L+.02,big?10:6,.5,.04,parseInt(S.col.slice(1),16),false);
 if(key==='dealer'){[-12,-5,5,12].forEach((x,i)=>{const c=carMesh(['hatch','sport','van','moto'][i],[0x3a7bd5,0xd11f1f,0xeeeeee,0xffcc00][i]),zc=cz+fz*1.5;F(x,0,1.5,3.2,.1,5.8,0xe4e4e4,false);
  c.position.set(cx+x,G+.13,zc);c.rotation.y=fz>0?0:Math.PI;scene.add(c);colliders.push({x0:cx+x-1.3,x1:cx+x+1.3,z0:zc-2.8,z1:zc+2.8,y1:2,on:true})});
  F(-15,0,-L+1.5,2.4,.75,1.2,0x8b5a2b,true);F(-15,.75,-L+1.5,.8,.5,.06,0x111111,false)}
 else if(bar){[-3.5,-1.75,0,1.75,3.5].forEach(x=>{IA(F(x,0,-L+4.5,.4,.65,.4,0xaa3333,false),'sit')});
  [[-5,1],[5,1],[-5,4],[5,4]].forEach(a=>{F(a[0],0,a[1],1.2,.75,1.2,0x6b4a2b,true);[[1,0],[-1,0],[0,1],[0,-1]].forEach(o=>IA(F(a[0]+o[0]*1,0,a[1]+o[1]*1,.45,.5,.45,0x3a2a1a,false),'sit'))})}
 else if(key==='furn'){[[-5,0x3b6ea5],[5,0xa53b3b]].forEach(a=>{IA(F(a[0],0,1,3,.45,1.2,a[1],true),'sit');F(a[0],.45,1.6,3,.6,.3,a[1],false);F(a[0],0,-1,1.4,.4,.8,0x6b4a2b,true);
   IA(F(a[0],0,4.6,2,.4,3.2,0xdddddd,true),'bed');F(a[0],.4,4.6,1.8,.25,3,0xf4f4f4,false);F(a[0],.65,5.6,1.6,.15,.4,0xffffff,false)});F(0,0,5,1.6,2.2,.8,0x7a5a3a,true)}
 else if(key==='garage'){F(-4,0,1.5,3.6,.1,6,0x4a4f55,false);const c=carMesh('hatch',0xc0392b),zc=cz+fz*1.5;c.position.set(cx-4,G+.13,zc);c.rotation.y=fz>0?0:Math.PI;scene.add(c);colliders.push({x0:cx-4.9,x1:cx-3.1,z0:zc-2.2,z1:zc+2.2,y1:2,on:true});
  F(-4,.1,-2.2,3.6,.9,.15,0x6a6f75,false);F(-4,.1,5.2,3.6,.9,.15,0x6a6f75,false);
  F(5.5,0,1,1.4,.9,.7,0xc0392b,true);F(5.5,.9,1,1.5,.08,.8,0x333333,false);F(5.5,.45,.62,.9,.05,.05,0xdddddd,false);
  [0,1,2].forEach(i=>F(5.6,i*.3,4,.9,.3,.9,0x151515,false));[0,1].forEach(i=>F(6.6,i*.3,3.2,.9,.3,.9,0x151515,false));
  PALETTE_GARAGE.forEach((a,i)=>{F(-6.6+i*1.2,2.5,-L+.4,.5,.4,.1,a[1],false);F(6.2-i*.6,0,-L+3.2,.4,.45,.4,a[1],false)});
  F(-w/2+.6,0,-L+1.5,.8,1.6,.9,0x7a7f85,true)}
 else if(key==='estate'){[-5,5].forEach(x=>{F(x,0,1.5,2.4,.8,1.2,0x9c7a55,true);F(x,.8,1.5,.8,.5,.06,0x111111,false);F(x,0,3,.5,.5,.5,0x333333,false)});F(-6.5,1.2,L-.1,2.5,1.6,.05,0xdfe6ee,false);F(-6.5,1.2,L-.12,2,1.2,.05,0x4a8a5a,false)}
 else if(key==='shop'){[-5,5].forEach(x=>{F(x,1.5,1,2.4,.05,.05,0x888888,false);F(x-.9,0,1,.05,1.5,.05,0x888888,false);F(x+.9,0,1,.05,1.5,.05,0x888888,false);for(let i=-2;i<=2;i++)F(x+i*.4,.8,1,.25,.7,.1,cl(),false)});
  [-2.5,2.5].forEach(x=>{const m=person(0xdddddd);m.position.set(cx+x,G+.03,cz+fz*4);scene.add(m)})}
 else if(!gym)(big?[-14,-10,-6,6,10,14]:[-6,-3.6,3.6,6]).forEach(x=>{F(x,0,.8,1,.1,6,0x999999,false);for(let r=0;r<3;r++)for(let q=0;q<2;q++){const m=F(x,.1+r*.6,-.7+q*3.1,.95,.4,2.8,cl(),true);if(r===1)IA(m,'shelf',key)}});
}
// Interior del gimnasio (local de 16x16 que antes era una inmobiliaria). Coordenadas como en shopIn: x a lo ancho, l hacia la puerta (l=-L es la pared del fondo).
// Mostrador de recepción y monitora: los pone shopIn. Aquí: cintas (oeste), bancos de pesas (centro), sacos (este), tablón del monitor y espejo.
// Las actividades están en «Gimnasio, parte 2». OJO: no usar rnd()/pick(). Al principio se gastan en vacío los mismos cl() que una tienda normal
// (estantería del fondo + pasillos de estanterías) para que lo que se construye después no cambie de sitio.
function gymIn(F,L,w,cl){const mt=0x2b2f33,ch=0xb0b6bb,ac=0xf39c12,
 cyl=(r,h,x,y,l,c,rz)=>{const m=F(x,y,l,.01,.01,.01,c,false);m.geometry.dispose();m.geometry=new THREE.CylinderGeometry(r,r,h,16);m.position.y=G+.03+y;if(rz)m.rotation.z=rz;return m};
 for(let r=0;r<4;r++)for(let x=-(w-4)/2;x<=(w-4)/2;x+=1.2)cl();for(let i=0;i<(w>20?6:4)*3*2;i++)cl();
 F(0,0,0,w-.8,.02,2*L,0x3a3f45,false);
 for(const l of[-3.6,-1.2,1.2]){F(-6.4,0,l,2,.22,.85,mt,false);F(-6.4,.22,l,1.7,.02,.55,0x111111,false);
  for(const s of[-1,1])F(-7.35,.22,l+s*.38,.06,1.05,.06,ch,false);IA(F(-7.35,1.27,l,.12,.28,.8,0x1e88e5,false),'gymrun')}
 for(const x of[-2.6,2.2]){const l=3.6;F(x,.38,l,.45,.08,1.4,0x1b1b1b,false);F(x,0,l-.4,.08,.38,.08,ch,false);F(x,0,l+.4,.08,.38,.08,ch,false);
  for(const s of[-1,1])F(x+s*.6,0,l-.65,.07,1.15,.07,ch,false);IA(cyl(.03,2,x,1.12,l-.65,ch,Math.PI/2),'gymlift');for(const s of[-1,1])cyl(.24,.1,x+s*.82,1.12,l-.65,0x111111,Math.PI/2)}
 F(5.6,0,-1.2,3.6,.03,5.6,0xc0392b,false);
 for(const l of[-3,.6]){const x=5.8;F(x,2.05,l,.04,2.1,.04,0x888888,false);const b=IA(cyl(.26,1.2,x,1.45,l,0x8e1b1b),'gymbox');
  colliders.push({x0:b.position.x-.26,x1:b.position.x+.26,z0:b.position.z-.26,z1:b.position.z+.26,y0:G+.9,y1:G+2.1,on:true})}
 F(7.55,1.1,3,.05,1.2,1.8,0xffffff,false);F(7.52,1.65,3,.03,.12,1.4,ac,false);IA(F(7.25,.8,3,.3,.3,.5,ac,false),'gymtips');
 F(-7.55,.4,4,.04,2,3,0xcfe8f5,false)}
// Interior de tienda para los locales comerciales: quita los muebles de casa y monta una tienda
const LTYPES={super:{n:'SUPERMERCADO',i:'🛒',c:'#27ae60',m:1.15,fl:0xe9e9e4,d:'Pasillos con productos, neveras y caja.'},
 bar:{n:'BAR',i:'🍺',c:'#a0522d',m:1.1,fl:0x8a6a48,d:'Barra con taburetes, botellas, mesas y gramola.'},
 ropa:{n:'BOUTIQUE',i:'👕',c:'#8a2be2',m:1,fl:0xdcd4e4,d:'Percheros, maniquíes, probadores y espejo.'},
 muebles:{n:'MUEBLES',i:'🛋️',c:'#2980b9',m:1.2,fl:0xcdb892,d:'Sofás, camas, mesas y armarios de exposición.'},
 pan:{n:'PANADERÍA',i:'🥖',c:'#d68910',m:.95,fl:0xe8d3a8,d:'Horno, vitrina de pan y mesitas.'}};
// Interior del local comercial: vacío al comprarlo; al elegir negocio se monta según el tipo (se reconstruye al mejorar)
function localIn(h,t){const q=h.inner;if(!q)return;
 const rm=(ms,cs,is)=>{ms.forEach(m=>{scene.remove(m);if(m.geometry)m.geometry.dispose()});const C=new Set(cs),I=new Set(is);
  for(let i=colliders.length-1;i>=0;i--)if(C.has(colliders[i]))colliders.splice(i,1);for(let i=INTERACTS.length-1;i>=0;i--)if(I.has(INTERACTS[i])||I.has(INTERACTS[i].m))INTERACTS.splice(i,1)};
 if(!h.lcl)rm(q.meshes,q.cols,q.meshes);else rm(h.lcl.m,h.lcl.c,h.lcl.i);
 const s0=scene.children.length,c0=colliders.length,i0=INTERACTS.length,T=LTYPES[t]||null,lv=h.lv||1;
 const cx=q.cx,cz=q.cz,fz=q.fz,w=q.w,L=q.d/2-.4,F=(x,y,l,sx,sy,sz,c,s)=>box(cx+x,G+.03+y,cz+fz*l,sx,sy,sz,c,s),cl=()=>pick([0xd9473a,0x3a9ad9,0xe0b020,0x4aa35a,0xe8e8e8,0xff8a3a]),
 P=(x,l,col)=>{const p=person(col);p.position.set(cx+x,G+.03,cz+fz*l);p.rotation.y=fz>0?0:Math.PI;scene.add(p);return p},
 backRows=(c0,n,fn)=>{for(let r=0;r<n;r++)for(let x=-(w-4)/2;x<=(w-4)/2;x+=1.2)F(x,.35+r*.55,-L+.85,.9,.4,.3,fn(),false)},
 till=(x,l)=>{F(x,1.06,l,.6,.35,.45,0x222222,false);F(x-2.4,1.06,l,.5,.3,.4,0xffffff,false)};
 F(0,0,0,w-.8,.02,q.d-.8,T?T.fl:0xe6e1d6,false);
 if(T){let wx=0,wl=-L+1.9;
  if(t==='super'){F(0,0,-L+.35,w-3,2.4,.5,0xcfe6f2,true);backRows(0,4,cl);F(0,2.55,-L+.02,6,.4,.04,0x27ae60,false);
   F(0,0,-L+3.3,5,1,.9,0x8b5a2b,true);F(0,1,-L+3.3,5.2,.06,1.05,0x2f2f2f,false);till(1.5,-L+3.3);
   [-6,-3.6,3.6,6].forEach(x=>{F(x,0,.8,1,.1,6,0x999999,false);for(let r=0;r<3;r++)for(let k=0;k<2;k++){const m=F(x,.1+r*.6,-.7+k*3.1,.95,.4,2.8,cl(),true)}});
   [-2.2,-1.4].forEach(x=>F(x,0,L-.8,.7,.4,.5,0xd9473a,false));F(2.2,0,L-.8,.9,.8,.6,0x999999,false)}
  else if(t==='bar'){wl=-L+1.8;F(0,0,-L+.35,w-3,2.4,.5,0x3a2a1a,true);backRows(0,3,()=>pick([0x2e8b57,0xc0392b,0xe0b020,0x8e44ad,0xdcdcdc]));
   F(0,2.55,-L+.02,7,.2,.04,0xff4d6d,false);F(-5.5,1.6,-L+.05,1.6,.9,.05,0x111111,false);F(5.5,1.6,-L+.05,1.6,.9,.05,0x111111,false);
   F(0,0,-L+3.3,9,1.05,.9,0x5a3a1e,true);F(0,1.05,-L+3.3,9.3,.07,1.1,0x2a1a0e,false);till(1.5,-L+3.3);
   [-3.5,-1.75,0,1.75,3.5].forEach(x=>IA(F(x,0,-L+4.5,.4,.65,.4,0xaa3333,false),'sit'));
   [[-5.5,.8],[5.5,.8],[-5.5,2.8],[5.5,2.8]].forEach(a=>{F(a[0],0,a[1],1.1,.75,1.1,0x6b4a2b,true);[[1,0],[-1,0]].forEach(o=>IA(F(a[0]+o[0]*.95,0,a[1],.45,.5,.45,0x3a2a1a,false),'sit'))});
   F(w/2-1.2,0,L-1,.9,1.5,.5,0x8e44ad,true);F(w/2-1.2,.9,L-1.27,.6,.4,.05,0xffe066,false)}
  else if(t==='ropa'){wx=0;wl=-L+1.3;F(0,0,-L+.35,w-3,2.4,.5,0xf0e8f5,true);backRows(0,4,cl);F(0,2.55,-L+.02,6,.4,.04,0x8a2be2,false);
   F(0,0,-L+2.4,4,1,.9,0xf2f2f2,true);till(.8,-L+2.4);
   [-3.5,3.5].forEach(x=>[.5,2.8].forEach(l=>{F(x,1.5,l,2.4,.05,.05,0x888888,false);F(x-1.1,0,l,.05,1.5,.05,0x888888,false);F(x+1.1,0,l,.05,1.5,.05,0x888888,false);for(let i=-2;i<=2;i++)F(x+i*.45,.8,l,.25,.7,.1,cl(),false)}));
   [-2,2].forEach(x=>P(x,1.5,0xdddddd));
   [-1.5,1.5].forEach(l=>{F(-6.4,0,l,1.5,2.3,1.5,0xb48ad8,true);F(-5.65,0,l,.06,2.1,1.3,0xe9d5f7,false)});F(w/2-1,.3,L-2.5,.1,1.8,1.2,0xdfe6ee,false)}
  else if(t==='muebles'){wx=w/2-1.5;wl=L-2.6;
   [[-5,0x3b6ea5],[5,0xa53b3b]].forEach(a=>{IA(F(a[0],0,1.6,3,.45,1.2,a[1],true),'sit');F(a[0],.45,2.2,3,.6,.3,a[1],false);F(a[0],0,-.2,1.4,.4,.8,0x6b4a2b,true);
    IA(F(a[0],0,-L+2,2,.4,3.2,0xdddddd,true),'bed');F(a[0],.4,-L+2,1.8,.25,3,0xf4f4f4,false);F(a[0],.65,-L+3,1.6,.15,.4,0xffffff,false)});
   F(0,0,-L+.6,3,2.2,.8,0x7a5a3a,true);F(-2.4,0,-L+.6,.3,1.6,.3,0xfffbe0,false);F(2.4,0,-L+.6,.3,1.6,.3,0xfffbe0,false);
   F(0,0,.2,2.4,.8,1.4,0x7a5a3a,true);[[-1.6,.2],[1.6,.2]].forEach(a=>IA(F(a[0],0,a[1],.5,.5,.5,0x3a2a1a,false),'sit'));F(0,.02,.2,3.6,.02,2.4,0xc0584a,false);
   F(wx,0,L-1.2,2,1,.8,0x8b5a2b,true);till(wx+1,L-1.2)}
  else if(t==='pan'){wl=-L+2.3;F(0,0,-L+.7,5,2,1.2,0x9c4a2b,true);F(0,.5,-L+1.32,3,.8,.05,0x1a1a1a,false);F(0,.6,-L+1.35,2.6,.5,.03,0xff9933,false);
   [-5.5,5.5].forEach(x=>{F(x,0,-L+.5,3.5,2.2,.7,0xc08a4a,true);for(let r=0;r<4;r++)for(let i=-1;i<=1;i++)F(x+i*1.1,.3+r*.5,-L+.9,.8,.3,.3,pick([0xc98a4b,0xe0b070,0xa8672b]),false)});
   F(0,0,-L+3.6,5.5,1,.9,0xcfe8f0,true);for(let i=-2;i<=2;i++)F(i*1,1,-L+3.6,.7,.25,.5,pick([0xc98a4b,0xe0b070,0xa8672b]),false);F(0,1.3,-L+3.6,5.7,.05,1,0xeeeeee,false);till(2,-L+3.6);
   [[-5,.8],[5,.8],[-5,2.9],[5,2.9]].forEach(a=>{F(a[0],0,a[1],.9,.75,.9,0xe8d3a8,true);IA(F(a[0]-.9,0,a[1],.4,.5,.4,0x8a5a2b,false),'sit');IA(F(a[0]+.9,0,a[1],.4,.5,.4,0x8a5a2b,false),'sit')})}
  P(wx,wl,0x2255aa);
  const sp=[[-2,1],[2,2.5],[-2,3.3],[2,0],[-2,-.8]];for(let i=0;i<Math.min(lv+1,5);i++)P(sp[i][0],Math.min(sp[i][1],L-.8),pick([0xd9473a,0x3a9ad9,0xe0b020,0x4aa35a,0x888888]));
  sign(T.n,cx,G+3,cz+fz*q.d/2,5,fz,T.c)}
 h.lcl={m:scene.children.slice(s0),c:colliders.slice(c0),i:INTERACTS.slice(i0)}}
const PALETTE_GARAGE=[['Rojo',0xc0392b],['Azul',0x2980b9],['Verde',0x27ae60],['Amarillo',0xf1c40f],['Naranja',0xe67e22],['Blanco',0xecf0f1],['Negro',0x1c1c1c],['Gris',0x7f8c8d],['Rosa',0xe84393],['Morado',0x8e44ad],['Turquesa',0x1abc9c],['Marrón',0x6d4c41]],PAINT_PRICE={hatch:150,sport:300,van:250,moto:80,bici:20,patinete:15};
function facade(cx,cz,w,d,y0,fl,solid){const t=pick(TEX).clone();t.needsUpdate=true;t.repeat.set(Math.max(1,Math.round(w/4)),fl);
 box(cx,y0,cz,w,fl*3,d,new THREE.MeshLambertMaterial({map:t}),solid);box(cx,y0+fl*3,cz,w+.3,.3,d+.3,0x555555,false)}
function pyramid(cx,cz,w,y,col){HB.push({x0:cx-w/2-.4,x1:cx+w/2+.4,z0:cz-w/2-.4,z1:cz+w/2+.4,y0:y,y1:y+2.4,nl:1});const R=(w+.8)/Math.SQRT2,g=new THREE.ConeGeometry(R,2.4,4);g.rotateY(Math.PI/4);
 const m=new THREE.Mesh(g,mat(col));m.position.set(cx,y+1.2,cz);m.userData.st=1;scene.add(m)}
function house(px,pz,fz){
 const garden=rnd()<.4,w=15.6,d=garden?10:15.6,cz=garden?pz-fz*(15.6-10)/2:pz,wc=pick([0xe8dcc4,0xd9b99b,0xc8d4c0,0xe3c9c9,0xcfd8e3]);
 const dr=hollow(px,cz,w,d,3.2,fz,wc,2.4,0xb89a78);dr.leaf.material=mat(pick([0x6b4a2b,0x2a5a8a,0x7a2a2a]));
 dr.house=true;const L=d/2-.4,F=(x,y,l,sx,sy,sz,c,s)=>box(px+x,G+.03+y,cz+fz*l,sx,sy,sz,c,s);
 const R0={s:scene.children.length,c:colliders.length,i:INTERACTS.length};houseIn(F,L);const RIN={meshes:scene.children.slice(R0.s),cols:colliders.slice(R0.c),cx:px,cz,fz,w,d};if(0){F(-3.4,0,-L+4.2,8,2.8,.2,0xf2efe8,true);F(-4.8,0,-L+1.8,2,.6,3.2,0x3b6ea5,true);F(-4.8,.6,-L+.6,1.2,.15,.6,0xffffff,false);F(-1.5,0,-L+.8,2.4,2.2,1,0x7a5a3a,true);
 F(6.6,0,-L+3,1,.95,5,0x9aa0a6,true);F(4.6,0,-L+.7,1,2,.9,0xf4f4f4,true);F(3.5,0,-L+3.8,2.4,.8,1.4,0x8b5a2b,true);F(1.7,0,-L+3.8,.7,.5,.7,0x6b4a2b,false);F(3.5,0,-L+5.2,.7,.5,.7,0x6b4a2b,false);
 F(-5.5,0,L-2.2,3,.8,1.2,0xa53b3b,true);F(5.6,0,L-1.1,2.4,.6,1.1,0xffffff,true);F(3.9,0,L-.7,.5,.5,.6,0xffffff,false);
 }let top=G+3.45;
 if(rnd()<.5){facade(px,cz,w,d,top,1,false);top+=3.3}
 pyramid(px,cz,w,top,pick([0x8a3b2b,0x6a4a3a,0x555a60]));
 if(garden){const ez=pz+fz*8.2,zf=cz+fz*5,len=Math.abs(ez-zf),mz=(ez+zf)/2;
  box(px,G+.01,mz,15.6,.03,len,0x5c8a4a,false);[-1,1].forEach(k=>box(px+k*7.9,G,mz,.2,1,len,0xb59a7a,true));
  const sw2=(15.8-2.4)/2;box(px-1.2-sw2/2,G,ez,sw2,1,.2,0xb59a7a,true);box(px+1.2+sw2/2,G,ez,sw2,1,.2,0xb59a7a,true)}
 HOUSES.push({id:HOUSES.length,x:Math.round(px),z:Math.round(dr.z),door:dr,owned:false,price:12000,inner:RIN})}
const INTERACTS=[];
function IA(m,type,extra){m.userData.st=0;INTERACTS.push({x:m.position.x,y:m.position.y,z:m.position.z,m,type,extra,use:0,on:false});return m}
// PITS: huecos en el terreno (parking, metro). Con «top», el hueco solo existe por debajo de esa altura (por encima se camina por la superficie normal)
const FLOORS=[],RAMPS=[],PITS=[];let grounded=true;function inPit(x,z,y){return PITS.some(p=>x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&(p.top===undefined||(y!==undefined&&y<p.top)))}
function groundH(x,z,cur){let b=inPit(x,z,cur)?-99:heightAt(x,z);{const dk=deckY(x,z);if(dk!==null&&dk<=cur+.6&&dk>b)b=dk}for(const f of FLOORS)if(x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1&&f.y<=cur+.6&&f.y>b)b=f.y;
 for(const r of RAMPS)if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1){const h=r.y0+(r.ax?((r.up>0?x-r.x0:r.x1-x)/(r.x1-r.x0)):((r.up>0?z-r.z0:r.z1-z)/(r.z1-r.z0)))*(r.rise||3);if(h<=cur+.6&&h>b)b=h}return b}
function aptLevel(px,pz,m){const b=m?3*m:G+.03,B=(x,y,z,sx,sy,sz,c,s)=>box(px+x,b+y,pz+z,sx,sy,sz,c,s),wc=0xf2efe8;
 if(m===0){B(-3,0,5,3,.5,.8,0x6b4a2b,true);B(-4,0,-3,3,1,.9,0x8b5a2b,true);B(-7,0,6.8,.6,.8,.6,0x8a4a2a,false);B(-7,.8,6.8,.7,.8,.7,0x2a8a3a,false);B(-7.4,1,0,.2,.5,3,0x8a8f95,false);B(-1,0,-5.5,6,.02,2,0xaa5555,false);B(-1,2.55,0,.8,.06,.8,0xfffbe0,false);return}
 B(-5.1,0,-3,5,2.6,.15,wc,true);IA(B(-5,0,-5.5,2.2,.4,3.2,0x6b4a2b,true),'bed');B(-5,.4,-5.5,2,.25,3.2,0xf4f4f4,false);B(-5,.65,-6.8,1.6,.15,.5,0xffffff,false);IA(B(-7.1,0,-1.5,.8,2.2,2.4,0x7a5a3a,true),'wardrobe');
 IA(B(1.5,0,-7.2,5.6,.95,.7,0xe8e8e8,true),'stove');B(1.5,.95,-7.2,5.6,.05,.75,0x3a3a3a,false);IA(B(-1.8,0,-7.2,.9,1.9,.8,0xf4f4f4,true),'fridge');
 B(1.5,0,-4.8,2.2,.75,1.2,0x8b5a2b,true);IA(B(.1,0,-4.8,.5,.5,.5,0x6b4a2b,false),'sit');IA(B(2.9,0,-4.8,.5,.5,.5,0x6b4a2b,false),'sit');
 IA(B(-4,0,4.2,3,.45,1.1,0x3b6ea5,true),'sit');B(-4,.45,4.8,3,.6,.3,0x3b6ea5,false);B(-4,0,2.4,1.4,.4,.8,0x6b4a2b,true);B(-4,0,-1.8,1.8,.45,.5,0x333333,true);IA(B(-4,.45,-1.8,1.4,.8,.08,0x050505,false),'tv');B(-4,0,3.2,3.4,.02,3.4,0x5a7aa0,false);
 B(3.6,0,6.4,.15,2.6,2.4,wc,true);B(4.4,0,4,1.6,2.6,.15,wc,true);IA(B(4.5,0,7.2,.5,.4,.7,0xffffff,true),'toilet');IA(B(4.9,0,6.2,.4,.85,.6,0xffffff,true),'sink');
 B(-2,2.55,-1,.8,.06,.8,0xfffbe0,false);B(-2,2.55,3,.8,.06,.8,0xfffbe0,false)}
const ELEV=[];
function elPieces(px,pz,sx0){const a=px-7.6,e0=px+.5,e1=px+2.7,z0=pz+.4,z1=pz+2.6,Z0=pz-7.6,Z1=pz+7.6;
 return [[a,e0,Z0,Z1],[e1,sx0,Z0,Z1],[e0,e1,Z0,z0],[e0,e1,z1,Z1]].map(r=>({x0:r[0],x1:r[1],z0:r[2],z1:r[3]}))}
function addElev(px,pz,fl,o){o=o||{};const e0=o.e0!=null?o.e0:px+.5,e1=o.e1!=null?o.e1:px+2.7,z0=o.z0!=null?o.z0:pz+.4,z1=o.z1!=null?o.z1:pz+2.6,cx=(e0+e1)/2,cz=(z0+z1)/2,ys=o.ys||Array.from({length:fl},(_,m)=>3*m),H=o.H||3*fl,bx=o.bx!=null?o.bx:e1+.5,id=ELEV.length,dr=[],c=0x9aa0a6;
 box(e0-.075,G,cz,.15,H,z1-z0,c,true);box(e1+.075,G,cz,.15,H,z1-z0,c,true);box(cx,G,z0-.075,e1-e0+.3,H,.15,c,true);
 const cab=new THREE.Group();scene.add(cab);
 const pt=(y,h,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(e1-e0,h,z1-z0),mat(col));m.position.set(cx,y,cz);cab.add(m)};
 pt(G+.06,.12,0x555a60);pt(G+2.4,.1,0xf4f0d8);
 const f={x0:e0+.05,x1:e1-.05,z0:z0+.05,z1:z1,y:0};FLOORS.push(f);
 for(let m=0;m<fl;m++){const base=m?ys[m]:G+.03,col={x0:e0,x1:e1,z0:z1-.1,z1:z1+.1,y0:ys[m],y1:ys[m]+2.6,on:true};colliders.push(col);
  const d=box(cx,base,z1,e1-e0,2.5,.1,0xb8bec4,false);d.userData.st=0;dr.push({c:col,m:d});
  if(o.ys)box(bx,base,z1+.1,.3,1.4,.2,0x9aa0a6,false);
  IA(box(bx,base+1.1,z1+.2,.3,.3,.1,0xe0b020,false),'elev',{id,m})}
 ELEV.push({id,fl,ys,y:0,tg:0,mv:1,cab,f,dr,e0,e1,z0,z1})}
function apt(px,pz,fz,tall){
 const fl=tall?6+(rnd()*4|0):3+(rnd()*3|0),w=16,d=16,H=fl*3,t=.4,dw=2.8,sw=(w-dw)/2,zf=pz+fz*8,zb=pz-fz*8,base=pick(TEX);
 const mk=(ww,hh)=>{const x=base.clone();x.needsUpdate=true;x.repeat.set(Math.max(1,Math.round(ww/4)),Math.max(1,Math.round(hh/3)));return new THREE.MeshLambertMaterial({map:x})};
 box(px,G,zb,w,H,t,mk(w,H),true);box(px-w/2+t/2,G,pz,t,H,d,mk(d,H),true);box(px+w/2-t/2,G,pz,t,H,d,mk(d,H),true);
 box(px-dw/2-sw/2,G,zf,sw,H,t,mk(sw,H),true);box(px+dw/2+sw/2,G,zf,sw,H,t,mk(sw,H),true);box(px,G+2.5,zf,dw,H-2.5,t,mk(dw,H-2.5),false);
 box(px,G+H,pz,w+.3,.3,d+.3,0x555555,false);box(px,G,pz,w,.03,d,0xcfc4b0,false);
 const pv=new THREE.Group();pv.position.set(px-dw/2,G,zf);scene.add(pv);const lf=box(dw/2,0,0,dw,2.5,.12,0x3a3a44,false,pv);
 const col={x0:px-dw/2,x1:px+dw/2,z0:zf-.15,z1:zf+.15,y1:2.7,on:true};colliders.push(col);DOORS.push({pv,col,x:px,z:zf,fz,leaf:lf,open:false,ang:0,apt:true,fl});
 ROOMS.push({x0:px-7.6,x1:px+7.6,z0:pz-7.6,z1:pz+7.6,h:G+H,fl:1});BLD.push([px-8,pz-8,16,16,'#7b8590']);
 const sx0=px+w/2-t-2.4,sx1=px+w/2-t,a=Math.atan2(3,10),lw=sx0-(px-7.6);
 box(sx0-.075,G,pz,.15,H,10,0xd8d4cc,true);
 for(let k=0;k<fl-1;k++){const up=k%2?-1:1,r=box((sx0+sx1)/2,0,pz,2.4,.25,Math.hypot(10,3),0x8a8a90,false);r.position.y=3*k+1.5-.125;r.rotation.x=up>0?-a:a;RAMPS.push({x0:sx0,x1:sx1,z0:pz-5,z1:pz+5,y0:3*k,up})}
 for(let m=1;m<=fl;m++){const y=3*m;if(m<fl)elPieces(px,pz,sx0).forEach(r=>box((r.x0+r.x1)/2,y-.3,(r.z0+r.z1)/2,r.x1-r.x0,.3,r.z1-r.z0,0xcfc8bc,false));else box(px-7.6+lw/2,y-.3,pz,lw,.3,15.2,0xcfc8bc,false);
  if(m<fl){box((sx0+sx1)/2,y-.3,pz-6.3,2.4,.3,2.6,0xcfc8bc,false);box((sx0+sx1)/2,y-.3,pz+6.3,2.4,.3,2.6,0xcfc8bc,false);
   FLOORS.push(...elPieces(px,pz,sx0).map(r=>Object.assign(r,{y})),{x0:sx0,x1:sx1,z0:pz-7.6,z1:pz-5,y},{x0:sx0,x1:sx1,z0:pz+5,z1:pz+7.6,y})}
  else box((sx0+sx1)/2,y-.3,pz,2.4,.3,15.2,0xcfc8bc,false)}
 for(let m=0;m<fl;m++)aptLevel(px,pz,m);addElev(px,pz,fl)}
function shop(key,px,pz,fz,w,dd){const S=SHOPS[key],d=dd||16,big=w>20,dw=big?6:3.2;
 const dr=hollow(px,pz,w,d,4.2,fz,S.wall,dw,S.floor,key==='hotel'?[px+13.75,px+16.35,pz-5.6,pz-3.25]:0),zf=pz+fz*d/2;dr.shop=key;
 sign(S.n,px,G+3.35,zf,big?10:6,fz,S.c);if(key==='hotel'||key==='town'||key==='bank')civicIn(key,px,pz,fz,w,d,zf);else shopIn(key,px,pz,fz,w,d,zf);
 PLACES.push({x:px,z:zf+fz*3,key,l:S.L,c:S.col});
 if(!big)facade(px,pz,w,d,G+4.45,1+(rnd()*2|0),false);if(key==='hotel')hotelUp(px,pz,w,d);if(key==='town'){facade(px,pz,w,d,G+4.45,1,false);facade(px,pz,6,6,G+7.75,3,false);pyramid(px,pz,6,G+17.05,0x555a60)}}
const SHOPS={
super:{n:'SUPERMERCADO',c:'#16803c',wall:0xe9e4d4,floor:0xd8d8d0,L:'S',col:'#1c9c4c',worker:'Cajera',job:['Reponedor',150],items:[['Manzanas',3],['Pan',2],['Agua',1],['Pizza',9],['Leche',2],['Comida para mascotas',6]]},
dealer:{n:'CONCESIONARIO',c:'#b3261e',wall:0xdde3e8,floor:0xbfc5cc,L:'C',col:'#e03a30',worker:'Vendedor',job:['Ayudante de ventas',400],cars:[['hatch',2800,0x3a7bd5],['van',5200,0xeeeeee],['sport',9500,0xd11f1f],['moto',1800,0xe67e22],['bici',250,0x2ecc71],['patinete',120,0xe74c3c]]},
food:{n:'ALIMENTACIÓN',c:'#d97a1a',wall:0xf0d9a8,floor:0xd8c9a8,L:'A',col:'#e8891e',worker:'Tendero',job:['Dependiente',130],items:[['Bocadillo',4],['Fruta',3],['Refresco',2],['Chocolate',2]]},
furn:{n:'MUEBLES',c:'#7a4a2a',wall:0xe3d3c0,floor:0xb89a78,L:'M',col:'#9b6a3a',worker:'Vendedora',job:['Montador',250],items:[['Sofá',450],['Cama',380],['Mesa',220],['Lámpara',60],['Armario',300],['Sillón',200],['Mesa de centro',90],['Estantería',160],['Mueble de TV',350],['Alfombra',70],['Planta grande',40],['Nevera',420],['Cocina',380],['Encimera',260],['Taburete',45],['Mostrador',350],['Caja registradora',280],['Estantería de tienda',220],['Góndola',300],['Vitrina',400],['Nevera expositora',550],['Barra de bar',480],['Perchero',120],['Cartel luminoso',150]]},
shop:{n:'MODA',c:'#8a2be2',wall:0xe8dff0,floor:0xcfc8d8,L:'T',col:'#a84be8',worker:'Dependienta',job:['Dependiente',140],items:[['Camiseta',25],['Camisa',45],['Chaqueta',95],['Vaqueros',60],['Pantalón corto',30],['Zapatillas',80],['Gorra',15],['Sombrero',30],['Gafas de sol',20],['Bufanda',18],['Mochila',40],['Reloj',35]]},
bar:{n:'BAR',c:'#b8860b',wall:0xe8c9a0,floor:0x8a6a4a,L:'B',col:'#e0b020',worker:'Camarero',job:['Camarero',120],items:[['Café',2],['Cerveza',3],['Tapa',5]]},
burger:{n:'HAMBURGUESERÍA',c:'#c62828',wall:0xfff1c1,floor:0xd9d2c5,L:'🍔',col:'#ffb300',worker:'Cocinero',job:['Cocinero de comida rápida',120],items:[['Hamburguesa',6],['Hamburguesa doble',9],['Patatas fritas',3],['Pollo frito',7],['Nuggets',5],['Perrito caliente',4],['Refresco de cola',2],['Batido',4],['Menú completo',12]]},
pizza:{n:'PIZZERÍA',c:'#2e7d32',wall:0xfff3e0,floor:0xcdbfa6,L:'🍕',col:'#e53935',worker:'Pizzero',job:['Pizzero',125],items:[['Pizza margarita',8],['Pizza pepperoni',10],['Pizza cuatro quesos',11],['Pizza hawaiana',10],['Porción de pizza',3],['Pan de ajo',4],['Refresco de cola',2],['Cerveza',3]]},
ice:{n:'HELADERÍA',c:'#00acc1',wall:0xe0f7fa,floor:0xd9e4e6,L:'🍦',col:'#26c6da',worker:'Heladero',job:['Heladero',115],items:[['Helado de vainilla',3],['Helado de chocolate',3],['Helado de fresa',3],['Cucurucho doble',5],['Polo de hielo',2],['Granizado',3],['Batido',4],['Copa de helado',7]]},
estate:{n:'INMOBILIARIA',c:'#1f5fa8',wall:0xdfe6ee,floor:0xc2c8d0,L:'I',col:'#2f7fe0',worker:'Agente',job:null},
gym:{n:'GIMNASIO',c:'#d35400',wall:0xe9ecef,floor:0x3a3f45,L:'💪',col:'#f39c12',worker:'Monitora',job:null,items:[]},
hotel:{n:'HOTEL',c:'#6a2c91',wall:0xe8d8c0,floor:0xb08a5a,L:'H',col:'#8e44ad',worker:'Recepcionista',job:['Botones',160],items:[]},
garage:{n:'TALLER',c:'#37474f',wall:0xe3e6e8,floor:0x9a9fa4,L:'R',col:'#546e7a',worker:'Mecánico'},
gas:{n:'GASOLINERA',c:'#c62828',wall:0xf4e9d8,floor:0xcfd3d6,L:'G',col:'#e53935',worker:'Gasolinero',job:['Mozo de gasolinera',140],items:[['Bocadillo',4],['Refresco',2],['Chocolate',2],['Café',2],['Bidón de gasolina',18]]},
town:{n:'AYUNTAMIENTO',c:'#555a60',wall:0xd8d4c8,floor:0x9a9a9a,L:'Y',col:'#6b7a8f',worker:'Funcionario',job:['Administrativo',350],items:[]},
bank:{n:'BANCO',c:'#0b6b5c',wall:0xe4ece8,floor:0xc9d3cf,L:'$',col:'#12a08a',worker:'Cajero',job:null,items:[]},
pet:{n:'MASCOTAS',c:'#d6336c',wall:0xf6e3ea,floor:0xe6cfd8,L:'🐾',col:'#e0457b',worker:'Dependienta',job:null,items:[]},
ffood:{n:'FÁBRICA DE COMIDA',c:'#b03a2e',wall:0xe9d9b8,floor:0xc9c9c0,L:'🏭',col:'#e8891e',worker:'Encargado',job:null,items:[]},
ffurn:{n:'FÁBRICA DE MUEBLES',c:'#6d4c41',wall:0xd9c2a0,floor:0xa89070,L:'🏭',col:'#9b6a3a',worker:'Encargado',job:null,items:[]},
fcloth:{n:'FÁBRICA DE ROPA',c:'#7d3c98',wall:0xe3d4ee,floor:0xb9b2c4,L:'🏭',col:'#a84be8',worker:'Encargada',job:null,items:[]}};
SHOPS.shop.items=Object.keys(CLOTH).map(k=>[k,CLOTH[k].price]);

// ---------- 4.1 Fábricas de las afueras (al este del barrio): aquí se compra la mercancía de los negocios propios ----------
const FACT={ffood:['super','bar','pan'],ffurn:['muebles'],fcloth:['ropa']},SMK=[];let facW=null;
function smokeUpd(t){for(const p of SMK){const u=(t*.12+p.ph)%1;p.m.position.set(p.x+u*9,p.y+u*16,p.z+u*3);const s=1+u*2.4;p.m.scale.set(s,s,s);p.m.material.opacity=.55*(1-u)}}
function factory(s){const key=s.k,S=SHOPS[key],px=s.x,pz=s.z,fz=-1,w=s.w,d=s.d,H=8,L=d/2-.4,zf=pz+fz*d/2,sd0=seed,Z=l=>pz+fz*l,
 F=(x,y,l,sx,sy,sz,c,sol)=>box(px+x,G+.03+y,Z(l),sx,sy,sz,c,sol),
 cyl=(x,y,l,rt,rb,h,c,sol)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,14),mat(c));m.position.set(px+x,G+.03+y+h/2,Z(l));m.userData.st=1;scene.add(m);if(sol)colliders.push({x0:px+x-rb,x1:px+x+rb,z0:Z(l)-rb,z1:Z(l)+rb,y0:G+.03+y,y1:G+.03+y+h,on:true});return m},
 log=(x,y,l,r,len,c)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),mat(c));m.rotation.x=Math.PI/2;m.position.set(px+x,G+.03+y+r,Z(l));m.userData.st=1;scene.add(m)};
 // explanada de hormigón (delante de la puerta y alrededor)
 box(px,0,pz-6,w+12,G,d+20,0xb9b6ad,false);
 const dr=hollow(px,pz,w,d,H,fz,S.wall,6,S.floor);dr.shop=key;dr.leaf.material=mat(0x555a60);
 // cartel grande
 {const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle=S.c;g.fillRect(0,0,512,96);g.fillStyle='#fff';g.font='bold 46px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(S.n,256,50);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(14,14*96/512),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(px,G+6.3,zf+fz*.3);m.rotation.y=Math.PI;scene.add(m)}
 // tejado en dientes de sierra con claraboyas
 {const sm=new THREE.MeshLambertMaterial({color:s.roof,side:THREE.DoubleSide}),n=3,len=d/n-.3;for(let i=0;i<n;i++){const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(len,0);sh.lineTo(len,2.6);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:w-3,bevelEnabled:false});g.rotateY(-Math.PI/2);const m=new THREE.Mesh(g,sm),z0=pz-d/2+.15+i*(d/n);m.position.set(px+(w-3)/2,G+H+.25,z0);scene.add(m);
   box(px,G+H+.25+.9,z0+len+.03,w-4,1.4,.06,0x9fd0ea,false)}}
 // chimeneas con franjas y humo
 s.ch.forEach((x,i)=>{const l=-(d/2-4.5);F(x,H-.03,l,3.2,1.6,3.2,0x8a8f95,false);cyl(x,H+1.5,l,1,1.5,16.5,0xa0522d,false);cyl(x,H+15.3,l,1.06,1.1,1.1,0xffffff,false);cyl(x,H+16.4,l,1.08,1.12,1.1,0xc0392b,false);
  for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(1.3,8,6),new THREE.MeshLambertMaterial({color:0xd8d8d8,transparent:true,opacity:.5,depthWrite:false}));scene.add(m);SMK.push({m,x:px+x,y:G+H+18,z:Z(l),ph:k/4+i*.19})}});
 // mostrador + encargado
 F(0,0,-L+3.3,6,1,.9,0x8b5a2b,true);F(0,1,-L+3.3,6.2,.06,1.05,0x2f2f2f,false);F(1.5,1.06,-L+3.3,.6,.35,.45,0x222222,false);F(0,1.6,-L+.02,10,.6,.04,parseInt(S.col.slice(1),16),false);
 const wk=person(0xe67e22),wz=Z(-L+1.8);wk.position.set(px,G+.03,wz);wk.rotation.y=Math.PI;scene.add(wk);
 WORKERS.push({x:px,z:wz,key,name:S.worker,sp:{x:px,z:zf+fz*6}});
 // cintas transportadoras con producto
 const ic={ffood:[0xd9473a,0xe0b020,0x4aa35a,0xe8e8e8],ffurn:[0xc9a36a,0x8b5a2b,0xa0522d],fcloth:[0xd9473a,0x3a9ad9,0xe0b020,0xe84393,0xffffff]}[key];
 [-8,8].forEach((x,j)=>{F(x,0,2.5,1.6,.8,13,0x4a5058,true);F(x,.8,2.5,1.3,.06,13,0x1d1f22,false);for(let i=0;i<6;i++)F(x,.86,-2.5+i*2.1,key==='fcloth'?.9:.8,key==='fcloth'?.25:.5,.8,ic[(i+j)%ic.length],false)});
 // maquinaria de fondo
 [-1,1].forEach(k=>{F(k*12.5,0,-L+2.4,5,3.4,3,0x7a8590,true);F(k*12.5,3.4,-L+2.4,3,.6,2,0xf1c40f,false);F(k*12.5,1.4,-L+3.95,3.4,.8,.1,0x1d1f22,false);F(k*10.2,1.8,-L+3.95,.2,.2,.1,0x2ecc71,false)});
 if(key==='ffood'){[-1,1].forEach(k=>[0,1,2].forEach(i=>cyl(k*13,0,-1+i*3.6,1.4,1.4,4.2,0xd0d6da,true)));F(-13,4.4,2,.5,.5,10.4,0x8a8f95,false);F(13,4.4,2,.5,.5,10.4,0x8a8f95,false);
  [[-15,5],[-15,7.5],[15,5],[15,7.5]].forEach((a,i)=>F(a[0],0,a[1]+3.5,1.2,.8,1.2,ic[i%4],true));
  [2.8,-2.8].forEach(x=>cyl(w/2+3.5+(x>0?0:0),0,x>0?-2:5,2.2,2.2,10,0xcfd3d6,true))}
 else if(key==='ffurn'){F(-13,0,3,2.4,1,5.5,0x8a6a48,true);F(-13,1,3,.1,.5,5.5,0xdddddd,false);[0,1,2].forEach(i=>{F(13,i*.45,-1+i*.1,1.6,.4,5,0xc9a36a,true);F(13,i*.45,6,1.6,.4,4,0xd7b27a,true)});F(-13,0,9,2.6,.8,1.4,0x3b6ea5,true);F(-13,.8,9.6,2.6,.6,.3,0x3b6ea5,false);
  for(let r=0;r<2;r++)for(let i=0;i<4;i++)log(-(w/2+3.5)+r*1.8,r?1.9:0,-6+i*0,1,5,0x6b4a2b),log(-(w/2+3.5)+r*1.8+.9,r?1.9:0,-6+i*0,1,5,0x7a5a3a);}
 else{[-1,1].forEach(k=>[0,1,2].forEach(i=>{F(k*14,0,-1+i*3.8,1.4,.8,3,0xdddddd,true);F(k*14,.8,-1+i*3.8,.5,.5,.5,0x333333,false);cyl(k*15.6,0,-1+i*3.8,.5,.5,2,ic[i%ic.length],false)}));
  for(let r=0;r<2;r++)for(let i=0;i<3;i++)F(w/2+3.5-r*0,r*1.1,-1+i*3.5,2.4,1,2.4,ic[(i+r)%ic.length],true)}
 // palés y cajas junto a la puerta
 [[-9,.8],[9,.8]].forEach(a=>{F(a[0],0,L-2.5,2.2,.15,2.2,0xb08d57,true);F(a[0],.15,L-2.5,1.8,.9,1.8,ic[0],false)});
 PLACES.push({x:px,z:zf+fz*3,key,l:S.L,c:S.col,nt:1});
 seed=sd0}
FACS.forEach(factory);


// ---------- 4.2 Imágenes de la tienda de ropa: cada prenda se dibuja sobre un maniquí ----------
const CK=Object.keys(CLOTH),THC={};let THR=null,SHOPTAB=0;
const TABS=[['est','👕 Estampadas'],['cam','👔 Camisetas y camisas'],['abr','🧥 Abrigo'],['pan','👖 Pantalones'],['cal','👟 Calzado'],['cab','🎩 Gorros y gafas'],['cue','🧣 Cuello y muñeca'],['esp','🎒 Mochilas y capas']];
const VIEW={top:[0,1.4,2,0],legs:[0,.55,2.05,.15],feet:[0,.17,1.05,.6],head:[0,1.77,.9,.4],eyes:[0,1.74,.6,0],neck:[0,1.45,1.2,.2],back:[0,1.15,2,2.7],wrist:[.25,1.02,.7,1.2]};
const FALLBACK=e=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="125"><text x="50" y="80" font-size="56" text-anchor="middle">'+e+'</text></svg>');
function thumbOf(n){if(THC[n])return THC[n];const it=CLOTH[n];let url='';
 try{if(!THR){const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(200,250);r.setClearColor(0x000000,0);
   const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x8a8aa0,.95));const dl=new THREE.DirectionalLight(0xffffff,.55);dl.position.set(1.5,2.5,3);sc.add(dl);
   THR={r,s:sc,c:new THREE.PerspectiveCamera(30,.8,.05,20)}}
  const w={};w[it.slot]=n;const g=person(0x9aa0aa,outfitOpts(w,0x9aa0aa)),V=VIEW[it.slot];
  THR.s.add(g);THR.c.position.set(V[0]+Math.sin(V[3])*V[2],V[1]+.05,Math.cos(V[3])*V[2]);THR.c.lookAt(V[0],V[1],0);THR.r.render(THR.s,THR.c);
  url=THR.r.domElement.toDataURL('image/png');THR.s.remove(g);g.traverse(x=>{if(x.geometry)x.geometry.dispose()})}catch(e){url=''}
 return THC[n]=url||FALLBACK('👕')}
function shopTab(t){SHOPTAB=t;const el=$('sb');if(!el)return;const g=TABS[t][0],sc=dlg.scrollTop;
 let h='<div class="tabs">'+TABS.map((x,i)=>`<button class="${i==t?'on':''}" onclick="shopTab(${i})">${x[1]}</button>`).join('')+'</div><div class="grid">';
 CK.forEach((n,i)=>{const it=CLOTH[n];if(it.g!==g)return;const own=inv[n]?inv[n].n:0;
  h+=`<div class="card"><img src="${thumbOf(n)}" alt="${n}"><div>${n}</div><b>€${it.price}</b>${own?`<small>Tienes ×${own}</small>`:''}<button onclick="buy('shop',${i})">Comprar</button></div>`});
 el.innerHTML=h+'</div>';dlg.scrollTop=sc}

// Color de la puerta de una casa (naranja = a la venta, etc.). Está aquí (y no en banco-casas.js) porque se usa al construir el mapa.
function setHouseColor(h,c){if(!h.om)h.om=h.door.leaf.material;h.door.leaf.material=mat(c)}
