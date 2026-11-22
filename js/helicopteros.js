/* ===============================================================================================
   FICHA · helicopteros.js
   Qué hay:          Helicópteros (sección 12): modelos, helipuertos y cómo se pilotan.
   Tócalo si quieres: cambiar o añadir helicópteros
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 12. HELICÓPTEROS
//     Helicópteros del aeropuerto y del aeródromo de la isla: modelo, helipuertos y vuelo.
// =================================================================================================
// Fase 1: modelo 3D, helipuertos y colisión; el rotor gira al ralentí. Fase 2: subir (E) y volar en modo arcade.
// Vuelo: Espacio sube · Mayús baja · W/S avanzan y retroceden · A/D giran · sin teclas se queda flotando · E baja (solo en tierra)
// Aterrizaje: suelo plano y azoteas planas sí; agua, tejados inclinados y superficies irregulares no.
// Cada helicóptero: {x,z,h,m (malla), m.userData.rot / .tail (rotores), col (colisión), price, rent, own, fuel, tank, state:'park', rs (vel. rotor actual), rsT (objetivo)}
const HELIS=[],HELIDLE=5,HELIFLY=32,HELIMAX=30,HELIBACK=9,HELICEIL=220; // rotor: ralentí / régimen de vuelo (rad/s) · velocidad máx. adelante y atrás (m/s) · techo (m)
function heliParts(col){
 const W=0xf2f4f6,WG=0xdfe3e8,GL=0x1b2a38,GR=0x9aa0a6,DK=0x2b2f35,L=[],RT=[],TR=[],
 add=(a,g,c)=>{a.push([g,c])},
 A=(a,sx,sy,sz,x,y,z,c)=>{const g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);add(a,g,c)},
 Cz=(a,r1,r2,len,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r1,r2,len,12);g.rotateX(Math.PI/2);g.translate(x,y,z);add(a,g,c)},
 Cy=(a,r,len,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,len,10);g.translate(x,y,z);add(a,g,c)},
 Sp=(a,sx,sy,sz,x,y,z,c)=>{const g=new THREE.SphereGeometry(1,16,12);g.scale(sx,sy,sz);g.translate(x,y,z);add(a,g,c)};
 // cabina (color) y cúpula acristalada delantera; el morro mira hacia +z
 Sp(L,1.3,1.2,2.2,0,1.95,.2,col);Sp(L,1.22,.95,1.5,0,2.2,1.05,GL);
 A(L,1.7,.8,2.4,0,3.2,-.3,WG);                       // cárter del rotor
 // botón de cola: cono desde la cabina hasta el estabilizador
 Cz(L,.55,.15,6.2,0,2.35,-4.6,col);
 {const g=new THREE.BoxGeometry(.12,1.8,1.2);g.rotateX(-.35);g.translate(0,2.95,-7.5);add(L,g,col)} // deriva
 A(L,2.4,.1,.7,0,2.3,-6.9,WG);A(L,.1,.55,.7,-1.2,2.3,-6.9,col);A(L,.1,.55,.7,1.2,2.3,-6.9,col); // estabilizador y aletas
 {const g=new THREE.BoxGeometry(.22,.22,.22);g.translate(0,3.95,-7.75);add(L,g,0xff3030)} // baliza roja
 // patines y travesaños
 [-1,1].forEach(k=>{Cz(L,.07,.07,4.6,k*1.05,.25,.5,GR);
  [1.2,-.5].forEach(z=>{const g=new THREE.BoxGeometry(.08,1.3,.08);g.rotateZ(k*.22);g.translate(k*.93,.9,z);add(L,g,GR)})});
 // mástil y cubo del rotor
 Cy(L,.16,.9,0,3.85,-.3,DK);
 // rotor principal: 4 palas en cruz con puntas de color (centrado en su propio origen para poder girarlo)
 A(RT,10.4,.05,.38,0,0,0,DK);A(RT,.38,.05,10.4,0,0,0,DK);
 [[-5,0],[5,0],[0,-5],[0,5]].forEach(p=>A(RT,p[0]?.5:.38,.06,p[1]?.5:.38,p[0]*1.02,0,p[1]*1.02,0xf1c40f));
 Cy(RT,.28,.16,0,.04,0,GR);
 // rotor de cola: 4 palas pequeñas
 A(TR,.05,2,.22,0,0,0,DK);A(TR,.05,.22,2,0,0,0,DK);
 return{L,RT,TR}}
function heliMesh(col){const P=heliParts(col),g=new THREE.Group();g.rotation.order='YXZ';
 g.add(mergeParts(P.L));const rot=mergeParts(P.RT),tail=mergeParts(P.TR);rot.position.set(0,4.35,-.3);tail.position.set(.3,3.05,-7.7);g.add(rot,tail);g.userData={rot,tail};
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
// colisión: rectángulo del fuselaje y la cola, girado según el rumbo (el rotor va alto: se puede pasar por debajo)
function heliBox(a){const c=Math.cos(a.h),s=Math.sin(a.h),hx=[[-1.4,-7.8],[1.4,-7.8],[-1.4,2.7],[1.4,2.7]].map(p=>[a.x+p[0]*c+p[1]*s,a.z-p[0]*s+p[1]*c]),k=a.col;
 k.x0=Math.min(...hx.map(p=>p[0]));k.x1=Math.max(...hx.map(p=>p[0]));k.z0=Math.min(...hx.map(p=>p[1]));k.z1=Math.max(...hx.map(p=>p[1]));k.y0=G+(a.alt||0);k.y1=k.y0+3.6}
function addHeli(i,x,z,h,col,name){const m=heliMesh(col);m.position.set(x,G,z);m.rotation.y=h;scene.add(m);
 const cl={x0:0,x1:0,z0:0,z1:0,y0:G,y1:G+3.6,on:true};colliders.push(cl);
 const a={heli:1,hex:col,name,i,x,z,h,m,col:cl,state:'park',price:120000,rent:300,own:false,fuel:80,tank:80,v:0,vz:0,alt:0,pt:0,bk:0,air:false,tw:0,rs:HELIDLE*(.7+i*.15),rsT:HELIDLE};heliBox(a);HELIS.push(a);return a}
// helipuerto: plataforma cuadrada de 16 m con aro, H, borde amarillo y luces en las esquinas
function helipad(x,z,link){const AS=0x3b3b40,PS=0x55555c,
 A=(cx,cz,sx,sz,c)=>box(cx,0,cz,sx,G,sz,c,false),M=(cx,cz,sx,sz,c)=>box(cx,G,cz,sx,.03,sz,c,false);
 A(x,z,16,16,AS);if(link)A(link[0],link[1],link[2],link[3],PS);
 [-7.6,7.6].forEach(k=>{M(x+k,z,.35,16,0xf1c40f);M(x,z+k,16,.35,0xf1c40f)});
 const ring=new THREE.Mesh(new THREE.RingGeometry(4.6,5.1,40),new THREE.MeshBasicMaterial({color:0xf4f4f4}));ring.rotation.x=-Math.PI/2;ring.position.set(x,G+.05,z);scene.add(ring);
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#f4f4f4';g.font='bold 200px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('H',128,138);
 const hm=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));hm.rotation.x=-Math.PI/2;hm.position.set(x,G+.06,z-1.2);scene.add(hm);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(k=>box(x+k[0]*7.6,G,z+k[1]*7.6,.4,.3,.4,lampMat,false));
 BLD.push([x-8,z-8,16,16,'#55555c'])}
// aeropuerto: dos helipuertos al este de la plataforma, junto a las avionetas (el morro mira a la pista, al sur)
helipad(184,388,[166,388,20,8]);helipad(206,388);
addHeli(0,184,388,0,0x2f7fe0,'EC-HE1');addHeli(1,206,388,0,0xd33a2f,'EC-HE2');
// aeródromo de la isla: dos helipuertos al este de la terminal, con un enlace desde la explanada
helipad(354,587+ISLDZ+130,[336,596+ISLDZ+130,20,6]);helipad(376,587+ISLDZ+130);
addHeli(2,354,587+ISLDZ+130,0,0xf1c40f,'EC-HE3');addHeli(3,376,587+ISLDZ+130,0,0x27ae60,'EC-HE4');
// subir / bajar (como en las avionetas: el jugador usa el mecanismo "riding", se oculta y la cámara sigue al helicóptero)
function boardHeli(a){if(riding||inCar)return;riding=a;a.col.on=false;a.v=0;a.vz=0;a.rsT=HELIFLY;body.visible=false;toast('Helicóptero '+a.name+' · arrancando rotor · Espacio sube · Mayús baja · W/S avanzar · A/D girar · E: bajar (en tierra)')}
function leaveHeli(){const a=riding;if(a.air||Math.abs(a.v)>1.5){toast('Posa el helicóptero en el suelo para bajar');return}
 const yb=G+a.alt,c=Math.cos(a.h),s=Math.sin(a.h);
 // la superficie donde ha aterrizado (azotea, plataforma…) pasa a ser suelo transitable para el jugador
 for(const b of HNB)if(Math.abs(b.y1-yb)<.06&&!b.nl&&!b.fl&&b.x1-b.x0>=1.5&&b.z1-b.z0>=1.5&&Math.hypot((b.x0+b.x1)/2-a.x,(b.z0+b.z1)/2-a.z)<40){b.fl=1;FLOORS.push({x0:b.x0,x1:b.x1,z0:b.z0,z1:b.z1,y:b.y1})}
 const sd=[[c*3,-s*3],[-c*3,s*3],[-s*9.5,-c*9.5],[s*5,c*5]];let o=null,gy=0;
 for(const q of sd){const x=a.x+q[0],z=a.z+q[1],gh=groundH(x,z,yb+.6);
  if(gh>=yb-1.5&&gh<=yb+.6&&gh>-.3&&(gh>1.5||!blockHit(x,z,.5,0))&&!hits(x,gh+.9,z)&&!wallHit(x,z,.4,gh)){o=q;gy=gh;break}}
 if(!o){toast('No hay sitio libre para bajar aquí');return}
 heliBox(a);a.v=0;a.vz=0;a.rsT=HELIDLE;$('spd').textContent='';riding=null;a.col.on=true;body.visible=true;pl.x=a.x+o[0];pl.z=a.z+o[1];py=gy;vy=0;grounded=true;body.position.set(pl.x,py,pl.z);toast('Has bajado del helicóptero')}
// colisiones del helicóptero (v2): todas las cajas estáticas del mundo (muros, techos, azoteas, fachadas…) se registran en HB al crearlas con box().
// El helicóptero se apoya en sus 6 puntos de patín: suelo plano, azoteas y plataformas sirven; agua y superficies irregulares no.
const HNB=[],HNC=[];let HTM=0;
const HSK=[[-1.05,-1.8],[1.05,-1.8],[-1.05,.5],[1.05,.5],[-1.05,2.8],[1.05,2.8]]; // patines [lateral, avance]
const HPR=(()=>{const P=[ // sondas de colisión [lateral, altura, avance, ¿comprobar terreno?]
 [-1.05,.25,-1.8,1],[1.05,.25,-1.8,1],[-1.05,.25,.5,1],[1.05,.25,.5,1],[-1.05,.25,2.8,1],[1.05,.25,2.8,1],
 [-1.4,1.3,.3,1],[1.4,1.3,.3,1],[-1.2,2.7,.5,0],[1.2,2.7,.5,0],[0,1.5,2.6,1],[0,2.6,2.2,0],[0,1.6,-1.8,0],
 [0,2.35,-3.6,0],[0,2.35,-5.8,0],[0,2.4,-7.8,1],[0,3.8,-7.6,0],[.3,4.1,-7.7,0],[.3,2,-7.7,0],[0,3.9,-.3,0]];
 for(let k=0;k<16;k++){const an=k*Math.PI/8;P.push([Math.sin(an)*5.2,4.4,-.3+Math.cos(an)*5.2,k%2?0:1])} // puntas del rotor
 for(let k=0;k<8;k++){const an=Math.PI/8+k*Math.PI/4;P.push([Math.sin(an)*2.8,4.4,-.3+Math.cos(an)*2.8,0])}
 return P})();
// objetos cercanos (se recalculan cada fotograma) y altura máxima del entorno
function hNear(a){const R=26,cx=a.x,cz=a.z;HNB.length=0;HNC.length=0;let top=0;
 for(const b of HB)if(b.x1>cx-R&&b.x0<cx+R&&b.z1>cz-R&&b.z0<cz+R){HNB.push(b);if(b.y1>top)top=b.y1}
 for(const o of colliders)if(o.on&&!o.car&&o.x1>cx-R&&o.x0<cx+R&&o.z1>cz-R&&o.z0<cz+R){HNC.push(o);if(o.y1>top)top=o.y1}
 let tm0=-1e9;for(let k=0;k<9;k++){const an=k*Math.PI/4,r=k<8?22:0,h=heightAt(cx+Math.cos(an)*r,cz+Math.sin(an)*r);if(h>tm0)tm0=h}
 HTM=tm0;return Math.max(top,tm0+6)}
// ¿choca el helicóptero en (x,z) a altura alt (sobre el suelo base) y rumbo h? Fuselaje, cola y rotor contra cajas, colisionadores, vallas y terreno
function hBump(a,x,z,alt,h){h=h==null?a.h:h;const c=Math.cos(h),s=Math.sin(h),yb=G+alt;
 for(const p of HPR){const wx=x+p[0]*c+p[2]*s,wz=z-p[0]*s+p[2]*c,wy=yb+p[1];
  if(wx<WLIM0||wx>WLIM1||wz<WLIM0||wz>WLIM1)return true;
  for(let i=0;i<HNB.length;i++){const b=HNB[i];if(wx>b.x0-.12&&wx<b.x1+.12&&wz>b.z0-.12&&wz<b.z1+.12&&wy<b.y1-.05&&wy>b.y0-.1)return true}
  for(let i=0;i<HNC.length;i++){const o=HNC[i];if(wx>o.x0-.15&&wx<o.x1+.15&&wz>o.z0-.15&&wz<o.z1+.15&&wy<o.y1-.05&&wy>=(o.y0||0)-.3)return true}
  if(wallHit(wx,wz,.3,wy-1.6))return true;
  if(p[3]&&HTM>.3&&wy<HTM+.5&&heightAt(wx,wz)>wy-.02)return true}
 if(alt<5)for(const q of PLANES)if(q.alt<5&&Math.hypot(q.x-x,q.z-z)<18)return true;
 return false}
// apoyo bajo los patines: fy = punto más alto sobre el que reposa, mn = el más bajo, wet = algún patín sobre agua, nl = sobre un tejado inclinado
const HF={fy:0,mn:0,wet:false,nl:false};
function hFloor(a,x,z,yb,cl,h){h=h==null?a.h:h;const c=Math.cos(h),s=Math.sin(h),top=yb+cl;let fy=-1e9,mn=1e9,wet=false,nl=false;
 for(const p of HSK){const px=x+p[0]*c+p[1]*s,pz=z-p[0]*s+p[1]*c,hg=heightAt(px,pz);let y=G,pw=hg<-.3,pn=false;
  if(!pw)y=Math.max(hg,G);
  const dk=deckY(px,pz);if(dk!==null&&dk<=top&&dk>y){y=dk;pw=false}
  for(let i=0;i<HNB.length;i++){const b=HNB[i];if(px>b.x0&&px<b.x1&&pz>b.z0&&pz<b.z1&&b.y1<=top&&b.y1>y){y=b.y1;pn=!!b.nl;pw=false}}
  if(pw)wet=true;if(y>fy)fy=y;if(y<mn)mn=y;if(pn)nl=true}
 HF.fy=fy;HF.mn=mn;HF.wet=wet;HF.nl=nl;return HF}
// intenta moverse a (nx,nz): acompaña pendientes suaves (hasta ~30°) rozando el suelo; escalones y laderas más empinados cuentan como pared
function hTry(a,nx,nz,free,ok0){
 if(free){if(nx<WLIM0||nx>WLIM1||nz<WLIM0||nz>WLIM1)return false;a.x=nx;a.z=nz;return true}
 const f=hFloor(a,nx,nz,G+a.alt,.45),lift=Math.max(a.alt,f.fy-G);
 if(lift-a.alt>Math.max(.1,.6*Math.hypot(nx-a.x,nz-a.z)))return false;
 if(!ok0&&hBump(a,nx,nz,lift))return false;
 a.x=nx;a.z=nz;a.alt=lift;return true}
// el rotor gira siempre (al ralentí si está aparcado); rs se acerca suavemente a rsT. Con el jugador a bordo: vuelo arcade
function heliStep(dt){for(const a of HELIS){const u=a.m.userData;
 if(riding!==a){a.rs+=(a.rsT-a.rs)*Math.min(1,1.5*dt);u.rot.rotation.y+=a.rs*dt;u.tail.rotation.x+=a.rs*5*dt;continue}
 a.rs+=(a.rsT-a.rs)*Math.min(1,.9*dt); // el rotor tarda ~2 s en coger régimen
 const rdy=a.rs>=HELIFLY*.8,w=K.KeyW||K.ArrowUp,s=K.KeyS||K.ArrowDown,up=K.Space,dn=K.ShiftLeft||K.ShiftRight,str=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0);
 const topN=hNear(a),free=G+a.alt>topN+4; // free: muy por encima de todo lo cercano, no hace falta comprobar nada
 // vertical: sin teclas se queda flotando; al bajar, el descenso se frena cerca del apoyo
 const fl0=free?0:(a.fl||0),vzT=rdy?(up?6.5:dn?-clamp(1.2+(a.alt-fl0)*.8,1.2,7):0):0;a.vz+=clamp(vzT-a.vz,-14*dt,14*dt);
 if(a.air){const vT=w?HELIMAX:s?-HELIBACK:0;a.v+=clamp(vT-a.v,-9*dt,9*dt)}else a.v=0;
 // varios subpasos para no atravesar nada a gran velocidad
 const ST=free?1:clamp(Math.ceil((Math.abs(a.vz)+Math.abs(a.v))*dt/.35),1,6),sd=dt/ST,was=a.air,ok0=!free&&hBump(a,a.x,a.z,a.alt);
 let landed=false,hit=0,lv=0;
 for(let i=0;i<ST;i++){
  let na=Math.min(HELICEIL,a.alt+a.vz*sd);
  if(!free){
   const f=hFloor(a,a.x,a.z,G+a.alt,.35),fr=f.fy-G,can=!f.wet&&!f.nl&&f.fy-f.mn<=.3; // plano, seco y sin tejado inclinado
   a.can=can;a.wet=f.wet;a.fl=can?fr:Math.max(fr,0)+(f.wet?4:1.3); // si no se puede aterrizar, se queda flotando sobre el apoyo
   if(can){if(na<=fr+.001){na=fr;if(a.vz<0){lv=Math.min(lv,a.vz);a.vz=0}landed=true}}
   else if(na<a.fl){na=Math.max(na,Math.min(a.alt+7*sd,a.fl));if(a.vz<0)a.vz=0}
   if(na!==a.alt&&!ok0&&hBump(a,a.x,a.z,na)){na=a.alt;a.vz=0;landed=false} // techo/obstáculo vertical
  }
  a.alt=na;
  // horizontal: solo en el aire (en tierra el helicóptero no rueda); al chocar desliza a lo largo del obstáculo
  if(!landed){
   if(str){const nh=a.h+str*sd*1.3*(1-.35*Math.abs(a.v)/HELIMAX);if(free||ok0||!hBump(a,a.x,a.z,a.alt,nh))a.h=nh}
   if(a.v){const dx=Math.sin(a.h)*a.v*sd,dz=Math.cos(a.h)*a.v*sd,ox=a.x,oz=a.z;
    hTry(a,ox+dx,oz+dz,free,ok0)||hTry(a,ox+dx,oz,free,ok0)||hTry(a,ox,oz+dz,free,ok0);
    if(Math.hypot(a.x-ox,a.z-oz)<Math.hypot(dx,dz)*.5){hit=Math.max(hit,Math.abs(a.v));a.v*=Math.abs(a.v)>8?-.2:.5}}
  }else a.v=0;
 }
 a.air=!landed;
 if(landed&&was&&lv<-.5)toast('Aterrizaje');
 if(hit>8&&tm>a.tw){a.tw=tm+2;toast('¡Choque!')}
 if(dn&&rdy&&!free&&a.air&&!a.can&&a.alt<=a.fl+.05&&tm>(a.tw2||0)){a.tw2=tm+3;toast(a.wet?'No puedes aterrizar en el agua':'Superficie no apta: busca suelo plano o una azotea')}
 // inclinación: morro abajo al avanzar, arriba al frenar o retroceder; alabeo al girar
 const k=Math.min(1,4*dt),ptT=a.air?clamp(-a.v/HELIMAX*.28,-.3,.14)+(w?-.05:s?.04:0):0,bkT=a.air?-str*(.1+.14*Math.abs(a.v)/HELIMAX):0;
 a.pt+=(ptT-a.pt)*k;a.bk+=(bkT-a.bk)*k;
 a.m.position.set(a.x,G+a.alt,a.z);a.m.rotation.set(-a.pt,a.h,a.bk);
 u.rot.rotation.y+=a.rs*dt;u.tail.rotation.x+=a.rs*5*dt;
 $('spd').textContent=Math.round(Math.abs(a.v)*3.6)+' km/h'}}
function planeBlock(p){if(riding)return false;const t=inCar||pl,sg=p.rev?-1:1,fx=Math.sin(p.h)*sg,fz=Math.cos(p.h)*sg,rx=t.x-p.x,rz=t.z-p.z,f=rx*fx+rz*fz,l=rx*fz-rz*fx;return f>-4&&f<26&&Math.abs(l)<14&&(inCar||py<2.5)}
function planeStep(p,dt){
 const st=p.state,h0=p.h;let q;
 if(st==='park'){p.v=0;p.t=Math.max(0,p.t-dt);
  if(p.t<=0&&RWY===null&&!PLANES.some(o=>o!==p&&(o.state==='arr'||o.state==='rollout'||o.land))){RWY=p;p.state='push';p.path=p.o1;p.ps=0;p.rev=true}}
 else if(st==='push'||st==='taxi'||st==='arr'){
  const P=p.path,e=P.len-p.ps;let vt=planeBlock(p)?0:(st==='push'?2.6:8.5);vt=Math.min(vt,Math.sqrt(2*2.5*Math.max(0,e))+.5);
  p.v+=clamp(vt-p.v,-9*dt,3*dt);if(p.v<0)p.v=0;p.ps=Math.min(P.len,p.ps+p.v*dt);
  q=pathAt(P,p.ps);p.x=q[0];p.z=q[1];p.h=p.rev?q[2]+Math.PI:q[2];
  if(p.ps>=P.len-.05){p.v=0;
   if(st==='push'){p.state='pivot';p.ph=pathAt(p.o2,0)[2]}
   else if(st==='taxi'){p.state='line';p.t=1.2}
   else{p.state='park';p.rev=false;p.boarded=false;p.t=riding===p?25:35+Math.random()*20}}}
 else if(st==='pivot'){const e=Math.atan2(Math.sin(p.ph-p.h),Math.cos(p.ph-p.h)),sp=1.1*dt;
  if(Math.abs(e)<=sp){p.h=p.ph;p.state='taxi';p.path=p.o2;p.ps=0;p.rev=false}else p.h+=Math.sign(e)*sp}
 else if(st==='line'){p.t-=dt;if(p.t<=0){p.state='roll';p.s=sRoll;p.v=0;p.need=riding===p?2:1;p.pass=0;p.fin=false;p.land=false}}
 else if(st==='roll'){p.v+=4.8*dt;p.s+=p.v*dt;q=pathAt(RING,p.s);p.x=q[0];p.z=q[1];p.h=q[2];if(p.v>=37){p.state='fly';p.sPrev=p.s}}
 else if(st==='fly'){
  p.v+=clamp((p.land?40:50)-p.v,-5*dt,4*dt);p.sPrev=p.s;p.s+=p.v*dt;
  if(p.s>=RING.len){p.s-=RING.len;if(p.land)p.fin=true}
  let tg=55,ff=0;if(p.land&&p.fin){tg=Math.max(0,(sTD-p.s)*.1);ff=-.1*p.v}
  p.vz=clamp((tg-p.alt)*1.5+ff,-10,7);p.alt=Math.max(0,p.alt+p.vz*dt);
  q=pathAt(RING,p.s);p.x=q[0];p.z=q[1];p.h=q[2];
  if(!p.land){
   if(RWY===p&&p.alt>8)RWY=null;
   if(p.sPrev<sCom&&p.s>=sCom){p.pass++;
    if(p.pass>=p.need&&RWY===null&&!PLANES.some(o=>o!==p&&o.state!=='park'&&o.state!=='fly')){RWY=p;p.land=true;p.fin=false}}}
  else if(p.fin&&p.s>=sTD&&p.s<sTD+80){p.state='rollout';p.alt=0;p.vz=0}}
 else if(st==='rollout'){
  const dist=Math.max(3,sEX-p.s),a=Math.max(3,(p.v*p.v-72)/(2*dist));p.v=Math.max(8.5,p.v-a*dt);p.s+=p.v*dt;
  if(p.s>=sEX){p.s=sEX;p.state='arr';p.path=p.ar;p.ps=0;p.rev=false;p.land=false;p.fin=false;RWY=null}
  q=pathAt(RING,p.s);p.x=q[0];p.z=q[1];p.h=q[2]}
 // inclinación (cabeceo) y alabeo según lo que hace
 const dh=Math.atan2(Math.sin(p.h-h0),Math.cos(p.h-h0));
 p.bkT=p.alt>3?clamp(-dh/dt,-.5,.5):0;
 p.ptT=p.state==='fly'?clamp(p.vz/Math.max(p.v,25),-.3,.3)+((p.land&&p.fin&&p.alt<9)?.1:0):(p.state==='roll'&&p.v>30?.18:0);
 const k=Math.min(1,3*dt);p.pt+=(p.ptT-p.pt)*k;p.bk+=(p.bkT-p.bk)*k;
 placePlane(p);p.m.userData.st.visible=(tm*1.4%1)<.14}
function boardPlane(p){if(riding||p.state!=='park'||!pay(PLANEFARE))return;riding=p;p.boarded=true;body.visible=false;if(p.t>6)p.t=6;toast('Billete '+p.name+': −'+PLANEFARE+' € · despegamos en breve')}
function leavePlane(){riding=null;body.visible=true;pl.x=101;pl.z=335;py=0;vy=0;body.position.set(pl.x,0,pl.z);toast('Has bajado en la terminal del aeropuerto')}
// ruido de turbinas según cercanía y fase
function jetLevel(){let m=0;const on=riding&&riding.plane,ox=on?riding.x:(inCar?inCar.x:pl.x),oz=on?riding.z:(inCar?inCar.z:pl.z);
 for(const p of PLANES){const d=Math.hypot(p.x-ox,p.z-oz),th={park:.1,push:.25,pivot:.25,taxi:.3,arr:.3,line:.4,roll:1,fly:p.land?.5:.7,rollout:.8}[p.state]||.3,k=Math.max(0,1-d/280);m=Math.max(m,th*k*k)}
 return on?Math.max(m*.5,.12):m}
addPlane(0,58,0x1f5fa8);addPlane(1,144,0xc0392b);

