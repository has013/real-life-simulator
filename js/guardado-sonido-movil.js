/* ===============================================================================================
   FICHA · guardado-sonido-movil.js
   Qué hay:          Guardado de la partida (29), sonido y radio (30), el teléfono móvil del jugador dentro del juego (31) y el arranque (32).
   Tócalo si quieres: guardar algo nuevo en la partida, cambiar sonidos, añadir una app al móvil del juego
   Ojo:              Si añades algo que se tenga que guardar (dinero, objetos, flags...), mira aquí saveGame/loadGame.
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 29. GUARDADO DE LA PARTIDA
//     Guardar y cargar la partida en el navegador (localStorage): cada 30 s y al salir o cambiar de pestaña.
// =================================================================================================
const SAVE_KEY='rls_save',SAVE_VER=1;let noSave=false,lastPos=null;
function gatherState(){
 if(!riding){if(inCar){const c=inCar;lastPos={x:c.x+Math.cos(c.h)*3,z:c.z-Math.sin(c.h)*3,py:c.y||0}}else lastPos={x:pl.x,z:pl.z,py:py}}
 return {v:SAVE_VER,isv:1,pets:pets.map(p=>({t:p.t,n:p.name,c:p.col,h:Math.round(p.hunger),p:Math.round(p.hap),w:Object.assign({},p.wear)})),money,loan,hunger,thirst,energy,tod,wx,pl:lastPos,
  inv:JSON.parse(JSON.stringify(inv)),worn:Object.assign({},worn),placed:Object.assign({},placed),wh:Object.assign({},wh),flags:Object.assign({},flags),jx:Object.assign({},jx),sk:Object.assign({},skills),fh:JSON.parse(JSON.stringify(HOLD)),fd:fishDay,
  houses:HOUSES.filter(h=>h.owned).map(h=>({x:h.x,z:h.z,m:h.mode||'own',late:h.late||0,mt:h.mort||null,lv:h.lv||0,tl:h.till||0,ty:h.ty||'',sk:Object.assign({},h.stock||{})})),
  terrenos:TERRENOS.filter(t=>t.owned).map(t=>({id:t.id,b:bmSer(t),bz:t.biz&&t.biz.ty?{ty:t.biz.ty,lv:t.biz.lv||1,tl:Math.round(t.biz.till||0),sk:Object.assign({},t.biz.stock||{})}:null})),
  cars:cars.filter(c=>c.owned).map(c=>({t:c.t,col:c.col,lm:c.lm||0,lt:c.lt||0,x:c.x,z:c.z,y:c.y||0,h:c.h,fuel:c.fuel}))}}
function saveGame(){if(noSave||!started)return;
 try{const st=gatherState();st.at=Date.now();const js=JSON.stringify(st);
  if(ACC.ok){try{localStorage.setItem(SAVE_KEY+':'+ACC.uid,js)}catch(e){} // copia en este dispositivo, por si se juega sin conexión
   if(MP.ws&&MP.ws.readyState===1)MP.ws.send('{"type":"save","data":'+js+'}')} // la partida de la cuenta se guarda en el servidor (24.4)
  else localStorage.setItem(SAVE_KEY,js); // sin cuenta (juego abierto como archivo): solo en este dispositivo
  const d=new Date();$('savemsg').textContent='💾 Guardado a las '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}catch(e){console.warn('No se pudo guardar',e)}}
function loadGame(src){ // src: partida ya leída (del servidor o de este dispositivo); sin src, la de este dispositivo
 let s;if(src&&typeof src==='object')s=src;else try{s=JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){return false}
 if(!s||typeof s!=='object')return false;
 if(!s.isv){const mv=o=>{if(o&&typeof o.z==='number'&&o.z>=540)o.z+=ISLDZ};mv(s.pl);(s.houses||[]).forEach(mv);(s.cars||[]).forEach(mv)} // la isla se ha alejado: partidas guardadas antes del cambio
 try{
  if(typeof s.money==='number')money=s.money;
  if(s.fh&&typeof s.fh==='object'){for(const n in s.fh){const h=s.fh[n];if(h&&typeof h==='object'){const o={};FISH.forEach(f=>{const v=Number(h[f.k]);if(v>0&&isFinite(v))o[f.k]=Math.round(Math.min(v,FISHCAP)*10)/10});HOLD[n]=o}}}if(typeof s.fd==='number')fishDay=s.fd|0;
  loan=(s.loan&&typeof s.loan.left==='number'&&typeof s.loan.n==='number'&&typeof s.loan.cuota==='number')?s.loan:null;if(typeof s.tod==='number')prevTod=s.tod;
  if(typeof s.hunger==='number')hunger=s.hunger;
  thirst=100;
  if(typeof s.energy==='number')energy=s.energy;
  if(typeof s.tod==='number')tod=s.tod;
  if(typeof s.wx==='number')wx=s.wx;
  Object.assign(inv,s.inv||{});Object.assign(worn,s.worn||{});Object.assign(placed,s.placed||{});{let nb=0;for(const k of Object.keys(placed)){const n=placed[k]|0;if(n>0&&Object.prototype.hasOwnProperty.call(FURN,k)){const o=inv[k]||(inv[k]={n:0,cat:'Muebles',act:'Colocar en casa'});o.n+=n;nb+=n}delete placed[k]}if(nb)setTimeout(()=>toast('🛋️ Tus '+nb+' muebles antiguos vuelven al inventario: ahora puedes colocarlos de verdad en tu terreno'),1500)}Object.assign(wh,s.wh||{});Object.assign(flags,s.flags||{});Object.assign(jx,s.jx||{});
  if(s.sk&&typeof s.sk==='object')SKILLS.forEach(q=>{const v=Number(s.sk[q.k]);if(Number.isFinite(v)&&v>0)skills[q.k]=Math.floor(v)});
  (s.houses||[]).forEach(o=>{let best=null,bd=3;HOUSES.forEach(h=>{const d=Math.hypot(h.x-o.x,h.z-o.z);if(d<bd){bd=d;best=h}});if(best){best.owned=true;best.mode=o.m||'own';best.late=o.late||0;best.lv=o.lv||1;best.till=o.tl||0;best.stock=Object.assign({},o.sk||{});best.ty=(best.local&&LTYPES[o.ty])?o.ty:'';if(best.ty)localIn(best,best.ty);best.mort=(o.mt&&typeof o.mt.left==='number')?o.mt:null;if(best.mode==='mort'&&!best.mort)best.mode='own';setHouseColor(best,best.local?0xf1c40f:best.mode==='rent'?0x2f7fe0:0x22aa44)}});
  (s.terrenos||[]).forEach(o=>{const id=(o&&typeof o==='object')?o.id:o,t=TERRENOS.find(q=>q.id===id);if(t){t.setOwned(true);if(o&&o.b)bmDes(t,o.b);t.biz=null;const z=o&&o.bz;if(z&&LTYPES[z.ty])t.biz={id:100000+t.id,ty:z.ty,lv:Math.max(1,Math.min(5,Math.floor(Number(z.lv))||1)),till:Math.max(0,Number(z.tl)||0),stock:Object.assign({},z.sk||{})}}});
  (s.cars||[]).forEach(o=>{if(!SPEC[o.t])return;spawnCar(o.t,o.col,o.x,o.z,o.h||0,'parked',{owned:true,col:o.col,fuel:o.fuel,y:o.y||0,lm:o.lm||0,lt:o.lt||0})});
  if(s.pl){pl.x=s.pl.x;pl.z=s.pl.z;py=s.pl.py||0;vy=0;body.position.set(pl.x,py,pl.z);lastPos=s.pl}
  (s.pets||[]).slice(0,PET_MAX).forEach(o=>{if(o&&PET_T[o.t]){const pp=addPet(o.t,petClean(o.n)||'Mascota',typeof o.c==='number'?o.c:PET_T[o.t].col[0],typeof o.h==='number'?o.h:80,typeof o.p==='number'?o.p:70);if(pp&&o.w&&typeof o.w==='object'){Object.keys(o.w).forEach(sl=>{const nm=o.w[sl];if(PET_CLOTH[nm]&&PET_CLOTH[nm].slot===sl)pp.wear[sl]=nm});petDress(pp)}}});
  applyOutfit();
 }catch(e){console.error('Error al cargar',e);return false}
 return true}
$('delsave').addEventListener('click',e=>{e.stopPropagation();if(!confirm('¿Seguro que quieres borrar tu partida guardada? No se puede deshacer.'))return;
 const done=()=>{try{localStorage.removeItem(SAVE_KEY);if(ACC.uid)localStorage.removeItem(SAVE_KEY+':'+ACC.uid)}catch(_){}location.reload()};
 if(!ACC.ok){noSave=true;done();return}
 if(!accSend({type:'save_delete'}))return; // con cuenta: se borra en el servidor y después en este dispositivo
 noSave=true;ACC.onDeleted=done;setTimeout(()=>{if(ACC.onDeleted){ACC.onDeleted=null;noSave=false;toast('El servidor no ha respondido: la partida no se ha borrado')}},5000)});
if(location.protocol==='file:'&&loadGame()){$('savemsg').textContent='💾 Partida guardada cargada';toast('Partida cargada')} // online, la partida se carga al iniciar sesión (24.4)
setInterval(saveGame,30000);
addEventListener('beforeunload',saveGame);addEventListener('pagehide',saveGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)saveGame()});

// =================================================================================================
// 30. SONIDO
//     Efectos de sonido con Web Audio y radio del coche (3 emisoras generadas).
// =================================================================================================
let stepPh=0;
const sfx=(()=>{let ac=null,mg=null,nb=null,bn=null,muted=false,L=null,nextEv=0,nextCk=0,R={st:0,n:0,next:0,g:null,f:null,out:null,txt:''};try{muted=localStorage.getItem('rls_mute')==='1'}catch(e){}
 function init(){if(ac){if(ac.state==='suspended')ac.resume();return}
  try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();mg=ac.createGain();mg.gain.value=muted?0:.6;mg.connect(ac.destination);
   nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   bn=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate);const b=bn.getChannelData(0);let l=0;for(let i=0;i<b.length;i++){l=(l+.02*(Math.random()*2-1))/1.02;b[i]=l*3.5}
   buildLayers()}catch(e){ac=null}}
 const ok=()=>ac&&!muted;
 const T=(p,v,tc)=>p.setTargetAtTime(v,ac.currentTime,tc||.15);
 function loopNoise(buf,type,f,q){const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(q)fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(mg);s.start();return{fl,g}}
 function buildLayers(){
  // Motor: dos osciladores + filtro paso bajo
  const o1=ac.createOscillator(),o2=ac.createOscillator(),o3=ac.createOscillator(),ef=ac.createBiquadFilter(),eg=ac.createGain();
  o1.type='sawtooth';o2.type='square';o3.type='sawtooth';ef.type='lowpass';ef.frequency.value=400;ef.Q.value=2;eg.gain.value=0;
  o1.frequency.value=40;o2.frequency.value=20;o3.frequency.value=41;
  const m2=ac.createGain(),m3=ac.createGain();m2.gain.value=.5;m3.gain.value=.5;
  o1.connect(ef);o2.connect(m2);m2.connect(ef);o3.connect(m3);m3.connect(ef);ef.connect(eg);eg.connect(mg);o1.start();o2.start();o3.start();
  const rain=loopNoise(nb,'bandpass',3000,.5),rumble=loopNoise(bn,'lowpass',220),wind=loopNoise(bn,'bandpass',700,.7);
  const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=.11;lg.gain.value=.012;lfo.connect(lg);lg.connect(wind.g.gain);lfo.start();
  R.f=ac.createBiquadFilter();R.f.type='lowpass';R.f.frequency.value=9000;R.out=ac.createGain();R.out.gain.value=0;R.f.connect(R.out);R.out.connect(mg);newBus();
  L={o1,o2,o3,ef,eg,rain,rumble,wind,jet:loopNoise(bn,'bandpass',500,.5),smooth:1}}
 // ---------- RADIO (3 emisoras generadas) ----------
 const RNAMES=['Radio apagada','📻 1 · Pop FM','📻 2 · Lo-Fi FM','📻 3 · Techno 24h'],RBPM=[0,118,76,128],RVOL=[0,.6,.9,.55],RLP=[0,9000,3200,9000];
 const mtof=m=>440*Math.pow(2,(m-69)/12);
 function newBus(){if(R.g)try{R.g.disconnect()}catch(e){}R.g=ac.createGain();R.g.gain.value=RVOL[R.st]||.6;R.g.connect(R.f)}
 function rt(t,type,f,dur,vol,o){o=o||{};const os=ac.createOscillator(),g=ac.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(o.f1)os.frequency.exponentialRampToValueAtTime(o.f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.005));g.gain.exponentialRampToValueAtTime(.0001,t+dur);let n=os;
  if(o.lp){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(o.lp0||o.lp,t);if(o.lp0)fl.frequency.exponentialRampToValueAtTime(o.lp,t+dur);if(o.q)fl.Q.value=o.q;os.connect(fl);n=fl}
  n.connect(g);g.connect(R.g);os.start(t);os.stop(t+dur+.05)}
 function rn(t,dur,type,f,vol,q){const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(q)fl.Q.value=q;const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(R.g);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
 const kick=(t,v)=>{rt(t,'sine',150,.16,v,{f1:42});rn(t,.02,'highpass',2000,v*.15)};
 const clap=(t,v)=>{for(let k=0;k<3;k++)rn(t+k*.011,.05,'bandpass',1500,v,1.2);rn(t+.03,.14,'bandpass',1300,v*.7,1)};
 const hat=(t,op,v)=>rn(t,op?.13:.04,'highpass',7000,v);
 const POPC=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],POPB=[45,41,48,43],PENT=[69,72,74,76,79];
 const LOC=[[53,57,60,64],[55,59,62,65],[52,55,59,64],[57,60,64,67]],LOB=[38,43,40,45],LPEN=[74,77,79,81,84];
 const ACID=[45,45,57,45,48,45,60,45,43,43,55,43,48,45,52,57];
 const STEPS=[null,
  function(n,t){const i=n%16,b=Math.floor(n/16),bar=b%4,ch=POPC[bar];
   if(i%4===0)kick(t,.8);if(i===4||i===12)clap(t,.16);if(i%2===0)hat(t,i%4===2,i%4===2?.05:.022);
   if([0,3,6,10,12].includes(i))rt(t,'sawtooth',mtof(POPB[bar]+(i===6||i===14?12:0)),.2,.12,{lp:550});
   if(i%2===0){const ix=[0,1,2,1,0,1,2,1][(i/2)%8];rt(t,'square',mtof(ch[ix]+12),.14,.03,{lp:2600})}
   if(i===0)ch.forEach(m=>rt(t,'sawtooth',mtof(m),2,.018,{a:.25,lp:1000}));
   if(i===0||i===6||i===10){const m=PENT[(b*7+i)%5];rt(t,'triangle',mtof(m),.32,.06,{lp:3500})}},
  function(n,t0){const i=n%16,b=Math.floor(n/16),bar=b%4,t=t0+(i%2?.04:0),ch=LOC[bar];
   if(i===0||i===10)kick(t,.55);if(i===8){rn(t,.16,'bandpass',1200,.09,.8);rt(t,'triangle',190,.1,.06,{f1:120})}
   if(i%2===0)hat(t,false,.016+(i%4===0?.008:0));
   if(i===0||i===8)rt(t,'sine',mtof(LOB[bar]),.5,.2);
   if(i===0||i===10||(i===6&&b%2))ch.forEach((m,k)=>{rt(t+k*.012,'sine',mtof(m),1.2,.04,{a:.01});rt(t+k*.012,'triangle',mtof(m+12),.7,.012,{lp:2200})});
   if(i%4===2&&((b*13+i*7)%10)<4)rt(t,'sine',mtof(LPEN[(b+i)%5]),.6,.035,{a:.02});
   if(Math.random()<.4)rn(t+Math.random()*.19,.01,'highpass',3000,.03)},
  function(n,t){const i=n%16,b=Math.floor(n/16),bar=b%4;
   if(i%4===0)kick(t,.95);if(i%4===2)hat(t,true,.05);else if(i%2===1)hat(t,false,.014);
   if(i===4||i===12)clap(t,.3);if((i===7||i===15)&&b%2)rn(t,.05,'bandpass',3500,.06,3);
   rt(t,'sawtooth',mtof(ACID[i]),.1,i%4===0?.1:.07,{lp:180,lp0:600+1500*Math.abs(Math.sin(n/37)),q:12});
   if(b%2===1&&(i===3||i===10)){const o=[0,0,-2,-4][bar];[57,60,64].forEach(m=>rt(t,'square',mtof(m+o),.12,.025,{lp:1800}))}}];
 function radioKey(car){if(!car)return null;if(car.t==='moto')return'🏍 La moto no tiene radio';if(!ac)init();if(!ac)return null;
  R.st=(R.st+1)%4;R.n=0;R.next=0;newBus();R.f.frequency.value=RLP[R.st]||9000;R.txt='';
  if(!muted){const t=ac.currentTime;noise(t,.3,'bandpass',2500,800,.14,1);tone(t,'sine',900,3200,.22,.025)}
  return RNAMES[R.st]+(R.st?'':' ('+'C: encender)')}
 function radioStep(c,t,run){
  const on=!!(c&&run&&R.st>0&&!muted);T(R.out.gain,on?1:0,.08);
  if(!on){R.next=0;return}
  if(R.next<t-.2)R.next=t+.05;const sd=60/RBPM[R.st]/4;
  while(R.next<t+.25){STEPS[R.st](R.n,R.next);R.n++;R.next+=sd}}
 function radioHud(c,run){const e=document.getElementById('radio');if(!e)return;const show=!!(c&&run&&c.t!=='moto');e.style.display=show?'block':'none';
  if(show){const tx=RNAMES[R.st]+(R.st?'  · C: cambiar':'  · C: encender');if(tx!==R.txt){R.txt=tx;e.textContent=tx}}}
 function chirp(t,f){const n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++){tone(t+i*.11,'sine',f*(1+Math.random()*.15),f*(1.25+Math.random()*.3),.07,.018)}}
 function update(o){
  if(!ac||!L)return;const run=o.run&&!muted,t=ac.currentTime;
  const sn=Math.sin((o.tod-6)/24*2*Math.PI),d=Math.min(1,Math.max(0,(sn+.15)/.5)),night=1-d;
  const car=o.car,inside=!!car||o.indoor||o.ug;
  // Motor
  const c=car&&car.spec&&car.mode==='player'&&!car.spec.nf?car:null;
  radioStep(c,t,o.run);radioHud(c,o.run);
  if(c&&run&&c.fuel>0){
   const mx=c.spec.max,sp=Math.min(1,Math.abs(c.v)/mx),gears=c.t==='moto'?4:5,g=Math.min(gears-1,Math.floor(sp*gears)),fr=sp*gears-g;
   const rpm=Math.min(1,(c.v<0?.35+sp*3:.28+.62*fr+(g>0?.08*g/gears:0))+.1*o.thr);
   const mult={hatch:1,sport:1.18,van:.82,moto:1.75}[c.t]||1,f=(38+rpm*92)*mult;
   T(L.o1.frequency,f,.05);T(L.o2.frequency,f*.5,.05);T(L.o3.frequency,f*1.012,.05);
   T(L.ef.frequency,260+rpm*900+o.thr*300,.08);
   T(L.eg.gain,(.05+.085*rpm)*(.65+.35*(o.thr||sp)),.08)}
  else if(o.boat&&run){const b=o.boat,sv=Math.min(1,Math.abs(b.v)/b.spec.max),rpm=Math.min(1,.22+.62*sv+.16*o.thr),f=24+rpm*(b.type==='lancha'?105:70);
   T(L.o1.frequency,f,.06);T(L.o2.frequency,f*.5,.06);T(L.o3.frequency,f*1.015,.06);T(L.ef.frequency,170+rpm*650,.1);T(L.eg.gain,.04+.075*rpm,.1)}
  else T(L.eg.gain,0,.1);
  // Lluvia (apagada/amortiguada dentro de edificios y coche)
  const rv=run?o.rain*(car?.07:o.indoor?.05:o.ug?0:.2):0;
  T(L.rain.g.gain,rv,.6);T(L.rain.fl.frequency,inside?1200:3200,.3);
  // Ambiente de ciudad
  const cv=run?(o.ug?.02:o.indoor?.05:car?.07:.15)*(.55+.45*d)*(1-.4*o.rain):0;
  T(L.rumble.g.gain,cv,.8);
  T(L.wind.g.gain,run&&!inside?.025+.02*o.rain:0,1);
  T(L.jet.g.gain,run?Math.min(.9,(o.jet||0)*.9):0,.25);T(L.jet.fl.frequency,320+(o.jet||0)*700,.3);
  // Eventos sueltos: pájaros de día, grillos de noche, bocinas lejanas
  if(run&&!inside&&t>nextEv){
   nextEv=t+4+Math.random()*10;
   if(o.rain<.3&&d>.5)chirp(t,2400+Math.random()*1200);
   else if(Math.random()<.35&&d>.3){const f=330+Math.random()*60;tone(t,'square',f,null,.28,.012);tone(t+.02,'square',f*1.26,null,.28,.01)}}
  if(run&&!inside&&night>.5&&o.rain<.3&&t>nextCk){nextCk=t+.9;for(let i=0;i<3;i++)tone(t+i*.12,'sine',4300,null,.05,.007)}}

 function noise(t0,dur,type,f0,f1,vol,q){const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const f=ac.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f0,t0);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t0+dur);if(q)f.Q.value=q;
  const g=ac.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(g);g.connect(mg);s.start(t0,Math.random()*.5);s.stop(t0+dur+.02)}
 function tone(t0,type,f0,f1,dur,vol){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t0);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(mg);o.start(t0);o.stop(t0+dur+.02)}
 return{init,update,radioKey,
  isMuted:()=>muted,
  toggle(){muted=!muted;try{localStorage.setItem('rls_mute',muted?'1':'0')}catch(e){}if(mg)mg.gain.value=muted?0:.6;return muted},
  step(run){if(!ok())return;const t=ac.currentTime;noise(t,run?.07:.09,'lowpass',(run?900:600)*(.8+Math.random()*.4),200,run?.3:.22)},
  door(open){if(!ok())return;const t=ac.currentTime;
   if(open){noise(t,.04,'highpass',2500,null,.12);tone(t+.03,'triangle',70,115,.3,.05);noise(t+.03,.28,'bandpass',400,900,.1,3)}
   else{tone(t,'sine',140,45,.16,.4);noise(t,.1,'lowpass',500,150,.3)}},
  cash(){if(!ok())return;const t=ac.currentTime;
   noise(t,.03,'highpass',3000,null,.16);noise(t+.02,.16,'bandpass',1500,400,.07,2);
   tone(t+.06,'triangle',1568,null,.5,.13);tone(t+.14,'triangle',2093,null,.6,.11)}}})();
function sndLabel(){$('sndbtn').textContent=sfx.isMuted()?'🔇 Sonido: silenciado':'🔊 Sonido: activado'}
sndLabel();
$('sndbtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();sfx.toggle();sndLabel()});
// calidad gráfica: Auto (baja sola si los FPS caen) / Baja / Media / Alta
const QUAL=[{n:'Baja',pr:1,sh:0,sz:1024,r:50,tr:.35},{n:'Media',pr:1.25,sh:1,sz:1024,r:60,tr:.7},{n:'Alta',pr:1.5,sh:1,sz:2048,r:70,tr:1}];
let qMode='auto',qi=2,qFr=0,qT=0;
function qLabel(){$('qbtn').textContent='🎛️ Calidad: '+(qMode==='auto'?'Auto ('+QUAL[qi].n+')':QUAL[qi].n)}
function setQ(i){const q=QUAL[i],was=ren.shadowMap.enabled;qi=i;ren.setPixelRatio(Math.min(devicePixelRatio,q.pr));ren.setSize(innerWidth,innerHeight);ren.shadowMap.enabled=!!q.sh;
 if(sun.shadow.mapSize.x!==q.sz){sun.shadow.mapSize.set(q.sz,q.sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
 const c=sun.shadow.camera;c.left=-q.r;c.right=q.r;c.top=q.r;c.bottom=-q.r;c.updateProjectionMatrix();
 (globalThis.QINST||[]).forEach(m=>{m.count=Math.max(1,Math.floor(m.userData.full*q.tr))});
 if(was!==ren.shadowMap.enabled)scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)});qLabel()}
function qMon(){if(qMode!=='auto'||!started||document.hidden||ov.style.display!=='none'){qFr=0;qT=0;return}const t=performance.now();if(!qT){qT=t;qFr=0;return}qFr++;if(t-qT>=(IS_TOUCH?3000:5000)){const f=qFr*1000/(t-qT);qFr=0;qT=t;if(f<Math.min(IS_TOUCH?40:28,fpsCap?fpsCap*.8:99)&&qi>0){setQ(qi-1);toast('Calidad bajada a '+QUAL[qi].n+' (FPS bajos)')}}}
$('qbtn').addEventListener('click',e=>{e.stopPropagation();const o=['auto',0,1,2];qMode=o[(o.indexOf(qMode)+1)%4];try{localStorage.setItem('rls_q',String(qMode))}catch(x){}setQ(qMode==='auto'?2:qMode)});
{let sv=null;try{sv=localStorage.getItem('rls_q')}catch(x){}qMode=sv==='0'||sv==='1'||sv==='2'?+sv:'auto';setQ(qMode==='auto'?2:qMode)}
function toggleSound(){sfx.init();const m=sfx.toggle();sndLabel();toast(m?'🔇 Sonido silenciado':'🔊 Sonido activado')}
addEventListener('keydown',e=>{sfx.init();if(e.code==='KeyC'&&started&&!e.repeat&&inCar){const m=sfx.radioKey(inCar);if(m)toast(m)}});
addEventListener('pointerdown',()=>sfx.init());

// =================================================================================================
// 31. MÓVIL DEL JUGADOR
//     Teléfono del juego (tecla M): pantalla de inicio y apps de chat, mapa y opciones.
// =================================================================================================
(function(){
const st=document.createElement('style');
st.textContent=`
#phoneMini{position:fixed;top:12px;right:12px;width:54px;height:100px;box-sizing:border-box;border:3px solid #111;border-radius:12px;background:linear-gradient(165deg,#1f4fb5,#6a2fae 55%,#d94d86);box-shadow:0 0 0 1px #ffffff66,0 3px 10px #0008;z-index:35;cursor:pointer;color:#fff;font:700 13px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px 0 5px;user-select:none;text-shadow:0 1px 2px #0008}
#phoneMini:hover{transform:scale(1.06)}
#phoneMini .pmk{font:700 10px system-ui;background:#0006;border-radius:6px;padding:1px 6px}
#phoneMini .pmi{font-size:16px;letter-spacing:1px}
#phoneWrap{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
#phone{height:min(640px,92vh);width:calc(min(640px,92vh)*.4865);aspect-ratio:9/18.5;box-sizing:border-box;border:9px solid #101114;border-radius:38px;background:#000;box-shadow:0 0 0 2px #666,0 20px 60px #000c;position:relative;overflow:hidden;color:#fff;font-family:system-ui,sans-serif;user-select:none}
#phScreen{position:absolute;inset:0;background:linear-gradient(170deg,#1f4fb5,#6a2fae 55%,#d94d86);display:flex;flex-direction:column}
#phNotch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:34%;height:20px;background:#000;border-radius:0 0 14px 14px;z-index:2}
#phStatus{display:flex;justify-content:space-between;align-items:center;padding:7px 18px 2px;font:600 12px system-ui}
#phBody{flex:1;overflow:auto;padding:12px 14px;display:flex;flex-direction:column}
#phClock{text-align:center;font:300 54px system-ui;margin:22px 0 2px;text-shadow:0 2px 8px #0006}
#phDate{text-align:center;font-size:13px;opacity:.85;margin-bottom:30px}
#phGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 6px}
.phApp{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;background:none;border:0;color:#fff;font:600 12px system-ui;padding:0}
.phApp i{font-style:normal;width:56px;height:56px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:29px;box-shadow:0 3px 8px #0006;transition:transform .1s}
.phApp:hover i{transform:scale(1.08)}
#phApp{display:none;flex-direction:column;flex:1}
#phAppHead{display:flex;align-items:center;gap:8px;font:700 17px system-ui;padding:6px 0 10px}
#phBack{width:34px;height:34px;flex:none;background:#0006;border:0;color:#fff;border-radius:50%;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}#phBack:hover{background:#000a}
#phAppBody{background:#0004;border-radius:14px;padding:14px;font-size:14px;flex:1;overflow:auto}
.phOpt{display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box;background:#ffffff1f;border:0;border-radius:12px;color:#fff;font:600 14px system-ui;padding:12px 12px;margin-bottom:9px;cursor:pointer;text-align:left}
.phOpt:hover{background:#ffffff33}.phOpt b{font-size:12px;border-radius:10px;padding:3px 9px;background:#2ecc71;color:#06280f}.phOpt b.off{background:#c0392b;color:#fff}
#chatToggle{display:none!important}
#phChatHost{display:none;flex:1;min-height:0}
#phChatHost #chatPanel{position:static;width:auto;height:auto;flex:1;border-radius:14px;box-shadow:none;border:0;background:rgba(9,18,29,.78)}
#phChatHost #chatClose{display:none}
#phoneMini{position:fixed}
#phoneMini .pmb,.phBadge{display:none;position:absolute;min-width:17px;height:17px;border-radius:9px;background:#e74c3c;color:#fff;font:700 11px/17px system-ui;text-align:center;padding:0 4px;box-sizing:border-box;box-shadow:0 0 0 2px #fff}
#phoneMini .pmb{top:-8px;right:-8px}.phBadge{top:-6px;right:-6px;font-style:normal}
#phoneMini.unread{background:#d62c1f!important;border-color:#fff;animation:phRedBlink .8s ease-in-out infinite}
#phoneMini.unread .pmi{font-size:22px}
.phApp[data-k="chat"].unread i{background:#d62c1f!important;animation:phRedBlink .8s ease-in-out infinite}
@keyframes phRedBlink{0%,100%{filter:brightness(1.15);box-shadow:0 0 0 2px #fff,0 0 16px 4px #ff3b30}50%{filter:brightness(.55);box-shadow:0 0 0 1px #fff4,0 0 4px #ff3b3055}}
.phApp i{position:relative}
#phScreen{z-index:1}
#phMapLayer{display:none;position:absolute;inset:0;z-index:3;overflow:hidden;background:#222}
#phMapLayer #mm{z-index:1}
#phMapBack{position:absolute;top:26px;left:10px;z-index:6;width:34px;height:34px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:20px;cursor:pointer}
#phMapCtl{position:absolute;right:10px;bottom:30px;z-index:6;display:flex;flex-direction:column;gap:8px}
#phMapCtl button{width:36px;height:36px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:16px;cursor:pointer}
#phMapCtl button:hover,#phMapBack:hover{background:#000d}
#phMapBar{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:90px;height:5px;border-radius:3px;background:#fffb;cursor:pointer;z-index:6}
#phoneWrap.dock{inset:auto;top:var(--dockTop,100px);right:12px;background:none;pointer-events:none;display:block;z-index:35}
#phoneWrap.dock #phone{transform:scale(.5);transform-origin:top right;box-shadow:0 0 0 2px #666,0 6px 20px #000a}
#phBar{height:5px;width:90px;background:#fffb;border-radius:3px;margin:6px auto 9px;cursor:pointer;flex:none}
`;
document.head.appendChild(st);

const mini=document.createElement('div');mini.id='phoneMini';mini.title='Móvil (tecla M)';
mini.innerHTML='<span class="pmi">📱</span><span id="phMiniT">09:00</span><span class="pmk">M</span><em class="pmb" id="phMiniBadge" style="font-style:normal"></em>';
document.body.appendChild(mini);

const APPS=[{k:'chat',n:'Chat',e:'💬',c:'#2ecc71'},{k:'map',n:'Mapa',e:'🗺️',c:'#e67e22'},{k:'opt',n:'Opciones',e:'⚙️',c:'#7f8c8d'}];
const wrap=document.createElement('div');wrap.id='phoneWrap';
wrap.innerHTML=`<div id="phone"><div id="phNotch"></div><div id="phScreen">
<div id="phStatus"><span id="phStT">09:00</span><span>📶 🔋</span></div>
<div id="phBody">
 <div id="phHome"><div id="phClock">09:00</div><div id="phDate">Real Life Simulator</div>
  <div id="phGrid">${APPS.map(a=>`<button class="phApp" data-k="${a.k}"><i style="background:${a.c}">${a.e}</i>${a.n}</button>`).join('')}</div></div>
 <div id="phApp"><div id="phAppHead"><button id="phBack" title="Volver (Retroceso)">←</button><span id="phAppT"></span></div><div id="phAppBody"></div><div id="phChatHost"></div></div>
</div>
<div id="phBar" title="Inicio"></div><div id="phMapLayer"><button id="phMapBack" title="Volver (Retroceso)">←</button><div id="phMapCtl"><button data-z="in" title="Acercar">➕</button><button data-z="out" title="Alejar">➖</button><button data-z="reset" title="Vista completa">⟲</button></div><div id="phMapBar" title="Inicio"></div></div></div></div>`;
document.body.appendChild(wrap);
const $p=id=>document.getElementById(id);
['mousedown','contextmenu'].forEach(ev=>wrap.addEventListener(ev,e=>e.stopPropagation()));
$p('phChatHost').appendChild(chatPanel);   // el chat de siempre, ahora dentro del móvil
wrap.querySelector('.phApp[data-k="chat"] i').insertAdjacentHTML('beforeend','<em class="phBadge" id="phChatBadge"></em>');

let phOpen=false,phMap=false,phDock=false;window.phDocked=false;const mapHost=$p('phMapLayer');mapHost.insertBefore(mm,mapHost.firstChild);   // el minimapa de la esquina desaparece: el mapa vive solo en el móvil
function showHome(){leaveMap();chatPanel.style.display='none';try{chatInput.blur()}catch(e){}$p('phHome').style.display='block';$p('phApp').style.display='none'}
const OPTS=[
 {n:'🎬 Tono de cine',v:()=>ren.toneMapping?'Sí':'No',on:()=>!!ren.toneMapping,f:()=>toggleCine()},
 {n:'🌗 Sombras',v:()=>ren.shadowMap.enabled?'Sí':'No',on:()=>ren.shadowMap.enabled,f:()=>toggleShadows()},
 {n:'🔊 Sonido',v:()=>sfx.isMuted()?'Silenciado':'Activado',on:()=>!sfx.isMuted(),f:()=>toggleSound()},
 {n:'🎛️ Calidad',v:()=>qMode==='auto'?'Auto ('+QUAL[qi].n+')':QUAL[qi].n,on:()=>true,f:()=>$('qbtn').click()},
 {n:'🎞️ Límite de FPS',v:()=>fpsCap?fpsCap+' FPS':'Sin límite',on:()=>true,f:()=>{const o=[0,30,45,60];fpsCap=o[(o.indexOf(fpsCap)+1)%o.length];try{localStorage.setItem('rls_fps',String(fpsCap))}catch(e){}toast(fpsCap?'Límite: '+fpsCap+' FPS (más estable)':'Sin límite de FPS')}}
];
function renderOpts(){const b=$p('phAppBody');b.innerHTML='';
 OPTS.forEach(o=>{const r=document.createElement('button');r.className='phOpt';
  r.innerHTML='<span>'+o.n+'</span><b class="'+(o.on()?'on':'off')+'">'+o.v()+'</b>';
  r.addEventListener('click',()=>{o.f();renderOpts()});b.appendChild(r)})}
function showApp(k){const a=APPS.find(x=>x.k===k),isChat=k==='chat',isMap=k==='map';$p('phAppT').textContent=a.e+' '+a.n;
 if(!isMap)leaveMap();
 $p('phAppBody').style.display=(isChat||isMap)?'none':'';$p('phChatHost').style.display=isChat?'flex':'none';mapHost.style.display=isMap?'flex':'none';
 if(isChat){chatPanel.style.display='flex';chatRead();setTimeout(()=>{const t=CT.tabs.get(CT.cur);if(t)t.box.scrollTop=t.box.scrollHeight;chatInput.focus()},0)}
 else{chatPanel.style.display='none';try{chatInput.blur()}catch(e){}
  if(k==='opt')renderOpts();else if(!isMap)$p('phAppBody').innerHTML='<p style="margin:0;opacity:.85">Próximamente.</p>'}
 $p('phHome').style.display='none';$p('phApp').style.display=isMap?'none':'flex';
 if(isMap)enterMap()}
function appOpen(k){
 if(k==='chat')showApp('chat')
 else if(k==='map')showApp('map')
 else showApp(k)}
function openPhone(){
 if(phOpen)return;
 if(!phDock&&(big||!playing()))return;
 const wasDock=phDock;
 phOpen=true;phDock=false;window.phDocked=false;wrap.classList.remove('dock');mini.style.display='';
 for(const c in K)K[c]=false;
 dlgOpen=true;try{document.exitPointerLock()}catch(e){}
 if(!wasDock)showHome();
 wrap.style.display='flex';
 if(wasDock&&chatPanel.style.display==='flex')setTimeout(()=>{try{chatInput.focus()}catch(e){}},0)}
// M con una app abierta: el móvil se queda pequeño (acoplado) con la app abierta; desde el inicio se cierra del todo
function shrinkPhone(){
 if(!phOpen)return;
 if($p('phHome').style.display!=='none'){closePhone();return}
 phOpen=false;phDock=true;window.phDocked=true;
 for(const c in MKP)delete MKP[c];
 try{chatInput.blur()}catch(e){}
 placeMini();wrap.classList.add('dock');wrap.style.display='block';mini.style.display='none';
 dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(e){}}
function closePhone(){
 if(!phOpen&&!phDock)return;leaveMap();phOpen=false;phDock=false;window.phDocked=false;
 wrap.classList.remove('dock');mini.style.display='';wrap.style.display='none';chatPanel.style.display='none';try{chatInput.blur()}catch(e){}
 dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(e){}}

mini.addEventListener('click',e=>{e.stopPropagation();openPhone()});
wrap.addEventListener('click',e=>{if(e.target===wrap&&phOpen)shrinkPhone()});
$p('phBack').addEventListener('click',showHome);
$p('phBar').addEventListener('click',showHome);
wrap.querySelectorAll('.phApp').forEach(b=>b.addEventListener('click',()=>appOpen(b.dataset.k)));

// M abre/cierra el móvil (en fase captura, antes que el resto de teclas)
addEventListener('keydown',e=>{
 const a=document.activeElement;
 if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||a.isContentEditable))return;
 if(e.code==='KeyM'){
  if(e.repeat){e.stopImmediatePropagation();e.preventDefault();return}
  if(phOpen){shrinkPhone()}
  else if(phDock){openPhone()}              // acoplado: M lo vuelve a poner grande
  else if(started&&ov.style.display==='none'&&!dlgOpen){openPhone()}
  else return;
  e.stopImmediatePropagation();e.preventDefault();return}
 if(phOpen&&e.code==='Backspace'&&$p('phHome').style.display==='none'){
  if(!e.repeat)showHome();
  e.stopImmediatePropagation();e.preventDefault();return}
 if(phOpen&&phMap){
  let h=true;
  if(e.code.indexOf('Arrow')===0)MKP[e.code]=true;
  else if(e.key==='+'||e.key==='='||e.code==='NumpadAdd')mapZoom(1.25);
  else if(e.key==='-'||e.code==='NumpadSubtract')mapZoom(.8);
  else if(e.key==='0'||e.code==='Numpad0'){mz=1;mox=moz=0}
  else h=false;
  if(h){e.stopImmediatePropagation();e.preventDefault();return}}
 if(phOpen&&e.code==='KeyP'){
  if(!e.repeat){if(chatPanel.style.display==='flex')closePhone();else showApp('chat')}
  e.stopImmediatePropagation();e.preventDefault();return}
 if(phOpen){
  if(e.code==='Escape')closePhone();
  e.stopImmediatePropagation();e.preventDefault()}
},true);

// mapa: pantalla completa del móvil
function sizeMap(){mm.width=Math.max(150,mapHost.clientWidth);mm.height=Math.max(150,mapHost.clientHeight);
 const S=mm.style;S.position='absolute';S.left='0';S.top='0';S.right='auto';S.transform='none';S.width='100%';S.height='100%';S.border='0';S.borderRadius='0';S.display='block'}
function enterMap(){if(phMap)return;phMap=true;if(!big)toggleMap();mapHost.style.display='flex';sizeMap();mz=2;mox=moz=0}
function leaveMap(){if(!phMap)return;phMap=false;if(big)toggleMap();mapHost.style.display='none'}
window.phoneMap=function(){if(phMap)return;if(!phOpen)openPhone();if(phOpen)showApp('map')};
$p('phMapBack').addEventListener('click',showHome);$p('phMapBar').addEventListener('click',showHome);
$p('phMapCtl').addEventListener('click',e=>{const z=e.target.dataset&&e.target.dataset.z;if(!z)return;
 if(z==='in')mapZoom(1.25);else if(z==='out')mapZoom(.8);else{mz=1;mox=moz=0}});
// chat: lo usa chatOpen() (tecla P, comando de admin, etc.)
window.phoneChat=function(open){
 if(open){if(!phOpen)openPhone();if(phOpen)showApp('chat')}
 else if((phOpen||phDock)&&chatPanel.style.display==='flex')closePhone()};
// contador de mensajes sin leer en el móvil pequeño y en el icono del chat
function phBadges(){const n=chatAl.n,men=chatTgl.classList.contains('mention');
 [$p('phMiniBadge'),$p('phChatBadge')].forEach(b=>{b.textContent=n>9?'9+':n;b.style.display=n?'block':'none';b.style.background=men?'#e67e22':'#e74c3c'});
 mini.classList.toggle('unread',n>0);
 const mi=mini.querySelector('.pmi');if(mi)mi.textContent=n>0?'💬':'📱';
 const ca=wrap.querySelector('.phApp[data-k="chat"]');if(ca)ca.classList.toggle('unread',n>0)}
{const _cu=chatUnreadUi;chatUnreadUi=function(m){_cu(m);phBadges()}}
// el móvil pequeño se coloca justo debajo del cuadro «Mundo público» (que ahora ocupa la esquina)
function placeMini(){const h=document.getElementById('mpHud'),tp=(h?Math.round(h.getBoundingClientRect().bottom)+8:12)+'px';mini.style.top=tp;wrap.style.setProperty('--dockTop',tp)}
placeMini();
// reloj del juego
setInterval(()=>{placeMini();if(typeof tod!=='number')return;
 const h=Math.floor(tod),m=Math.floor((tod%1)*60),t=(h<10?'0':'')+h+':'+(m<10?'0':'')+m;
 $p('phMiniT').textContent=t;$p('phStT').textContent=t;$p('phClock').textContent=t},500);
})();


// =================================================================================================
// 32. ARRANQUE
//     Empieza el bucle principal (al final, cuando ya está todo definido).
// =================================================================================================
loop();
