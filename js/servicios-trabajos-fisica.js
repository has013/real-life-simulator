/* ===============================================================================================
   FICHA · servicios-trabajos-fisica.js
   Qué hay:          Gasolina (16.3), habitaciones del hotel (16.4), ascensores (16.5), trabajos (17), controles de teclado y ratón (18) y física del jugador (19), conducción del coche del jugador (driveCar) y tráfico de IA (aiStep en ciudad, hwStep en la autopista).
   Tócalo si quieres: cambiar la gasolina, añadir o cambiar un trabajo, cambiar teclas, cambiar cómo se mueve el jugador
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// ---------- 16.3 Gasolina ----------
const fz={c:null,t:null,paid:0,lit:0,goal:0},pumpNear=(x,z,r)=>PUMPS.some(p=>Math.hypot(p.x-x,p.z-z)<r);
function openFuel(c){fz.c=c;fz.paid=fz.lit=0;c.v=0;openDlg();
 dlg.innerHTML='<h2>⛽ Surtidor</h2><p>'+c.spec.name+': <b id="fl"></b></p><div style="height:14px;border-radius:7px;background:#333;overflow:hidden;margin:4px 0 8px"><div id="fb" style="height:100%"></div></div><p>Precio: <b>€'+PRICE+'/L</b> · Pagado: <b id="fc"></b></p><div><button onclick="fuelPump(999)">Llenar</button> <button onclick="fuelPump(10)">+10 L</button> <button onclick="fuelStop()">Parar</button> <button onclick="closeFuel()" style="background:#666">Terminar</button></div>';fuelUpd()}
function fuelUpd(){const c=fz.c;if(!c)return;const p=Math.round(c.fuel/c.spec.tank*100);$('fl').textContent=c.fuel.toFixed(1)+' / '+c.spec.tank+' L';$('fb').style.width=p+'%';$('fb').style.background=p<15?'#d33':'#2a9d4a';$('fc').textContent='€'+fz.paid}
function fuelStop(){clearInterval(fz.t);fz.t=null}
function fuelPump(L){const c=fz.c;if(!c||fz.t)return;const sp=c.spec.tank-c.fuel;if(sp<.05){toast('El depósito ya está lleno');return}fz.goal=c.fuel+Math.min(L,sp);
 fz.t=setInterval(()=>{const add=Math.min(.6,fz.goal-c.fuel),cost=Math.ceil((fz.lit+add)*PRICE-1e-9)-fz.paid;
  if(money<cost){fuelStop();toast('No tienes suficiente dinero');return}
  money-=cost;fz.paid+=cost;fz.lit+=add;c.fuel+=add;if(c.fuel>=fz.goal-1e-6){c.fuel=fz.goal;fuelStop()}fuelUpd()},100)}
function closeFuel(){fuelStop();fz.c=null;closeDlg()}
function refuelKey(){const c=inCar;if(!pumpNear(c.x,c.z,6.5)){toast('Acércate a un surtidor de una gasolinera');return}if(Math.abs(c.v)>3){toast('Para el coche para repostar');return}openFuel(c)}
IDEF.pump={txt:()=>'E: repostar un coche',act:o=>{let b=null,bd=7;cars.forEach(c=>{if(c.mode==='ai')return;const d=Math.hypot(c.x-o.x,c.z-o.z);if(d<bd){bd=d;b=c}});b?openFuel(b):toast('Aparca un coche junto al surtidor')}};
function useJerry(k){let c=inCar,bd=7;if(!c)cars.forEach(q=>{if(q.mode==='ai')return;const d=Math.hypot(q.x-pl.x,q.z-pl.z);if(d<bd){bd=d;c=q}});
 if(!c){toast('Acércate a un coche con el bidón');return}if(c.spec.tank-c.fuel<1){toast('El depósito ya está lleno');return}
 const a=Math.min(8,c.spec.tank-c.fuel);c.fuel+=a;inv[k].n--;toast('Echas '+a.toFixed(1)+' L al '+c.spec.name)}

// ---------- 16.4 Habitaciones del hotel ----------
IDEF.hbed={txt:()=>flags.room?'E: dormir en tu habitación':'E: cama (alquila una habitación en recepción)',act:()=>{if(!flags.room){toast('Alquila una habitación en recepción (100 €)');return}sleepNight('Duermes en la habitación...',15,'Has descansado en tu habitación',{room:true})}};
function hotelRent(){if(flags.room){toast('Ya tienes una habitación');return}if(!pay(100))return;flags.room=1;closeDlg();toast('Habitación alquilada: sube en el ascensor del fondo y usa una cama')}

// ---------- 16.5 Ascensores ----------
function elStep(e,dt){const d=e.tg-e.y;
 if(Math.abs(d)>.01){if(!e.mv){e.mv=1;e.dr.forEach(o=>{o.c.on=true;o.m.visible=true})}e.y+=Math.min(Math.abs(d),3*dt)*Math.sign(d)}
 else{e.y=e.tg;if(e.mv){e.mv=0;const o=e.dr[e.ys.findIndex(v=>Math.abs(v-e.y)<.001)];if(o){o.c.on=false;o.m.visible=false}}}
 e.f.y=e.y;e.cab.position.y=e.y}
function elGo(id,i){ELEV[id].tg=ELEV[id].ys[i];closeDlg();toast('El ascensor se pone en marcha...')}
IDEF.elev={txt:()=>'E: ascensor',act:o=>{const e=ELEV[o.extra.id],m=o.extra.m,ins=pl.x>e.e0&&pl.x<e.e1&&pl.z>e.z0&&pl.z<e.z1;
 if(!ins){if(Math.abs(e.y-e.ys[m])<.05&&!e.mv)toast('El ascensor está aquí: entra');else{e.tg=e.ys[m];toast('Llamas al ascensor...')}return}
 openDlg();dlg.innerHTML='<h2>🛗 Ascensor</h2>'+Array.from({length:e.fl},(_,i)=>'<div><button onclick="elGo('+e.id+','+i+')">'+(i?'Planta '+i:'Planta baja')+'</button></div>').join('')+'<div><button onclick="closeDlg()" style="background:#666">Cerrar</button></div>'}};

// =================================================================================================
// 17. TRABAJOS
//     Rangos, reparto de pedidos, taxi y reponer estanterías (minijuego).
// =================================================================================================
const BASIC=.4,RK=[0,4,10],RM=[1,1.4,1.9],XJ={super:['stock'],food:['deliver'],hotel:['taxi']};
const JN={stock:['Reponedor','Reponedor sénior','Jefe de almacén'],deliver:['Repartidor novato','Repartidor','Jefe de reparto'],taxi:['Taxista','Taxista sénior','Taxista VIP']};
const jx={},pk2=a=>a[Math.random()*a.length|0];let task=null;
const jdone=(k,id)=>jx[k+':'+id]||0,jrank=(k,id)=>RK.reduce((r,t,i)=>jdone(k,id)>=t?i:r,0);
const jname=(k,id)=>id==='shift'?[SHOPS[k].job[0],'Veterano: '+SHOPS[k].job[0],'Encargado: '+SHOPS[k].job[0]][jrank(k,id)]:JN[id][jrank(k,id)];
const jprog=(k,id)=>{const r=jrank(k,id);return r<2?jdone(k,id)+'/'+RK[r+1]+' para el ascenso':'rango máximo'};
function jdoneAdd(k,id){const r0=jrank(k,id);jx[k+':'+id]=jdone(k,id)+1;flags.worked=1;if(jrank(k,id)>r0)setTimeout(()=>toast('🎉 ¡Ascenso! Ahora eres '+jname(k,id)+' (sueldo ×'+RM[jrank(k,id)]+')'),2200)}
function jobMenu(k){const S=SHOPS[k];let h='';
 if(S.job&&k!=='super')h+=`<div><button onclick="work('${k}')">💼 Turno básico: +€${Math.round(S.job[1]*BASIC*RM[jrank(k,'shift')])} (4 s)</button> <small>${jname(k,'shift')} · ${jprog(k,'shift')}</small>${jobReqLine(k,'shift')}</div>`;
 (XJ[k]||[]).forEach(id=>{const lab={stock:'📦 Reponer estanterías (minijuego, 30 s)',deliver:'🛵 Repartir pedidos con tiempo límite',taxi:'🚕 Trabajar de taxista'}[id];h+=`<div><button onclick="startJob('${k}','${id}')">${lab}</button> <small>${jname(k,id)} · ${jprog(k,id)}</small>${jobReqLine(k,id)}</div>`});return h}
function work(k){if(working||task)return;if(!jobCanDo(k,'shift'))return;working=true;const S=SHOPS[k],p=Math.round(S.job[1]*BASIC*RM[jrank(k,'shift')]);toast('Trabajando...');
 setTimeout(()=>{money+=taxNet(p);sfx.cash();working=false;jdoneAdd(k,'shift');toast('Turno terminado: +€'+p)},4000)}
function jobsInv(){const ks=Object.keys(jx);return '<h3>Carrera laboral</h3>'+(ks.map(q=>{const[a,b]=q.split(':');return '<div>'+jname(a,b)+' · '+jdone(a,b)+' tareas · '+jprog(a,b)+'</div>'}).join('')||'<div>aún sin trabajos</div>')}
const jh=document.createElement('div');jh.style.cssText='top:184px;left:14px;font-size:15px;max-width:340px;background:rgba(0,0,0,.35);border-radius:8px;padding:0 8px';$('hud').appendChild(jh);
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,45,14,1,true),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide}));beacon.visible=false;scene.add(beacon);
function endTask(msg,ok){if(task&&task.g)scene.remove(task.g);task=null;beacon.visible=false;jh.textContent='';toast(msg)}
function startJob(k,id){if(task||working){toast('Ya tienes un trabajo en curso (X: cancelar)');return}
 if(!jobCanDo(k,id))return;
 if(id==='stock')return stockStart(k);
 if(id==='deliver'){closeDlg();task={t:'deliver',k,id,n:2+jrank(k,id),i:0,earn:0};delLeg();toast('📦 Pedidos cargados: ¡consigue un vehículo y reparte!')}
 else{closeDlg();task={t:'taxi',k,id,n:3+jrank(k,id),i:0,earn:0};taxiCall();toast('🚕 Turno de taxi: necesitas un coche (no vale la moto)')}}
function delLeg(){const l=HOUSES.filter(h=>{if(h.isl)return false;const d=Math.hypot(h.x-pl.x,h.z-pl.z);return d>60&&d<230}),h=pk2(l.length?l:HOUSES),d=Math.hypot(h.x-pl.x,h.z-pl.z);
 task.x=h.x;task.z=h.z;task.d0=d;task.lim=(task.i?18:32)+d/5.8;task.left=task.lim;task.ic='📦'}
function taxiCall(){let bi,bj,a;do{bi=Math.random()*N|0;bj=Math.random()*N|0}while(bi===PKI&&bj===PKJ);
 for(let t=0;t<25;t++){a=ringPos({x0:bi*P,z0:bj*P,s:1.2},Math.random()*150);const d=Math.hypot(a[0]-pl.x,a[1]-pl.z);if(d>50&&d<200)break;bi=Math.random()*N|0;bj=Math.random()*N|0;if(bi===PKI&&bj===PKJ)bi=0}
 const g=person(pk2([0xc0392b,0x27ae60,0xf1c40f,0x8e44ad,0x2980b9]),{noIdle:1});g.position.set(a[0],G,a[1]);g.rotation.y=Math.random()*6.28;scene.add(g);
 Object.assign(task,{g,ph:'pick',x:a[0],z:a[1],left:40+Math.hypot(a[0]-pl.x,a[1]-pl.z)/4,ic:'🧍',out:0})}
const fmtT=s=>Math.max(0,Math.ceil(s))+' s';
function jobStep(dt){if(!task)return;const c=inCar,sp=c?Math.abs(c.v):0,r=jrank(task.k,task.id),dist=Math.hypot(pl.x-task.x,pl.z-task.z);task.left-=dt;
 if(task.t==='deliver'){
  if(task.left<=0)return endTask('⏰ Se acabó el tiempo: pedido perdido'+(task.earn?' (cobrado hasta ahora: €'+task.earn+')':''));
  if(dist<(c?12:4.5)){const pay=Math.round((18+task.d0*.45)*RM[r]*(1+clamp(task.left/task.lim,0,1)*.6));money+=taxNet(pay);sfx.cash();task.earn+=pay;jdoneAdd(task.k,'deliver');task.i++;
   if(task.i>=task.n){const b=Math.round(15*task.n*RM[r]);money+=taxNet(b);return endTask('✅ Ruta completada: +€'+(task.earn+b)+' (bonus €'+b+')')}
   toast('📦 Entregado a tiempo: +€'+pay);delLeg()}
  jh.innerHTML='📦 Entrega '+(task.i+1)+'/'+task.n+' · '+Math.round(dist)+' m · <b style="color:'+(task.left<10?'#f55':'#fff')+'">⏱ '+fmtT(task.left)+'</b><br><small>X: cancelar</small>'}
 else{
  if(task.g)animPerson(task.g,0,0,dt);
  if(task.ph==='pick'){if(task.left<=0)return endTask('El cliente se cansó y se fue en otro taxi');
   if(c&&c.t!=='moto'&&!c.spec.nf&&dist<11&&sp<5){scene.remove(task.g);task.g=null;const l=PLACES.filter(p=>!p.nt&&Math.hypot(p.x-pl.x,p.z-pl.z)>70),d=pk2(l.length?l:PLACES),dd=Math.hypot(d.x-pl.x,d.z-pl.z);
    Object.assign(task,{ph:'ride',x:d.x,z:d.z,d0:dd,lim:15+dd/8,left:15+dd/8,ic:'🏁',out:0,nm:SHOPS[d.key]?SHOPS[d.key].n:'EL PARKING'});toast('🚕 Pasajero a bordo: llévalo a '+task.nm)}
   jh.innerHTML='🚕 Recoge al pasajero · '+Math.round(dist)+' m · ⏱ '+fmtT(task.left)+'<br><small>Carrera '+(task.i+1)+'/'+task.n+' · X: cancelar</small>'}
  else{task.out=c?0:task.out+dt;if(task.out>12)return endTask('Has dejado tirado al pasajero: carrera cancelada');
   if(task.left<=0)return endTask('⏰ El pasajero se baja furioso: sin pago');
   if(c&&dist<10&&sp<5){const pay=Math.round((10+task.d0*.4)*RM[r]*(1+clamp(task.left/task.lim,0,1)*.5));money+=taxNet(pay);sfx.cash();task.earn+=pay;jdoneAdd(task.k,'taxi');task.i++;
    if(task.i>=task.n){const b=Math.round(20*RM[r]);money+=taxNet(b);return endTask('✅ Turno de taxi terminado: +€'+(task.earn+b)+' (bonus €'+b+')')}
    toast('🚕 Carrera cobrada: +€'+pay);taxiCall()}
   jh.innerHTML='🚕 Lleva al pasajero a '+task.nm+' · '+Math.round(dist)+' m · <b style="color:'+(task.left<8?'#f55':'#fff')+'">⏱ '+fmtT(task.left)+'</b><br><small>'+(c?'':'¡Vuelve al coche! · ')+'Carrera '+(task.i+1)+'/'+task.n+' · X: cancelar</small>'}}
 beacon.visible=true;beacon.position.set(task.x,22,task.z)}
function jobMap(tf){if(!task||task.x===undefined)return;const q=tf(task.x,task.z),R=(big?14:10)+Math.sin(tm*6)*2;ctx.fillStyle='#ffd23f';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],R,0,7);ctx.fill();ctx.stroke();ctx.fillText(task.ic,q[0],q[1]+1)}
// --- minijuego: reponer estanterías ---
const SKU=['Manzanas','Pan','Agua','Pizza','Leche'];let stk=null;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function stockStart(k){const r=jrank(k,'stock');stk={k,r,time:30,score:0,miss:0,n:0,cur:0,bt:0,ord:[0,1,2,3,4],t:null};openDlg();
 dlg.innerHTML='<h2>📦 Reponer estanterías</h2><p>Llega una caja: pulsa la estantería de ese producto (clic o teclas 1-5). Las estanterías se reordenan cada pocas cajas y cada caja caduca rápido.</p><div style="height:12px;background:#333;border-radius:6px;overflow:hidden"><div id="sbt" style="height:100%;background:#e8a020"></div></div><div id="sbx" style="font-size:76px;text-align:center;margin:8px 0">📦</div><div id="sbs" style="text-align:center;margin-bottom:6px;min-height:22px"></div><div id="sbb" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div><div><button onclick="stockEnd(1)" style="background:#666">Abandonar</button></div>';
 stockBox();stk.t=setInterval(()=>{if(!stk)return;stk.time-=.1;stk.bt-=.1;if(stk.bt<=0){stk.miss++;$('sbs').textContent='⌛ Caja caducada';stockBox()}
  $('sbt').style.width=Math.max(0,stk.time/30*100)+'%';if(stk.time<=0)stockEnd(0)},100)}
function stockBox(){stk.cur=Math.random()*5|0;stk.bt=[2.6,2.1,1.7][stk.r];if(stk.n%6===0){shuf(stk.ord);$('sbb').innerHTML=stk.ord.map((s,i)=>`<button onclick="stockPick(${i})" style="font-size:30px;padding:8px 14px;min-width:84px">${ICON[SKU[s]]}<br><small style="font-size:12px">${i+1} · ${SKU[s]}</small></button>`).join('')}
 stk.n++;$('sbx').textContent=ICON[SKU[stk.cur]]}
function stockPick(i){if(!stk)return;if(stk.ord[i]===stk.cur){stk.score++;$('sbs').textContent='✔ '+stk.score+' colocadas'}else{stk.miss++;$('sbs').textContent='✘ Estantería equivocada'}stockBox()}
addEventListener('keydown',e=>{if(stk&&/^Digit[1-5]$/.test(e.code))stockPick(+e.code[5]-1)});
function stockEnd(abort){if(!stk)return;clearInterval(stk.t);const s=stk;stk=null;closeDlg();if(abort){toast('Has abandonado el turno: sin paga');return}
 const pay=Math.max(0,Math.round((30+s.score*11-s.miss*8)*RM[s.r]));money+=taxNet(pay);sfx.cash();if(s.score>=8){jdoneAdd(s.k,'stock');toast('📦 Turno completado: '+s.score+' cajas, '+s.miss+' fallos · +€'+pay)}else toast('Turno flojo ('+s.score+' cajas, mínimo 8 para ascender) · +€'+pay)}

// =================================================================================================
// 18. CONTROLES (TECLADO Y RATÓN)
//     Qué hace cada tecla y cada botón del ratón.
// =================================================================================================
addEventListener('keydown',e=>{
 if(started&&ov.style.display==='none'&&invOpen&&(e.code==='KeyI'||e.code==='Escape')){toggleInv();return}
 if(e.code==='KeyL'&&playing()){bizKey();return}
 if(e.code==='KeyI'&&playing()){toggleInv();return}
 if(e.code==='KeyF'&&playing()){eatQuick();return}
 if(e.code==='KeyG'&&!e.repeat&&playing()&&riding&&riding.boat){fishToggle();return}
 if(e.code==='KeyM'&&playing()){toggleMap();return}
 if(e.code==='KeyX'&&playing()&&task){endTask('Trabajo cancelado');return}
 if(e.code==='Escape'&&chatPanel.style.display==='flex'){chatOpen(false);e.preventDefault();return}
 if(e.code==='Escape'&&xferIn.style.display==='block'){xfReply(false);e.preventDefault();return}
 if(e.code==='Escape'&&playerCard.style.display==='block'){closePlayerCard();e.preventDefault();return}
 if(e.code==='KeyV'&&!e.repeat&&playing()){const a=document.activeElement;if(!(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))){elOpen();e.preventDefault();return}}
 if(e.code==='KeyO'&&!e.repeat&&(playing()||(playerCard.style.display==='block'&&playerCard.dataset.mode!=='send'&&xferIn.style.display!=='block'))){toggleNearbyProfile();e.preventDefault();return}
 if(e.code==='Escape'&&started&&ov.style.display==='none'&&!dlgOpen){ov.style.display='flex';return}
 if(!playing())return;if(big&&!window.phDocked&&e.code.indexOf('Arrow')===0){e.preventDefault();return}K[e.code]=true;
 if(e.code==='KeyE')interact();if(e.code==='KeyR'&&inCar)refuelKey();if(e.code==='KeyI')toggleInv();
 if(e.code==='Space'&&!inCar&&!riding&&grounded){vy=8;energy=Math.max(0,energy-.8)}
 if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>K[e.code]=false);
addEventListener('mousemove',e=>{if(!playing())return;if(document.pointerLockElement||drag){yaw-=e.movementX*.0025;pitch=clamp(pitch+e.movementY*.0025,-.3,1.3)}});
ren.domElement.addEventListener('mousedown',()=>drag=true);addEventListener('mouseup',()=>drag=false);
// coche: clic izquierdo = acelerar, clic derecho = frenar / marcha atrás (la dirección sigue en A/D)
const MB={l:0,r:0};addEventListener('mousedown',e=>{if(e.button===0)MB.l=1;else if(e.button===2)MB.r=1});addEventListener('mouseup',e=>{if(e.button===0)MB.l=0;else if(e.button===2)MB.r=0});addEventListener('contextmenu',e=>e.preventDefault());addEventListener('blur',()=>{MB.l=MB.r=0});document.addEventListener('pointerlockchange',()=>{MB.l=MB.r=0});
ov.addEventListener('click',()=>{if(!ACC.ok&&location.protocol!=='file:')return; /* sin sesión iniciada no se puede jugar (24.4) */started=true;ov.style.display='none';try{ren.domElement.requestPointerLock()}catch(e){}});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&started&&!dlgOpen)ov.style.display='flex'});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)});

// =================================================================================================
// 19. FÍSICA
//     Colisiones, caminar, saltar, nadar, conducir y tráfico automático (semáforos y distancia con el de delante).
// =================================================================================================
function pushOut(o,r){const nx=clamp(pl.x,o.x0,o.x1),nz=clamp(pl.z,o.z0,o.z1),dx=pl.x-nx,dz=pl.z-nz,d=Math.hypot(dx,dz);
 if(d>0){if(d<r){pl.x+=dx/d*(r-d);pl.z+=dz/d*(r-d)}}
 else{const l=pl.x-o.x0,rg=o.x1-pl.x,t=pl.z-o.z0,b=o.z1-pl.z,m=Math.min(l,rg,t,b);
  if(m===l)pl.x=o.x0-r;else if(m===rg)pl.x=o.x1+r;else if(m===t)pl.z=o.z0-r;else pl.z=o.z1+r}}
function blockHit(x,z,r,y){y=y||0;for(const o of colliders)if(o.car&&o.on&&y<o.y1&&y+1.6>(o.y0||0)&&x>o.x0-r&&x<o.x1+r&&z>o.z0-r&&z<o.z1+r)return true;return false}
function inWater(x,z){return heightAt(x,z)<-.3&&groundH(x,z,py)<-.3}
function stepFoot(dt){if(seat){if(K.KeyW||K.KeyA||K.KeyS||K.KeyD||K.ArrowUp||K.ArrowDown||K.ArrowLeft||K.ArrowRight||K.Space){seat=null;setSit(body,false)}else{body.position.set(seat.x,py,seat.z);animPerson(body,walk,0,dt);return}}
 const fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),st=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0);
 let mx=Math.sin(yaw)*fw+Math.cos(yaw)*st,mz=Math.cos(yaw)*fw-Math.sin(yaw)*st;const l=Math.hypot(mx,mz);
 const ox=pl.x,oz=pl.z;let amp=0;eff=0;const wasSwimming=inWater(pl.x,pl.z);
 if(l>0){mx/=l;mz/=l;const run=(K.ShiftLeft||K.ShiftRight)&&energy>0,sp=(wasSwimming?(run?4.8:3.1):(run?9:5))*(hunger<=0?.5:1)*(energy<=0?.7:1)*1;eff=wasSwimming ? .15 : (run?1:.3);pl.x=clamp(pl.x+mx*sp*dt,WLIM0,WLIM1);pl.z=clamp(pl.z+mz*sp*dt,WLIM0,WLIM1);body.rotation.y=Math.atan2(mx,mz);walk+=dt*(wasSwimming?7:(sp>6?12:sp<3?6:9));amp=wasSwimming?.22:(sp>6?1.35:sp<3?.6:1)}
 const swimming=inWater(pl.x,pl.z);
 if(swimming){vy=0;py=SEA.position.y+.08;grounded=false}
 else{vy-=25*dt;py+=vy*dt;const gh=groundH(pl.x,pl.z,py);grounded=false;if(py<=gh||(vy<=0&&py-gh<.25)){py=gh;vy=0;grounded=true}}
 for(let it=0;it<2;it++){for(const o of colliders)if(o.on&&!o.car&&!o.np&&py<o.y1-.05&&py+1.8>(o.y0||0))pushOut(o,.45);
  for(const c of cars){const d=Math.hypot(pl.x-c.x,pl.z-c.z),r=c.spec.l*.4+.3;if(d<r&&d>0&&Math.abs(py-(c.y||0))<1.2){pl.x=c.x+(pl.x-c.x)/d*r;pl.z=c.z+(pl.z-c.z)/d*r}}
  for(const b of BUSES)for(const o of [-4,-2,0,2,4]){const cx=b.x+Math.sin(b.h)*o,cz=b.z+Math.cos(b.h)*o,d=Math.hypot(pl.x-cx,pl.z-cz);if(d<1.75&&d>0&&py<2.5){pl.x=cx+(pl.x-cx)/d*1.75;pl.z=cz+(pl.z-cz)/d*1.75}}
  for(const p of PLANES)if(p.alt<1&&py<3)for(const o of PLO){const cs=Math.cos(p.h),sn=Math.sin(p.h),cx=p.x+o[0]*cs+o[1]*sn,cz=p.z-o[0]*sn+o[1]*cs,d=Math.hypot(pl.x-cx,pl.z-cz);if(d<o[2]&&d>0){pl.x=cx+(pl.x-cx)/d*o[2];pl.z=cz+(pl.z-cz)/d*o[2]}}}
 wallHit(pl.x,pl.z,.45,py,pl);pl.x=clamp(pl.x,WLIM0,WLIM1);pl.z=clamp(pl.z,WLIM0,WLIM1);
 if(l>0&&grounded){const ph=Math.floor(walk/Math.PI);if(ph!==stepPh){stepPh=ph;sfx.step(!!(K.ShiftLeft||K.ShiftRight))}}
 body.position.set(pl.x,py+(swimming?Math.sin(tm*3.2)*.035:(l>0&&grounded?Math.abs(Math.sin(walk))*.045:0)),pl.z);animPerson(body,walk,swimming ? .25 : (grounded?amp:0),dt)}
// colisión coche-coche ajustada a la forma real (3 círculos a lo largo de cada vehículo); devuelve el hueco entre ambos (<0 = chocan)
function carGap(c,x,z,h,o){const sa=c.spec,sb=o.spec,ra=sa.w/2,rb=sb.w/2,qa=Math.max(0,sa.l/2-ra),qb=Math.max(0,sb.l/2-rb),na=Math.max(2,Math.ceil(2*qa/(ra*1.1))+1),nb=Math.max(2,Math.ceil(2*qb/(rb*1.1))+1);let g=1e9;
 for(let i=0;i<na;i++){const f=(i/(na-1)-.5)*2*qa,ax=x+Math.sin(h)*f,az=z+Math.cos(h)*f;for(let j=0;j<nb;j++){const e=(j/(nb-1)-.5)*2*qb,d=Math.hypot(ax-(o.x+Math.sin(o.h)*e),az-(o.z+Math.cos(o.h)*e))-ra-rb;if(d<g)g=d}}return g}
function driveCar(c,dt){const s=c.spec,out=c.fuel<=0&&!s.nf,thr0=(MB.l?1:0)-(MB.r?1:0),thr=(out||micro>0)?0:thr0,str=micro>0?microDir:(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0);
 c.v+=thr*(thr*c.v<0?30:s.acc)*dt;
 if(K.Space&&micro<=0)c.v-=Math.sign(c.v)*Math.min(Math.abs(c.v),30*dt);else if(!thr)c.v-=Math.sign(c.v)*Math.min(Math.abs(c.v),6*dt);
 {const lim=s.max*(!s.nf&&hwOn(c.x,c.z)?1.4:1);c.v=Math.max(-8,c.v>lim?Math.max(lim,c.v-15*dt):c.v)}c.h+=str*dt*(c.t==='moto'?2.2:s.nf?2.6:1.7)*Math.min(1,Math.abs(c.v)/5)*Math.sign(c.v);
 if(s.nf){}else if(!out){c.fuel=Math.max(0,c.fuel-(.012+Math.abs(c.v)*s.k*(1+Math.abs(thr)))*dt);if(c.fuel<=0)toast('¡Sin gasolina! Busca una gasolinera (G) o compra un bidón');else if(c.fuel<s.tank*.15&&!c.lw){c.lw=1;toast('⛽ Reserva: busca una gasolinera (G en el mapa)')}else if(c.fuel>s.tank*.3)c.lw=0}
 else if(thr0>0&&!(c.tn>tm)){toast('Sin gasolina: el coche no arranca. Compra un bidón en una gasolinera');c.tn=tm+4}
 const ox=c.x,oz=c.z;c.x+=Math.sin(c.h)*c.v*dt;c.z+=Math.cos(c.h)*c.v*dt;
 const q=s.l*.35,sx=Math.sin(c.h)*q,sz=Math.cos(c.h)*q;
 // vallas de la autopista: en vez de volver atrás (el coche se quedaba pegado), la valla lo empuja hacia fuera y solo frena según lo de frente que choque
 {const f1={x:0,z:0},f2={x:0,z:0},cy=c.y||0;wallHit(c.x+sx,c.z+sz,1.2,cy,f1);wallHit(c.x-sx,c.z-sz,1.2,cy,f2);const f=Math.hypot(f1.x,f1.z)>=Math.hypot(f2.x,f2.z)?f1:f2,fl=Math.hypot(f.x,f.z);
  if(fl>1e-4){const mx=Math.min(fl,1.5)/fl;c.x+=f.x*mx;c.z+=f.z*mx;const dn=Math.abs((Math.sin(c.h)*f.x+Math.cos(c.h)*f.z)/fl);c.v*=1-Math.min(1,dn*12*dt)}}
 let hit=blockHit(c.x+sx,c.z+sz,1,c.y)||blockHit(c.x-sx,c.z-sz,1,c.y)||c.x<WLIM0||c.x>WLIM1||c.z<WLIM0||c.z>WLIM1;
 for(const o of cars)if(o!==c&&Math.abs((o.y||0)-(c.y||0))<2&&Math.hypot(o.x-c.x,o.z-c.z)<9){const g=carGap(c,c.x,c.z,c.h,o);if(g<-.02&&g<carGap(c,ox,oz,c.h,o))hit=true}
 for(const b of BUSES)if(Math.hypot(b.x-c.x,b.z-c.z)<13){const g=carGap(c,c.x,c.z,c.h,b);if(g<-.02&&g<carGap(c,ox,oz,c.h,b))hit=true}
 for(const o of colliders)if(o.on&&!o.car&&o.y1>0&&o.z0<9999&&c.x>o.x0-1&&c.x<o.x1+1&&c.z>o.z0-1&&c.z<o.z1+1&&o.y1<2.7&&o.x1-o.x0<3&&false)hit=true;
 if(hit){c.x=ox;c.z=oz;c.v*=-.3}
 const gh=groundH(c.x,c.z,(c.y||0)+.3),onW=gh===0&&c.x>=0&&c.x<=CE&&c.z>=0&&c.z<=CE&&c.x%P<=40&&c.z%P<=40,ty2=onW?G:gh;c.y=(c.y||0)+(ty2-(c.y||0))*Math.min(1,12*dt);c.m.position.set(c.x,c.y,c.z);c.m.rotation.y=c.h;if(c.t==='moto'){c.lean=(c.lean||0)+((-str*.32*Math.min(1,Math.abs(c.v)/10))-(c.lean||0))*Math.min(1,8*dt);c.m.rotation.z=c.lean}pl.x=c.x;pl.z=c.z;py=c.y;$('spd').textContent=Math.round(Math.abs(c.v)*3.6)+' km/h'}
// coche de autopista (c.hw): recorre el anillo por su carril, frena si hay algo delante (otro coche, el jugador en coche o a pie) y baja solo en los pasos inferiores porque su altura es la del anillo
function hwStep(c,dt){const R=HWR,sg=c.dir,sh=Math.sin(c.h),ch=Math.cos(c.h);let vt=c.spd,lead=1e9,lv=0;
 for(const o of cars)if(o!==c&&o.hw&&o.dir===sg&&o.off===c.off){const d=(((o.s-c.s)*sg)%R.L+R.L)%R.L;if(d>0&&d<lead){lead=d;lv=o.sp}}
 const ob=(x,z,y,hw,v)=>{const dx=x-c.x,dz=z-c.z;if(dx>90||dx<-90||dz>90||dz<-90)return;const f=dx*sh+dz*ch,l=dx*ch-dz*sh;if(f>0&&f<lead&&Math.abs(l)<hw&&Math.abs(y-(c.y||0))<2.5){lead=f;lv=v}};
 for(const o of cars)if(o!==c&&!o.hw)ob(o.x,o.z,o.y||0,2.2,Math.max(0,(o.v||0)*(Math.sin(o.h)*sh+Math.cos(o.h)*ch)));
 ob(pl.x,pl.z,py,1.8,0);
 if(lead<110)vt=Math.min(vt,Math.sqrt(lv*lv+12*Math.max(0,lead-8-lv*.7))); // distancia de seguridad: 8 m + 0,7 s
 if(lead<6)c.sp=0;
 c.sp=vt<c.sp?Math.max(vt,c.sp-12*dt):Math.min(vt,c.sp+3*dt);
 c.s=(c.s+sg*c.sp*dt+R.L)%R.L;const p=hwPos(c.s,c.off,sg);c.x=p.x;c.z=p.z;c.y=p.y;c.h=p.h;c.v=c.sp;
 c.m.position.set(c.x,c.y,c.z);c.m.rotation.y=c.h}
const TLK=new Map();TLS.forEach(t=>TLK.set(t.i*16+t.j,t)); // cruce (i,j) → semáforo
function aiStep(c,dt){if(c.hw)return hwStep(c,dt);const ax=c.axis;let s=ax?c.z:c.x;const prev=s;
 if(c.sp===undefined)c.sp=c.spd;
 let vt=c.spd,room=1e9;
 // --- semáforos: busca el próximo cruce cuya línea de detención aún no se ha pasado ---
 {const so=9.5+c.spec.l/2;let bm=-1,bd=1e9;
  for(let m=0;m<=N;m++){const d=(-7+m*P-c.dir*so-prev)*c.dir;if(d>=-.5&&d<bd){bd=d;bm=m}}
  const tl=bm>=0?TLK.get(ax?c.line*16+bm:bm*16+c.line):null,key=tl?tl.i*16+tl.j:0;
  if(c.go&&c.go!==key)c.go=0;
  if(tl){const st=tlState(tl,ax);
   if(st!==0&&c.go!==key){
    if(c.sp>1&&bd<c.sp*c.sp/18)c.go=key; // ya no puede frenar a tiempo: pasa
    else{vt=Math.min(vt,bd<.15?0:Math.sqrt(12*Math.max(0,bd)));room=Math.max(0,bd)}}}}
 // --- coche / autobús delante en el mismo carril: frena suavemente ---
 let lead=1e9;
 for(const o of cars)if(o!==c&&o.mode==='ai'&&o.axis===ax&&o.dir===c.dir&&o.line===c.line){const d=((ax?o.z:o.x)-prev)*c.dir;if(d>0&&d<lead)lead=d}
 for(const o of BUSES)if(o.axis===ax&&o.dir===c.dir&&o.line===c.line){const d=((ax?o.z:o.x)-prev)*c.dir-4;if(d>0&&d<lead)lead=d}
 if(lead<22){vt=Math.min(vt,Math.max(0,(lead-7.6)*1.5));if(vt<.2)vt=0}
 if(vt<c.sp)c.sp=Math.max(vt,c.sp-9*dt);else c.sp=Math.min(vt,c.sp+3.5*dt);
 // movimiento (sin pasar de la línea de detención si hay que parar)
 s=prev+c.dir*Math.min(c.sp*dt,room);
 // seguridad: nunca invadir al de delante
 for(const o of cars)if(o!==c&&o.mode==='ai'&&o.axis===ax&&o.dir===c.dir&&o.line===c.line){const d=((ax?o.z:o.x)-s)*c.dir;if(d>0&&d<7){s=prev;c.sp=0;break}}
 for(const o of BUSES)if(o.axis===ax&&o.dir===c.dir&&o.line===c.line){const d=((ax?o.z:o.x)-s)*c.dir;if(d>0&&d<11){s=prev;c.sp=0;break}}
 const m=clamp(Math.round((s+7)/P),0,N),cm=-7+m*P;
 if(prev!==s&&(prev-cm)*(s-cm)<=0&&rnd()<.35){c.axis=1-ax;c.line=m;c.dir=rnd()<.5?1:-1}
 else{if(ax)c.z=s;else c.x=s}
 const al=c.axis?c.z:c.x;if(al>258)c.dir=-1;if(al<-5)c.dir=1;
 const L=-7+c.line*P,tg=c.axis==0?L+2.5*c.dir:L-2.5*c.dir,k=Math.min(1,3*dt);
 if(c.axis==0)c.z+=(tg-c.z)*k;else c.x+=(tg-c.x)*k;
 const th=c.axis==0?(c.dir>0?Math.PI/2:-Math.PI/2):(c.dir>0?0:Math.PI);c.h+=Math.atan2(Math.sin(th-c.h),Math.cos(th-c.h))*Math.min(1,5*dt);
 c.m.position.set(c.x,0,c.z);c.m.rotation.y=c.h}
