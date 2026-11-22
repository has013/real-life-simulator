/* ===============================================================================================
   FICHA · pantalla-tactil.js
   Qué hay:          Controles táctiles para móviles y tabletas: joystick, botones y avisos «E: …» convertidos en botones (33), y ajustes para móvil: altura de pantalla, soltar controles, pérdida de WebGL (34).
   Tócalo si quieres: cambiar los botones o el joystick del móvil
   Ojo:              Este fichero NO lleva 'use strict' (nunca lo llevó).
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
// =================================================================================================
// 33. CONTROLES TÁCTILES
//     Solo en móviles/tabletas (o con ?touch=1): joystick a la izquierda, mirar arrastrando a la derecha,
//     botones de acción y los avisos «E: …» convertidos en botones.
// =================================================================================================
(function(){
 const isTouch=matchMedia('(pointer:coarse)').matches||/[?&]touch=1/.test(location.search);
 if(!isTouch)return;
 document.body.classList.add('touch');
 const SA='env(safe-area-inset-right)',SB='env(safe-area-inset-bottom)';
 const tc=document.createElement('div');tc.id='tc';
 const pos=(r,b,s)=>'width:'+s+'px;height:'+s+'px;right:calc('+r+'px + '+SA+');bottom:calc('+b+'px + '+SB+')';
 tc.innerHTML='<div id="tcL"></div><div id="tcR"></div><div id="tcjb"><div id="tcjk"></div></div>'
  +'<div class="b" data-hold="Space" style="'+pos(24,36,74)+'">Saltar</div>'
  +'<div class="b" data-tap="KeyE" style="'+pos(112,36,74)+'">E<br>actuar</div>'
  +'<div class="b" data-hold="ShiftLeft" style="'+pos(30,122,60)+'">Correr</div>'
  +'<div class="b" id="tcm" style="'+pos(124,128,48)+';font-size:20px">⋯</div>'
  +'<div id="tcp">'+[['KeyM','📱'],['KeyI','🎒'],['KeyF','🍔'],['KeyP','💬'],['KeyO','👤'],['KeyX','✖'],['KeyT','🐾'],['KeyG','🎣'],['Escape','⏸'],['FS','⛶']].map(a=>'<div class="b" data-tap="'+a[0]+'">'+a[1]+'</div>').join('')+'</div>'
  +'<div id="tcd">…</div>';
 document.body.appendChild(tc);
 const $=s=>tc.querySelector(s),dbg=$('#tcd');let last='-',tT=0;document.addEventListener('touchstart',()=>{tT=Date.now()},true);const mouseOK=()=>Date.now()-tT>800;
 const fire=(t,c)=>{last=t.replace('key','')+' '+c;window.dispatchEvent(new KeyboardEvent(t,{code:c,key:c.replace('Key','').toLowerCase(),bubbles:true,cancelable:true}))};
 const fs=()=>{try{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(f)f.call(d)}catch(e){}};
 // ---- botones ----
 tc.querySelectorAll('.b[data-tap],.b[data-hold]').forEach(b=>{
  const tap=b.dataset.tap,hold=b.dataset.hold;let on=false;
  const dn=e=>{e.preventDefault();e.stopPropagation();if(on)return;on=true;b.classList.add('dn');
   if(hold)fire('keydown',hold);else if(tap==='FS')fs();else fire('keydown',tap)};
  const up=e=>{e.preventDefault();if(!on)return;on=false;b.classList.remove('dn');
   if(hold)fire('keyup',hold);else if(tap&&tap!=='FS')fire('keyup',tap)};
  b.addEventListener('touchstart',dn,{passive:false});b.addEventListener('touchend',up,{passive:false});b.addEventListener('touchcancel',up,{passive:false});
  b.addEventListener('mousedown',e=>{if(mouseOK())dn(e)});b.addEventListener('mouseup',e=>{if(mouseOK())up(e)});b.addEventListener('mouseleave',e=>{if(mouseOK())up(e)})});
 const panel=$('#tcp');$('#tcm').addEventListener('touchstart',e=>{e.preventDefault();panel.classList.toggle('show')},{passive:false});
 $('#tcm').addEventListener('mousedown',()=>{if(mouseOK())panel.classList.toggle('show')});
 // ---- avisos de interacción (E: abrir puerta, R: repostar…) convertidos en botones táctiles ----
 const act=document.createElement('div');act.id='tcAct';tc.appendChild(act);
 const pr=document.getElementById('prompt');let lastTxt=null;
 const doKey=code=>{fire('keydown',code);setTimeout(()=>fire('keyup',code),90)};
 const aDn=e=>{const b=e.target.closest&&e.target.closest('button[data-k]');if(!b)return;e.preventDefault();e.stopPropagation();b.classList.add('dn');doKey(b.dataset.k)};
 const aUp=e=>{const b=e.target.closest&&e.target.closest('button[data-k]');if(b)b.classList.remove('dn')};
 act.addEventListener('touchstart',aDn,{passive:false});act.addEventListener('touchend',aUp);act.addEventListener('touchcancel',aUp);
 act.addEventListener('mousedown',e=>{if(mouseOK())aDn(e)});act.addEventListener('mouseup',e=>{if(mouseOK())aUp(e)});
 setInterval(()=>{const t=pr?pr.textContent:'';if(t===lastTxt)return;lastTxt=t;act.textContent='';if(!t)return;
  t.split(' · ').forEach(seg=>{seg=seg.trim();if(!seg)return;const m=/^([A-Z]):\s*(.+)$/.exec(seg);
   if(m){const b=document.createElement('button');b.dataset.k='Key'+m[1];const k=document.createElement('i');k.textContent=m[1];const l=document.createElement('span');l.textContent=m[2].charAt(0).toUpperCase()+m[2].slice(1);b.appendChild(k);b.appendChild(l);act.appendChild(b)}
   else{const sp=document.createElement('span');sp.className='tcInfo';sp.textContent=seg;act.appendChild(sp)}})},80);
 // ---- joystick flotante (mitad izquierda) ----
 const L=$('#tcL'),jb=$('#tcjb'),jk=$('#tcjk');let jid=null,cx=0,cy=0;
 const idle=()=>{jb.classList.remove('act');jb.style.left='90px';jb.style.top='calc(100% - 100px)';jk.style.transform=''};
 const setK=(w,s,a,d)=>{K.KeyW=w;K.KeyS=s;K.KeyA=a;K.KeyD=d;const drv=!!inCar&&playing();MB.l=drv&&w?1:0;MB.r=drv&&s?1:0};   // en coche/moto/bici: joystick arriba = acelerar, abajo = frenar/marcha atrás, izq./der. = girar
 const jmove=(x,y)=>{let dx=x-cx,dy=y-cy;const m=Math.hypot(dx,dy),max=55;if(m>max){dx*=max/m;dy*=max/m}
  jk.style.transform='translate('+dx+'px,'+dy+'px)';
  if(!playing()){setK(false,false,false,false);return}
  const t=max*.28;setK(dy<-t,dy>t,dx<-t,dx>t)};
 const find=(l,id)=>{for(const t of l)if(t.identifier===id)return t;return null};
 L.addEventListener('touchstart',e=>{e.preventDefault();if(jid!==null)return;const t=e.changedTouches[0];jid=t.identifier;cx=t.clientX;cy=t.clientY;
  jb.classList.add('act');jb.style.left=cx+'px';jb.style.top=cy+'px';jmove(cx,cy)},{passive:false});
 L.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e.changedTouches,jid);if(t)jmove(t.clientX,t.clientY)},{passive:false});
 const jend=e=>{e.preventDefault();if(!find(e.changedTouches,jid))return;jid=null;setK(false,false,false,false);idle()};
 L.addEventListener('touchend',jend,{passive:false});L.addEventListener('touchcancel',jend,{passive:false});
 // ---- cámara (mitad derecha) ----
 const R=$('#tcR');let lid=null,lx=0,ly=0,camDX=0,camDY=0;
 const camApply=()=>{if(camDX||camDY){if(playing()){yaw-=camDX*.006;pitch=clamp(pitch+camDY*.006,-.3,1.3)}camDX=camDY=0}requestAnimationFrame(camApply)};requestAnimationFrame(camApply);
 R.addEventListener('touchstart',e=>{e.preventDefault();if(lid!==null)return;const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY},{passive:false});
 R.addEventListener('touchmove',e=>{e.preventDefault();const t=find(e.changedTouches,lid);if(!t)return;const dx=t.clientX-lx,dy=t.clientY-ly;lx=t.clientX;ly=t.clientY;
  camDX+=dx;camDY+=dy},{passive:false});
 const lend=e=>{if(find(e.changedTouches,lid))lid=null};R.addEventListener('touchend',lend);R.addEventListener('touchcancel',lend);
 // ---- ratón (solo para probar con ?touch=1 en el ordenador) ----
 // ---- visibilidad, inicio, rendimiento, diagnóstico ----
 const DBG=/[?&]debug=1/.test(location.search);if(!DBG)dbg.style.display='none';
 setInterval(()=>{const on=started&&ov.style.display==='none';tc.classList.toggle('on',on);
  if(DBG)dbg.textContent='play:'+(playing()?'sí':'NO')+(dlgOpen?' dlg':'')+' · '+(K.KeyW?'W':'-')+(K.KeyA?'A':'-')+(K.KeyS?'S':'-')+(K.KeyD?'D':'-')+' · '+last},DBG?150:400);
 const hint=document.createElement('p');hint.innerHTML='📱 <b>Móvil:</b> pon el dedo en la mitad izquierda = joystick · arrastra en la mitad derecha = mirar · botones a la derecha (⋯ = más acciones). Toca para empezar.';
 ov.insertBefore(hint,ov.children[1]);
 ov.addEventListener('click',()=>{fs();try{const p=screen.orientation.lock('landscape');if(p&&p.catch)p.catch(()=>{})}catch(e){}});
 try{if(qMode==='auto')setQ(innerWidth*innerHeight*devicePixelRatio>1.6e6?0:1)}catch(e){}
 addEventListener('contextmenu',e=>e.preventDefault());
})();

// =================================================================================================
// 34. AJUSTES PARA MÓVIL
//     Altura real de la pantalla, soltar los controles al cambiar de app, evitar zoom con gestos
//     y guardar si se pierde el contexto WebGL.
// =================================================================================================
(function(){
 // altura real de pantalla en movil (la barra del navegador cambia el 100vh)
 const setVh=()=>document.documentElement.style.setProperty('--vh',(window.innerHeight/100)+'px');
 setVh();addEventListener('resize',setVh);addEventListener('orientationchange',()=>setTimeout(()=>{setVh();try{dispatchEvent(new Event('resize'))}catch(e){}},300));
 if(!IS_TOUCH)return;
 // al volver de otra app / bloquear pantalla: soltar controles para que el personaje no se quede andando
 const release=()=>{try{for(const k in K)K[k]=false;MB.l=MB.r=0}catch(e){}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
 addEventListener('blur',release);addEventListener('pagehide',()=>{release();try{saveGame()}catch(e){}});
 // evitar zoom por doble toque y gestos del navegador
 ['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault()));
 // perdida del contexto WebGL (pasa en moviles con poca memoria): recargar limpio guardando antes
 ren.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();try{saveGame()}catch(x){}},false);
 ren.domElement.addEventListener('webglcontextrestored',()=>{setTimeout(()=>location.reload(),200)},false);
})();
