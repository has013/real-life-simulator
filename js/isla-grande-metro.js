/* ===============================================================================================
   FICHA · isla-grande-metro.js
   Qué hay:          Isla grande (sección 11): barrio con calles, casas y comercios, terrenos (parcelas) y el metro (10.5: estaciones, trenes, billetes).
   Tócalo si quieres: añadir algo en la isla grande, cambiar el metro
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 11. ISLA GRANDE
//     Barrio con calles, casas y comercios, y los terrenos (parcelas) que se pueden comprar para construir.
// =================================================================================================

// ---------- 11.1 Barrio con calles, casas y comercios ----------
// Manzanas de 40 m con calles de 14 m (como el barrio principal) en el norte y el sur de la isla; la franja central (pueblo, camino al muelle y aeródromo) se queda como estaba.
// Las calles están alineadas con el camino de arena que baja al muelle. Los comercios no cuentan como destino de taxi (la isla solo se alcanza en barco o avión).
(function(){const sd0=seed,XS=(ISLDOCK?ISLDOCK.x:ISL.x)+7,ROWS=[748,802,856,910,1021,1075,1129,1183],
 ISEQ=['house','shop:food','house','shop:bar','house','house','shop:shop','house','shop:furn','house','shop:bank','house','shop:estate','house','shop:food','house'];let k=0,q=0;
 const okCell=(x0,z0)=>{if(z0>=1075)return false; for(let a=-7;a<=47;a+=9)for(let b=-7;b<=47;b+=9)if(islV(x0+a,z0+b)<16)return false;return true};
 for(const z0 of ROWS)for(let i=-8;i<=8;i++){const x0=XS+54*i;if(!okCell(x0,z0))continue;
  box(x0+20,0,z0+20,54,.1,54,0x3d3d40,false);box(x0+20,0,z0+20,40,G,40,0xb9b6ad,false);
  colliders.push({x0:x0+3,x1:x0+37,z0:z0+3,z1:z0+37,y1:9,car:true,on:true});BLD.push([x0-7,z0-7,54,54,'#3d3d40'],[x0,z0,40,40,'#b9b6ad']);
  [10,30].forEach(a=>{lampPost(x0+a,z0+1,0,-1);lampPost(x0+a,z0+39,0,1);lampPost(x0+1,z0+a,-1,0);lampPost(x0+39,z0+a,1,0)});
  const big=(q++%7)===3;
  for(let b=0;b<2;b++){const fz=b?1:-1,pz=z0+3+b*17+8.5,h0=HOUSES.length,p0=PLACES.length;
   if(big&&b==0)shop('super',x0+20,pz,fz,33.5);
   else for(let a=0;a<2;a++)place(ISEQ[(k++*5)%ISEQ.length],x0+3+a*17+8.5,pz,fz);
   for(let j=h0;j<HOUSES.length;j++){HOUSES[j].isl=true;HOUSES[j].price=9000}
   for(let j=p0;j<PLACES.length;j++)PLACES[j].nt=1}}
 seed=sd0})();
// palmeras repartidas por la isla grande (sin tocar la zona de pista, plataforma, hangar y helipuertos)
(function(){for(let k=0,n=0;k<2500&&n<60;k++){const a=(k*2.399)%6.283,r=30+(k*53%200),x=ISLC.x+Math.cos(a)*r,z=ISLC.z+Math.sin(a)*r;
 if(Math.abs(z-(610+ISLDZ+130))<70&&x>170&&x<540)continue;if(islV(x,z)<26||!buildOK(x,z,1.6,1.6))continue;
 const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,4.4,6),mat(0x7a5a3a));t.position.set(x,2.2,z);t.rotation.z=(k%3-1)*.07;scene.add(t);t.userData.st=1;
 const l=new THREE.Mesh(new THREE.IcosahedronGeometry(1.9,0),mat(0x4f8a3c));l.scale.set(1.5,.5,1.5);l.position.set(x,4.6,z);scene.add(l);l.userData.st=1;
 colliders.push({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3,y0:0,y1:4.4,on:true});BLD.push([x-1.6,z-1.6,3.2,3.2,'#4f8a3c']);n++}})();


// ---------- 11.2 Terrenos (parcelas) de la isla principal ----------
// Fase 1: solo existen en el mundo (suelo, vallado, cartel con número) y en el minimapa. Todavía no se pueden comprar.
// Fase 2 (pendiente): comprar/vender. Cada parcela ya lleva sus campos: owned, owner, price.
// Medidas variadas (24×24 pequeñas · 30×30 medianas · 34–36 grandes · algunas rectangulares). [id, x, z, ancho, fondo]
// Coordenadas sacadas del mapa terrenos_isla_principal.png (1 px = 1 m; x = px-120,5 · z = px-110,5). x,z = centro de la parcela.
const TERRENO_M2=20; // precio del terreno: € por m²
const TERRENOS=(function(){
 const D=[[0,402,-82,34,34],[1,438,-78,24,24],[2,474,-78,30,30],[3,510,-70,24,30],[4,546,-54,34,34],[5,582,-30,24,24],[6,350,-26,36,36],[7,618,18,24,24],[8,638,110,30,44],[9,634,146,24,24],[10,338,218,36,36],[11,586,230,24,24],[12,374,250,30,30],[13,546,258,24,24],[14,506,274,24,24],[15,-26,346,30,30],[16,250,346,24,24],[17,286,346,36,30],[18,210,350,36,36],[19,10,354,30,30],[20,174,358,30,30],[21,-30,382,24,24],[22,246,382,30,30],[23,282,382,24,24],[24,318,386,30,30],[25,354,386,36,30],[26,6,390,30,30],[27,-30,418,24,36],[30,6,426,30,30],[40,-18,462,30,30]],
 list=D.map(([id,x,z,w,d])=>({id,x,z,w,d,owned:false,owner:null,price:w*d*TERRENO_M2}));
 // atlas con el cartel de cada parcela (8x8 celdas de 128 px)
 const AC=8,CS=128,cv=document.createElement('canvas');cv.width=cv.height=AC*CS;const g=cv.getContext('2d');
 list.forEach(t=>{const cx=(t.id%AC)*CS,cy=((t.id/AC)|0)*CS;g.fillStyle='#1f6f4a';g.fillRect(cx,cy,CS,CS);g.strokeStyle='#fff';g.lineWidth=6;g.strokeRect(cx+5,cy+5,CS-10,CS-10);
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='bold 19px sans-serif';g.fillText('TERRENO',cx+CS/2,cy+32);g.font='bold '+(t.id>=10?56:66)+'px sans-serif';g.fillText(String(t.id),cx+CS/2,cy+72);g.font='bold 17px sans-serif';g.fillText(t.w+' × '+t.d+' m',cx+CS/2,cy+108)});
 const tex=new THREE.CanvasTexture(cv);tex.generateMipmaps=false;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
 const mk=()=>({p:[],u:[]}),tri=(o,a,b,c,ua,ub,uc)=>{o.p.push(...a,...b,...c);if(ua)o.u.push(...ua,...ub,...uc)},
  quadUV=(o,P,U)=>{tri(o,P[0],P[1],P[2],U[0],U[1],U[2]);tri(o,P[0],P[2],P[3],U[0],U[2],U[3])},
  Yg=(x,z)=>heightAt(x,z),
  floor=(o,x0,z0,x1,z1,dy)=>{const a=[x0,Yg(x0,z0)+dy,z0],b=[x1,Yg(x1,z0)+dy,z0],c=[x1,Yg(x1,z1)+dy,z1],d=[x0,Yg(x0,z1)+dy,z1];tri(o,a,c,b);tri(o,a,d,c)},
  pad=mk(),bord=mk(),post=mk(),sg=mk();
 const addBox=(o,cx,y0,cz,w,h,d)=>{const b=new THREE.BoxGeometry(w,h,d).toNonIndexed(),pa=b.attributes.position.array;for(let i=0;i<pa.length;i+=3)o.p.push(pa[i]+cx,pa[i+1]+y0+h/2,pa[i+2]+cz)};
 for(const t of list){
  const x0=t.x-t.w/2,x1=t.x+t.w/2,z0=t.z-t.d/2,z1=t.z+t.d/2,n=10,sx=t.w/n,sz=t.d/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)floor(pad,x0+i*sx,z0+j*sz,x0+(i+1)*sx,z0+(j+1)*sz,.06);
  // borde blanco (0,5 m) siguiendo el terreno
  const o1=.15,o2=.65,seg=10;
  for(let k=0;k<seg;k++){const fa=k/seg,fb=(k+1)/seg,xa=x0+t.w*fa,xb=x0+t.w*fb,za=z0+t.d*fa,zb=z0+t.d*fb;
   floor(bord,xa,z0+o1,xb,z0+o2,.09);floor(bord,xa,z1-o2,xb,z1-o1,.09);floor(bord,x0+o1,za,x0+o2,zb,.09);floor(bord,x1-o2,za,x1-o1,zb,.09)}
  // postes en las 4 esquinas
  for(const [px,pz] of[[x0+.9,z0+.9],[x1-.9,z0+.9],[x0+.9,z1-.9],[x1-.9,z1-.9]])addBox(post,px,Yg(px,pz),pz,.3,1.2,.3);
  // poste alto con cartel de dos caras (esquina noroeste)
  const px=x0+2.4,pz=z0+2.4,y0=Yg(px,pz),cu=t.id%AC,cr=(t.id/AC)|0,u0=cu/AC,u1=(cu+1)/AC,v1=1-cr/AC,v0=1-(cr+1)/AC,bw=1.1,yb=y0+1.3,yt=y0+3.5;
  addBox(post,px,y0,pz,.22,3.5,.22);
  quadUV(sg,[[px-bw,yt,pz+.13],[px+bw,yt,pz+.13],[px+bw,yb,pz+.13],[px-bw,yb,pz+.13]],[[u0,v1],[u1,v1],[u1,v0],[u0,v0]]);
  quadUV(sg,[[px+bw,yt,pz-.13],[px-bw,yt,pz-.13],[px-bw,yb,pz-.13],[px+bw,yb,pz-.13]],[[u0,v1],[u1,v1],[u1,v0],[u0,v0]]);
  // número grande en el suelo (se ve desde el aire)
  const r=4,yc=Yg(t.x,t.z)+.13;
  quadUV(sg,[[t.x-r,yc,t.z-r],[t.x+r,yc,t.z-r],[t.x+r,yc,t.z+r],[t.x-r,yc,t.z+r]],[[u0,v1],[u1,v1],[u1,v0],[u0,v0]]);
 }
 const build=(o,m,sh)=>{const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));if(o.u.length)ge.setAttribute('uv',new THREE.Float32BufferAttribute(o.u,2));if(sh)ge.computeVertexNormals();const me=new THREE.Mesh(ge,m);scene.add(me);return me};
 const lm=(c,po)=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:po,polygonOffsetUnits:po});
 build(pad,lm(0xcdbf88,-1),true);build(bord,lm(0xf4f1e6,-2),true);build(post,new THREE.MeshLambertMaterial({color:0x7a5a3a}),true);
 build(sg,new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),false);
 // al comprar una parcela se tiñe de verde (se crea la primera vez que hace falta)
 const gm=lm(0x58b85a,-1.5);
 list.forEach(t=>{t.mark=null;t.setOwned=function(v){t.owned=!!v;if(v&&!t.mark){const o=mk(),x0=t.x-t.w/2,z0=t.z-t.d/2,n=10,sx=t.w/n,sz=t.d/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++)floor(o,x0+i*sx,z0+j*sz,x0+(i+1)*sx,z0+(j+1)*sz,.075);t.mark=build(o,gm,true)}if(t.mark)t.mark.visible=!!v}});
 return list})();


// ---------- 10.5 Metro (se construye aquí, después de la isla grande, porque busca solares libres entre lo ya construido) ----------
// 5 estaciones subterráneas: 3 en la isla principal (Hospital, Centro en la plaza del Ayuntamiento y Aeropuerto) y 2 en la isla grande (Pueblo pesquero y Aeródromo).
// Línea M1 (roja): Hospital – Centro – Aeropuerto · Línea M2 (verde, por un túnel bajo el mar): Aeropuerto – Pueblo pesquero – Aeródromo. Transbordo en Aeropuerto.
// Cada estación: boca con barandilla y tótem «M» → escalera que baja 6 m → andén central con dos vías, máquinas de billetes al pie de la escalera y paneles con la cuenta atrás.
// Los trenes siguen un horario fijo según la hora real (Date.now), así todos los jugadores ven los mismos trenes. Cada línea es un ir y venir entre sus dos extremos.
// Para viajar: compra un billete en la máquina (E), espera en el andén, sube con E cuando el tren tenga las puertas abiertas y baja con E en la estación que quieras.
const MLINES=[{id:'M1',hex:'#d62828',st:['hos','cen','aer'],off:0},{id:'M2',hex:'#1e9e4a',st:['aer','pue','aed'],off:23}],
 METRO=[],MST={},MFARE=15,MFARE_ISL=30,
 // horario: RUN s entre estaciones (de puerta a puerta), DW s con las puertas abiertas, AP s de entrada/salida por el andén, D0 m recorridos en ellas, NT trenes por línea
 MSC={RUN:24,DW:16,AP:7,D0:30,NT:2},
 // medidas en coordenadas locales: a = a lo largo de la escalera (+ hacia la calle), b = de lado. La boca es el cuadrado a,b ∈ [-2,2]; la escalera baja hasta a=A0;
 // el andén va de A1 a A0 (el tren para centrado en AS) y las vías siguen por túneles cortos hasta AE (fondo) y AN (lado de la escalera)
 MG={DEP:6,CEIL:2,A0:-7.6,A1:-33.6,AS:-20.6,AE:-38.6,AN:-2.6,TB:4.8},
 MT={from:null,sel:null,view:null,pt:0,cab:null,rt:0,lastH:null};
const metroLinesOf=k=>MLINES.filter(l=>l.st.includes(k)),metroFare=(a,b)=>a.isl!==b.isl?MFARE_ISL:MFARE,
 metroChip=l=>'<span style="display:inline-block;min-width:26px;padding:1px 5px;border-radius:5px;background:'+l.hex+';color:#fff;font:700 12px system-ui;text-align:center">'+l.id+'</span>',
 mHex=h=>parseInt(h.slice(1),16),mMod=(a,b)=>((a%b)+b)%b,mNow=()=>Date.now()/1000,
 mFmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+pad2(s%60)},
 mRR=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();g.fill()};
// marco local de una estación: Q(a,b) → punto del mundo, R(a0,a1,b0,b1) → rectángulo del mundo, loc(x,z) → [a,b]
function metroLocal(X){const f=X.f,s=[-f[1],f[0]],Q=(a,b)=>[X.x+f[0]*a+s[0]*b,X.z+f[1]*a+s[1]*b];
 return{s,Q,R:(a0,a1,b0,b1)=>{const p=Q(a0,b0),q=Q(a1,b1);return{x0:Math.min(p[0],q[0]),x1:Math.max(p[0],q[0]),z0:Math.min(p[1],q[1]),z1:Math.max(p[1],q[1])}},
  loc:(x,z)=>{const dx=x-X.x,dz=z-X.z;return[dx*f[0]+dz*f[1],dx*s[0]+dz*s[1]]}}}
// busca sitio para una estación cerca de (px,pz). La boca queda alineada con la cuadrícula de 4 m del terreno (para poder quitarle esa celda) y se abre hacia «look».
// En superficie: una explanada de 14x8 m llana, en tierra firme, lejos de la autopista y sin pisar nada. Bajo tierra (42x15 m): tierra (no playa ni mar) y nunca más de 1,2 m por debajo de la boca.
function metroSpot(px,pz,look,avoid,spots){const R=[],UG=[],hit=(r,q)=>r[0]<q.x1&&r[2]>q.x0&&r[1]<q.z1&&r[3]>q.z0;
 BLD.forEach(b=>R.push([b[0]-1,b[1]-1,b[0]+b[2]+1,b[1]+b[3]+1]));FACS.forEach(s=>R.push([s.x-s.w/2-6,s.z-s.d/2-16,s.x+s.w/2+6,s.z+s.d/2+4]));
 FLOORS.forEach(f=>R.push([f.x0-1,f.z0-1,f.x1+1,f.z1+1]));TERRENOS.forEach(t=>R.push([t.x-t.w/2-2,t.z-t.d/2-2,t.x+t.w/2+2,t.z+t.d/2+2]));
 R.push([-30,-30,N*P+2,N*P+2]);(avoid||[]).forEach(r=>R.push(r));PITS.forEach(p=>UG.push([p.x0-2,p.z0-2,p.x1+2,p.z1+2]));
 spots.forEach(s=>{const M=metroLocal(s),q=M.R(MG.AE-3,6,-10,10);UG.push([q.x0,q.z0,q.x1,q.z1]);R.push([q.x0,q.z0,q.x1,q.z1])});
 const HC=new Map(),hA=(x,z)=>{const k=x*1e5+z;let v=HC.get(k);if(v===undefined){v=heightAt(x,z);HC.set(k,v)}return v},
  cand=[];for(let x=Math.round(px/4)*4-88;x<=px+88;x+=4)for(let z=Math.round(pz/4)*4-88;z<=pz+88;z+=4)cand.push([x,z,Math.hypot(x-px,z-pz)]);cand.sort((a,b)=>a[2]-b[2]);
 for(const[cx,cz]of cand){if(hwNear(cx,cz).d<=24)continue;
  const lk=typeof look==='function'?look({x:cx,z:cz}):look,lx=lk[0]-cx,lz=lk[1]-cz;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort((u,v)=>(v[0]*lx+v[1]*lz)-(u[0]*lx+u[1]*lz));
  for(const f of dirs){const X0={x:cx,z:cz,f},M=metroLocal(X0),pr=M.R(-11,5,-5,5),fr=M.R(MG.AE-.4,2.2,-7.2,7.2);
   if(R.some(r=>hit(r,pr))||UG.some(r=>hit(r,fr)))continue;
   if(colliders.some(c=>c.x0<pr.x1&&c.x1>pr.x0&&c.z0<pr.z1&&c.z1>pr.z0))continue;
   let ok=true,lo=1e9,hi=-1e9;
   for(let a=-10;a<=4&&ok;a+=2)for(let b=-4;b<=4;b+=2){const p=M.Q(a,b);if(isl(p[0],p[1])<=BEACH+2||portPf(p[0],p[1])<1){ok=false;break}const h=hA(p[0],p[1]);lo=Math.min(lo,h);hi=Math.max(hi,h)}
   if(!ok||hi-lo>.6)continue;const ys=hi+.08;if(ys>4)continue;
   for(let a=-40;a<=2&&ok;a+=2)for(let b=-7;b<=7;b+=2){const p=M.Q(a,b),h=hA(p[0],p[1]);if(h<ys-1.2||h<-.1||isl(p[0],p[1])<=BEACH){ok=false;break}}
   if(ok)return{x:cx,z:cz,f,ys,lo}}}
 return null}
// texturas: logotipo «M» y cartel con el nombre de la estación
const metroTex=(function(){let mt=null;const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 return{logo(){if(mt)return mt;const c=cv(128,128),g=c.getContext('2d');g.fillStyle='#fff';mRR(g,0,0,128,128,18);g.fillStyle='#c62828';mRR(g,8,8,112,112,14);
   g.fillStyle='#fff';g.font='bold 96px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('M',64,70);return mt=new THREE.CanvasTexture(c)},
  plate(name,lines){const c=cv(512,128),g=c.getContext('2d');g.fillStyle='#1d2733';g.fillRect(0,0,512,128);let x=16;
   lines.forEach(l=>{g.fillStyle=l.hex;mRR(g,x,34,70,60,10);g.fillStyle='#fff';g.font='bold 40px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(l.id,x+35,66);x+=80});
   g.fillStyle='#fff';g.font='bold '+(name.length>16?38:48)+'px Arial,sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(name,x+8,66);return new THREE.CanvasTexture(c)}}})();
// une muchas cajas de colores en una sola malla (una llamada de dibujo por estación)
const MLAM=new THREE.MeshLambertMaterial({vertexColors:true}),MBAS=new THREE.MeshBasicMaterial({vertexColors:true});
function mMergeGeo(list){const P=[],Nn=[],C=[];list.forEach(([g,c])=>{const n=g.toNonIndexed(),col=new THREE.Color(c),pa=n.attributes.position,na=n.attributes.normal;
  for(let i=0;i<pa.count;i++){P.push(pa.getX(i),pa.getY(i),pa.getZ(i));Nn.push(na.getX(i),na.getY(i),na.getZ(i));C.push(col.r,col.g,col.b)}});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return bg}
const mBox=(x0,x1,y0,y1,z0,z1)=>new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0).translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
// tren de dos coches (20 m), en coordenadas propias: z a lo largo, y desde el carril. Una geometría por línea (cambia la franja de color)
const mTrainGeo=(function(){const C={};return L=>{if(C[L.id])return C[L.id];const A=[],B=[],W=1.4,LC=4.85,lc=mHex(L.hex),GL=0x1b2733,
 bx=(x0,x1,y0,y1,z0,z1,c,b)=>(b?B:A).push([mBox(x0,x1,y0,y1,z0,z1),c]),side=(sd,d,y0,y1,z0,z1,c)=>bx(sd>0?W:-W-d,sd>0?W+d:-W,y0,y1,z0,z1,c);
 for(const zc of[-5,5]){bx(-W,W,.45,3.25,zc-LC,zc+LC,0xeef0f2);bx(-1.3,1.3,3.25,3.4,zc-LC+.3,zc+LC-.3,0xc5c9ce);bx(-1.35,1.35,.28,.45,zc-LC+.2,zc+LC-.2,0x2a2d31);
  for(const o of[-3.4,3.4])bx(-1.1,1.1,.05,.4,zc+o-1,zc+o+1,0x1c1e21);
  for(const sd of[-1,1]){side(sd,.02,1,1.25,zc-LC,zc+LC,lc);
   [[zc-LC+.4,zc-3.75],[zc-2.25,zc-.75],[zc+.75,zc+2.25],[zc+3.75,zc+LC-.4]].forEach(w=>side(sd,.02,1.55,2.45,w[0],w[1],GL));
   for(const o of[-3,0,3]){side(sd,.035,.5,2.7,zc+o-.65,zc+o+.65,0x8d949c);side(sd,.045,1.6,2.4,zc+o-.45,zc+o+.45,GL)}}}
 bx(-.9,.9,.8,2.6,-.15,.15,0x30343a);
 for(const e of[-1,1]){const z0=e*9.85,z1=e*9.88,zl=Math.min(z0,z1),zh=Math.max(z0,z1);bx(-1,1,1.7,2.6,zl,zh,GL);bx(-W,W,1,1.25,zl,zh,lc);
  for(const x of[-.9,.9])bx(x-.2,x+.2,.9,1.15,Math.min(z0,e*9.9),Math.max(z0,e*9.9),0xfff6d0,true)}
 return C[L.id]={A:mMergeGeo(A),B:mMergeGeo(B)}}})();
// panel con la cuenta atrás de una vía (se redibuja solo cuando cambia el texto)
function mPanel(){const c=document.createElement('canvas');c.width=512;c.height=128;return{c,tx:new THREE.CanvasTexture(c),last:''}}
function mPanelDraw(P,t,nx){const L=t.line,dest=nx?mTermName(L,nx.dout):'',st=!nx?'No circula':nx.dwell?'EN ANDÉN':'Próximo tren',tm=nx?mFmt(nx.w):'',key=dest+st+tm;if(P.last===key)return;P.last=key;
 const g=P.c.getContext('2d');g.fillStyle='#0b0f14';g.fillRect(0,0,512,128);g.strokeStyle='#39424e';g.lineWidth=6;g.strokeRect(3,3,506,122);
 g.fillStyle=L.hex;mRR(g,16,24,84,80,12);g.fillStyle='#fff';g.font='bold 44px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(L.id,58,66);
 g.textAlign='left';g.font='bold 36px Arial,sans-serif';g.fillText(dest?'→ '+dest:'',116,46);g.font='bold 28px Arial,sans-serif';g.fillStyle=nx&&nx.dwell?'#5fe07a':'#ffcf4a';g.fillText(st+(nx&&nx.dwell?' · sale en':''),116,92);
 g.textAlign='right';g.font='bold 60px Arial,sans-serif';g.fillStyle=nx&&nx.dwell?'#5fe07a':'#ffcf4a';g.fillText(tm,496,66);P.tx.needsUpdate=true}
// construye una estación entera (superficie, escalera, andén, vías, máquinas, paneles y trenes) en una o dos mallas
function metroBuild(X){const{Q,R}=X,{ys,yF,yC,yT,yR}=X,{A0,A1,AE,AN,TB}=MG,L=[],LB=[],ry=Math.atan2(X.f[0],X.f[1]),
 SB=(a0,a1,b0,b1,y0,y1,c,o)=>{o=o||{};const r=R(a0,a1,b0,b1);(o.bas?LB:L).push([mBox(r.x0,r.x1,y0,y1,r.z0,r.z1),c]);if(o.sol)colliders.push(Object.assign({y0,y1,on:true},r))},
 CL=(a0,a1,b0,b1,y0,y1,car)=>colliders.push(Object.assign({y0,y1,on:true},car?{car:true}:{},R(a0,a1,b0,b1))),
 TILE=0xe9e3d6,KC=0x9a9690,RC=0x2b2f36,CEIL=0xa9a59c,lines=metroLinesOf(X.k),lc=mHex(lines[0].hex),both=fn=>{fn(1);fn(-1)},
 plate=new THREE.MeshBasicMaterial({map:metroTex.plate(X.name,lines)});
 // --- superficie: explanada (fuera de la ciudad), bordillo, barandilla y tótem ---
 if(!X.city){[[-10,-2,-4,4],[2,4,-4,4],[-2,2,2,4],[-2,2,-4,-2]].forEach(q=>{SB(q[0],q[1],q[2],q[3],ys-.3,ys,0xb8b2a4);FLOORS.push(Object.assign({y:ys},R(q[0],q[1],q[2],q[3])))});
  [[-10,-9.8,-4,4],[3.8,4,-4,4],[-9.8,3.8,3.8,4],[-9.8,3.8,-4,-3.8]].forEach(q=>SB(q[0],q[1],q[2],q[3],X.lo-.6,ys-.3,0xa8a294));
  const r=R(-10,4,-4,4);BLD.push([r.x0,r.z0,r.x1-r.x0,r.z1-r.z0,'#b8b2a4'])}
 else{const r=R(-2.2,2,-2.1,2.1);BLD.push([r.x0,r.z0,r.x1-r.x0,r.z1-r.z0,'#7d838c'])}
 both(sd=>{SB(-2,2,sd*1.6,sd*2.1,ys,ys+.25,KC);SB(-2.2,2,sd*1.81,sd*1.89,ys+1.05,ys+1.12,RC);for(let i=0;i<5;i++){const a=-2.1+i*1.025;SB(a-.035,a+.035,sd*1.815,sd*1.885,ys+.25,ys+1.05,RC)}
  CL(-2.2,2,sd*1.6,sd*2.1,yF-.2,ys+1.15)});
 SB(-2.2,-2,-2.1,2.1,ys,ys+.25,KC);SB(-2.14,-2.06,-1.85,1.85,ys+1.05,ys+1.12,RC);for(const b of[-.9,0,.9])SB(-2.135,-2.065,b-.035,b+.035,ys+.25,ys+1.05,RC);
 CL(-2.2,-2,-2.1,2.1,ys,ys+1.15);CL(-2.2,2,-2.1,2.1,ys-1,ys+1.2,true); // barandilla del fondo · los coches no entran en la boca
 {const tp=Q(X.tot[0],X.tot[1]),lm=new THREE.MeshBasicMaterial({map:metroTex.logo()});
  box(tp[0],ys,tp[1],.16,3.3,.16,RC,true);box(tp[0],ys+2.75,tp[1],1.02,1.02,.14,RC,false).rotation.y=ry;box(tp[0],ys+2.2,tp[1],1.62,.44,.12,RC,false).rotation.y=ry;
  for(const sd of[1,-1]){const o=sd*.075,a=new THREE.Mesh(new THREE.PlaneGeometry(.94,.94),lm),b=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.39),plate);
   a.position.set(tp[0]+X.f[0]*o,ys+3.26,tp[1]+X.f[1]*o);b.position.set(tp[0]+X.f[0]*o*.85,ys+2.42,tp[1]+X.f[1]*o*.85);a.rotation.y=b.rotation.y=ry+(sd<0?Math.PI:0);scene.add(a);scene.add(b)}}
 // --- escalera: 24 peldaños de 25 cm; la parte de atrás va cubierta (techo bajo la explanada) ---
 both(sd=>{SB(-2,2,sd*1.6,sd*2,yF-.2,ys,TILE);SB(A0,-2,sd*1.6,sd*2,yF-.2,ys-.4,TILE,{sol:true})});
 SB(A0,-2,-2,2,ys-.4,ys-.3,CEIL,{sol:true,bas:true});SB(A0-.2,A0,-2,2,yC,ys-.4,TILE,{sol:true});
 {const n=24,tr=(2-A0)/n,rs=(ys-yF)/n;for(let k=0;k<n;k++){const a1=2-tr*k,top=ys-rs*(k+.5);SB(a1-tr,a1,-1.6,1.6,yF-.2,top,0x8f8c86);SB(a1-.06,a1,-1.55,1.55,top,top+.012,0xe0b030)}}
 both(sd=>{const len=Math.hypot(2-A0,ys-yF),m=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,len),mat(RC)),p=Q((2+A0)/2,sd*1.52);
  m.rotation.order='YXZ';m.rotation.y=ry;m.rotation.x=-Math.atan2(ys-yF,2-A0);m.position.set(p[0],(ys+yF)/2+.9,p[1]);scene.add(m)});
 RAMPS.push(Object.assign({y0:yF,rise:ys-yF,ax:X.f[0]!==0,up:X.f[0]||X.f[1]},R(A0,2,-1.6,1.6)));
 PITS.push(R(-2.2,2,-1.6,1.6),Object.assign({top:ys-.4},R(A0,-2.2,-1.6,1.6)),Object.assign({top:yC},R(A1,A0,-6.6,6.6)));
 // --- andén central, vías, paredes, techo y túneles cortos a ambos lados ---
 SB(A1,A0,-3,3,yT-.3,yF,0xb3ada2);FLOORS.push(Object.assign({y:yF},R(A1,A0,-3,3)));
 both(sd=>{const tb=sd*TB;SB(A1,A0,sd*2.55,sd*2.8,yF,yF+.012,0xf2c230);CL(A1,A0,sd*3,sd*3.15,yF,yF+2.6); // línea de seguridad y barrera invisible al borde del andén
  SB(AE,AN,sd*3,sd*6.6,yT-.3,yT,0x3b3631);SB(AE,AN,tb-.76,tb-.68,yT,yR,0x9aa0a6);SB(AE,AN,tb+.68,tb+.76,yT,yR,0x9aa0a6);
  for(let a=AE+.6;a<AN;a+=1.2)SB(a-.13,a+.13,tb-1.1,tb+1.1,yT,yT+.07,0x4d4036);
  SB(AE,AN,sd*6.6,sd*7,yT-.3,yC,TILE,{sol:true});SB(A1,A0,sd*6.56,sd*6.6,yF+2,yF+2.3,lc);
  for(const[a0,a1]of[[AE,A1],[A0,AN]]){SB(a0,a1,sd*2.6,sd*3,yT-.3,yT+4.4,TILE,{sol:true});SB(a0,a1,sd*2.6,sd*7,yT+4.4,yT+4.6,CEIL,{bas:true})}
  SB(AE-.3,AE,sd*3,sd*6.6,yT-.3,yT+4.4,0x030303,{bas:true});SB(AN,AN+.3,sd*3,sd*6.6,yT-.3,yT+4.4,0x030303,{bas:true}); // fondo negro de los túneles
  SB(A1-.4,A1,sd*3,sd*6.6,yT+4.4,yC,TILE);SB(A0,A0+.4,sd*3,sd*6.6,yT+4.4,yC,TILE);SB(A0,A0+.4,sd*2,sd*3,yF,yC,TILE,{sol:true});
  for(const a of[-14,-27]){const m=new THREE.Mesh(new THREE.PlaneGeometry(3,.75),plate),p=Q(a,sd*6.54);m.position.set(p[0],yF+2.9,p[1]);m.rotation.y=Math.atan2(-sd*X.s[0],-sd*X.s[1]);scene.add(m)}});
 SB(A1-.4,A1,-3,3,yT-.3,yC,TILE,{sol:true});SB(A1,A0,-7,7,yC,yC+.1,CEIL,{sol:true,bas:true});
 for(const b of[-TB,0,TB])SB(A1+1,A0-1,b-.15,b+.15,yC-.05,yC,0xfff6dc,{bas:true});
 for(let a=A1+4;a<A0-2;a+=5.5)both(sd=>SB(a-.25,a+.25,sd*1.15,sd*1.65,yF,yC,0xcfc8ba,{sol:true}));
 for(const a of[-21.35,-26.85]){const p=Q(a,0),r=R(a-1.1,a+1.1,-.25,.25);IA(box(p[0],yF,p[1],r.x1-r.x0,.45,r.z1-r.z0,0x6b4a2b,true),'sit')}
 // --- máquinas de billetes, a los dos lados del pie de la escalera ---
 X.mach=[];both(sd=>{SB(A0-.65,A0,sd*2.1,sd*2.9,yF,yF+1.85,0x24476e,{sol:true});SB(A0-.68,A0-.65,sd*2.25,sd*2.75,yF+1.05,yF+1.45,0x7fd0ff,{bas:true});
  SB(A0-.68,A0-.65,sd*2.15,sd*2.85,yF+1.55,yF+1.8,0xc62828,{bas:true});SB(A0-.69,A0-.65,sd*2.4,sd*2.6,yF+.72,yF+.82,0x111111);X.mach.push(Q(A0-1.3,sd*2.5))});
 // --- por cada vía: panel colgante con la cuenta atrás y su tren ---
 X.tracks.forEach(t=>{const P=mPanel(),pm=new THREE.MeshBasicMaterial({map:P.tx}),pp=Q(-11,t.side*1.5);t.panel=P;
  for(const r of[0,Math.PI]){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.575),pm);m.position.set(pp[0]+X.f[0]*(r?-.03:.03),yC-1.05,pp[1]+X.f[1]*(r?-.03:.03));m.rotation.y=ry+r;scene.add(m)}
  SB(-11.08,-10.92,t.side*1.5-.06,t.side*1.5+.06,yC-1.05+.29,yC,RC);
  const G2=mTrainGeo(t.line),g=new THREE.Group();g.add(new THREE.Mesh(G2.A,carMat),new THREE.Mesh(G2.B,MBAS));g.visible=false;scene.add(g);t.train=g});
 scene.add(new THREE.Mesh(mMergeGeo(L),MLAM));if(LB.length)scene.add(new THREE.Mesh(mMergeGeo(LB),MBAS));
 ROOMS.push(Object.assign({h:yC,ug:true},R(AE,2,-7,7)));GHOLE.sea.push(R(AE-.4,2.2,-7.2,7.2))}
(function(){
 // Centro: plaza del Ayuntamiento (manzana 2,2), en el paseo entre la fuente y el hotel; la escalera baja hacia el hotel. Su hueco ya está en GHOLE.city (sección 5)
 const spots=[{k:'cen',name:'Centro',x:139,z:128,f:[0,-1],ys:G+.03,city:true}],hp=PLACES.find(p=>p.key==='hospital'),
  HELI=[[174,378,216,398],[156,385,186,391],[344,1087,386,1107],[326,1103,346,1109]],
  find=(k,name,pref,look,avoid)=>{const q=metroSpot(pref[0],pref[1],look,(avoid||[]).concat(HELI),spots);if(!q){console.warn('Metro: no hay sitio para la estación '+name);return}spots.push(Object.assign({k,name},q))};
 find('hos','Hospital',hp?[hp.x-3,hp.z-17]:[285,150],hp?[hp.x,hp.z]:[285,170]);
 find('aer','Aeropuerto',[158,333],[101,332],[[50,320,152,345]]); // al este del acceso de coches, delante de la terminal
 find('pue','Pueblo pesquero',[ISL.x,ISL.z],q=>[q.x,Math.round(ISL.z)]); // se abre hacia el camino principal del pueblo
 find('aed','Aeródromo',[315,1084],[315,1100]); // detrás de la terminal, lejos de la pista y de los helipuertos
 spots.forEach(s=>{const X=Object.assign({},s,{isl:s.z>600,yF:s.ys-MG.DEP,yC:s.ys-MG.CEIL,tot:s.city?[-1.5,-2.45]:[-1.3,-3.1]});X.yT=X.yF-1.1;X.yR=X.yT+.15;Object.assign(X,metroLocal(X));METRO.push(X);MST[X.k]=X});
 MLINES.forEach(l=>l.st=l.st.filter(k=>MST[k]));for(let i=MLINES.length-1;i>=0;i--)if(MLINES[i].st.length<2)MLINES.splice(i,1);
 // vías: en los extremos de una línea el tren llega y vuelve por la misma vía; en las intermedias hay una vía por sentido
 METRO.forEach(X=>{X.tracks=[];metroLinesOf(X.k).forEach(L=>{const i=L.st.indexOf(X.k),n=L.st.length-1;if(i===0||i===n)X.tracks.push({line:L,dirs:[1,-1]});else X.tracks.push({line:L,dirs:[1]},{line:L,dirs:[-1]})});
  X.tracks=X.tracks.slice(0,2);X.tracks.forEach((t,i)=>t.side=i?-1:1);metroBuild(X)});
 TERR.cut(METRO.filter(X=>!X.city).map(X=>X.R(-10,2,-2,2)));planeHoles(SEA);
 console.info('Metro: '+METRO.map(m=>m.name+' ('+Math.round(m.x)+', '+Math.round(m.z)+')').join(' · '))})();
// --- horario ---
const mPh=(L,k,T,Tc)=>mMod(T-L.off-k*(Tc/MSC.NT+9),Tc); // fase del tren k en su ciclo (el 2.º va 9 s desfasado para que los dos sentidos no coincidan)
function mCyc(L){const n=L.st.length-1,st=MSC.DW+MSC.RUN;return{n,st,Tc:2*n*st}}
const mSI=(i,n)=>i<=n?i:2*n-i,mSD=(i,n)=>i<n?1:-1,mTermName=(L,d)=>MST[d>0?L.st[L.st.length-1]:L.st[0]].name,mTrack=(X,L,d)=>X.tracks.find(t=>t.line===L&&t.dirs.includes(d));
// estado del tren k de la línea L: parado en una estación (dwell) o entre dos (since: s desde que salió · rem: s para llegar). d / din / dout: sentido de la línea (+1 hacia el último extremo)
function mTrain(L,k,T){const{n,st,Tc}=mCyc(L),p=mPh(L,k,T,Tc),i=Math.floor(p/st),q=p-i*st,dout=mSD(i,n);
 if(q<MSC.DW)return{dwell:true,at:L.st[mSI(i,n)],din:mSD((i+2*n-1)%(2*n),n),dout,left:MSC.DW-q};
 return{dwell:false,from:L.st[mSI(i,n)],to:L.st[mSI((i+1)%(2*n),n)],d:dout,since:q-MSC.DW,rem:st-q}}
// dónde se ve ese tren: estación X y posición a lo largo del andén (a); X=null si va por el túnel. Entra frenando por un lado y sale acelerando por el otro
function mTrainAt(L,k,T){const s=mTrain(L,k,T),{AP,D0}=MSC,AS=MG.AS;
 if(s.dwell)return{s,X:MST[s.at],d:s.din,a:AS};
 if(s.since<AP)return{s,X:MST[s.from],d:s.d,a:AS-s.d*D0*(s.since/AP)**2};
 if(s.rem<AP)return{s,X:MST[s.to],d:s.d,a:AS+s.d*D0*(s.rem/AP)**2};
 return{s,X:null,d:s.d,a:AS}}
function mPose(X,t,a,d){const p=X.Q(a,t.side*MG.TB);return{x:p[0],z:p[1],h:Math.atan2(-d*X.f[0],-d*X.f[1])}}
// próximo tren de una vía: si hay uno con las puertas abiertas (dwell, w = s para que salga) o el que llega antes (w = s para que llegue)
function mNext(X,t,T){const L=t.line,{n,st,Tc}=mCyc(L),xi=L.st.indexOf(X.k);let best=null;
 for(let k=0;k<MSC.NT;k++){const p=mPh(L,k,T,Tc);
  for(let i=0;i<2*n;i++){if(mSI(i,n)!==xi)continue;const dout=mSD(i,n);if(!t.dirs.includes(dout))continue;const ti=i*st,
   c=(p>=ti&&p<ti+MSC.DW)?{dwell:true,w:ti+MSC.DW-p,k,dout}:{dwell:false,w:mMod(ti-p,Tc),k,dout};
   if(!best||(c.dwell&&!best.dwell)||(c.dwell===best.dwell&&c.w<best.w))best=c}}
 return best}
// estación en la que está un punto bajo tierra (escalera, andén o vías)
function metroWhere(x,z,y){for(const X of METRO){const[a,b]=X.loc(x,z);if(a>MG.AE-.4&&a<2.2&&Math.abs(b)<7.2&&y<X.ys-.5)return{X,a,b}}return null}
// --- cada fotograma: trenes y paneles de las estaciones cercanas, y el viaje si vas montado ---
function metroStep(){const T=mNow(),pan=(MT.pt+=1)%15===0;
 for(const X of METRO){const near=Math.hypot(pl.x-X.x,pl.z-X.z)<150;X.tracks.forEach(t=>{t.train.visible=false;if(near&&(pan||!t.panel.last))mPanelDraw(t.panel,t,mNext(X,t,T))});if(!near)continue;
  for(const L of metroLinesOf(X.k))for(let k=0;k<MSC.NT;k++){if(riding&&riding.metro&&riding.L===L&&riding.k===k)continue; /* el tuyo se ve por dentro (mCabin) */const q=mTrainAt(L,k,T);if(q.X!==X||Math.abs(q.a-MG.AS)>28)continue;const t=mTrack(X,L,q.d);if(!t)continue;
   const p=mPose(X,t,q.a,q.d);t.train.position.set(p.x,X.yR,p.z);t.train.rotation.y=p.h;t.train.visible=true}}
 if(riding&&riding.metro)metroRide(T)}
// --- billetes: la máquina abre el plano para elegir destino ---
function metroMachine(X){MT.from=X;MT.sel=null;openDlg();dlg.classList.add('wide');metroRender()}
function metroBuy(){const a=MT.from,b=MST[MT.sel];if(!a||!b)return;const fare=metroFare(a,b);if(!pay(fare))return;flags.mticket={from:a.k,to:b.k};closeDlg();
 const l=metroRoute(a.k,b.k).legs[0];toast('🎫 Billete hasta '+b.name+' (−€'+fare+') · coge la '+l.line.id+' dirección '+metroDir(l));try{saveGame()}catch(e){}}
// sentido (+1/-1) del primer tramo de la ruta del billete, para avisar si el tren no va hacia allí
function metroWay(X){const tk=flags.mticket;if(!tk||!MST[tk.to]||tk.to===X.k)return null;const r=metroRoute(X.k,tk.to);if(!r)return null;const l=r.legs[0];
 return{line:l.line,d:Math.sign(l.line.st.indexOf(l.st[1])-l.line.st.indexOf(l.st[0])),dest:MST[tk.to].name}}
// --- subir y bajar ---
function metroBoard(o){if(riding||inCar)return;if(!flags.mticket){toast('🎫 Necesitas un billete: cómpralo en la máquina, al pie de la escalera');return}
 riding={metro:true,L:o.t.line,k:o.k,x:pl.x,z:pl.z,h:yaw,alt:py,hex:mHex(o.t.line.hex)};body.visible=false;MT.cab=mCabin(o.t.line);MT.lastH=null;pitch=.35;
 metroRide(mNow());yaw=MT.cab.g.rotation.y;toast('🚇 Has subido al '+o.t.line.id+' dirección '+mTermName(o.t.line,o.dout)+' · mira la pantalla del vagón')}
// cada fotograma montado: el vagón va con el tren mientras está en la estación; en el túnel se pasa a un tramo de túnel aparte con luces que desfilan
function metroRide(T){const R=riding,q=mTrainAt(R.L,R.k,T),s=q.s,X=q.X||MST[s.to],t=mTrack(X,R.L,q.d),p=mPose(X,t,q.a,q.d),C=MT.cab,TU=mTunnel(),
 dt=MT.rt?Math.min(.2,T-MT.rt):0,tun=!q.X||Math.abs(q.a-MG.AS)>11;MT.rt=T;
 Object.assign(R,{x:p.x,z:p.z,h:p.h,alt:X.yF,X,t,s});C.g.visible=true;TU.g.visible=tun;
 if(tun){C.g.position.set(0,TU.y,0);C.g.rotation.y=0;TU.off=(TU.off+11*dt)%TU.step;TU.mov.position.z=-TU.off}
 else{C.g.position.set(p.x,X.yR,p.z);C.g.rotation.y=p.h}
 if((MT.pt&1)===0)mDisp(C,R,T)}
function metroLeave(){const R=riding;if(!R||!R.metro||!R.s.dwell)return;const X=R.X,t=R.t,p=X.Q(MG.AS+(Math.random()*8-4),t.side*2.1);
 riding=null;body.visible=true;MT.cab.g.visible=false;mTunnel().g.visible=false;MT.rt=0;pl.x=p[0];pl.z=p[1];py=X.yF;vy=0;yaw=Math.atan2(-t.side*X.s[0],-t.side*X.s[1]);pitch=.35;body.position.set(pl.x,py,pl.z);
 const tk=flags.mticket;if(tk&&tk.to===X.k){delete flags.mticket;toast('🚇 Has llegado a '+X.name+' · sube por la escalera para salir')}
 else toast('🚇 Has bajado en '+X.name+(tk&&MST[tk.to]?' · tu billete sigue valiendo hasta '+MST[tk.to].name:''));try{saveGame()}catch(e){}}
// interior del vagón delantero (coordenadas del tren: x de lado, y desde el carril, z hacia delante): asientos, barras, ventanas abiertas y la pantalla al fondo
function mCabin(L){MT.cabs=MT.cabs||{};if(MT.cabs[L.id])return MT.cabs[L.id];const A=[],B=[],W=1.34,F=.95,TOP=3.15,lc=mHex(L.hex),bx=(x0,x1,y0,y1,z0,z1,c,b)=>(b?B:A).push([mBox(Math.min(x0,x1),Math.max(x0,x1),y0,y1,z0,z1),c]);
 bx(-W,W,F-.1,F,.2,9.8,0x5d6670);bx(-W,W,TOP,TOP+.05,.2,9.8,0xe9eaec,true);bx(-.2,.2,TOP-.04,TOP,.6,9.4,0xfffbea,true); // suelo, techo y luz
 for(const sd of[-1,1]){const xi=sd>0?W-.06:-W,xo=sd>0?W:-W+.06;
  bx(xi,xo,F,1.7,.2,9.8,0xe6e9ec);bx(xi,xo,2.75,TOP,.2,9.8,0xe6e9ec); // pared bajo y sobre las ventanas (las ventanas quedan abiertas: se ve el andén o el túnel)
  for(const z of[.45,1.3,2.7,4.3,5.7,7.3,8.7,9.55])bx(xi,xo,1.7,2.75,z-.12,z+.12,0xb8bdc3);
  for(const z of[2,5,8]){bx(sd>0?W-.08:-W,sd>0?W:-W+.08,F,1.7,z-.65,z+.65,0x8d949c);bx(sd>0?W-.08:-W,sd>0?W:-W+.08,2.75,2.95,z-.65,z+.65,0x8d949c)} // puertas, con su ventana
  for(const[z0,z1]of[[.35,1.35],[2.75,4.25],[5.75,7.25],[8.65,9.5]]){bx(sd*.88,sd*W,F,1.4,z0,z1,lc);bx(sd*1.18,sd*W-sd*.06,1.4,2.05,z0,z1,lc)}
  bx(sd*.55-.03,sd*.55+.03,TOP-.25,TOP-.19,.6,9.4,0xf2c230)} // barra de techo
 for(const z of[2,5])for(const x of[-.55,.55])bx(x-.03,x+.03,F,TOP,z-.03,z+.03,0xf2c230); // barras verticales junto a las puertas (no las de delante, para que no tapen la pantalla)
 bx(-W,W,F,TOP,9.6,9.72,0xcfd3d8);bx(-.5,.5,F,2.25,9.58,9.6,0x6b737c);bx(-W,W,F,TOP,.08,.2,0xcfd3d8);bx(-.55,.55,F,2.3,.2,.22,0x6b737c); // tabiques de los extremos con su puerta
 const g=new THREE.Group();g.add(new THREE.Mesh(mMergeGeo(A),MLAM),new THREE.Mesh(mMergeGeo(B),MBAS));
 const c=document.createElement('canvas');c.width=1024;c.height=256;const tx=new THREE.CanvasTexture(c),sc=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshBasicMaterial({map:tx}));
 sc.position.set(0,2.62,9.575);sc.rotation.y=Math.PI;g.add(sc);g.add(new THREE.Mesh(mBox(-1.26,1.26,2.28,2.96,9.58,9.6),mat(0x22262c)));
 g.visible=false;scene.add(g);return MT.cabs[L.id]={g,c,tx,last:''}}
// tramo de túnel (lejos, muy por debajo del mundo) donde va el vagón entre estaciones; las luces y traviesas se desplazan para dar sensación de marcha
function mTunnel(){if(MT.tun)return MT.tun;const A=[],B=[],M=[],B2=[],Y=-300,H=40,step=8,bx=(l,x0,x1,y0,y1,z0,z1,c)=>l.push([mBox(x0,x1,Y+y0,Y+y1,z0,z1),c]);
 bx(B,-2.6,2.6,-.4,0,-H,H,0x2a2622);bx(B,-2.6,-2.3,-.4,4.8,-H,H,0x3c3d40);bx(B,2.3,2.6,-.4,4.8,-H,H,0x3c3d40);bx(B,-2.6,2.6,4.8,5,-H,H,0x303134);
 bx(B,-2.6,2.6,-.4,5,-H-.3,-H,0x000000);bx(B,-2.6,2.6,-.4,5,H,H+.3,0x000000);
 for(const sd of[-1,1])for(const y of[2.9,3.05])bx(B,sd*2.22,sd*2.3,y,y+.05,-H,H,0x151515); // cables
 for(let z=-H;z<H;z+=step){for(const sd of[-1,1])bx(B2,sd*2.18,sd*2.3,2.2,2.5,z,z+.5,0xffe7a8);bx(M,-1.1,1.1,0,.07,z+2,z+2.26,0x4d4036);bx(M,-1.1,1.1,0,.07,z+6,z+6.26,0x4d4036)}
 const g=new THREE.Group(),mov=new THREE.Group();g.add(new THREE.Mesh(mMergeGeo(B),MBAS));mov.add(new THREE.Mesh(mMergeGeo(B2),MBAS),new THREE.Mesh(mMergeGeo(M),MBAS));g.add(mov);g.visible=false;scene.add(g);
 return MT.tun={g,mov,y:Y,step,off:0}}
// pantalla de a bordo: la línea en el sentido de la marcha, el tren avanzando entre estaciones y la próxima parada
function mDisp(C,R,T){const s=R.s,L=R.L,d=s.dwell?s.dout:s.d,list=d>0?L.st.slice():L.st.slice().reverse(),n=list.length-1,X0=110,X1=914,px=i=>X0+(X1-X0)*i/n;
 let pos,nextK;if(s.dwell){pos=list.indexOf(s.at);nextK=s.at}else{const i0=list.indexOf(s.from),u=clamp(s.since/MSC.RUN,0,1);pos=i0+u*u*(3-2*u);nextK=s.to}
 const g=C.c.getContext('2d'),bl=Math.floor(T*2)%2;g.fillStyle='#0a0e13';g.fillRect(0,0,1024,256);g.fillStyle=L.hex;g.fillRect(0,0,1024,58);
 g.fillStyle='#fff';g.font='bold 36px Arial,sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(L.id+'  →  '+mTermName(L,d),24,30);
 g.textAlign='right';g.font='bold 28px Arial,sans-serif';const now=new Date();g.fillText(pad2(now.getHours())+':'+pad2(now.getMinutes()),1000,30);
 g.lineCap='round';g.lineWidth=12;g.strokeStyle='#3a4350';g.beginPath();g.moveTo(px(0),128);g.lineTo(px(n),128);g.stroke();g.strokeStyle=L.hex;g.beginPath();g.moveTo(px(pos),128);g.lineTo(px(n),128);g.stroke();
 list.forEach((k,i)=>{const past=i<pos-.01,cur=k===nextK;g.beginPath();g.arc(px(i),128,cur?17:13,0,7);g.fillStyle=past?'#555c66':cur?'#ffd966':'#fff';g.fill();g.lineWidth=4;g.strokeStyle='#0a0e13';g.stroke();
  g.fillStyle=past?'#6b737c':cur?'#ffd966':'#fff';g.font=(cur?'bold ':'')+'26px Arial,sans-serif';g.textAlign='center';g.fillText(MST[k].name,px(i),176)});
 if(!s.dwell){g.beginPath();g.arc(px(pos),128,bl?12:9,0,7);g.fillStyle='#5fe07a';g.fill()}
 g.textAlign='left';g.font='bold 30px Arial,sans-serif';g.fillStyle=s.dwell?'#5fe07a':'#ffcf4a';
 g.fillText(s.dwell?'Estación '+MST[s.at].name+' · puertas abiertas · sale en '+Math.ceil(s.left)+' s':'Próxima estación: '+MST[s.to].name+' · '+Math.ceil(s.rem)+' s',24,226);C.tx.needsUpdate=true}
// cámara montado: dentro del vagón, de pie mirando hacia delante (a la pantalla); el ratón deja girar un poco la cabeza
function metroCam(){const C=MT.cab,h=C.g.rotation.y,w=a=>Math.atan2(Math.sin(a),Math.cos(a));
 if(MT.lastH!==null&&Math.abs(w(h-MT.lastH))>1)yaw+=h-MT.lastH;MT.lastH=h; // el tren cambia de sentido en las cabeceras: la vista gira con él
 const rel=clamp(w(yaw-h),-1.3,1.3),pd=clamp(pitch-.35,-.6,.6);yaw=h+rel;pitch=.35+pd;
 C.g.updateMatrixWorld();const p=new THREE.Vector3(0,2.45,6.2).applyMatrix4(C.g.matrixWorld);cam.position.copy(p);
 cam.lookAt(p.x+Math.sin(yaw)*Math.cos(pd),p.y-Math.sin(pd),p.z+Math.cos(yaw)*Math.cos(pd))}
// texto del HUD: en el tren, o los próximos trenes de la estación en la que estás
function metroHud(){const T=mNow(),tk=flags.mticket;
 if(riding&&riding.metro){const R=riding,s=R.s;if(!s)return'';return'🚇 '+R.L.id+' dirección '+mTermName(R.L,s.dwell?s.dout:s.d)+' · '+(s.dwell?'Estación '+R.X.name+' · puertas abiertas, sale en '+Math.ceil(s.left)+' s':'próxima estación: '+MST[s.to].name)+(tk&&MST[tk.to]?'\n🎫 Billete hasta '+MST[tk.to].name:'')}
 const w=metroWhere(pl.x,pl.z,py);if(!w)return'';let h='🚇 Estación '+w.X.name;
 w.X.tracks.forEach(t=>{const nx=mNext(w.X,t,T);if(nx)h+='\n'+t.line.id+' → '+mTermName(t.line,nx.dout)+': '+(nx.dwell?'en el andén · sale en '+mFmt(nx.w):'llega en '+mFmt(nx.w))});
 return h+'\n🎫 '+(tk&&MST[tk.to]?'Billete hasta '+MST[tk.to].name:'Sin billete · cómpralo en la máquina')}
// avisos de la tecla E en el metro (los usa nearest)
function metroNear(t){
 METRO.forEach(X=>{const p=X.Q(3.2,0);if(Math.abs(py-X.ys)<1)t(X,p[0],p[1],2.6,'minfo','🚇 Metro · estación '+X.name+' · baja por la escalera');
  if(Math.abs(py-X.yF)<1.2)X.mach.forEach(m=>t(X,m[0],m[1],1.7,'mticket','E: máquina de billetes'+(flags.mticket&&MST[flags.mticket.to]?' · ya tienes billete hasta '+MST[flags.mticket.to].name:'')))});
 const w=metroWhere(pl.x,pl.z,py);if(!w||Math.abs(py-w.X.yF)>.8||Math.abs(w.a-MG.AS)>10.5||Math.abs(w.b)<1.3)return null;
 const tr=w.X.tracks.find(q=>q.side===Math.sign(w.b));if(!tr)return null;const nx=mNext(w.X,tr,mNow());if(!nx||!nx.dwell)return null;const wy=metroWay(w.X);
 return{kind:'mboard',o:{X:w.X,t:tr,k:nx.k,dout:nx.dout},txt:'E: subir al metro '+tr.line.id+' → '+mTermName(tr.line,nx.dout)+' (sale en '+Math.ceil(nx.w)+' s)'+(!flags.mticket?' · necesitas billete':wy&&(wy.line!==tr.line||wy.d!==nx.dout)?' · ⚠ no va hacia '+wy.dest:'')}}
// ruta más corta (en paradas) entre dos estaciones, agrupada en tramos por línea
function metroRoute(a,b){const prev={[a]:null},q=[a];
 while(q.length){const u=q.shift();if(u===b)break;for(const l of MLINES){const i=l.st.indexOf(u);if(i<0)continue;for(const j of[i-1,i+1]){const v=l.st[j];if(v&&!(v in prev)){prev[v]=u;q.push(v)}}}}
 if(!(b in prev))return null;const path=[];for(let u=b;u!==null;u=prev[u])path.unshift(u);const legs=[];
 for(let i=1;i<path.length;i++){const l=MLINES.find(l=>{const x=l.st.indexOf(path[i-1]),y=l.st.indexOf(path[i]);return x>=0&&y>=0&&Math.abs(x-y)===1}),last=legs[legs.length-1];
  if(last&&last.line===l)last.st.push(path[i]);else legs.push({line:l,st:[path[i-1],path[i]]})}
 return{path,legs}}
const metroDir=lg=>{const l=lg.line,a=l.st.indexOf(lg.st[0]),b=l.st.indexOf(lg.st[1]);return MST[b>a?l.st[l.st.length-1]:l.st[0]].name},
 metroStops=n=>n+' parada'+(n>1?'s':'');
// pantalla de la máquina: plano con las líneas para elegir destino (tocando el mapa o la lista) y comprar el billete
function metroPick(k){if(!MST[k]||MST[k]===MT.from)return;MT.sel=k;metroRender()}
function metroRender(){const a=MT.from,sel=MT.sel&&MST[MT.sel],tk=flags.mticket;if(!a)return;
 let h='<h2>🎫 Máquina de billetes · estación '+a.name+'</h2><p style="margin:0 0 8px;opacity:.85">¿A dónde quieres ir? Toca una estación en el plano o elígela en la lista.'+(tk&&MST[tk.to]?' Ahora tienes un billete hasta <b>'+MST[tk.to].name+'</b> (si compras otro, lo sustituye).':'')+'</p>'+
  '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><canvas id="mtMap" style="border-radius:10px;cursor:pointer;max-width:100%;touch-action:manipulation;flex:none"></canvas><div style="flex:1;min-width:230px">'+
  MLINES.map(l=>'<div style="margin:3px 0">'+metroChip(l)+' <small>'+l.st.map(k=>MST[k].name).join(' – ')+'</small></div>').join('')+
  '<h3 style="margin:12px 0 4px">Destinos</h3>';
 METRO.forEach(m=>{if(m===a)return;const r=metroRoute(a.k,m.k);if(!r)return;const on=MT.sel===m.k;
  h+='<div class="r" style="cursor:pointer;margin:3px 0;padding:5px 8px;border-radius:8px;background:'+(on?'rgba(255,217,102,.22)':'rgba(255,255,255,.06)')+'" onclick="metroPick(\''+m.k+'\')"><span>'+metroLinesOf(m.k).map(metroChip).join(' ')+' <b style="color:#fff">'+m.name+'</b><br><small style="opacity:.75">'+metroStops(r.path.length-1)+(r.legs.length>1?' · transbordo en '+MST[r.legs[1].st[0]].name:'')+(m.isl!==a.isl?' · túnel bajo el mar':'')+'</small></span><b>€'+metroFare(a,m)+'</b></div>'});
 if(sel){const r=metroRoute(a.k,sel.k);
  h+='<div style="margin-top:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.1)"><b>Ruta hasta '+sel.name+'</b><ol style="margin:6px 0 0;padding-left:20px">'+
   r.legs.map(l=>'<li>'+metroChip(l.line)+' dirección '+metroDir(l)+': '+MST[l.st[0]].name+' → '+MST[l.st[l.st.length-1]].name+' <small>('+metroStops(l.st.length-1)+')</small></li>').join('')+
   '</ol><button onclick="metroBuy()">🎫 Comprar billete hasta '+sel.name+' (€'+metroFare(a,sel)+')</button></div>'}
 dlg.innerHTML=h+'</div></div><div><button onclick="closeDlg()" style="background:#666">Salir</button></div>';metroMap()}
function metroMap(){const cv=$('mtMap');if(!cv)return;const dpr=Math.min(2,devicePixelRatio||1),CW=Math.round(Math.min(400,innerWidth*.92-60)),CH=Math.round(Math.min(CW*1.3,innerHeight*.6)),g=cv.getContext('2d');
 cv.width=CW*dpr;cv.height=CH*dpr;cv.style.width=CW+'px';cv.style.height=CH+'px';g.setTransform(dpr,0,0,dpr,0,0);
 // encuadre: todas las estaciones con margen, ajustado a la proporción del lienzo
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;METRO.forEach(m=>{x0=Math.min(x0,m.x);x1=Math.max(x1,m.x);z0=Math.min(z0,m.z);z1=Math.max(z1,m.z)});x0-=110;x1+=110;z0-=110;z1+=110;
 let w=x1-x0,hh=z1-z0;if(w/hh<CW/CH){const nw=hh*CW/CH;x0-=(nw-w)/2;w=nw}else{const nh=w*CH/CW;z0-=(nh-hh)/2;hh=nh}
 const k=CW/w,T=(x,z)=>[(x-x0)*k,(z-z0)*k];MT.view={T,CW,CH};
 g.fillStyle='#2e78b8';g.fillRect(0,0,CW,CH);
 {const lo=-MOFF,hi=MS-MOFF,sx0=Math.max(x0,lo),sz0=Math.max(z0,lo),sx1=Math.min(x0+w,hi),sz1=Math.min(z0+hh,hi);
  if(sx1>sx0&&sz1>sz0)g.drawImage(stat,(sx0+MOFF)*SC,(sz0+MOFF)*SC,(sx1-sx0)*SC,(sz1-sz0)*SC,(sx0-x0)*k,(sz0-z0)*k,(sx1-sx0)*k,(sz1-sz0)*k)}
 g.fillStyle='rgba(8,16,30,.3)';g.fillRect(0,0,CW,CH);g.lineCap=g.lineJoin='round';
 const lbl=(t,x,y,al,fs,col)=>{g.font='bold '+fs+'px system-ui,sans-serif';g.textAlign=al;g.textBaseline='middle';g.lineWidth=3.5;g.strokeStyle='rgba(0,0,0,.8)';g.strokeText(t,x,y);g.fillStyle=col||'#fff';g.fillText(t,x,y)};
 // líneas (el tramo entre islas va por un túnel bajo el mar: trazo discontinuo)
 MLINES.forEach(l=>{for(let i=1;i<l.st.length;i++){const A=MST[l.st[i-1]],B=MST[l.st[i]],p=T(A.x,A.z),q=T(B.x,B.z),sea=A.isl!==B.isl;
  g.setLineDash(sea?[9,6]:[]);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.strokeStyle='#fff';g.lineWidth=9;g.stroke();g.strokeStyle=l.hex;g.lineWidth=5.5;g.stroke();
  if(sea){g.setLineDash([]);const mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;lbl('túnel bajo el mar',mx+10,my,'left',11,'#cfe8ff')}}
  // etiqueta de la línea en su tramo por tierra más largo
  g.setLineDash([]);let best=null,bl=0;for(let i=1;i<l.st.length;i++){const A=MST[l.st[i-1]],B=MST[l.st[i]];if(A.isl!==B.isl)continue;const p=T(A.x,A.z),q=T(B.x,B.z),d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d>bl){bl=d;best=[(p[0]+q[0])/2,(p[1]+q[1])/2]}}
  if(best&&bl>40){const[mx,my]=best;g.fillStyle=l.hex;g.fillRect(mx-15,my-9,30,18);g.strokeStyle='#fff';g.lineWidth=1.5;g.strokeRect(mx-15,my-9,30,18);lbl(l.id,mx,my+1,'center',11)}});
 // estaciones (la etiqueta va a la derecha; si choca con otra estación o se sale, a la izquierda o debajo)
 const PTS=METRO.map(m=>T(m.x,m.z));
 METRO.forEach((m,mi)=>{const p=PTS[mi],cur=m===MT.from,on=MT.sel===m.k,ic=metroLinesOf(m.k).length>1,r=on||cur?11:ic?9:7.5;
  g.beginPath();g.arc(p[0],p[1],r,0,7);g.fillStyle=cur?'#ff3':on?'#ffd966':'#fff';g.fill();g.lineWidth=ic?4:3;g.strokeStyle='#1a1a1a';g.stroke();
  const tx=cur?'📍 '+m.name+' (estás aquí)':m.name,fs=on||cur?15:13;g.font='bold '+fs+'px system-ui,sans-serif';const tw=g.measureText(tx).width,
   clash=sd=>PTS.some((q,j)=>j!==mi&&Math.abs(q[1]-p[1])<20&&(q[0]-p[0])*sd>0&&Math.abs(q[0]-p[0])<tw+r+16);
  if(p[0]+r+6+tw<CW-4&&!clash(1))lbl(tx,p[0]+r+6,p[1],'left',fs,on?'#ffd966':'#fff');
  else if(p[0]-r-6-tw>4&&!clash(-1))lbl(tx,p[0]-r-6,p[1],'right',fs,on?'#ffd966':'#fff');
  else lbl(tx,clamp(p[0],tw/2+4,CW-tw/2-4),p[1]+r+11,'center',fs,on?'#ffd966':'#fff')});
 cv.onclick=e=>{const V=MT.view,rc=cv.getBoundingClientRect(),px=(e.clientX-rc.left)*V.CW/rc.width,pz=(e.clientY-rc.top)*V.CH/rc.height;let best=null,bd=30*30;
  METRO.forEach(m=>{if(m===MT.from)return;const p=V.T(m.x,m.z),d=(p[0]-px)**2+(p[1]-pz)**2;if(d<bd){bd=d;best=m}});if(best)metroPick(best.k)}}


