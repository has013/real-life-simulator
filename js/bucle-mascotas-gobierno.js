/* ===============================================================================================
   FICHA · bucle-mascotas-gobierno.js
   Qué hay:          Bucle principal: lo que pasa en cada fotograma (25), mascotas (26), rangos sociales y gobierno municipal: elecciones, alcalde, impuestos (27) y propiedades de otros jugadores (28).
   Tócalo si quieres: cambiar las mascotas, el gobierno o las elecciones, o añadir algo que tenga que pasar en cada fotograma
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 25. BUCLE PRINCIPAL
//     mpTick (envía tu posición al servidor), conexión al servidor y loop(), que actualiza y dibuja
//     cada fotograma. También los microsueños al volante y la barra de energía.
// =================================================================================================
function mpTick(dt){if(MP.connected&&MP.ws&&MP.ws.readyState===1&&started&&ov.style.display==='none'){
 const now=performance.now();if(now-MP.lastSend>(riding&&riding.boat?100:180)){MP.lastSend=now;try{const px=inCar?inCar.x:(riding?riding.x:pl.x),pz=inCar?inCar.z:(riding?riding.z:pl.z),pyy=inCar?(inCar.y||0):(riding?(riding.alt||0):py),ph=inCar?inCar.h:(riding?riding.h:yaw),vt=inCar?inCar.t:(riding&&!riding.metro?(riding.boat?'boat':riding.avion?'avion':riding.heli?'heli':riding.plane?'plane':'bus'):null),vc=inCar?(inCar.col||inCar.m?.userData?.col||0x4477aa):(riding&&riding.hex!=null?riding.hex:0x4477aa),vp=riding&&!inCar?(riding.boat?(riding.str||0):(riding.pt||0)):0,vk=riding&&!inCar?(riding.boat?riding.v/riding.spec.max:(riding.bk||0)):0,vth=riding&&!inCar?(riding.boat?(riding.net?1:0):riding.avion?(riding.thr||0):riding.heli?clamp(riding.rs/HELIFLY,0,1.2):0):0;MP.ws.send(JSON.stringify({type:'state',x:px,y:pyy,z:pz,yaw:ph,vehicle:!!(inCar||(riding&&!riding.metro)),vType:vt,vCol:vc,vPt:vp,vBk:vk,vThr:vth,vId:(riding&&!inCar&&riding.boat)?riding.name:null,outfit:worn,profile:mpProfileSnapshot(),vit:{h:Math.round(hunger),e:Math.round(energy)},pets:pets.slice(0,3).map(q=>({t:q.t,name:q.name,col:q.col,x:q.x,y:q.y,z:q.z,wear:q.wear||{}}))}))}catch(e){}}
 }
 const now=performance.now();for(const [id,p] of MP.players){const ox=p.mesh.position.x,oz=p.mesh.position.z;p.mesh.position.lerp(p.target,Math.min(1,dt*12));{const v=dt>0?Math.hypot(p.mesh.position.x-ox,p.mesh.position.z-oz)/dt:0;p.spd=(p.spd||0)+(Math.min(v,14)-(p.spd||0))*Math.min(1,dt*6);const mv=!p.vehicleType&&p.spd>.5,sp=p.spd;if(mv)p.walk=(p.walk||0)+dt*(sp>6?12:sp<3?6:9);animPerson(p.mesh,p.walk||0,mv?(sp>6?1.35:sp<3?.6:1):0,dt)}let df=Math.atan2(Math.sin(p.yaw-p.mesh.rotation.y),Math.cos(p.yaw-p.mesh.rotation.y));p.mesh.rotation.y+=df*Math.min(1,dt*10);if(p.vehicleMesh&&(p.vehicleType==='avion'||p.vehicleType==='plane'||p.vehicleType==='heli')){const vm=p.vehicleMesh,k=Math.min(1,dt*8);vm.position.x+=(p.target.x-vm.position.x)*k;vm.position.y+=(p.target.y+G-vm.position.y)*k;vm.position.z+=(p.target.z-vm.position.z)*k;const dy=Math.atan2(Math.sin(p.yaw-vm.rotation.y),Math.cos(p.yaw-vm.rotation.y));vm.rotation.y+=dy*k;vm.rotation.x+=(-(p.vPt||0)-vm.rotation.x)*k;vm.rotation.z+=((p.vBk||0)-vm.rotation.z)*k;if(p.vehicleType==='avion'){if(vm.userData.prop)vm.userData.prop.rotation.z+=dt*(8+(p.vThr||0)*55)}else if(p.vehicleType==='heli'){const hu=vm.userData,hr=HELIFLY*(p.vThr||0);if(hu.rot){hu.rot.rotation.y+=hr*dt;hu.tail.rotation.x+=hr*5*dt}}else if(vm.userData.gear)vm.userData.gear.visible=p.target.y<10}if(now-p.last>15000)mpRemove(id)}
}
mpConnect();

const clock=new THREE.Clock();let tm=0,objT=1;
let fpsCap=0,fpsLast=0;try{const v=+localStorage.getItem('rls_fps');if(v===30||v===45||v===60)fpsCap=v}catch(e){}
function loop(){requestAnimationFrame(loop);if(fpsCap){const now=performance.now(),iv=1000/fpsCap;if(now-fpsLast<iv-3)return;fpsLast=now}const dt=Math.min(clock.getDelta(),.05);mpTick(dt);
 if(started&&ov.style.display==='none'){tm+=dt;SEA.position.y=-.4+Math.sin(tm*.8)*.04;seaTex.offset.set(tm*.004,tm*.002);WINDT.value=tm;smokeUpd(tm);portUpd(tm);if(SEA.material.uniforms)SEA.material.uniforms.tm.value=tm;if(!dlgOpen||invOpen)hunger=Math.max(0,hunger-dt*.2*(energy<=0?5:1));if(!dlgOpen||invOpen){const wk=(working||task)?.12:0;thirst=100;energy=seat?Math.min(100,energy+dt*.5):Math.max(0,energy-dt*(.1+.5*eff+wk)*(hunger<=0?5:1))}
  if(hunger<=0&&energy<=0&&!collapsing&&!inCar&&!pax&&!riding&&!working&&!task&&!dlgOpen)collapse();if(hunger<=0&&(tm%25)<dt)toast('¡Tienes mucha hambre! Come algo (F)');if(energy<=0&&((tm+16)%25)<dt)toast('Estás agotado: siéntate a descansar o toma un café');
  for(const d of DOORS){if(d.gar){d.ang+=((d.open?1:0)-d.ang)*Math.min(1,5*dt);d.leaf.scale.y=Math.max(.03,1-d.ang*.97);continue}const tg=d.open?-d.fz*1.9:0;d.ang+=(tg-d.ang)*Math.min(1,8*dt);d.pv.rotation.y=d.ang}
  if(pax)paxStep();if(!dlgOpen){if(inCar)driveCar(inCar,dt);else if(!riding&&!pax)stepFoot(dt)}
  microStep(dt);
  for(const c of cars)if(c.mode==='ai')aiStep(c,dt);
  BUSES.forEach(b=>busStep(b,dt));PLANES.forEach(p=>planeStep(p,dt));ELEV.forEach(e=>elStep(e,dt));metroStep();if(riding)rideStep();avionStep(dt);heliStep(dt);boatStep(dt);boatRemoteStep(dt);fishStep(dt);if(!dlgOpen)jobStep(dt);
  for(const p of peds){let a,b,mv=true;const T=p.trip;
  if(T){if(T.w>0){T.w-=dt;mv=false}else{T.u+=T.d*p.sp*dt;if(T.d>0&&T.u>=T.L){T.u=T.L;T.d=-1;T.w=4+Math.random()*12}else if(T.d<0&&T.u<=0){p.trip=null;p.nt=25+Math.random()*60}}
   if(p.trip){a=tripPos(T,T.u);b=tripPos(T,T.u+T.d*.3)}}
  if(!p.trip){p.t+=p.dir*p.sp*dt;a=ringPos(p,p.t);b=ringPos(p,p.t+p.dir*.3);if(p.trav){p.nt-=dt;if(p.nt<=0)startTrip(p)}}
  const fdx=a[0]-pl.x,fdz=a[1]-pl.z,far=IS_TOUCH&&(fdx*fdx+fdz*fdz>16900);if(p.g.visible===far)p.g.visible=!far;
  if(mv&&!far&&p.g.userData.P){p.ph=(p.ph||0)+p.sp*4.6*dt;animPerson(p.g,p.ph,1,dt)}else if(mv&&p.g.userData.P)p.ph=(p.ph||0)+p.sp*4.6*dt;p.g.position.set(a[0],G+heightAt(a[0],a[1])+(mv?(p.g.userData.P?Math.abs(Math.sin(p.ph||0))*.035:Math.abs(Math.sin(tm*8+p.s*9))*.05):0),a[1]);if(mv||!T)p.g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1])}
  for(const g of IDLERS)if(Math.abs(g.position.x-pl.x)<50&&Math.abs(g.position.z-pl.z)<50)animPerson(g,0,0,dt);
  petStep(dt);updCam(dt);busHud();updEnv(dt);updFountain(tm);const n=nearest(),swim=!riding&&inWater(pl.x,pl.z);setTx($('prompt'),dlgOpen?'':(swim?'🌊 Estás nadando · WASD para moverte · Shift para nadar más rápido':(n?n.txt:'')))}
 rankUpdate();setTx($('money'),'€ '+money+(debtTotal()?'  ·  deuda €'+debtTotal():''));const fe=$('fuel');if(inCar&&started&&!inCar.spec.nf){const f=inCar.fuel,tk=inCar.spec.tank,pc=Math.round(f/tk*100);setDsp(fe,'block');setTx(fe,'⛽ '+f.toFixed(1)+' / '+tk+' L');setBg(fe,'linear-gradient(90deg,'+(pc<15?'#d33':'#2a9d4a')+' '+pc+'%,rgba(0,0,0,.5) '+pc+'%)')}else setDsp(fe,'none');const hp=Math.round(hunger);setTx($('hb'),'Hambre '+hp+'%');setBg($('hb'),'linear-gradient(90deg,'+(hp<25?'#d33':'#e8a020')+' '+hp+'%,rgba(0,0,0,.5) '+hp+'%)');if((objT+=dt)>.4){objT=0;setTx($('obj'),'Objetivo: '+objective()[0])};
 sfx.update({run:started&&ov.style.display==='none',car:inCar,boat:(riding&&riding.boat)?riding:null,jet:Math.max(jetLevel(),(riding&&riding.boat)?Math.min(.6,Math.abs(riding.v)/riding.spec.max*.6):0),thr:(riding&&riding.boat)?((K.KeyW||K.ArrowUp)?1:0):(MB.l?1:0),rain:cur.rain,tod,indoor:!!inRoom(pl.x,pl.z),ug:py<-1.5,dt});
 barHud();if(big)drawMap();if(BM.on)bmCam();ren.render(scene,cam)}
function microStep(dt){
 if(!inCar||energy>=20||dlgOpen){if(micro>0||microW){micro=0;microW=false;eyes.style.opacity=0}microT=Math.max(microT,6);return}
 const lack=1-energy/20,sp=Math.abs(inCar.v);
 if(micro>0){micro-=dt;if(micro<=0){micro=0;microW=false;eyes.style.opacity=0;toast('¡Despierta! Necesitas dormir o tomar un café');microT=(7+Math.random()*9)*(.35+.65*(1-lack))}return}
 if(sp<3){if(microW){microW=false;eyes.style.opacity=0;microT=Math.max(microT,4)}return}
 microT-=dt;
 if(microT<=2&&!microW){microW=true;eyes.style.opacity=.4;toast('😴 Se te cierran los ojos...')}
 if(microT<=0){micro=1+lack*1.5;microDir=(Math.random()<.5?-1:1)*(.25+Math.random()*.35);eyes.style.opacity=1}}
function barHud(){for(const[i,l,v,c]of[['eb','Energía',energy,'#9ccc3c']]){const e=$(i),p=Math.round(v);setTx(e,l+' '+p+'%');setBg(e,'linear-gradient(90deg,'+(p<25?'#d33':c)+' '+p+'%,rgba(0,0,0,.5) '+p+'%)')}}

// =================================================================================================
// 26. MASCOTAS
//     Tipos de mascota, modelo 3D, comportamiento y panel (tecla T).
// =================================================================================================
const PET_T={dog:{n:'Perro',e:'🐶',price:250,col:[0x8b5a2b,0xd2a56a,0x2b2b2b,0xeeeeee,0xb5651d],say:'¡Guau!',stop:2.2,sp:5.5},
 cat:{n:'Gato',e:'🐱',price:180,col:[0x777777,0xe08a2e,0x222222,0xeeeeee,0xc9a27a],say:'Miau~',stop:3.2,sp:4.2},
 rabbit:{n:'Conejo',e:'🐰',price:90,col:[0xeeeeee,0xb0a090,0x8b6a4a,0xdddddd],say:'*mueve la nariz*',stop:2.6,sp:3.6}},
 PET_MAX=3,PET_NAMES=['Rocky','Luna','Toby','Misi','Nube','Coco','Bimba','Thor','Lola','Pelusa'],petClean=n=>String(n||'').replace(/[<>&"'`\\]/g,'').trim().slice(0,14);
let pets=[],petW=null;
function petMesh(t,c){const g=new THREE.Group(),legs=[],
 M=(w,h,d,x,y,z,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col));m.position.set(x,y,z);g.add(m);return m},
 L=(x,y,z,w,h,col)=>{const pv=new THREE.Group();pv.position.set(x,y,z);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),mat(col));m.position.y=-h/2;pv.add(m);g.add(pv);legs.push(pv)};
 if(t==='dog'){M(.38,.38,.85,0,.58,0,c);M(.32,.3,.32,0,.9,.5,c);M(.16,.13,.2,0,.85,.73,0x222222);M(.07,.2,.1,-.16,1,.46,0x3a2a1a);M(.07,.2,.1,.16,1,.46,0x3a2a1a);M(.05,.05,.05,-.09,.95,.67,0x111111);M(.05,.05,.05,.09,.95,.67,0x111111);
  const tl=M(.07,.07,.4,0,.78,-.5,c);tl.rotation.x=-.6;[[-.13,.35],[.13,.35],[-.13,-.35],[.13,-.35]].forEach(q=>L(q[0],.4,q[1],.11,.4,c))}
 else if(t==='cat'){M(.26,.26,.55,0,.4,0,c);M(.22,.2,.2,0,.55,.33,c);M(.07,.09,.04,-.07,.7,.33,c);M(.07,.09,.04,.07,.7,.33,c);M(.04,.04,.04,-.05,.57,.44,0x66dd66);M(.04,.04,.04,.05,.57,.44,0x66dd66);
  const tl=M(.05,.45,.05,0,.55,-.34,c);tl.rotation.x=.35;[[-.09,.2],[.09,.2],[-.09,-.2],[.09,-.2]].forEach(q=>L(q[0],.27,q[1],.07,.27,c))}
 else{M(.28,.26,.42,0,.28,0,c);M(.2,.18,.2,0,.4,.25,c);M(.05,.26,.04,-.06,.62,.24,c);M(.05,.26,.04,.06,.62,.24,c);M(.05,.05,.05,-.05,.43,.35,0x222222);M(.05,.05,.05,.05,.43,.35,0x222222);M(.1,.1,.1,0,.3,-.25,0xffffff);
  [[-.09,.12],[.09,.12],[-.09,-.12],[.09,-.12]].forEach(q=>L(q[0],.15,q[1],.08,.15,c))}
 g.userData.legs=legs;return g}
function addPet(t,name,col,hunger,hap){if(pets.length>=PET_MAX||!PET_T[t])return null;const m=petMesh(t,col);scene.add(m);
 const p={t,name,col,hunger,hap,wear:{},x:pl.x+1.2,z:pl.z+1.2,y:py,ph:0,stuck:0,ry:0,warn:false,m};m.position.set(p.x,p.y,p.z);pets.push(p);return p}
function petBlocked(x,z,y){for(const o of colliders)if(o.on&&!o.car&&y<o.y1-.05&&y+.5>(o.y0||0)&&x>o.x0-.25&&x<o.x1+.25&&z>o.z0-.25&&z<o.z1+.25)return true;return false}
function petStep(dt){if(!pets.length||!started||ov.style.display!=='none')return;dt=Math.min(dt,.1);const hid=!!(inCar||riding||pax);
 pets.forEach((p,i)=>{const T=PET_T[p.t];p.m.visible=!hid;
  p.hunger=Math.max(0,p.hunger-dt*.035);p.hap=clamp(p.hap-dt*(p.hunger<=0?.08:.01),0,100);
  if(p.hunger<20&&!p.warn){p.warn=true;toast(T.e+' '+p.name+' tiene hambre')}else if(p.hunger>=30)p.warn=false;
  if(hid){p.x=pl.x;p.z=pl.z;p.y=py;return}
  const ang=yaw+Math.PI+(i-(pets.length-1)/2)*1.1,tx=pl.x+Math.sin(ang)*T.stop,tz=pl.z+Math.cos(ang)*T.stop,d=Math.hypot(p.x-pl.x,p.z-pl.z);let mv=false;
  if(d>50||p.stuck>4){p.x=tx;p.z=tz;p.y=py;p.stuck=0}
  else if(d>T.stop+1.2){const ux0=tx-p.x,uz0=tz-p.z,l=Math.hypot(ux0,uz0)||1,ux=ux0/l,uz=uz0/l,sp=T.sp*(d>10?1.7:1)*(p.hunger<10?.6:1),ox=p.x,oz=p.z;
   const nx=p.x+ux*sp*dt,nz=p.z+uz*sp*dt;if(!petBlocked(nx,p.z,p.y))p.x=nx;if(!petBlocked(p.x,nz,p.y))p.z=nz;
   try{wallHit(p.x,p.z,.25,p.y,p)}catch(e){}if(heightAt(p.x,p.z)<-.3){p.x=ox;p.z=oz}
   const moved=Math.hypot(p.x-ox,p.z-oz);mv=moved>sp*dt*.3;p.stuck=(moved<sp*dt*.2&&d>T.stop+3)?p.stuck+dt:0;
   if(moved>0){const tr=Math.atan2(ux,uz);let df=tr-p.ry;df=Math.atan2(Math.sin(df),Math.cos(df));p.ry+=df*Math.min(1,dt*10)}}
  else p.stuck=0;
  const gh=groundH(p.x,p.z,py);if(isFinite(gh))p.y+=(gh-p.y)*Math.min(1,dt*12);
  p.ph+=mv?dt*T.sp*2.2:0;const lg=p.m.userData.legs,sw=mv?.7:0;lg.forEach((l,k)=>{l.rotation.x=Math.sin(p.ph+(k%3===0?0:Math.PI))*sw});
  const hop=(p.t==='rabbit'&&mv)?Math.abs(Math.sin(p.ph*.7))*.2:0;
  p.m.position.set(p.x,p.y+hop,p.z);p.m.rotation.y=p.ry})}
function feedPets(k){const o=inv[k];if(!o||o.n<1)return;if(!pets.length){toast('No tienes mascotas');return}
 const near=pets.filter(p=>!inCar&&!riding&&Math.hypot(p.x-pl.x,p.z-pl.z)<10);if(!near.length){toast('Tus mascotas no están cerca');return}
 near.sort((a,b)=>a.hunger-b.hunger);const p=near[0];if(p.hunger>=95){toast(p.name+' no tiene hambre');return}
 o.n--;p.hunger=Math.min(100,p.hunger+45);p.hap=Math.min(100,p.hap+5);toast(PET_T[p.t].e+' '+p.name+' ha comido (hambre '+Math.round(p.hunger)+'%)')}
const PET_A={dog:{hy:1.05,hz:.5,hw:.32,ey:.95,ez:.68,cy:.76,cz:.4,nz:.3,nw:.38,by:.58,bw:.38,bh:.38,bl:.85},
 cat:{hy:.65,hz:.33,hw:.22,ey:.58,ez:.44,cy:.5,cz:.3,nz:.22,nw:.26,by:.4,bw:.26,bh:.26,bl:.55},
 rabbit:{hy:.49,hz:.25,hw:.2,ey:.43,ez:.36,cy:.33,cz:.2,nz:.13,nw:.28,by:.28,bw:.28,bh:.26,bl:.42}},
 PET_SLOT={head:'cabeza',face:'cara',neck:'cuello',body:'cuerpo'};
const pcB=(g,w,h,d,x,y,z,col,rx)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col));m.position.set(x,y,z);if(rx)m.rotation.x=rx;g.add(m);return m},
 pcC=(g,r0,r1,h,x,y,z,col)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,12),mat(col));m.position.set(x,y,z);g.add(m);return m},
 pcS=(g,r,x,y,z,col)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),mat(col));m.position.set(x,y,z);g.add(m);return m},
 pcJersey=col=>(g,A)=>{pcB(g,A.bw+.04,A.bh+.04,A.bl*.62,0,A.by,A.bl*.1,col)};
const PET_CLOTH={
 'Gorra':{slot:'head',price:12,e:'🧢',mk:(g,A)=>{pcB(g,A.hw+.04,.06,A.hw+.04,0,A.hy+.02,A.hz,0x2b6fd6);pcB(g,A.hw*.8,.02,.1,0,A.hy-.005,A.hz+A.hw/2+.05,0x1f4f9a)}},
 'Sombrero de fiesta':{slot:'head',price:10,e:'🎉',mk:(g,A)=>{pcC(g,0,A.hw*.4,A.hw*1.6,0,A.hy+A.hw*.8,A.hz,0xe84393);pcS(g,.04,0,A.hy+A.hw*1.6,A.hz,0xf1c40f)}},
 'Sombrero de copa':{slot:'head',price:25,e:'🎩',mk:(g,A)=>{pcC(g,A.hw*.75,A.hw*.75,.02,0,A.hy,A.hz,0x111111);pcC(g,A.hw*.42,A.hw*.42,A.hw*.9,0,A.hy+A.hw*.45,A.hz,0x111111);pcC(g,A.hw*.43,A.hw*.43,.05,0,A.hy+.06,A.hz,0xc0392b)}},
 'Gafas de sol':{slot:'face',price:15,e:'🕶️',mk:(g,A)=>{[-1,1].forEach(s=>pcB(g,A.hw*.32,.07,.02,s*A.hw*.22,A.ey,A.ez,0x111111));pcB(g,A.hw*.2,.015,.02,0,A.ey+.01,A.ez,0x111111)}},
 'Pajarita':{slot:'neck',price:8,e:'🎀',mk:(g,A)=>{[-1,1].forEach(s=>pcB(g,.07,.07,.04,s*.05,A.cy-.03,A.cz,0xc0392b));pcB(g,.04,.04,.05,0,A.cy-.03,A.cz,0x7b1e14)}},
 'Bufanda':{slot:'neck',price:14,e:'🧣',mk:(g,A)=>{pcB(g,A.nw+.06,.1,.14,0,A.cy,A.nz,0xd35400);pcB(g,.07,.18,.04,A.nw*.25,A.cy-.12,A.nz+.07,0xd35400)}},
 'Collar con cascabel':{slot:'neck',price:10,e:'🔔',mk:(g,A)=>{pcB(g,A.nw+.03,.04,.1,0,A.cy,A.nz,0xc0392b);pcS(g,.035,0,A.cy-.05,A.nz+.06,0xf1c40f)}},
 'Jersey rojo':{slot:'body',price:20,e:'🧶',mk:pcJersey(0xc0392b)},
 'Jersey azul':{slot:'body',price:20,e:'🧶',mk:pcJersey(0x2980b9)},
 'Capa de superhéroe':{slot:'body',price:28,e:'🦸',mk:(g,A)=>{pcB(g,A.bw+.12,.03,A.bl*.8,0,A.by+A.bh/2-.02,-A.bl*.1,0xc0392b,-.25)}}};
SHOPS.pet.items=[['Comida para mascotas',6]].concat(Object.keys(PET_CLOTH).map(k=>[k,PET_CLOTH[k].price]));
Object.keys(PET_CLOTH).forEach(k=>{ICON[k]=PET_CLOTH[k].e});
function petDress(p){if(p.m.userData.wg)p.m.remove(p.m.userData.wg);const g=new THREE.Group(),A=PET_A[p.t];Object.keys(p.wear||{}).forEach(sl=>{const c=PET_CLOTH[p.wear[sl]];if(c)c.mk(g,A)});p.m.add(g);p.m.userData.wg=g}
function wearPet(k,i){const c=PET_CLOTH[k];if(!c)return;if(!pets.length){toast('No tienes mascotas');return}
 let p;if(i!==undefined)p=pets[i];else{if(inCar||riding){toast('Baja del vehículo para vestir a tu mascota');return}const near=pets.filter(q=>Math.hypot(q.x-pl.x,q.z-pl.z)<10).sort((a,b)=>Math.hypot(a.x-pl.x,a.z-pl.z)-Math.hypot(b.x-pl.x,b.z-pl.z));if(!near.length){toast('Tus mascotas no están cerca');return}p=near[0]}
 if(!p)return;p.wear=p.wear||{};if(p.wear[c.slot]===k){delete p.wear[c.slot];toast(p.name+' ya no lleva: '+k)}else{p.wear[c.slot]=k;toast(PET_T[p.t].e+' '+p.name+' lleva: '+k)}
 petDress(p);if(i!==undefined&&petW&&dlgOpen&&dlg.style.display==='block')talk(petW)}
function petShopHtml(){const S=SHOPS.pet;let h=petAdoptHtml();
 h+='<h3>🍖 Comida</h3>'+row('Comida para mascotas',6,"buy('pet',0)",ICON['Comida para mascotas']);
 h+='<h3>👗 Ropa para mascotas</h3>';S.items.forEach((it,i)=>{const c=PET_CLOTH[it[0]];if(c)h+=row(it[0]+' <small>('+PET_SLOT[c.slot]+')</small>',it[1],"buy('pet',"+i+")",c.e)});
 if(pets.length){h+='<h3>Tus mascotas</h3>';pets.forEach((p,i)=>{const T=PET_T[p.t],own=Object.keys(PET_CLOTH).filter(k=>inv[k]&&inv[k].n>0);
  h+='<div style="margin:6px 0"><b>'+T.e+' '+p.name+'</b>'+(own.length?'<div>'+own.map(k=>'<button onclick="wearPet(\''+k+'\','+i+')" style="margin-right:4px">'+((p.wear||{})[PET_CLOTH[k].slot]===k?'✔ ':'')+k+'</button>').join('')+'</div>':'<div><small>Compra ropa para poder vestirla.</small></div>')+'</div>'})}
 return h}
let petPanelOn=false;const petPanel=document.createElement('div');petPanel.id='petpanel';petPanel.style.cssText='display:none;top:226px;left:14px;width:240px;padding:8px 10px;border:2px solid #fff;border-radius:8px;background:rgba(0,0,0,.6);font-size:13px;box-sizing:border-box;line-height:1.5;z-index:6';$('hud').appendChild(petPanel);
function petPanelUpd(){if(!petPanelOn){petPanel.style.display='none';return}petPanel.style.display='block';
 if(!pets.length){petPanel.innerHTML='<b>🐾 Mascotas</b><br>No tienes ninguna. Adopta una en la tienda de mascotas.';return}
 petPanel.innerHTML='<b>🐾 Mascotas</b>'+pets.map(p=>{const T=PET_T[p.t],hp=Math.round(p.hunger),w=Object.keys(p.wear||{}).map(k=>p.wear[k]);
  return '<br>'+T.e+' <b>'+p.name+'</b> <small>('+T.n+')</small><br>Hambre: '+hp+'%<br><span style="display:block;height:7px;border-radius:4px;background:linear-gradient(90deg,'+(hp<25?'#d33':'#2a9d4a')+' '+hp+'%,rgba(255,255,255,.2) '+hp+'%)"></span>Ropa: '+(w.length?w.join(', '):'ninguna')}).join('<br>')}
setInterval(petPanelUpd,250);
addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat&&started&&playing()){petPanelOn=!petPanelOn;petPanelUpd()}});
function petInfoHtml(){if(!pets.length)return'';return'<h3>🐾 Mascotas</h3>'+pets.map(p=>'<div>'+PET_T[p.t].e+' <b>'+p.name+'</b> ('+PET_T[p.t].n+') · hambre '+Math.round(p.hunger)+'%'+(Object.keys(p.wear||{}).length?' · lleva: '+Object.keys(p.wear).map(k=>p.wear[k]).join(', '):'')+'</div>').join('')+'<div style="font-size:12px;opacity:.8">Compra «Comida para mascotas» en el supermercado y úsala cerca de ellas.</div>'}
function petAdoptHtml(){let h='<h3>🐾 Adopción</h3><p style="margin:4px 0">Adopta una mascota (máximo '+PET_MAX+'). Te seguirá por la ciudad; dale de comer con comida del supermercado.</p>';
 if(pets.length<PET_MAX){h+='<div class="r"><span>Nombre</span><input id="petName" maxlength="14" placeholder="(opcional)" style="width:140px;padding:6px;font-size:15px;border-radius:6px;border:0"></div>';
  Object.keys(PET_T).forEach(t=>{const T=PET_T[t];h+='<div class="r"><i class="ic">'+T.e+'</i><span>'+T.n+'</span><b>€'+T.price+'</b><button onclick="adoptPet(\''+t+'\')">Adoptar</button></div>'})}
 else h+='<p>Ya tienes el máximo de mascotas.</p>';return h}
function adoptPet(t){const T=PET_T[t];if(!T)return;if(pets.length>=PET_MAX){toast('Ya tienes '+PET_MAX+' mascotas (máximo)');return}
 const inp=document.getElementById('petName');let nm=petClean(inp?inp.value:'');if(!nm)nm=PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)];
 if(!pay(T.price))return;addPet(t,nm,T.col[Math.floor(Math.random()*T.col.length)],80,70);toast(T.e+' ¡Has adoptado a '+nm+'!');if(petW)talk(petW)}

// =================================================================================================
// 27. RANGOS SOCIALES Y GOBIERNO
//     Rango social del jugador y gobierno municipal.
// =================================================================================================

// ---------- 27.1 Rangos sociales ----------
// Escala: Ciudadano → Funcionario → Propietario → Empresario 1-2-3 → Gran empresario → Regidor → Vicealcalde → (Alcalde: pendiente, lo dará el servidor)
// El rango es el MÁS ALTO conseguido (no baja si vendes un local). Se guarda en flags (rk, rkGran, rkReg).
const RANKS=[{n:'Ciudadano',e:'🧑'},{n:'Funcionario',e:'🪪'},{n:'Propietario',e:'🏪'},{n:'Empresario rango 1',e:'💼'},{n:'Empresario rango 2',e:'💼'},{n:'Empresario rango 3',e:'💼'},{n:'Gran empresario',e:'🏆'},{n:'Regidor',e:'🏛️'},{n:'Vicealcalde',e:'🎖️'},{n:'Alcalde',e:'👑'}];
const RANK_GRAN_MIN=5; // «más de 4» negocios al nivel 5
function rankStats(){const b=HOUSES.filter(h=>h.owned&&h.local&&h.ty);return{nb:b.length,n5:b.filter(h=>(h.lv||1)>=5).length}}
function rankSk(v){return skills.social>=v&&skills.comm>=v&&skills.gest>=v}
function rankName(i){const r=RANKS[Math.max(0,Math.min(RANKS.length-1,i|0))];return r.e+' '+r.n}
function rankCalc(){
 const s=rankStats();let r=0;
 if(flags.worked||Object.keys(jx).length)r=1;
 if(s.nb>=1)r=2;if(s.nb>=2)r=3;if(s.nb>=3)r=4;if(s.nb>=4)r=5;
 if(s.n5>=RANK_GRAN_MIN){r=6;flags.rkGran=1}
 r=Math.max(r,Math.min(8,flags.rk||0));
 if(r>=6&&flags.rkGran&&rankSk(20)&&uniS().done.includes('gder')){r=Math.max(r,7);flags.rkReg=1}
 if(flags.rkReg&&rankSk(40))r=Math.max(r,8);
 return r}
function rankNext(r){const s=rankStats();
 return [ 'Consigue tu primer trabajo: reponedor, repartidor o taxista.',
  'Compra un local y monta tu primer negocio.',
  'Ten 2 negocios activos (ahora: '+s.nb+').',
  'Ten 3 negocios activos (ahora: '+s.nb+').',
  'Ten 4 o más negocios activos (ahora: '+s.nb+').',
  'Mejora más de 4 negocios al nivel 5 (ahora: '+s.n5+'/'+RANK_GRAN_MIN+').',
  'Habilidades Sociales, Comunicación y Gestión y Estrategia a 20 pts + Grado en Derecho y Ciencias Políticas.',
  'Habilidades Sociales, Comunicación y Gestión y Estrategia a 40 pts.',
  'Gana las elecciones municipales (se abren solas con 2 o más Vicealcaldes y sin Alcalde: tecla V).',
  'Rango máximo.'][Math.max(0,Math.min(9,r))]}
function rankHtml(){const r=myRank();return '<h3>🏅 Rango social</h3><div class="r"><span style="font-size:18px"><b>'+rankName(r)+'</b></span></div><div style="font-size:13px;opacity:.85;margin:2px 0 8px">'+(r<9?'Siguiente: ':'')+rankNext(r)+'</div>'}
const rkHud=document.createElement('div');rkHud.id='rkhud';rkHud.style.cssText='top:72px;left:14px;font-size:14px;font-weight:700;color:#f4d58a';document.getElementById('hud').appendChild(rkHud);
let rkLast=0;
function rankUpdate(){if(!started)return;const t=performance.now();if(t-rkLast<1000)return;rkLast=t;
 const first=flags.rk===undefined,old=flags.rk||0,nw=rankCalc();
 if(first||nw!==old){flags.rk=nw;if(!first&&nw>old){setTimeout(()=>toast('🏅 ¡Nuevo rango social: '+rankName(nw)+'!'),700);saveGame()}}
 const txt=rankName(myRank());if(rkHud.textContent!==txt)rkHud.textContent=txt}

// ---------- 27.2 Gobierno municipal: elecciones (V), despacho del Alcalde (E), impuestos y bans ----------
function getUid(){try{let u=localStorage.getItem('rls_uid');if(!u){u=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():(String(Math.random()).slice(2)+Date.now());localStorage.setItem('rls_uid',u)}return u}catch(e){return 'tmp'+Math.random().toString(36).slice(2)}}
var GOV={mayor:null,taxes:[],rate:0,cap:0,day:0,election:null,me:{},off:0};
function myRank(){return GOV.me&&GOV.me.mayor?9:Math.min(8,flags.rk||0)}
function govSend(o){if(MP.ws&&MP.ws.readyState===1){MP.ws.send(JSON.stringify(o));return true}return false}
function fmtCd(ms){ms=Math.max(0,Math.floor(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms/60)%60,s=ms%60;return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
const elHud=document.createElement('div');elHud.style.cssText='bottom:86px;left:14px;font-size:15px;font-weight:800;color:#ffe08a;display:none';
const govHud=document.createElement('div');govHud.style.cssText='bottom:62px;left:14px;font-size:14px;font-weight:700;color:#cfe3ff';
const decreeEl=document.createElement('div');decreeEl.style.cssText='position:fixed;top:12%;left:50%;transform:translateX(-50%);z-index:30;max-width:70vw;padding:14px 22px;border:3px solid #f4d58a;border-radius:12px;background:rgba(40,28,0,.94);color:#fff;font:700 20px system-ui;text-align:center;display:none;pointer-events:none;box-shadow:0 6px 30px rgba(0,0,0,.6)';
document.getElementById('hud').append(elHud,govHud);document.body.appendChild(decreeEl);
function decreeShow(m){if(!m||typeof m.text!=='string')return;decreeEl.innerHTML='<div style="font-size:13px;color:#f4d58a;letter-spacing:1px">'+pcEsc(String(m.from||'Ayuntamiento').slice(0,30)).toUpperCase()+'</div>'+pcEsc(m.text.slice(0,200));decreeEl.style.display='block';clearTimeout(decreeShow.t);decreeShow.t=setTimeout(()=>decreeEl.style.display='none',12000)}
function govHudUpd(){const E=GOV.election;if(E){elHud.style.display='block';elHud.textContent='🗳️ ELECCIONES · V: votar · '+fmtCd(E.endsAt-(Date.now()+GOV.off))}else elHud.style.display='none';
 govHud.textContent=GOV.mayor?'🏛️ Alcalde: '+GOV.mayor.name+' · Impuestos '+GOV.rate+'%':'🏛️ Sin Alcalde · Impuestos 0%';
 const t=document.getElementById('elTime');if(t&&E)t.textContent=fmtCd(E.endsAt-(Date.now()+GOV.off))}
setInterval(govHudUpd,1000);govHudUpd();
function govApply(m){GOV=Object.assign({off:(m.now||Date.now())-Date.now(),me:{}},m);GOV.me=GOV.me||{};rkLast=0;govHudUpd();
 const a=document.activeElement,typing=a&&dlg.contains(a)&&/INPUT|TEXTAREA/.test(a.tagName);
 if(!typing&&dlgOpen){if(document.getElementById('elRoot'))elRender();else if(document.getElementById('moRoot')){if(GOV.me.mayor)moRender();else closeDlg()}}}
// --- impuestos: se retienen en cada cobro (caja del negocio y sueldos) ---
function taxNet(c){const r=Number(GOV.rate)||0;if(!(r>0)||!(c>0))return c;const t=Math.min(c,Math.round(c*r/100));if(t<=0)return c;govSend({type:'tax_paid',amount:t});setTimeout(()=>toast('🏛️ Impuestos: −€'+t+' ('+r+'%)'),1500);return c-t}
// --- elecciones (tecla V) ---
function elOpen(){openDlg();elRender()}
function elRender(){const E=GOV.election,me=GOV.me||{};let h='<div id="elRoot"><h2>🗳️ Elecciones a la Alcaldía</h2>';
 if(!E){h+='<p>No hay elecciones abiertas.</p><p style="font-size:13px;opacity:.8">Se abren solas cuando hay 2 o más Vicealcaldes conectados y no hay Alcalde.</p>'+(GOV.mayor?'<p>Alcalde actual: <b>'+pcEsc(GOV.mayor.name)+'</b></p>':'')}
 else{h+='<p>Tiempo restante: <b id="elTime">'+fmtCd(E.endsAt-(Date.now()+GOV.off))+'</b> · Tienes 1 solo voto, inalterable.</p>';
  E.candidates.forEach(c=>{const mine=me.cid===c.cid;h+='<div style="margin:8px 0;padding:8px;background:rgba(255,255,255,.07);border-radius:8px"><div><b>'+pcEsc(c.name)+'</b>'+(mine?' (tú)':'')+'</div>'+
   (mine?'<textarea id="elProg" maxlength="200" rows="3" style="width:100%;box-sizing:border-box;margin-top:4px;padding:6px;border-radius:6px;border:0" placeholder="Escribe tu lema o tus promesas...">'+pcEsc(c.program)+'</textarea><br><button onclick="elSaveProg()">Guardar programa</button> ':
   '<div style="font-size:14px;opacity:.9;margin:4px 0">'+(c.program?'«'+pcEsc(c.program)+'»':'<i>Sin programa electoral</i>')+'</div>')+
   (me.voted?(me.voted===c.cid?'<b style="color:#80e6a0">✅ Tu voto</b>':''):'<button onclick="elVote(\''+c.cid+'\')">Votar</button>')+'</div>'});
  if(me.voted)h+='<p style="font-size:13px">Ya has votado. El resultado se anunciará en el chat (P) cuando el contador llegue a 00:00.</p>'}
 dlg.innerHTML=h+'<div><button onclick="closeDlg()">Cerrar</button></div></div>'}
function elVote(cid){const c=(GOV.election&&GOV.election.candidates||[]).find(x=>x.cid===cid);if(!c)return;if(!confirm('¿Votar a '+c.name+'? No podrás cambiar tu voto.'))return;if(!govSend({type:'election_vote',cid}))toast('Sin conexión con el servidor')}
function elSaveProg(){const t=document.getElementById('elProg');if(t&&!govSend({type:'election_program',text:t.value}))toast('Sin conexión con el servidor')}
// --- despacho del Alcalde (E junto a su mesa en el Ayuntamiento) ---
var moAddOpen=false;
function mayorOffice(){if(!(GOV.me&&GOV.me.mayor)){toast('🔒 Este despacho es solo para el Alcalde');return}openDlg();moRender()}
function moRender(){const G=GOV;let h='<div id="moRoot"><h2>🏛️ Despacho del Alcalde</h2><p style="font-size:14px;margin:2px 0">Día '+G.day+' de mandato · Caja municipal: <b>€'+(G.me.treasury||0)+'</b></p>'+
 '<h3>💶 Impuestos</h3><p style="font-size:13px;opacity:.85;margin:2px 0">Total aplicado: <b>'+G.rate+'%</b> · límite de hoy: <b>'+G.cap+'%</b> (+0,1% cada día, máximo 2,0%)</p>';
 if(!G.taxes.length)h+='<p><i>Sin impuestos: los jugadores cobran el 100%.</i></p>';
 G.taxes.forEach(t=>{h+='<div style="margin:6px 0;padding:6px;background:rgba(255,255,255,.07);border-radius:8px"><div style="font-size:14px">'+pcEsc(t.reason)+'</div><input type="number" id="tx'+t.id+'" value="'+t.pct+'" min="0.1" max="'+G.cap+'" step="0.1" style="width:80px;padding:4px"> % <button onclick="moTaxSave(\''+t.id+'\')">Guardar</button> <button onclick="moTaxDel(\''+t.id+'\')" style="background:#b33">Quitar</button></div>'});
 if(moAddOpen)h+='<div style="margin:6px 0;padding:8px;background:rgba(255,255,255,.07);border-radius:8px"><div style="font-size:13px">Motivo del impuesto (obligatorio)</div><input id="moReason" maxlength="100" placeholder="Ej: Mantenimiento de rutas de transporte público y aeródromo" style="width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:0"><div style="margin-top:6px;font-size:13px">Porcentaje retenido en cada cobro</div><input type="number" id="moPct" value="0.1" min="0.1" max="'+G.cap+'" step="0.1" style="width:80px;padding:4px"> % <button onclick="moTaxAdd()">Aplicar impuesto</button></div>';
 h+='<button onclick="moToggleAdd()">➕ Añadir impuesto</button>'+
 '<h3>📜 Ban municipal</h3><p style="font-size:13px;opacity:.85;margin:2px 0">Se muestra en pantalla a todos los jugadores.</p><textarea id="moBan" maxlength="170" rows="2" style="width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:0" placeholder="Escribe tu decreto..."></textarea><br><button onclick="moBan()">Publicar ban</button>'+
 '<p style="font-size:13px;opacity:.85">👑 Tus mensajes del chat (P) salen con la etiqueta ALCALDE.</p><div><button onclick="closeDlg()">Cerrar</button></div></div>';dlg.innerHTML=h}
function moToggleAdd(){moAddOpen=!moAddOpen;moRender()}
function moTaxAdd(){const r=document.getElementById('moReason'),p=document.getElementById('moPct');if(!r||!p)return;if(r.value.trim().length<3){toast('Debes escribir el motivo del impuesto');return}if(govSend({type:'tax_set',reason:r.value,pct:Number(p.value)}))moAddOpen=false}
function moTaxSave(id){const t=GOV.taxes.find(x=>x.id===id),i=document.getElementById('tx'+id);if(t&&i)govSend({type:'tax_set',id,reason:t.reason,pct:Number(i.value)})}
function moTaxDel(id){govSend({type:'tax_del',id})}
function moBan(){const t=document.getElementById('moBan');if(t&&t.value.trim()){if(govSend({type:'decree',text:t.value}))t.value=''}}

// =================================================================================================
// 28. PROPIEDADES DE OTROS JUGADORES
//     Negocios y casas de los demás jugadores, sincronizados con el servidor.
// =================================================================================================

// ---------- 28.1 Negocios de otros jugadores: se ven en el mundo y se les puede comprar (L junto a su puerta) ----------
var bizSynced=false,bizSig='';
const BIZ_CAT={super:'Comida',bar:'Comida',pan:'Comida',ropa:'Ropa',muebles:'Muebles'};
function bizSyncSend(force){if(!bizSynced||!MP.connected)return;
 const ent=(h,x,z,tid)=>{const e={x,z,ty:h.ty,lv:h.lv||1,till:Math.round(h.till||0),items:PRODS[h.ty].map(q=>({k:q[0],p:Math.max(1,Math.round(q[2])),n:Math.max(0,Math.floor((h.stock||{})[q[0]]||0)),e:q[3]}))};if(tid!=null)e.tid=tid;return e},
  tb=TERRENOS.filter(t=>t.owned&&t.biz&&t.biz.ty&&PRODS[t.biz.ty]), // negocios montados en tus terrenos (13.5)
  list=HOUSES.filter(h=>h.owned&&h.local&&h.ty&&PRODS[h.ty]).map(h=>ent(h,h.x,h.z)).concat(tb.map(t=>ent(t.biz,t.x,t.z,t.id))),
  owned=HOUSES.filter(h=>h.owned&&h.local).map(h=>({x:h.x,z:h.z})).concat(tb.map(t=>({x:t.x,z:t.z}))),
  sig=JSON.stringify([list.map(e=>Object.assign({},e,{till:Math.floor(e.till/25)})),owned]);
 if(!force&&sig===bizSig)return;bizSig=sig;govSend({type:'biz_sync',list,owned})}
setInterval(()=>bizSyncSend(false),3000);
function bizSaleApply(s){let h=xfFind(s.x,s.z,true);if(h&&!h.owned)h=null;if(!h){const t=terrAt(s.x,s.z);h=t&&t.owned&&t.biz&&t.biz.ty?t.biz:null}if(!h)return 0;h.stock=h.stock||{};h.stock[s.k]=Math.max(0,(h.stock[s.k]||0)-s.n);h.till=(h.till||0)+s.total;return s.total}
function bizOnPending(m){const sales=Array.isArray(m.sales)?m.sales:[];let tot=0;sales.forEach(s=>{tot+=bizSaleApply(s)});
 if(sales.length){saveGame();setTimeout(()=>toast('💰 Mientras no estabas vendiste €'+tot+' en tus negocios (están en la caja)'),1500)}
 govSend({type:'biz_ack',n:sales.length});bizSynced=true;bizSig='';bizSyncSend(true)}
function bizOnSold(m){const t=bizSaleApply(m);if(t){toast('💰 '+m.buyer+' ha comprado '+m.n+'× '+m.k+' en tu local (+€'+t+' en caja)');sfx.cash()}}
function bizOnBought(m){const cat=BIZ_CAT[m.ty]||'Comida';money=Math.max(0,money-m.total);const o=inv[m.k]||(inv[m.k]={n:0,cat,act:xfAct(cat)});o.n+=m.n;sfx.cash();toast('Comprado: '+m.k+' ×'+m.n+' (−€'+m.total+')');if(invOpen)renderInv();saveGame()}
function bizApply(m){const seen=new Set();
 const tseen=new Set();
 (m.list||[]).forEach(e=>{const h=xfFind(e.x,e.z,true);if(!h){const t=terrAt(e.x,e.z);if(t){if(e.own||t.owned)t.bremote=null;else if(e.ty){tseen.add(t.id);t.bremote={name:e.owner,ty:e.ty,lv:e.lv||0,items:e.items||[],on:!!e.on}}}return}if(e.own||h.owned){h.remote=null;return}
  seen.add(h.id);h.remote={name:e.owner,ty:e.ty||'',lv:e.lv||0,items:e.items||[],occ:!!e.occ,on:!!e.on};const sig=(e.ty||'')+':'+(e.lv||0);
  if(h.rsig!==sig){h.rsig=sig;h.ty=e.ty||'';h.lv=e.lv||0;try{localIn(h,e.ty||'')}catch(_){}}
  const rc=e.occ?2:1;if(h.rcol!==rc){h.rcol=rc;setHouseColor(h,e.occ?0x95a5a6:0x16a085)}});
 HOUSES.forEach(h=>{if(h.local&&h.remote&&!seen.has(h.id)){h.remote=null;h.rsig='';h.rcol=0;if(!h.owned){h.ty='';h.lv=0;try{localIn(h,'')}catch(_){}if(h.om)h.door.leaf.material=h.om}}});
 TERRENOS.forEach(t=>{if(t.bremote&&!tseen.has(t.id))t.bremote=null});
 const r=document.getElementById('bsRoot');if(r&&dlgOpen){const h=BSH(+r.dataset.k);if(h)bsRender(h)}}

// comprar en la tienda de otro jugador
function BSH(id){if(id>=100000){const t=TERRENOS.find(q=>q.id===id-100000);return t?{id,x:t.x,z:t.z,remote:t.bremote||null}:null}return HOUSES[id]}
function bsOpen(id){openDlg();bsRender(BSH(id))}
function bsRender(h){const e=h&&h.remote;if(!e){dlg.innerHTML='<h2>🏪 Local</h2><p>Este negocio ya no está disponible.</p><div><button onclick="closeDlg()">Cerrar</button></div>';return}
 if(e.occ){dlg.innerHTML='<h2>🏪 Local ocupado</h2><p>Este local es de <b>'+pcEsc(e.name)+'</b>'+(e.on?'':' (ahora desconectado)')+' y todavía no tiene ningún negocio abierto.</p><div><button onclick="closeDlg()">Cerrar</button></div>';return}
 const T=LTYPES[e.ty]||{i:'🏪',n:'NEGOCIO'};let t='<div id="bsRoot" data-k="'+h.id+'"><h2>'+T.i+' '+pcEsc(T.n[0]+T.n.slice(1).toLowerCase())+'</h2><p style="margin:2px 0">Negocio de <b>'+pcEsc(e.name)+'</b> · '+BIZN[e.lv||1]+'</p><p style="margin:2px 0 8px">Tu dinero: <b>€'+Math.round(money)+'</b></p>';
 (e.items||[]).forEach((q,i)=>{t+='<div class="r"><i class="ic">'+pcEsc(q.e||'🛒')+'</i><span>'+pcEsc(q.k)+'<br><small>En tienda: '+q.n+' · €'+q.p+'</small></span>'+(q.n>0?'<button onclick="bsBuy('+h.id+','+i+',1)">Comprar 1</button><button onclick="bsBuy('+h.id+','+i+',5)">×5</button>':'<b>Agotado</b>')+'</div>'});
 dlg.innerHTML=t+'<div><button onclick="closeDlg()" style="background:#666">Salir</button></div></div>'}
function bsBuy(id,i,n){const h=BSH(id),q=h&&h.remote&&h.remote.items[i];if(!q)return;n=Math.min(n,q.n);if(n<1){toast('Agotado');return}if(money<q.p*n){toast('No tienes suficiente dinero');return}if(!govSend({type:'biz_buy',x:h.x,z:h.z,k:q.k,n}))toast('Sin conexión con el servidor')}

// ---------- 28.2 Casas en terrenos: se sincronizan con el servidor y las ven todos los jugadores ----------
// El dueño publica su construcción (house_set, cada vez que cambia) y el servidor la reparte. Los terrenos de otros se dibujan con el mismo código que los tuyos (t.rem = su dueño, sin editarlos).
// Las puertas se abren y se cierran solo en tu pantalla (no se sincroniza su estado).
var houseSynced=false,houseOwnSig='',houseSent={},houseLast=0,housePend=null,houseSeen=new Set();
const houseOnline=()=>!!(MP.connected&&MP.ws&&MP.ws.readyState===1&&MP.id&&MP.feat&&MP.feat.houses);
function houseSyncSend(force){if(!houseSynced||!houseOnline())return;
 if(force){houseSent={};houseOwnSig=''}
 const ids=TERRENOS.filter(t=>t.owned).map(t=>t.id),os=ids.join(',');
 if(os!==houseOwnSig){houseOwnSig=os;govSend({type:'house_own',ids})}
 const now=performance.now();if(now-houseLast<1200)return;
 for(const t of TERRENOS){if(!t.owned)continue;const b=bmSer(t),sig=b?JSON.stringify(b):'';if(houseSent[t.id]===sig)continue;houseSent[t.id]=sig;if(sig.length>60000)continue;houseLast=now;govSend({type:'house_set',id:t.id,b});break} // una construcción por vez
}
setInterval(()=>houseSyncSend(false),1500);
function terrenoBought(t){t.setOwned(true);toast('¡Terreno nº '+t.id+' comprado! Ahora se ve en verde.');estateRefresh();houseSyncSend(false)}
function houseClear(t){t.rem=null;t._rsig='';if(!t.owned){t.b=null;bmRebuild(t)}}
function houseApply(m){const t=TERRENOS.find(q=>q.id===m.id);if(!t)return;houseSeen.add(t.id);
 if(m.own||t.owned){if(!t.owned&&t.rem)houseClear(t);return}
 const fresh=!t.rem;t.rem={name:String(m.owner||'Jugador').slice(0,18)};
 const sig=m.b?JSON.stringify(m.b):'';if(t._rsig!==sig){t._rsig=sig;t.b=null;if(m.b)bmDes(t,m.b);else bmRebuild(t)}
 if(fresh)estateRefresh()}
function houseOnFree(m){const t=TERRENOS.find(q=>q.id===m.id);if(t&&t.rem){houseClear(t);estateRefresh()}}
function houseOnReady(){TERRENOS.forEach(t=>{if(t.rem&&!houseSeen.has(t.id))houseClear(t)}); // terrenos que quedaron libres mientras no estabas conectado
 houseSeen.clear();houseSynced=true;houseSyncSend(true)}
function houseOnClaimOk(m){const t=TERRENOS.find(q=>q.id===m.id);if(!t||!housePend||housePend.id!==m.id)return;housePend=null;if(t.owned)return;
 if(!pay(t.price)){govSend({type:'house_release',id:t.id});return}terrenoBought(t)}
function houseOnClaimDeny(m){housePend=null;toast('🟥 OCUPADO · el terreno nº '+m.id+' ya es de '+String(m.owner||'otro jugador').slice(0,30));estateRefresh()}
// valor de lo construido (para devolverlo si otro jugador ya tenía registrado ese terreno)
function bmValue(t){const b=t.b;if(!b)return 0;let v=b.f.size*BCOST.floor+b.r.size*BCOST.roof+b.s.size*BCOST.stair+b.o.size*BCOST.yard;
 for(const[k,ty]of b.e)v+=ty<=4?BCOST[ETOOL[ty]]:ty===5?BCOST.garage:0;for(const[k,ty]of b.e2)v+=BCOST[ETOOL[ty]];for(const k of b.r2)v+=bmRC(b,k);if(b.U)for(const[n,Lu]of b.U){for(const ty of Lu.e.values())v+=BCOST[ETOOL[ty]]||0;for(const k of Lu.r)v+=bmRCn(Lu,k)}return v}
function houseOnConflict(m){const t=TERRENOS.find(q=>q.id===m.id);if(!t||!t.owned)return;
 const back=Math.round(t.price+bmValue(t)+(t.biz&&t.biz.ty?TBIZ_FEE+(t.biz.till||0):0));if(BM.on&&BM.t===t)bmExit();if(dlgOpen)closeDlg();
 bmFReturn(t);t.setOwned(false);t.b=null;t.biz=null;bmRebuild(t);houseSent[t.id]=undefined;money+=back;sfx.cash();estateRefresh();saveGame();
 toast('⚠️ El terreno nº '+t.id+' ya estaba registrado a nombre de '+String(m.owner||'otro jugador').slice(0,18)+'. Se te devuelven €'+back)}
