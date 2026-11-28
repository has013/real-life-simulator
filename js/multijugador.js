/* ===============================================================================================
   FICHA · multijugador.js
   Qué hay:          Multijugador (sección 24): conexión, jugadores remotos, chat, mensajes privados, transferencias entre jugadores, cuentas (registrarse e iniciar sesión) y llaves de las casas.
   Tócalo si quieres: cambiar el chat, las transferencias, las cuentas o las llaves
   Ojo:              Casi siempre va con server.js (el servidor).
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 24. MULTIJUGADOR
//     Conexión con el servidor WebSocket, otros jugadores, chat, mensajes privados y transferencias.
// =================================================================================================

// ---------- 24.1 Conexión, jugadores remotos y chat del mundo ----------
// El servidor mantiene un mundo público con un máximo de 20 jugadores.
const MP={ws:null,id:null,name:'',players:new Map(),lastSend:0,connected:false,retry:0,full:false,remoteRoot:new THREE.Group()};
scene.add(MP.remoteRoot);
function mpLabel(name,rk){rk=Math.max(0,Math.min(9,Math.floor(Number(rk))||0));const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='rgba(10,18,28,.78)';g.beginPath();(g.roundRect||g.rect).call(g,8,12,496,104,28);g.fill();g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';if(rk>0){g.font='bold 42px Arial';g.fillText(String(name||'Jugador').slice(0,18),256,48);g.font='bold 32px Arial';g.fillStyle='#f4d58a';g.fillText(rankName(rk),256,94)}else{g.font='bold 48px Arial';g.fillText(String(name||'Jugador').slice(0,18),256,64)}const t=new THREE.CanvasTexture(c);const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));m.scale.set(2.8,.7,1);m.position.y=2.25;return m}
// Aspecto de otro jugador: su ropa (d.outfit) y su aspecto (d.look, de la peluquería y estética: peinado, piel, ojos, barba…). mpKey cambia si cualquiera de los dos cambia, y entonces se rehace su avatar.
function mpOpts(d,col){const o=outfitOpts(d.outfit||{},col);if(d.look&&typeof d.look==='object'){o.cap=false;lookOpts(o,d.look)}return o}
function mpKey(d){return JSON.stringify(d.outfit||{})+'|'+JSON.stringify(d.look||0)}
function mpMakePlayer(d){const hue=(Math.abs(String(d.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0))*47)%360;const color=new THREE.Color().setHSL(hue/360,.62,.48);const g=person(color.getHex(),mpOpts(d,color.getHex()));g.userData.mpId=d.id;const rk0=Math.max(0,Math.min(9,Math.floor(Number((d.profile||{}).rk))||0));g.add(mpLabel(d.name,rk0));MP.remoteRoot.add(g);return {id:String(d.id),rk:rk0,mesh:g,target:new THREE.Vector3(d.x,d.y||0,d.z),yaw:d.yaw||0,name:d.name,last:performance.now(),outfitKey:mpKey(d),vehicleMesh:null,vehicleType:null,pets:new Map()}}
function mpHud(){let h=document.getElementById('mpHud');if(!h){h=document.createElement('div');h.id='mpHud';h.style.cssText='position:fixed;right:12px;top:12px;z-index:30;background:rgba(8,17,28,.82);color:#fff;padding:9px 13px;border:1px solid rgba(255,255,255,.25);border-radius:12px;font:13px Arial;pointer-events:none;width:170px;box-sizing:border-box;box-shadow:0 3px 14px #0005';document.body.appendChild(h)}h.innerHTML='<b>🌐 MUNDO PÚBLICO</b><div id="mpStatus" style="margin-top:4px;color:#ffd36a">Conectando...</div><div id="mpCount" style="margin-top:3px">0 / 20 jugadores</div>'}
function mpStatus(t,ok){const e=document.getElementById('mpStatus');if(e){e.textContent=t;e.style.color=ok?'#80e6a0':'#ffd36a'}}
function mpDispose(g){if(!g)return;g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}})}
// Coches aparcados: los míos (los que no conduzco) viajan en el estado; los de los demás se dibujan como copias solo para mirar
function mpParkedMine(){const r=[];for(const c of cars){if(r.length>=6)break;if(c.mode!=='player'||c===inCar||!c.m)continue;r.push({t:c.t,col:c.m.userData.col||0x4477aa,x:+c.x.toFixed(1),y:+(c.y||0).toFixed(1),z:+c.z.toFixed(1),h:+c.h.toFixed(2)})}return r}
function mpParked(p,list){const arr=Array.isArray(list)?list.slice(0,6):[];if(!p.pk)p.pk=[];
 arr.forEach((q,i)=>{if(!q||!SPEC[q.t])return;const col=Number(q.col)||0x4477aa,key=q.t+':'+col;let e=p.pk[i];
  if(!e||e.key!==key){if(e){MP.remoteRoot.remove(e.mesh);mpDispose(e.mesh)}const mesh=carMesh(q.t,col);MP.remoteRoot.add(mesh);e=p.pk[i]={key,mesh}}
  e.mesh.position.set(Number(q.x)||0,Number(q.y)||0,Number(q.z)||0);e.mesh.rotation.y=Number(q.h)||0});
 while(p.pk.length>arr.length){const e=p.pk.pop();if(e){MP.remoteRoot.remove(e.mesh);mpDispose(e.mesh)}}}
function mpParkedClear(p){if(!p.pk)return;p.pk.forEach(e=>{if(e){MP.remoteRoot.remove(e.mesh);mpDispose(e.mesh)}});p.pk=[]}
function mpRemove(id){const p=MP.players.get(id);if(!p)return;MP.remoteRoot.remove(p.mesh);mpDispose(p.mesh);if(p.vehicleMesh){MP.remoteRoot.remove(p.vehicleMesh);mpDispose(p.vehicleMesh)}mpParkedClear(p);for(const q of p.pets.values()){MP.remoteRoot.remove(q.mesh);mpDispose(q.mesh)}MP.players.delete(id);mpCount()}
function mpCount(){const e=document.getElementById('mpCount');if(e)e.textContent=(MP.players.size+1)+' / 20 jugadores'}
function mpConnect(){mpHud();if(location.protocol==='file:'){mpStatus('Abre el juego desde el servidor online',false);return}
 // el nombre ya no se pregunta: es el de la cuenta (24.4). Tu propio nombre no se dibuja sobre tu cabeza (los demás jugadores sí ven el tuyo)
 const proto=location.protocol==='https:'?'wss://':'ws://';let ws;try{ws=new WebSocket(proto+location.host)}catch(e){mpStatus('No se pudo conectar',false);return}MP.ws=ws;
 // el peinado propio (flags.look) viaja en cada mensaje de estado; así no hay que tocar el fichero que los envía
 {const s0=ws.send.bind(ws);ws.send=t=>{try{if(typeof t==='string'&&t.indexOf('"type":"state"')>=0){const o=JSON.parse(t);if(typeof flags!=='undefined'&&flags.look)o.look=flags.look;o.pk=mpParkedMine();t=JSON.stringify(o)}}catch(e){}return s0(t)}}
 ws.onopen=()=>{MP.connected=true;MP.retry=0;mpStatus('Conectado',true);accOnOpen()}; // primero se inicia sesión (24.4); cuando el servidor la acepta se envía 'join'
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}if(accOnMsg(m)||keysOnMsg(m))return;
  if(m.type==='welcome'){MP.id=m.id;MP.feat=m.features||{};if(m.world){tod=m.world.tod;wx=m.world.wx} (m.players||[]).forEach(d=>{if(d.id!==MP.id)mpUpsert(d)});(m.chat||[]).forEach(chatAdd);mpCount()}
  else if(m.type==='world'){if(Number.isFinite(m.tod))tod=m.tod;if(Number.isInteger(m.wx)&&m.wx>=0&&m.wx<WX.length)wx=m.wx}
  else if(m.type==='wake'){if(SLP){const s=SLP;SLP=null;slpLeave();if(s.cost)money=Math.max(0,money-s.cost);if(s.room)flags.room=0;sleepFor(Number(m.h)||8,s.rate,s.msg,true)}}
  else if(m.type==='sleepers'){if(SLP)slpInfo(m.n,m.total,m.need);else toast('😴 '+m.n+' de '+m.total+' jugadores durmiendo · hacen falta '+m.need+' para que amanezca')}
  else if(m.type==='joined'){if(m.player&&m.player.id!==MP.id){mpUpsert(m.player);ctPeerJoined(m.player)}mpCount()}
  else if(m.type==='state'){if(m.player&&m.player.id!==MP.id)mpUpsert(m.player)}
  else if(m.type==='left'){ctPeerLeft(m.id);mpRemove(m.id)}
  else if(m.type==='boats'){boatApply(m.list)}
  else if(m.type==='boat_ok'){boatOnOk(m)}
  else if(m.type==='boat_deny'){boatOnDeny(m)}
  else if(m.type==='chat'){chatAdd(m.message);chatNotify(m.message)}
  else if(m.type==='dm'){ctOnDm(m)}
  else if(m.type==='dm_sent'){ctOnSent(m)}
  else if(m.type==='dm_err'){ctOnErr(m)}
   else if(m.type==='gov'){govApply(m)}
   else if(m.type==='decree'){decreeShow(m)}
   else if(m.type==='biz'){bizApply(m)}
   else if(m.type==='biz_pending'){bizOnPending(m)}
   else if(m.type==='biz_sold'){bizOnSold(m)}
   else if(m.type==='biz_bought'){bizOnBought(m)}
   else if(m.type==='admin_data'){admOnData(m)}
   else if(m.type==='admin_apply'){admApply(m.cmd)}
   else if(m.type==='admin_pending'){admOnPending(m)}
   else if(m.type==='admin_ok'){toast(String(m.text||'').slice(0,120))}
   else if(m.type==='admin_err'){toast('⚠️ '+String(m.text||'Error').slice(0,120))}
   else if(m.type==='biz_claim_ok'){bizOnClaimOk(m)}
   else if(m.type==='biz_claim_deny'){bizOnClaimDeny(m)}
   else if(m.type==='biz_conflict'){bizOnConflict(m)}
   else if(m.type==='house'){houseApply(m)}
   else if(m.type==='house_free'){houseOnFree(m)}
   else if(m.type==='houses_ready'){houseOnReady()}
   else if(m.type==='house_claim_ok'){houseOnClaimOk(m)}
   else if(m.type==='house_claim_deny'){houseOnClaimDeny(m)}
   else if(m.type==='house_conflict'){houseOnConflict(m)}
   else if(m.type==='biz_error'){toast('⚠️ '+String(m.reason||'Error').slice(0,120))}
   else if(m.type==='gov_error'){toast('⚠️ '+String(m.reason||'Error').slice(0,120))}
   else if(m.type==='gov_ok'){toast(String(m.text||'').slice(0,120))}
  else if(typeof m.type==='string'&&m.type.startsWith('transfer_')){xfHandle(m)}
  else if(m.type==='full'){MP.full=true;mpStatus('Servidor lleno (máximo 20)',false);ws.close();accUi()}
 };
 ws.onclose=()=>{ACC.busy=false;if(SLP){SLP=null;slpLeave()}MP.connected=false;bizSynced=false;bizClaimPend=null;houseSynced=false;housePend=null;houseSeen.clear();boatMpReset();mpStatus('Desconectado. Reintentando...',false);MP.players.forEach((_,id)=>mpRemove(id));if(MP.kicked){mpStatus('Cuenta abierta en otro sitio',false);return}if(!MP.full&&MP.retry<20){const wait=Math.min(10000,1500+MP.retry*500);MP.retry++;setTimeout(mpConnect,wait)}};
 ws.onerror=()=>mpStatus('Error de conexión',false);
}
// Chat público: los mensajes pasan por el mismo WebSocket que sincroniza jugadores.
const chatPanel=document.getElementById('chatPanel'),chatMessages=document.getElementById('chatMessages'),chatInput=document.getElementById('chatInput');
function chatOpen(open){phoneChat(open)}
function chatAdd(m,box,kind){if(!m||typeof m.text!=='string')return;box=box||chatMessages;const row=document.createElement('div');row.className='chatLine'+(kind==='in'?' dmIn':kind==='out'?' dmOut':kind==='sys'?' dmSys':'');const who=document.createElement('b');who.textContent=(m.name||'Jugador').slice(0,18)+': ';if(kind==='sys')who.textContent='';
 if(!kind&&!m.sys){const pid=ctResolve(m);if(pid){who.className='chatName';who.title='Mensaje privado';who.addEventListener('click',()=>ctOpenDm(pid,m.name))}}
 const msg=document.createElement('span');msg.textContent=m.text.slice(0,180);const time=document.createElement('small');time.textContent=new Date(m.time||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(m.tag){const tg=document.createElement('span');tg.textContent='👑 '+String(m.tag).slice(0,12)+' ';tg.style.cssText='background:#f4d58a;color:#4a3300;border-radius:4px;padding:0 5px;font-weight:800;margin-right:4px';row.append(tg);msg.style.cssText='font-weight:700;color:#ffe08a'}if(m.sys){row.style.cssText='background:rgba(244,213,138,.16);border-left:3px solid #f4d58a;padding-left:5px'}row.append(who,msg,time);box.appendChild(row);while(box.children.length>60)box.removeChild(box.firstChild);box.scrollTop=box.scrollHeight}


// ---------- 24.2 Mensajes privados: pestañas del chat ----------
// CT.tabs: key ('general' o id del jugador) -> {id,name,box,unread}. General usa #chatMessages; cada privado tiene su propio contenedor/historial.
const CT={tabs:new Map(),cur:'general'},chatTabsEl=document.getElementById('chatTabs');
CT.tabs.set('general',{id:'general',name:'General',box:chatMessages,unread:0});
function ctResolve(m){if(m&&m.id&&MP.id!==m.id&&MP.players.has(m.id))return m.id;if(m&&m.name&&m.name!==MP.name){for(const p of MP.players.values())if(p.name===m.name)return p.id}return null}
function ctBoxShow(){CT.tabs.forEach((t,k)=>{t.box.style.display=k===CT.cur?'flex':'none'})}
function ctSum(skip){let n=0;CT.tabs.forEach((t,k)=>{if(k!==skip)n+=t.unread});return n}
function ctRender(){chatTabsEl.classList.toggle('on',CT.tabs.size>1);chatTabsEl.innerHTML='';
 CT.tabs.forEach((t,k)=>{const b=document.createElement('button');b.type='button';b.className='ctTab'+(k===CT.cur?' act':'')+(k==='general'?'':' dm');
  const lab=document.createElement('span');lab.textContent=k==='general'?'🌐 General':'💬 '+t.name;b.append(lab);
  if(t.unread>0){const i=document.createElement('i');i.textContent=t.unread>9?'9+':t.unread;b.append(i)}
  if(k!=='general'){const x=document.createElement('u');x.textContent='×';x.title='Cerrar conversación';x.addEventListener('click',e=>{e.stopPropagation();ctClose(k)});b.append(x)}
  b.addEventListener('click',()=>ctSwitch(k));chatTabsEl.appendChild(b)})}
function ctEnsure(id,name){let t=CT.tabs.get(id);if(!t){const box=document.createElement('div');box.id='chatMessages_'+id;box.style.cssText='flex:1;overflow-y:auto;padding:9px 11px;display:none;flex-direction:column;gap:7px;overflow-wrap:anywhere';box.setAttribute('aria-live','polite');chatMessages.after(box);t={id,name:String(name||'Jugador').slice(0,18),box,unread:0};CT.tabs.set(id,t);chatAdd({text:'Conversación privada con '+t.name+'. Solo vosotros dos veis estos mensajes.',time:Date.now()},box,'sys');ctBoxShow();ctRender()}else if(name)t.name=String(name).slice(0,18);return t}
function ctSwitch(k){if(!CT.tabs.has(k))k='general';const t=CT.tabs.get(k);CT.cur=k;if(t.unread){t.unread=0;chatAl.n=ctSum(-1);chatUnreadUi()}ctBoxShow();ctRender();chatInput.placeholder=k==='general'?'Escribe un mensaje...':'Mensaje privado a '+t.name+'...';t.box.scrollTop=t.box.scrollHeight;try{if(chatPanel.style.display==='flex')chatInput.focus()}catch(e){}}
function ctClose(k){const t=CT.tabs.get(k);if(!t||k==='general')return;t.box.remove();chatAl.n=Math.max(0,chatAl.n-t.unread);CT.tabs.delete(k);if(CT.cur===k)CT.cur='general';chatUnreadUi();ctSwitch(CT.cur)}
function ctOpenDm(id,name){if(!id||id===MP.id)return;ctEnsure(id,name||(MP.players.get(id)||{}).name);ctSwitch(id);chatOpen(true)}
function ctVisible(k){return chatPanel.style.display==='flex'&&!document.hidden&&CT.cur===k}
function ctOnDm(m){const f=m&&m.from;if(!f||!f.id||typeof m.text!=='string')return;const t=ctEnsure(f.id,f.name);chatAdd({name:t.name,text:m.text,time:m.time},t.box,'in');
 chatPing(true);if(ctVisible(f.id))return;t.unread++;chatAl.n++;chatUnreadUi(true);ctRender();toast('✉️ '+t.name.slice(0,18)+' (privado): '+m.text.slice(0,60)+(m.text.length>60?'…':''));chatTitleFlash()}
function ctOnSent(m){const to=m&&m.to;if(!to||!to.id||typeof m.text!=='string')return;const t=ctEnsure(to.id,to.name);chatAdd({name:'Tú',text:m.text,time:m.time},t.box,'out')}
function ctOnErr(m){const t=CT.tabs.get(String(m.to||''));const txt='⚠️ '+String(m.text||'No se pudo enviar').slice(0,120);if(t)chatAdd({text:txt,time:Date.now()},t.box,'sys');else toast(txt)}
function ctPeerLeft(id){const t=CT.tabs.get(id);if(t&&id!=='general'&&!t.gone){t.gone=true;chatAdd({text:t.name+' se ha desconectado.',time:Date.now()},t.box,'sys')}}
function ctPeerJoined(p){if(!p||!p.id)return;for(const [k,t] of [...CT.tabs]){if(k==='general'||k===p.id||t.name!==p.name||MP.players.has(k)||!t.gone)continue;CT.tabs.delete(k);t.id=p.id;t.gone=false;t.box.id='chatMessages_'+p.id;CT.tabs.set(p.id,t);if(CT.cur===k)CT.cur=p.id;chatAdd({text:t.name+' ha vuelto a conectarse.',time:Date.now()},t.box,'sys');ctRender();break}}

// Avisos de chat: sonido, contador de no leídos en el botón, vista previa y parpadeo del título si la pestaña está en segundo plano.
const chatAl={n:0,ac:null,mute:false,title:document.title,tt:null};try{chatAl.mute=localStorage.getItem('rls_chatmute')==='1'}catch(e){}
const chatSndBtn=document.getElementById('chatSnd'),chatTgl=document.getElementById('chatToggle');
function chatSndUi(){chatSndBtn.textContent=chatAl.mute?'🔕':'🔔'}chatSndUi();
chatSndBtn.addEventListener('click',()=>{chatAl.mute=!chatAl.mute;try{localStorage.setItem('rls_chatmute',chatAl.mute?'1':'0')}catch(e){}chatSndUi();toast(chatAl.mute?'🔕 Avisos de chat silenciados':'🔔 Avisos de chat activados')});
function chatPing(mention){if(chatAl.mute)return;try{let gm=false;try{gm=localStorage.getItem('rls_mute')==='1'}catch(e){}if(gm)return;
 const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!chatAl.ac)chatAl.ac=new A();const ac=chatAl.ac;if(ac.state==='suspended')ac.resume();
 const t0=ac.currentTime,notes=mention?[880,1175,1568]:[988,1319];
 notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t0+i*.11);g.gain.linearRampToValueAtTime(.18,t0+i*.11+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+i*.11+.3);o.connect(g);g.connect(ac.destination);o.start(t0+i*.11);o.stop(t0+i*.11+.32)})}catch(e){}}
function chatUnreadUi(mention){chatTgl.textContent=chatAl.n?'P · Chat ('+chatAl.n+')':'P · Chat';chatTgl.classList.toggle('unread',chatAl.n>0);if(mention)chatTgl.classList.add('mention');if(!chatAl.n)chatTgl.classList.remove('mention')}
function chatTitleFlash(){if(chatAl.tt||!document.hidden)return;let on=false;chatAl.tt=setInterval(()=>{if(!document.hidden||!chatAl.n){clearInterval(chatAl.tt);chatAl.tt=null;document.title=chatAl.title;return}on=!on;document.title=on?'💬 ('+chatAl.n+') Mensaje nuevo':chatAl.title},900)}
function chatRead(){const t=CT.tabs.get(CT.cur);if(t)t.unread=0;chatAl.n=ctSum(-1);chatUnreadUi();ctRender();if(chatAl.tt){clearInterval(chatAl.tt);chatAl.tt=null}document.title=chatAl.title}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&chatPanel.style.display==='flex')chatRead()});
// Se llama solo con mensajes en vivo (no con el historial al entrar ni con los propios)
function chatNotify(m){if(!m||typeof m.text!=='string'||(MP.name&&m.name===MP.name&&!m.sys))return;
 const mention=!!MP.name&&!m.sys&&m.text.toLowerCase().includes(MP.name.toLowerCase()),open=ctVisible('general');
 chatPing(mention);if(open)return;
 CT.tabs.get('general').unread++;chatAl.n++;chatUnreadUi(mention);ctRender();toast((m.sys?'📢 ':'💬 ')+String(m.name||'Jugador').slice(0,18)+': '+m.text.slice(0,60)+(m.text.length>60?'…':''));chatTitleFlash()}
document.getElementById('chatToggle').addEventListener('click',()=>chatOpen(chatPanel.style.display!=='flex'));
addEventListener('keydown',e=>{if(e.code!=='KeyP'||e.repeat||!started)return;const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||a.isContentEditable))return;e.preventDefault();chatOpen(chatPanel.style.display!=='flex')});
document.getElementById('chatClose').addEventListener('click',()=>chatOpen(false));
document.getElementById('chatForm').addEventListener('submit',e=>{e.preventDefault();const text=chatInput.value.trim();if(!text)return;if(!MP.connected||!MP.ws||MP.ws.readyState!==1){chatAdd({name:'Sistema',text:'No estás conectado al servidor.',time:Date.now()},CT.tabs.get(CT.cur).box);return}if(CT.cur==='general')MP.ws.send(JSON.stringify({type:'chat',text}));else MP.ws.send(JSON.stringify({type:'dm',to:CT.cur,text}));chatInput.value='';chatInput.focus()});
chatInput.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){chatOpen(false);chatInput.blur()}});
function mpUpsert(d){if(!d||!d.id)return;let p=MP.players.get(d.id);if(!p){p=mpMakePlayer(d);MP.players.set(d.id,p)}
 p.target.set(Number(d.x)||0,Number(d.y)||0,Number(d.z)||0);p.yaw=Number(d.yaw)||0;p.last=performance.now();
 if(d.profile&&typeof d.profile==='object'){const pk=JSON.stringify(d.profile);if(p.profileKey!==pk){p.profileKey=pk;p.profile=d.profile;if(playerCard.style.display==='block'&&playerCard.dataset.player===String(d.id)&&playerCard.dataset.mode!=='send')showPlayerCard(p)}}
 const rkN=Math.max(0,Math.min(9,Math.floor(Number((d.profile||{}).rk))||0));if(p.name!==d.name||p.rk!==rkN){p.name=d.name;p.rk=rkN;const old=p.mesh.children.find(o=>o.isSprite);if(old){p.mesh.remove(old);old.material.map.dispose();old.material.dispose()}p.mesh.add(mpLabel(d.name,rkN))}
 const outfitKey=mpKey(d);if(p.outfitKey!==outfitKey){const hue=(Math.abs(String(d.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0))*47)%360,color=new THREE.Color().setHSL(hue/360,.62,.48);const fresh=person(color.getHex(),mpOpts(d,color.getHex()));fresh.userData.mpId=d.id;fresh.add(mpLabel(d.name,p.rk));fresh.position.copy(p.mesh.position);fresh.rotation.copy(p.mesh.rotation);MP.remoteRoot.remove(p.mesh);mpDispose(p.mesh);MP.remoteRoot.add(fresh);p.mesh=fresh;p.outfitKey=outfitKey}
 const vt=d.vehicle&&d.vType?d.vType:null;if(vt!==p.vehicleType){if(p.vehicleMesh){MP.remoteRoot.remove(p.vehicleMesh);mpDispose(p.vehicleMesh);p.vehicleMesh=null}p.vehicleType=vt;if(vt&&vt!=='boat'){const vc0=d.vCol||0x4477aa;p.vehicleMesh=vt==='bus'?busMesh(vc0):vt==='avion'?avionMesh(d.vCol||0xd33a2f):vt==='plane'?planeMesh(d.vCol||0x1f5fa8):vt==='heli'?heliMesh(d.vCol||0x2f7fe0):carMesh(vt,vc0);p.vehicleMesh.position.set(Number(d.x)||0,(Number(d.y)||0)+((vt==='avion'||vt==='plane'||vt==='heli')?G:0),Number(d.z)||0);p.vehicleMesh.rotation.y=Number(d.yaw)||0;MP.remoteRoot.add(p.vehicleMesh)}}
 p.mesh.visible=!vt;if(vt==='boat')boatRemoteState(d);p.vPt=Number(d.vPt)||0;p.vBk=Number(d.vBk)||0;p.vThr=Number(d.vThr)||0;if(p.vehicleMesh){p.vehicleMesh.visible=!!vt;if(vt!=='avion'&&vt!=='plane'&&vt!=='heli'){p.vehicleMesh.position.set(Number(d.x)||0,Number(d.y)||0,Number(d.z)||0);p.vehicleMesh.rotation.y=Number(d.yaw)||0}}
 const incoming=Array.isArray(d.pets)?d.pets.slice(0,3):[],seen=new Set();incoming.forEach((q,i)=>{const key=String(i);seen.add(key);let rp=p.pets.get(key);if(!rp||rp.t!==q.t){if(rp){MP.remoteRoot.remove(rp.mesh);mpDispose(rp.mesh)}const mesh=petMesh(q.t,q.col);MP.remoteRoot.add(mesh);rp={mesh,t:q.t,wearKey:''};p.pets.set(key,rp)}const wk=JSON.stringify(q.wear||{});if(rp.wearKey!==wk){if(rp.mesh.userData.wg){rp.mesh.remove(rp.mesh.userData.wg);mpDispose(rp.mesh.userData.wg)}const wg=new THREE.Group(),A=PET_A[q.t];Object.keys(q.wear||{}).forEach(sl=>{const c=PET_CLOTH[q.wear[sl]];if(c)c.mk(wg,A)});rp.mesh.add(wg);rp.mesh.userData.wg=wg;rp.wearKey=wk}rp.mesh.position.set(Number(q.x)||0,Number(q.y)||0,Number(q.z)||0);rp.mesh.rotation.y=Number(d.yaw)||0;rp.mesh.visible=!vt});
 for(const [key,rp] of p.pets)if(!seen.has(key)){MP.remoteRoot.remove(rp.mesh);mpDispose(rp.mesh);p.pets.delete(key)}
 mpParked(p,d.pk);
 mpCount()}

function mpProfileSnapshot(){
 const properties=HOUSES.filter(x=>x.owned&&!x.local).map(x=>'Vivienda · '+(x.apt?'Apartamento':'Casa')+' ('+x.x+', '+x.z+')').concat(TERRENOS.filter(t=>t.owned).map(t=>'Terreno nº '+t.id+' · '+t.w+'×'+t.d+' m ('+t.x+', '+t.z+')'));
 const businesses=HOUSES.filter(x=>x.owned&&x.local).map(x=>'Negocio · '+(x.bizName||x.name||'Local comercial')+' ('+x.x+', '+x.z+')');
 const career=Object.keys(jx).map(q=>{const[a,b]=q.split(':');return jname(a,b)+' · '+jdone(a,b)+' tareas'});
 return {money,rk:myRank(),properties,businesses,pets:pets.slice(0,3).map(q=>(q.name||'Mascota')+' ('+({dog:'Perro',cat:'Gato',rabbit:'Conejo'}[q.t]||'Mascota')+')'),career};
}
const playerCard=document.getElementById('playerCard');
function pcEsc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function closePlayerCard(){playerCard.style.display='none';playerCard.dataset.player='';playerCard.dataset.mode='';xfUpdateDlg()}
function showPlayerCard(p){
 if(!p)return;const d=p.profile||{},list=(a,empty)=>Array.isArray(a)&&a.length?a.map(v=>'<div>• '+pcEsc(v)+'</div>').join(''):'<div style="color:#aab4c0">'+empty+'</div>';
 playerCard.dataset.player=p.id;playerCard.dataset.mode='profile';
 playerCard.innerHTML='<button class="pcClose" onclick="closePlayerCard()">Cerrar (O / ESC)</button><h2>👤 '+pcEsc(p.name)+'</h2><div style="font-size:20px;color:#f4d58a;font-weight:700">€ '+Math.round(Number(d.money)||0).toLocaleString('es-ES')+'</div>'+(d.rk!=null?'<div style="font-size:15px;color:#9fd3ff;font-weight:700;margin-top:2px">🏅 '+pcEsc(rankName(d.rk))+'</div>':'')+'<button class="dmBtn" onclick="ctDmFromCard()">💬 Mensaje privado</button><button class="xfBtn" onclick="openSendForm()">🎁 Enviar dinero / objetos / propiedades</button><h3>🏠 Propiedades</h3>'+list(d.properties,'No tiene propiedades registradas')+'<h3>🏪 Negocios</h3>'+list(d.businesses,'No tiene negocios registrados')+'<h3>🐾 Mascotas</h3>'+list(d.pets,'No tiene mascotas')+'<h3>💼 Carrera laboral</h3>'+list(d.career,'Todavía no tiene experiencia laboral')+'<div style="margin-top:12px;color:#aab4c0;font-size:12px">Ficha visible para jugadores cercanos</div>';
 playerCard.style.display='block';xfUpdateDlg();
}
function ctDmFromCard(){const id=playerCard.dataset.player,p=MP.players.get(id);if(!p){toast('Ese jugador ya no está');closePlayerCard();return}closePlayerCard();ctOpenDm(id,p.name)}
function nearestRemotePlayer(maxDist=10){let best=null,bd=maxDist;for(const p of MP.players.values()){const d=Math.hypot(p.target.x-pl.x,p.target.z-pl.z);if(d<bd){bd=d;best=p}}return best}
function toggleNearbyProfile(){if(playerCard.style.display==='block'){closePlayerCard();return}const p=nearestRemotePlayer(12);if(!p){toast('No hay ningún jugador cerca (12 m)');return}showPlayerCard(p)}


// ---------- 24.3 Transferencias entre jugadores (dinero, objetos, casas y negocios) ----------
const XF={dlg:false,out:null,inc:null},XCATS=['Comida','Ropa','Muebles','Combustible','Mascotas','Ropa de mascota'];
const xferIn=document.createElement('div');xferIn.id='xferIn';document.body.appendChild(xferIn);
playerCard.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&e.code!=='Escape')e.stopPropagation()});
function xfAct(c){return c==='Ropa de mascota'?'Poner / quitar':c==='Mascotas'?'Dar de comer':c==='Muebles'?'Colocar en casa':c==='Ropa'?'Ponerse':c==='Combustible'?'Echar 8 L al coche':'Consumir'}
function xfWs(o){try{if(MP.ws&&MP.ws.readyState===1){MP.ws.send(JSON.stringify(o));return true}}catch(e){}return false}
function xfUpdateDlg(){const need=playerCard.style.display==='block'||xferIn.style.display==='block';
 if(need&&!XF.dlg&&!dlgOpen){XF.dlg=true;dlgOpen=true;document.exitPointerLock&&document.exitPointerLock();for(const k in K)K[k]=false}
 else if(!need&&XF.dlg){XF.dlg=false;dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(e){}}}
function xfFind(x,z,local){let best=null,bd=3;HOUSES.forEach(h=>{if(!!h.local!==!!local)return;const d=Math.hypot(h.x-x,h.z-z);if(d<bd){bd=d;best=h}});return best}
function xfBizName(ty){const t=LTYPES[ty];return (t&&(t.name||t.n))||ty||'local vacío'}
function xfLines(o){const a=[];if(o.money)a.push('💶 €'+Number(o.money).toLocaleString('es-ES'));(o.items||[]).forEach(i=>a.push('🎒 '+i.k+' ×'+i.n));(o.houses||[]).forEach(h=>a.push('🏠 '+(h.apt?'Piso':'Casa')+' en ('+h.x+', '+h.z+')'));(o.biz||[]).forEach(h=>a.push('🏪 Negocio ('+xfBizName(h.ty)+', nivel '+(h.lv||1)+') en ('+h.x+', '+h.z+')'));(o.plots||[]).forEach(q=>{const t=TERRENOS.find(x=>x.id===q.id);a.push('🟩 Terreno nº '+q.id+(t?' · '+t.w+'×'+t.d+' m':'')+(q.built?' (con construcción)':''))});return a}
function xfDescribe(o){return xfLines(o).map(l=>'<div>'+pcEsc(l)+'</div>').join('')}
function xfSummary(o){return xfLines(o).join(' · ')}
function openSendForm(){
 const id=playerCard.dataset.player,p=MP.players.get(id);if(!p){toast('Ese jugador ya no está');closePlayerCard();return}
 if(XF.out){toast('Ya tienes una oferta pendiente');return}
 playerCard.dataset.mode='send';
 const its=Object.keys(inv).filter(k=>inv[k].n>0&&XCATS.includes(inv[k].cat));
 const hs=HOUSES.filter(h=>h.owned&&!h.local&&h.mode==='own'),bs=HOUSES.filter(h=>h.owned&&h.local&&h.mode==='own');
 const locked=HOUSES.filter(h=>h.owned&&h.mode!=='own').length;
 let h='<button class="pcClose" onclick="closePlayerCard()">Cerrar (ESC)</button><h2>🎁 Enviar a '+pcEsc(p.name)+'</h2><div class="xfNote">La otra persona tiene que aceptar la oferta. Tienes que estar a menos de 15 m.</div>';
 h+='<h3>💶 Dinero (tienes €'+Math.floor(money).toLocaleString('es-ES')+')</h3><input id="xfMoney" type="number" min="0" max="'+Math.floor(money)+'" step="1" placeholder="0">';
 h+='<h3>🎒 Comida, ropa y objetos</h3>'+(its.length?its.map(k=>'<div class="xfRow"><span>'+pcEsc(k)+' <small>(tienes '+inv[k].n+')</small></span><input class="xfItem" data-k="'+pcEsc(k)+'" type="number" min="0" max="'+inv[k].n+'" step="1" value="0"></div>').join(''):'<div class="xfNote">No tienes objetos para enviar</div>');
 h+='<h3>🏠 Casas y pisos</h3>'+(hs.length?hs.map(x=>'<div class="xfRow"><label><input type="checkbox" class="xfHouse" data-i="'+x.id+'"> '+(x.apt?'Piso':'Casa')+' ('+x.x+', '+x.z+')</label></div>').join(''):'<div class="xfNote">No tienes casas propias para enviar</div>')+(locked?'<div class="xfNote">Las casas alquiladas o con hipoteca no se pueden enviar.</div>':'');
 h+='<h3>🏪 Negocios</h3>'+(bs.length?bs.map(x=>'<div class="xfRow"><label><input type="checkbox" class="xfHouse" data-i="'+x.id+'"> '+pcEsc(xfBizName(x.ty))+' · nivel '+(x.lv||1)+' ('+x.x+', '+x.z+')</label></div>').join(''):'<div class="xfNote">No tienes negocios para enviar</div>');
 const ts=TERRENOS.filter(t=>t.owned);
 h+='<h3>🟩 Terrenos</h3>'+(ts.length?ts.map(t=>'<div class="xfRow"><label><input type="checkbox" class="xfPlot" data-t="'+t.id+'"'+(t.biz&&t.biz.ty?' disabled':'')+'> Terreno nº '+t.id+' · '+t.w+'×'+t.d+' m'+(t.b&&bmN(t.b)?' (con construcción)':'')+(t.biz&&t.biz.ty?' · tiene negocio: aún no se puede enviar':'')+'</label></div>').join('')+'<div class="xfNote">La construcción pasa con el terreno; los muebles colocados vuelven a tu inventario.</div>':'<div class="xfNote">No tienes terrenos para enviar</div>');
 h+='<button class="xfBtn" onclick="xfSubmit()">Enviar oferta</button>';
 playerCard.innerHTML=h}
function xfSubmit(){
 if(XF.out){toast('Ya tienes una oferta pendiente');return}
 const id=playerCard.dataset.player,p=MP.players.get(id);if(!p){toast('Ese jugador ya no está');closePlayerCard();return}
 const mi=$('xfMoney'),m=Math.floor(Number(mi&&mi.value)||0);
 if(m<0||m>money){toast('No tienes tanto dinero');return}
 const items=[];let bad='';
 playerCard.querySelectorAll('.xfItem').forEach(e=>{const n=Math.floor(Number(e.value)||0),k=e.dataset.k;if(n<=0)return;if(!inv[k]||n>inv[k].n){bad='No tienes tantas unidades de '+k;return}items.push({k,cat:inv[k].cat,n})});
 if(bad){toast(bad);return}
 const houses=[],biz=[];
 playerCard.querySelectorAll('.xfHouse:checked').forEach(e=>{const h=HOUSES[+e.dataset.i];if(!h||!h.owned||h.mode!=='own')return;const o={x:h.x,z:h.z};if(h.local){o.ty=h.ty||'';o.lv=h.lv||1;o.till=Math.floor(h.till||0);o.stock=Object.assign({},h.stock||{});biz.push(o)}else{o.apt=!!h.apt;houses.push(o)}});
 const plots=[];playerCard.querySelectorAll('.xfPlot:checked').forEach(e=>{const t=TERRENOS.find(q=>q.id===+e.dataset.t);if(t&&t.owned)plots.push({id:t.id})});
 if(!m&&!items.length&&!houses.length&&!biz.length&&!plots.length){toast('Elige qué quieres enviar');return}
 if(!xfWs({type:'transfer',to:id,offer:{money:m,items,houses,biz,plots}}))toast('Sin conexión con el servidor')}
function xfCanGive(o){
 if((o.money||0)>money)return false;
 for(const i of o.items||[]){if(!inv[i.k]||inv[i.k].n<i.n)return false}
 for(const q of o.houses||[]){const h=xfFind(q.x,q.z,false);if(!h||!h.owned||h.mode!=='own')return false}
 for(const q of o.biz||[]){const h=xfFind(q.x,q.z,true);if(!h||!h.owned||h.mode!=='own')return false}
 for(const q of o.plots||[]){const t=TERRENOS.find(x=>x.id===q.id);if(!t||!t.owned)return false}
 return true}
function xfTake(o){
 money-=(o.money||0);let outfit=false;
 (o.items||[]).forEach(i=>{const e=inv[i.k];e.n-=i.n;if(e.cat==='Ropa'&&e.n<=0&&CLOTH[i.k]&&worn[CLOTH[i.k].slot]===i.k){delete worn[CLOTH[i.k].slot];outfit=true}});
 if(outfit)applyOutfit();
 (o.houses||[]).forEach(q=>{const h=xfFind(q.x,q.z,false);if(h)releaseHouse(h)});
 (o.biz||[]).forEach(q=>{const h=xfFind(q.x,q.z,true);if(!h)return;releaseHouse(h);if(h.ty){h.ty='';try{localIn(h,'')}catch(e){}}h.lv=0;h.till=0;h.stock={}});
 const bs={};
 (o.plots||[]).forEach(q=>{const t=TERRENOS.find(x=>x.id===q.id);if(!t)return;if(BM.on&&BM.t===t)bmExit();bmFReturn(t);bs[q.id]=bmSer(t);t.setOwned(false);t.b=null;t.biz=null;t.rem=null;t._rsig='';bmRebuild(t);houseSent[t.id]=undefined});
 estateRefresh();if(invOpen)renderInv();return bs}
function xfApply(o){
 money+=(o.money||0);
 (o.items||[]).forEach(i=>{if(!XCATS.includes(i.cat))return;const e=inv[i.k]||(inv[i.k]={n:0,cat:i.cat,act:xfAct(i.cat)});e.n+=i.n});
 (o.houses||[]).forEach(q=>{const h=xfFind(q.x,q.z,false);if(!h||h.owned)return;h.owned=true;h.mode='own';h.late=0;h.mort=null;setHouseColor(h,0x22aa44)});
 (o.biz||[]).forEach(q=>{const h=xfFind(q.x,q.z,true);if(!h||h.owned)return;h.owned=true;h.mode='own';h.late=0;h.mort=null;h.lv=q.lv||1;h.till=q.till||0;h.stock=Object.assign({},q.stock||{});h.ty=LTYPES[q.ty]?q.ty:'';if(h.ty){try{localIn(h,h.ty)}catch(e){}}setHouseColor(h,0xf1c40f)});
 (o.plots||[]).forEach(q=>{const t=TERRENOS.find(x=>x.id===q.id);if(!t||t.owned)return;t.rem=null;t._rsig='';t.b=null;t.setOwned(true);bmRebuild(t);if(q.b)bmDes(t,q.b);houseSent[t.id]=undefined});
 estateRefresh();if(invOpen)renderInv();houseSyncSend(false)}
function xfWhyNot(o){
 for(const q of o.houses||[]){const h=xfFind(q.x,q.z,false);if(!h)return 'No se encuentra esa casa en tu mundo';if(h.owned)return 'Ya tienes la casa de ('+q.x+', '+q.z+')'}
 for(const q of o.biz||[]){const h=xfFind(q.x,q.z,true);if(!h)return 'No se encuentra ese local en tu mundo';if(h.owned)return 'Ya tienes el local de ('+q.x+', '+q.z+')'}
 for(const q of o.plots||[]){const t=TERRENOS.find(x=>x.id===q.id);if(!t)return 'No se encuentra ese terreno en tu mundo';if(t.owned)return 'Ya tienes el terreno nº '+q.id}
 return ''}
function xfShowIncoming(){const i=XF.inc;if(!i)return;
 xferIn.innerHTML='<h2>🎁 Oferta de '+pcEsc(i.from.name)+'</h2><div class="xfNote">Te quiere enviar:</div>'+xfDescribe(i.offer)+'<div class="xfBtns"><button class="xfYes" onclick="xfReply(true)">Aceptar</button><button class="xfNo" onclick="xfReply(false)">Rechazar (ESC)</button></div>';
 xferIn.style.display='block';xfUpdateDlg()}
function xfReply(acc){const i=XF.inc;if(!i)return;let reason='';
 if(acc){reason=xfWhyNot(i.offer);if(reason)acc=false}
 xfWs({type:'transfer_reply',tid:i.tid,accept:!!acc,reason});
 XF.inc=null;xferIn.style.display='none';xferIn.innerHTML='';xfUpdateDlg();
 if(!acc&&reason)toast(reason)}
function xfHandle(m){
 switch(m.type){
  case 'transfer_error':toast(m.reason||'No se pudo enviar la oferta');break;
  case 'transfer_wait':XF.out={tid:m.tid,to:m.toName};closePlayerCard();toast('📤 Oferta enviada a '+m.toName+'. Esperando respuesta…');break;
  case 'transfer_offer':XF.inc={tid:m.tid,from:m.from,offer:m.offer};if(playerCard.style.display==='block')closePlayerCard();xfShowIncoming();sfx.cash&&sfx.cash();break;
  case 'transfer_commit':{const ok=xfCanGive(m.offer);let bs;if(ok){bs=xfTake(m.offer);let n=0;for(const k of Object.keys(bs)){n+=JSON.stringify(bs[k]).length;if(n>100000)delete bs[k]}}xfWs({type:'transfer_commit_ack',tid:m.tid,ok,bs:bs&&Object.keys(bs).length?bs:undefined});if(ok)saveGame();break}
  case 'transfer_deliver':xfApply(m.offer);toast('🎁 Has recibido de '+m.from.name+': '+xfSummary(m.offer));saveGame();break;
  case 'transfer_refund':xfApply(m.offer);XF.out=null;toast('La entrega no se pudo completar: te hemos devuelto lo enviado');saveGame();break;
  case 'transfer_result':XF.out=null;toast(m.ok?'✅ '+(m.toName||'El jugador')+' ha recibido tu envío':'❌ '+(m.reason||'Oferta cancelada'));break;
  case 'transfer_cancel':if(XF.inc&&XF.inc.tid===m.tid){XF.inc=null;xferIn.style.display='none';xferIn.innerHTML='';xfUpdateDlg()}toast('❌ '+(m.reason||'Oferta cancelada'));break}}


// ---------- 24.4 Cuentas: registrarse e iniciar sesión (pantalla de entrada) ----------
// Para jugar online hay que tener cuenta. El servidor guarda el usuario con la contraseña cifrada (accounts.json) y la partida
// de cada cuenta, así que es la misma desde cualquier dispositivo. Cada dispositivo recuerda su sesión (token en localStorage)
// y la próxima vez entra solo en la misma cuenta, hasta que se pulse «Cerrar sesión».
const ACC={ok:false,name:'',uid:'',loaded:false,mode:'login',busy:false,legacy:false,onDeleted:null},ACC_TOKEN='rls_token';
function accToken(t){try{if(t===undefined)return localStorage.getItem(ACC_TOKEN)||'';if(t)localStorage.setItem(ACC_TOKEN,t);else localStorage.removeItem(ACC_TOKEN)}catch(e){}return ''}
function accMsg(t,bad){const e=$('accMsg');e.textContent=t||'';e.style.color=bad?'#ff9b8f':'#9fe3a8'}
function accUi(){const reg=ACC.mode==='reg',off=location.protocol==='file:';
 $('acc').style.display=off?'none':'block';
 $('accForm').style.display=ACC.ok||MP.kicked?'none':'block';$('accIn').style.display=ACC.ok?'block':'none';$('accName').textContent=ACC.name;
 $('accPass2').style.display=reg?'block':'none';$('accTabLogin').classList.toggle('on',!reg);$('accTabReg').classList.toggle('on',reg);
 $('accGo').textContent=reg?'Crear cuenta':'Entrar';$('accGo').disabled=ACC.busy;$('accPass').autocomplete=reg?'new-password':'current-password';
 $('ovGo').textContent=ACC.ok||off?'Haz clic para jugar':MP.kicked?'Recarga la página para volver a jugar aquí':MP.full?'El servidor está lleno (máximo 20 jugadores). Prueba más tarde.':'Inicia sesión o regístrate para jugar'}
function accSend(o){if(MP.ws&&MP.ws.readyState===1){MP.ws.send(JSON.stringify(o));return true}accMsg('Sin conexión con el servidor. Reintentando…',true);return false}
function accSubmit(){if(ACC.busy||ACC.ok)return;const user=$('accUser').value.trim().replace(/\s+/g,' '),pass=$('accPass').value;
 if(!/^[\p{L}\p{N} _.-]{3,18}$/u.test(user))return accMsg('El usuario debe tener entre 3 y 18 caracteres: letras, números, espacio, punto, guion o guion bajo.',true);
 if(pass.length<6)return accMsg('La contraseña debe tener al menos 6 caracteres.',true);
 if(ACC.mode==='reg'&&pass!==$('accPass2').value)return accMsg('Las contraseñas no coinciden.',true);
 if(accSend(ACC.mode==='reg'?{type:'auth_register',user,pass,device:getUid()}:{type:'auth_login',user,pass})){ACC.busy=true;accMsg('Comprobando…');accUi()}}
// al conectar con el servidor: si este dispositivo ya tiene sesión, entra solo; si no, espera a que el jugador rellene el formulario
function accOnOpen(){ACC.busy=false;const t=accToken();if(t&&accSend({type:'auth_token',token:t})){ACC.busy=true;if(!ACC.ok)accMsg('Entrando…')}accUi()}
// partida guardada en este dispositivo para esta cuenta o, si la cuenta se creó en este dispositivo, la de antes de existir las cuentas
function accLocalSave(uid){let s=null;try{s=JSON.parse(localStorage.getItem(SAVE_KEY+':'+uid))}catch(e){}
 if(!s&&uid===getUid()){try{s=JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){}if(s)ACC.legacy=true}
 return s&&typeof s==='object'?s:null}
function accOnOk(m){ACC.busy=false;ACC.ok=true;ACC.name=String(m.name||'');ACC.uid=String(m.uid||'');MP.name=ACC.name;if(m.token)accToken(m.token);
 $('accPass').value='';$('accPass2').value='';accMsg('');
 if(!ACC.loaded){ACC.loaded=true; // la partida se carga una sola vez por visita (al reconectar ya está en marcha)
  const srv=m.save&&typeof m.save==='object'?m.save:null,loc=accLocalSave(ACC.uid);
  // se usa la más reciente: la del servidor (p. ej. de otro dispositivo) o la copia de este dispositivo (si se jugó sin conexión)
  const s=srv&&(!loc||(srv.at||0)>=(loc.at||0))?srv:loc;
  if(s&&loadGame(s)){$('savemsg').textContent='💾 Partida cargada'+(s===srv?' del servidor':' de este dispositivo');toast('Partida cargada')}}
 MP.ws.send(JSON.stringify({type:'join'}));accUi();
 if(started)setTimeout(saveGame,1500)} // al reconectar se sube lo jugado mientras no había conexión
function accOnMsg(m){switch(m.type){
 case 'auth_ok':accOnOk(m);return true;
 case 'auth_fail':ACC.busy=false;if(m.token)accToken('');accMsg(m.reason||'No se ha podido entrar.',true);accUi();return true;
 case 'auth_logged_out':return true;
 case 'kicked':MP.kicked=true;noSave=true;ACC.ok=false;started=false;try{document.exitPointerLock()}catch(e){}ov.style.display='flex';accUi();accMsg('⚠️ '+(m.reason||'Se ha abierto esta cuenta en otro sitio.'),true);return true;
 case 'save_ok':{const d=new Date();$('savemsg').textContent='💾 Guardado en el servidor a las '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(ACC.legacy){ACC.legacy=false;try{localStorage.removeItem(SAVE_KEY)}catch(e){}}return true}
 case 'save_err':toast('⚠️ '+(m.reason||'No se pudo guardar la partida en el servidor'));return true;
 case 'save_deleted':if(ACC.onDeleted){const f=ACC.onDeleted;ACC.onDeleted=null;f()}return true}
 return false}
function accLogout(){if(!confirm('¿Cerrar sesión en este dispositivo? La próxima vez tendrás que escribir tu usuario y contraseña.'))return;
 saveGame();noSave=true;accSend({type:'auth_logout',token:accToken()});accToken('');setTimeout(()=>location.reload(),400)}
{const box=$('acc');['click','mousedown','pointerdown','touchstart'].forEach(ev=>box.addEventListener(ev,e=>e.stopPropagation())); // tocar el cuadro no empieza la partida
 box.querySelectorAll('input').forEach(i=>{i.addEventListener('keydown',e=>e.stopPropagation());i.addEventListener('keyup',e=>e.stopPropagation())}); // escribir aquí no mueve al personaje
 $('accF').addEventListener('submit',e=>{e.preventDefault();accSubmit()});
 $('accTabLogin').addEventListener('click',()=>{ACC.mode='login';accMsg('');accUi()});
 $('accTabReg').addEventListener('click',()=>{ACC.mode='reg';accMsg('');accUi()});
 $('accOut').addEventListener('click',accLogout);
 accUi()}

// ---------- 24.5 Llaves de las casas ----------
// Solo se entra en una casa (de la ciudad o construida en un terreno) con su llave. El dueño tiene siempre la suya; desde el
// inventario (I) puede dar copias a otros usuarios y quitarlas. El servidor guarda quién tiene copia (sección 12 de server.js).
// Desde dentro de una casa siempre se puede abrir la puerta para salir. Los locales (negocios) no llevan llave.
const KEYS={mine:[],given:[],own:[],giving:null,sig:null}; // mine: copias que tengo · given: copias que he dado · own: llaves de mis casas
const houseKeyId=h=>Math.round(h.x)+','+Math.round(h.z);
const keyLabel=(kind,id)=>kind==='plot'?'Casa del terreno nº '+id:'Casa en ('+String(id).replace(',',', ')+')';
function hasKey(kind,id){id=String(id);return KEYS.mine.some(k=>k.kind===kind&&k.id===id)}
// ¿está el jugador dentro de la casa construida en el terreno t? (en una casilla con suelo, o arriba en la planta 2)
function inPlotHouse(t){const b=t.b;if(!b)return false;const g=bmGrid(t),k=Math.floor((pl.x-g.ox)/BCELL)+','+Math.floor((pl.z-g.oz)/BCELL);if(b.f.has(k))return true;const by=bmBy(t);for(let n=1;n<BMAXL;n++)if(py>by+n*BLH-1.75&&bmL(b,n).r.has(k))return true;return false}
// puerta de una casa de terreno: cerrada para quien no es el dueño ni tiene copia de la llave (desde dentro se abre siempre)
function plotLocked(d){const t=TERRENOS.find(q=>q.id===d.plot);return !!(t&&!t.owned&&t.rem&&!hasKey('plot',t.id)&&!inPlotHouse(t))}
// casas y pisos de la ciudad que tengo: se mandan al servidor cuando cambian (los terrenos ya los sabe él)
function keysSync(force){if(!ACC.ok)return;const hs=HOUSES.filter(h=>h.owned&&!h.local).map(houseKeyId).sort(),sig=hs.join(';');if(!force&&sig===KEYS.sig)return;if(govSend({type:'key_sync',houses:hs}))KEYS.sig=sig}
setInterval(()=>keysSync(false),3000);
function keysOnMsg(m){switch(m.type){
 case 'welcome':setTimeout(()=>keysSync(true),300);return false; // la bienvenida la sigue tratando 24.1
 case 'keys':KEYS.mine=Array.isArray(m.mine)?m.mine:[];KEYS.given=Array.isArray(m.given)?m.given:[];if(invOpen)renderInv();return true;
 case 'key_new':toast('🔑 '+m.from+' te ha dado una copia de la llave: '+keyLabel(m.kind,m.id));return true;
 case 'key_ok':toast(m.text);return true;
 case 'key_err':toast('⚠️ '+m.text);return true}
 return false}
// sección «Llaves» del inventario
function keysInvHtml(){
 KEYS.own=HOUSES.filter(h=>h.owned&&!h.local).map(h=>({kind:'house',id:houseKeyId(h)})).concat(TERRENOS.filter(t=>t.owned).map(t=>({kind:'plot',id:String(t.id)})));
 let h='<h3>🔑 Llaves</h3>';if(!KEYS.own.length&&!KEYS.mine.length)return h+'<div>ninguna</div>';
 KEYS.own.forEach((k,i)=>{const cp=KEYS.given.filter(g=>g.kind===k.kind&&g.id===k.id);
  h+='<div class="r"><span>🔑 '+keyLabel(k.kind,k.id)+' <small>(tuya)</small></span><button onclick="keyGiveForm('+i+')">Dar copia</button></div>';
  if(KEYS.giving===i)h+='<div class="r"><input id="keyTo" maxlength="18" list="keyPl" placeholder="Nombre de usuario" autocomplete="off" style="flex:1;min-width:0;padding:6px;border-radius:6px;border:1px solid #ffffff55;background:#182638;color:#fff"><datalist id="keyPl">'+[...MP.players.values()].map(p=>'<option value="'+pcEsc(p.name)+'">').join('')+'</datalist><button onclick="keyGive('+i+')">Dar</button><button onclick="KEYS.giving=null;renderInv()" style="background:#666">✕</button></div>';
  if(cp.length)h+='<div style="margin:0 0 8px 34px;font-size:13px;color:#cfd9e4">Tienen copia: '+cp.map(g=>'<b>'+pcEsc(g.holder)+'</b> <button onclick="keyRevoke('+i+','+KEYS.given.indexOf(g)+')" style="padding:2px 7px;font-size:12px;background:#8a3b32">quitar</button>').join(' ')+(cp.length>1?' <button onclick="keyRevoke('+i+',-1)" style="padding:2px 7px;font-size:12px;background:#8a3b32">cambiar la cerradura</button>':'')+'</div>'});
 KEYS.mine.forEach((k,i)=>{h+='<div class="r"><span>🔑 '+keyLabel(k.kind,k.id)+' <small>(copia de '+pcEsc(k.owner)+')</small></span><button onclick="keyDrop('+i+')" style="background:#8a3b32">Tirar</button></div>'});
 return h}
function keysInvBind(){const i=$('keyTo');if(!i)return;['keydown','keyup'].forEach(ev=>i.addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'&&e.key==='Enter')keyGive(KEYS.giving)}));i.focus()} // escribir el nombre no cierra el inventario
const keyNet=()=>{if(MP.ws&&MP.ws.readyState===1&&ACC.ok)return true;toast('Necesitas estar conectado al servidor');return false};
function keyGiveForm(i){if(!keyNet())return;KEYS.giving=i;renderInv()}
function keyGive(i){const k=KEYS.own[i],e=$('keyTo'),to=e?e.value.trim():'';if(!k||!to||!keyNet())return;govSend({type:'key_give',kind:k.kind,id:k.id,to});KEYS.giving=null;renderInv()}
function keyRevoke(i,j){const k=KEYS.own[i],g=KEYS.given[j];if(!k||!keyNet())return;
 if(j<0){if(!confirm('¿Cambiar la cerradura de la '+keyLabel(k.kind,k.id).toLowerCase()+'? Todas las copias dejarán de abrir.'))return;govSend({type:'key_revoke',kind:k.kind,id:k.id})}
 else if(g)govSend({type:'key_revoke',kind:k.kind,id:k.id,holder:g.holder})}
function keyDrop(i){const k=KEYS.mine[i];if(!k||!keyNet())return;if(!confirm('¿Tirar la copia de la llave de la '+keyLabel(k.kind,k.id).toLowerCase()+'? Ya no podrás entrar.'))return;govSend({type:'key_drop',kind:k.kind,id:k.id})}
