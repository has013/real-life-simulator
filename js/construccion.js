/* ===============================================================================================
   FICHA · construccion.js
   Qué hay:          Construcción por módulos en los terrenos (sección 20): piezas, editor y muebles.
   Tócalo si quieres: añadir piezas o cambiar el editor de construcción de los terrenos
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 20. CONSTRUCCIÓN POR MÓDULOS EN TERRENOS
//     Modo construcción con vista desde arriba: paredes, suelos, muebles, interfaz, cursor y cámara cenital.
// =================================================================================================
// En un terreno tuyo: E → modo construcción. La parcela se divide en celdas de 3 m. Módulos: suelo, pared, puerta, ventana, techo.
// Cada terreno guarda sus módulos en t.b = {f:Set de celdas con suelo, r:Set de celdas con techo, e:Map de aristas → 1 pared · 2 puerta · 3 ventana}.
const BM={on:false,t:null,tool:'floor',zoom:1.2,hv:null,grid:null,st:0,lvl:1,sd:2,yv:0},BCELL=3,BWH=3,BWT=.2,
 BCOST={floor:40,wall:120,door:150,window:150,roof:60,stair:300,fence:60,yard:25,garage:400,roofg:90,roofh:110,slab:60},
 BTOOLS=['floor','yard','wall','door','window','fence','roof','stair','erase','garage','furn'],
 BNAME={floor:'Suelo',wall:'Pared',door:'Puerta',window:'Ventana',roof:'Techo',stair:'Escalera',fence:'Valla',yard:'Exterior',erase:'Borrar',garage:'Garaje',roofg:'Techo 2 aguas',roofh:'Techo 4 aguas',furn:'Muebles',slab:'Suelo'},
 BICON={floor:'🟫',wall:'🧱',door:'🚪',window:'🪟',roof:'🏠',stair:'🪜',fence:'🚧',yard:'🌿',erase:'🧽',garage:'🚗',roofg:'🏡',roofh:'🛖',furn:'🛋️',slab:'🪵'},
 EDGET={wall:1,door:2,window:3,fence:4},ETOOL=['','wall','door','window','fence'],
 BUNIT=new THREE.BoxGeometry(1,1,1).toNonIndexed().attributes.position.array.slice(),
 BMAT={floor:new THREE.MeshLambertMaterial({color:0xb08a5a,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}),wall:new THREE.MeshLambertMaterial({color:0xece6d8}),door:new THREE.MeshLambertMaterial({color:0x6b4423}),
  glass:new THREE.MeshLambertMaterial({color:0x9fd4f0,transparent:true,opacity:.45}),roof:new THREE.MeshLambertMaterial({color:0xa24b3b}),slab:new THREE.MeshLambertMaterial({color:0xc9a06a}),roof2:new THREE.MeshLambertMaterial({color:0xa24b3b}),stair:new THREE.MeshLambertMaterial({color:0x8a6a45}),fence:new THREE.MeshLambertMaterial({color:0xd9c7a0}),y0:new THREE.MeshLambertMaterial({color:0xbdb8ac,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),y1:new THREE.MeshLambertMaterial({color:0x5f9e4a,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),y2:new THREE.MeshLambertMaterial({color:0xcdb784,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})},
 bmBox=(o,cx,y0,cz,w,h,d)=>{for(let i=0;i<BUNIT.length;i+=3)o.push(BUNIT[i]*w+cx,BUNIT[i+1]*h+y0+h/2,BUNIT[i+2]*d+cz)};
BMAT.roofp=new THREE.MeshLambertMaterial({color:0x9a4637});
// hasta 10 plantas: cada planta (2..10) tiene sus propios materiales de techo/suelo para poder hacerlos translúcidos solo al editar esa planta
const BMAXL=10,BLH=BWH+.25,BLS=/^(?:[2-9]|10):/,BMATL=[null,null,{r:BMAT.roof2,p:BMAT.roofp,s:new THREE.MeshLambertMaterial({color:0xc9a06a})}];
for(let n=3;n<=BMAXL;n++)BMATL[n]={r:new THREE.MeshLambertMaterial({color:0xa24b3b}),p:new THREE.MeshLambertMaterial({color:0x9a4637}),s:new THREE.MeshLambertMaterial({color:0xc9a06a})};
BMAT.garage=new THREE.MeshLambertMaterial({map:(()=>{const c=document.createElement('canvas');c.width=16;c.height=256;const x=c.getContext('2d');x.fillStyle='#c9ced3';x.fillRect(0,0,16,256);x.fillStyle='#8a9199';for(let q=0;q<8;q++)x.fillRect(0,q*32+29,16,3);return new THREE.CanvasTexture(c)})()});

// ---- MUEBLES: los que compras en la tienda de muebles se colocan sobre el suelo de tu terreno (herramienta 🛋️ del modo construcción) ----
// b.m: clave de celda ('i,j' planta 1 · '2:i,j' planta 2) → [nombre, dirección]. La dirección es hacia donde mira el frente (0 arriba, 1 derecha, 2 abajo, 3 izquierda).
BMAT.furn=new THREE.MeshLambertMaterial({vertexColors:true});BMAT.fglow=new THREE.MeshBasicMaterial({vertexColors:true});
const FURN={
 'Silla':{ico:'🪑',fp:[.6,.6],h:.95,it:'sit',p:a=>{[[-.21,-.21],[.21,-.21],[-.21,.21],[.21,.21]].forEach(q=>a(q[0],0,q[1],.06,.42,.06,0x6b4423));a(0,.42,0,.5,.07,.5,0x8a5a32);a(0,.49,-.22,.5,.46,.06,0x8a5a32)}},
 'Mesa':{ico:'🪵',fp:[1.7,1.05],h:.8,it:null,p:a=>{[[-.75,-.4],[.75,-.4],[-.75,.4],[.75,.4]].forEach(q=>a(q[0],0,q[1],.09,.72,.09,0x6b4423));a(0,.72,0,1.7,.07,1.05,0xa8763e)}},
 'Sofá':{wl:1,ico:'🛋️',fp:[2.4,1.05],h:.95,it:'sit',p:a=>{[[-1,-.4],[1,-.4],[-1,.4],[1,.4]].forEach(q=>a(q[0],0,q[1],.09,.1,.09,0x2a2a2a));a(0,.1,0,2.4,.38,1,0x3b6ea5);a(-.55,.48,.1,1.0,.14,.75,0x4f82bb);a(.55,.48,.1,1.0,.14,.75,0x4f82bb);a(0,.48,-.4,2.4,.5,.2,0x335f92);a(-1.1,.1,0,.2,.62,1,0x335f92);a(1.1,.1,0,.2,.62,1,0x335f92)}},
 'Cama':{wl:1,ico:'🛏️',fp:[1.6,2.3],h:.9,it:'bed',p:a=>{a(0,.1,0,1.5,.3,2.1,0x6b4a2b);a(0,.4,.05,1.4,.18,1.95,0xf4f4f4);a(0,.58,.45,1.42,.05,1.2,0x3b6ea5);a(0,.58,-.75,.6,.12,.35,0xffffff);a(0,.1,-1.07,1.5,.8,.08,0x5a3a20)}},
 'Lámpara':{ico:'💡',fp:[.45,.45],h:1.6,it:null,p:a=>{a(0,0,0,.34,.04,.34,0x333333);a(0,.04,0,.05,1.2,.05,0x555555);a(0,1.18,0,.42,.36,.42,0xffe9a6,true)}},
 'Armario':{wl:1,ico:'🚪',fp:[1.4,.65],h:2.15,it:'wardrobe',p:a=>{a(0,0,0,1.4,2.1,.6,0x7a5a3a);a(0,.1,.305,1.3,1.9,.02,0x8e6a44);a(0,.1,.318,.03,1.9,.01,0x3a2a1a);a(-.1,1,.325,.04,.2,.03,0xd9c27a);a(.1,1,.325,.04,.2,.03,0xd9c27a)}},
 // ---- Tanda 1: salón ----
 'Sillón':{ico:'🪑',fp:[1.15,1.05],h:.95,it:'sit',p:a=>{[[-.45,-.4],[.45,-.4],[-.45,.4],[.45,.4]].forEach(q=>a(q[0],0,q[1],.09,.1,.09,0x2a2a2a));a(0,.1,0,1.1,.3,1,0x7a3f30);a(0,.4,.1,.8,.14,.72,0xa65c48);a(0,.4,-.4,1.1,.55,.2,0x7a3f30);a(-.5,.1,0,.14,.55,1,0x6b3528);a(.5,.1,0,.14,.55,1,0x6b3528)}},
 'Mesa de centro':{ico:'🪵',fp:[1.1,.65],h:.45,it:null,p:a=>{[[-.47,-.25],[.47,-.25],[-.47,.25],[.47,.25]].forEach(q=>a(q[0],0,q[1],.07,.36,.07,0x6b4423));a(0,.36,0,1.1,.06,.65,0xb98a52);a(0,.12,0,.95,.03,.5,0x8a5a32)}},
 'Estantería':{wl:1,ico:'📚',fp:[1.4,.4],h:2.05,it:null,p:a=>{a(-.68,0,0,.04,2,.36,0x7a5a3a);a(.68,0,0,.04,2,.36,0x7a5a3a);a(0,0,-.17,1.4,2,.03,0x6b4a2b);[0,.5,1,1.5,1.96].forEach(y=>a(0,y,0,1.32,.04,.36,0x8e6a44));
  [.04,.54,1.04,1.54].forEach((y,r)=>[0xb03a2e,0x2e6db0,0x2e8b57,0xd4a017,0x6c3483,0xe67e22].forEach((c,k)=>{if((k+r)%5!==4)a(-.55+k*.2,y,-.02,.13,.34+((k*7+r*3)%4)*.03,.24,c)}))}},
 'Mueble de TV':{wl:1,ico:'📺',fp:[1.8,.55],h:1.25,it:null,p:a=>{a(0,0,0,1.8,.5,.5,0x3a2a1c);a(-.45,.05,.255,.82,.38,.01,0x4a3724);a(.45,.05,.255,.82,.38,.01,0x4a3724);a(0,.5,0,.5,.04,.25,0x222222);a(0,.54,0,1.3,.7,.06,0x111111);a(0,.59,.032,1.2,.6,.01,0x4aa3ff,true)}},
 'Alfombra':{ico:'🟥',fp:[2.4,1.8],h:.04,nc:true,it:null,p:a=>{a(0,0,0,2.4,.03,1.8,0xb5473a);a(0,0,0,2.1,.035,1.5,0xe3c58a);a(0,0,0,1.6,.04,1,0xb5473a)}},
 'Planta grande':{ico:'🪴',fp:[.6,.6],h:1.5,it:null,p:a=>{a(0,0,0,.45,.4,.45,0xb5651d);a(0,.4,0,.4,.04,.4,0x3b2a1a);a(0,.44,0,.06,.5,.06,0x5a3a1a);a(0,.8,0,.6,.5,.6,0x2e8b3a);a(0,1.05,0,.4,.4,.4,0x3fa34d);a(.2,.75,.1,.3,.3,.3,0x2a7a34)}},
 // ---- Tanda 2: cocina y comedor ----
 'Nevera':{wl:1,ico:'🧊',fp:[.8,.75],h:1.85,it:null,p:a=>{a(0,0,0,.75,1.8,.7,0xe8eaec);a(0,1.18,.355,.75,.02,.01,0x9aa0a6);a(.3,1.3,.365,.04,.35,.03,0x777777);a(.3,.45,.365,.04,.6,.03,0x777777)}},
 'Cocina':{wl:1,ico:'🍳',fp:[.7,.7],h:.95,it:null,p:a=>{a(0,0,0,.65,.9,.62,0xdcdcdc);a(0,.9,0,.65,.04,.62,0x2a2a2a);[[-.15,-.13],[.15,-.13],[-.15,.13],[.15,.13]].forEach(q=>a(q[0],.94,q[1],.17,.02,.17,0x111111));a(0,.1,.315,.55,.5,.01,0x333333);a(0,.25,.322,.4,.2,.01,0x66707a);a(0,.68,.33,.5,.03,.03,0x999999);[-.2,-.07,.07,.2].forEach(x=>a(x,.78,.32,.05,.05,.03,0x444444))}},
 'Encimera':{wl:1,ico:'🚰',fp:[1.4,.65],h:1.15,it:null,p:a=>{a(0,0,0,1.4,.88,.6,0xd9c9a8);a(-.35,.06,.305,.64,.7,.01,0xc9b78e);a(.35,.06,.305,.64,.7,.01,0xc9b78e);a(0,.88,0,1.4,.05,.62,0x6b6b6b);a(-.3,.925,0,.5,.012,.38,0x8fa5b5);a(-.3,.93,-.2,.04,.22,.04,0xaaaaaa);a(-.3,1.12,-.13,.04,.04,.15,0xaaaaaa)}},
 'Taburete':{ico:'🪑',fp:[.45,.45],h:.75,it:'sit',p:a=>{[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]].forEach(q=>a(q[0],0,q[1],.05,.62,.05,0x5a3a1a));a(0,.25,0,.3,.03,.3,0x5a3a1a);a(0,.62,0,.4,.07,.4,0xa8763e)}},
 // ---- Tanda 3: mobiliario de negocio (mostradores, estanterías, expositores...) ----
 'Mostrador':{ico:'🛍️',fp:[1.9,.75],h:1.1,it:null,p:a=>{a(0,0,0,1.8,1,.6,0x7a4a2a);a(0,.08,.305,1.6,.8,.01,0xa86f3c);a(0,1,0,1.9,.06,.7,0xece4d4)}},
 'Caja registradora':{ico:'🧾',fp:[.95,.7],h:1.45,it:null,p:a=>{a(0,0,0,.9,.95,.6,0x7a4a2a);a(0,.95,0,.98,.05,.66,0xece4d4);a(0,1,0,.4,.16,.34,0x2b2f36);a(0,1.16,-.06,.34,.2,.06,0x2b2f36);a(0,1.2,-.025,.28,.12,.01,0x7fe0a0,true);a(.3,1,.05,.2,.04,.2,0xb8bcc2)}},
 'Estantería de tienda':{wl:1,ico:'📦',fp:[1.6,.5],h:1.9,it:null,p:a=>{a(-.78,0,0,.05,1.85,.44,0x8a929a);a(.78,0,0,.05,1.85,.44,0x8a929a);a(0,0,-.2,1.6,1.85,.03,0x6f777f);
  [.12,.6,1.08,1.56].forEach((y,r)=>{a(0,y,0,1.55,.04,.44,0xb4bcc4);[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71,0xe67e22,0x9b59b6,0xecf0f1].forEach((c,k)=>{if((k+r)%4!==3)a(-.62+k*.2,y+.04,.02,.15,.2+((k*5+r*3)%3)*.06,.22,c)})});a(0,1.85,0,1.6,.04,.46,0xb4bcc4)}},
 'Góndola':{ico:'🛒',fp:[1.7,.85],h:1.5,it:null,p:a=>{a(0,0,0,1.6,.12,.8,0x8a929a);a(0,.12,0,1.6,1.25,.06,0xa0a8b0);a(-.78,.12,0,.05,1.2,.8,0x8a929a);a(.78,.12,0,.05,1.2,.8,0x8a929a);
  [.3,.65,1].forEach((y,r)=>{a(0,y,0,1.55,.04,.8,0xb4bcc4);[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71,0xe67e22,0x9b59b6,0xecf0f1].forEach((c,k)=>{const hh=.2+((k*5+r*3)%3)*.05;a(-.62+k*.2,y+.04,.24,.15,hh,.2,c);a(-.62+k*.2,y+.04,-.24,.15,hh,.2,c)})});a(0,1.38,0,1.6,.1,.12,0xe74c3c)}},
 'Vitrina':{wl:1,ico:'🪟',fp:[1.5,.65],h:1.25,it:null,p:a=>{a(0,0,0,1.5,.55,.6,0x3a2a1c);a(0,.1,.305,1.35,.35,.01,0x4a3724);a(0,.55,0,1.5,.04,.6,0xe8f4fa);[[-.72,-.27],[.72,-.27],[-.72,.27],[.72,.27]].forEach(q=>a(q[0],.59,q[1],.05,.56,.05,0xcfe6f2));
  a(0,.59,-.28,1.45,.56,.03,0xb8d4e3);a(0,1.15,0,1.5,.05,.6,0xcfe6f2);a(0,1.12,0,1.3,.03,.5,0xfff6d0,true);a(-.45,.59,0,.22,.14,.22,0xd4af37);a(0,.59,0,.2,.2,.2,0xc0392b);a(.45,.59,0,.24,.1,.24,0x2980b9)}},
 'Nevera expositora':{wl:1,ico:'🥶',fp:[1.05,.8],h:2.05,it:null,p:a=>{a(0,0,0,1,2,.75,0x2f6fb0);a(0,.12,.38,.86,1.65,.01,0x1b2a38);
  [.2,.62,1.04,1.46].forEach(y=>[0xe74c3c,0x2ecc71,0xf1c40f,0x3498db,0xe67e22].forEach((c,k)=>a(-.36+k*.18,y,.39,.1,.3,.02,c)));a(.46,.5,.39,.03,.9,.03,0xcccccc);a(0,2,0,1,.05,.5,0xbfe9ff,true)}},
 'Barra de bar':{ico:'🍸',fp:[2.3,.8],h:1.45,it:null,p:a=>{a(0,0,0,2.2,1.05,.6,0x3b2314);a(0,.1,.305,2,.8,.01,0x5a3720);a(0,1.05,0,2.3,.07,.8,0x1f1f24);a(-1,0,.4,.04,.16,.04,0xc9a24a);a(1,0,.4,.04,.16,.04,0xc9a24a);a(0,.12,.4,2.1,.04,.04,0xc9a24a);
  a(-.6,1.12,0,.1,.18,.1,0xe8f4fa);a(.5,1.12,.1,.1,.14,.1,0xe0b020);a(0,1.12,-.2,.08,.3,.08,0x2e8b3a)}},
 'Perchero':{ico:'👗',fp:[1.5,.6],h:1.7,it:null,p:a=>{a(-.7,0,0,.05,1.6,.05,0x555a60);a(.7,0,0,.05,1.6,.05,0x555a60);a(-.7,0,0,.3,.03,.5,0x555a60);a(.7,0,0,.3,.03,.5,0x555a60);a(0,1.55,0,1.45,.04,.04,0xb8bcc2);
  [0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0x8e44ad,0xecf0f1,0xe67e22].forEach((c,k)=>a(-.55+k*.18,.75,0,.1,.8,.3,c))}},
 'Cartel luminoso':{ico:'🪧',fp:[1.2,.4],h:1.65,it:null,p:a=>{a(0,0,0,1.1,.05,.4,0x333333);a(-.45,.05,0,.05,.95,.05,0x555a60);a(.45,.05,0,.05,.95,.05,0x555a60);a(0,1,0,1.1,.6,.08,0x1c2733);a(0,1.05,.045,1,.5,.01,0xff4d4d,true);a(0,1.2,.05,.7,.12,.01,0xfff2a8,true)}}};
// los muebles con wl:1 van pegados al lado de atrás de su casilla (el opuesto al frente), de modo que quedan contra la pared de esa arista
const bmFOff=(def,d)=>{if(!def.wl)return[0,0];const s=Math.max(0,BCELL/2-BWT/2-def.fp[1]/2),v=BDIR[d];return[-v[0]*s,-v[1]*s]};
const FCOLC=new Map(),fcol=h=>{let c=FCOLC.get(h);if(!c){c=new THREE.Color(h);FCOLC.set(h,c)}return c};
// devuelve un mueble al inventario
function bmFGive(nm){const o=inv[nm]||(inv[nm]={n:0,cat:'Muebles',act:'Colocar en casa'});o.n++}
function bmFReturn(t){if(!t||!t.b)return;for(const v of t.b.m.values())bmFGive(v[0]);t.b.m.clear()}
// ¿se puede poner un mueble en esa celda? planta 1: suelo o suelo exterior · plantas 2-5: cualquier casilla salvo escaleras (las de la propia planta o el hueco de la de abajo)
function bmFCan(t,key,n){const b=t.b;if(!b)return false;if(bmStairMap(t,n).has(key))return false;if(n===1)return b.f.has(key)||b.o.has(key);return !bmStairMap(t,n-1).has(key)}
// ¿hay suelo (techo plano de la planta de abajo) en esa casilla de la planta n≥2?
function bmHasFloor(b,n,c){const Lb=bmL(b,n-1);return Lb.r.has(c)&&!Lb.rt.has(c)}
function bmGrid(t){const nx=Math.max(1,Math.floor(t.w/BCELL)),nz=Math.max(1,Math.floor(t.d/BCELL));return{nx,nz,ox:t.x-nx*BCELL/2,oz:t.z-nz*BCELL/2}}
function bmBy(t){if(t.by===undefined){let m=-9;const g=bmGrid(t);for(let a=0;a<=g.nx;a++)for(let b=0;b<=g.nz;b++)m=Math.max(m,heightAt(g.ox+a*BCELL,g.oz+b*BCELL));t.by=Math.max(0,m)}return t.by}
// Segunda planta: el techo de la planta 1 (b.r) hace de suelo de la planta 2 (se puede pisar). En la planta 2: paredes/puertas/ventanas (b.e2) y techo (b.r2).
// Escaleras (b.s): clave de la celda de abajo → dirección de subida (0 arriba, 1 derecha, 2 abajo, 3 izquierda). Ocupan 2 celdas y dejan un hueco en el techo.
const BDIR=[[0,-1],[1,0],[0,1],[-1,0]],YNAME=['Baldosa','Césped','Arena']; // suelo exterior: 3 tipos (R o el botón los cambia)
function bmData(t){return t.b||(t.b={f:new Set(),r:new Set(),e:new Map(),r2:new Set(),e2:new Map(),s:new Map(),o:new Map(),rt:new Map(),m:new Map(),U:new Map()})}
// Datos de una planta: {e: aristas, r: techo (= suelo de la planta de arriba), rt: tipo de techo}. Planta 1 → b.e/b.r · planta 2 → b.e2/b.r2/b.rt · plantas 3-5 → b.U (Map planta → datos)
const BEMPTY={e:new Map(),r:new Set(),rt:new Map()};
function bmL(b,n,mk){if(n===1)return{e:b.e,r:b.r,rt:BEMPTY.rt};if(n===2)return{e:b.e2,r:b.r2,rt:b.rt};if(!b.U)b.U=new Map();let u=b.U.get(n);if(!u&&mk){u={e:new Map(),r:new Set(),rt:new Map()};b.U.set(n,u)}return u||BEMPTY}
// planta más alta que tiene algo (paredes, techo, muebles o escaleras); mínimo 1
function bmTop(t){const b=t.b;let top=1;if(!b)return top;for(let n=2;n<=BMAXL;n++){const L=bmL(b,n);if(L.e.size||L.r.size)top=n}
 for(const k of b.m.keys()){const q=/^(\d+):/.exec(k);if(q)top=Math.max(top,+q[1])}
 for(const k of b.s.keys()){const q=/^(\d+):/.exec(k);top=Math.max(top,(q?+q[1]:1)+1)}return Math.min(top,BMAXL)}
function bmUN(b){let q=0;if(b.U)for(const L of b.U.values())q+=L.r.size+L.e.size;return q}
const bmN=b=>b.f.size+b.r.size+b.e.size+b.r2.size+b.e2.size+b.s.size+b.o.size+b.m.size+bmUN(b),
 bmSer=t=>{if(!t.b||!bmN(t.b))return null;const o={f:[...t.b.f],r:[...t.b.r],e:[...t.b.e]};if(t.b.r2.size)o.r2=[...t.b.r2];if(t.b.e2.size)o.e2=[...t.b.e2];if(t.b.s.size)o.s=[...t.b.s];if(t.b.rt.size)o.rt=[...t.b.rt];if(t.b.o.size)o.o=[...t.b.o];if(t.b.m.size)o.m=[...t.b.m];if(t.b.U&&t.b.U.size){const u=[];for(const[n,L]of t.b.U)if(L.r.size||L.e.size)u.push([n,{r:[...L.r],e:[...L.e],rt:[...L.rt]}]);if(u.length)o.U=u}return o},
 bmCount=t=>t.b?bmN(t.b):0,
 RTOOL=['roof','roofg','roofh'],bmRC=(b,k)=>BCOST[RTOOL[b.rt.get(k)||0]], // coste del techo de la planta 2 según su tipo
 bmRCn=(L,k)=>BCOST[RTOOL[(L.rt&&L.rt.get(k))||0]], // ídem para cualquier planta ≥2
 bmTL=()=>BM.lvl>=2?['slab','wall','door','window','fence','roof','roofg','roofh'].concat(BM.lvl<BMAXL?['stair']:[],['erase','furn']):BTOOLS,
 bmEC=k=>{const p=k.split(','),i=+p[1],j=+p[2];return p[0]==='h'?[i+','+(j-1),i+','+j]:[(i-1)+','+j,i+','+j]},
 bmSup=(b,k,sm)=>true, // en planta 2 se puede construir encima de la planta baja o sobre el hueco de una escalera
 bmStMid=(sm,k)=>{const q=bmEC(k);return sm.has(q[0])&&sm.get(q[0])===sm.get(q[1])}; // arista entre las 2 celdas de una misma escalera (taparía los peldaños)
function bmDes(t,o){if(!o||typeof o!=='object')return;const b=bmData(t),g=bmGrid(t),okc=k=>{const p=String(k).split(',').map(Number);return p.length===2&&p[0]>=0&&p[1]>=0&&p[0]<g.nx&&p[1]<g.nz};
 (o.f||[]).forEach(k=>okc(k)&&b.f.add(k));(o.r||[]).forEach(k=>okc(k)&&b.r.add(k));(o.r2||[]).forEach(k=>okc(k)&&b.r2.add(k));
 const ed=(src,mp,mx)=>(src||[]).forEach(q=>{if(!Array.isArray(q))return;const[k,v]=q,p=String(k).split(',');if((p[0]==='h'||p[0]==='v')&&v>=1&&v<=mx)mp.set(k,v)});ed(o.e,b.e,6);ed(o.e2,b.e2,4);
 (o.o||[]).forEach(q=>{if(!Array.isArray(q))return;const[k,v]=q;if(okc(k)&&v>=0&&v<=2&&v===Math.floor(v))b.o.set(k,v)});
 (o.rt||[]).forEach(q=>{if(!Array.isArray(q))return;const[k,v]=q;if(okc(k)&&(v===1||v===2))b.rt.set(k,v)});
 (o.m||[]).forEach(q=>{if(!Array.isArray(q))return;const[k,v]=q,ks=String(k);if(!Array.isArray(v)||!Object.prototype.hasOwnProperty.call(FURN,v[0])||!okc(ks.replace(BLS,'')))return;const d=+v[1];b.m.set(ks,[v[0],(d>=0&&d<=3&&d===Math.floor(d))?d:2])});
 (o.s||[]).forEach(q=>{if(!Array.isArray(q))return;const[k,d]=q,ks=String(k);if(okc(ks.replace(/^[2-9]:/,''))&&d>=0&&d<=3&&d===Math.floor(d))b.s.set(ks,d)});
 (o.U||[]).forEach(q=>{if(!Array.isArray(q))return;const n=+q[0],v=q[1];if(!(n>=3&&n<=BMAXL&&n===Math.floor(n))||!v||typeof v!=='object')return;const Lu=bmL(b,n,true);(v.r||[]).forEach(k=>okc(k)&&Lu.r.add(k));ed(v.e,Lu.e,4);(v.rt||[]).forEach(w=>{if(!Array.isArray(w))return;const[k,x]=w;if(okc(k)&&(x===1||x===2))Lu.rt.set(k,x)})});
 bmRebuild(t)}
// celdas ocupadas por las escaleras que SUBEN DESDE la planta n (por defecto la 1): celda → clave de la escalera (cada una ocupa su celda y la siguiente en su dirección).
// Las escaleras de la planta 1 se guardan como «i,j»; las de las plantas 2-4 como «n:i,j». Esas mismas celdas son el hueco del suelo de la planta n+1.
function bmStairMap(t,n){n=n||1;const b=t.b,g=bmGrid(t),m=new Map();if(!b)return m;for(const[k,d]of b.s){const q=/^(\d+):(.*)$/.exec(k),ln=q?+q[1]:1;if(ln!==n)continue;const kc=q?q[2]:k,p=kc.split(','),i=+p[0],j=+p[1],v=BDIR[d],i2=i+v[0],j2=j+v[1];if(i2<0||j2<0||i2>=g.nx||j2>=g.nz)continue;m.set(kc,k);m.set(i2+','+j2,k)}return m}
function bmStairOK(t,i,j,d){const g=bmGrid(t),v=BDIR[d],i2=i+v[0],j2=j+v[1];return{ok:i2>=0&&j2>=0&&i2<g.nx&&j2<g.nz,k2:i2+','+j2}}
// Garaje: ocupa 2 aristas seguidas (la 1ª guarda el tipo 5 y dibuja toda la puerta, la 2ª guarda el tipo 6). Si la siguiente no cabe, usa la anterior.
function bmGPair(t,o,i,j){const g=bmGrid(t),ok=(a,b)=>o==='h'?(a>=0&&a<g.nx&&b>=0&&b<=g.nz):(a>=0&&a<=g.nx&&b>=0&&b<g.nz),d=o==='h'?[1,0]:[0,1];let a=[i,j],c=[i+d[0],j+d[1]];if(!ok(c[0],c[1])){c=a;a=[i-d[0],j-d[1]]}
 if(!ok(a[0],a[1])||!ok(c[0],c[1]))return null;return{a,c,ka:o+','+a[0]+','+a[1],kc:o+','+c[0]+','+c[1]}}
// quita lo que se queda sin base (paredes sobre el hueco de una escalera, escaleras sin suelo debajo, muebles sin sitio) y devuelve el reembolso (50 %)
function bmClean(t){const b=t.b;let ref=0;
 for(let n=2;n<=BMAXL;n++){const Ln=bmL(b,n),sb=bmStairMap(t,n-1);for(const[k,ty]of[...Ln.e])if(bmStMid(sb,k)){Ln.e.delete(k);ref+=Math.round((BCOST[ETOOL[ty]]||0)/2)}}
 for(const[k,d]of[...b.s]){const q=/^(\d+):(.*)$/.exec(k);if(!q)continue;const n=+q[1],c1=q[2],pp=c1.split(','),st=bmStairOK(t,+pp[0],+pp[1],d);if(n>=BMAXL||!st.ok||![c1,st.k2].every(c=>bmHasFloor(b,n,c))){b.s.delete(k);ref+=Math.round(BCOST.stair/2)}}
 for(const[k,v]of[...b.m]){const q=/^(\d+):(.*)$/.exec(k),lv=q?+q[1]:1,c=q?q[2]:k;if(!bmFCan(t,c,lv)){b.m.delete(k);bmFGive(v[0]);BM.fr=(BM.fr|0)+1}}
 return ref}
// Tejado inclinado sobre un rectángulo (x0..x1, z0..z1) que arranca en la altura yb. ty 1 = 2 aguas (cumbrera en el lado largo, con piñones) · ty 2 = 4 aguas.
function bmPitch(A,x0,z0,x1,z1,yb,ty){const W=x1-x0,D=z1-z0,ax=W>=D,L=ax?W:D,S=ax?D:W,h=Math.min(S/2*.7,4),cen=[(x0+x1)/2,yb+h*.25,(z0+z1)/2],
  P=(u,v,y)=>ax?[x0+u,y,z0+v]:[x0+v,y,z0+u],
  tri=(arr,a,b,c)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,
   d=nx*((a[0]+b[0]+c[0])/3-cen[0])+ny*((a[1]+b[1]+c[1])/3-cen[1])+nz*((a[2]+b[2]+c[2])/3-cen[2]);if(d<0)arr.push(...a,...c,...b);else arr.push(...a,...b,...c)}, // la cara siempre mira hacia fuera
  quad=(arr,a,b,c,d)=>{tri(arr,a,b,c);tri(arr,a,c,d)};
 if(ty===1){quad(A.roofp,P(0,0,yb),P(L,0,yb),P(L,S/2,yb+h),P(0,S/2,yb+h));quad(A.roofp,P(0,S,yb),P(L,S,yb),P(L,S/2,yb+h),P(0,S/2,yb+h));
  const e=.2;tri(A.wall,P(e,0,yb),P(e,S,yb),P(e,S/2,yb+h));tri(A.wall,P(L-e,0,yb),P(L-e,S,yb),P(L-e,S/2,yb+h))}
 else{const r0=Math.min(S/2,L/2),r1=L-r0;quad(A.roofp,P(0,0,yb),P(L,0,yb),P(r1,S/2,yb+h),P(r0,S/2,yb+h));quad(A.roofp,P(0,S,yb),P(L,S,yb),P(r1,S/2,yb+h),P(r0,S/2,yb+h));
  tri(A.roofp,P(0,0,yb),P(0,S,yb),P(r0,S/2,yb+h));tri(A.roofp,P(L,0,yb),P(L,S,yb),P(r1,S/2,yb+h))}}
function bmRebuild(t){
 if(t._doors)t._doors.forEach(d=>{t._open=t._open||{};t._open[d.key]=d.open;const i=DOORS.indexOf(d);if(i>=0)DOORS.splice(i,1);scene.remove(d.pv);d.leaf.geometry.dispose()});t._doors=[];
 if(t._ms)t._ms.forEach(m=>{scene.remove(m);m.geometry.dispose()});t._ms=[];t.roofMesh=null;
 if(t._msU)t._msU.forEach(l=>l&&l.forEach(m=>{scene.remove(m);m.geometry.dispose()}));t._msU=[];for(let n=2;n<=BMAXL;n++)t._msU[n]=[];
 if(t._cols)t._cols.forEach(c=>{const i=colliders.indexOf(c);if(i>=0)colliders.splice(i,1)});
 if(t._ia)t._ia.forEach(c=>{const i=INTERACTS.indexOf(c);if(i>=0)INTERACTS.splice(i,1)});t._ia=[];
 if(t._fl)t._fl.forEach(c=>{const i=FLOORS.indexOf(c);if(i>=0)FLOORS.splice(i,1)});
 if(t._rp)t._rp.forEach(c=>{const i=RAMPS.indexOf(c);if(i>=0)RAMPS.splice(i,1)});t._cols=[];t._fl=[];t._rp=[];
 if(!t.b)return;
 const g=bmGrid(t),by=bmBy(t),b=t.b,C=BCELL,T=BWT,yL=n=>n===1?by:by+(n-1)*BLH,smc=[],smL=n=>smc[n]||(smc[n]=bmStairMap(t,n)),
  A={floor:[],wall:[],door:[],glass:[],roof:[],slab:[],stair:[],fence:[],y0:[],y1:[],y2:[]},AU=(()=>{const a=[];for(let n=2;n<=BMAXL;n++)a[n]={wall:[],door:[],glass:[],roof2:[],roofp:[],fence:[],slab:[],stair:[]};return a})(),
  col=(x0,x1,z0,z1,y0,y1,np)=>{const c={x0,x1,z0,z1,y0,y1,on:true};if(np)c.np=1;colliders.push(c);t._cols.push(c);if(!np&&y0<by+1){const q=Object.assign({},c,{car:true});colliders.push(q);t._cols.push(q)}};
 for(const k of b.f){const[i,j]=k.split(',').map(Number),cx=g.ox+(i+.5)*C,cz=g.oz+(j+.5)*C;bmBox(A.floor,cx,by-.3,cz,C,.44,C);const f={x0:cx-C/2,x1:cx+C/2,z0:cz-C/2,z1:cz+C/2,y:by+.14};FLOORS.push(f);t._fl.push(f)}
 // suelo exterior (baldosa, césped, arena): losa fina que se pisa, no necesita paredes ni techo
 for(const[k,v]of b.o){const[i,j]=k.split(',').map(Number),cx=g.ox+(i+.5)*C,cz=g.oz+(j+.5)*C;bmBox(A['y'+v],cx,by-.1,cz,C,.24,C);const f={x0:cx-C/2,x1:cx+C/2,z0:cz-C/2,z1:cz+C/2,y:by+.14};FLOORS.push(f);t._fl.push(f)}
 // techo de cada planta = suelo de la siguiente (se puede pisar desde arriba). Si encima hay algo de la planta siguiente se dibuja como suelo de madera.
 for(let n=1;n<=BMAXL;n++){const Ln=bmL(b,n),Lu=n<BMAXL?bmL(b,n+1):BEMPTY,us=new Set(Lu.r),AA=n===1?A:AU[n],yt=yL(n)+BWH;for(const k of Lu.e.keys())bmEC(k).forEach(c=>us.add(c));
  for(const k of Ln.r){const[i,j]=k.split(',').map(Number),cx=g.ox+(i+.5)*C,cz=g.oz+(j+.5)*C,u=us.has(k);
   bmBox(u?AA.slab:(n===1?AA.roof:AA.roof2),cx,yt,cz,u?C:C+.3,.25,u?C:C+.3);col(cx-C/2,cx+C/2,cz-C/2,cz+C/2,yt,yt+.25,true);
   if(n<BMAXL&&!Ln.rt.has(k)){const f={x0:cx-C/2,x1:cx+C/2,z0:cz-C/2,z1:cz+C/2,y:yL(n+1)};FLOORS.push(f);t._fl.push(f)}}}
 // techos inclinados (plantas 2-5): se agrupan las celdas contiguas del mismo tipo en rectángulos y cada rectángulo lleva un solo tejado
 for(let n=2;n<=BMAXL;n++){const Ln=bmL(b,n);if(!Ln.r.size)continue;for(const ty of[1,2]){const set=new Set(),used=new Set(),OV=.35;for(const k of Ln.r)if(Ln.rt.get(k)===ty)set.add(k);if(!set.size)continue;
  for(let j=0;j<g.nz;j++)for(let i=0;i<g.nx;i++){const k0=i+','+j;if(!set.has(k0)||used.has(k0))continue;let w=1;while(set.has((i+w)+','+j)&&!used.has((i+w)+','+j))w++;
   let hh=1;grow:while(true){for(let a=0;a<w;a++){const kk=(i+a)+','+(j+hh);if(!set.has(kk)||used.has(kk))break grow}hh++}
   for(let a=0;a<w;a++)for(let c=0;c<hh;c++)used.add((i+a)+','+(j+c));
   bmPitch(AU[n],g.ox+i*C-OV,g.oz+j*C-OV,g.ox+(i+w)*C+OV,g.oz+(j+hh)*C+OV,yL(n)+BWH+.25,ty)}}}
 // aristas (paredes, puertas, ventanas) de una planta: yb = altura del suelo de esa planta, AA = mallas donde se dibujan, pfx = prefijo de la clave de las puertas
 const edge=(k,ty,yb,AA,pfx)=>{const p=k.split(','),hz=p[0]==='h',i=+p[1],j=+p[2],cx=hz?g.ox+(i+.5)*C:g.ox+i*C,cz=hz?g.oz+j*C:g.oz+(j+.5)*C,
   cl=(x0,x1,z0,z1)=>col(x0,x1,z0,z1,yb-.3,yb+BWH);
  // tramo de la arista entre a y bb (medidos desde su centro), con su altura y material; solid → colisión
  const seg=(a,bb,y0,h,m,solid,th)=>{const ea=a<=-C/2+.01?T/2:0,eb=bb>=C/2-.01?T/2:0,len=bb-a+ea+eb,mid=(a+bb)/2+(eb-ea)/2,w=th||T;
   if(hz){bmBox(AA[m],cx+mid,yb+y0,cz,len,h,w);if(solid)cl(cx+mid-len/2,cx+mid+len/2,cz-T/2,cz+T/2)}
   else{bmBox(AA[m],cx,yb+y0,cz+mid,w,h,len);if(solid)cl(cx-T/2,cx+T/2,cz+mid-len/2,cz+mid+len/2)}};
  if(ty===6){}
  else if(ty===5){const L=2*C,gx=hz?cx+C/2:cx,gz=hz?cz:cz+C/2,
   gs=(a,bb,y0,h,m,solid)=>{const len=bb-a,mid=(a+bb)/2;if(hz){bmBox(AA[m],gx+mid,yb+y0,gz,len,h,T);if(solid)cl(gx+mid-len/2,gx+mid+len/2,gz-T/2,gz+T/2)}else{bmBox(AA[m],gx,yb+y0,gz+mid,T,h,len);if(solid)cl(gx-T/2,gx+T/2,gz+mid-len/2,gz+mid+len/2)}};
   gs(-L/2-T/2,-L/2+.25,0,BWH,'wall',true);gs(L/2-.25,L/2+T/2,0,BWH,'wall',true);gs(-L/2+.25,L/2-.25,2.6,BWH-2.6,'wall',false);
   // persiana: cuelga del dintel y al abrir se recoge hacia arriba (E para abrir/cerrar); bloquea a personas y coches mientras está cerrada
   const open=!!(t._open&&t._open[pfx+k]),pv=new THREE.Group(),lw=L-.54,lg=new THREE.Mesh(hz?new THREE.BoxGeometry(lw,2.6,.08):new THREE.BoxGeometry(.08,2.6,lw),BMAT.garage);lg.castShadow=true;lg.position.y=-1.3;pv.position.set(gx,yb+2.6,gz);pv.add(lg);scene.add(pv);
   const hw=lw/2,dc=hz?{x0:gx-hw,x1:gx+hw,z0:gz-T/2,z1:gz+T/2}:{x0:gx-T/2,x1:gx+T/2,z0:gz-hw,z1:gz+hw};dc.y0=yb-.3;dc.y1=yb+2.6;dc.on=!open;colliders.push(dc);t._cols.push(dc);
   const dq=Object.assign({},dc,{car:true});colliders.push(dq);t._cols.push(dq);
   const dr={plot:t.id,key:pfx+k,pv,col:dc,col2:dq,x:gx,z:gz,fz:1,leaf:lg,open,ang:open?1:0,bmy:yb,up:pfx?parseInt(pfx):0,gar:1};lg.scale.y=Math.max(.03,1-dr.ang*.97);DOORS.push(dr);t._doors.push(dr)}
  else if(ty===1)seg(-C/2,C/2,0,BWH,'wall',true);
  else if(ty===2){const dw=1.4;seg(-C/2,-dw/2,0,BWH,'wall',true);seg(dw/2,C/2,0,BWH,'wall',true);seg(-dw/2,dw/2,2.3,BWH-2.3,'door',false);
   // hoja de la puerta (articulada en un lateral; E para abrir/cerrar, como las demás puertas del juego)
   const open=!!(t._open&&t._open[pfx+k]),pv=new THREE.Group(),lw=dw-.04,lg=new THREE.Mesh(hz?new THREE.BoxGeometry(lw,2.3,.08):new THREE.BoxGeometry(.08,2.3,lw),BMAT.door);lg.castShadow=true;
   if(hz){pv.position.set(cx-dw/2,yb,cz);lg.position.set(dw/2,1.15,0)}else{pv.position.set(cx,yb,cz-dw/2);lg.position.set(0,1.15,dw/2)}
   pv.add(lg);scene.add(pv);
   const dc=hz?{x0:cx-dw/2,x1:cx+dw/2,z0:cz-T/2,z1:cz+T/2}:{x0:cx-T/2,x1:cx+T/2,z0:cz-dw/2,z1:cz+dw/2};dc.y0=yb-.3;dc.y1=yb+2.3;dc.on=!open;colliders.push(dc);t._cols.push(dc);
   const dr={plot:t.id,key:pfx+k,pv,col:dc,x:cx,z:cz,fz:1,leaf:lg,open,ang:open?-1.9:0,bmy:yb,up:pfx?parseInt(pfx):0};pv.rotation.y=dr.ang;DOORS.push(dr);t._doors.push(dr)}
  else if(ty===4){if(AA===A)bmBox(A.y0,cx,by-.1,cz,hz?C+.5:.5,.24,hz?.5:C+.5);seg(-C/2,-C/2+.14,0,1.25,'fence',false,.14);seg(C/2-.14,C/2,0,1.25,'fence',false,.14);seg(-C/2,C/2,.8,.09,'fence',false,.07);seg(-C/2,C/2,.35,.09,'fence',false,.07);
   for(let q=1;q<=4;q++){const m=-C/2+q*C/5;seg(m-.035,m+.035,0,1.05,'fence',false,.06)}
   if(hz)col(cx-C/2,cx+C/2,cz-.1,cz+.1,yb-.3,yb+1.5);else col(cx-.1,cx+.1,cz-C/2,cz+C/2,yb-.3,yb+1.5)} // más alta de lo que se ve: no se salta
  else{seg(-C/2,C/2,0,.9,'wall',true);seg(-C/2,C/2,2.1,BWH-2.1,'wall',false);seg(-C/2,-.9,.9,1.2,'wall',false);seg(.9,C/2,.9,1.2,'wall',false);seg(-.9,.9,.9,1.2,'glass',false,.06)}};
 for(const[k,ty]of b.e)edge(k,ty,by,A,'');
 for(let n=2;n<=BMAXL;n++){const Ln=bmL(b,n),sb=smL(n-1);for(const[k,ty]of Ln.e)if(!bmStMid(sb,k))edge(k,ty,yL(n),AU[n],n+':')}
 // escaleras: peldaños sólidos (visual + colisión por debajo) y una rampa invisible por la que sube el jugador. Cada una sube desde su planta (clave «n:i,j»; la planta 1 no lleva prefijo).
 for(const[k,d]of b.s){const sq=/^(\d+):(.*)$/.exec(k),n=sq?+sq[1]:1,kc=sq?sq[2]:k;if(n>=BMAXL||smL(n).get(kc)!==k)continue;const p=kc.split(','),i=+p[0],j=+p[1],v=BDIR[d],i2=i+v[0],j2=j+v[1],
   xa=g.ox+Math.min(i,i2)*C,xb=g.ox+(Math.max(i,i2)+1)*C,za=g.oz+Math.min(j,j2)*C,zb=g.oz+(Math.max(j,j2)+1)*C,ax=v[0]!==0,sg=ax?v[0]:v[1],
   yb=yL(n),y0=n===1?by+.14:yb,rise=yL(n+1)-y0,ns=12,run=2*C/ns,sh=rise/ns,low=ax?(sg>0?xa:xb):(sg>0?za:zb);
  for(let q=0;q<ns;q++){const a0=low+sg*q*run,a1=low+sg*(q+1)*run,lo=Math.min(a0,a1),hi=Math.max(a0,a1),top=y0+(q+.5)*sh;
   const AS=n===1?A:AU[n];if(ax)bmBox(AS.stair,(lo+hi)/2,yb-.1,(za+zb)/2,run,top-yb+.1,C);else bmBox(AS.stair,(xa+xb)/2,yb-.1,(lo+hi)/2,C,top-yb+.1,run);
   const y1=y0+q*sh-.3;if(y1>yb+.06){if(ax)col(lo,hi,za,zb,yb-.3,y1);else col(xa,xb,lo,hi,yb-.3,y1)}}
  const rp={x0:xa,x1:xb,z0:za,z1:zb,y0,up:sg,rise,ax};RAMPS.push(rp);t._rp.push(rp)}
 // muebles: una malla por planta (colores por vértice) + una malla sin sombreado para lo que brilla (pantalla de la lámpara). Clave de la planta n≥2: «n:i,j».
 {const FP=[],FC=[],GP=[],GC=[];for(let n=0;n<=BMAXL;n++){FP.push([]);FC.push([]);GP.push([]);GC.push([])}
  for(const[k,v]of b.m){const mq=/^(\d+):(.*)$/.exec(k),lv=mq?+mq[1]:1,pk=(mq?mq[2]:k).split(','),i=+pk[0],j=+pk[1],def=FURN[v[0]];if(!def)continue;
   const d=v[1],fo=bmFOff(def,d),cx=g.ox+(i+.5)*C+fo[0],cz=g.oz+(j+.5)*C+fo[1],yb=lv>1?yL(lv):by+.14,L=lv;
   const a=(lx,ly,lz,sx,sy,sz,hex,gl)=>{let x=lx,z=lz,w=sx,e=sz;if(d===0){x=-lx;z=-lz}else if(d===1){x=lz;z=-lx;w=sz;e=sx}else if(d===3){x=-lz;z=lx;w=sz;e=sx}
    const c=fcol(hex),P=gl?GP[L]:FP[L],CC=gl?GC[L]:FC[L];for(let q=0;q<BUNIT.length;q+=3){P.push(BUNIT[q]*w+cx+x,BUNIT[q+1]*sy+yb+ly+sy/2,BUNIT[q+2]*e+cz+z);CC.push(c.r,c.g,c.b)}};
   def.p(a);
   const odd=d===1||d===3,fw=(odd?def.fp[1]:def.fp[0])/2,fd=(odd?def.fp[0]:def.fp[1])/2;
   if(!def.nc)col(cx-fw,cx+fw,cz-fd,cz+fd,yb-.3,yb+def.h);
   if(def.it){const ia={x:cx,y:yb,z:cz,m:{userData:{}},type:def.it,extra:null,use:0,on:false};INTERACTS.push(ia);t._ia.push(ia)}}
  const fm=(P,CC,list,gl)=>{if(!P.length)return;const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3));ge.setAttribute('color',new THREE.Float32BufferAttribute(CC,3));ge.computeVertexNormals();
   const me=new THREE.Mesh(ge,gl?BMAT.fglow:BMAT.furn);if(!gl){me.castShadow=true;me.receiveShadow=true}scene.add(me);list.push(me)};
  fm(FP[1],FC[1],t._ms,false);fm(GP[1],GC[1],t._ms,true);for(let n=2;n<=BMAXL;n++){fm(FP[n],FC[n],t._msU[n],false);fm(GP[n],GC[n],t._msU[n],true)}}
 const mk=(AA,list,n)=>{for(const m in AA){if(!AA[m].length)continue;const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(AA[m],3));ge.computeVertexNormals();
  const mt=(n>1&&(m==='roof2'||m==='roofp'||m==='slab'))?BMATL[n][m==='roof2'?'r':m==='roofp'?'p':'s']:BMAT[m];
  const me=new THREE.Mesh(ge,mt);if(m!=='glass'){me.castShadow=true;me.receiveShadow=true}scene.add(me);list.push(me);if(m==='roof')t.roofMesh=me}};
 mk(A,t._ms,1);for(let n=2;n<=BMAXL;n++)mk(AU[n],t._msU[n],n);bmRoofVis()}
// el techo se ve siempre (también al entrar): tiene colisión para la cámara, que se queda por debajo al estar dentro
// en el editor: se ve a través del techo de la planta que editas y se ocultan las plantas de arriba; las de abajo se ven opacas (su techo es tu suelo)
function bmRoofVis(){const on=!!BM.on,l=BM.lvl,sv=(m,tr,o)=>{if(m.transparent!==tr){m.transparent=tr;m.opacity=tr?o:1;m.needsUpdate=true}};
 sv(BMAT.roof,on,.75);sv(BMAT.slab,on&&l===1,.75);
 for(let n=2;n<=BMAXL;n++){sv(BMATL[n].r,on&&l===n,.6);sv(BMATL[n].p,on&&l===n,.6);sv(BMATL[n].s,on&&l===n,.75)}
 for(const t of TERRENOS){if(t.roofMesh)t.roofMesh.visible=true;const ed=on&&t===BM.t;for(let n=2;n<=BMAXL;n++)(t._msU&&t._msU[n]||[]).forEach(m=>{m.visible=!(ed&&n>l)});(t._doors||[]).forEach(d=>{if(d.up)d.pv.visible=!(ed&&d.up>l)})}}
setInterval(bmRoofVis,250);
// ---- interfaz ----
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:'#bmUI{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:70;display:none;background:rgba(15,20,30,.9);color:#fff;border-radius:14px;padding:10px 12px;width:min(640px,calc(100vw - 16px));box-sizing:border-box;font:14px system-ui,sans-serif;text-align:center;user-select:none}#bmUI .bmi{font-weight:700;margin-bottom:4px}#bmUI small{display:block;color:#b8c4d4;margin:2px 0 6px}#bmUI .bmt{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}#bmUI button{border:0;border-radius:9px;background:#3a4357;color:#fff;padding:7px 10px;font-size:14px;cursor:pointer;min-width:62px}#bmUI button.on{background:#a84be8}#bmUI select{border:0;border-radius:9px;background:#3a4357;color:#fff;padding:7px 10px;font-size:14px;cursor:pointer}#bmUI button.bmx{background:#2f9e5a}#bmUI .bmr{margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}body.bm #tc{display:none!important}body.bm canvas{touch-action:none}'}));
const bmUI=document.createElement('div');bmUI.id='bmUI';bmUI.innerHTML='<div class="bmi" id="bmInfo"></div><small id="bmHelp"></small><div class="bmt" id="bmTools"></div><div class="bmt" id="bmFurn" style="margin-top:6px;display:none"></div><div class="bmr"><span id="bmLvs" style="display:contents"></span><button id="bmRot">↻ Girar</button><button id="bmZm">🔍−</button><button id="bmZp">🔍+</button><button id="bmBz">🏪 Negocio</button><button class="bmx" id="bmEx">✅ Terminar</button></div>';document.body.appendChild(bmUI);
bmUI.addEventListener('pointerdown',e=>e.stopPropagation());
$('bmEx').addEventListener('click',()=>bmExit());$('bmBz').addEventListener('click',()=>{const t=BM.t;if(!t)return;bmExit();terrBizOpen(t)});$('bmZm').addEventListener('click',()=>{BM.zoom=clamp(BM.zoom*1.15,.6,1.8)});$('bmZp').addEventListener('click',()=>{BM.zoom=clamp(BM.zoom/1.15,.6,1.8)});
$('bmRot').addEventListener('click',()=>bmRot2());function bmRot2(){if(BM.tool==='yard'){BM.yv=(BM.yv+1)%3;bmToolsUpd()}else BM.sd=(BM.sd+1)%4;bmGhostUpd()}
function bmFurnUpd(){const e=$('bmFurn');if(!e)return;if(!BM.on||BM.tool!=='furn'){e.style.display='none';return}
 const ks=Object.keys(FURN).filter(k=>inv[k]&&inv[k].cat==='Muebles'&&inv[k].n>0);if(!ks.includes(BM.fi))BM.fi=ks[0]||null;e.style.display='';
 e.innerHTML=ks.length?ks.map(k=>'<button data-f="'+k+'" class="'+(BM.fi===k?'on':'')+'">'+FURN[k].ico+' '+k+' ×'+inv[k].n+'</button>').join(''):'<small style="margin:0">No te quedan muebles en el inventario. Cómpralos en la tienda de muebles y vuelve aquí.</small>';
 e.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{BM.fi=b.dataset.f;bmFurnUpd();bmGhostUpd()}))}
function bmHelpUpd(){$('bmHelp').textContent=(IS_TOUCH?'Toca o arrastra para colocar · dos dedos: mover la vista y zoom':'Clic o arrastra para colocar · clic derecho o Espacio+arrastrar (o WASD / flechas): mover la vista · Inicio: centrar · rueda: zoom · teclas 1-'+bmTL().length+': herramienta · Tab / Mayús+Tab: cambiar de planta · Esc: salir')+(BM.lvl>=2?' · Planta '+BM.lvl+': puedes construir paredes, techos y muebles sin suelo debajo; el suelo 🪵 es opcional (€'+BCOST.slab+' por casilla; borrar sobre una casilla vacía lo quita) · techo plano, a 2 aguas o a 4 aguas (la cumbrera sigue el lado largo; sobre un techo ya puesto cambia su tipo)'+(BM.lvl<BMAXL?' · escalera: '+(IS_TOUCH?'↻ gira':'R gira')+' (2 celdas, necesita suelo debajo; sube a la planta '+(BM.lvl+1)+')':' · es la planta más alta (máximo '+BMAXL+')')+' · techo plano = suelo de la planta de arriba':' · el techo de cada planta es el suelo de la siguiente (hasta '+BMAXL+' plantas) · escalera: '+(IS_TOUCH?'↻ gira':'R gira')+' (ocupa 2 celdas) · garaje: 2 lados seguidos (tecla 0) · suelo exterior: '+(IS_TOUCH?'el botón':'R')+' cambia el tipo')+' · muebles (tecla B): se colocan sobre suelo, '+(IS_TOUCH?'↻ gira':'R gira')+' · borrar devuelve el 50 % (los muebles vuelven al inventario)'}
function bmToolsUpd(){$('bmTools').innerHTML=bmTL().map(k=>'<button data-k="'+k+'" class="'+(BM.tool===k?'on':'')+'">'+BICON[k]+' '+(BM.lvl>=2&&k==='roof'?'Techo plano':BNAME[k])+(k==='furn'?'<br><small style="margin:0;color:#9fe3b4">inventario</small>':BCOST[k]?'<br><small style="margin:0;color:#ffd966">€'+BCOST[k]+'</small>':'<br><small style="margin:0">50 %</small>')+'</button>').join('');
 $('bmTools').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{BM.tool=b.dataset.k;BM.hv=null;bmToolsUpd();bmGhostUpd()}));
 {const nl=Math.max(BM.nl||1,BM.lvl);BM.nl=nl;
  $('bmLvs').innerHTML='<select id="bmLvSel" title="Planta">'+Array.from({length:nl},(_,i)=>'<option value="'+(i+1)+'"'+(BM.lvl===i+1?' selected':'')+'>🏢 Planta '+(i+1)+'</option>').join('')+(nl<BMAXL?'<option value="add">➕ Añadir planta</option>':'')+'</select>';
  $('bmLvSel').addEventListener('change',e=>{const v=e.target.value;if(v==='add'){BM.nl=nl+1;bmLevel(nl+1)}else bmLevel(+v)})}
 $('bmRot').style.display=(BM.tool==='stair'||BM.tool==='yard'||BM.tool==='furn')?'':'none';$('bmRot').textContent=BM.tool==='yard'?'🎨 '+YNAME[BM.yv]:'↻ Girar';bmFurnUpd();bmHelpUpd()}
function bmLevel(n){if(!BM.on)return;BM.lvl=n;if(n>(BM.nl||1))BM.nl=n;if(!bmTL().includes(BM.tool))BM.tool=n>=2?'wall':'floor';BM.hv=null;if(BM.grid)BM.grid.position.y=(n-1)*BLH;bmToolsUpd();bmInfoUpd();bmGhostUpd();bmRoofVis()}
function bmInfoUpd(){const t=BM.t;if(t)$('bmInfo').textContent='🏗️ Terreno nº '+t.id+' · '+t.w+'×'+t.d+' m · planta '+BM.lvl+'/'+BMAXL+' · 💶 €'+Math.round(money)+' · '+bmCount(t)+' módulos'}
// ---- cursor (fantasma) y rejilla ----
const BG={m:new THREE.MeshBasicMaterial({color:0x55ff88,transparent:true,opacity:.55,depthTest:false,side:THREE.DoubleSide})};
BG.c=new THREE.Mesh(new THREE.PlaneGeometry(BCELL,BCELL),BG.m);BG.c.rotation.x=-Math.PI/2;BG.c.renderOrder=999;BG.e=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),BG.m);BG.e.renderOrder=999;
BG.s=new THREE.Mesh(new THREE.BoxGeometry(BCELL,.25,2*BCELL),BG.m);BG.s.renderOrder=999;BG.s.rotation.order='YXZ';
function bmGhostUpd(){BG.c.visible=BG.e.visible=BG.s.visible=false;const h=BM.hv;if(!h||!BM.on)return;const t=BM.t,g=bmGrid(t),by=bmBy(t),tool=BM.tool,off=(BM.lvl-1)*BLH;
 if(tool==='stair'&&h.kind==='c'){const st=bmStairOK(t,h.i,h.j,BM.sd);BG.m.color.set(!st.ok||money<BCOST.stair?0xff3333:0x55ff88);
  const v=BDIR[BM.sd],rise=BM.lvl===1?BLH-.14:BLH,th=Math.atan2(rise,2*BCELL);
  BG.s.position.set(g.ox+(h.i+.5)*BCELL+v[0]*BCELL/2,(BM.lvl===1?by+.14:by+off)+rise/2,g.oz+(h.j+.5)*BCELL+v[1]*BCELL/2);BG.s.rotation.set(-th,[Math.PI,Math.PI/2,0,-Math.PI/2][BM.sd],0);BG.s.scale.set(1,1,1/Math.cos(th));BG.s.visible=true;return}
 if(tool==='furn'){if(h.kind!=='c')return;const nm=BM.fi,mk=(BM.lvl>=2?BM.lvl+':':'')+h.key,old=t.b&&t.b.m.get(mk),has=nm&&inv[nm]&&inv[nm].n>0,ok=bmFCan(t,h.key,BM.lvl)&&nm&&(has||(old&&old[0]===nm));
  BG.m.color.set(ok?0x55ff88:0xff3333);const cx=g.ox+(h.i+.5)*BCELL,cz=g.oz+(h.j+.5)*BCELL,v=BDIR[BM.sd];BG.c.position.set(cx,by+.4+off,cz);BG.c.visible=true;
  BG.e.scale.set(v[0]?.25:1.4,.5,v[0]?1.4:.25);BG.e.position.set(cx+v[0]*1.25,by+.5+off,cz+v[1]*1.25);BG.e.visible=true;return}
 BG.m.color.set(tool==='erase'?0xff8844:money>=BCOST[tool]?0x55ff88:0xff3333);
 if(h.kind==='c'){BG.c.position.set(g.ox+(h.i+.5)*BCELL,by+.4+off,g.oz+(h.j+.5)*BCELL);BG.c.visible=true}
 else{const hz=h.o==='h';let L=BCELL,ex=hz?g.ox+(h.i+.5)*BCELL:g.ox+h.i*BCELL,ez=hz?g.oz+h.j*BCELL:g.oz+(h.j+.5)*BCELL;if(tool==='garage'){const pr=bmGPair(t,h.o,h.i,h.j);if(pr){L=2*BCELL;ex=hz?g.ox+(pr.a[0]+1)*BCELL:g.ox+pr.a[0]*BCELL;ez=hz?g.oz+pr.a[1]*BCELL:g.oz+(pr.a[1]+1)*BCELL}else BG.m.color.set(0xff3333)}BG.e.scale.set(hz?L:.5,.5,hz?.5:L);BG.e.position.set(ex,by+.5+off,ez);BG.e.visible=true}}
function bmGridMake(){const t=BM.t,g=bmGrid(t),y=bmBy(t)+.22,p=[];for(let a=0;a<=g.nx;a++)p.push(g.ox+a*BCELL,y,g.oz,g.ox+a*BCELL,y,g.oz+g.nz*BCELL);for(let b=0;b<=g.nz;b++)p.push(g.ox,y,g.oz+b*BCELL,g.ox+g.nx*BCELL,y,g.oz+b*BCELL);
 const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return new THREE.LineSegments(ge,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.6}))}
// ---- cámara cenital ----
const BMK={};
function bmPanClamp(){const g=bmGrid(BM.t),mx=g.nx*BCELL/2+10,mz=g.nz*BCELL/2+10;BM.ox=clamp(BM.ox||0,-mx,mx);BM.oz=clamp(BM.oz||0,-mz,mz)}
function bmCam(){const t=BM.t;if(!t)return;const g=bmGrid(t),by=bmBy(t),tf=Math.tan(cam.fov*Math.PI/360),H=Math.max((g.nz*BCELL/2+5)/tf,(g.nx*BCELL/2+5)/(tf*cam.aspect))*BM.zoom,oz=H*.07;
 // mover la vista con WASD / flechas
 const now=performance.now(),dt=Math.min(.1,(now-(BM.pt||now))/1000);BM.pt=now;
 const kx=((BMK.ArrowRight||BMK.KeyD)?1:0)-((BMK.ArrowLeft||BMK.KeyA)?1:0),kz=((BMK.ArrowDown||BMK.KeyS)?1:0)-((BMK.ArrowUp||BMK.KeyW)?1:0);
 if(kx||kz){const sp=H*.55*dt;BM.ox=(BM.ox||0)+kx*sp;BM.oz=(BM.oz||0)+kz*sp}
 bmPanClamp();const cx=t.x+BM.ox,cz=t.z+BM.oz;
 const fy=by+(BM.lvl-1)*BLH;cam.up.set(0,0,-1);cam.position.set(cx,fy+H,cz+oz);cam.lookAt(cx,fy,cz+oz)}
// ---- puntero → celda o arista ----
const BRC=new THREE.Raycaster();
function bmPoint(e){const by=bmBy(BM.t)+.14+(BM.lvl-1)*BLH;cam.updateMatrixWorld();BRC.setFromCamera({x:e.clientX/innerWidth*2-1,y:-(e.clientY/innerHeight)*2+1},cam);const o=BRC.ray.origin,d=BRC.ray.direction;if(Math.abs(d.y)<1e-6)return null;const s=(by-o.y)/d.y;if(s<0)return null;return{x:o.x+d.x*s,z:o.z+d.z*s}}
function bmPick(p){if(!p)return null;const t=BM.t,g=bmGrid(t),u=(p.x-g.ox)/BCELL,v=(p.z-g.oz)/BCELL;if(u<-.3||v<-.3||u>g.nx+.3||v>g.nz+.3)return null;
 const i=clamp(Math.floor(u),0,g.nx-1),j=clamp(Math.floor(v),0,g.nz-1),dT=v-j,dB=j+1-v,dL=u-i,dR=i+1-u,m=Math.min(dT,dB,dL,dR);let e;
 if(m===dT)e=['h',i,j];else if(m===dB)e=['h',i,j+1];else if(m===dL)e=['v',i,j];else e=['v',i+1,j];
 const ek=e.join(','),edge={kind:'e',key:ek,o:e[0],i:e[1],j:e[2]},cell={kind:'c',key:i+','+j,i,j};
 if(EDGET[BM.tool]||BM.tool==='garage')return edge;if(BM.tool==='erase'&&m<.3&&bmL(bmData(t),BM.lvl,true).e.has(ek))return edge;return cell}
function bmApply(h){if(!h||!BM.on)return;const t=BM.t,b=bmData(t),tool=BM.tool,n=BM.lvl,l2=n>=2,L=bmL(b,n,true),Lb=l2?bmL(b,n-1,true):null,sm=bmStairMap(t,n),smb=l2?bmStairMap(t,n-1):null,pf=l2?n+':':'';let ch=false;
 // L = datos de la planta que editas · Lb = la de abajo (su techo es tu suelo) · sm = escaleras que suben desde aquí · smb = escaleras que llegan aquí desde abajo (hueco en el suelo)
 if(tool==='erase'){
  const fk=pf+h.key,fv=h.kind==='c'&&b.m.get(fk);
  if(fv){b.m.delete(fk);bmFGive(fv[0]);toast('🛋️ '+fv[0]+' vuelve a tu inventario');ch=true}
  else if(h.kind==='e'){const mp=L.e,ty=mp.get(h.key);if(ty>=5){const pq=h.key.split(','),o=pq[0],i=+pq[1],j=+pq[2],sg=ty===5?1:-1,k2=o+','+(o==='h'?i+sg:i)+','+(o==='h'?j:j+sg);mp.delete(h.key);if(mp.get(k2)===(ty===5?6:5))mp.delete(k2);money+=Math.round(BCOST.garage/2);ch=true}else if(ty){money+=Math.round(BCOST[ETOOL[ty]]/2);mp.delete(h.key);ch=true}}
  else if(l2){if(sm.has(h.key)){b.s.delete(sm.get(h.key));money+=Math.round(BCOST.stair/2);ch=true}
   else if(L.r.has(h.key)){money+=Math.round(bmRCn(L,h.key)/2);L.r.delete(h.key);L.rt.delete(h.key);ch=true}
   else if(Lb.r.has(h.key)){money+=Math.round((n===2?BCOST.roof:bmRCn(Lb,h.key))/2);Lb.r.delete(h.key);Lb.rt.delete(h.key);ch=true}}
  else if(sm.has(h.key)){b.s.delete(sm.get(h.key));money+=Math.round(BCOST.stair/2);ch=true}
  else if(b.r.has(h.key)){b.r.delete(h.key);money+=Math.round(BCOST.roof/2);ch=true}else if(b.f.has(h.key)){b.f.delete(h.key);money+=Math.round(BCOST.floor/2);ch=true}else if(b.o.has(h.key)){b.o.delete(h.key);money+=Math.round(BCOST.yard/2);ch=true}}
 else if(tool==='garage'){if(l2||h.kind!=='e')return;const pr=bmGPair(t,h.o,h.i,h.j);
  if(!pr){toast('🚗 El garaje ocupa 2 lados seguidos de cuadrado: no cabe ahí');return}
  const oa=b.e.get(pr.ka),oc=b.e.get(pr.kc);if(oa===5&&oc===6)return;
  if(oa>=5||oc>=5){toast('🚗 Ahí ya hay un garaje: bórralo antes');return}
  const net=BCOST.garage-(oa?Math.round(BCOST[ETOOL[oa]]/2):0)-(oc?Math.round(BCOST[ETOOL[oc]]/2):0);if(net>0&&!pay(net))return;if(net<0)money-=net;
  b.e.set(pr.ka,5);b.e.set(pr.kc,6);ch=true}
 else if(EDGET[tool]){const mp=L.e,nt=EDGET[tool],old=mp.get(h.key);if(old===nt)return;
  if(!l2&&old>=5){toast('🚗 Ahí está el garaje: bórralo antes de poner otra cosa');return}
  if(l2&&bmStMid(smb,h.key)){toast('🪜 Ahí van los peldaños: pon la pared a un lado de la escalera o en su salida (con puerta)');return}
  const net=BCOST[tool]-(old?Math.round(BCOST[ETOOL[old]]/2):0);if(net>0&&!pay(net))return;if(net<0)money-=net;mp.set(h.key,nt);ch=true}
 else if(tool==='stair'){if(h.kind!=='c'||n>=BMAXL)return;const d=BM.sd,st=bmStairOK(t,h.i,h.j,d),sk=pf+h.key,old=b.s.get(sk),cells=[h.key,st.k2];
  if(!st.ok){toast('🪜 La escalera ocupa 2 celdas: no cabe ahí');return}
  if(old===d)return;
  if(cells.some(c=>sm.has(c)&&sm.get(c)!==sk)){toast('🪜 Ahí ya hay otra escalera');return}
  if(l2){if(cells.some(c=>smb.has(c))){toast('🪜 Ahí llega la escalera de la planta de abajo');return}
   if(!cells.every(c=>bmHasFloor(b,n,c))){toast('🪜 En la planta '+n+' la escalera necesita suelo debajo (2 casillas): pon suelo 🪵 en la planta '+n+' o techo plano en la de abajo');return}}
  if(old===undefined&&!pay(BCOST.stair))return;
  cells.forEach(c=>{if(L.r.has(c)){money+=Math.round((l2?bmRCn(L,c):BCOST.roof)/2);L.r.delete(c);L.rt.delete(c)}}); // hueco en el techo para poder subir
  b.s.set(sk,d);ch=true}
 else if(tool==='furn'){if(h.kind!=='c')return;const nm=BM.fi,fo=nm&&inv[nm],mk=pf+h.key,old=b.m.get(mk);
  if(!nm||!FURN[nm]){toast('🛋️ Elige un mueble de tu inventario (compra en la tienda de muebles)');return}
  if(!bmFCan(t,h.key,n)){toast(sm.has(h.key)||(smb&&smb.has(h.key))?'🪜 Ahí está la escalera':'🟫 Primero pon suelo (o suelo exterior) en esa casilla');return}
  if(old&&old[0]===nm){if(old[1]===BM.sd)return;b.m.set(mk,[nm,BM.sd]);ch=true}
  else{if(!fo||fo.n<1){toast('🛋️ No te quedan: '+nm);return}if(old)bmFGive(old[0]);fo.n--;b.m.set(mk,[nm,BM.sd]);ch=true}}
 else if(tool==='yard'){if(l2)return;const old=b.o.get(h.key);if(old===BM.yv)return;if(old===undefined&&!pay(BCOST.yard))return;b.o.set(h.key,BM.yv);ch=true}
 else if(l2&&tool==='slab'){if(h.kind!=='c'||Lb.r.has(h.key))return;if(smb.has(h.key)){toast('🪜 Ahí llega la escalera: no se puede poner suelo');return}if(!pay(BCOST.slab))return;Lb.r.add(h.key);ch=true}
 else if(l2){const nt=tool==='roofg'?1:tool==='roofh'?2:0,has=L.r.has(h.key),old=L.rt.get(h.key)||0;if(has&&old===nt)return; // sobre un techo ya puesto, cambia su tipo
  if(sm.has(h.key)){toast('🪜 Ahí está la escalera: bórrala antes de poner techo');return}
  const net=BCOST[RTOOL[nt]]-(has?Math.round(BCOST[RTOOL[old]]/2):0);if(net>0&&!pay(net))return;if(net<0)money-=net;L.r.add(h.key);if(nt)L.rt.set(h.key,nt);else L.rt.delete(h.key);ch=true}
 else{const set=tool==='roof'?b.r:b.f;if(set.has(h.key))return;if(tool==='roof'&&sm.has(h.key)){toast('🪜 Ahí está la escalera: bórrala antes de poner techo');return}if(!pay(BCOST[tool]))return;set.add(h.key);ch=true}
 if(ch){const rf=bmClean(t),fr=BM.fr|0;BM.fr=0;if(rf){money+=rf;toast('Se han retirado piezas de las plantas de arriba (+€'+rf+')')}if(fr)toast('🛋️ '+fr+' mueble'+(fr>1?'s':'')+' sin suelo vuelve'+(fr>1?'n':'')+' a tu inventario');bmRebuild(t);bmInfoUpd();bmFurnUpd();bmGhostUpd();clearTimeout(BM.st);BM.st=setTimeout(()=>{try{saveGame()}catch(e){}},1500)}}
function bmEnter(t){if(BM.on||!t||!t.owned)return;BM.on=true;BM.t=t;BM.tool='floor';BM.lvl=1;BM.nl=bmTop(t);BM.sd=2;BM.zoom=1.2;BM.ox=BM.oz=0;BM.pt=0;BM.hv=null;dlgOpen=true;try{document.exitPointerLock&&document.exitPointerLock()}catch(e){}for(const k in K)K[k]=false;
 document.body.classList.add('bm');BM.grid=bmGridMake();scene.add(BM.grid);scene.add(BG.c);scene.add(BG.e);scene.add(BG.s);BG.c.visible=BG.e.visible=false;bmUI.style.display='block';bmToolsUpd();bmInfoUpd();bmRoofVis();toast('🏗️ Modo construcción: terreno nº '+t.id)}
function bmExit(){if(!BM.on)return;BM.on=false;scene.remove(BM.grid);BM.grid.geometry.dispose();scene.remove(BG.c);scene.remove(BG.e);scene.remove(BG.s);bmUI.style.display='none';document.body.classList.remove('bm');cam.up.set(0,1,0);for(const k in BMK)delete BMK[k];BM.hv=null;BM.t=null;
 dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(e){}bmRoofVis();try{saveGame()}catch(e){}}
{const cv=ren.domElement;
 const TP=new Map();let spaceDown=false,tpLast=null,tpMulti=false,PN={on:false,id:null,p0:null};
 const panTo=(p0,p1)=>{if(!p0||!p1)return;BM.ox=(BM.ox||0)+(p0.x-p1.x);BM.oz=(BM.oz||0)+(p0.z-p1.z);bmPanClamp();bmCam()};
 const tpInfo=()=>{const a=[...TP.values()],p=a[0],q=a[1];return{x:(p.x+q.x)/2,y:(p.y+q.y)/2,d:Math.hypot(p.x-q.x,p.y-q.y)||1}};
 cv.addEventListener('pointermove',e=>{if(!BM.on)return;
  if(e.pointerType==='touch'&&TP.has(e.pointerId)){TP.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(TP.size>=2){e.preventDefault();const n=tpInfo();if(tpLast){BM.zoom=clamp(BM.zoom*tpLast.d/n.d,.6,1.8);bmCam();panTo(bmPoint({clientX:tpLast.x,clientY:tpLast.y}),bmPoint({clientX:n.x,clientY:n.y}))}tpLast=n;return}}
  if(PN.on&&e.pointerId===PN.id){e.preventDefault();panTo(PN.p0,bmPoint(e));return}
  const h=bmPick(bmPoint(e)),o=BM.hv,same=h&&o&&h.kind===o.kind&&h.key===o.key;BM.hv=h;bmGhostUpd();if((e.buttons&1)&&h&&!same&&BM.tool!=='stair'&&!tpMulti)bmApply(h)});
 cv.addEventListener('pointerdown',e=>{if(!BM.on)return;
  if(e.pointerType==='touch'){TP.set(e.pointerId,{x:e.clientX,y:e.clientY});if(TP.size>=2){e.preventDefault();tpMulti=true;BM.hv=null;bmGhostUpd();tpLast=tpInfo();return}}
  else if(e.button===1||e.button===2||(e.button===0&&spaceDown)){e.preventDefault();PN={on:true,id:e.pointerId,p0:bmPoint(e)};try{cv.setPointerCapture(e.pointerId)}catch(_){}cv.style.cursor='grabbing';return}
  if(e.button!==0||tpMulti)return;e.preventDefault();const h=bmPick(bmPoint(e));BM.hv=h;bmGhostUpd();bmApply(h)});
 const pEnd=e=>{if(e.pointerType==='touch'){TP.delete(e.pointerId);tpLast=TP.size>=2?tpInfo():null;if(!TP.size)tpMulti=false}if(PN.on&&e.pointerId===PN.id){PN.on=false;cv.style.cursor=''}};
 cv.addEventListener('pointerup',pEnd);cv.addEventListener('pointercancel',pEnd);
 addEventListener('keydown',e=>{if(!BM.on)return;const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;
  if(e.code==='Space'){spaceDown=true;e.preventDefault()}
  if(/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(e.code)){BMK[e.code]=1;e.preventDefault()}
  if(e.code==='Home'){e.preventDefault();BM.ox=BM.oz=0}});
 addEventListener('keyup',e=>{delete BMK[e.code];if(e.code==='Space')spaceDown=false});
 addEventListener('blur',()=>{for(const k in BMK)delete BMK[k];spaceDown=false;PN.on=false;TP.clear();tpMulti=false;tpLast=null});
 cv.addEventListener('wheel',e=>{if(!BM.on)return;e.preventDefault();BM.zoom=clamp(BM.zoom*(e.deltaY<0?.9:1.1),.6,1.8)},{passive:false})}
addEventListener('keydown',e=>{if(!BM.on)return;const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;
 if(e.code==='Escape'){e.preventDefault();bmExit();return}if(e.code==='Tab'){e.preventDefault();{const nl=BM.nl||1;bmLevel(e.shiftKey?(BM.lvl+nl-2)%nl+1:BM.lvl%nl+1)};return}if(e.code==='KeyR'&&(BM.tool==='stair'||BM.tool==='yard'||BM.tool==='furn')){e.preventDefault();bmRot2();return}if(e.code==='KeyB'){e.preventDefault();BM.tool='furn';BM.hv=null;bmToolsUpd();bmGhostUpd();return}const k=bmTL()[(e.key==='0'?10:(+e.key||0))-1];if(k){BM.tool=k;BM.hv=null;bmToolsUpd();bmGhostUpd()}});
// aviso de interacción: cerca de un terreno propio → E para construir
function bmNear(tt){for(const q of TERRENOS)if(q.owned)tt(q,q.x,q.z,Math.max(q.w,q.d)/2,'bterr','E: construir en tu terreno nº '+q.id+' ('+q.w+'×'+q.d+' m) · vista desde arriba'+(q.biz&&q.biz.ty?' · L: tu negocio':' · L: montar negocio'));for(const q of TERRENOS)if(!q.owned&&q.bremote)tt(q,q.x,q.z,Math.hypot(q.w,q.d)/2+3,'tshop','E: comprar en '+((LTYPES[q.bremote.ty]||{}).n||'NEGOCIO').toLowerCase()+' de '+bizWho(q.bremote))}


