/* ===============================================================================================
   FICHA · interaccion-mapa-clima.js
   Qué hay:          Tecla E: qué hay cerca y qué pasa al pulsarla (21.1), cámara (21.2), minimapa (22.1), rutas en el mapa (22.2) y día/noche y clima (23).
   Tócalo si quieres: cambiar la cámara, el minimapa, las rutas o el clima
   Ojo:              Para que la E haga algo NUEVO normalmente NO hace falta este fichero: mira «Objetos con E» en GUIA.md.
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 21. INTERACCIÓN Y CÁMARA
//     Tecla E (puertas, personas, coches) y cámara en tercera persona.
// =================================================================================================

// ---------- 21.1 Interacción ----------
// ---------- Acompañante en el coche de otro jugador ----------
// pax = jugador remoto (de MP.players) cuyo coche compartes; null si no vas de acompañante. Máx. 3 acompañantes por coche; las motos y bicis no valen.
let pax=null;const PAX_CARS=['hatch','sport','van'];
const paxCar=p=>!!(p&&p.vehicleType&&PAX_CARS.includes(p.vehicleType)&&p.vehicleMesh&&p.vehicleMesh.visible);
const paxFull=p=>{let n=0;for(const q of MP.players.values())if(q!==p&&q.rid!=null&&String(q.rid)===String(p.id))n++;return n>=3};
function paxBoard(p){if(!paxCar(p)){toast('Ese coche ya no está disponible');return}if(paxFull(p)){toast('El coche va lleno');return}if((p.spd||0)>4){toast('Espera a que el coche pare para subir');return}
 pax=p;body.visible=false;vy=0;grounded=true;pl.x=p.mesh.position.x;pl.z=p.mesh.position.z;py=p.mesh.position.y;toast('Vas de acompañante con '+(p.name||'otro jugador')+' · E: bajar')}
function paxLeave(){const p=pax;pax=null;body.visible=true;vy=0;if(!p)return;const x=p.mesh.position.x,z=p.mesh.position.z,h=p.mesh.rotation.y,y=p.mesh.position.y,
 sd=[[Math.cos(h)*2.6,-Math.sin(h)*2.6],[-Math.cos(h)*2.6,Math.sin(h)*2.6],[-Math.sin(h)*3.5,-Math.cos(h)*3.5]];let o=sd[0];for(const q of sd)if(!blockHit(x+q[0],z+q[1],.5,y)){o=q;break}
 pl.x=x+o[0];pl.z=z+o[1];py=y;grounded=false}
function paxStep(){const p=pax;if(!MP.players.has(p.id)||!paxCar(p)){toast('El coche se ha detenido: te bajas');paxLeave();return}pl.x=p.mesh.position.x;pl.z=p.mesh.position.z;py=p.mesh.position.y;vy=0;grounded=true;body.visible=false}
function nearest(){if(seat)return{kind:'stand',txt:'E: levantarte'};if(pax)return{kind:'paxoff',txt:'E: bajar del coche de '+(pax.name||'otro jugador')};if(inCar)return{kind:'exit',txt:'E: salir del coche'+(pumpNear(inCar.x,inCar.z,6.5)?' · R: repostar':'')};
 if(riding&&riding.boat)return{kind:'boatoff',txt:(riding.net?'🎣 Pescando · A/D timón · G: recoger la red':Math.abs(riding.v)>1.5?'W/S motor · A/D timón · reduce la velocidad para bajar':'E: bajar '+boatDe(riding)+' '+riding.name)+(riding.type==='pesquero'&&!riding.net?' · G: calar la red':'')};
 if(riding&&riding.avion)return{kind:'avioff',txt:(riding.air||riding.alt>.4||Math.abs(riding.v)>1.5)?'W/S acelerador · A/D timón · Espacio despegar (pista, '+Math.round(AVR*3.6)+' km/h)':'E: bajar de la avioneta '+riding.name};
 if(riding&&riding.heli)return{kind:'helioff',txt:(riding.air||Math.abs(riding.v)>1.5)?'Espacio sube · Mayús baja · W/S avanzar · A/D girar':'E: bajar del helicóptero '+riding.name};
 if(riding&&riding.plane){return riding.state==='park'?{kind:'planeoff',txt:'E: bajar del avión · terminal'+(riding.t>0?' (despegue en '+Math.ceil(riding.t)+' s)':'')}:{kind:'planein',txt:'✈ '+riding.name+' · '+PSTX[riding.state]}}
 if(riding&&riding.metro){const R=riding,s=R.s;return s&&s.dwell?{kind:'metrooff',txt:'E: bajar del metro · estación '+R.X.name+' (sale en '+Math.ceil(s.left)+' s)'}:{kind:'metroin',txt:'🚇 '+R.L.id+' en marcha'}}
 if(riding){const st=riding.route.stops[riding.ns];return riding.state==='dwell'?{kind:'busoff',txt:'E: bajar del bus · parada '+st.name}:{kind:'busin',txt:riding.route.name+' en marcha · próxima parada '+st.name}}let best=null,bd=1e9;
 const t=(o,x,z,r,kind,txt)=>{const d=Math.hypot(pl.x-x,pl.z-z);if(d<r&&d<bd){bd=d;best={kind,o,txt}}};
 // dentro de una estación de metro solo cuentan sus cosas (no los coches, puertas o aviones que hay encima, en la superficie)
 if(py<-1&&metroWhere(pl.x,pl.z,py)){INTERACTS.forEach(o=>{if(o.y>py-.2&&o.y<py+2.2)t(o,o.x,o.z,2.3,'obj',IDEF[o.type].txt(o))});return metroNear(t)||best}
 DOORS.forEach(d=>(d.bmy!==undefined&&Math.abs(d.bmy-py)>2.2)?0:t(d,d.x,d.z,d.gar?4.6:3.2,'door',lockedFor(d)?(d.shop?'Cerrado · abre a las '+hrsTxt(d.shop):'🔒 Cerrada con llave · necesitas la llave'):(d.open?'E: cerrar puerta':'E: abrir puerta')+(d.gar?' del garaje':'')+(d.house?((q=>q.local?(q.owned?' (tu local) · L: gestionar':(q.remote?(q.remote.occ?' · OCUPADO · local de '+bizWho(q.remote):' · '+((LTYPES[q.remote.ty]||{}).n||'Negocio')+' de '+bizWho(q.remote)+' · L: comprar'):' · local en venta')):(q.owned?' (tu casa)':''))(HOUSES.find(h=>h.door===d))):'')));
 WORKERS.forEach(w=>t(w,w.x,w.z,3,'talk','E: hablar con '+w.name));INTERACTS.forEach(o=>{if(o.y>py-.2&&o.y<py+2.2)t(o,o.x,o.z,2.3,'obj',IDEF[o.type].txt(o))});cars.forEach(c=>t(c,c.x,c.z,3.5,'car','E: conducir '+c.spec.name));MP.players.forEach(p=>{if(paxCar(p))t(p,p.mesh.position.x,p.mesh.position.z,4,'pax',paxFull(p)?'El coche de '+(p.name||'otro jugador')+' va lleno':'E: subir de acompañante con '+(p.name||'otro jugador'))});AVIO.forEach(a=>t(a,a.x,a.z,6.2,'avion','E: subir a la avioneta '+a.name));BOATS.forEach(b=>t(b,b.x,b.z,b.L/2+2.4,'boat',b.pilot?'⛵ '+b.name+' · lo pilota '+boatPilotName(b):'E: subir '+boatA(b)+' '+b.name));HELIS.forEach(a=>{if(Math.abs(py-G-a.alt)<3)t(a,a.x,a.z,7,'heli','E: subir al helicóptero '+a.name)});
 bmNear(t);
 STOPS.forEach(q=>t(q,q.x,q.z,4,'busin','Parada de autobús · '+q.route.name));
 metroNear(t);
 let bb=null,bbd=1e9;BUSES.forEach(b=>{const d=Math.hypot(pl.x-b.x,pl.z-b.z);if(b.state==='dwell'&&d<7.5&&d<bbd){bbd=d;bb=b}});
 if(bb)best={kind:'bus',o:bb,txt:'E: subir al bus '+bb.route.name+' ('+BUSFARE+' €)'};
 let pp=null,ppd=1e9;PLANES.forEach(p=>{const d=Math.hypot(pl.x-p.x,pl.z-p.z);if(p.state==='park'&&d<16&&d<ppd){ppd=d;pp=p}});
 if(pp)best={kind:'plane',o:pp,txt:'E: subir al avión '+pp.name+' ('+PLANEFARE+' €) · vuelo panorámico'};return best}
function enterCar(c){inCar=c;c.mode='player';c.v=0;body.visible=false;if(c.m.userData.rider)c.m.userData.rider.visible=true;pl.x=c.x;pl.z=c.z}
function interact(){if(seat){seat=null;setSit(body,false);return}const n=nearest();if(!n)return;
 if(n.kind==='door'){if(lockedFor(n.o)){toast(n.o.shop?'Cerrado':'🔒 Está cerrada con llave: necesitas la llave (el dueño te puede dar una copia)');return}n.o.open=!n.o.open;n.o.col.on=!n.o.open;if(n.o.col2)n.o.col2.on=n.o.col.on;sfx.door(n.o.open)}
 else if(n.kind==='talk')talk(n.o);else if(n.kind==='obj')IDEF[n.o.type].act(n.o);else if(n.kind==='bterr')bmEnter(n.o);else if(n.kind==='tshop')bsOpen(100000+n.o.id);else if(n.kind==='car')enterCar(n.o);else if(n.kind==='pax')paxBoard(n.o);else if(n.kind==='paxoff')paxLeave();
 else if(n.kind==='boat')boardBoat(n.o);else if(n.kind==='boatoff'){if(riding&&riding.net){toast('Recoge la red antes de bajar (G)');return}leaveBoat()}else if(n.kind==='avion')boardAvion(n.o);else if(n.kind==='avioff')leaveAvion();else if(n.kind==='heli')boardHeli(n.o);else if(n.kind==='helioff')leaveHeli();else if(n.kind==='plane')boardPlane(n.o);else if(n.kind==='planeoff')leavePlane();else if(n.kind==='planein'){toast('Abróchate el cinturón: solo puedes bajar en la terminal')}
 else if(n.kind==='mticket')metroMachine(n.o);else if(n.kind==='mboard')metroBoard(n.o);else if(n.kind==='metrooff')metroLeave();else if(n.kind==='metroin')toast('Espera a que el tren pare en la próxima estación');else if(n.kind==='minfo'){}
 else if(n.kind==='bus')boardBus(n.o);else if(n.kind==='busoff')leaveBus();else if(n.kind==='busin'){if(riding)toast('El bus solo para en las paradas')}
 else{const c=inCar,sd=[[Math.cos(c.h)*2.6,-Math.sin(c.h)*2.6],[-Math.cos(c.h)*2.6,Math.sin(c.h)*2.6],[-Math.sin(c.h)*3.5,-Math.cos(c.h)*3.5]];
  let o=sd[0];for(const s of sd)if(!blockHit(c.x+s[0],c.z+s[1],.5,c.y||0)){o=s;break}
  c.mode='parked';c.v=0;inCar=null;body.visible=true;if(c.m.userData.rider)c.m.userData.rider.visible=false;c.m.rotation.z=0;pl.x=c.x+o[0];pl.z=c.z+o[1];$('spd').textContent=''}}

// ---------- 21.2 Cámara ----------
const inRoom=(x,z)=>ROOMS.find(r=>x>r.x0-.2&&x<r.x1+.2&&z>r.z0-.2&&z<r.z1+.2&&(r.ug?py<-1.5:py<r.h+.15));
function hits(x,y,z){for(const o of colliders)if(o.on&&!o.car&&y<o.y1&&y>=(o.y0||0)-.3&&x>o.x0-.3&&x<o.x1+.3&&z>o.z0-.3&&z<o.z1+.3)return true;return false}
// Losas del parking (techo/suelo entre plantas): la cámara no debe atravesarlas
const slabLo=f=>f.y===G?-.3:f.y-.3,slabHi=f=>f.y===G?G:f.y;
function slabAt(x,y,z,y0){for(const f of FLOORS){const lo=slabLo(f);if(lo>y0+.5&&y>lo-.05&&y<slabHi(f)+.05&&x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1)return true}return false}
function ceilAt(x,z,y0){let c=99;for(const f of FLOORS){const lo=slabLo(f);if(lo>y0+.5&&lo<c&&x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1)c=lo}return c}
let camD=0;
function updCam(dt){if(riding&&riding.metro&&MT.cab){metroCam();return} // en el metro: vista desde dentro del vagón (10.5)

 const rc=inCar||riding||(pax&&{h:pax.mesh.rotation.y});if(rc)yaw+=Math.atan2(Math.sin(rc.h-yaw),Math.cos(rc.h-yaw))*Math.min(1,(riding&&riding.avion?7:riding&&riding.heli?4.5:riding&&riding.boat?3.5:2.5)*dt);
 if(riding&&riding.avion){const a=riding;pitch+=((.2-a.pt*.7)-pitch)*Math.min(1,4*dt)} // cámara automática tras la avioneta (el ratón no la mueve)
 if(riding&&riding.heli){const a=riding;pitch+=((.32-a.pt*.5)-pitch)*Math.min(1,4*dt)} // ídem tras el helicóptero
 const tx=pl.x,ty=py+(riding?(riding.plane?6:riding.avion?2.8:riding.heli?3.4:riding.boat?2.8:2.4):1.6),tz=pl.z,dist=(inCar||pax)?9:riding?(riding.plane?38:riding.avion?15+Math.abs(riding.v)*.1:riding.heli?18+Math.abs(riding.v)*.12:riding.boat?12+Math.abs(riding.v)*.2:15):5.5,cp=Math.cos(pitch),dx=-Math.sin(yaw)*cp,dz=-Math.cos(yaw)*cp,dy=Math.sin(pitch);
 const dep=(py<-.3&&inPit(tx,tz,py))?clamp(-py/2,0,1):0;let d=dist+((inCar?6.5:3.8)-dist)*dep;
 if((!inCar&&!pax&&!(riding&&riding.avion)&&!(riding&&riding.plane&&riding.alt>12))||dep>0)for(let s=.5;s<=d;s+=.25){const sx=tx+dx*s,sy=ty+dy*s,sz=tz+dz*s;
  if(hits(sx,sy,sz)||(dep>0&&(slabAt(sx,sy,sz,py)||(sy<-.2&&!inPit(sx,sz,sy))))){d=Math.max(riding?(riding.plane?18:7):.9,s-.6);break}}
 // la distancia se acorta al instante pero vuelve despacio (sin tirones)
 camD=(camD<=0||d<camD)?d:camD+(d-camD)*Math.min(1,4*dt);d=camD;
 let y=ty+dy*d;const air=riding&&(riding.avion||riding.plane||riding.heli),rm=air?null:inRoom(tx,tz);
 if(dep>0){const cx=tx+dx*d,cz=tz+dz*d,lo=groundH(cx,cz,Math.max(py+.3,y))+.4,hi=ceilAt(cx,cz,py)-.3; /* suelo bajo la cámara a su altura (en una escalera, la cámara va más arriba que el jugador) */y=hi<lo?(lo+hi)/2:clamp(y,lo,hi)}
 else{if(rm){if(rm.hot){let k=0;rm.hot.forEach((t,i)=>{if(t<=py+.3)k=i});y=Math.min(y,(rm.hot[k+1]||rm.hot[rm.hot.length-1]+3)-.95);y=Math.max(y,rm.hot[k]+.4)}else y=Math.min(y,rm.fl?(Math.floor((py+.3)/3)+1)*3-.65:rm.h-.35)}if(rm&&rm.fl)y=Math.max(y,Math.floor((py+.3)/3)*3+.4)}
 // bajo tierra NO se fuerza y>=.5 (eso dejaba la cámara por encima del techo del parking)
 if(air){const cx=tx+dx*d,cz=tz+dz*d;for(const o of HB)if(cx>o.x0&&cx<o.x1&&cz>o.z0&&cz<o.z1&&y>o.y0-.3&&y<o.y1+.6)y=Math.max(y,o.y1+.6)} // en vuelo la cámara nunca queda dentro de un edificio
 cam.position.set(tx+dx*d,dep>0?y:Math.max(.5,y),tz+dz*d);cam.lookAt(tx,ty,tz)}

// =================================================================================================
// 22. MAPA
//     Minimapa, mapa grande y rutas hasta un destino.
// =================================================================================================

// ---------- 22.1 Minimapa ----------
const SC=2,stat=document.createElement('canvas');stat.width=stat.height=MS*SC;
(function(){const g=stat.getContext('2d');const R=(a,b,w,c)=>{g.fillStyle=c;g.fillRect((a+MOFF)*SC,(b+MOFF)*SC,w*SC,w*SC)};g.fillStyle='#2e78b8';g.fillRect(0,0,MS*SC,MS*SC);for(let x=LAND0;x<LAND1;x+=4)for(let z=LAND0;z<LAND1;z+=4){const h=heightAt(x+2,z+2);if(h>-.3&&!(x>=-14&&x+4<=N*P&&z>=-14&&z+4<=N*P)){const k=Math.min(1,h/5);g.fillStyle=h>8?'rgb('+(100+h*.9|0)+','+(104+h*.8|0)+','+(98+h*.8|0)+')':h<=.4?(isl(x+2,z+2)<10?'#d8c690':'#4f7a45'):'rgb('+(79-k*22|0)+','+(122-k*18|0)+','+(69-k*20|0)+')';g.fillRect((x+MOFF)*SC,(z+MOFF)*SC,4*SC,4*SC)}}R(-14,-14,N*P+14,'#4a4a4e');g.lineJoin='round';for(const[w,c]of[[7,'#e8e8e8'],[5,'#55555c']]){g.strokeStyle=c;g.lineWidth=w*SC;for(const po of HW.polys){g.beginPath();po.forEach((p,i)=>{const X=(p[0]+MOFF)*SC,Z=(p[1]+MOFF)*SC;i?g.lineTo(X,Z):g.moveTo(X,Z)});g.stroke()}}
 g.fillStyle='#b9b6ad';for(let i=0;i<N;i++)for(let j=0;j<N;j++)g.fillRect((i*P+MOFF)*SC,(j*P+MOFF)*SC,40*SC,40*SC);
 BLD.forEach(b=>{g.fillStyle=typeof b[4]==='number'?'#'+('000000'+b[4].toString(16)).slice(-6):b[4];g.fillRect((b[0]+MOFF)*SC,(b[1]+MOFF)*SC,b[2]*SC,b[3]*SC)});g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2;for(const rr of[50,95]){g.beginPath();g.arc((MX+MOFF)*SC,(MZ+MOFF)*SC,rr*SC,0,7);g.stroke()}g.fillStyle='#e03a30';g.beginPath();g.moveTo((MX+MOFF)*SC,(MZ+MOFF-9)*SC);g.lineTo((MX+MOFF-8)*SC,(MZ+MOFF+6)*SC);g.lineTo((MX+MOFF+8)*SC,(MZ+MOFF+6)*SC);g.fill();g.fillStyle='#fff';g.font='bold '+(11*SC)+'px sans-serif';g.textAlign='center';g.fillText('MONTAÑA',(MX+MOFF)*SC,(MZ+MOFF+22)*SC)})();
function setMap(){const s=big?Math.min(600,innerHeight-60,innerWidth-30):(IS_TOUCH?Math.min(110,Math.round(innerHeight*.3)):170);mm.width=mm.height=s;mm.style.width=mm.style.height=s+'px';if(big){mm.style.top='50%';mm.style.right='50%';mm.style.transform='translate(50%,-50%)'}else{mm.style.top='12px';mm.style.right='12px';mm.style.transform='none'}}
// zoom del mapa grande: rueda o +/- ; con zoom el mapa sigue al jugador ; arrastrar (si el ratón está libre) para desplazar ; 0 = restablecer
let mz=1,mox=0,moz=0,mdrag=null,mmoved=false;const MZMAX=20,MKP={};let mpT=0;
// desplazar el mapa grande con las flechas (velocidad proporcional al zoom: ~70% del ancho visible por segundo)
function mapPanStep(W){const now=performance.now(),dt=Math.min(.1,(now-mpT)/1000);mpT=now;if(!big||mz<=1)return;const dx=(MKP.ArrowRight?1:0)-(MKP.ArrowLeft?1:0),dz=(MKP.ArrowDown?1:0)-(MKP.ArrowUp?1:0);if(dx||dz){const sp=W*.7*dt;mox+=dx*sp;moz+=dz*sp}}
addEventListener('keydown',e=>{if(!big||!started||dlgOpen||window.phDocked||e.code.indexOf('Arrow')!==0)return;MKP[e.code]=true;e.preventDefault()});
addEventListener('keyup',e=>{delete MKP[e.code]});
addEventListener('blur',()=>{for(const c in MKP)delete MKP[c]});
function toggleMap(){big=!big;if(big){mz=1;mox=moz=0}for(const c of['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']){K[c]=false;delete MKP[c]}setMap()}
function mapZoom(f){if(!big)return;mz=clamp(mz*f,1,MZMAX);if(mz===1){mox=moz=0}}
mm.addEventListener('click',e=>{if(mmoved){mmoved=false;return}const ml=document.getElementById('phMapLayer');if(ml&&ml.style.display==='flex'){navPick(e);return}phoneMap()});
addEventListener('wheel',e=>{if(!big||!started||window.phDocked)return;e.preventDefault();mapZoom(e.deltaY<0?1.25:.8)},{passive:false});
addEventListener('keydown',e=>{if(!big||!started||dlgOpen||window.phDocked||e.repeat&&false)return;if(e.key==='+'||e.key==='='||e.code==='NumpadAdd'){mapZoom(1.25)}else if(e.key==='-'||e.code==='NumpadSubtract'){mapZoom(.8)}else if(e.key==='0'||e.code==='Numpad0'){mz=1;mox=moz=0}});
mm.addEventListener('mousedown',e=>{if(big&&e.button===0){mdrag={x:e.clientX,y:e.clientY};mmoved=false}});
addEventListener('mousemove',e=>{if(!mdrag||!big)return;const dx=e.clientX-mdrag.x,dy=e.clientY-mdrag.y;if(Math.abs(dx)+Math.abs(dy)>3)mmoved=true;if(!mmoved)return;const k=mm.width/(MS/mz);mox-=dx/k;moz-=dy/k;mdrag.x=e.clientX;mdrag.y=e.clientY});
addEventListener('mouseup',()=>{mdrag=null});
// táctil: un dedo desliza el mapa, dos dedos (pellizco) lo amplían o reducen; un toque sin mover sigue eligiendo destino
(function(){let tp=null,pd=0,tmoved=false;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 mm.addEventListener('touchstart',e=>{if(!big)return;if(e.touches.length===2){pd=dist(e.touches);tp=null;tmoved=true}else if(e.touches.length===1){tp={x:e.touches[0].clientX,y:e.touches[0].clientY};tmoved=false}},{passive:true});
 mm.addEventListener('touchmove',e=>{if(!big)return;e.preventDefault();
  if(e.touches.length===2){const d=dist(e.touches);if(pd>0)mapZoom(d/pd);pd=d;tmoved=true;return}
  if(e.touches.length!==1||!tp)return;const t=e.touches[0],dx=t.clientX-tp.x,dy=t.clientY-tp.y;
  if(!tmoved&&Math.abs(dx)+Math.abs(dy)<8)return;tmoved=true;
  if(mz>1){const r=mm.getBoundingClientRect(),f=mm.width/r.width,k=mm.width/(MS/mz);mox-=dx*f/k;moz-=dy*f/k}
  tp.x=t.clientX;tp.y=t.clientY},{passive:false});
 const end=e=>{if(e.touches.length===1){tp={x:e.touches[0].clientX,y:e.touches[0].clientY};pd=0;return}
  if(e.touches.length===0){if(tmoved&&e.cancelable)e.preventDefault();tp=null;pd=0;tmoved=false}};
 mm.addEventListener('touchend',end,{passive:false});mm.addEventListener('touchcancel',end,{passive:false});
})();
setMap();
function drawMap(){const s=mm.width,sh=mm.height,W=big?MS/mz:90,Hz=W*sh/s,t=clamp((mz-1)/1.5,0,1);mapPanStep(W);let cx=big?MC+(pl.x-MC)*t+mox:pl.x,cz=big?MC+(pl.z-MC)*t+moz:pl.z;
 if(big){const lo=MC-MS/2+W/2,hi=MC+MS/2-W/2;cx=clamp(cx,lo,hi);{const loz=MC-MS/2+Hz/2,hiz=MC+MS/2-Hz/2;cz=loz>hiz?MC:clamp(cz,loz,hiz)}if(mz>1){mox=cx-(MC+(pl.x-MC)*t);moz=cz-(MC+(pl.z-MC)*t)}}
 const k=s/W;NAVV={cx,cz,k,s,sh};
 ctx.clearRect(0,0,s,sh);ctx.drawImage(stat,(cx-W/2+MOFF)*SC,(cz-Hz/2+MOFF)*SC,W*SC,Hz*SC,0,0,s,sh);
 const tf=(x,z)=>[(x-cx)*k+s/2,(z-cz)*k+sh/2],ob=objective()[1];
 ctx.font='bold '+(big?15:11)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 PLACES.forEach(p=>{const q=tf(p.x,p.z);if(q[0]<-10||q[1]<-10||q[0]>s+10||q[1]>sh+10)return;
  if(p.key===ob){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q[0],q[1],big?15:11,0,7);ctx.stroke()}
  ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(q[0],q[1],big?11:8,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(p.l,q[0],q[1]+1)});
 STOPS.forEach(p=>{const q=tf(p.x,p.z);if(q[0]<-10||q[1]<-10||q[0]>s+10||q[1]>sh+10)return;const w=big?8:6;ctx.fillStyle=p.route.hex;ctx.fillRect(q[0]-w/2,q[1]-w/2,w,w);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(q[0]-w/2,q[1]-w/2,w,w)});
 ctx.save();ctx.font='bold '+(big?11:9)+'px sans-serif';METRO.forEach(m=>{const q=tf(m.x,m.z);if(q[0]<-10||q[1]<-10||q[0]>s+10||q[1]>sh+10)return;const w=big?16:12;ctx.fillStyle='#fff';ctx.fillRect(q[0]-w/2-1.5,q[1]-w/2-1.5,w+3,w+3);ctx.fillStyle='#c62828';ctx.fillRect(q[0]-w/2,q[1]-w/2,w,w);ctx.fillStyle='#fff';ctx.fillText('M',q[0],q[1]+1)});ctx.restore();
 BUSES.forEach(b=>{const q=tf(b.x,b.z);if(q[0]<-10||q[1]<-10||q[0]>s+10||q[1]>sh+10)return;ctx.fillStyle=b.route.hex;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],big?7:5,0,7);ctx.fill();ctx.stroke()});
 PLANES.forEach(p=>{const q=tf(p.x,p.z);if(q[0]<-10||q[1]<-10||q[0]>s+10||q[1]>sh+10)return;ctx.fillStyle='#1f5fa8';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],big?9:6,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillText('✈',q[0],q[1]+1)});
 HOUSES.filter(h=>h.owned).forEach(h=>{const q=tf(h.x,h.z);ctx.fillStyle=h.local?'#fc0':'#2c2';ctx.fillRect(q[0]-4,q[1]-4,8,8)});
// terrenos de la isla principal (contorno blanco; el número solo en el mapa grande)
 ctx.save();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=big?2:1;ctx.font='bold '+(big?13:9)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 TERRENOS.forEach(t=>{const q=tf(t.x,t.z),w=t.w*k,h=t.d*k;if(q[0]<-w||q[1]<-h||q[0]>s+w||q[1]>sh+h)return;ctx.fillStyle=t.owned?'rgba(44,200,44,.55)':t.rem?'rgba(230,140,40,.55)':'rgba(255,255,255,.22)';ctx.fillRect(q[0]-w/2,q[1]-h/2,w,h);ctx.strokeRect(q[0]-w/2,q[1]-h/2,w,h);if(big||w>14){ctx.fillStyle='#fff';ctx.fillText(String(t.id),q[0],q[1]+1)}});ctx.restore();
 // otros jugadores (multijugador): flecha del color de su personaje, con el nombre en el mapa grande
 if(typeof MP!=='undefined'&&MP.players&&MP.players.size){ctx.save();for(const [pid,rp] of MP.players){const pos=rp.mesh.position,q=tf(pos.x,pos.z);if(q[0]<-14||q[1]<-14||q[0]>s+14||q[1]>sh+14)continue;
  const hue=(Math.abs(String(pid).split('').reduce((a,c)=>a+c.charCodeAt(0),0))*47)%360,r=big?1.15:.9;
  ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(Math.PI-(rp.yaw||0));ctx.fillStyle='hsl('+hue+',70%,55%)';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9*r);ctx.lineTo(6*r,7*r);ctx.lineTo(-6*r,7*r);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
  if(big&&rp.name){ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.fillStyle='#fff';ctx.strokeText(rp.name,q[0],q[1]-14);ctx.fillText(rp.name,q[0],q[1]-14)}}ctx.restore()}
 navDraw(tf);jobMap(tf);const q=tf(pl.x,pl.z);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(Math.PI-yaw);ctx.fillStyle='#ff3';ctx.strokeStyle='#000';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 if(big){ctx.font='bold 13px sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';const tx='Zoom ×'+mz.toFixed(1);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(6,sh-26,ctx.measureText(tx).width+12,20);ctx.fillStyle='#fff';ctx.fillText(tx,12,sh-12)}}

// ---------- 22.2 Rutas en el mapa (tipo Google Maps) ----------
// Toca un sitio del mapa del móvil: calcula la ruta más corta por carretera (A* sobre una cuadrícula de calles + autopista).
// Si el destino está al otro lado del mar, deja elegir entre avión/helicóptero (vía aeropuerto) o barco (vía puerto).
let NAVV=null;
const NAVC={cs:3,W:0,road:null,walk:null,water:null,sea:null},NAV={dest:null,org:null,routes:null,sel:null,mode:'drive'};
const NAVSP={walk:5,drive:16,fly:45,sail:12},NAVOV={walk:0,drive:0,fly:25,sail:10};
(function(){const st=document.createElement('style');st.textContent='#navPanel{display:none;position:absolute;left:8px;right:56px;bottom:20px;max-height:46%;overflow:auto;z-index:6;background:rgba(10,20,31,.94);border:1px solid #ffffff44;border-radius:12px;padding:8px 10px;font:12px/1.35 system-ui;color:#fff;text-align:left}#navPanel .nvH{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px}#navPanel .nvX{border:0;background:#ffffff22;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;flex:none}#navPanel .nvM{display:flex;gap:6px;margin:6px 0 2px}#navPanel .nvM button{flex:1;border:2px solid transparent;border-radius:10px;background:#ffffff1f;color:#fff;font:600 12px system-ui;padding:5px 4px;cursor:pointer}#navPanel .nvM button.on{border-color:#4aa3ff;background:#1a73e855}#navPanel .nvQ{margin:6px 0 4px;color:#ffd966}#navPanel .nvB{display:flex;gap:6px}#navPanel .nvB button{flex:1;border:2px solid transparent;border-radius:10px;background:#ffffff1f;color:#fff;font:600 12px system-ui;padding:6px 4px;cursor:pointer}#navPanel .nvB button.on{border-color:#4aa3ff;background:#1a73e855}#navPanel .nvB small{display:block;font-weight:400;opacity:.85}#navPanel .nvT{margin:6px 0 2px;color:#9fe3a8}#navPanel ol{margin:0;padding-left:0;list-style:none}#navPanel li{margin:2px 0}#navPanel li small{opacity:.7}#navPanel .nvR{margin-top:6px;border:0;border-radius:8px;background:#2f7fe0;color:#fff;font:600 12px system-ui;padding:5px 9px;cursor:pointer}';document.head.appendChild(st)})();
function navInit(){
 if(NAVC.road)return;
 const cs=NAVC.cs,W=Math.ceil((LAND1-LAND0)/cs),n=W*W;NAVC.W=W;
 // carreteras: calles del barrio (todo menos las manzanas) + autopista, rampas y camino de la montaña
 const c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d'),X=v=>(v-LAND0)/cs;
 g.fillStyle='#fff';g.strokeStyle='#fff';g.lineJoin='round';g.lineCap='round';
 g.fillRect(X(-14),X(-14),(N*P+14)/cs,(N*P+14)/cs);
 for(let i=0;i<N;i++)for(let j=0;j<N;j++)g.clearRect(X(i*P),X(j*P),40/cs,40/cs);
 // isla: calles de las manzanas (asfalto 54 m con manzanas de 40 m), caminos de arena y muelle; solo se camina
 for(const b of BLD){if(b[1]<600||typeof b[4]!=='string')continue;const h=b[4];if(h==='#3d3d40'||h==='#cdb98a'||h==='#8a6a45'){const w=Math.max(b[2],7),d=Math.max(b[3],7);g.fillRect(X(b[0]+b[2]/2-w/2),X(b[1]+b[3]/2-d/2),w/cs,d/cs)}}
 for(const b of BLD){if(b[1]>=600&&b[4]==='#b9b6ad')g.clearRect(X(b[0]),X(b[1]),b[2]/cs,b[3]/cs)}
 g.lineWidth=10/cs;
 for(const po of HW.polys){g.beginPath();po.forEach((p,i)=>{const a=X(p[0]),b=X(p[1]);i?g.lineTo(a,b):g.moveTo(a,b)});g.stroke()}
 const ring=HW.polys[0],conn=(x,z)=>{let b=ring[0],bd=1e9;for(const p of ring){const d=Math.hypot(p[0]-x,p[1]-z);if(d<bd){bd=d;b=p}}g.beginPath();g.moveTo(X(b[0]),X(b[1]));g.lineTo(X(x),X(z));g.stroke()};
 conn(101,332);conn(343,341); // accesos al aeropuerto y al puerto
 const d=g.getImageData(0,0,W,W).data,m=new Uint8Array(n);for(let i=0;i<n;i++)m[i]=d[i*4+3]>127?1:0;
 NAVC.walk=Uint8Array.from(m); // a pie: todas las calles (barrio, autopista e isla)
 const lab=new Int32Array(n),q=new Int32Array(n);let best=0,bl=0,L=0;
 for(let s0=0;s0<n;s0++){if(!m[s0]||lab[s0])continue;L++;let h=0,t=0;q[t++]=s0;lab[s0]=L;
  while(h<t){const i=q[h++],x=i%W,z=(i/W)|0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const a=x+dx,b=z+dz;if(a<0||b<0||a>=W||b>=W)continue;const j=b*W+a;if(m[j]&&!lab[j]){lab[j]=L;q[t++]=j}}}
  if(t>best){best=t;bl=L}}
 for(let i=0;i<n;i++)m[i]=lab[i]===bl?1:0;NAVC.road=m;
 // mar: se lee del mapa estático (azul = agua); para navegar se aleja un poco de la costa
 const c2=document.createElement('canvas');c2.width=c2.height=W;const g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;
 g2.drawImage(stat,(LAND0+MOFF)*SC,(LAND0+MOFF)*SC,W*cs*SC,W*cs*SC,0,0,W,W);
 const e=g2.getImageData(0,0,W,W).data,wt=new Uint8Array(n);
 for(let i=0;i<n;i++)wt[i]=(Math.abs(e[i*4]-46)+Math.abs(e[i*4+1]-120)+Math.abs(e[i*4+2]-184)<24)?1:0;
 NAVC.water=wt;const se=new Uint8Array(n);
 for(let z=1;z<W-1;z++)for(let x=1;x<W-1;x++){let ok=1;for(let dz=-1;dz<=1&&ok;dz++)for(let dx=-1;dx<=1;dx++)if(!wt[(z+dz)*W+x+dx]){ok=0;break}se[z*W+x]=ok}
 NAVC.sea=se}
function navSnap(m,x,z,R){const W=NAVC.W,cs=NAVC.cs,cx=Math.floor((x-LAND0)/cs),cz=Math.floor((z-LAND0)/cs);let bi=-1,bd=1e9;for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const a=cx+dx,b=cz+dz;if(a<0||b<0||a>=W||b>=W)continue;const d=dx*dx+dz*dz;if(d<bd&&m[b*W+a]){bd=d;bi=b*W+a}}return bi}
const navXZ=i=>{const W=NAVC.W,cs=NAVC.cs;return[(i%W+.5)*cs+LAND0,((i/W)|0)*cs+cs/2+LAND0]};
function navAStar(m,s,t){
 const W=NAVC.W,n=W*W,g=new Float32Array(n).fill(1e9),par=new Int32Array(n).fill(-1),cl=new Uint8Array(n),hf=[],hi=[];
 const hpush=(f,i)=>{let k=hf.length;hf.push(f);hi.push(i);while(k>0){const p=(k-1)>>1;if(hf[p]<=f)break;hf[k]=hf[p];hi[k]=hi[p];k=p}hf[k]=f;hi[k]=i};
 const hpop=()=>{const ri=hi[0],lf=hf.pop(),li=hi.pop(),len=hf.length;if(len){let k=0;for(;;){let c=2*k+1;if(c>=len)break;if(c+1<len&&hf[c+1]<hf[c])c++;if(hf[c]>=lf)break;hf[k]=hf[c];hi[k]=hi[c];k=c}hf[k]=lf;hi[k]=li}return ri};
 const tx=t%W,tz=(t/W)|0,hh=(x,z)=>{const dx=Math.abs(x-tx),dz=Math.abs(z-tz);return dx+dz-.5858*Math.min(dx,dz)};
 g[s]=0;hpush(hh(s%W,(s/W)|0),s);
 while(hf.length){const i=hpop();if(cl[i])continue;cl[i]=1;if(i===t)break;const x=i%W,z=(i/W)|0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const a=x+dx,b=z+dz;if(a<0||b<0||a>=W||b>=W)continue;const j=b*W+a;if(!m[j]||cl[j])continue;
   if(dx&&dz&&(!m[z*W+a]||!m[b*W+x]))continue;
   const c=g[i]+(dx&&dz?1.4142:1);if(c<g[j]){g[j]=c;par[j]=i;hpush(c+hh(a,b),j)}}}
 if(par[t]<0&&s!==t)return null;
 const p=[];for(let i=t;i!==-1;i=par[i])p.push(i);return p.reverse()}
function navSimp(p,eps){if(p.length<3)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
 while(st.length){const[a,b]=st.pop();let md=0,mi=-1;const ax=p[a][0],az=p[a][1],dx=p[b][0]-ax,dz=p[b][1]-az,l2=dx*dx+dz*dz||1;
  for(let i=a+1;i<b;i++){const t=clamp(((p[i][0]-ax)*dx+(p[i][1]-az)*dz)/l2,0,1),d=Math.hypot(p[i][0]-ax-dx*t,p[i][1]-az-dz*t);if(d>md){md=d;mi=i}}
  if(md>eps){keep[mi]=1;st.push([a,mi],[mi,b])}}
 return p.filter((_,i)=>keep[i])}
const navLen=p=>{let s=0;for(let i=1;i<p.length;i++)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return s},
 navLeg=(m,pts,txt)=>({m,pts,len:navLen(pts),txt});
function navMid(p){const h=navLen(p)/2;let s=0;for(let i=1;i<p.length;i++){const l=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(s+l>=h){const u=(h-s)/(l||1);return[p[i-1][0]+(p[i][0]-p[i-1][0])*u,p[i-1][1]+(p[i][1]-p[i-1][1])*u]}s+=l}return p[p.length-1]}
function navDrive(a,b,lab){
 const mk=NAVC.road,s=navSnap(mk,a[0],a[1],60),t=navSnap(mk,b[0],b[1],60),direct=[navLeg('walk',[a,b],'Ve a pie hasta '+lab+' (sin carretera)')];
 if(s<0||t<0||s===t)return direct;
 const path=navAStar(mk,s,t);if(!path)return direct;
 const sp=navXZ(s),tp=navXZ(t),L=[];
 if(Math.hypot(a[0]-sp[0],a[1]-sp[1])>10)L.push(navLeg('walk',[a,sp],'Ve a la calle'));
 L.push(navLeg('drive',navSimp(path.map(navXZ),2.5),'Conduce hasta '+lab));
 if(Math.hypot(b[0]-tp[0],b[1]-tp[1])>10)L.push(navLeg('walk',[tp,b],'Camina hasta '+lab));
 return L}
function navWalk(a,b,lab){
 const mk=NAVC.walk,s=navSnap(mk,a[0],a[1],30),t=navSnap(mk,b[0],b[1],30),direct=[navLeg('walk',[a,b],'Camina hasta '+lab)];
 if(s<0||t<0||s===t)return direct;
 const path=navAStar(mk,s,t);if(!path)return direct;
 return[navLeg('walk',navSimp([a].concat(path.map(navXZ),[b]),2.5),'Camina por las calles hasta '+lab)]}
function navSail(A,B,lab){
 const mk=NAVC.sea,s=navSnap(mk,A[0],A[1],40),t=navSnap(mk,B[0],B[1],40),direct=[navLeg('sail',[A,B],'Navega hasta '+lab)];
 if(s<0||t<0)return direct;const path=navAStar(mk,s,t);if(!path)return direct;
 return[navLeg('sail',navSimp([A].concat(path.map(navXZ),[B]),4),'Navega hasta '+lab)]}
const navReg=(x,z)=>z>600?'isl':'main',
 navNode=(r,k)=>{if(r==='main')return k==='air'?[101,332]:[343,341];const d=ISLDOCK||{x:ISL.x,z:ISL.z};return k==='air'?[290,1103]:[d.x,d.z]};
function navWater(x,z){navInit();const W=NAVC.W,cs=NAVC.cs,a=Math.floor((x-LAND0)/cs),b=Math.floor((z-LAND0)/cs);if(a<0||b<0||a>=W||b>=W)return true;return !!NAVC.water[b*W+a]}
function navPlan(dest){
 navInit();const o=[pl.x,pl.z],d=[dest.x,dest.z],ro=navReg(o[0],o[1]),rd=navReg(d[0],d[1]),old=NAV.sel;
 NAV.dest=dest;NAV.org=o;NAV.sel=null;
 const acc=(r,a,b,lab)=>r==='main'&&NAV.mode==='drive'?navDrive(a,b,lab):navWalk(a,b,lab),
  nm={main:{air:'el aeropuerto',sea:'el puerto'},isl:{air:'el aeródromo de la isla',sea:'el muelle del pueblo pesquero'}};
 if(ro===rd){NAV.routes={land:acc(ro,o,d,dest.name)};NAV.sel='land'}
 else{const mk=k=>{const A=navNode(ro,k),B=navNode(rd,k);return[...acc(ro,o,A,nm[ro][k]),...(k==='air'?[navLeg('fly',[A,B],'Vuela hasta '+nm[rd][k])]:navSail(A,B,nm[rd][k])),...acc(rd,B,d,dest.name)]};
  NAV.routes={air:mk('air'),sea:mk('sea')};if(old&&NAV.routes[old])NAV.sel=old}
 navPanelUpd()}
const navFmtD=m=>m<1000?Math.max(5,Math.round(m/5)*5)+' m':(m/1000).toFixed(1)+' km',navFmtT=s=>s<90?Math.max(5,Math.round(s/5)*5)+' s':Math.round(s/60)+' min',
 navTot=L=>{let m=0,s=0;L.forEach(l=>{m+=l.len;s+=l.len/NAVSP[l.m]+NAVOV[l.m]});return{m,s}};
function navPanelEl(){let e=document.getElementById('navPanel');if(e)return e;const h=document.getElementById('phMapLayer');if(!h)return null;e=document.createElement('div');e.id='navPanel';h.appendChild(e);return e}
function navPanelUpd(){const e=navPanelEl();if(!e)return;if(!NAV.dest){e.style.display='none';return}
 const R=NAV.routes,IC={walk:'🚶',drive:'🚗',fly:'✈️',sail:'⛵'};
 let h='<div class="nvH"><b>📍 '+NAV.dest.name+'</b><button class="nvX" title="Quitar ruta" onclick="navClear()">✕</button></div>';
 h+='<div class="nvM"><button class="'+(NAV.mode==='drive'?'on':'')+'" onclick="navMode(\'drive\')">🚗 En coche</button><button class="'+(NAV.mode==='walk'?'on':'')+'" onclick="navMode(\'walk\')">🚶 A pie</button></div>';
 if(R&&!R.land){h+='<div class="nvQ">El destino está al otro lado del mar. ¿Cómo quieres ir?</div><div class="nvB">';
  [['air','✈️ Avión / helicóptero'],['sea','⛵ Barco']].forEach(([k,t])=>{const T=navTot(R[k]);h+='<button class="'+(NAV.sel===k?'on':'')+'" onclick="navSel(\''+k+'\')">'+t+'<small>'+navFmtD(T.m)+' · ~'+navFmtT(T.s)+'</small></button>'});h+='</div>'}
 const S=R&&R[NAV.sel];
 if(S){const T=navTot(S);h+='<div class="nvT">Total: '+navFmtD(T.m)+' · ~'+navFmtT(T.s)+'</div><ol>'+S.map(l=>'<li>'+IC[l.m]+' '+l.txt+' <small>('+navFmtD(l.len)+')</small></li>').join('')+'</ol><button class="nvR" onclick="navRe()">↻ Recalcular desde mi posición</button>'}
 e.innerHTML=h;e.style.display='block'}
function navMode(m){if(NAV.mode===m)return;NAV.mode=m;if(NAV.dest)navPlan(NAV.dest);else navPanelUpd()}
function navSel(k){NAV.sel=k;navPanelUpd()}
function navClear(){NAV.dest=null;NAV.routes=null;NAV.sel=null;navPanelUpd()}
function navRe(){if(NAV.dest)navPlan(NAV.dest)}
function navPlaceName(p){return({airport:'el Aeropuerto',port:'el Puerto',gas:'Gasolinera',park:'Parking',airstrip:'el aeródromo de la isla'})[p.key]||(SHOPS[p.key]&&SHOPS[p.key].n)||'el destino'}
function navPick(e){const V=NAVV;if(!V)return;
 const r=mm.getBoundingClientRect(),px=(e.clientX-r.left)*mm.width/r.width,py=(e.clientY-r.top)*mm.height/r.height;
 let x=(px-V.s/2)/V.k+V.cx,z=(py-V.sh/2)/V.k+V.cz,name='el punto elegido',bd=18*18;
 for(const p of PLACES){const qx=(p.x-V.cx)*V.k+V.s/2,qy=(p.z-V.cz)*V.k+V.sh/2,d=(qx-px)*(qx-px)+(qy-py)*(qy-py);if(d<bd){bd=d;x=p.x;z=p.z;name=navPlaceName(p)}}
 if(name==='el punto elegido'&&navWater(x,z)){toast('Eso es mar: toca un punto en tierra');return}
 navPlan({x,z,name})}
function navDraw(tf){
 if(!NAV.dest)return;const R=NAV.routes,sets=!R?[]:NAV.sel?[[R[NAV.sel],1]]:Object.values(R).map(L=>[L,.45]);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const[L,al]of sets)for(const l of L){if(l.pts.length<2)continue;ctx.globalAlpha=al;
  ctx.beginPath();l.pts.forEach((p,i)=>{const q=tf(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});
  if(l.m==='drive'){ctx.setLineDash([]);ctx.strokeStyle='#fff';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#1a73e8';ctx.lineWidth=5.5;ctx.stroke()}
  else{ctx.setLineDash(l.m==='walk'?[2,6]:[10,7]);ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=5.5;ctx.stroke();ctx.strokeStyle=l.m==='walk'?'#fff':l.m==='fly'?'#c58bff':'#37e6e6';ctx.lineWidth=3.4;ctx.stroke()}
  if(l.m==='fly'||l.m==='sail'){const a=navMid(l.pts),q=tf(a[0],a[1]);ctx.setLineDash([]);ctx.font='20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l.m==='fly'?'✈️':'⛵',q[0],q[1])}}
 ctx.restore();
 const q=tf(NAV.dest.x,NAV.dest.z);ctx.save();ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('📍',q[0],q[1]+5);ctx.restore()}

// =================================================================================================
// 23. DÍA/NOCHE Y CLIMA
//     Hora del día, tiempo (sol, nubes, lluvia), luces de las farolas y sombras.
// =================================================================================================
let tod=9,wx=0,wxT=0;
const WX=[{n:'Soleado',i:'☀️',cl:.25,gr:0,dim:1,rain:0},{n:'Nublado',i:'☁️',cl:1,gr:.5,dim:.85,rain:0},{n:'Lluvia',i:'🌧️',cl:1,gr:.85,dim:.7,rain:1}],cur={cl:.25,gr:0,dim:1,rain:0};
const C1=new THREE.Color(),C2=new THREE.Color(),C3=new THREE.Color(),C4=new THREE.Color();
const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,fog:false}),clouds=[];
for(let i=0;i<28;i++){const g=new THREE.Group();for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(rr(14,24),8,6),cloudMat);m.scale.y=.35;m.position.set(k*16-24,rr(-2,3),rr(-8,8));g.add(m)}
 g.position.set(rr(-250,500),rr(70,95),rr(-250,1100));g.userData.sp=rr(2,5);scene.add(g);clouds.push(g)}
const RN=1800,rx=new Float32Array(RN),ry=new Float32Array(RN),rz=new Float32Array(RN),rp=new Float32Array(RN*6);
for(let i=0;i<RN;i++){rx[i]=rr(-30,30);ry[i]=rr(0,40);rz[i]=rr(-30,30)}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rp,3));
const rainMesh=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xaac4e0,transparent:true,opacity:.55}));rainMesh.frustumCulled=false;scene.add(rainMesh);
const pLight=new THREE.PointLight(0xffe0b0,0,16);scene.add(pLight);
const lampLights=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffc27a,0,22,1.4);if(IS_TOUCH)l.visible=false;else scene.add(l);return l});
function lampLightUpd(night,off){if(IS_TOUCH)return;const b=[];for(let i=0;i<LAMPS.length;i++){const L=LAMPS[i],d=(L.x-pl.x)*(L.x-pl.x)+(L.z-pl.z)*(L.z-pl.z);if(b.length<3||d<b[b.length-1][0]){b.push([d,i]);b.sort((p,q)=>p[0]-q[0]);if(b.length>3)b.pop()}}
 lampLights.forEach((l,k)=>{const e=b[k];if(!e||off){l.intensity=0;return}const L=LAMPS[e[1]];l.position.set(L.x,L.y-.3,L.z);l.intensity=night*1.5*clamp(1-Math.sqrt(e[0])/30,0,1)})}
const hl=new THREE.SpotLight(0xfff2cc,0,45,.55,.5);if(!IS_TOUCH){scene.add(hl);scene.add(hl.target)}
let shdT=9,shF=0;
function shadowify(){scene.traverse(o=>{if(!o.isMesh||o.userData._sh||o.userData.sp!==undefined)return;o.userData._sh=1;for(const q of[].concat(o.material)){if(q&&q.map&&EMM.has(q.map.image)&&!q.userData._w){q.userData._w=1;q.emissiveMap=EMM.get(q.map.image);q.emissive.setHex(0xffd9a0);q.emissiveIntensity=0;q.needsUpdate=true;WINM.push(q)}}const m=Array.isArray(o.material)?o.material[0]:o.material,g=o.geometry;if(!m||!g||m.transparent)return;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox,sy=b.max.y-b.min.y;o.receiveShadow=true;if(sy>.6&&Math.max(b.max.x-b.min.x,b.max.z-b.min.z)<400)o.castShadow=true})}
function toggleCine(){ren.toneMapping=ren.toneMapping?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)});toast('Tono de cine: '+(ren.toneMapping?'activado':'desactivado'))}
function toggleShadows(){ren.shadowMap.enabled=!ren.shadowMap.enabled;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)});toast('Sombras: '+(ren.shadowMap.enabled?'activadas':'desactivadas'))}
function updEnv(dt){qMon();
 const ug=py<-1.5||(inCar&&(inCar.y||0)<-1.5);bankTick();
 const T=WX[wx];for(const k in cur)cur[k]+=(T[k]-cur[k])*Math.min(1,.4*dt);
 const s=Math.sin((tod-6)/24*2*Math.PI),d=clamp((s+.15)/.5,0,1),tw=clamp(1-Math.abs(s)/.3,0,1),night=1-d;
 C1.set(0x0a1230).lerp(C2.set(0x9ccbe8),d).lerp(C3.set(0xf0a070),tw*.55).lerp(C4.set(0x7b8794).multiplyScalar(.15+.85*d),cur.gr*.8);
 scene.background.copy(C1);scene.fog.color.copy(C1);scene.fog.near=150-100*cur.rain;scene.fog.far=520-260*cur.rain;
 hemi.intensity=(.24+.5*d)*cur.dim;hemi.color.setHex(0xdfeaff).lerp(C2.set(0x6070b0),night);if(ug)hemi.intensity=.55;lampMat.color.setHex(0x555a60).lerp(LAMP_ON,night);if(TLU)TLU(night);poolMat.opacity=night*.4*(1-cur.rain*.25);haloMat.opacity=night*(.85+cur.rain*.15);haloMat.size=3.6+cur.rain*1.4;lampLightUpd(night,ug||inRoom(pl.x,pl.z));
 const a=(tod-6)/12*Math.PI;{const fx=Math.round((inCar?inCar.x:pl.x)/4)*4,fz=Math.round((inCar?inCar.z:pl.z)/4)*4,fy=inCar?(inCar.y||0):py;sun.target.position.set(fx,fy,fz);sun.position.set(fx+Math.cos(a)*120,fy+Math.max(14,Math.sin(a)*120),fz+40)}sun.intensity=ug?0:1.1*d*(1-cur.gr*.8);if(IS_TOUCH){ren.shadowMap.autoUpdate=false;if(sun.intensity>.02&&((shF=(shF+1)%2)===0))ren.shadowMap.needsUpdate=true}else ren.shadowMap.autoUpdate=sun.intensity>.02;if((shdT+=dt)>(IS_TOUCH?5:1.5)){shdT=0;shadowify()}sun.color.setHex(0xfff2dd).lerp(C3.set(0xff9a50),tw*.7);
 skyUpd(d,tw,night,a);{const wi=night*.9*(1-cur.gr*.3);for(const q of WINM)q.emissiveIntensity=wi}cloudMat.color.setHex(0xffffff).lerp(C4.set(0x555a62),cur.gr*.9).multiplyScalar(.25+.75*d);
 const nc=IS_TOUCH?Math.round(3+cur.cl*8):Math.round(6+cur.cl*22);clouds.forEach((c,i)=>{c.visible=i<nc;c.position.x+=c.userData.sp*dt;if(c.position.x>500)c.position.x=-300});
 const rm=inRoom(pl.x,pl.z);pLight.position.set(pl.x,py+2.2,pl.z);pLight.intensity=Math.max(night*(rm?1.1:.5),ug?.9:0);
 carLightsUpd(night);
 if(inCar&&night>.2){const c=inCar;hl.intensity=night*1.6;hl.position.set(c.x+Math.sin(c.h)*2,1,c.z+Math.cos(c.h)*2);hl.target.position.set(c.x+Math.sin(c.h)*15,0,c.z+Math.cos(c.h)*15)}else hl.intensity=0;
 const n=Math.floor(RN*cur.rain);rainMesh.visible=n>90&&!rm;
 if(rainMesh.visible){rainMesh.position.set(pl.x,py,pl.z);for(let i=0;i<n;i++){ry[i]-=38*dt;if(ry[i]<0)ry[i]+=40;const o=i*6;rp[o]=rx[i];rp[o+1]=ry[i];rp[o+2]=rz[i];rp[o+3]=rx[i]-.1;rp[o+4]=ry[i]+1.1;rp[o+5]=rz[i]}
  rainGeo.setDrawRange(0,n*2);rainGeo.attributes.position.needsUpdate=true}
 DOORS.forEach(d=>{if(d.shop&&d.open&&!isOpen(d.shop)&&Math.hypot(pl.x-d.x,pl.z-d.z)>3){d.open=false;d.col.on=true}});const hh=Math.floor(tod),mi=Math.floor((tod%1)*60);setTx($('clk'),(hh<10?'0':'')+hh+':'+(mi<10?'0':'')+mi+' '+(d<.3?'🌙 ':'')+T.i+' '+T.n)}
