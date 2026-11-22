/* ===============================================================================================
   FICHA · puerto.js
   Qué hay:          Puerto, barcos y pesca (sección 7): modelos de barcos, navegar, red de arrastre, lonja y construcción del puerto.
   Tócalo si quieres: añadir un barco, cambiar la pesca o la lonja, cambiar el puerto
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 7. PUERTO, BARCOS Y PESCA
//     Puerto de la zona E, barcos (modelos, navegar y sincronización con otros jugadores), pesca y lonja.
// =================================================================================================

// ---------- 7.1 Puerto (zona E del mapa: bahía al sur de la autopista, junto a la costa del aeropuerto) ----------
// Explanada de hormigón con oficina y almacén, muelle 1 de carga (grúa pórtico, buque y faro), muelle 2 de madera para pesqueros y contenedores.
// Todo va alineado con los ejes del mundo (los suelos FLOORS son rectángulos). Usa su propio azar para no alterar la semilla global.
const PORTBOATS=[];
function portUpd(t){for(const b of PORTBOATS){const g=b.g;g.position.y=b.y+Math.sin(t*b.sp+b.ph)*.035;g.rotation.z=Math.sin(t*b.sp*.8+b.ph+1)*b.roll;g.rotation.x=Math.sin(t*b.sp*.6+b.ph+2)*b.roll*.6}}

// ---------- 7.2 Barcos: modelos y amarre (fase 1), subir y navegar (fase 2) y sincronización (fase 3) ----------
// Registro: BOATS[i]={type,name,x,z,ry,L,B,g (grupo 3D),col (colisión)}. Proa hacia -x local. Fases siguientes: subir (E), navegar, colisiones, alquiler/compra, gasolina, ferry.
const BOATS=[],BOATSPEC={lancha:{L:6.2,B:2.3,max:32,acc:9,turn:1.5,lat:1.1,art:'la lancha'},velero:{L:8.6,B:2.9,max:14,acc:3.2,turn:.95,lat:2.2,art:'el velero'},pesquero:{L:8,B:2.7,max:11,acc:3.4,turn:.85,lat:2,art:'el pesquero'}}; // max = m/s (lancha ~115 km/h, velero ~50, pesquero ~40)
const BGLASS=new THREE.MeshLambertMaterial({color:0x7fb8d8,transparent:true,opacity:.55}),BLIGHT={r:new THREE.MeshBasicMaterial({color:0xff2a2a}),g:new THREE.MeshBasicMaterial({color:0x22e060}),w:new THREE.MeshBasicMaterial({color:0xfff6d0})},HULLM=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
let boatSeed=4242;const boatR=()=>(boatSeed=boatSeed*16807%2147483647)/2147483647;
function boatTxtMesh(t,w,h,bg,fg){const c=document.createElement('canvas');c.width=256;c.height=Math.max(32,Math.round(256*h/w));const g=c.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,c.width,c.height)}
 g.fillStyle=fg;let fs=Math.round(c.height*.6);g.font='bold '+fs+'px sans-serif';while(fs>8&&g.measureText(t).width>c.width*.92){fs-=2;g.font='bold '+fs+'px sans-serif'}
 g.textAlign='center';g.textBaseline='middle';g.fillText(t,c.width/2,c.height/2+1);
 return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:!bg}))}
// ¿hay agua suficiente bajo el casco? (comprueba varios puntos a lo largo de la eslora)
function boatWater(x,z,ry,L){for(const k of[-.46,-.23,0,.23,.46]){if(heightAt(x+Math.cos(ry)*L*k,z-Math.sin(ry)*L*k)>-.7)return false}return true}
// Casco por secciones (proa en -x): quilla en V, pantoque, franja de flotación, costado con cinta de color, borda con cubierta que sube hacia la proa (arrufo) y espejo de popa
function hullLoft(L,B,o){const NS=30,ss=(a,b,v)=>{v=Math.max(0,Math.min(1,(v-a)/(b-a)));return v*v*(3-2*v)},
 prof=u=>{let f=u<o.bw?1-Math.pow((o.bw-u)/o.bw,o.bp):1;if(u>o.sw)f*=1-o.st*Math.pow((u-o.sw)/(1-o.sw),2);
  const w=B/2*f;return{w,d:o.D*(o.k0+(1-o.k0)*ss(0,o.kf,u)),top:o.Hs+o.Hb*Math.pow(1-u,2.2),wg:w*(1+o.flare*Math.pow(1-u,1.6))}},st=[];
 for(let i=0;i<=NS;i++){const u=i/NS,p=prof(u);p.x=-L/2+L*u;st.push(p)}
 const P=[],C=[],cc=new THREE.Color(),tri=(a,b,c,col)=>{cc.set(col);for(const p of[a,b,c]){P.push(p[0],p[1],p[2]);C.push(cc.r,cc.g,cc.b)}},
  rows=s=>[[-s.d,0],[-s.d*.42,s.w*.86],[0,s.w*.985],[.07,s.w*.992],[s.top*.5,s.w+(s.wg-s.w)*.45],[s.top*.5+.075,s.w+(s.wg-s.w)*.47],[s.top,s.wg]],
  rc=[o.bot,o.bot,o.boot,o.top,o.acc,o.top],R=st.map(rows);
 for(let i=0;i<NS;i++){
  for(let k=0;k<6;k++)for(const sg of[1,-1]){
   const a=[st[i].x,R[i][k][0],sg*R[i][k][1]],b=[st[i].x,R[i][k+1][0],sg*R[i][k+1][1]],c=[st[i+1].x,R[i+1][k][0],sg*R[i+1][k][1]],d=[st[i+1].x,R[i+1][k+1][0],sg*R[i+1][k+1][1]];
   tri(a,b,c,rc[k]);tri(b,d,c,rc[k])}
  const s0=st[i],s1=st[i+1],dk=(s,sg)=>[s.x,s.top-.03,sg*s.wg*.93],rl=(s,sg,k)=>[s.x,s.top,sg*s.wg*k];
  tri(dk(s0,1),dk(s0,-1),dk(s1,1),o.deck);tri(dk(s0,-1),dk(s1,-1),dk(s1,1),o.deck);              // cubierta
  for(const sg of[1,-1]){tri(rl(s0,sg,.93),rl(s0,sg,1),rl(s1,sg,.93),o.rail);tri(rl(s0,sg,1),rl(s1,sg,1),rl(s1,sg,.93),o.rail)}} // regala
 const S=R[NS],xs=st[NS].x,ring=[];for(const sg of[1,-1]){const rr=sg>0?S:[...S].reverse();for(const r of rr)ring.push([xs,r[0],sg*r[1]])}
 for(let i=1;i<ring.length-1;i++)tri(ring[0],ring[i],ring[i+1],o.top);                               // espejo de popa
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
 const at=x=>prof(Math.max(0,Math.min(1,(x+L/2)/L)));return{geo:g,topAt:x=>at(x).top,wAt:x=>at(x).wg}}
function mkBoat(type,x,z,ry,hc,name,chk){const sp=BOATSPEC[type],L=sp.L,B=sp.B;if(chk&&!boatWater(x,z,ry,L))return null;
 const g=new THREE.Group(),SAILM=new THREE.MeshLambertMaterial({color:0xf4f1e8,side:THREE.DoubleSide});
 g.position.set(x,-.4,z);g.rotation.order='YXZ';g.rotation.y=ry;
 // utilidades de modelado (y = centro de la pieza)
 const add=(geo,c,px,py,pz,rx,ry2,rz)=>{const m=new THREE.Mesh(geo,typeof c==='object'?c:mat(c));m.position.set(px,py,pz);if(rx||ry2||rz)m.rotation.set(rx||0,ry2||0,rz||0);g.add(m);return m},
  pb=(w,h,d,px,py,pz,c,rx,ry2,rz)=>add(new THREE.BoxGeometry(w,h,d),c,px,py,pz,rx,ry2,rz),
  cy=(r1,r2,h,px,py,pz,c,ax)=>{const m=add(new THREE.CylinderGeometry(r1,r2,h,10),c,px,py,pz);if(ax==='x')m.rotation.z=Math.PI/2;else if(ax==='z')m.rotation.x=Math.PI/2;return m},
  ball=(r,px,py,pz,c)=>add(new THREE.SphereGeometry(r,8,6),c,px,py,pz),
  rod=(a,b,r,c)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),len=d.length(),m=add(new THREE.CylinderGeometry(r,r,len,5),c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m},
  // vela con curvatura: esquinas T (puño de amura), H (puño de driza), Cc (puño de escota); belly = panza
  sail=(T0,H,Cc,belly)=>{const NR=7,NC=6,P=[],I=[];for(let i=0;i<=NR;i++){const r=i/NR,b=[0,1,2].map(k=>T0[k]+(H[k]-T0[k])*r),e=[0,1,2].map(k=>Cc[k]+(H[k]-Cc[k])*r);
    for(let j=0;j<=NC;j++){const s=j/NC;P.push(b[0]+(e[0]-b[0])*s,b[1]+(e[1]-b[1])*s,b[2]+(e[2]-b[2])*s+belly*Math.sin(Math.PI*s)*(1-r*.55))}}
   for(let i=0;i<NR;i++)for(let j=0;j<NC;j++){const a=i*(NC+1)+j;I.push(a,a+1,a+NC+1,a+1,a+NC+2,a+NC+1)}
   const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(P,3));q.setIndex(I);q.computeVertexNormals();return add(q,SAILM,0,0,0)};
 const HO={lancha:{bw:.46,bp:1.6,sw:.86,st:.07,Hs:.6,Hb:.3,flare:.18,D:.42,k0:.3,kf:.5,bot:0x232f3b,boot:0xf2f2f2,top:hc,acc:0xf2f2f2,deck:0xd2c19b,rail:0xf2f2f2},
  velero:{bw:.5,bp:1.4,sw:.8,st:.2,Hs:.55,Hb:.32,flare:.08,D:.8,k0:.5,kf:.6,bot:0x7a1f1f,boot:0xf2f2f2,top:hc,acc:0x1f3a5f,deck:0xb08a5a,rail:0xe8e4d8},
  pesquero:{bw:.4,bp:1.8,sw:.9,st:.05,Hs:.85,Hb:.5,flare:.22,D:.62,k0:.6,kf:.4,bot:0x2b2b2b,boot:0xf2f2f2,top:hc,acc:0xf2f2f2,deck:0x6f6a60,rail:0xe8e8e8}}[type],
  hull=hullLoft(L,B,HO),T=hull.topAt,W=hull.wAt;
 g.add(new THREE.Mesh(hull.geo,HULLM));
 const nx0=-L/2+L*.24;ball(.05,nx0,T(nx0)+.06,W(nx0)*.85,BLIGHT.r);ball(.05,nx0,T(nx0)+.06,-W(nx0)*.85,BLIGHT.g); // luces de navegación (babor rojo, estribor verde)
 const SEAT=0xe8e0cf,DARK=0x2b2f33,CHR=0xc9ced2;
 if(type==='lancha'){ // lancha rápida: parabrisas inclinado, consola, asientos, banco de popa y dos fuera borda
  const t0=T(.1);pb(1.0,.42,B*.5,.35,t0+.21,0,0xf2f2f2);pb(.3,.1,B*.42,.05,t0+.44,0,0x1c2a33);cy(.17,.17,.03,.55,t0+.6,-.35,DARK,'x');
  pb(.05,.5,B*.64,-.12,t0+.66,0,BGLASS,0,0,-.5);pb(.06,.05,B*.68,.03,t0+.9,0,CHR);rod([-.15,t0+.4,B*.33],[.04,t0+.88,B*.33],.02,CHR);rod([-.15,t0+.4,-B*.33],[.04,t0+.88,-B*.33],.02,CHR);ball(.045,.03,t0+.97,0,BLIGHT.w);
  for(const sd of[-1,1]){pb(.55,.28,.5,1.15,T(1.15)+.2,sd*.5,SEAT);pb(.1,.5,.5,1.42,T(1.4)+.5,sd*.5,SEAT)}
  pb(.6,.32,B*.78,2.2,T(2.2)+.18,0,SEAT);pb(.9,.08,B*.7,-1.6,T(-1.6)+.05,0,0xf2f2f2);
  for(const sd of[-.45,.45]){pb(.55,.75,.4,L/2+.32,T(L/2)+.3,sd,DARK);pb(.5,.14,.36,L/2+.32,T(L/2)+.72,sd,hc);pb(.16,.95,.13,L/2+.4,T(L/2)-.35,sd,0x1b1b1b)}
  pb(.28,.05,.12,-L/2+.8,T(-L/2+.8)+.04,0,CHR);rod([L/2-.2,T(L/2),.6],[L/2-.2,T(L/2)+1.1,.6],.015,0xaaaaaa);pb(.01,.26,.42,L/2-.2,T(L/2)+.95,.82,hc);
 }else if(type==='velero'){ // velero: casco fino, cabina con portillos, cockpit con rueda, mástil con crucetas, obenques y dos velas curvadas
  const mx=-1.0,tm0=T(mx),by=tm0+1.15,mt=tm0+9;
  pb(2.8,.55,B*.5,.9,T(.9)+.275,0,0xf2efe6);pb(2.95,.07,B*.54,.9,T(.9)+.58,0,0xdcd8cc);
  for(const px of[.1,.9,1.7])for(const sd of[-1,1])cy(.11,.11,.03,px,T(px)+.3,sd*(B*.25+.015),0x1c2a33,'z');
  pb(.7,.3,B*.3,2.5,T(2.5)+.15,0,0x6b4a2b);for(const sd of[-1,1])pb(1.3,.12,.4,3.2,T(3.2)+.1,sd*.78,0xb08a5a);
  cy(.05,.05,.7,3.7,T(3.7)+.35,0,0x8a8f95);cy(.28,.28,.04,3.7,T(3.7)+.75,0,DARK,'x');
  cy(.07,.09,9,mx,tm0+4.5,0,0xcfd4d8);ball(.05,mx,mt+.08,0,BLIGHT.w);
  rod([mx+.04,by,0],[mx+3.2,by+.05,0],.05,0xcfd4d8);
  for(const sd of[-1,1]){rod([mx,tm0+4.6,0],[mx+.1,tm0+4.6,sd*.95],.022,0xcfd4d8);rod([mx+.1,tm0+4.6,sd*.95],[mx+.25,T(mx+.25)+.02,sd*B*.45],.012,0x444a50);rod([mx,mt-.3,0],[mx+.1,tm0+4.6,sd*.95],.012,0x444a50)}
  rod([mx,mt-.2,0],[-L/2+.3,T(-L/2+.3)+.1,0],.014,0x444a50);rod([mx,mt-.2,0],[L/2-.15,T(L/2)+.1,0],.014,0x444a50);
  sail([mx+.08,by+.12,0],[mx+.08,mt-.4,0],[mx+3.15,by+.1,0],.5);   // vela mayor
  sail([-L/2+.35,T(-L/2+.35)+.12,0],[mx-.1,mt-.9,0],[mx+1.25,tm0+1.0,.15],.35); // foque
  for(const sd of[-.9,.9]){rod([L/2-.25,T(L/2),sd],[L/2-.25,T(L/2)+.55,sd],.018,CHR)}rod([L/2-.25,T(L/2)+.55,-.9],[L/2-.25,T(L/2)+.55,.9],.018,CHR);
 }else{ // pesquero: casa de gobierno con ventanas, chimenea, radar, pluma con mástil, tambor de red, cajas, boyas y defensas
  const t1=T(1.0),rf=t1+1.55;
  pb(2.3,1.5,B*.62,1.0,t1+.75,0,0xf2f2f2);pb(2.6,.1,B*.72,1.0,rf,0,0x333b44);
  pb(.05,.55,B*.5,-.17,t1+1.0,0,BGLASS);pb(.05,.5,B*.4,2.17,t1+1.0,0,BGLASS);for(const sd of[-1,1])for(const px of[.45,1.5])pb(.75,.5,.04,px,t1+1.0,sd*(B*.31+.02),BGLASS);
  cy(.17,.2,1.1,2.0,rf+.5,.45,0x333b44);cy(.18,.18,.12,2.0,rf+.75,.45,0xc0392b);
  cy(.28,.28,.05,1.35,rf+.35,0,0xdddddd);pb(.7,.04,.07,1.35,rf+.4,0,0x8a8f95);rod([.5,rf,.2],[.5,rf+1.3,.2],.015,0x8a8f95);
  ball(.06,1.0,rf+.07,B*.34,BLIGHT.r);ball(.06,1.0,rf+.07,-B*.34,BLIGHT.g);
  const mxp=-1.1,tmx=T(mxp);cy(.08,.1,4.2,mxp,tmx+2.1,0,0x5a4028);ball(.05,mxp,tmx+4.25,0,BLIGHT.w);
  rod([mxp,tmx+3.9,0],[mxp+.3,tmx+1.2,1.55],.04,0x5a4028);rod([mxp,tmx+4.1,0],[-L/2+.3,T(-L/2+.3)+.2,0],.014,0x444a50);
  cy(.42,.42,B*.5,3.0,T(3.0)+.5,0,0x2e6b3a,'z');for(const sd of[-1,1])cy(.5,.5,.05,3.0,T(3.0)+.5,sd*B*.27,0x1f4f2a,'z');
  for(const sd of[-1,1]){pb(.55,.28,.42,-.1,T(-.1)+.14,sd*.5,0x2f6db0);pb(.55,.28,.42,-.1,T(-.1)+.42,sd*.5,0xd6a62a)}
  ball(.2,-1.7,T(-1.7)+.25,.45,0xe8620f);ball(.2,-1.3,T(-1.3)+.25,-.6,0xf2c41d);
  for(const sd of[-1,1]){for(const px of[-1.2,0,1.2])cy(.13,.13,.55,px,T(px)*.55,sd*(W(px)+.1),0x1b1b1b);
   for(let px=-3.2;px<=3.9;px+=.9)pb(.9,.3,.06,px,T(px)+.15,sd*W(px)*.93,hc)}
 }
 // nombre en el espejo de popa (cara +x)
 const nm=boatTxtMesh(name,Math.min(B*.6,1.7),.26,'#f2f2f2','#1d2a36');nm.position.set(L/2+.03,Math.max(.25,T(L/2)*.55),0);nm.rotation.y=Math.PI/2;g.add(nm);
 scene.add(g);
 const sw=Math.abs(Math.sin(ry))>.5,hx=sw?B/2:L/2,hz=sw?L/2:B/2,col={x0:x-hx,x1:x+hx,z0:z-hz,z1:z+hz,y0:-1.6,y1:1.2,on:true};colliders.push(col);
 const e={type,name,x,z,ry,L,B,g,col,boat:1,h:ry-Math.PI/2,v:0,vx:0,vz:0,tw:0,stuck:false,spec:sp};g.userData.boat=e;BOATS.push(e);
 e.bob={g,y:-.4,sp:.8+boatR()*.4,ph:boatR()*6.28,roll:type==='velero'?.018:.012};PORTBOATS.push(e.bob); // balanceo suave (portUpd) mientras está amarrado
 return e}
// ---- fase 2: subir al barco y navegar ----
// W: motor · S: frenar/marcha atrás · A/D: timón · E: subir / bajar (en un muelle o la orilla; si no hay, te tiras al agua)
// Movimiento con inercia: velocidad longitudinal f y deriva lateral l (el barco "patina" al girar). El rumbo h sigue la convención de las avionetas (adelante = (sen h, cos h)); el grupo 3D gira ry = h + 90°.
const WAKE=[];let wakeT=0,wakeI=0;
function boatBlocked(a,x,z,h){const c=Math.cos(h),s=Math.sin(h),hl=a.L/2,hw=a.B/2;
 for(const p of[[0,hl],[0,-hl],[hw,hl*.5],[-hw,hl*.5],[hw,0],[-hw,0],[hw,-hl*.5],[-hw,-hl*.5],[hw*.5,hl*.85],[-hw*.5,hl*.85]]){
  const px=x+p[0]*c+p[1]*s,pz=z-p[0]*s+p[1]*c;
  if(px<WLIM0+4||px>WLIM1-4||pz<WLIM0+4||pz>WLIM1-4)return true;
  if(heightAt(px,pz)>-.7)return true;                                   // orilla, playa o fondo poco profundo
  for(const f of FLOORS)if(px>f.x0&&px<f.x1&&pz>f.z0&&pz<f.z1&&f.y>-.8)return true; // muelles y escaleras
  if(hits(px,.2,pz))return true}                                         // otros barcos, buque de carga...
 return false}
function boatStand(x,z){let y=null;for(const f of FLOORS)if(x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1&&(y===null||f.y>y))y=f.y;const h=heightAt(x,z);if(y!==null&&y>h-.01)return y;return h>-.12?h:null}
function boatBox(a){const c=Math.cos(a.h),s=Math.sin(a.h),q=[[-1,-1],[1,-1],[-1,1],[1,1]].map(p=>[a.x+p[0]*a.B/2*c+p[1]*a.L/2*s,a.z-p[0]*a.B/2*s+p[1]*a.L/2*c]);
 a.col.x0=Math.min(...q.map(p=>p[0]));a.col.x1=Math.max(...q.map(p=>p[0]));a.col.z0=Math.min(...q.map(p=>p[1]));a.col.z1=Math.max(...q.map(p=>p[1]))}
const boatDe=a=>a.spec.art.startsWith('el ')?'del '+a.spec.art.slice(3):'de '+a.spec.art,boatA=a=>a.spec.art.startsWith('el ')?'al '+a.spec.art.slice(3):'a '+a.spec.art;
function boardBoatNow(a){if(riding||inCar)return;a.pilot=null;a.rt=null;riding=a;a.col.on=false;a.v=0;a.vx=0;a.vz=0;a.stuck=boatBlocked(a,a.x,a.z,a.h);
 const i=PORTBOATS.indexOf(a.bob);if(i>=0)PORTBOATS.splice(i,1);body.visible=false;
 toast(a.spec.art.charAt(0).toUpperCase()+a.spec.art.slice(1)+' '+a.name+' · W/S motor · A/D timón · E: bajar en un muelle o en la orilla')}
function leaveBoat(){const a=riding;if(!a||!a.boat)return;if(Math.abs(a.v)>1.5){toast('Reduce la velocidad para bajar');return}
 const c=Math.cos(a.h),s=Math.sin(a.h),cand=[];
 for(const sd of[1,-1])for(let d=a.B/2+.9;d<=a.B/2+5;d+=.5)cand.push([sd*d,0]);
 for(const sd of[1,-1])for(let d=a.L/2+.9;d<=a.L/2+4;d+=.5)cand.push([0,sd*d]);
 let o=null;for(const q of cand){const x=a.x+q[0]*c+q[1]*s,z=a.z-q[0]*s+q[1]*c,y=boatStand(x,z);if(y!==null&&!hits(x,y+.2,z)){o={x,z,y,w:false};break}}
 if(!o){o={x:a.x+(a.B/2+1.2)*c,z:a.z-(a.B/2+1.2)*s,y:SEA.position.y+.08,w:true};toast('No hay muelle cerca: te tiras al agua')}
 else toast('Has bajado '+boatDe(a)+' '+a.name);
 a.v=0;a.vx=0;a.vz=0;boatBox(a);a.col.on=true;a.g.rotation.x=0;a.g.rotation.z=0;PORTBOATS.push(a.bob);$('spd').textContent='';if(boatOnline())govSend({type:'boat_leave',id:a.name,x:a.x,z:a.z,h:a.h});
 riding=null;body.visible=true;pl.x=o.x;pl.z=o.z;py=o.y;vy=0;grounded=!o.w;body.position.set(pl.x,py,pl.z)}
function boatWake(a,dt){if(!WAKE.length){const g=new THREE.CircleGeometry(.5,14);for(let i=0;i<64;i++){const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xeaf6ff,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);WAKE.push({m,t:9,s0:1,gr:3.2,op:.45})}}
 for(const w of WAKE){if(w.t<1.6){w.t+=dt;const k=Math.min(1,w.t/1.6);w.m.visible=k<1;w.m.scale.setScalar(w.s0+k*w.gr);w.m.material.opacity=w.op*(1-k)}else w.m.visible=false}
 wakeT-=dt;if(a&&Math.abs(a.v)>2.5&&wakeT<=0){const sv=Math.abs(a.v),sc=sv/a.spec.max;wakeT=Math.max(.045,.5/sv);const c=Math.cos(a.h),s=Math.sin(a.h),
   put=(lat,lon,s0,gr,op)=>{const w=WAKE[wakeI++%WAKE.length];w.t=0;w.s0=s0;w.gr=gr;w.op=op;w.m.position.set(a.x+lat*c+lon*s,-.36,a.z-lat*s+lon*c);w.m.visible=true};
  put((wakeI%2?1:-1)*a.B*.3,-a.L*.45,.8+sc*.8,2.4+sc*3.5,.45);                          // estela de popa
  if(sv>5){const bs=wakeI%2?1:-1;put(bs*a.B*.42,a.L*.28,.5+sc*.4,1.2+sc*2,.4);put(bs*(a.B*.5+sc*.8),a.L*.05,.7,1.8+sc*2.5,.28)}}} // ola de proa
function boatStep(dt){const a=(riding&&riding.boat)?riding:null;boatWake(a,dt);if(!a)return;
 const w=K.KeyW||K.ArrowUp,sb=K.KeyS||K.ArrowDown,str=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0),sp=a.spec;a.str=str;
 let fx=Math.sin(a.h),fz=Math.cos(a.h),f=a.vx*fx+a.vz*fz,l=a.vx*fz-a.vz*fx;
 if(w)f+=sp.acc*(1-Math.max(0,f)/sp.max)*dt;
 else if(sb){f-=(f>0?sp.acc*2.2:sp.acc*.7)*dt;f=Math.max(f,-sp.max*.3)}
 else f-=Math.sign(f)*Math.min(Math.abs(f),(.25+Math.abs(f)*.18)*dt);        // el agua frena sola
 if(a.net&&f>5.2)f=5.2; // la red frena el barco
 l-=l*Math.min(1,sp.lat*dt);                                                     // la deriva lateral se amortigua
 const fac=Math.max(w?.35:0,Math.min(1,Math.abs(f)/4))*(f<-.3?-1:1)/(1+Math.abs(f)/sp.max*.9),nh=a.h+str*sp.turn*dt*fac;
 if(!boatBlocked(a,a.x,a.z,nh)||a.stuck)a.h=nh;
 fx=Math.sin(a.h);fz=Math.cos(a.h);a.vx=fx*f+fz*l;a.vz=fz*f-fx*l;a.v=f;
 if(a.stuck&&!boatBlocked(a,a.x,a.z,a.h))a.stuck=false;
 const nsub=Math.max(1,Math.ceil(Math.hypot(a.vx,a.vz)*dt/.5)),sd=dt/nsub; // subpasos de <=0,5 m para no atravesar muelles a toda velocidad
 for(let q=0;q<nsub;q++){const nx=a.x+a.vx*sd,nz=a.z+a.vz*sd;
  if(a.stuck||!boatBlocked(a,nx,nz,a.h)){a.x=nx;a.z=nz}
  else if(!boatBlocked(a,nx,a.z,a.h)){a.x=nx;a.vz*=.5}
  else if(!boatBlocked(a,a.x,nz,a.h)){a.z=nz;a.vx*=.5}
  else{if(Math.hypot(a.vx,a.vz)>4&&tm>a.tw){a.tw=tm+2;toast('¡Choque!')}a.vx*=-.25;a.vz*=-.25;a.v*=-.25;break}}
 // 3D: posición, rumbo, escora al girar, proa arriba al acelerar y balanceo de las olas
 const g=a.g,sw=Math.sin(tm*a.bob.sp+a.bob.ph),k=Math.min(1,Math.abs(a.v)/sp.max),lan=a.type==='lancha',
  trim=lan?Math.min(1,k*3)*(1-.6*Math.max(0,k-.3)/.7):k*.5,chop=Math.sin(tm*2.3+a.bob.ph)*k*(lan?.012:.02); // lancha: proa arriba al arrancar y se nivela al planear
 g.position.set(a.x,-.4+sw*.035+(lan?.1*Math.max(0,k-.25):k*.04),a.z);g.rotation.y=a.h+Math.PI/2;
 g.rotation.x+=(((lan?1:-.4)*str*k*.14*(a.v>0?1:-1))+sw*a.bob.roll-g.rotation.x)*Math.min(1,4*dt);   // la lancha se inclina hacia dentro en la curva; los demás hacia fuera
 g.rotation.z+=((-trim*(lan?.13:.05))+chop-g.rotation.z)*Math.min(1,3*dt);
 pl.x=a.x;pl.z=a.z;py=-.2;vy=0;grounded=true;body.position.set(a.x,0,a.z);
 $('spd').textContent=Math.round(Math.abs(a.v)*3.6)+' km/h'}

// ---- fase 3: barcos sincronizados con los demás jugadores ----
// El servidor decide quién pilota cada barco (uno solo a la vez). Los demás jugadores ven cómo navega y, cuando el piloto baja, el barco queda amarrado donde lo dejó.
// Id de barco = su nombre (único). a.pilot = id del jugador remoto que lo pilota · a.rt = último estado recibido de ese piloto.
const boatById=id=>BOATS.find(b=>b.name===id),boatPilotName=a=>{const p=MP.players.get(a.pilot);return p?p.name:'otro jugador'};
let boatPend=null; // barco que estoy intentando abordar (esperando el OK del servidor)
const boatOnline=()=>!!(MP.connected&&MP.ws&&MP.ws.readyState===1&&MP.id&&MP.feat&&MP.feat.boats);
let boatWarned=false;
const boatMoor=(a,on)=>{const i=PORTBOATS.indexOf(a.bob);if(on&&i<0)PORTBOATS.push(a.bob);if(!on&&i>=0)PORTBOATS.splice(i,1)};
function boardBoat(a){if(riding||inCar||boatPend)return;
 if(a.pilot){toast('⛵ Ya lo está pilotando '+boatPilotName(a));return}
 if(!boatOnline()){if(MP.connected&&!boatWarned&&!(MP.feat&&MP.feat.boats)){boatWarned=true;toast('⚠️ El servidor no tiene la sincronización de barcos: actualiza server.js. Navegas solo en tu pantalla.')}boardBoatNow(a);return}
 boatPend=a;setTimeout(()=>{if(boatPend===a){boatPend=null;if(!riding&&!inCar){toast('El servidor tarda en responder: navegas sin sincronizar');boardBoatNow(a)}}},2500);
 govSend({type:'boat_board',id:a.name})}
function boatOnOk(m){const a=boatById(m.id);if(!a)return;
 if(boatPend===a&&!riding&&!inCar){boatPend=null;boardBoatNow(a)}
 else{if(boatPend===a)boatPend=null;if(riding!==a)govSend({type:'boat_leave',id:a.name})}} // ya no quería subir: libero el barco
function boatOnDeny(m){if(boatPend&&boatPend.name===m.id)boatPend=null;toast('⛵ '+String(m.reason||'No puedes subir ahora').slice(0,100))}
function boatRest(a,x,z,h){a.x=x;a.z=z;a.h=h;a.v=0;a.vx=0;a.vz=0;const g=a.g;g.position.x=x;g.position.z=z;g.rotation.y=h+Math.PI/2;g.rotation.x=0;g.rotation.z=0;boatBox(a);a.col.on=true}
function boatKick(a){if(riding!==a)return;a.v=0;a.vx=0;a.vz=0;leaveBoat();toast('⚠️ Otro jugador ha tomado el barco')}
// Lista completa de barcos que llega del servidor (al entrar y cada vez que alguien sube o baja)
function boatApply(list){for(const e of list||[]){const a=boatById(e.id);if(!a)continue;const pid=e.pilot==null?null:String(e.pilot);
  if(pid&&pid===String(MP.id)){if(riding!==a&&boatPend!==a)govSend({type:'boat_leave',id:a.name});continue} // soy yo el piloto
  if(pid){if(riding===a)boatKick(a);a.pilot=pid;boatMoor(a,false);continue}                                 // lo pilota otro: su posición llega en su 'state'
  a.pilot=null;a.rt=null;if(riding===a)continue;                                                              // libre: queda donde lo dejaron
  if(e.x!=null&&e.z!=null&&e.h!=null)boatRest(a,Number(e.x),Number(e.z),Number(e.h));
  boatMoor(a,true)}}
// Estado de un piloto remoto (viene en su 'state' con vType 'boat')
function boatRemoteState(d){const a=boatById(d.vId);if(!a||riding===a||boatPend===a)return;
 const first=!a.rt;a.pilot=String(d.id);boatMoor(a,false);
 a.rt={x:Number(d.x)||0,z:Number(d.z)||0,h:Number(d.yaw)||0,k:Number(d.vBk)||0,st:Number(d.vPt)||0,net:Number(d.vThr)>.5,t:performance.now()};
 if(first){a.x=a.rt.x;a.z=a.rt.z;a.h=a.rt.h}}
// Mueve cada barco pilotado por otro jugador: interpola y extrapola un poco con su velocidad para que no vaya a saltos
function boatRemoteStep(dt){const now=performance.now();
 for(const a of BOATS){if(!a.rt||riding===a)continue;
  const r=a.rt,sp=a.spec,v=r.k*sp.max,age=Math.min(.4,(now-r.t)/1000),tx=r.x+Math.sin(r.h)*v*age,tz=r.z+Math.cos(r.h)*v*age;
  a.x+=(tx-a.x)*Math.min(1,dt*9);a.z+=(tz-a.z)*Math.min(1,dt*9);a.h+=Math.atan2(Math.sin(r.h-a.h),Math.cos(r.h-a.h))*Math.min(1,dt*7);a.v=v;
  const g=a.g,sw=Math.sin(tm*a.bob.sp+a.bob.ph),k=Math.min(1,Math.abs(v)/sp.max),lan=a.type==='lancha',str=r.st,
   trim=lan?Math.min(1,k*3)*(1-.6*Math.max(0,k-.3)/.7):k*.5,chop=Math.sin(tm*2.3+a.bob.ph)*k*(lan?.012:.02);
  g.position.set(a.x,-.4+sw*.035+(lan?.1*Math.max(0,k-.25):k*.04),a.z);g.rotation.y=a.h+Math.PI/2;
  g.rotation.x+=(((lan?1:-.4)*str*k*.14*(v>0?1:-1))+sw*a.bob.roll-g.rotation.x)*Math.min(1,4*dt);
  g.rotation.z+=((-trim*(lan?.13:.05))+chop-g.rotation.z)*Math.min(1,3*dt);
  boatBox(a);a.col.on=true}} // el colisionador sigue al barco: los demás barcos chocan con él
// Si se cae la conexión, los barcos que pilotaban otros se quedan amarrados donde estaban hasta la próxima sincronización
function boatMpReset(){boatPend=null;for(const a of BOATS){if(a.pilot||a.rt){a.pilot=null;a.rt=null;if(riding!==a){a.v=0;boatBox(a);a.col.on=true;boatMoor(a,true)}}}}

// ---------- 7.3 Pesca: red de arrastre en los pesqueros, bodega y venta en la lonja ----------
// G calar/recoger la red (solo pesqueros, lejos de la costa) · navega entre 2 y 6 m/s · la captura va a la bodega del barco (HOLD) · se vende en la lonja del puerto.
const FISHMUL=4,FISHCAP=80,FZ=[30,110,300],ZN=['Aguas costeras','Mar abierto','Alta mar'],LONJA={x:368,z:331},LONJAR=95; // bodega (kg) · distancia a la costa (m) de cada zona · puesto de venta
const FISH=[
 {k:'Sardina',e:'🐟',p:2,w:[2,5],zw:[50,26,0]},{k:'Boquerón',e:'🐟',p:2.8,w:[2,4],zw:[30,15,0]},{k:'Dorada',e:'🐠',p:5.5,w:[1,3],zw:[12,18,5]},
 {k:'Lubina',e:'🐠',p:7,w:[1.5,4],zw:[0,22,18]},{k:'Atún',e:'🐟',p:8,w:[3,7],zw:[0,6,30]},{k:'Pez espada',e:'🗡️',p:10.5,w:[4,9],zw:[0,0,12]}];
const FJW=[10,10,8],FJUNK=['Te sale una bota vieja…','Solo algas en la red','Una medusa se cuela y la sueltas','La red trae una lata y poco más'];
const HOLD={}; // bodega de cada barco por nombre: {Sardina:kg,...} (se guarda con la partida)
let fishDay=0,fishLast=-1,fishT=0;
const holdKg=a=>{const h=HOLD[a.name];if(!h)return 0;let t=0;for(const k in h)t+=h[k];return Math.round(t*10)/10};
const fishPrice=i=>FISH[i].p*FISHMUL*(1+Math.sin(fishDay*1.7+i*2.3)*.14); // el precio varía cada día (±14 %)
const holdValue=h=>{let v=0;FISH.forEach((f,i)=>{v+=(h[f.k]||0)*fishPrice(i)});return v};
const fishZone=a=>{const o=-isl(a.x,a.z);return o<FZ[0]?-1:o<FZ[1]?0:o<FZ[2]?1:2}; // -1 = demasiado cerca de la costa
function fishRate(a){const v=a.v||0;let r=(v>=2.5&&v<=4.5)?1:(v>=1.5&&v<=6.5)?.55:0; // velocidad ideal 2,5-4,5 m/s
 r*=((tod>=5&&tod<9)||(tod>=18&&tod<22))?1.35:(tod>=11&&tod<16)?.8:1;if(wx===2)r*=1.15;return r} // amanecer/atardecer pican más, a mediodía menos, con lluvia algo más
const fishHud=document.createElement('div');fishHud.style.cssText='top:232px;left:14px;max-width:340px;font-size:15px;line-height:1.5;background:rgba(0,0,0,.4);border-radius:8px;padding:4px 10px;display:none';$('hud').appendChild(fishHud);
const fishNetTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#e8eef0';g.lineWidth=3;for(let i=0;i<=64;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(64,i);g.stroke()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const fishBuoyG=new THREE.SphereGeometry(.14,8,6),fishBuoyM=new THREE.MeshBasicMaterial({color:0xff7a1a});
function fishNet(a){if(a.netM)return a.netM; // red de arrastre visible a popa del barco (la ven todos los jugadores)
 const g=new THREE.Group(),sh=new THREE.Shape();g.position.set(a.L/2,0,0);sh.moveTo(0,-1.5);sh.lineTo(7,-.45);sh.lineTo(7,.45);sh.lineTo(0,1.5);sh.closePath();
 const geo=new THREE.ShapeGeometry(sh);geo.rotateX(-Math.PI/2);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:fishNetTex,transparent:true,side:THREE.DoubleSide,depthWrite:false,opacity:.9}));m.position.y=.05;g.add(m);
 for(let i=1;i<=5;i++){const t=i/5,x=t*7,z=1.5-1.05*t;for(const sg of[-1,1]){const b=new THREE.Mesh(fishBuoyG,fishBuoyM);b.position.set(x,.1,sg*z);g.add(b)}}
 g.visible=false;a.g.add(g);a.netM=g;return g}
function fishToggle(){const a=riding;if(!a||!a.boat)return;
 if(a.type!=='pesquero'){toast('Solo los pesqueros llevan red de arrastre');return}
 if(a.net){fishHaul(a);return}
 const z=fishZone(a);
 if(z<0){toast('🎣 Demasiado cerca de la costa: aléjate más de '+FZ[0]+' m para calar la red');return}
 if(a.v>6.5){toast('Reduce la velocidad para calar la red');return}
 if(holdKg(a)>=FISHCAP){toast('La bodega está llena: vuelve al puerto y véndelo en la lonja');return}
 a.net=true;a.fcd=6+Math.random()*5;a.fsum=0;fishNet(a);toast('🎣 Red calada · navega despacio (2,5-4,5 m/s) · G: recoger')}
function fishHaul(a,msg){a.net=false;const kg=holdKg(a);
 toast(msg||('🎣 Red recogida · '+(a.fsum>0?'+'+Math.round(a.fsum*10)/10+' kg esta salida · ':'')+'Bodega '+kg+'/'+FISHCAP+' kg (≈ €'+Math.round(holdValue(HOLD[a.name]||{}))+')'));a.fsum=0;saveGame()}
function fishCatch(a,z){let r=Math.random()*(FISH.reduce((s,f)=>s+f.zw[z],0)+FJW[z]),pick=null;
 for(const f of FISH){r-=f.zw[z];if(r<0){pick=f;break}}
 if(!pick){toast('🎣 '+FJUNK[(Math.random()*FJUNK.length)|0]);return}
 const kg=Math.round(Math.min(pick.w[0]+Math.random()*(pick.w[1]-pick.w[0]),FISHCAP-holdKg(a))*10)/10;if(kg<=0)return;
 const h=HOLD[a.name]||(HOLD[a.name]={});h[pick.k]=Math.round(((h[pick.k]||0)+kg)*10)/10;a.fsum=(a.fsum||0)+kg;
 toast(pick.e+' '+pick.k+' +'+kg+' kg · Bodega '+holdKg(a)+'/'+FISHCAP+' kg')}
function fishStep(dt){
 if(fishLast>=0&&tod<fishLast-6)fishDay++;fishLast=tod;
 for(const a of BOATS){ // la red se ve en mi barco y en los barcos que pilotan otros jugadores
  if(a.net&&riding!==a)a.net=false;
  const show=riding===a?!!a.net:!!(a.rt&&a.rt.net);
  if(show||a.netM){const m=fishNet(a);if(m.visible!==show)m.visible=show;if(show)m.rotation.y=Math.sin(tm*1.4)*.07}}
 const a=(riding&&riding.boat&&riding.type==='pesquero')?riding:null;
 if(!a){if(fishHud.style.display!=='none')fishHud.style.display='none';return}
 const z=fishZone(a),kg=holdKg(a);
 if(a.net){
  if(z<0)fishHaul(a,'🎣 Te acercas demasiado a la costa: recoges la red');
  else if(kg>=FISHCAP)fishHaul(a,'🎣 Bodega llena: red recogida. Vuelve al puerto a vender');
  else{a.fcd-=dt*fishRate(a);if(a.fcd<=0){fishCatch(a,z);a.fcd=10+Math.random()*6}}}
 fishT+=dt;if(fishT>.2){fishT=0;const v=a.v||0,o=Math.round(-isl(a.x,a.z));
  fishHud.style.display='block';
  fishHud.innerHTML=(a.net?'🎣 <b>Red calada</b>':'🎣 Red recogida')+' · '+(z<0?'⚠️ demasiado cerca de la costa (mín. '+FZ[0]+' m)':'📍 '+ZN[z]+' ('+o+' m de la costa)')
   +'<br>🐟 Bodega <b>'+kg+'</b>/'+FISHCAP+' kg · ≈ €'+Math.round(holdValue(HOLD[a.name]||{}))
   +(a.net?'<br>'+(v>=2.5&&v<=4.5?'✔ velocidad ideal':v>=1.5&&v<=6.5?'🐢 pesca lenta (ideal 2,5-4,5 m/s)':'✘ '+(v>6.5?'demasiado rápido':'demasiado lento')+': no pesca'):'<br><small>G: calar la red en mar abierto (a más de '+FZ[0]+' m de la costa)</small>')}}
// ---- lonja del puerto: vender el pescado de los barcos amarrados ----
function fishMarketOpen(){openDlg();dlg.innerHTML=fishHtml()}
function fishHtml(){
 const pes=BOATS.filter(b=>b.type==='pesquero'&&holdKg(b)>0),near=pes.filter(b=>Math.hypot(b.x-LONJA.x,b.z-LONJA.z)<LONJAR),far=pes.filter(b=>!near.includes(b));
 let t='<h2>🐟 Lonja del puerto</h2><p>Aquí se compra el pescado de los barcos amarrados en el puerto. Precios de hoy (€/kg):</p><div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin:4px 0 8px">'+FISH.map((f,i)=>{const p=fishPrice(i);return '<span>'+f.e+' '+f.k+' <b>€'+p.toFixed(1)+'</b>'+(p>f.p*FISHMUL*1.03?' ▲':p<f.p*FISHMUL*.97?' ▼':'')+'</span>'}).join('')+'</div>';
 if(!near.length)t+='<p><b>No tienes pescado en barcos amarrados cerca.</b> Pesca con un pesquero (G: calar la red, lejos de la costa), amarra en el puerto y baja del barco.</p>';
 near.forEach(b=>{const h=HOLD[b.name],i=BOATS.indexOf(b);t+='<div class="r"><i class="ic">🚢</i><span><b>'+pcEsc(b.name)+'</b> · '+holdKg(b)+' kg<br><small>'+FISH.filter(f=>h[f.k]>0).map(f=>f.e+' '+f.k+' '+h[f.k]+' kg').join(' · ')+'</small></span><b>€'+Math.round(holdValue(h))+'</b><button onclick="fishSell('+i+')">Vender todo</button></div><div style="margin:0 0 8px 40px"><button onclick="fishKeep('+i+')">🍽️ Quedarme 1 kg para comer</button></div>'});
 if(near.length>1)t+='<div><button onclick="fishSellAll()">Vender el pescado de todos los barcos</button></div>';
 if(far.length)t+='<p><small>Pescado en barcos lejos del puerto: '+far.map(b=>pcEsc(b.name)+' ('+holdKg(b)+' kg)').join(', ')+'. Amárralos en el muelle para venderlo.</small></p>';
 return t+'<div><button onclick="closeDlg()" style="background:#666">Salir</button></div>'}
function fishSellBoat(b){const h=HOLD[b.name],kg=holdKg(b);if(!h||kg<=0||Math.hypot(b.x-LONJA.x,b.z-LONJA.z)>=LONJAR)return 0;const v=Math.round(holdValue(h));money+=taxNet(v);HOLD[b.name]={};return v}
function fishSell(i){const b=BOATS[i];if(!b)return;const kg=holdKg(b),v=fishSellBoat(b);if(v>0){sfx.cash();toast('🐟 Vendidos '+kg+' kg de pescado: +€'+v);saveGame()}dlg.innerHTML=fishHtml()}
function fishSellAll(){let kg=0,v=0;BOATS.forEach(b=>{if(b.type==='pesquero'){const k=holdKg(b),x=fishSellBoat(b);if(x>0){kg+=k;v+=x}}});if(v>0){sfx.cash();toast('🐟 Vendidos '+Math.round(kg*10)/10+' kg de pescado: +€'+v);saveGame()}dlg.innerHTML=fishHtml()}
function fishKeep(i){const b=BOATS[i],h=b&&HOLD[b.name];if(!h)return;const f=FISH.filter(x=>h[x.k]>0).sort((p,q)=>p.p-q.p)[0];if(!f)return; // se queda con el pescado más barato
 h[f.k]=Math.round((h[f.k]-Math.min(1,h[f.k]))*10)/10;if(h[f.k]<=0)delete h[f.k];
 const o=inv['Pescado fresco']||(inv['Pescado fresco']={n:0,cat:'Comida',act:'Consumir'});o.n++;toast('🍽️ Te quedas 1 ración de pescado fresco (inventario: I · o cocínala en casa)');dlg.innerHTML=fishHtml()}

// ---------- 7.4 Construcción del puerto: explanada, oficina, almacén, lonja, contenedores, grúa, faro, buque y muelles ----------
(function port(){const sd0=seed,G0=G;G=PORTH; // todo el puerto se construye a la altura de su cubierta (hollow, farolas... usan G)
 let s=1234567;const R=()=>(s=s*16807%2147483647)/2147483647;
 const DK=G,CONC=0xa9a7a1,TOP=0x62656a,WOOD=0x8a6a45,WOODD=0x5a4028,STEEL=0x3a3f44,YEL=0xf1c40f,RED=0xd9531e,
  CON=[0xc0392b,0x2980b9,0xe67e22,0x27ae60,0xf1c40f,0xe8e8e8,0x8e44ad,0x16a085,0x34495e,0xd35400],
  sl=(x0,x1,z0,z1,yb,yt,c)=>box((x0+x1)/2,yb,(z0+z1)/2,x1-x0,yt-yb,z1-z0,c,false),
  M=(x,z,sx,sz,c)=>box(x,DK,z,sx,.03,sz,c,false),
  // cubierta de hormigón maciza (bloque hasta el fondo + losa) que se puede pisar
  deck=(x0,x1,z0,z1,hex)=>{sl(x0,x1,z0,z1,-3.2,DK-.05,CONC);sl(x0,x1,z0,z1,DK-.05,DK,TOP);FLOORS.push({x0,x1,z0,z1,y:DK});BLD.push([x0,z0,x1-x0,z1-z0,hex||'#8d8f93'])},
  txtTex=(t,w,h,bg,fg)=>{const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const g=c.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,c.width,c.height)}g.fillStyle=fg;let fs=Math.round(c.height*.62);g.font='bold '+fs+'px sans-serif';while(fs>10&&g.measureText(t).width>c.width*.9){fs-=3;g.font='bold '+fs+'px sans-serif'}g.textAlign='center';g.textBaseline='middle';g.fillText(t,c.width/2,c.height/2+3);return new THREE.CanvasTexture(c)},
  board=(t,x,y,z,w,h,bg,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:txtTex(t,w,h,bg,'#ffffff')}));m.position.set(x,y,z);m.rotation.y=ry||0;scene.add(m);return m},
  floorTxt=(t,x,z,w,h,rz)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:txtTex(t,w,h,null,'#f4f4f4'),transparent:true,depthWrite:false}));m.rotation.set(-Math.PI/2,0,rz);m.position.set(x,DK+.06,z);scene.add(m)},
  bol=(x,z)=>{box(x,DK,z,.45,.42,.45,0x1f2328,false);box(x,DK+.42,z,.6,.1,.6,0x1f2328,false)},
  col=(x0,x1,z0,z1,y0,y1)=>colliders.push({x0,x1,z0,z1,y0,y1,on:true});
 // contorno de casco visto desde arriba, extruido en vertical (proa hacia -x)
 const hullGeo=(L,B,y0,h,tp)=>{const sh=new THREE.Shape(),b=B/2;sh.moveTo(-L/2,0);sh.lineTo(-L/2+tp*.35,-b*.5);sh.lineTo(-L/2+tp,-b);sh.lineTo(L/2,-b);sh.lineTo(L/2,b);sh.lineTo(-L/2+tp,b);sh.lineTo(-L/2+tp*.35,b*.5);sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,y0,0);return g};
 const floatIt=(g,y,roll)=>{scene.add(g);PORTBOATS.push({g,y,sp:.8+R()*.4,ph:R()*6.28,roll})};

 // ---------- suelos ----------
 deck(334,378,326,356,'#8d8f93');   // explanada principal
 deck(378,394,348,358,'#8d8f93');   // explanada sur
 deck(378,412,338,348,'#85878b');   // muelle 1 (carga)
 // muelle 2 (madera sobre pilotes) hacia el norte, dentro de la bahía
 sl(352,360,304,326,DK-.37,DK,WOOD);FLOORS.push({x0:352,x1:360,z0:304,z1:326,y:DK});BLD.push([352,304,8,22,'#8a6a45']);
 for(let z=305;z<326;z+=1.5)box(356,DK,z,8,.015,.1,WOODD,false);
 for(let z=304.4;z<326;z+=3.6)for(const x of[352.25,359.75])box(x,-3.2,z,.4,3.2+DK+.5,.4,WOODD,false);
 // rayas y marcas
 for(let x=340;x<=376;x+=4)M(x,340,2,.22,0xf4f4f4);
 M(396,338.4,34,.22,YEL);M(396,347.6,34,.22,YEL);
 floorTxt('MUELLE 1',396.5,343,9,3.2,-Math.PI/2);floorTxt('MUELLE 2',356,315,6,2.2,0);
 // norays
 for(let x=382;x<=410;x+=6){bol(x,339);bol(x,347)}
 for(let z=308;z<=324;z+=4){bol(352.7,z);bol(359.3,z)}
 // ---------- oficina del puerto (capitanía): con interior ----------
 {const cx=343,cz=332,w=14,d=8,H=4.4,zf=cz+d/2,od=hollow(cx,cz,w,d,H,1,0xd9dde2,3,0xcfd3d6);od.leaf.material=mat(0x2f6f8b);
  box(cx,G+H+.25,cz,w+.6,.6,d+.6,0x1f6f8b,false);
  board('PUERTO',cx,G+3.45,zf+.3,8,1.6,'#1f6f8b',0);
  for(const x of[-4.6,4.6])box(cx+x,G+1.1,zf+.22,3,1.5,.06,0x7fb7d6,false);
  for(const z of[-1.6,1.6]){box(cx-w/2-.22,G+1.1,cz+z,.06,1.5,2.2,0x7fb7d6,false);box(cx+w/2+.22,G+1.1,cz+z,.06,1.5,2.2,0x7fb7d6,false)}
  // interior: mostrador, mesas con sillas y carta náutica
  box(cx,G+.03,cz-2.2,5,1.05,1,0x5a6370,true);box(cx,G+1.08,cz-2.2,5.2,.08,1.1,0xdfe3e8,false);
  box(cx,G+1.1,cz-3.52,4.2,1.7,.05,0x2d6a9f,false);
  [[-4.2,.6],[4.2,.6]].forEach(a=>{box(cx+a[0],G+.03,cz+a[1],2,.75,1,0x8b5a2b,true);IA(box(cx+a[0],G+.03,cz+a[1]+1.1,.7,.5,.7,0x2f7fe0,true),'sit')})}
 // ---------- almacén del puerto: con interior ----------
 {const cx=352,cz=349,w=28,d=10,H=7,zf=cz-d/2,wd=hollow(cx,cz,w,d,H,-1,0xcfd5da,8,0xb9b6ae);wd.leaf.material=mat(0x2c5f7a);
  box(cx,G+H+.25,cz,w+.6,.6,d+.6,0x2c5f7a,false);
  board('ALMACÉN DEL PUERTO',cx,G+5.45,zf-.3,12,1.8,'#2c5f7a',Math.PI);
  for(let k=0;k<4;k++){const x=342+k*7.4,z=cz+3.9;
   for(const dx of[-2.9,2.9])box(x+dx,G+.03,z,.12,3.4,.9,0x2f6fb0,false);
   for(let l=0;l<3;l++){box(x,G+.6+l*1.2,z,6,.08,1,0x2f6fb0,false);for(let c=0;c<2;c++)if(R()<.8)box(x-1.5+c*3,G+.68+l*1.2,z,1.3+R()*.8,.8,.8,[0xb8864b,0xc99a5b,0xa8763b][(R()*3)|0],false)}}
  for(let k=0;k<5;k++){const x=343+k*4.6,z=cz-.4+(k%2)*1.4,n=1+(R()*3|0);box(x,G+.03,z,1.4,.14,1.4,WOOD,false);for(let i=0;i<n;i++)box(x,G+.17+i*.75,z,1.2,.72,1.2,[0xb8864b,0xc99a5b,0xa8763b][(i+k)%3],false)}}
 // ---------- lonja del puerto (venta de pescado): puesto con toldo, mostrador, báscula y cajas de pescado ----------
 {const cx=LONJA.x,cz=LONJA.z;
  box(cx,G+.03,cz,5,1,1.2,0x2c5f7a,true);box(cx,G+1.03,cz,5.3,.08,1.5,0xdfe3e8,false);
  for(const dx of[-2.6,2.6])for(const dz of[-1.5,1.5])box(cx+dx,G+.03,cz+dz,.12,3.1,.12,STEEL,false);
  for(let i=0;i<6;i++)box(cx-2.5+i,G+3.1,cz,1,.12,3.4,i%2?0xf4f4f4:0x1f6f8b,false);
  board('LONJA · PESCADO FRESCO',cx,G+3.65,cz+1.75,5.4,.9,'#1f6f8b',0);
  for(const dx of[-1.7,-.6,.5]){box(cx+dx,G+1.11,cz,.95,.28,.7,0x2f7fe0,false);box(cx+dx,G+1.39,cz,.85,.05,.6,0xb0bec5,false)}
  box(cx+1.7,G+1.11,cz,.5,.12,.5,0x333a40,false);box(cx+1.7,G+1.23,cz,.42,.03,.42,0xcfd8dc,false);box(cx+1.7,G+1.5,cz-.2,.05,.45,.05,0x333a40,false);
  for(const dx of[-3.5,3.5])for(let i=0;i<2;i++)box(cx+dx,G+.03+i*.55,cz+.2,1,.55,.8,i?0xf4f4f4:0x2f7fe0,true);
  for(const dx of[-1.5,1.5])IA(box(cx+dx,G+.03,cz+1.55,.9,.5,.5,0x2f7fe0,false),'fishmkt');
  IA(box(cx,G+.03,cz-1.4,1,.5,.5,0x2f7fe0,false),'fishmkt')}
 // ---------- contenedores en la explanada ----------
 const cstack=(x,z,n,alongX)=>{const w=alongX?6:2.44,d=alongX?2.44:6;for(let i=0;i<n;i++){const c=CON[(R()*CON.length)|0],y=DK+i*2.6;box(x,y,z,w,2.6,d,c,false);
   if(alongX)box(x+w/2+.02,y+.15,z,.05,2.3,2.2,shade(c,.7),false);else box(x,y+.15,z+d/2+.02,2.2,2.3,.05,shade(c,.7),false)}
  col(x-w/2,x+w/2,z-d/2,z+d/2,DK,DK+n*2.6)};
 for(const x of[369.4,372,374.6])for(const z of[344,350.4])cstack(x,z,1+(R()*3|0),false);
 for(const x of[383.4,389.6])for(const z of[351.4,353.9,356.4])cstack(x,z,1+(R()*2|0),true);
 // carretilla elevadora de adorno
 {const x=357.5,z=341.5;box(x,DK+.25,z,1.3,.9,2,0xf1c40f,true);box(x,DK+1.15,z+.5,1.2,.1,1,0x222222,false);for(const dx of[-.55,.55])box(x+dx,DK+1.15,z+.9,.08,1.1,.08,STEEL,false);box(x,DK,z-1.1,.15,2.3,.15,STEEL,false);for(const dx of[-.3,.3])box(x+dx,DK+.1,z-1.7,.1,.08,1.2,STEEL,false)}
 // ---------- grúa pórtico sobre el muelle 1 ----------
 {const cx=389,zA=339.4,zB=346.6,H=18,gx=3.8,zs=326.6,ze=348.4,zc=(zs+ze)/2,len=ze-zs;
  for(const x of[cx-gx,cx+gx])for(const z of[zA,zB])box(x,DK,z,1,H,1,RED,true);
  for(const x of[cx-gx,cx+gx]){box(x,DK+H,zc,1.1,1.6,len,RED,false);box(x,DK+H+1.6,zc,.5,.3,len,0x8a2f0e,false)}
  for(const z of[zA,zB]){box(cx,DK+H,z,gx*2+1,1.4,1,RED,false);box(cx,DK+4.5,z,gx*2,.6,.6,RED,false);box(cx,DK+11,z,gx*2,.6,.6,RED,false)}
  for(const x of[cx-gx,cx+gx])box(x,DK+4.5,(zA+zB)/2,.6,.6,zB-zA,RED,false);
  // carro, cabina del gruista, cables y contenedor colgado
  box(cx,DK+H-3.4,333.5,2.8,2.2,2.8,0xeeeeee,false);box(cx,DK+H-3.4+.3,333.5-1.42,2.2,1.1,.05,0x1c2a33,false);box(cx,DK+H-1.2,333.5,.6,1.2,.6,STEEL,false);
  for(const dx of[-2.6,2.6])for(const dz of[-.9,.9])box(cx+dx,DK+11.8,333.5+dz,.07,2.8,.07,0x222222,false);
  box(cx,DK+11.6,333.5,6.2,.2,2.6,STEEL,false);box(cx,DK+9,333.5,6,2.6,2.44,0xf1c40f,false);box(cx+3.02,DK+9.15,333.5,.05,2.3,2.2,0xb8920b,false);
  box(cx,DK+H+1.2,ze-2,4,2,3,0x444b52,false);col(cx-1.5,cx+1.5,ze-3.5,ze-.5,DK+H,DK+H+2.2)}
 // ---------- faro en la punta del muelle 1 ----------
 {const fx=409.6,fz=343,add=(g,m,y)=>{const o=new THREE.Mesh(g,m);o.position.set(fx,y,fz);o.userData.st=1;scene.add(o)};
  add(new THREE.CylinderGeometry(1.45,1.6,3.6,14),mat(0xf4f4f4),DK+1.8);add(new THREE.CylinderGeometry(1.3,1.45,3.6,14),mat(0xc0392b),DK+5.4);add(new THREE.CylinderGeometry(1.15,1.3,3.6,14),mat(0xf4f4f4),DK+9);
  add(new THREE.CylinderGeometry(1.7,1.7,.25,14),mat(0x2b2f33),DK+10.9);add(new THREE.CylinderGeometry(.9,.9,1.8,12),new THREE.MeshBasicMaterial({color:0xfff1a8}),DK+12);add(new THREE.ConeGeometry(1.25,1.2,12),mat(0xc0392b),DK+13.5);
  col(fx-1.6,fx+1.6,fz-1.6,fz+1.6,DK,DK+14)}
 // ---------- buque de carga amarrado al muelle 1 (proa hacia el oeste, popa con puente al este) ----------
 {const cx=395,cz=331.5,L=34,B=11,g=new THREE.Group();g.position.set(cx,-.4,cz);
  g.add(new THREE.Mesh(hullGeo(L,B,-1.2,1.8,7),mat(0x8e2f2a)));g.add(new THREE.Mesh(hullGeo(L,B,.6,2.2,7),mat(0x2b3440)));
  box(2,2.8,0,26,.05,B-1.2,0x58625a,false,g);
  for(const bx of[-6,.3,6.6])for(const z of[-2.6,0,2.6]){const n=1+(R()*2|0);for(let i=0;i<n;i++){const c=CON[(R()*CON.length)|0];box(bx,2.85+i*2.6,z,6,2.6,2.44,c,false,g)}}
  box(12,2.85,0,8,3.2,B-1.8,0xf2f2f2,false,g);box(12.5,6.05,0,6,2.6,B-3,0xf2f2f2,false,g);box(12.7,8.65,0,5,1.6,B-1.6,0xe6e6e6,false,g);
  box(9.65,9.2,0,.06,.7,B-2.4,0x1c2a33,false,g);box(9.55,6.8,0,.06,.6,B-3.6,0x1c2a33,false,g);
  const fn=new THREE.Mesh(new THREE.CylinderGeometry(1,1.15,3.4,12),mat(0xc0392b));fn.position.set(14.2,8,0);g.add(fn);const ft=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1,.5,12),mat(0x1b1b1b));ft.position.set(14.2,9.9,0);g.add(ft);
  box(12.7,10.25,0,.15,3.2,.15,0x888888,false,g);box(-13.5,2.85,0,.3,2.4,.3,0xdddddd,false,g);box(-14.2,2.85,0,.9,.9,.9,0x6b4a2b,false,g);
  floatIt(g,-.4,.004);col(cx-L/2+3,cx+L/2,cz-B/2,cz+B/2,-1.6,2.8)}
 // ---------- barcos amarrados (fase 1): muelle 2 (pesca), muelle 1 y entre los muelles 3 · 4 · 5 ----------
 mkBoat('pesquero',348.8,309,Math.PI/2,0x1f4f8a,'Santa Lucía');mkBoat('lancha',364.4,311,Math.PI/2,0xb03a2e,'Brisa');mkBoat('pesquero',364.6,320.5,Math.PI/2,0x1e8449,'Nuevo Amanecer');
 mkBoat('velero',405.5,351,0,0xf2f2f2,'Libertad',true);
 mkBoat('lancha',413,371,Math.PI,0x2980b9,'Ola Azul',true);mkBoat('velero',415,389.5,Math.PI,0x1f3a5f,'Cierzo',true);mkBoat('pesquero',413,405,Math.PI,0xd4ac0d,'San Telmo',true);
 // ---------- detalles: farolas, carteles, cajas y bancos ----------
 for(const a of[[383,338.6,0,1],[401,338.6,0,1],[384,347.4,0,-1],[407,347.4,0,-1],[352.5,312,1,0],[359.5,319,-1,0],[372,336,0,1],[346,341,0,-1]])lampPost(a[0],a[1],a[2],a[3]);
 box(380,G,337.4,.2,3.8,.2,STEEL,false);board('MUELLE 1 · CARGA',380,DK+3.4,337.4+.3,4.8,1.2,'#1f6f8b',0);
 box(356,G,327.2,.2,3.8,.2,STEEL,false);board('MUELLE 2 · PESCA',356,DK+3.4,327.2+.3,4.8,1.2,'#8a5a2b',0);
 [[353.2,306.6],[353.4,308.2],[358.6,306.4]].forEach((p,i)=>box(p[0],DK,p[1],i?.8:.9,.7,i?.8:.9,i?WOODD:0xb8864b,true));
 IA(box(359.2,DK,322.6,.5,.45,1.6,WOODD,true),'sit');IA(box(352.8,DK,322.6,.5,.45,1.6,WOODD,true),'sit');
 PLACES.push({x:343,z:341,key:'port',l:'⚓',c:'#1f6f8b',nt:1});
 // ---------- zona sur: paseo de madera y tres muelles que salen hacia el este (mar abierto) ----------
 {const wood=(x0,x1,z0,z1)=>{sl(x0,x1,z0,z1,DK-.37,DK,WOOD);FLOORS.push({x0,x1,z0,z1,y:DK});BLD.push([x0,z0,x1-x0,z1-z0,'#8a6a45']);
   const alongX=(x1-x0)>(z1-z0);for(let p=(alongX?x0:z0)+.8;p<(alongX?x1:z1);p+=1.5){if(alongX)box(p,DK,(z0+z1)/2,.1,.015,z1-z0,WOODD,false);else box((x0+x1)/2,DK,p,x1-x0,.015,.1,WOODD,false)}},
   piles=(x0,x1,z0,z1)=>{for(let x=x0+.3;x<=x1;x+=3.6)for(const z of[z0+.25,z1-.25])box(x,-3.2,z,.4,3.2+DK+.5,.4,WOODD,false)},
   stairs=(x,z0)=>{for(let k=1;k<=4;k++){const y=DK-.4375*k,za=z0+(k-1)*1.2;sl(x,x+2.4,za,za+1.2,-3,y,0x7a5a38);FLOORS.push({x0:x,x1:x+2.4,z0:za,z1:za+1.2,y})}};
  sl(386,392,358,400,-3.2,DK-.4,0x6b4f33);wood(386,392,358,400); // paseo (bloque macizo de madera hasta el fondo, junto a la costa)
  const P=[[362,367,422,'MUELLE 3'],[377,383,432,'MUELLE 4'],[393,398,418,'MUELLE 5']];
  P.forEach(([z0,z1,xe,name],i)=>{wood(392,xe,z0,z1);piles(392,xe,z0,z1);const zc=(z0+z1)/2;
   for(let x=396;x<=xe-2;x+=4){bol(x,z0+.5);bol(x,z1-.5)}
   box(xe-.3,DK,zc,.3,.5,z1-z0,WOODD,false);                 // tope de la punta
   M(xe-1.2,zc,.22,z1-z0-.8,YEL);floorTxt(name,402,zc,Math.min(4.6,z1-z0-.6),1.8,-Math.PI/2);
   lampPost(i===1?414:406+i*2,z1-.35,0,-1);
   stairs(405,z1)});
  // farolas del paseo, cartel, bancos y cajas
  for(const z of[366,378,390])lampPost(386.4,z,1,0);
  box(389,G,359.6,.2,3.8,.2,STEEL,false);board('MUELLES 3 · 4 · 5',389,DK+3.4,359.6+.3,4.8,1.2,'#8a5a2b',0);
  [[387,371],[387,386],[387,397]].forEach(p=>IA(box(p[0],DK,p[1],.5,.45,1.6,WOODD,true),'sit'));
  [[390.6,369],[390.8,370.4],[390.7,384],[390.6,395]].forEach((p,i)=>box(p[0],DK,p[1],i%2?.8:.9,i%2?.7:.8,i%2?.8:.9,i%2?WOODD:0xb8864b,true))}
 // escalera de pie en el muelle 1 para salir del agua (4 peldaños de ~44 cm)
 for(let k=1;k<=4;k++){const y=DK-.4375*k,z0=348+(k-1)*1.2;sl(398,400.4,z0,z0+1.2,-3,y,CONC);FLOORS.push({x0:398,x1:400.4,z0,z1:z0+1.2,y})}
 seed=sd0;G=G0})();


