/* ===============================================================================================
   FICHA · ciudad.js
   Qué hay:          La ciudad (sección 5): calles, manzanas y aceras, señales de tráfico (5.1) y semáforos (5.2).
   Tócalo si quieres: cambiar calles, señales o semáforos
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 5. CIUDAD
//     Calles, manzanas, mar, aparcamientos y edificios del barrio principal, con sus señales y semáforos.
// =================================================================================================
const PKI=1,PKJ=3,PX=PKI*P,PZ=PKJ*P;const mkHole=()=>{const hp=new THREE.Path();hp.moveTo(PX+3,-(PZ+3));[[8,3],[8,0],[14,0],[14,3],[37,3],[37,37],[3,37]].forEach(a=>hp.lineTo(PX+a[0],-(PZ+a[1])));hp.closePath();return hp};
// huecos extra (rectángulos {x0,x1,z0,z1}) en el suelo de la ciudad y en el mar, para las estaciones de metro (10.5). El de la ciudad es la boca de Centro, en la plaza
const GHOLE={city:[{x0:137,x1:141,z0:126,z1:130}],sea:[]},
 mkShapeG=(x0,x1,z0,z1,hs)=>{const sh=new THREE.Shape();sh.moveTo(x0,-z0);sh.lineTo(x1,-z0);sh.lineTo(x1,-z1);sh.lineTo(x0,-z1);sh.lineTo(x0,-z0);sh.holes.push(mkHole());
  hs.forEach(r=>{const hp=new THREE.Path();hp.moveTo(r.x0,-r.z0);hp.lineTo(r.x0,-r.z1);hp.lineTo(r.x1,-r.z1);hp.lineTo(r.x1,-r.z0);hp.closePath();sh.holes.push(hp)});return new THREE.ShapeGeometry(sh)};
const mkPlane=(x0,x1,z0,z1,c,y,hk)=>{const m=new THREE.Mesh(mkShapeG(x0,x1,z0,z1,GHOLE[hk]||[]),mat(c));m.rotation.x=-Math.PI/2;m.position.y=y;m.userData.gh=[x0,x1,z0,z1,hk];scene.add(m);return m};
function planeHoles(m){const u=m.userData.gh;m.geometry.dispose();m.geometry=mkShapeG(u[0],u[1],u[2],u[3],GHOLE[u[4]]||[])} // rehace un plano con los huecos actuales
// caja con un hueco rectangular (se parte en hasta 4 cajas alrededor del hueco h)
function boxHole(x,y,z,w,h,d,c,hl){const X0=x-w/2,X1=x+w/2,Z0=z-d/2,Z1=z+d/2,B=(a,b,e,f)=>{if(b-a>.01&&f-e>.01)box((a+b)/2,y,(e+f)/2,b-a,h,f-e,c,false)};
 B(X0,hl.x0,Z0,Z1);B(hl.x1,X1,Z0,Z1);B(hl.x0,hl.x1,Z0,hl.z0);B(hl.x0,hl.x1,hl.z1,Z1)}
mkPlane(-14,270,-14,270,0x3d3d40,0,'city');
const TERR={}; // malla del terreno: TERR.cut(huecos) quita las celdas de 4x4 m que tocan esos rectángulos
(function(){const T0=LAND0-22,T1=LAND1+22,S=4,n=(T1-T0)/S,vs=n+1,pos=new Float32Array(vs*vs*3),col=new Float32Array(vs*vs*3),idx=[],gr=[.353,.49,.29],sa=[.847,.776,.565],inC=(x,z)=>x>=-14&&x+S<=N*P&&z>=-14&&z+S<=N*P;
for(let j=0;j<vs;j++)for(let i=0;i<vs;i++){const x=T0+i*S,z=T0+j*S,h=heightAt(x,z),k=(j*vs+i)*3,e=Math.max(-14-x,x-N*P,-14-z,z-N*P,0),w=clamp((10-isl(x,z))/6,0,1),rk=clamp((h-48)/30,0,1),sn=clamp((h-104)/10,0,1),sh=.95+clamp(h/5,0,1)*.18;
 pos[k]=x;pos[k+1]=h;pos[k+2]=z;for(let c=0;c<3;c++)col[k+c]=((((gr[c]*(1-w)+sa[c]*w)*sh)*(1-rk)+.48*rk)*(1-sn)+.95*sn)}
// índice de triángulos: se salta la ciudad y las celdas que tapan un hueco (bocas de metro, ver TERR.cut)
const g=new THREE.BufferGeometry(),build=holes=>{const idx=[];for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=T0+i*S,z=T0+j*S;if(inC(x,z)||holes.some(r=>x<r.x1-.01&&x+S>r.x0+.01&&z<r.z1-.01&&z+S>r.z0+.01))continue;const a=j*vs+i,b=a+1,c=a+vs,d=c+1;idx.push(a,c,b,b,c,d)}g.setIndex(idx)};
g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));build([]);g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})));
TERR.cut=build})();
const SEA=mkPlane(-1600,1900,-1600,1900,0x2e78b8,-.4,'sea'),seaTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#2e78b8';g.fillRect(0,0,64,64);g.strokeStyle='#5fa3d6';g.lineWidth=2;for(const[x,y]of[[16,16],[48,40],[10,50]]){g.beginPath();g.arc(x,y,7,Math.PI*1.1,Math.PI*1.9);g.stroke()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/20,1/20);return t})();
SEA.material=new THREE.MeshLambertMaterial({map:seaTex});
// mar: olas con normales procedurales, color por profundidad, reflejo del cielo, brillo del sol y espuma en la costa
(function(){const N=230,X0=-170,X1=750,data=new Uint8Array(N*N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)data[j*N+i]=Math.round(clamp((-.4-heightRaw(X0+(i+.5)*(X1-X0)/N,X0+(j+.5)*(X1-X0)/N))/2.2,0,1)*255);
 const dt=new THREE.DataTexture(data,N,N,THREE.LuminanceFormat);dt.minFilter=dt.magFilter=THREE.LinearFilter;dt.needsUpdate=true;
 const U=Object.assign({dep:{value:dt},tm:{value:0},box:{value:new THREE.Vector2(X0,X1-X0)},top:skyU.top,hor:skyU.hor,sunDir:skyU.sunDir,sunCol:skyU.sunCol,night:skyU.night,gr:skyU.gr},THREE.UniformsUtils.clone(THREE.UniformsLib.fog));
 SEA.material=new THREE.ShaderMaterial({uniforms:U,fog:true,transparent:true,
 vertexShader:'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
 fragmentShader:`varying vec3 vW;uniform sampler2D dep;uniform vec2 box;uniform float tm,night,gr;uniform vec3 top,hor,sunDir,sunCol;
#include <fog_pars_fragment>
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float wh(vec2 p){float t=tm;return vn(p*.30+vec2(t*.06,t*.04))*.55+vn(p*.85-vec2(t*.08,-t*.06))*.3+vn(p*2.4+vec2(-t*.14,t*.11))*.15;}
void main(){vec2 p=vW.xz;float e=.12,h0=wh(p);vec3 N=normalize(vec3(-(wh(p+vec2(e,0.))-h0)*2.2,1.,-(wh(p+vec2(0.,e))-h0)*2.2));
vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(N,V),0.),3.)*.85+.05;
float d=texture2D(dep,(vW.xz-box.x)/box.y).r;float lit=mix(1.,.12,night)*(1.-gr*.35);
vec3 base=mix(vec3(.25,.72,.69),vec3(.09,.33,.58),smoothstep(0.,.8,d))*lit;
vec3 R=reflect(-V,N);R.y=abs(R.y);vec3 sk=mix(hor,top,pow(clamp(R.y,0.,1.),.5));
float sp=pow(max(dot(R,sunDir),0.),140.)*(1.-gr*.9);
vec3 c=mix(base,sk,fr)+sunCol*sp*2.2;
float fm=clamp(smoothstep(.2,.0,d+(h0-.5)*.12+.035*sin(tm*1.7+h0*9.))*.9,0.,1.);
c=mix(c,vec3(.95,.97,1.)*mix(1.,.25,night),fm);
gl_FragColor=vec4(c,mix(.6,1.,smoothstep(0.,.4,d))+fm*.4);
#include <tonemapping_fragment>
#include <fog_fragment>
}`});})();
for(let k=0;k<=N;k++){const c=-7+k*P;for(let m=0;m<N;m++){box(m*P+20,.02,c,34,.02,.25,0xe0c030,false);box(c,.02,m*P+20,.25,.02,34,0xe0c030,false)}}
const cw=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.03,1),mat(0xf2f2f2),(N+1)*(N+1)*24),dm=new THREE.Object3D();let ci=0;
for(let a=0;a<=N;a++)for(let b=0;b<=N;b++){const cx=-7+a*P,cz=-7+b*P;
 for(const o of [-5,-3,-1,1,3,5]){[[cx+8.5,cz+o,2.5,.6],[cx-8.5,cz+o,2.5,.6],[cx+o,cz+8.5,.6,2.5],[cx+o,cz-8.5,.6,2.5]].forEach(q=>{dm.position.set(q[0],.03,q[1]);dm.scale.set(q[2],1,q[3]);dm.updateMatrix();cw.setMatrixAt(ci++,dm.matrix)})}}
cw.count=ci;scene.add(cw);
function makeParking(bx,bz){
 const colB=(x0,x1,z0,z1,y0,y1,both)=>{colliders.push({x0,x1,z0,z1,y0,y1,on:true,car:true});if(both)colliders.push({x0,x1,z0,z1,y0,y1,on:true})};
 const slab=(a,b,c,d,y,h,col)=>box(bx+(a+b)/2,y,bz+(c+d)/2,b-a,h,d-c,col,false);
 const wall=(a,b,c,d)=>{slab(a,b,c,d,-8.3,8,0x8d8d8d);colB(bx+a,bx+b,bz+c,bz+d,-8.4,-.3,true)};
 [[0,3,0,40],[37,40,0,40],[3,8,0,3],[14,37,0,3],[3,37,37,40]].forEach(r=>slab(r[0],r[1],r[2],r[3],0,G,0xb9b6ad));
 [[3,37,16,37],[3,8,3,16],[14,37,3,16]].forEach(r=>{slab(r[0],r[1],r[2],r[3],-.3,G+.3,0xc4bfb3);const q={x0:bx+r[0],x1:bx+r[1],z0:bz+r[2],z1:bz+r[3]};
  colliders.push(Object.assign({y0:-.3,y1:9,on:true,car:true},q));colliders.push(Object.assign({y0:-.3,y1:G,on:true},q));FLOORS.push(Object.assign({y:G},q))});
 wall(2.4,3,2.4,37.6);wall(37,37.6,2.4,37.6);wall(3,37,37,37.6);wall(3,8,2.4,3);wall(14,37,2.4,3);
 [[3,30,3,37],[36,37,3,37],[30,36,3,8],[30,36,24,37]].forEach(r=>{slab(r[0],r[1],r[2],r[3],-4.3,.3,0x6e6e72);FLOORS.push({x0:bx+r[0],x1:bx+r[1],z0:bz+r[2],z1:bz+r[3],y:-4})});
 slab(3,37,3,37,-8.3,.3,0x5f5f64);FLOORS.push({x0:bx+3,x1:bx+37,z0:bz+3,z1:bz+37,y:-8});
 const a=Math.atan2(4,16),rl=Math.hypot(16,4);
 [[11,8,-4,8,14,0,16],[33,16,-8,30,36,8,24]].forEach(r=>{const m=box(bx+r[0],0,bz+r[1],6,.25,rl,0x55555a,false);m.position.y=r[2]+2-.125;m.rotation.x=a;RAMPS.push({x0:bx+r[3],x1:bx+r[4],z0:bz+r[5],z1:bz+r[6],y0:r[2],up:-1,rise:4})});
 [-4,-8].forEach(lv=>{[[10,22],[18,22],[10,32],[18,32],[26,32]].forEach(p=>{box(bx+p[0],lv,bz+p[1],.8,3.7,.8,0xa8a8a8,false);colB(bx+p[0]-.4,bx+p[0]+.4,bz+p[1]-.4,bz+p[1]+.4,lv,lv+3.7,true)});
  for(let k=0;k<6;k++)slab(6+k*4,6.1+k*4,31.5,36.5,lv+.01,.02,0xffffff)});
 [-.3,-4.3].forEach(c=>[6,16,26].forEach(x=>[20,28,34].forEach(z=>slab(x,x+1.2,z,z+.6,c-.15,.1,0xfffbe0))));
 [[-4,12,'hatch'],[-4,16,'sport'],[-4,24,'van'],[-8,8,'hatch'],[-8,20,'sport']].forEach(c=>{const k=spawnCar(c[2],pick([0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0xecf0f1,0x34495e]),bx+c[1],bz+34,Math.PI,'parked',{y:c[0]});k.m.position.y=c[0]});
 box(bx+7.4,0,bz+1,.4,4.5,.4,0x888888,true);box(bx+14.6,0,bz+1,.4,4.5,.4,0x888888,true);box(bx+11,4.2,bz+1,7.6,.3,.4,0x888888,false);sign('PARKING',bx+11,3.35,bz+1,6,-1,'#2a6fd6');
 ROOMS.push({x0:bx+3,x1:bx+37,z0:bz+3,z1:bz+37,h:0,ug:true});PITS.push({x0:bx+3,x1:bx+37,z0:bz+3,z1:bz+37},{x0:bx+8,x1:bx+14,z0:bz-.01,z1:bz+3});
 BLD.push([bx+3,bz+3,34,34,'#55555c']);PLACES.push({x:bx+11,z:bz-3,key:'park',l:'P',c:'#2a6fd6'});
 place('apt',bx+28.5,bz+11.5,-1);place('shop:food',bx+11.5,bz+28.5,1);place('tower',bx+28.5,bz+28.5,1);
 IA(box(bx+17,G,bz+8,.8,.45,2.4,0x8b5a2b,true),'sit');
 [[5.5,10],[5.5,15],[17,14]].forEach(p=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,2.4,6),mat(0x6b4a2b));t.position.set(bx+p[0],G+1.2,bz+p[1]);scene.add(t);
  const f=new THREE.Mesh(new THREE.SphereGeometry(1.6,8,6),mat(0x2f8a3a));f.position.set(bx+p[0],G+3.4,bz+p[1]);scene.add(f);colliders.push({x0:bx+p[0]-.3,x1:bx+p[0]+.3,z0:bz+p[1]-.3,z1:bz+p[1]+.3,y1:3,on:true})})}
let SPR=null,SPRP=null;
function civicIn(key,cx,cz,fz,w,d,zf){const S=SHOPS[key],L=d/2-.4,hot=key==='hotel',F=(x,y,l,sx,sy,sz,c,s)=>box(cx+x,G+.03+y,cz+fz*l,sx,sy,sz,c,s);
 F(0,0,-L+3.3,7,1,.9,hot?0x5a3b22:0x8b5a2b,true);F(0,1,-L+3.3,7.2,.06,1.05,0x2f2f2f,false);F(2,1.06,-L+3.3,.6,.35,.45,0x222222,false);
 const wk=person(hot?0x8e44ad:0x334455),wz=cz+fz*(-L+1.8);wk.position.set(cx,G+.03,wz);wk.rotation.y=fz>0?0:Math.PI;scene.add(wk);
 WORKERS.push({x:cx,z:wz,key,name:S.worker,sp:{x:cx,z:zf+fz*4.8}});
 F(0,0,-L+.35,w-3,2.4,.5,hot?0xc9a66b:0xb5b0a4,true);F(0,1.4,-L+.08,10,.6,.04,parseInt(S.col.slice(1),16),false);
 [-1,1].forEach(k=>{[0,3].forEach(l=>{const c=hot?0x7a3b3b:0x6b4a2b;IA(F(k*10,0,l,2.4,.45,1,c,true),'sit');F(k*10,.45,l+.5,2.4,.6,.2,c,false)});F(k*13,0,-L+1,.7,.7,.7,0x8a4a2a,false);F(k*13,.7,-L+1,.8,1,.8,0x2a8a3a,false);
  if(!hot){F(k*6,0,-L+1,.1,3,.1,0x999999,false);F(k*6+.5,2.2,-L+1,1,.7,.05,k<0?0xc0392b:0xf1c40f,false)}});
 if(key==='town'){F(-9.3,0,-L+1.1,3.2,1,1.4,0x4a2f1a,true);F(-9.3,1,-L+1.1,3.3,.06,1.5,0x2b2b2b,false);IA(F(-9.3,1.06,-L+1.5,.7,.3,.4,0xf4d58a,false),'mayordesk')}}
function makePlaza(x0,z0){const cx=x0+20,cz=z0+20,mh=GHOLE.city[0]; // mh: boca del metro (estación Centro, 10.5)
 boxHole(cx,G,cz,34,.03,34,0xcfc6b0,mh);boxHole(cx,G+.02,cz,34,.02,10,0xbfb6a0,mh);
 shop('town',cx,z0+9,1,33.5,12);shop('hotel',cx,z0+31,-1,33.5,12);
 [-8,8].forEach(k=>IA(box(cx+k,G,cz,.8,.45,2.4,0x8b5a2b,true),'sit'));
 [-14,14].forEach(k=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,2.4,6),mat(0x6b4a2b));t.position.set(cx+k,G+1.2,cz);scene.add(t);
  const f=new THREE.Mesh(new THREE.SphereGeometry(1.8,8,6),mat(0x2f8a3a));f.position.set(cx+k,G+3.6,cz);scene.add(f);colliders.push({x0:cx+k-.3,x1:cx+k+.3,z0:cz-.3,z1:cz+.3,y1:3,on:true})});
 const cy=(r,h,y,c)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mat(c));m.position.set(cx,G+y,cz);scene.add(m)};
 cy(3.2,.5,.25,0xb9b4a8);cy(2.8,.1,.5,0x4aa3d8);cy(.5,1.8,.9,0xb9b4a8);cy(1.3,.25,1.7,0xb9b4a8);cy(1.1,.08,1.85,0x4aa3d8);
 colliders.push({x0:cx-3.2,x1:cx+3.2,z0:cz-3.2,z1:cz+3.2,y1:2,on:true});
 SPRP=new Float32Array(90*3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(SPRP,3));
 SPR=new THREE.Points(g,new THREE.PointsMaterial({color:0xcfeeff,size:.18}));SPR.frustumCulled=false;SPR.userData={cx,cz,top:G+1.9};scene.add(SPR)}
function updFountain(t){if(!SPR)return;const u=SPR.userData;
 for(let i=0;i<90;i++){const vy=3.5+(i%3),hs=(i%4)*.55,T=(vy+Math.sqrt(vy*vy+19.6*(u.top-G-.6)))/9.8,tt=((t*.8+i/90)%1)*T;
  SPRP[i*3]=u.cx+Math.cos(i*2.4)*hs*tt;SPRP[i*3+1]=u.top+vy*tt-4.9*tt*tt;SPRP[i*3+2]=u.cz+Math.sin(i*2.4)*hs*tt}
 SPR.geometry.attributes.position.needsUpdate=true}
const GAS=[[0,1],[3,2]],PUMPS=[],PRICE=2;
function makeGas(x0,z0){const X=a=>x0+a,Z=a=>z0+a,S=SHOPS.gas,cb=(x,z,w,d,h,foot)=>{const o={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y1:h,on:true};colliders.push(Object.assign({car:true},o));if(foot)colliders.push(o)};
 box(X(20),0,Z(20),40,G,40,0xb9b6ad,false);box(X(20),G,Z(27),34,.03,20,0x4a4a4e,false);
 const dr=hollow(X(20),Z(10),18,14,3.8,1,S.wall,3.2,S.floor),zf=Z(17);dr.shop='gas';sign(S.n,X(20),G+3,zf,5,1,S.c);shopIn('gas',X(20),Z(10),1,18,14,zf);
 PLACES.push({x:X(20),z:Z(21),key:'gas',l:'G',c:S.col});colliders.push({x0:X(11),x1:X(29),z0:Z(3),z1:Z(17),y1:9,car:true,on:true});BLD.push([X(3),Z(17),34,20,'#6e6e72']);
 box(X(20),G+4,Z(28.5),30,1.4,15,0xe8e8e8,false);box(X(20),G+4,Z(28.5),30.2,.45,15.2,0xc62828,false);
 sign(S.n,X(20),G+4.7,Z(36),6,1,'#c62828');sign(S.n,X(20),G+4.7,Z(21),6,-1,'#c62828');
 [10,20,30].forEach(a=>[25,31].forEach(z=>box(X(a),G+3.93,Z(z),.8,.06,.8,0xfffbe0,false)));
 [15,25].forEach(a=>{box(X(a),G,Z(28),1.6,.25,10,0x9a9a9a,false);cb(X(a),Z(28),1.6,10,.3,0);
  [23.2,32.8].forEach(z=>{box(X(a),G,Z(z),.5,4,.5,0x777777,false);cb(X(a),Z(z),.5,.5,4,1)});
  [26,30].forEach(z=>{IA(box(X(a),G+.25,Z(z),.9,1.5,.6,0xd32f2f,false),'pump');box(X(a),G+1.35,Z(z),.7,.35,.64,0x1a1a1a,false);PUMPS.push({x:X(a),z:Z(z)});cb(X(a),Z(z),.9,.6,1.8,1)})});
 box(X(36.5),G,Z(37),.5,7,.5,0x666666,false);cb(X(36.5),Z(37),.5,.5,7,1);
 sign('GAS · '+PRICE+' €/L',X(36.5),G+7,Z(37),4.4,1,'#c62828');sign('GAS · '+PRICE+' €/L',X(36.5),G+7,Z(37),4.4,-1,'#c62828')}
let petPlaced=false;const petT=t=>(t==='shop:shop'&&!petPlaced)?(petPlaced=true,'shop:pet'):t;
const SEQ=['house','apt','house','shop:food','house','apt','shop:furn','house','tower','shop:bar','house','shop:bank','shop:shop','house','shop:estate'];let si=0;
// Gimnasios: la 3.ª y la 5.ª inmobiliaria del barrio principal (nº 2 y 4 contando desde 0; en x≈65,z≈244 y x≈173,z≈190) son gimnasios. Quedan 4 inmobiliarias.
let estN=0;const GYM_AT=[2,4];
// Hamburgueserías: el 2.º y el 4.º bar del barrio principal (nº 1 y 3 contando desde 0). Mismo interior que un bar (shopIn), así no cambia nada más del mapa.
let barN=0;const BURGER_AT=[1,3];
function place(t,px,pz,fz){if(t==='house')house(px,pz,fz);else if(t==='apt')apt(px,pz,fz,false);else if(t==='tower')apt(px,pz,fz,true);
 else{let k=t.split(':')[1];if(k==='estate'&&GYM_AT.includes(estN++))k='gym';if(k==='bar'&&BURGER_AT.includes(barN++))k='burger';shop(k,px,pz,fz,16)}}
for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x0=i*P,z0=j*P;
 if(i==PKI&&j==PKJ){makeParking(x0,z0);continue}
 if(GAS.some(g=>g[0]==i&&g[1]==j)){si+=4;makeGas(x0,z0);continue}
 if(i==2&&j==2){boxHole(x0+20,0,z0+20,40,G,40,0xb9b6ad,GHOLE.city[0]);colliders.push({x0:x0+3,x1:x0+37,z0:z0+3,z1:z0+37,y1:9,car:true,on:true});makePlaza(x0,z0);continue}
 box(x0+20,0,z0+20,40,G,40,0xb9b6ad,false);colliders.push({x0:x0+3,x1:x0+37,z0:z0+3,z1:z0+37,y1:9,car:true,on:true});
 const sp=(i==1&&j==1)?'super':(i==3&&j==3)?'dealer':null;
 for(let b=0;b<2;b++){const fz=b?1:-1,pz=z0+3+b*17+8.5;
  if(sp&&b==0){shop(sp,x0+20,pz,fz,33.5);continue}
  for(let a=0;a<2;a++)place(petT((i==N-1&&j==N-1&&b==1&&a==1)?(si++,'shop:garage'):SEQ[(si++*7)%SEQ.length]),x0+3+a*17+8.5,pz,fz)}}
// farolas: poste en el borde de cada manzana; la luz se enciende de noche
function glowTex(st){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);st.forEach(a=>r.addColorStop(a[0],a[1]));g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
const LAMPS=[],lampMat=new THREE.MeshBasicMaterial({color:0x555a60}),
 poolMat=new THREE.MeshBasicMaterial({color:0xffc880,map:glowTex([[0,'rgba(255,255,255,.9)'],[.25,'rgba(255,255,255,.5)'],[.55,'rgba(255,255,255,.15)'],[1,'rgba(255,255,255,0)']]),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),
 poolGeo=new THREE.CircleGeometry(8,24),LAMP_ON=new THREE.Color(0xffe3a0);
function lampPost(x,z,dx,dz){box(x,G,z,.16,4.3,.16,0x3a3f44,true);box(x+dx*.45,G+4.2,z+dz*.45,dx?.95:.12,.1,dz?.95:.12,0x3a3f44,false);box(x+dx*.9,G+4.1,z+dz*.9,.5,.12,.5,lampMat,false);
 LAMPS.push({x:x+dx*.9,y:G+4.1,z:z+dz*.9});const pm=new THREE.Mesh(poolGeo,poolMat);pm.rotation.x=-Math.PI/2;pm.position.set(x+dx*.9,G+.05,z+dz*.9);pm.userData.st=1;scene.add(pm)}
for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(GAS.some(g=>g[0]==i&&g[1]==j))continue;const x0=i*P,z0=j*P;
 [15,25,35.5,4.5].forEach(a=>{lampPost(x0+a,z0+1,0,-1);lampPost(x0+a,z0+39,0,1)});
 [5,15,25,35].forEach(a=>{lampPost(x0+1,z0+a,-1,0);lampPost(x0+39,z0+a,1,0)})}
function buildHighway(){
 const A={p:[],i:[]},W={p:[],i:[]},Y={p:[],i:[]},R={p:[],i:[]},C={p:[],i:[]},posts=[],cols=[];let cnt=0;
 const Yd=p=>p[3]!==undefined?p[3]:p[2];
 const quad=(o,v)=>{const b=o.p.length/3;for(const q of v)o.p.push(q[0],q[1],q[2]);o.i.push(b,b+1,b+2,b+1,b+3,b+2)};
 const nr=(po,i)=>{const p=po[Math.max(0,i-1)],q=po[Math.min(po.length-1,i+1)],tx=q[0]-p[0],tz=q[1]-p[1],l=Math.hypot(tx,tz)||1;return[-tz/l,tx/l]};
 const nearP=(p,L,r)=>L.some(j=>Math.hypot(p[0]-j[0],p[1]-j[1])<(r||12));
 const rib=(o,po,o0,o1,dy,skip)=>{for(let i=0;i<po.length-1;i++){if(skip&&skip(i))continue;const a=po[i],b=po[i+1],na=nr(po,i),nb=nr(po,i+1);quad(o,[[a[0]+na[0]*o0,Yd(a)+dy,a[1]+na[1]*o0],[a[0]+na[0]*o1,Yd(a)+dy,a[1]+na[1]*o1],[b[0]+nb[0]*o0,Yd(b)+dy,b[1]+nb[1]*o0],[b[0]+nb[0]*o1,Yd(b)+dy,b[1]+nb[1]*o1]])}};
 const wall=(o,po,off,y0,y1,skip)=>{for(let i=0;i<po.length-1;i++){if(skip&&skip(i))continue;const a=po[i],b=po[i+1],na=nr(po,i),nb=nr(po,i+1),ax=a[0]+na[0]*off,az=a[1]+na[1]*off,bx=b[0]+nb[0]*off,bz=b[1]+nb[1]*off;quad(o,[[ax,Yd(a)+y0,az],[ax,Yd(a)+y1,az],[bx,Yd(b)+y0,bz],[bx,Yd(b)+y1,bz]])}};
 const M=(w,h,d,c,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='object'?c:mat(c));m.position.set(x,y+h/2,z);m.rotation.y=ry||0;m.userData.st=1;scene.add(m)};
 const bk=()=>0;
 const wcol=(po,off,skip)=>{for(let i=0;i<po.length-1;i++){if(skip&&skip(i))continue;const a=po[i],b=po[i+1],na=nr(po,i),nb=nr(po,i+1),ax=a[0]+na[0]*off,az=a[1]+na[1]*off,bx=b[0]+nb[0]*off,bz=b[1]+nb[1]*off;WALLS.push({ax,az,bx,bz,ya:Yd(a),yb:Yd(b),x0:Math.min(ax,bx),x1:Math.max(ax,bx),z0:Math.min(az,bz),z1:Math.max(az,bz)})}};
 HW.polys.forEach(po=>{const kd=po.kind,ring=kd==='ring',skipL=ring?i=>nearP(po[i],HW.merge)||nearP(po[i+1],HW.merge):kd==='ramp'?i=>i<3||i>po.length-6:i=>i<1||i>po.length-3||nearP(po[i],HW.mouth)||nearP(po[i+1],HW.mouth);
  const skipR=ring?i=>nearP(po[i],HW.merge,28)||nearP(po[i+1],HW.merge,28):skipL,sk=(sd,off,base)=>i=>base(i)||(kd==='ramp'&&[i,i+1].some(j=>{const n=nr(po,j);return hwNear(po[j][0]+n[0]*off*sd,po[j][1]+n[1]*off*sd,HW.polys[0]).d<9.4}));
  const hw=ring?7.8:4.2,ho=hw+.5;rib(A,po,-hw,hw,.08);rib(W,po,-(hw-.2),-(hw-.4),.11,sk(-1,hw-.2,skipL));rib(W,po,hw-.4,hw-.2,.11,sk(1,hw-.2,skipL));
  if(ring){const dsh=i=>i%3!==0||skipL(i);rib(W,po,-4.3,-4.1,.11,dsh);rib(W,po,4.1,4.3,.11,dsh);rib(Y,po,-.75,-.55,.11);rib(Y,po,.55,.75,.11);rib(R,po,-.25,.25,1.05);wall(R,po,-.25,0,1.05);wall(R,po,.25,0,1.05);wcol(po,0,null)}else if(kd!=='ramp')rib(Y,po,-.08,.08,.11,i=>i%3!==0);
  if(kd==='spur'){const dj=p=>HW.junc.reduce((m,j)=>Math.min(m,Math.hypot(p[0]-j[0],p[1]-j[1])),1e9),brg=i=>Math.min(dj(po[i]),dj(po[i+1]))<9.5,flat=i=>Yd(po[i])-po[i][2]<.08&&Yd(po[i+1])-po[i+1][2]<.08,nb=i=>!brg(i)||flat(i);
   rib(C,po,-4.9,4.9,.02,flat);rib(C,po,-4.9,4.9,-.5,nb);wall(C,po,-4.9,-.5,.02,nb);wall(C,po,4.9,-.5,.02,nb);
   for(let i=0;i<po.length-1;i++){if(brg(i)||flat(i))continue;const a=po[i],b=po[i+1],na=nr(po,i),nb2=nr(po,i+1);for(const sd of[-1,1]){const ax=a[0]+na[0]*4.9*sd,az=a[1]+na[1]*4.9*sd,bx=b[0]+nb2[0]*4.9*sd,bz=b[1]+nb2[1]*4.9*sd;quad(C,[[ax,Yd(a)+.02,az],[ax,a[2]-.7,az],[bx,Yd(b)+.02,bz],[bx,b[2]-.7,bz]])}}}
  for(const sd of[-1,1]){const sk2=sk(sd,ho,skipR);wall(R,po,ho*sd,.35,.95,sk2);wcol(po,ho*sd,sk2);for(let i=0;i<po.length-1;i+=2){if(sk2(i))continue;const n=nr(po,i);posts.push([po[i][0]+n[0]*ho*sd,Yd(po[i]),po[i][1]+n[1]*ho*sd])}}
  const step=ring||kd==='byp'?6:kd==='spur'?4:0;
  if(step)for(let i=ring?3:2;i<po.length-1;i+=step){const p=po[i];if(ring?(nearP(p,HW.merge)||nearP(p,HW.junc,14)):(nearP(p,HW.junc,16)||nearP(p,HW.mouth)))continue;
   const n=nr(po,i),sd=(cnt++%2)?1:-1,off=ring?(bk(po,i)>.35?8.9:9.4):5.4,px=p[0]+n[0]*off*sd,pz=p[1]+n[1]*off*sd,dx=-n[0]*sd,dz=-n[1]*sd,y=Yd(p),ry=Math.atan2(dx,dz);
   M(.16,4.3,.16,0x3a3f44,px,y,pz);M(.12,.1,.95,0x3a3f44,px+dx*.45,y+4.2,pz+dz*.45,ry);M(.5,.12,.5,lampMat,px+dx*.9,y+4.1,pz+dz*.9,ry);
   LAMPS.push({x:px+dx*.9,y:y+4.1,z:pz+dz*.9});const pm=new THREE.Mesh(poolGeo,poolMat);pm.rotation.x=-Math.PI/2;pm.position.set(px+dx*.9,y+.15,pz+dz*.9);pm.userData.st=1;scene.add(pm)}});
 const mk=(o,c,po)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(o.p),3));g.setIndex(o.i);g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:po,polygonOffsetUnits:po})))};
 mk(A,0x3b3b40,-1);mk(W,0xe8e8e8,-3);mk(Y,0xe0b020,-3);mk(R,0xa9aeb5,0);mk(C,0x8d9096,-1);
 const d=new THREE.Object3D(),im=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.7,.12),mat(0x777c82),posts.length);posts.forEach((q,i)=>{d.position.set(q[0],q[1]+.35,q[2]);d.updateMatrix();im.setMatrixAt(i,d.matrix)});scene.add(im);
 const ic=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat(0x8d9096),cols.length);d.rotation.set(0,0,0);cols.forEach((q,i)=>{d.position.set(q[0],q[1]+q[3]/2,q[2]);d.scale.set(.6,q[3],.6);d.updateMatrix();ic.setMatrixAt(i,d.matrix)});scene.add(ic)}
buildHighway();

// ---------- 5.1 Señales de tráfico (fase 1: sistema base; todavía sin reglas) ----------
// addSign(tipo,x,z,ry,{y,h,s,col}): tipo ∈ SGT · ry = giro de la placa (su cara mira hacia (sen ry, cos ry)) · h = altura del centro de la placa · s = tamaño · col = false para que no tenga colisión
const SIGNS=[],SGT=['stop','ceda','l30','peat','l50','l120','l40','sent'];
function addSign(t,x,z,ry,o){o=o||{};SIGNS.push({t,x,z,ry,y:o.y===undefined?G:o.y,h:o.h||2.3,s:o.s||.9,col:o.col!==false})}
function buildSigns(){
 if(!SIGNS.length)return;
 const cv=document.createElement('canvas');cv.width=512;cv.height=256;const g=cv.getContext('2d'),T=128;
 const tri=(a)=>{g.beginPath();a.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fill()},ring=(r,c)=>{g.fillStyle=c;g.beginPath();g.arc(0,0,r,0,7);g.fill()};
 SGT.forEach((t,i)=>{g.save();g.translate((i%4)*T+T/2,(i>>2)*T+T/2);g.textAlign='center';g.textBaseline='middle';
  if(t==='stop'){const oc=r=>{g.beginPath();for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4;k?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill()};g.fillStyle='#fff';oc(62);g.fillStyle='#c4161c';oc(55);g.fillStyle='#fff';g.font='bold 34px sans-serif';g.fillText('STOP',0,2)}
  else if(t==='ceda'){g.fillStyle='#c4161c';tri([[-60,-48],[60,-48],[0,56]]);g.translate(0,-13);g.scale(.68,.68);g.translate(0,13);g.fillStyle='#fff';tri([[-60,-48],[60,-48],[0,56]])}
  else if(t[0]==='l'){const n=t.slice(1);ring(60,'#c4161c');ring(46,'#fff');g.fillStyle='#111';g.font='bold '+(n.length>2?40:54)+'px sans-serif';g.fillText(n,0,3)}
  else if(t==='peat'){g.fillStyle='#1f5fae';g.fillRect(-58,-58,116,116);g.fillStyle='#fff';tri([[0,-46],[-42,34],[42,34]]);g.fillStyle='#111';g.beginPath();g.arc(0,-6,7,0,7);g.fill();g.fillRect(-4,1,8,20)}
  else if(t==='sent'){ring(60,'#1f5fae');g.fillStyle='#fff';g.fillRect(-9,-6,18,46);tri([[-26,-6],[26,-6],[0,-42]])}
  g.restore()});
 const tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;
 const mp=new THREE.MeshLambertMaterial({map:tex,alphaTest:.5,side:THREE.DoubleSide});mp.userData.nd=1;
 const Pp=[],Uu=[],Ii=[],pol=[];
 SIGNS.forEach(s=>{const c=Math.cos(s.ry),n=Math.sin(s.ry),w=s.s/2,i=SGT.indexOf(s.t);if(i<0)return;const u0=(i%4)/4,v0=1-((i>>2)+1)/2,b=Pp.length/3,yc=s.y+s.h;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>{Pp.push(s.x+c*w*q[0],yc+w*q[1],s.z-n*w*q[0]);Uu.push(u0+(q[0]>0?.25:0),v0+(q[1]>0?.5:0))});
  Ii.push(b,b+1,b+2,b+1,b+3,b+2);pol.push([s.x-n*.07,s.y,s.z-c*.07,s.h+w]);
  if(s.col)colliders.push({x0:s.x-.2,x1:s.x+.2,z0:s.z-.2,z1:s.z+.2,y0:s.y,y1:s.y+s.h+w,on:true})});
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));bg.setAttribute('uv',new THREE.Float32BufferAttribute(Uu,2));bg.setIndex(Ii);bg.computeVertexNormals();
 const pm=new THREE.Mesh(bg,mp);scene.add(pm);
 const d=new THREE.Object3D(),im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat(0x8a9097),pol.length);
 pol.forEach((q,i)=>{d.position.set(q[0],q[1]+q[3]/2,q[2]);d.scale.set(.09,q[3],.09);d.updateMatrix();im.setMatrixAt(i,d.matrix)});im.frustumCulled=false;scene.add(im)}
// ciudad: los cruces de TLX llevan semáforos (fase 3, más abajo); el resto de cruces interiores, 4 señales (una por acceso) de STOP o Ceda junto al bordillo del carril de entrada
// TLX = [i,j] de los cruces principales: el centro (2x2) y los tres donde entran las carreteras de la autopista (oeste j=3, norte i=3, sur i=2)
const TLX=[[2,2],[2,3],[3,2],[3,3],[1,3],[3,1],[2,4]];
{const CT=['stop','ceda'];
 for(let i=1;i<N;i++)for(let j=1;j<N;j++){if(TLX.some(q=>q[0]===i&&q[1]===j))continue;const cx=-7+i*P,cz=-7+j*P,t=CT[(i+j)%2];
  for(const dir of[1,-1]){addSign(t,cx-dir*9,cz+dir*6.4,Math.atan2(-dir,0));addSign(t,cx-dir*6.4,cz-dir*9,Math.atan2(0,-dir))}}}
// autopista: límite 120 cada ~180 m, a la derecha de cada sentido, fuera del quitamiedos
try{const ring=HW.polys[0],bad=[...HW.junc,...HW.merge,...HW.mouth];
 for(let i=20;i<ring.length-2;i+=45){const p=ring[i],q=ring[i+1],tx=q[0]-p[0],tz=q[1]-p[1],l=Math.hypot(tx,tz)||1,nx=-tz/l,nz=tx/l;
  if(bad.some(j=>Math.hypot(p[0]-j[0],p[1]-j[1])<60)||bumpAt(p[0],p[1])>.35)continue;
  for(const sd of[1,-1])addSign('l120',p[0]+nx*10.2*sd,p[1]+nz*10.2*sd,Math.atan2(-tx*sd,-tz*sd),{y:p[3]!==undefined?p[3]:p[2],h:3,s:1.6,col:false})}}catch(e){console.warn('señales autopista',e)}
buildSigns();

// ---------- 5.2 Semáforos (fase 3) ----------
// Cada cruce de TLX tiene un mástil con brazo por acceso (a la derecha del sentido de la marcha) y una cabeza de 3 luces colgada sobre el carril.
// Ciclo de 30 s por cruce: eje X → verde 10 s · ámbar 3 s · rojo; el eje Z va desfasado medio ciclo, así hay 2 s con todo en rojo entre un eje y otro.
// El reloj es Date.now() (igual para todos los jugadores) y cada cruce tiene su propio desfase.
// tlState(tl,axis) → 0 verde · 1 ámbar · 2 rojo (axis 0 = circula por X, 1 = por Z, igual que los coches IA). Lo usará la fase 5.
const TLS=[],TL_CYC=30,tlPh=t=>t<10?0:t<13?1:2;
function tlState(tl,axis){const t=(Date.now()/1000+tl.off)%TL_CYC;return tlPh(axis?(t+15)%TL_CYC:t)}
let TLU=null; // actualiza luces y brillo nocturno; lo llama updEnv con el factor de noche (0 día · 1 noche)
(function(){
 if(!TLX.length)return;
 const CON=[0x35ff7a,0xffb327,0xff2d1f].map(c=>new THREE.Color(c)),COFF=[0x07220f,0x2a1c05,0x2a0806].map(c=>new THREE.Color(c)), // por estado: 0 verde · 1 ámbar · 2 rojo
  poles=[],bodies=[],lampPos=[],heads=[],d=new THREE.Object3D(),FW=8.5,LP=7.3,LH=3.2,HY=4.65; // FW: distancia al centro del cruce · LP: lateral del mástil · LH: lateral de la cabeza (sobre el carril)
 TLX.forEach(([i,j])=>{const cx=-7+i*P,cz=-7+j*P,tl={i,j,cx,cz,off:(i*7+j*11)%TL_CYC,last:[-1,-1],heads:[[],[]]};TLS.push(tl);
  [[1,0,0],[-1,0,0],[0,1,1],[0,-1,1]].forEach(([fx,fz,axis])=>{const rx=-fz,rz=fx, // f = sentido de la marcha · r = derecha
   px=cx-fx*FW+rx*LP,pz=cz-fz*FW+rz*LP,hx=cx-fx*FW+rx*LH,hz=cz-fz*FW+rz*LH,ry=Math.atan2(-fx,-fz); // ry: la cabeza mira hacia los coches que llegan
   poles.push([px,G+2.75,pz,.16,5.5,.16,0]); // mástil
   poles.push([(px+hx)/2,G+5.33,(pz+hz)/2,.12,.14,LP-LH,Math.atan2(rx,rz)]); // brazo
   bodies.push([hx,G+HY,hz,.42,1.2,.3,ry]); // caja de la cabeza
   const hd={n:heads.length};heads.push(hd);tl.heads[axis].push(hd);
   for(let k=0;k<3;k++)lampPos.push([hx-fx*.16,G+HY+.38-k*.38,hz-fz*.16,ry,hx-fx*.42,hz-fz*.42]); // k: 0 rojo (arriba) · 1 ámbar · 2 verde
   colliders.push({x0:px-.2,x1:px+.2,z0:pz-.2,z1:pz+.2,y0:G,y1:G+5.5,on:true})})});
 const inst=(arr,m)=>{const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),m,arr.length);arr.forEach((q,n)=>{d.position.set(q[0],q[1],q[2]);d.scale.set(q[3],q[4],q[5]);d.rotation.set(0,q[6],0);d.updateMatrix();im.setMatrixAt(n,d.matrix)});im.frustumCulled=false;scene.add(im);return im};
 inst(poles,mat(0x3a3f44));inst(bodies,mat(0x15171a));
 // lentes: un disco por luz con color por instancia (se cambia solo cuando el semáforo cambia de estado)
 const lamps=new THREE.InstancedMesh(new THREE.CircleGeometry(.15,14),new THREE.MeshBasicMaterial({color:0xffffff}),lampPos.length);
 d.scale.set(1,1,1);lampPos.forEach((q,n)=>{d.position.set(q[0],q[1],q[2]);d.rotation.set(0,q[3],0);d.updateMatrix();lamps.setMatrixAt(n,d.matrix);lamps.setColorAt(n,COFF[2-n%3])});lamps.frustumCulled=false;scene.add(lamps);
 // halos: puntos aditivos delante de cada lente (solo se ven en la que está encendida; más fuertes de noche)
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(lampPos.flatMap(q=>[q[4],q[1],q[5]]),3));
 const hcol=new THREE.BufferAttribute(new Float32Array(lampPos.length*3),3);hg.setAttribute('color',hcol);
 const hm=new THREE.PointsMaterial({map:glowTex([[0,'rgba(255,255,255,1)'],[.15,'rgba(255,255,255,.7)'],[.4,'rgba(255,255,255,.18)'],[1,'rgba(255,255,255,0)']]),vertexColors:true,size:2.2,sizeAttenuation:true,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending}),halo=new THREE.Points(hg,hm);halo.frustumCulled=false;scene.add(halo);
 const setHead=(hd,st)=>{for(let k=0;k<3;k++){const s2=2-k,on=s2===st,n=hd.n*3+k,c=on?CON[s2]:COFF[s2];lamps.setColorAt(n,c);if(on)hcol.setXYZ(n,c.r,c.g,c.b);else hcol.setXYZ(n,0,0,0)}};
 TLU=night=>{let ch=false;for(const tl of TLS)for(let a=0;a<2;a++){const st=tlState(tl,a);if(st!==tl.last[a]){tl.last[a]=st;for(const hd of tl.heads[a])setHead(hd,st);ch=true}}
  if(ch){lamps.instanceColor.needsUpdate=true;hcol.needsUpdate=true}hm.opacity=.1+.9*night};
 TLU(0)})();

