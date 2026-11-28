/* ===============================================================================================
   FICHA · mundo-base.js
   Qué hay:          Configuración básica, terreno y escena 3D (sección 1), personajes (2) y coches (3). Aquí están las herramientas para construir que usa todo el juego (box, IA, rnd...).
   Tócalo si quieres: cambiar cómo se ven los personajes o los coches, añadir un modelo de coche, cambiar el terreno o la luz
   Ojo:              OJO: casi todo depende de este fichero. No cambies de sitio nada que use rnd() (la semilla fija dibuja el mapa).
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// Objetos con E: cada tipo tiene {txt: texto del aviso, act: qué pasa al pulsar E}. Se crea aquí vacío para que
// CUALQUIER fichero pueda añadir los suyos con IDEF.mitipo={...} y colocar el objeto con IA(malla,'mitipo'). Ver GUIA.md.
const IDEF={};

// =================================================================================================
// 1. CONFIGURACIÓN BÁSICA, TERRENO Y ESCENA 3D
//     Detección de móvil, forma del terreno (ciudad, colinas, montaña, islas, aeropuerto), autopista,
//     funciones de ayuda ($, rnd, pick, setTx…) y creación de la escena 3D (cámara, renderizador y luces).
// =================================================================================================
const IS_TOUCH=matchMedia('(pointer:coarse)').matches||/[?&]touch=1/.test(location.search);
let G=.12;const P=54,N=5,LAND0=-140,LAND1=1300,BEACH=8,WLIM0=LAND0+2,WLIM1=LAND1-2,CE=(N-1)*P+40,MC=(LAND0+LAND1)/2,MS=LAND1-LAND0+40,MOFF=MS/2-MC,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// terreno: 0 en la ciudad; colinas suaves fuera; baja hacia el mar (orilla a ~66 m del borde de la ciudad)
function heightRaw(x,z){const e=Math.max(-14-x,x-N*P,-14-z,z-N*P,0),ss=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v)},ed=isl(x,z);let h=0;
 if(e>0){const n=Math.sin(x*.045+1.3)*Math.cos(z*.05+.4)*.6+Math.sin(x*.11+z*.07)*.3+Math.cos(z*.13-x*.03+2)*.15;h=5*(n*.5+.5)*ss(4,30,e)*(1-ss(40,58,e))}
 return h+mtn(x,z)-2.4*ss(58,90,66-ed)}
// montaña (fase 4): cono suave con cima plana de RT m de radio y MH m de altura
const MX=450,MZ=101,MR=130,MH=120,RT=24;
// distancia tierra adentro (>0 tierra, <0 mar): ciudad con 66 m de margen, montaña con 85 m, más ruido para una costa irregular
// terreno extra para el aeropuerto (al sur del barrio): una lengua de tierra rectangular con 66 m de orilla alrededor
const AP={x0:0,x1:330,z0:380,z1:440},ISLDZ=380,ISL={x:165,z:610+380,r:56},ISLC={x:315,z:610+380,r:260}; // ISL: ancla del pueblo pesquero (con su tamaño original) · ISLC: isla redonda grande (pueblo al oeste, aeródromo al este) · ISLDZ: lo que se ha alejado hacia el sur
function islNz(x,z){return Math.sin(x*.023+1.3)*Math.cos(z*.019+.5)*9+Math.sin(x*.057+z*.043+2)*5+Math.cos(z*.071-x*.031)*3}
// islV: la isla original (el pueblo pesquero se coloca con ella, así que no cambia); isl: isla + península (el ruido de la costa se atenúa para que la pista quede en tierra firme)
function islV(x,z){const dc=Math.hypot(Math.max(-14-x,x-N*P,0),Math.max(-14-z,z-N*P,0)),dm=Math.hypot(x-MX,z-MZ),da=Math.hypot(Math.max(AP.x0-x,x-AP.x1,0),Math.max(AP.z0-z,z-AP.z1,0)),di=Math.hypot(x-ISLC.x,z-ISLC.z);
 return Math.max(66-dc,MR+85-dm,66-da,ISLC.r-di)+islNz(x,z)}
function islV0(x,z){return ISL.r-Math.hypot(x-ISL.x,z-ISL.z)+islNz(x,z-ISLDZ)} // contorno de la isla original: el pueblo conserva exactamente su trazado
function isl(x,z){return islV(x,z)}
function mtnH(r){return r>=MR?0:r<=RT?MH:MH*ssm(0,1,(MR-r)/(MR-RT))}
function mtn(x,z){const d=Math.hypot(x-MX,z-MZ);if(d>=MR)return 0;const u=mtnH(d)/MH;return mtnH(d)*(1+Math.sin(x*.09+z*.05)*Math.cos(z*.08)*.16*u*(1-u)*4)}
// autopista: anillo con esquinas redondeadas a 30 m de la ciudad + 4 accesos por las calles del barrio.
// En cada acceso la carretera pasa a nivel del suelo y la autopista se HUNDE (BR m) para pasar POR DEBAJO de ella; 4 rampas por acceso (2 por cada lado de la autopista, para entrar y salir en ambos sentidos)
const CUTF=15,RDF0=10,RDF1=52,FL=.35; // FL: el fondo de la autopista hundida nunca baja de FL m (el mar está en -0,4: más abajo se inundaría)
const ssm=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v)},HW={polys:[],junc:[],merge:[],mouth:[]},BR=4.4,WALLS=[];
function wallHit(x,z,r,y,fix){let hit=false;for(const w of WALLS){if(x<w.x0-r||x>w.x1+r||z<w.z0-r||z>w.z1+r)continue;const dx=w.bx-w.ax,dz=w.bz-w.az,t=clamp(((x-w.ax)*dx+(z-w.az)*dz)/(dx*dx+dz*dz),0,1),cx=w.ax+dx*t,cz=w.az+dz*t,d=Math.hypot(x-cx,z-cz);if(d<r){const b=w.ya+(w.yb-w.ya)*t;if(y<b+1&&y+1.7>b){if(!fix)return true;hit=true;if(d>1e-6){fix.x+=(x-cx)/d*(r-d);fix.z+=(z-cz)/d*(r-d)}}}}return hit}
function bumpAt(x,z){let d=1e9;for(const j of HW.junc)d=Math.min(d,Math.hypot(x-j[0],z-j[1]));return BR*(1-ssm(8,56,d))}
function rayRing(ring,c0,s){let best=1e9;const n=ring.length;for(let i=0;i<n;i++){const p=ring[i],q=ring[(i+1)%n],ex=q[0]-p[0],ez=q[1]-p[1],den=s[0]*ez-s[1]*ex;if(Math.abs(den)<1e-9)continue;const wx=p[0]-c0[0],wz=p[1]-c0[1],d=(wx*ez-wz*ex)/den,u=-(s[0]*wz-s[1]*wx)/den;if(d>0&&u>=0&&u<=1&&d<best)best=d}return best}
(function(){const st=4,cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),
 hull=P_=>{P_=P_.slice().sort((u,v)=>u[0]-v[0]||u[1]-v[1]);const lo=[],up=[];for(const p of P_){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(const p of P_.slice().reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}lo.pop();up.pop();return lo.concat(up)};
 // autopista: óvalo irregular que rodea la ciudad y la montaña (casco convexo de ambas + ~30 m de margen con ondulaciones)
 const base=[[-14,-14],[N*P,-14],[N*P,N*P],[-14,N*P]];for(let k=0;k<48;k++){const t=k/48*6.2832;base.push([MX+Math.cos(t)*MR,MZ+Math.sin(t)*MR])}
 const H=hull(base),raw=[],mm=f=>30+5*Math.sin(2*f+.8)+3*Math.sin(3*f+2.1);
 for(let i=0;i<H.length;i++){const p0=H[(i+H.length-1)%H.length],p1=H[i],p2=H[(i+1)%H.length],a0=Math.atan2(-(p1[0]-p0[0]),p1[1]-p0[1]),a1=Math.atan2(-(p2[0]-p1[0]),p2[1]-p1[1]),da=(a1-a0+6.2832)%6.2832,k=Math.max(1,Math.ceil(da/.12));for(let j=0;j<=k;j++){const f=a0+da*j/k;raw.push([p1[0]+Math.cos(f)*mm(f),p1[1]+Math.sin(f)*mm(f)])}}
 let L=0;const cl=[0];for(let i=0;i<raw.length;i++){const q=raw[(i+1)%raw.length];L+=Math.hypot(q[0]-raw[i][0],q[1]-raw[i][1]);cl.push(L)}
 let pts=[],ci=0;const K=Math.round(L/st);for(let i=0;i<K;i++){const t=L*i/K;while(cl[ci+1]<t)ci++;const p=raw[ci],q=raw[(ci+1)%raw.length],u=(t-cl[ci])/((cl[ci+1]-cl[ci])||1);pts.push([p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u])}
 for(let it=0;it<4;it++){const o=pts;pts=o.map((_,i)=>{let x=0,z=0;for(let k=-4;k<=4;k++){const q=o[(i+k+o.length)%o.length];x+=q[0];z+=q[1]}return[x/9,z/9]})}
 let h=pts.map(p=>heightRaw(p[0],p[1]));
 for(let it=0;it<6;it++){const o=h;h=o.map((_,i)=>{let q=0;for(let k=-3;k<=3;k++)q+=o[(i+k+o.length)%o.length];return q/7})}
 const ring=pts.map((p,i)=>[p[0],p[1],h[i]]),SP=[[[-14,155],[-1,0]],[[155,-14],[0,-1]],[[101,N*P],[0,1]]].map(([c0,s])=>{const d=rayRing(pts,c0,s);return[c0,[c0[0]+s[0]*d,c0[1]+s[1]*d],[c0[0]+s[0]*(d+26),c0[1]+s[1]*(d+26)]]});
 HW.junc.push(...SP.map(q=>q[1]));
 ring.push(ring[0].slice());ring.kind='ring';HW.polys.push(ring);
 const yAt=(x,z)=>{let d0=1e9,y=0;for(const p of ring){const d=Math.hypot(p[0]-x,p[1]-z);if(d<d0){d0=d;y=p[2]}}return y};
 for(const[c0,jn,en]of SP){const L1=Math.hypot(jn[0]-c0[0],jn[1]-c0[1]),L2=Math.hypot(en[0]-jn[0],en[1]-jn[1]),s=[(jn[0]-c0[0])/L1,(jn[1]-c0[1])/L1],yj0=yAt(jn[0],jn[1]),yj=yj0+Math.max(0,FL+BR-yj0); // yj0: altura natural; yj: altura de la carretera en el cruce (sube lo justo para que quepa la autopista hundida debajo)
  const spY=d=>{if(d<=L1)return yj*ssm(0,L1-10,d);const x=c0[0]+s[0]*d,z=c0[1]+s[1]*d;return yj+(heightRaw(x,z)-yj)*ssm(10,L2,d-L1)};
  // paso inferior: la carretera (tablero p[3]=spY) sube lo justo en el cruce y el suelo de debajo p[2] baja BR m (cutD), donde pasa la autopista hundida (fondo >= FL); fuera del cruce p[2]=p[3] y no hay tablero. El tablero es plano ±10 m alrededor del cruce (ssm(0,L1-10,d) y ssm(10,L2,d-L1) en spY)
  const CUT0=10,CUT1=CUTF,cutD=d=>BR*(1-ssm(CUT0,CUT1,Math.abs(d-L1))),spD=spY;
  const k=Math.round((L1+L2)/st),sp=[];for(let i=0;i<=k;i++){const d=(L1+L2)*i/k;sp.push([c0[0]+s[0]*d,c0[1]+s[1]*d,spY(d)-cutD(d),spD(d)])}sp.kind='spur';HW.polys.push(sp);
  const t=[-s[1],s[0]];
  for(const sg of[-1,1])for(const sl of[1,-1]){const cub=(p0,p1,p2,p3,n,first)=>{const o=[];for(let i=first?0:1;i<=n;i++){const u=i/n,q=1-u,w0=q*q*q,w1=3*q*q*u,w2=3*q*u*u,w3=u*u*u;o.push([w0*p0[0]+w1*p1[0]+w2*p2[0]+w3*p3[0],w0*p0[1]+w1*p1[1]+w2*p2[1]+w3*p3[1]])}return o};
   // (l,q): l = distancia al eje de la autopista hacia la ciudad, q = distancia a lo largo de ella. La rampa va paralela a 10 m hasta salir de la zona del puente y entonces se incorpora
   const EL=3.6,QE=96,l0=sl>0?19:-19,lq=[...cub([l0,0],[sl*16,0],[sl*15,34],[sl*15,54],15,true),...cub([sl*15,54],[sl*15,72],[sl*EL,76],[sl*EL,QE],12,false)],pt=(l,q)=>[jn[0]-s[0]*l+t[0]*sg*q,jn[1]-s[1]*l+t[1]*sg*q],y0=spD(sl>0?L1-19:L1+19),Mc=pt(0,QE),Mr=ring.reduce((b,p)=>Math.hypot(p[0]-Mc[0],p[1]-Mc[1])<Math.hypot(b[0]-Mc[0],b[1]-Mc[1])?p:b),M=[Mr[0],Mr[1]],y3=Mr[2],E=pt(sl*EL,QE),ux=E[0]-Mc[0],uz=E[1]-Mc[1],ul=Math.hypot(ux,uz)||1,dM=[M[0]+ux/ul*EL-E[0],M[1]+uz/ul*EL-E[1]],P0=pt(l0,0);
   const rp=lq.map((v,i)=>{const p=pt(v[0],v[1]),w=ssm(.3,1,i/(lq.length-1));return[p[0]+dM[0]*w,p[1]+dM[1]*w,y0+(y3-y0)*ssm(0,1,i/(lq.length-1))]});
   rp.kind='ramp';HW.polys.push(rp);HW.merge.push(M);HW.mouth.push(P0)}}
 // la autopista se hunde BR m en cada cruce (a ±RDF0 m del cruce está al fondo y vuelve a subir poco a poco hasta ±RDF1 m, que queda antes de donde se incorporan las rampas)
 for(const p of ring){let dd=1e9;for(const j of HW.junc)dd=Math.min(dd,Math.hypot(p[0]-j[0],p[1]-j[1]));p[2]-=Math.min(BR*(1-ssm(RDF0,RDF1,dd)),Math.max(0,p[2]-FL))}})();
// carretera de montaña: sale de la autopista (por el sur de la montaña) y sube en espiral con pendiente constante hasta la cima
(function(){const Hi=y=>{let a=RT,b=MR;for(let i=0;i<30;i++){const m=(a+b)/2;mtnH(m)>y?a=m:b=m}return(a+b)/2},ring=HW.polys[0],dl=rayRing(ring,[MX,MZ+MR],[0,1]),C=[MX,MZ+MR+dl],yS=ring.reduce((b,p)=>Math.hypot(p[0]-C[0],p[1]-C[1])<Math.hypot(b[0]-C[0],b[1]-C[1])?p:b)[2],pts=[[C[0],C[1],yS]],ds=6;let y=yS,th=Math.PI/2;pts[0]=[C[0],C[1]-9,yS];for(let t=9+ds;t<dl;t+=ds)pts.push([C[0],C[1]-t,yS]);HW.merge.push(C);HW.mouth.push(C);
 for(let k=0;k<500&&y<MH-.3;k++){const r=Hi(y)*(1+.05*Math.sin(th*5));pts.push([MX+Math.cos(th)*r,MZ+Math.sin(th)*r,y]);y+=ds*.14;th+=ds*.99/Math.max(r,8)}
 pts.push([MX+Math.cos(th)*(RT-2),MZ+Math.sin(th)*(RT-2),MH]);pts.kind='mroad';HW.polys.push(pts);HW.mt=pts})();

function mtH(x,z,r){const dx=x-MX,dz=z-MZ;if(!HW.mt||dx*dx+dz*dz>(MR+25)*(MR+25))return r;const q=hwNear(x,z,HW.mt);return q.d>=18?r:q.y+(r-q.y)*ssm(5,18,q.d)}
function hwNear(x,z,only){let bd=1e9,by=0;for(const po of(only?[only]:HW.polys))for(let i=0;i<po.length-1;i++){const p=po[i],q=po[i+1],dx=q[0]-p[0],dz=q[1]-p[1],t=clamp(((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz),0,1),ex=p[0]+dx*t-x,ez=p[1]+dz*t-z,d=ex*ex+ez*ez;if(d<bd){bd=d;by=p[2]+(q[2]-p[2])*t}}return{d:Math.sqrt(bd),y:by}}
function hwOn(x,z){return hwNear(x,z).d<4.6}
// altura de la cubierta del puente (null si no hay puente en ese punto)
function deckY(x,z){let nr=false;for(const j of HW.junc)if(Math.abs(x-j[0])<75&&Math.abs(z-j[1])<75){nr=true;break}if(!nr)return null;let bd=1e9,a=0,b=0;for(const po of HW.polys){if(po.kind!=='spur')continue;for(let i=0;i<po.length-1;i++){const p=po[i],q=po[i+1],dx=q[0]-p[0],dz=q[1]-p[1],t=clamp(((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz),0,1),ex=p[0]+dx*t-x,ez=p[1]+dz*t-z,d=ex*ex+ez*ez;if(d<bd){bd=d;a=p[2]+(q[2]-p[2])*t;b=p[3]+(q[3]-p[3])*t}}}if(bd>4.6*4.6||b-a<.05)return null;return b}
function heightAt0(x,z){const e=Math.max(-14-x,x-N*P,-14-z,z-N*P,0);if(e<=0)return 0;let r=heightRaw(x,z);if(x>=322)r=mtH(x,z,r);const q=hwNear(x,z);if(q.d>30)return r;return r+(q.y-r)*(1-ssm(14,30,q.d))}
// fábricas de las afueras (al este del barrio): el terreno se aplana debajo y delante de cada una
const FACS=[{k:'ffood',x:300,z:42,w:34,d:22,roof:0x8a3b2b,ch:[-11,-5,1]},{k:'ffurn',x:300,z:200,w:34,d:22,roof:0x5d4037,ch:[-8,4]},{k:'fcloth',x:300,z:238,w:34,d:22,roof:0x5b3a7a,ch:[-8,4]}];
const PORTH=1.5,PORTF=[[334,394,326,358],[384,394,358,400]],FLAT=[[55,147,322,350],[273,293.5,58,134]],inFac=(x,z,m)=>(x>262-m&&x<300+m&&z>56-m&&z<140+m)||FACS.some(s=>Math.abs(x-s.x)<s.w/2+6+m&&z>s.z-s.d/2-16-m&&z<s.z+s.d/2+4+m)||(x>20-m&&x<300+m&&z>318-m&&z<448+m)||(x>326-m&&x<440+m&&z>292-m&&z<404+m);
function portPf(x,z){let pf=1;for(const q of PORTF){const dx=Math.max(q[0]-x,x-q[1],0),dz=Math.max(q[2]-z,z-q[3],0),dd=Math.hypot(dx,dz);if(dd<14)pf=Math.min(pf,ssm(0,14,dd))}return pf}
function heightAt(x,z){const r=heightAt0(x,z);if(r===0){const pf=portPf(x,z);return pf<1?PORTH*(1-pf):0}let f=1;for(const s of FACS){const dx=Math.max(Math.abs(x-s.x)-s.w/2-6,0),dz=Math.max(s.z-s.d/2-16-z,z-s.z-s.d/2-4,0),q=Math.hypot(dx,dz);if(q<14)f=Math.min(f,ssm(0,14,q))}for(const q of FLAT){const dx=Math.max(q[0]-x,x-q[1],0),dz=Math.max(q[2]-z,z-q[3],0),dd=Math.hypot(dx,dz);if(dd<14)f=Math.min(f,ssm(0,14,dd))}if(r>0){const pf=portPf(x,z);if(pf<1)return r*f*pf+PORTH*(1-pf)}return r*f}
let seed=11;const rnd=()=>(seed=seed*16807%2147483647)/2147483647,pick=a=>a[rnd()*a.length|0],rr=(a,b)=>a+rnd()*(b-a);
const $=id=>document.getElementById(id);
const setTx=(e,t)=>{if(e._t!==t){e._t=t;e.textContent=t}},setBg=(e,b)=>{if(e._b!==b){e._b=b;e.style.background=b}},setDsp=(e,v)=>{if(e._d!==v){e._d=v;e.style.display=v}};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9ccbe8);scene.fog=new THREE.Fog(0x9ccbe8,100,340);
const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,IS_TOUCH?.25:.1,520);
const ren=new THREE.WebGLRenderer({antialias:!IS_TOUCH,powerPreference:'high-performance'});ren.setSize(innerWidth,innerHeight);ren.setPixelRatio(Math.min(devicePixelRatio,IS_TOUCH?1.25:1.5));ren.shadowMap.enabled=true;ren.shadowMap.type=IS_TOUCH?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;document.body.prepend(ren.domElement);
const hemi=new THREE.HemisphereLight(0xffffff,0x667788,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dd,.7);sun.position.set(80,120,40);scene.add(sun);scene.add(sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);{const c=sun.shadow.camera;c.left=-70;c.right=70;c.top=70;c.bottom=-70;c.near=1;c.far=420}sun.shadow.bias=-.0004;sun.shadow.normalBias=.7;hemi.groundColor.setHex(0x5a5f48);
// cielo: domo con degradado, resplandor y disco solar, luna y estrellas por la noche
const skyU={top:{value:new THREE.Color(0x4a86c8)},hor:{value:new THREE.Color(0x9ccbe8)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(0xfff2dd)},night:{value:0},gr:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(1000,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 vD;uniform vec3 top,hor,sunDir,sunCol;uniform float night,gr;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);vec3 c=mix(hor,top,pow(h,.5));float s=max(dot(d,sunDir),0.);float cl=1.-gr*.9;c+=sunCol*(pow(s,5.)*.16+pow(s,80.)*.45+smoothstep(.99965,.99985,s)*4.)*cl;float m=max(dot(d,-sunDir),0.);c+=vec3(.85,.9,1.)*smoothstep(.9994,.9997,m)*night*.9*cl;if(d.y<0.)c=mix(hor,hor*.85,clamp(-d.y*4.,0.,1.));vec3 p=floor(d*260.);float r=fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);c+=vec3(step(.9984,r)*night*smoothstep(.03,.25,d.y)*cl);gl_FragColor=vec4(c,1.);}'}));
sky.frustumCulled=false;sky.renderOrder=-10;sky.userData.sp=0;scene.add(sky);
ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1;
function skyUpd(d,tw,night,a){if(cam.far<1400){cam.far=1400;cam.updateProjectionMatrix()}sky.position.copy(cam.position);skyU.hor.value.copy(C1);
 skyU.top.value.setHex(0x02040c).lerp(C2.set(0x4a86c8),d).lerp(C3.set(0x56527a),tw*.5).lerp(C4.set(0x6c7682).multiplyScalar(.15+.85*d),cur.gr*.85);
 skyU.sunDir.value.set(Math.cos(a),Math.sin(a),.33).normalize();skyU.sunCol.value.copy(sun.color);skyU.night.value=night;skyU.gr.value=cur.gr}
const WINDT={value:0};
{const hv='float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float nz(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}';
THREE.MeshLambertMaterial.prototype.onBeforeCompile=function(sh){if(this.userData.nd)return;sh.uniforms.uT=WINDT;sh.uniforms.uWA={value:this.userData.wind||0};
 sh.vertexShader='varying vec3 vWP;uniform float uT,uWA;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 wo=(modelMatrix*vec4(0.,0.,0.,1.)).xy;wo=(modelMatrix*vec4(0.,0.,0.,1.)).xz;\n#ifdef USE_INSTANCING\nwo=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xz;\n#endif\ntransformed.xz+=vec2(sin(uT*1.6+wo.x*.31),cos(uT*1.2+wo.y*.27))*uWA*max(transformed.y,0.)*(.6+.4*sin(uT*.4+wo.x*.05));\nvec4 wpD=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwpD=instanceMatrix*wpD;\n#endif\nvWP=(modelMatrix*wpD).xyz;');
 sh.fragmentShader='varying vec3 vWP;\n'+hv+'\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat fa=clamp(1.-(1./gl_FragCoord.w)/110.,0.,1.);diffuseColor.rgb*=.95+.1*nz(vWP*.4)+fa*(.08*(nz(vWP*3.2)-.5)+.06*(nz(vWP*9.)-.5));')}}
const matC={};const mat=c=>matC[c]||(matC[c]=new THREE.MeshLambertMaterial({color:c}));
const colliders=[],ROOMS=[],DOORS=[],WORKERS=[],HOUSES=[],PLACES=[],BLD=[],cars=[],HB=[];
function box(x,y,z,w,h,d,c,solid,parent){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='object'?c:mat(c));m.position.set(x,y+h/2,z);
 if(parent)parent.add(m);else{scene.add(m);m.userData.st=1}
 if(solid)colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y,y1:y+h,on:true});if(!parent&&y+h>G+.6&&(w>=.8||d>=.8||h>=2))HB.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y,y1:y+h});return m}
function part(geo,c,x,y,z,parent){const m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);parent.add(m);return m}
const EMT=[],WINM=[],EMM=new Map();
function mkTex(wall,win,brick){const S=128,mk=()=>{const c=document.createElement('canvas');c.width=c.height=S;return c},c=mk(),g=c.getContext('2d'),R=Math.random;
 g.fillStyle=wall;g.fillRect(0,0,S,S);for(let i=0;i<900;i++){g.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(.02+R()*.05)+')';g.fillRect(R()*S,R()*S,1+R()*2,1+R()*2)}
 if(brick){g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let y=0;y<S;y+=8){g.beginPath();g.moveTo(0,y);g.lineTo(S,y);g.stroke();for(let x=(y/8%2)*8;x<S;x+=16){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+8);g.stroke()}}}
 g.fillStyle='rgba(0,0,0,.28)';g.fillRect(24,18,80,76);g.fillStyle='#e8e4da';g.fillRect(26,20,76,72);
 const gr=g.createLinearGradient(0,25,0,87);gr.addColorStop(0,'#9db8cc');gr.addColorStop(.55,win);gr.addColorStop(1,win);g.fillStyle=gr;g.fillRect(31,25,66,62);
 g.fillStyle='#e8e4da';g.fillRect(62,25,4,62);g.fillRect(31,54,66,3);g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.moveTo(31,25);g.lineTo(60,25);g.lineTo(31,70);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(24,94,80,5);
 const e=mk(),h=e.getContext('2d');h.fillStyle='#000';h.fillRect(0,0,S,S);for(const q of[[31,25,31,29],[66,25,31,29],[31,57,31,30],[66,57,31,30]])if(R()<.7){h.fillStyle=R()<.5?'#ffd9a0':'#ffeccc';h.fillRect(q[0],q[1],q[2],q[3])}
 const t=new THREE.CanvasTexture(c),te=new THREE.CanvasTexture(e);for(const x of[t,te]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=4}EMT.push(te);EMM.set(c,te);return t}
const TEX=[['#c9b79c','#3b556b'],['#b5654a','#2e3f52'],['#d8d2c4','#44627a'],['#8f9aa6','#26384a'],['#e0c27a','#3b556b'],['#a7b8a0','#2e4a5e']].map((a,i)=>mkTex(a[0],a[1],i===1));
function sign(text,x,y,z,w,fz,col){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
 g.fillStyle=col;g.fillRect(0,0,256,64);g.fillStyle='#fff';g.font='bold 30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,128,34,244);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));
 m.position.set(x,y,z+fz*.3);if(fz<0)m.rotation.y=Math.PI;scene.add(m)}

// =================================================================================================
// 2. PERSONAJES
//     Modelo 3D articulado de las personas, ropa y complementos (camisetas, pantalones, calzado,
//     gorros, gafas, mochilas…) y su animación.
// =================================================================================================
const SKIN=[0xf3d2b3,0xe8b98f,0xd29b6b,0xb07a4f,0x8a5a3a,0x5e3d28],HAIR=[0x16110d,0x2b1a10,0x4a2c17,0x7a4a24,0xb98a45,0xd9c58a,0x8d8d8d,0x7b2a14],
PANTS=[0x2a3550,0x3a3d45,0x544636,0x1d2740,0x4a5868,0x6a6a70,0x22303a,0x7a6a55],SHOE=[0x1a1a1a,0x1a1a1a,0xeeeeee,0x4a3020,0x2a3a6a],CAPS=[0xc0392b,0x2c3e50,0x27ae60,0x222222,0xf1c40f],IDLERS=[];
const shade=(c,k)=>new THREE.Color(c).multiplyScalar(k).getHex();
function mergeMesh(L,m){const Pp=[],Nn=[],Cc=[];L.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));return new THREE.Mesh(bg,m||charMat)}
const pG=(geo,c,x,y,z,sx,sy,sz)=>{if(sx!==undefined&&(sx!==1||sy!==1||sz!==1))geo.scale(sx,sy,sz);geo.translate(x,y,z);return[geo,c]},
pCyl=(rt,rb,h,c,x,y,z,sx,sy,sz)=>pG(new THREE.CylinderGeometry(rt,rb,h,14),c,x,y,z,sx===undefined?1:sx,sy===undefined?1:sy,sz===undefined?1:sz),
pSph=(r,c,x,y,z,sx,sy,sz)=>pG(new THREE.SphereGeometry(r,14,10),c,x,y,z,sx===undefined?1:sx,sy===undefined?1:sy,sz===undefined?1:sz),
pBx=(w,h,d,c,x,y,z)=>pG(new THREE.BoxGeometry(w,h,d),c,x,y,z,1,1,1);
// Catálogo de ropa y accesorios (tienda MODA) y lo que lleva puesto el jugador
const CLOTH={};
(function(){const A=(slot,name,price,g,o)=>{CLOTH[name]=Object.assign({slot,g,price},o)};
 // --- camisetas estampadas ---
 A('top','Camiseta calavera',30,'est',{s:'tee',c:0x1b1b1f,p:'skull',c2:0xf4f4f4});
 A('top','Camiseta corazón',28,'est',{s:'tee',c:0xf4f4f4,p:'heart',c2:0xe0314b});
 A('top','Camiseta estrella',28,'est',{s:'tee',c:0x24304f,p:'star',c2:0xf5c518});
 A('top','Camiseta rayo',28,'est',{s:'tee',c:0x2b2b30,p:'bolt',c2:0xf5c518});
 A('top','Camiseta smiley',26,'est',{s:'tee',c:0x2f7fe0,p:'smile',c2:0xf5c518});
 A('top','Camiseta arcoíris',30,'est',{s:'tee',c:0xf4f4f4,p:'rainbow',c2:0});
 A('top','Camiseta sol',28,'est',{s:'tee',c:0x2aa6a0,p:'sun',c2:0xffc107});
 A('top','Camiseta gato',30,'est',{s:'tee',c:0xf4f4f4,p:'cat',c2:0xf39c3a});
 A('top','Camiseta marinera',32,'est',{s:'tee',c:0xf4f4f4,p:'stripes',c2:0x1f3a6e});
 A('top','Camiseta de fútbol',40,'est',{s:'tee',c:0xd62828,p:'vstripes',c2:0xf4f4f4});
 // --- camisetas lisas y camisas ---
 A('top','Camiseta',25,'cam',{s:'tee',c:0xf4f4f4});
 A('top','Camiseta negra',25,'cam',{s:'tee',c:0x1f1f23});
 A('top','Camiseta roja',25,'cam',{s:'tee',c:0xc9302c});
 A('top','Camiseta azul',25,'cam',{s:'tee',c:0x2f6fc2});
 A('top','Polo',35,'cam',{s:'tee',c:0x2e6f5e,p:'polo'});
 A('top','Camisa',45,'cam',{s:'shirt',c:0x8fb4e0});
 A('top','Camisa blanca',48,'cam',{s:'shirt',c:0xf2f2f2});
 // --- abrigo ---
 A('top','Jersey de lana',50,'abr',{s:'sweater',c:0x8a3a3a,p:'band',c2:0xf0e6d2});
 A('top','Sudadera',55,'abr',{s:'hoodie',c:0x6b6f78});
 A('top','Chaqueta',95,'abr',{s:'jacket',c:0x3a2a22});
 A('top','Chaqueta vaquera',85,'abr',{s:'jacket',c:0x4f78b0});
 A('top','Chaqueta de cuero',140,'abr',{s:'jacket',c:0x1a1a1a});
 // --- pantalones ---
 A('legs','Vaqueros',60,'pan',{s:'jeans',c:0x4f78b0});
 A('legs','Vaqueros negros',65,'pan',{s:'jeans',c:0x1f2024});
 A('legs','Pantalón chino',55,'pan',{s:'jeans',c:0xc8b28a});
 A('legs','Pantalón de chándal',40,'pan',{s:'jeans',c:0x555a63});
 A('legs','Pantalón de traje',70,'pan',{s:'jeans',c:0x24262e});
 A('legs','Pantalón corto',30,'pan',{s:'shorts',c:0xb59a6a});
 A('legs','Bermudas vaqueras',35,'pan',{s:'shorts',c:0x4f78b0});
 // --- calzado ---
 A('feet','Zapatillas',80,'cal',{c:0xf2f2f2,sole:0xffffff,accent:0xd62828});
 A('feet','Zapatillas negras',85,'cal',{c:0x25252a,sole:0xdddddd,accent:0xffffff});
 A('feet','Zapatillas azules',80,'cal',{c:0x2f6fc2,sole:0xffffff,accent:0xf5c518});
 A('feet','Botas',110,'cal',{c:0x6b4423,sole:0x2a1a10,boot:.16});
 A('feet','Botas de agua',45,'cal',{c:0xf2c41d,sole:0x222222,boot:.3});
 A('feet','Zapatos de vestir',90,'cal',{c:0x111111,sole:0x3a2a1c});
 // --- gorros, sombreros y gafas ---
 A('head','Gorra',15,'cab',{s:'cap',c:0x1f3a6e});
 A('head','Gorra roja',15,'cab',{s:'cap',c:0xc9302c});
 A('head','Gorro de lana',20,'cab',{s:'beanie',c:0xc0392b});
 A('head','Sombrero',30,'cab',{s:'hat',c:0xd8c07e});
 A('head','Sombrero de copa',60,'cab',{s:'tophat',c:0x151515});
 A('head','Corona',250,'cab',{s:'crown',c:0xf5c518});
 A('eyes','Gafas de sol',20,'cab',{c:0x15181f});
 A('eyes','Gafas rosas',22,'cab',{c:0xe0568c});
 A('eyes','Gafas de espejo',28,'cab',{c:0x8fa6bf});
 A('eyes','Gafas graduadas',45,'cab',{c:0xcfeaf5});
 // --- cuello y muñeca ---
 A('neck','Bufanda',18,'cue',{c:0xc0392b});
 A('neck','Bufanda azul',18,'cue',{c:0x2f5fb0});
 A('neck','Corbata',25,'cue',{c:0xa11d2e,k:'tie'});
 A('neck','Pajarita',22,'cue',{c:0x1b1b1b,k:'bow'});
 A('neck','Collar de oro',120,'cue',{c:0xf5c518,k:'chain'});
 A('wrist','Reloj',35,'cue',{});
 A('wrist','Reloj dorado',150,'cue',{c:0xc9a227,f:0xf1d36b});
 A('wrist','Pulsera',12,'cue',{c:0xd62828,k:'band'});
 // --- mochilas y capas ---
 A('back','Mochila',40,'esp',{c:0x2e6f5e});
 A('back','Mochila roja',40,'esp',{c:0xc0392b});
 A('back','Mochila azul',40,'esp',{c:0x2f5fb0});
 A('back','Capa de superhéroe',75,'esp',{c:0xd62828,k:'cape'});
})();
const worn={};
function outfitOpts(w,dt){w=w||worn;const o={noIdle:1,fixed:1,fem:false,skin:0xe8b98f,hair:0x3b2314,pants:0x2a3550,shoe:0x3a2a1c,top:{s:'tee',c:dt||0xdd3322}};
 for(const sl in w){const it=CLOTH[w[sl]];if(!it)continue;
  if(sl==='top')o.top={s:it.s,c:it.c,p:it.p,c2:it.c2};else if(sl==='legs'){o.legs={s:it.s};o.pants=it.c}else o[sl]=it}
 return o}
function person(shirt,o){o=o||{};const R=Math.random,pk=a=>a[R()*a.length|0],
 fem=o.fem!=null?!!o.fem:R()<.5,skin=o.skin||pk(SKIN),hair=o.hair||pk(HAIR),pants=o.pants||pk(PANTS),shoe=(o.feet&&o.feet.c)||o.shoe||pk(SHOE),
 T=o.top||{s:(o.sleeve!=null?!!o.sleeve:R()<.3)?'long':'tee',c:shirt},ts=T.s,tc=T.c,lng=ts!=='tee',jk=ts==='jacket'?.012:0,jj=ts==='jacket'?.006:0,
 shorts=!!(o.legs&&o.legs.s==='shorts'),HD=o.head,hat=!!(HD&&HD.s==='hat'),hds=HD&&HD.s,cover=!!(hds==='beanie'||hds==='tophat'),cap=HD?HD.s==='cap':(o.cap!=null?!!o.cap:(!fem&&R()<.15)),capC=(HD&&HD.s==='cap')?HD.c:pk(CAPS),
 hs=fem?(R()<.75?'long':'short'):(R()<.08?'bald':'short'),
 sh=fem?.185:.21,wst=fem?.145:.165,hipR=fem?.185:.17,skD=shade(skin,.92),hD=shade(hair,.8),iris=pk([0x3b2a1a,0x2a4a6a,0x3a5a3a]),
 zf=y=>(wst+jk+(sh-wst)*((y-.02)/.56))*.58;
 const g=new THREE.Group(),hips=new THREE.Group(),up=new THREE.Group();hips.position.y=.94;g.add(hips);hips.add(up);
 // torso + pelvis + hombros
 const TM=[pCyl(sh+jk,wst+jk,.56,tc,0,.3,0,1,1,.58),pCyl(wst+.015,hipR,.22,pants,0,-.06,0,1,1,.62),pCyl(wst+.012,wst+.012,.05,shade(pants,.5),0,.05,0,1,1,.62),
  pSph(.07+jj,tc,sh+.012,.52,0),pSph(.07+jj,tc,-sh-.012,.52,0)];
 if(fem)TM.push(pSph(.06,tc,.065,.4,.05,1,1,.8),pSph(.06,tc,-.065,.4,.05,1,1,.8));
 if(ts==='shirt'){TM.push(pCyl(.082,.088,.035,shade(tc,.92),0,.595,.005,1,1,.95));for(let k=0;k<4;k++){const y=.5-k*.11;TM.push(pSph(.0085,0xf4f4f4,0,y,zf(y)+.004))}}
 if(ts==='jacket'){TM.push(pCyl(.09,.098,.045,shade(tc,.85),0,.6,.005,1,1,1));const zg=new THREE.BoxGeometry(.012,.54,.008);zg.rotateX(.0466);TM.push(pG(zg,0xbfc3c8,0,.3,zf(.3)+.004,1,1,1),pBx(.07,.012,.01,shade(tc,.7),.1,.2,zf(.2)+.003),pBx(.07,.012,.01,shade(tc,.7),-.1,.2,zf(.2)+.003))}
 const rad=y=>wst+jk+(sh-wst)*((y-.02)/.56),zc=y=>zf(y)+.005,
  dsc=(r,c,x,y,z)=>{const g=new THREE.CylinderGeometry(r,r,.008,16);g.rotateX(Math.PI/2);return pG(g,c,x,y,z,1,1,1)},
  rbx=(w,h,c,x,y,z,rz,rx)=>{const g=new THREE.BoxGeometry(w,h,.008);if(rx)g.rotateX(rx);g.rotateZ(rz||0);return pG(g,c,x,y,z,1,1,1)};
 const TP=T.p,c2=T.c2;
 if(TP==='heart'){TM.push(dsc(.036,c2,-.032,.44,zc(.44)),dsc(.036,c2,.032,.44,zc(.44)),rbx(.07,.07,c2,0,.41,zc(.41),Math.PI/4))}
 else if(TP==='star'){TM.push(rbx(.1,.1,c2,0,.42,zc(.42),0),rbx(.1,.1,c2,0,.42,zc(.42)+.001,Math.PI/4))}
 else if(TP==='bolt'){TM.push(rbx(.032,.1,c2,.012,.455,zc(.45),.5),rbx(.032,.1,c2,-.012,.375,zc(.38),.5),rbx(.075,.026,c2,0,.415,zc(.415)+.001,0))}
 else if(TP==='skull'){TM.push(dsc(.05,c2,0,.445,zc(.44)),rbx(.056,.044,c2,0,.39,zc(.39),0),dsc(.014,0x111111,-.021,.447,zc(.44)+.003),dsc(.014,0x111111,.021,.447,zc(.44)+.003),rbx(.012,.014,0x111111,0,.425,zc(.43)+.003,0),rbx(.005,.03,0x111111,-.012,.39,zc(.39)+.003,0),rbx(.005,.03,0x111111,.012,.39,zc(.39)+.003,0))}
 else if(TP==='smile'){TM.push(dsc(.065,c2,0,.41,zc(.41)),dsc(.009,0x111111,-.022,.427,zc(.42)+.003),dsc(.009,0x111111,.022,.427,zc(.42)+.003));[[-.03,.396],[-.015,.386],[0,.382],[.015,.386],[.03,.396]].forEach(q=>TM.push(dsc(.0065,0x111111,q[0],q[1],zc(.39)+.003)))}
 else if(TP==='rainbow'){[0xe53935,0xfb8c00,0xfdd835,0x43a047,0x1e88e5].forEach((c,i)=>TM.push(dsc(.075-i*.012,c,0,.4,zc(.4)+i*.0015)));TM.push(rbx(.17,.07,tc,0,.362,zc(.4)+.01,0))}
 else if(TP==='sun'){[0,Math.PI/2,Math.PI/4,-Math.PI/4].forEach(a=>TM.push(rbx(.012,.125,c2,0,.41,zc(.41),a)));TM.push(dsc(.04,c2,0,.41,zc(.41)+.002))}
 else if(TP==='cat'){TM.push(pCyl(0,.022,.045,c2,-.034,.462,zc(.46)),pCyl(0,.022,.045,c2,.034,.462,zc(.46)),dsc(.052,c2,0,.41,zc(.41)),dsc(.008,0x111111,-.02,.418,zc(.41)+.003),dsc(.008,0x111111,.02,.418,zc(.41)+.003),dsc(.008,0xe58a9b,0,.4,zc(.4)+.003),rbx(.05,.004,0x444444,0,.392,zc(.39)+.003,.2),rbx(.05,.004,0x444444,0,.392,zc(.39)+.003,-.2))}
 else if(TP==='stripes'){for(let y=.1;y<.56;y+=.1)TM.push(pCyl(rad(y+.0175)+.004,rad(y-.0175)+.004,.035,c2,0,y,0,1,1,.58))}
 else if(TP==='vstripes'){[-.07,-.03,.03,.07].forEach(x=>TM.push(rbx(.02,.5,c2,x,.3,zc(.3),0,.0466)));TM.push(dsc(.016,c2,.085,.5,zc(.5)))}
 else if(TP==='band'){TM.push(pCyl(rad(.44)+.004,rad(.36)+.004,.08,c2,0,.4,0,1,1,.58))}
 else if(TP==='polo'){TM.push(pCyl(.085,.092,.04,shade(tc,1.25),0,.595,.005,1,1,.95),pBx(.03,.14,.008,shade(tc,.85),0,.5,zc(.5)));for(let k=0;k<2;k++)TM.push(pSph(.0085,0xf4f4f4,0,.54-k*.045,zc(.5)+.004))}
 if(ts==='hoodie'){TM.push(pSph(.1,tc,0,.6,-.075,1.3,.75,.95),pCyl(.088,.095,.04,shade(tc,.8),0,.6,.005,1,1,1),pBx(.2,.09,.01,shade(tc,.85),0,.14,zf(.14)+.006),pBx(.01,.1,.008,0xeeeeee,-.032,.5,zc(.5)),pBx(.01,.1,.008,0xeeeeee,.032,.5,zc(.5)));TM.push(pCyl(rad(.08)+.004,rad(.02)+.004,.06,shade(tc,.82),0,.05,0,1,1,.58))}
 if(ts==='sweater'){TM.push(pCyl(.085,.092,.06,shade(tc,.88),0,.6,.005,1,1,1),pCyl(rad(.08)+.004,rad(.02)+.004,.06,shade(tc,.82),0,.05,0,1,1,.58))}
 if(o.neck){const nc=o.neck.c,nk=o.neck.k;
  if(!nk)TM.push(pCyl(.078,.085,.075,nc,0,.605,.005,1,1,1),pCyl(.0805,.0875,.02,shade(nc,.7),0,.6,.005,1,1,1),pBx(.07,.3,.03,nc,.05,.43,.12));
  else{if(ts!=='shirt'&&nk!=='chain')TM.push(pCyl(.084,.09,.035,0xf4f4f4,0,.595,.005,1,1,.98));
   if(nk==='tie')TM.push(pBx(.034,.04,.02,nc,0,.575,zf(.575)+.012),pBx(.048,.2,.012,nc,0,.465,zf(.465)+.01),pBx(.04,.04,.012,nc,0,.35,zf(.35)+.01));
   else if(nk==='bow')TM.push(pSph(.016,shade(nc,1.3),0,.575,zf(.575)+.01),pBx(.045,.032,.012,nc,.036,.575,zf(.575)+.008),pBx(.045,.032,.012,nc,-.036,.575,zf(.575)+.008));
   else if(nk==='chain'){const tg=new THREE.TorusGeometry(.088,.007,6,22);tg.rotateX(Math.PI/2);const pg=new THREE.BoxGeometry(.03,.03,.014);pg.rotateZ(Math.PI/4);TM.push(pG(tg,nc,0,.586,.0,1,1,1.38),pBx(.007,.03,.007,nc,0,.565,.126),pG(pg,nc,0,.538,.127,1,1,1),pSph(.008,0xd62828,0,.538,.136))}}}
 //
 if(o.back&&o.back.k==='cape'){const bc=o.back.c,cg=new THREE.BoxGeometry(.4,.8,.016);cg.rotateX(.07);TM.push(pG(cg,bc,0,.18,-.145,1,1,1),pCyl(.1,.108,.045,shade(bc,.8),0,.6,-.005,1,1,1),pSph(.02,0xf5c518,.095,.585,.05),pSph(.02,0xf5c518,-.095,.585,.05),pBx(.2,.012,.012,0xf5c518,0,.585,.1))}
 if(o.back&&!o.back.k){const bc=o.back.c;TM.push(pBx(.3,.38,.14,bc,0,.33,-.175),pBx(.3,.08,.15,shade(bc,.85),0,.55,-.175),pBx(.2,.14,.06,shade(bc,1.2),0,.2,-.24),pBx(.045,.34,.015,0x1b1b1b,.1,.36,.118),pBx(.045,.34,.015,0x1b1b1b,-.1,.36,.118),pBx(.045,.015,.2,0x1b1b1b,.1,.545,-.0),pBx(.045,.015,.2,0x1b1b1b,-.1,.545,-.0))}
 up.add(mergeMesh(TM));
 // cabeza
 const H=[pCyl(.045,.05,.1,skin,0,.04,0),pSph(.115,skin,0,.19,0,.92,1.08,1),pSph(.026,skD,.108,.19,0,.5,1,.8),pSph(.026,skD,-.108,.19,0,.5,1,.8),
  pSph(.019,shade(skin,.96),0,.172,.118,.9,1.1,1.2),pBx(.042,.008,.01,fem?0xb04a55:0x8a4a4a,0,.13,.106)];
 [-1,1].forEach(s=>{H.push(pSph(.017,0xf5f5f5,s*.04,.205,.097,1,.8,.5),pSph(.0105,iris,s*.04,.205,.103,1,1,.5),pBx(.045,.008,.01,hD,s*.04,.228,.106))});
 if(hs!=='bald'){if(!cap&&!hat&&!cover)H.push(pG(new THREE.SphereGeometry(.123,10,8,0,Math.PI*2,0,Math.PI*.37),hair,0,.2,-.006,.94,1.1,1.02));
  H.push(pG(new THREE.SphereGeometry(.123,10,8,Math.PI,Math.PI,0,Math.PI*(hs==='long'?.8:.72)),hair,0,.2,-.006,.94,1.1,1.02),pBx(.016,.05,.04,hair,.1,.2,.03),pBx(.016,.05,.04,hair,-.1,.2,.03));
  if(hs==='long')H.push(pSph(.13,hair,0,.02,-.06,.92,1.55,.62))}
 if(cap)H.push(pG(new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,0,Math.PI*.5),capC,0,.236,0,.95,1,1.04),pBx(.17,.012,.1,capC,0,.236,.12));
 if(hat)H.push(pCyl(.085,.095,.11,HD.c,0,.31,0),pCyl(.0965,.0965,.026,0x5a3a22,0,.2675,0),pCyl(.19,.19,.01,HD.c,0,.255,0,1,1,1.04));
 if(hds==='beanie'){const bc=HD.c;H.push(pG(new THREE.SphereGeometry(.13,12,8,0,Math.PI*2,0,Math.PI*.5),bc,0,.245,0,.96,1.06,1.05),pCyl(.134,.134,.05,shade(bc,1.18),0,.252,0,.96,1,1.05),pSph(.032,shade(bc,1.25),0,.385,0))}
 if(hds==='tophat'){const hc=HD.c;H.push(pCyl(.09,.095,.2,hc,0,.37,0),pCyl(.1,.1,.035,0x8a1f2b,0,.29,0),pCyl(.16,.16,.012,hc,0,.272,0,1,1,1.04))}
 if(hds==='crown'){const gc=HD.c;H.push(pCyl(.1,.088,.06,gc,0,.32,0,1,1,1.02));for(let k=0;k<6;k++){const an=k*Math.PI/3;H.push(pCyl(0,.026,.07,gc,Math.sin(an)*.094,.385,Math.cos(an)*.094*1.02),pSph(.011,k%2?0x3a9ad9:0xd62828,Math.sin(an)*.095,.325,Math.cos(an)*.097))}}
 if(o.eyes){const lc=o.eyes.c,fr=0x0a0a0a;[-1,1].forEach(s=>{H.push(pBx(.056,.042,.01,fr,s*.04,.205,.1155),pBx(.05,.036,.012,lc,s*.04,.205,.119),pBx(.008,.008,.12,fr,s*.095,.208,.05))});H.push(pBx(.02,.008,.012,fr,0,.212,.1165))}
 const headG=new THREE.Group();headG.position.y=.58;headG.add(mergeMesh(H));up.add(headG);
 // brazos
 const mkArm=s=>{const a=new THREE.Group();a.position.set(s*(sh+.025),.52,0);a.rotation.z=s*.07;
  a.add(mergeMesh(lng?[pCyl(.052+jj,.044+jj,.28,tc,0,-.14,0),pSph(.045+jj,tc,0,-.28,0)]:[pCyl(.052,.046,.17,tc,0,-.085,0),pCyl(.046,.041,.115,skin,0,-.2275,0),pSph(.043,skin,0,-.28,0)]));
  const F=[pCyl(.042+jj,.034+jj,.25,lng?tc:skin,0,-.125,0),pSph(.04,skin,0,-.285,.006,.85,1.2,.65)];
  if(lng&&ts!=='tee')F.push(pCyl(.036+jj,.036+jj,.03,shade(tc,.8),0,-.235,0));
  if(s===1&&o.wrist){const wb=o.wrist.c||0x1d1d1d;if(o.wrist.k==='band')F.push(pCyl(.0385,.0365,.03,wb,0,-.2,0),pSph(.01,0xf4f4f4,.039,-.2,0));else F.push(pCyl(.0385,.0365,.028,wb,0,-.2,0),pBx(.013,.034,.034,o.wrist.f||0xcfd2d6,.04,-.2,0),pBx(.006,.024,.024,o.wrist.f?0x3a2c0a:0x101010,.0465,-.2,0))}
  const e=new THREE.Group();e.position.y=-.28;e.add(mergeMesh(F));a.add(e);up.add(a);return[a,e]};
 const[aP,eP]=mkArm(1),[aM,eM]=mkArm(-1);
 // piernas
 const sole=(o.feet&&o.feet.sole)||0x222222,acc=o.feet&&o.feet.accent;
 const mkLeg=s=>{const l=new THREE.Group();l.position.set(s*.09,-.02,0);
  l.add(mergeMesh(shorts?[pCyl(.09,.084,.22,pants,0,-.11,0),pCyl(.085,.085,.02,shade(pants,.88),0,-.22,0),pCyl(.0775,.066,.24,skin,0,-.34,0),pSph(.066,skin,0,-.46,0)]:[pCyl(.088,.066,.46,pants,0,-.23,0),pSph(.066,pants,0,-.46,0)]));
  const k=new THREE.Group();k.position.y=-.46;
  const K=[pCyl(.064,.05,.41,shorts?skin:pants,0,-.205,0),pBx(.1,.06,.26,shoe,0,-.43,.05),pSph(.052,shoe,0,-.425,.16,.95,.75,1.1),pBx(.104,.014,.27,sole,0,-.453,.05)];
  if(acc)K.push(pBx(.104,.04,.06,acc,0,-.43,-.045));
  if(o.feet&&o.feet.boot){const bh=o.feet.boot;K.push(pCyl(.07,.062,bh,shoe,0,-.41+bh/2,0),pCyl(.073,.073,.02,shade(shoe,.8),0,-.41+bh,0))}
  k.add(mergeMesh(K));l.add(k);hips.add(l);return[l,k]};
 const[lP,kP]=mkLeg(1),[lM,kM]=mkLeg(-1);
 g.userData.P={hips,up,headG,aP,aM,eP,eM,lP,lM,kP,kM,amp:0,mode:0,pm:1,mw:0,ph0:R()*6.28};
 if(!o.fixed)g.scale.setScalar(.94+R()*.12);
 if(!o.noIdle)IDLERS.push(g);
 return g}
// reconstruye el aspecto de un personaje (conserva postura y animación)
function redress(g){const u=g.userData.P,keep=u?{mode:u.mode,pm:u.pm,mw:u.mw,amp:u.amp,ph0:u.ph0}:{},n=person(0xdd3322,outfitOpts());
 while(g.children.length){const c=g.children[0];g.remove(c);c.traverse(x=>{if(x.geometry)x.geometry.dispose()})}
 const hp=n.children[0];n.remove(hp);g.add(hp);g.userData.P=Object.assign(n.userData.P,keep)}
function applyOutfit(){redress(body);redress_riders()}
function redress_riders(){cars.forEach(c=>{const rd=c.m&&c.m.userData&&c.m.userData.rider;if(rd){redress(rd);animPerson(rd,0,0,1)}})}
const POSE={1:{hy:.54,th:-1.5,kn:1.5,ar:-.45,el:-.95,lean:.04,hd:0},2:{hy:.54,th:-1.2,kn:1.45,ar:-2.15,el:-.2,lean:.95,hd:-.7}};
function setSit(g,on){const u=g.userData.P;if(u){u.mode=on?1:0;if(on)u.pm=1}}
function animPerson(g,ph,amp,dt){const u=g.userData.P;if(!u)return;const k=Math.min(1,10*dt),t=performance.now()/1000+u.ph0;
 u.amp+=(amp-u.amp)*k;u.mw+=((u.mode?1:0)-u.mw)*k;if(u.mode)u.pm=u.mode;
 const a=u.amp,w=u.mw,p=POSE[u.pm],s=Math.sin(ph),c=Math.cos(ph),c2=-c,L=(x,y)=>x+(y-x)*w,q=1-Math.min(1,a);
 u.hips.position.y=L(.94,p.hy);
 u.lP.rotation.x=L(-s*.65*a,p.th);u.lM.rotation.x=L(s*.65*a,p.th);
 u.kP.rotation.x=L(Math.max(0,c)*.95*a+.04*a,p.kn);u.kM.rotation.x=L(Math.max(0,c2)*.95*a+.04*a,p.kn);
 u.aP.rotation.x=L(s*.55*a+Math.sin(t*1.3)*.03*q,p.ar);u.aM.rotation.x=L(-s*.55*a+Math.sin(t*1.3+1.7)*.03*q,p.ar);
 u.eP.rotation.x=L(-(.18+a*(.25-.2*s)),p.el);u.eM.rotation.x=L(-(.18+a*(.25+.2*s)),p.el);
 u.up.rotation.x=L(.05*a,p.lean);u.up.rotation.y=L(s*.12*a,0);
 u.up.scale.set(1,1+.006*Math.sin(t*1.8),1+.012*Math.sin(t*1.8));
 u.headG.rotation.x=L(0,p.hd);u.headG.rotation.y=L(-s*.12*a+Math.sin(t*.45)*.28*q,0)}

// =================================================================================================
// 3. COCHES
//     Tipos de vehículo (SPEC), materiales, modelo 3D, creación de coches (spawnCar) y mejoras del taller (applyUp).
// =================================================================================================
const SPEC={hatch:{l:3.8,w:1.7,h:.75,cab:.65,max:26,acc:9,tank:40,k:.003,name:'Utilitario'},sport:{l:4.4,w:1.9,h:.55,cab:.45,max:45,acc:18,tank:60,k:.0042,name:'Deportivo'},van:{l:5,w:2,h:1.5,cab:.5,max:22,acc:7,tank:70,k:.0038,name:'Furgoneta'},moto:{l:2.1,w:.8,h:.6,cab:0,max:48,acc:20,tank:14,k:.0009,name:'Moto'},bici:{l:1.8,w:.5,h:.6,cab:0,max:9,acc:5,tank:1,k:0,nf:1,name:'Bicicleta'},patinete:{l:1.3,w:.5,h:.6,cab:0,max:7,acc:6,tank:1,k:0,nf:1,name:'Patinete'}};
const carMat=new THREE.MeshLambertMaterial({vertexColors:true});carMat.userData.nd=1;
const charMat=new THREE.MeshPhongMaterial({vertexColors:true,specular:0x2c2c2c,shininess:30});
const carEnv=(()=>{const S=64,mk=f=>{const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 if(f==='py'){x.fillStyle='#4a86c8';x.fillRect(0,0,S,S);x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.arc(20,40,14,0,7);x.fill()}
 else if(f==='ny'){x.fillStyle='#3a3d42';x.fillRect(0,0,S,S)}
 else{const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#4a86c8');g.addColorStop(.46,'#d6ecf8');g.addColorStop(.5,'#8a8f94');g.addColorStop(1,'#34373c');x.fillStyle=g;x.fillRect(0,0,S,S);if(f==='px'){x.fillStyle='#fff';x.fillRect(38,8,12,14)}}
 return c};const t=new THREE.CubeTexture(['px','nx','py','ny','pz','nz'].map(mk));t.needsUpdate=true;return t})();
const paintMat=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.55,roughness:.2,envMap:carEnv,envMapIntensity:1.1});
const glassMat=new THREE.MeshStandardMaterial({color:0x0f1b27,metalness:.9,roughness:.05,envMap:carEnv,envMapIntensity:1.5,transparent:true,opacity:.82});
const headMat=new THREE.MeshStandardMaterial({color:0xf4f0e0,emissive:0xfff2c0,emissiveIntensity:.3,roughness:.2,metalness:.3});
const tailMat=new THREE.MeshStandardMaterial({color:0x8a0d12,emissive:0xff1a1a,emissiveIntensity:.5,roughness:.25});
const carGlowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const GM=(c)=>new THREE.MeshBasicMaterial({map:carGlowTex,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}),glowH=GM(0xfff0c0),glowT=GM(0xff2020),glowGeo=new THREE.PlaneGeometry(.75,.45);
const beamMat=new THREE.MeshBasicMaterial({vertexColors:true,color:0xfff0c8,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,opacity:0});
const beamGeo=(()=>{const g=new THREE.ConeGeometry(1.6,10,18,1,true),p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const t=(p.getY(i)+5)/10;c.push(t*.8,t*.8,t*.8)}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.rotateX(-Math.PI/2);g.translate(0,0,5);g.rotateX(.09);return g})();
function carLightsUpd(night){const a=Math.min(1,Math.max(0,(night-.15)/.5));
 paintMat.envMapIntensity=1.1*(1-.8*night);glassMat.envMapIntensity=1.5*(1-.8*night);
 headMat.emissiveIntensity=.3+1.7*a;tailMat.emissiveIntensity=.5+1.5*a;
 glowH.opacity=.1+.7*a;glowT.opacity=.28+.62*a;beamMat.opacity=.32*a;
 for(const c of cars){const b=c.m&&c.m.userData.beams;if(b)b.visible=a>0&&(c===inCar||Math.abs(c.v||0)>.4)}}
// elipsoide "cuadrado" (superelipsoide): carrocería de formas redondeadas
function SE(sx,sy,sz,n,x,y,z,rx){const g=new THREE.SphereGeometry(1,14,10),p=g.attributes.position,nm=g.attributes.normal,e=2/n,hx=sx/2,hy=sy/2,hz=sz/2,P=v=>Math.sign(v)*Math.pow(Math.abs(v),e),Q=(v,h)=>Math.sign(v)*Math.pow(Math.abs(v),n-1)/h;
 for(let i=0;i<p.count;i++){const a=P(p.getX(i)),b=P(p.getY(i)),c=P(p.getZ(i));p.setXYZ(i,a*hx,b*hy,c*hz);const na=Q(a,hx),nb=Q(b,hy),nc=Q(c,hz),d=Math.hypot(na,nb,nc)||1;nm.setXYZ(i,na/d,nb/d,nc/d)}
 if(rx)g.rotateX(rx);g.translate(x,y,z);return g}
function packM(L,m){const Pp=[],Nn=[],Cc=[];L.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));return new THREE.Mesh(bg,m)}
function bikeMesh(t,col){const L=[],A=(sx,sy,sz,x,y,z,c,rx)=>{const g=new THREE.BoxGeometry(sx,sy,sz);if(rx)g.rotateX(rx);g.translate(x,y,z);L.push([g,c])},Cy=(r,wd,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,wd,14);g.rotateZ(Math.PI/2);g.translate(x,y,z);L.push([g,c])},b=t==='bici';
 if(b){Cy(.36,.06,0,.36,.7,0x151515);Cy(.36,.06,0,.36,-.7,0x151515);A(.06,.06,1.1,0,.62,0,col);A(.06,.5,.06,0,.62,-.3,col);A(.14,.05,.28,0,.92,-.35,0x222222);A(.05,.55,.05,0,.75,.62,0xaaaaaa,-.25);A(.55,.05,.05,0,1.02,.56,0x111111);A(.1,.08,.06,0,.95,.7,0xfff3c0)}
 else{Cy(.14,.05,0,.14,.55,0x151515);Cy(.14,.05,0,.14,-.55,0x151515);A(.22,.05,1.1,0,.22,0,col);A(.05,.9,.05,0,.68,.52,0xaaaaaa,-.1);A(.5,.05,.05,0,1.12,.5,0x111111);A(.08,.06,.06,0,.22,-.58,0xcc1111)}
 const Pp=[],Nn=[],Cc=[];L.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
 const g=new THREE.Group();g.add(new THREE.Mesh(bg,carMat));const rd=person(0x2c6fbb,outfitOpts());rd.userData.P.mode=2;rd.userData.P.pm=2;rd.userData.P.mw=1;animPerson(rd,0,0,1);rd.scale.set(.85,.85,.85);rd.position.set(0,b?.5:.12,b?-.25:-.2);rd.visible=false;g.add(rd);g.userData.rider=rd;return g}
function motoMesh(col){const L=[],A=(sx,sy,sz,x,y,z,c,rx)=>{const g=new THREE.BoxGeometry(sx,sy,sz);if(rx)g.rotateX(rx);g.translate(x,y,z);L.push([g,c])},Cy=(r,wd,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,wd,14);g.rotateZ(Math.PI/2);g.translate(x,y,z);L.push([g,c])};
 Cy(.34,.16,0,.34,.78,0x151515);Cy(.2,.18,0,.34,.78,0xb8bcc2);Cy(.34,.2,0,.34,-.78,0x151515);Cy(.2,.22,0,.34,-.78,0xb8bcc2);
 A(.22,.28,1,0,.55,-.2,0x222222);A(.32,.3,.7,0,.95,.1,col);A(.3,.12,.7,0,.9,-.5,0x222222);A(.12,.12,.5,0,.75,-.9,col);
 A(.09,.8,.09,0,.68,.66,0xaaaaaa,-.3);A(.7,.06,.06,0,1.08,.56,0x111111);A(.16,.14,.1,0,1,.74,0xfff3c0);A(.1,.1,.06,0,.82,-1.02,0xcc1111);A(.16,.04,.4,0,.7,.88,col);A(.16,.04,.45,0,.6,-.9,0x222222);
 const Pp=[],Nn=[],Cc=[];L.forEach(a=>{const n=a[0].toNonIndexed(),c=new THREE.Color(a[1]),pa=n.attributes.position,na=n.attributes.normal;for(let i=0;i<pa.count;i++){Pp.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));Cc.push(c.r,c.g,c.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
 const g=new THREE.Group();g.add(new THREE.Mesh(bg,carMat));const rd=person(0xdd3322,outfitOpts());rd.userData.P.mode=2;rd.userData.P.pm=2;rd.userData.P.mw=1;animPerson(rd,0,0,1);rd.scale.set(.85,.85,.85);rd.position.set(0,.54,-.3);rd.visible=false;g.add(rd);g.userData.rider=rd;return g}
function carMesh(t,col){const s=SPEC[t],w=s.w,l=s.l,h=s.h,y0=.32,sp=t==='sport',van=t==='van';
 if(t==='moto')return motoMesh(col);if(t==='bici'||t==='patinete')return bikeMesh(t,col);
 const P=[],G=[],H=[],T=[],K=[],p=(g,c)=>P.push([g,c==null?col:c]),
 A=(sx,sy,sz,x,y,z,c)=>{K.push([new THREE.BoxGeometry(sx,sy,sz).translate(x,y,z),c])},
 Cy=(r,wd,x,y,z,c)=>{const g=new THREE.CylinderGeometry(r,r,wd,18);g.rotateZ(Math.PI/2);g.translate(x,y,z);K.push([g,c])};
 if(van){p(SE(w,h,l*.66,5,0,y0+h/2,-l*.17));p(SE(w,h*.72,l*.36,4.2,0,y0+h*.36,l*.32));
  G.push([SE(w+.05,h*.22,l*.2,3,0,y0+h*.56,l*.3),0]);G.push([SE(w*.8,h*.32,.18,3,0,y0+h*.58,l*.46,-.9),0])}
 else{const cb=y0+h*.55,cab=s.cab;
  p(SE(w,h*.7,l,4.4,0,y0+h*.34,0));
  G.push([SE(w*.88,cab,l*.5,3.4,0,cb+cab*.45,-l*.06),0]);
  p(SE(w*.8,cab*.3,l*.42,3.4,0,cb+cab*.9,-l*.07));
  [-1,1].forEach(q=>{p(SE(.1,.09,.2,3,q*(w*.5+.05),cb+cab*.2,l*.12));[-1,1].forEach(m=>p(SE(.16,.34,.95,3,q*(w/2-.04),y0+.24,m*l*.32)))});
  if(sp){p(SE(.34,.03,l*.4,3,0,cb+cab*1.04,-l*.07),0xffffff);K.push([SE(w*.9,.06,.4,3,0,y0+h+.3,-l/2+.3),0x111111]);[-1,1].forEach(q=>K.push([SE(.06,.25,.1,3,q*w*.3,y0+h+.15,-l/2+.3),0x111111]))}}
 [-1,1].forEach(q=>{[-1,1].forEach(m=>{Cy(.34,.26,q*(w/2-.05),.34,m*l*.32,0x151515);Cy(.2,.28,q*(w/2-.05),.34,m*l*.32,0xb8bcc2)});
  H.push([SE(.34,.14,.1,3,q*w*.34,y0+h*.42,l/2-.04),0]);T.push([SE(.46,.1,.08,3,q*w*.32,y0+h*.46,-l/2+.03),0])});
 K.push([SE(w,.16,.18,3.5,0,y0+.1,l/2-.04),0x2a2a2a],[SE(w,.16,.18,3.5,0,y0+.1,-l/2+.04),0x2a2a2a]);
 A(w*.4,.14,.06,0,y0+h*.3,l/2,0x111111);A(.5,.12,.04,0,y0+.12,-l/2-.07,0xffffff);
 const g=new THREE.Group();[[P,paintMat],[G,glassMat],[H,headMat],[T,tailMat],[K,carMat]].forEach(a=>{if(a[0].length)g.add(packM(a[0],a[1]))});
 const bm=new THREE.Group();bm.visible=false;
 [-1,1].forEach(q=>{const b=new THREE.Mesh(beamGeo,beamMat);b.position.set(q*w*.34,y0+h*.42,l/2-.02);bm.add(b);
  const gh=new THREE.Mesh(glowGeo,glowH);gh.position.set(q*w*.34,y0+h*.42,l/2+.04);g.add(gh);
  const gt=new THREE.Mesh(glowGeo,glowT);gt.rotation.y=Math.PI;gt.position.set(q*w*.32,y0+h*.46,-l/2-.05);g.add(gt)});
 g.add(bm);g.userData.beams=bm;return g}
function spawnCar(t,col,x,z,h,mode,extra){const m=carMesh(t,col);m.userData.col=col;scene.add(m);
 const c=Object.assign({m,t,spec:SPEC[t],x,z,h,v:0,mode,fuel:SPEC[t].tank*(.3+Math.random()*.7)},extra||{});if(c.lm||c.lt)applyUp(c);m.position.set(x,c.y||0,z);m.rotation.y=h;cars.push(c);return c}
