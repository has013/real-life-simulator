/* ===============================================================================================
   FICHA · tiendas-negocios.js
   Qué hay:          Estado del jugador, avisos (toast) y ventanas de diálogo (13.1), taller (13.2), compras en tiendas y concesionario (13.3), negocios propios (13.4 y 13.5), panel de administrador (14), habilidades (15.1) y dormir (15.2).
   Tócalo si quieres: cambiar tiendas, precios, el taller, los negocios propios, las habilidades o el panel de administrador
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 13. ESTADO DEL JUGADOR, DIÁLOGOS Y TIENDAS
//     Variables del jugador (dinero, posición, inventario…), avisos, ventanas de diálogo, hablar con
//     los dependientes, taller, compras y gestión de los negocios propios.
// =================================================================================================

// ---------- 13.1 Estado del jugador, avisos y ventanas de diálogo ----------
let loan=null,prevTod=9,bankW=null,estW=null,money=2500,inCar=null,yaw=0,pitch=.35,py=0,vy=0,walk=0,started=false,dlgOpen=false,drag=false,big=false,working=false;
const pl={x:24,z:1.5},inv={},flags={},K={},body=person(0xdd3322,outfitOpts());scene.add(body);body.position.set(pl.x,0,pl.z);
const ov=$('ov'),dlg=$('dlg'),mm=$('mm'),ctx=mm.getContext('2d');
const playing=()=>started&&ov.style.display==='none'&&!dlgOpen;
function toast(t){const e=$('toast');e.textContent=t;clearTimeout(toast.t);toast.t=setTimeout(()=>e.textContent='',2600)}
const ICON={'Comida para mascotas':'🦴','Manzanas':'🍎','Pan':'🍞','Agua':'💧','Pizza':'🍕','Leche':'🥛','Bocadillo':'🥪','Fruta':'🍓','Refresco':'🥤','Chocolate':'🍫','Sofá':'🛋️','Cama':'🛏️','Mesa':'🍽️','Lámpara':'💡','Armario':'🗄️','Sillón':'🪑','Mesa de centro':'🪵','Estantería':'📚','Mueble de TV':'📺','Alfombra':'🟥','Planta grande':'🪴','Nevera':'🧊','Cocina':'🍳','Encimera':'🚰','Taburete':'🪑','Mostrador':'🛍️','Caja registradora':'🧾','Estantería de tienda':'📦','Góndola':'🛒','Vitrina':'🪟','Nevera expositora':'🥶','Barra de bar':'🍸','Perchero':'👗','Cartel luminoso':'🪧','Café':'☕','Cerveza':'🍺','Tapa':'🍢','Bidón de gasolina':'⛽','Hamburguesa':'🍔','Hamburguesa doble':'🍔','Patatas fritas':'🍟','Pollo frito':'🍗','Nuggets':'🍗','Perrito caliente':'🌭','Refresco de cola':'🥤','Batido':'🥤','Menú completo':'🍱','Pizza margarita':'🍕','Pizza pepperoni':'🍕','Pizza cuatro quesos':'🍕','Pizza hawaiana':'🍕','Porción de pizza':'🍕','Pan de ajo':'🥖','Helado de vainilla':'🍦','Helado de chocolate':'🍦','Helado de fresa':'🍦','Cucurucho doble':'🍦','Polo de hielo':'🧊','Granizado':'🍧','Copa de helado':'🍨'},CARIC={hatch:'🚗',van:'🚐',sport:'🏎️',moto:'🏍️',bici:'🚲',patinete:'🛴'};
const row=(n,p,f,ic)=>`<div class="r">${ic?`<i class="ic">${ic}</i>`:''}<span>${n}</span><b>€${p}</b><button onclick="${f}">Comprar</button></div>`;
function openDlg(){dlgOpen=true;dlg.classList.remove('wide');dlg.style.display='block';document.exitPointerLock&&document.exitPointerLock();for(const k in K)K[k]=false}
function closeDlg(){if(SLP)return;dlgOpen=false;dlg.style.display='none';try{ren.domElement.requestPointerLock()}catch(e){}}
function talk(w){if(w.key==='town')townW=w;if(!isOpen(w.key)){toast('Cerrado: abre a las '+hrsTxt(w.key));return}if(w.key==='gym'){gymDesk();return}openDlg();const S=SHOPS[w.key];let h=`<h2>${S.n}</h2><p>${w.name}: «¡Bienvenido! ¿En qué puedo ayudarte?»</p>`;
 if(w.key==='dealer')S.cars.forEach((c,i)=>h+=row(SPEC[c[0]].name,c[1],`buyCar(${i})`,CARIC[c[0]]||'🚗'));
 else if(w.key==='estate'){estW=w;h+=estateHtml()}
 else if(w.key==='shop'){dlg.classList.add('wide');h+='<div id="sb"></div>'}
 else if(w.key==='pet'){petW=w;h+=petShopHtml()}else if(w.key==='garage')h+=garageHtml();
 else S.items.forEach((it,i)=>h+=(w.key==='furn'&&i===0?'<h3>🏠 Hogar</h3>':'')+(w.key==='furn'&&it[0]==='Mostrador'?'<h3>🏪 Mobiliario de negocio</h3>':'')+row(it[0],it[1],`buy('${w.key}',${i})`,ICON[it[0]]));
 h+=jobMenu(w.key);
 if(w.key==='bank'){bankW=w;h+=bankHtml()}if(FACT[w.key]){facW=w;h+=whHtml(w.key)}
 if(w.key==='hotel')h+='<div><button onclick="hotelSleep()">Dormir una noche: €100</button> <button onclick="hotelRent()">Alquilar habitación: €100 (cama arriba)</button></div>';dlg.innerHTML=h+`<div><button onclick="closeDlg()" style="background:#666">Salir</button></div>`;if(w.key==='shop')shopTab(SHOPTAB);if(w.key==='bank'){loanPrev();const la=document.getElementById('loanAmt');if(la)la.addEventListener('keydown',e=>e.stopPropagation())}if(w.key==='pet'){const pn=document.getElementById('petName');if(pn)pn.addEventListener('keydown',e=>e.stopPropagation())}}

// ---------- 13.2 Taller: mejoras y pintura de vehículos ----------
const UPM={hatch:1,sport:2,van:1.5,moto:.5},UPB={m:[400,900,1800],t:[200,450,900]};
function applyUp(c){const b=SPEC[c.t],lm=c.lm||0,lt=c.lt||0;c.spec=Object.assign({},b,{max:b.max*(1+.1*lm),acc:b.acc*(1+.1*lm),k:b.k*(1+.08*lm),tank:Math.round(b.tank*(1+.25*lt))})}
function upPrice(c,k){const l=k==='m'?c.lm||0:c.lt||0;return l>=3?null:Math.round(UPB[k][l]*(UPM[c.t]||1))}
function upgradesHtml(c){if(c.spec.nf)return '<p>Este vehículo no tiene motor ni depósito que mejorar.</p>';let h='<h3>Mejoras</h3>';
 [['m','Motor','⚙️','+10 % de velocidad y aceleración (gasta algo más)'],['t','Depósito','⛽','+25 % de capacidad']].forEach(a=>{const l=a[0]==='m'?c.lm||0:c.lt||0,p=upPrice(c,a[0]);
  h+=`<div class="r"><i class="ic">${a[2]}</i><span>${a[1]} · nivel ${l}/3<br><small>${a[3]}</small></span>${p===null?'<b>Máximo</b>':`<b>€${p}</b><button onclick="upgradeCar('${a[0]}')">Mejorar</button>`}</div>`});return h}
function upgradeCar(k){const c=paintTarget();if(!c||c.spec.nf){toast('No hay ningún vehículo tuyo cerca');return}const p=upPrice(c,k);if(p===null){toast('Ya está al máximo');return}if(!pay(p))return;
 const old=c.spec.tank;if(k==='m')c.lm=(c.lm||0)+1;else c.lt=(c.lt||0)+1;applyUp(c);c.fuel=Math.min(c.spec.tank,c.fuel+c.spec.tank-old);flags.upgrade=1;
 toast(k==='m'?'⚙️ Motor mejorado (nivel '+c.lm+')':'⛽ Depósito ampliado a '+c.spec.tank+' L');const w=WORKERS.find(x=>x.key==='garage');if(w)talk(w)}
function paintTarget(){if(inCar)return inCar;let b=null,bd=18;cars.forEach(q=>{if(!q.owned||q.mode==='ai')return;const d=Math.hypot(q.x-pl.x,q.z-pl.z);if(d<bd){bd=d;b=q}});return b}
function garageHtml(){const c=paintTarget();if(!c)return '<p>Para pintar necesitas tener un vehículo tuyo cerca (aparcado delante del taller).</p>';
 const pr=PAINT_PRICE[c.t]||150;let h=`<p>Vehículo: <b>${c.spec.name}</b></p>`+upgradesHtml(c)+'<h3>Pintura</h3>';
 PALETTE_GARAGE.forEach((a,i)=>h+=`<div class="r"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#${a[1].toString(16).padStart(6,'0')};border:1px solid #888;margin-right:8px"></span><span>${a[0]}</span><b>€${pr}</b><button onclick="paintCar(${i})">Pintar</button></div>`);return h}
function paintCar(i){const c=paintTarget(),a=PALETTE_GARAGE[i];if(!c||!a){toast('No hay ningún vehículo tuyo cerca');return}
 if((c.col||c.m.userData.col)===a[1]){toast('Ya es de ese color');return}
 if(!pay(PAINT_PRICE[c.t]||150))return;
 const o=new THREE.Color(c.m.userData.col!==undefined?c.m.userData.col:c.col),n=new THREE.Color(a[1]),mesh=c.m.children[0],at=mesh&&mesh.geometry.attributes.color;
 if(at){for(let k=0;k<at.count;k++)if(Math.abs(at.getX(k)-o.r)<.004&&Math.abs(at.getY(k)-o.g)<.004&&Math.abs(at.getZ(k)-o.b)<.004)at.setXYZ(k,n.r,n.g,n.b);at.needsUpdate=true}
 c.col=a[1];c.m.userData.col=a[1];flags.paint=1;toast('🎨 Tu '+c.spec.name+' ahora es '+a[0].toLowerCase());
 const w=WORKERS.find(x=>x.key==='garage');if(w)talk(w)}

// ---------- 13.3 Compras en tiendas y concesionario ----------
function pay(p){if(money<p){toast('No tienes suficiente dinero');return false}money-=p;sfx.cash();return true}
function buy(k,i){const it=SHOPS[k].items[i];if(PET_CLOTH[it[0]]&&inv[it[0]]&&inv[it[0]].n>0){toast('Ya tienes '+it[0]+' (póntelo a tu mascota)');return}if(!pay(it[1]))return;const cat=it[0]==='Comida para mascotas'?'Mascotas':PET_CLOTH[it[0]]?'Ropa de mascota':it[0]==='Bidón de gasolina'?'Combustible':k==='furn'?'Muebles':k==='shop'?'Ropa':'Comida',o=inv[it[0]]||(inv[it[0]]={n:0,cat,act:cat==='Ropa de mascota'?'Poner / quitar':cat==='Mascotas'?'Dar de comer':cat==='Muebles'?'Colocar en casa':cat==='Ropa'?'Ponerse':cat==='Combustible'?'Echar 8 L al coche':'Consumir'});o.n++;toast('Comprado: '+it[0]+' (guardado en el inventario)');if(k==='shop')shopTab(SHOPTAB);if(k==='pet'&&petW)talk(petW)}
function buyCar(i){const c=SHOPS.dealer.cars[i],w=WORKERS.find(x=>x.key==='dealer');if(!pay(c[1]))return;
 const k=spawnCar(c[0],c[2],w.sp.x+rr(-8,8),w.sp.z,Math.PI/2,'parked',{owned:true,col:c[2],fuel:SPEC[c[0]].tank*.8});flags.car=1;closeDlg();enterCar(k);toast('¡Nuevo '+SPEC[c[0]].name+'!')}

// ---------- 13.4 Negocios propios (locales): productos, almacén, obrador de pan, caja y mejoras ----------
const BIZN=['','Kiosco','Tienda','Tienda grande','Comercio','Gran comercio'],BIZINC=[0,600,1300,2400,4000,6500],BIZUP=[0,3000,7000,14000,26000];
const bizInc=(h,lv)=>Math.round(BIZINC[lv||h.lv||1]*(h.mul||1)*(h.ty&&LTYPES[h.ty]?LTYPES[h.ty].m:1));
// Productos [nombre, coste unidad, precio venta, icono]. La panadería aún no usa stock.
const PRODS={super:[['Agua',.4,1,'💧'],['Leche',.8,1.6,'🥛'],['Pan',.7,1.5,'🍞'],['Fruta',1,2.2,'🍎'],['Carne',3,6,'🥩'],['Snacks',.9,2,'🍫'],['Limpieza',1.5,3,'🧴']],
 bar:[['Cerveza',.8,2.5,'🍺'],['Refresco',.6,2,'🥤'],['Vino',1.5,4,'🍷'],['Copa',2,6,'🍸'],['Tapas',1.2,4,'🍢'],['Café',.3,1.5,'☕']],
 ropa:[['Camiseta',6,18,'👕'],['Vaqueros',14,40,'👖'],['Chaqueta',25,70,'🧥'],['Zapatillas',20,55,'👟'],['Gorra',3,10,'🧢'],['Vestido',15,45,'👗']],
 muebles:[['Silla',15,40,'🪑'],['Mesa',40,110,'🪵'],['Sofá',120,320,'🛋️'],['Cama',100,260,'🛏️'],['Lámpara',10,30,'💡'],['Armario',90,240,'🚪']]};
PRODS.pan=[['Barra de pan',0,1.8,'🍞'],['Baguette',0,1.5,'🥖'],['Focaccia',0,3.5,'🫓'],['Torta de aceite',0,3,'🥐']];
// Ingredientes [nombre, coste unidad, icono]; receta por hornada de 10 uds
const ING=[['Agua',.5,'💧'],['Harina',1.5,'🌾'],['Aceite',4,'🫒'],['Sal',.6,'🧂']],
 REC={'Barra de pan':{Harina:4,Agua:3,Sal:1},'Baguette':{Harina:3,Agua:2,Sal:1},'Focaccia':{Harina:4,Agua:2,Aceite:2,Sal:1},'Torta de aceite':{Harina:3,Aceite:2,Agua:1}};
const wh={},stCap=h=>40*(h.lv||1);let townW=null;
function whHtml(fk){const ks=FACT[fk]||[],mine=new Set(HOUSES.filter(x=>x.owned&&x.local&&x.ty).map(x=>x.ty));
 let t='<h3>📦 Mayorista para negocios</h3><p>Compra por packs de 10 uds. Se guardan en tu almacén y luego los repones en tu local (L).</p>';
 ks.forEach(k=>{t+='<h4>'+LTYPES[k].i+' '+LTYPES[k].n+(mine.has(k)?' <small>(tienes uno)</small>':'')+'</h4>';if(k==='pan')ING.forEach((q,i)=>{t+=row(q[0]+' ×10 · almacén: '+(wh['i:'+q[0]]||0),Math.round(q[1]*10),`whBuyI(${i})`,q[2])});else PRODS[k].forEach((q,i)=>{t+=row(q[0]+' ×10 · almacén: '+(wh[q[0]]||0),Math.round(q[1]*10),`whBuy('${k}',${i})`,q[3])})});return t}
function whBuyI(i){const q=ING[i];if(!pay(Math.round(q[1]*10)))return;wh['i:'+q[0]]=(wh['i:'+q[0]]||0)+10;toast('Comprado: '+q[0]+' ×10 (en tu almacén)');if(facW)talk(facW)}
function bakeHtml(h){h.stock=h.stock||{};let t='<h3>🥖 Obrador</h3><p>Compra ingredientes en la fábrica de comida (afueras, al este del barrio). Al reponer se hornea el pan (hornadas de 10 uds). Máx. '+stCap(h)+' por producto.</p><p><small>Ingredientes en almacén: '+ING.map(q=>q[2]+' '+q[0]+' '+(wh['i:'+q[0]]||0)).join(' · ')+'</small></p>';
 PRODS.pan.forEach((q,i)=>{t+=`<div class="r"><i class="ic">${q[3]}</i><span>${q[0]}<br><small>En tienda: <b>${h.stock[q[0]]||0}</b>/${stCap(h)} · venta €${q[2]}<br>Hornada ×10: ${Object.keys(REC[q[0]]).map(k=>REC[q[0]][k]+' '+k.toLowerCase()).join(', ')}</small></span><button onclick="bizPut(${h.id},${i},10)">Hornear +10</button><button onclick="bizPut(${h.id},${i},9999)">Todo</button></div>`});return t}
function bake(id,i,a){const h=BO(id),q=PRODS.pan[i],r=REC[q[0]];h.stock=h.stock||{};let made=0,why='';
 for(let b=0;b<(a>10?99:1);b++){const free=stCap(h)-(h.stock[q[0]]||0);if(free<=0){why='Estantería llena';break}const u=Math.min(10,free),need={};
  Object.keys(r).forEach(k=>need[k]=Math.ceil(r[k]*u/10));const miss=Object.keys(need).find(k=>(wh['i:'+k]||0)<need[k]);if(miss){why='Te falta '+miss.toLowerCase()+' (cómpralo en la fábrica de comida)';break}
  Object.keys(need).forEach(k=>wh['i:'+k]-=need[k]);h.stock[q[0]]=(h.stock[q[0]]||0)+u;made+=u}
 if(!made){toast(why);return}toast('Horneado: '+q[0]+' ×'+made);bizOpen(id)}
function whBuy(k,i){const q=PRODS[k][i];if(!pay(Math.round(q[1]*10)))return;wh[q[0]]=(wh[q[0]]||0)+10;toast('Comprado: '+q[0]+' ×10 (en tu almacén)');if(facW)talk(facW)}
function bizStock(h){if(h.ty==='pan')return bakeHtml(h);const P=PRODS[h.ty];if(!P)return'';h.stock=h.stock||{};
 let t='<h3>Mercancía</h3><p>Sin producto no vendes. Compra en la fábrica correspondiente (afueras, al este del barrio) y repón aquí (máx. '+stCap(h)+' por producto).</p>';
 P.forEach((q,i)=>{t+=`<div class="r"><i class="ic">${q[3]}</i><span>${q[0]}<br><small>En tienda: <b>${h.stock[q[0]]||0}</b>/${stCap(h)} · Almacén: ${wh[q[0]]||0} · venta €${q[2]}</small></span><button onclick="bizPut(${h.id},${i},10)">+10</button><button onclick="bizPut(${h.id},${i},9999)">Todo</button></div>`});return t}
function bizPut(id,i,a){if(BO(id).ty==='pan')return bake(id,i,a);const h=BO(id),q=PRODS[h.ty][i];h.stock=h.stock||{};const n=Math.min(a,wh[q[0]]||0,stCap(h)-(h.stock[q[0]]||0));if(n<=0){toast((wh[q[0]]||0)<=0?'No tienes '+q[0]+' en el almacén (cómpralo en la fábrica correspondiente, al este del barrio)':'Estantería llena');return}
 h.stock[q[0]]=(h.stock[q[0]]||0)+n;wh[q[0]]-=n;toast('Repuesto: '+q[0]+' ×'+n);bizOpen(id)}
function bizDay(h,msg){if(!h.ty){msg.push('tu local está vacío: elige qué negocio montar (L)');return}const lv=h.lv||1,P=PRODS[h.ty];let g;
 if(P){h.stock=h.stock||{};const avg=P.reduce((a,q)=>a+q[2],0)/P.length,D=bizInc(h,lv)/avg/P.length,out=[];g=0;
  P.forEach(q=>{const want=Math.round(D*(.7+Math.random()*.6)),have=h.stock[q[0]]||0,n=Math.min(want,have);h.stock[q[0]]=have-n;g+=n*q[2];if(have-n<=0)out.push(q[0])});g=Math.round(g);
  if(out.length)msg.push('local sin stock de '+out.join(', '))}
 else g=Math.round(bizInc(h,lv)*(.8+Math.random()*.4));h.till=Math.min(bizInc(h,lv)*3,(h.till||0)+g);msg.push('local +€'+g+' en caja')}
function bizPick(h){let t='<h2>🏪 Tu local nuevo</h2><p>Está vacío. Elige qué negocio montar (no se puede cambiar después):</p>';
 Object.keys(LTYPES).forEach(k=>{const T=LTYPES[k];t+=`<div class="r"><i class="ic">${T.i}</i><span>${T.n[0]+T.n.slice(1).toLowerCase()}<br><small>${T.d} ≈ €${Math.round(BIZINC[1]*T.m*(h.mul||1))}/día de inicio</small></span><button onclick="bizChoose(${h.id},'${k}')">Montar</button></div>`});
 return t+'<div><button onclick="closeDlg()" style="background:#666">Salir</button></div>'}
function bizChoose(id,k){const h=HOUSES[id];if(!h||h.ty||!LTYPES[k])return;if(!confirm('¿Montar '+LTYPES[k].n.toLowerCase()+'? No se podrá cambiar.'))return;h.ty=k;localIn(h,k);sfx.cash();toast('¡'+LTYPES[k].n+' montado!');bizOpen(id)}
function bizHtml(h){if(!h.ty)return bizPick(h);const T=LTYPES[h.ty],lv=h.lv||1,till=Math.round(h.till||0),cap=bizInc(h,lv)*3;
 let t=`<h2>${T.i} ${T.n[0]+T.n.slice(1).toLowerCase()}: ${BIZN[lv]} (nivel ${lv}/5)</h2><p>Ingresos: unos €${bizInc(h,lv)} al día. La caja se llena cada medianoche y guarda como máximo 3 días de ingresos.</p><div class="r"><span>Caja</span><b>€${till} / €${cap}</b><button onclick="bizCollect(${h.id})">Recoger</button></div>`;
 t+=lv<5?`<div class="r"><span>Mejorar a ${BIZN[lv+1]} (€${bizInc(h,lv+1)}/día)</span><b>€${BIZUP[lv]}</b><button onclick="bizUp(${h.id})">Mejorar</button></div>`:'<p>Nivel máximo alcanzado.</p>';
 return t+bizStock(h)+`<div><button onclick="closeDlg()" style="background:#666">Salir</button></div>`}
function bizOpen(id){const h=BO(id);if(!h)return;openDlg();dlg.innerHTML=bizHtml(h)}
function bizCollect(id){const h=BO(id),c=Math.round(h.till||0);if(c<=0){toast('La caja está vacía');return}h.till=0;money+=taxNet(c);sfx.cash();toast('Has recogido €'+c+' de la caja');bizOpen(id)}
function bizUp(id){const h=BO(id),lv=h.lv||1;if(lv>=5||!pay(BIZUP[lv]))return;h.lv=lv+1;if(h.ty)localIn(h,h.ty);toast('¡Local mejorado a '+BIZN[lv+1]+'!');bizOpen(id)}
function bizKey(){let b=null,bd=8;HOUSES.forEach(h=>{if(!h.local||!h.owned)return;const d=Math.hypot(h.door.x-pl.x,h.door.z-pl.z);if(d<bd){bd=d;b=h}});if(b)bizOpen(b.id);else if(terrBizNear())terrBizOpen(terrBizNear());else{let r=null,rd=99;HOUSES.forEach(h=>{if(!h.local||!h.remote||h.owned)return;const d=Math.min(Math.hypot(h.door.x-pl.x,h.door.z-pl.z)*1.5,Math.hypot(h.x-pl.x,h.z-pl.z));if(d<12&&d<rd){rd=d;r=h}});if(r)bsOpen(r.id);else{const rt=TERRENOS.find(t=>t.bremote&&!t.owned&&Math.hypot(pl.x-t.x,pl.z-t.z)<Math.hypot(t.w,t.d)/2+6);if(rt)bsOpen(100000+rt.id);else toast('Acércate a la puerta de tu local o de un negocio (L)')}}}


// ---------- 13.5 Convertir tu construcción de un terreno en negocio (fase 1) ----------
// Un terreno tuyo puede tener un negocio: t.biz = {id, ty, lv, till, stock}. Usa EL MISMO sistema que los locales de la ciudad (13.4).
// El id del negocio de un terreno es 100000 + el nº del terreno, y BO(id) devuelve el negocio sea de un local o de un terreno.
// Fase 1: solo en tu partida (los otros jugadores todavía no lo ven ni le compran) y sin interior propio.
const TBIZ_FEE=3000,TBIZ_MIN={f:6,r:6,w:8,d:1}; // licencia y requisitos mínimos del edificio (planta baja)
const terrAt=(x,z)=>TERRENOS.find(t=>Math.abs(t.x-x)<1&&Math.abs(t.z-z)<1)||null; // el negocio de un terreno se identifica por el centro del terreno
function BO(id){return id>=100000?((TERRENOS.find(q=>q.id===id-100000)||{}).biz||null):HOUSES[id]}
function terrBizCheck(t){const b=t.b,c={f:0,r:0,w:0,d:0};if(b){c.f=b.f.size;c.r=b.r.size;for(const v of b.e.values()){if(v===1||v===2||v===3)c.w++;if(v===2||v===5)c.d++}}
 c.ok=c.f>=TBIZ_MIN.f&&c.r>=TBIZ_MIN.r&&c.w>=TBIZ_MIN.w&&c.d>=TBIZ_MIN.d;return c}
function terrBizNear(){return TERRENOS.find(t=>t.owned&&Math.abs(pl.x-t.x)<=t.w/2+6&&Math.abs(pl.z-t.z)<=t.d/2+6)||null}
function terrBizHtml(t){const c=terrBizCheck(t),li=(n,v,m)=>'<div>'+(v>=m?'✅':'❌')+' '+n+' <small>('+v+' / '+m+')</small></div>';
 let h='<h2>🏪 Convertir en negocio · Terreno nº '+t.id+'</h2><p>Convierte tu construcción en un negocio. Licencia: <b>€'+TBIZ_FEE+'</b>. El tipo de negocio no se puede cambiar después.</p><p><b>Requisitos del edificio (planta baja):</b></p>'+li('Casillas de suelo',c.f,TBIZ_MIN.f)+li('Casillas con techo',c.r,TBIZ_MIN.r)+li('Paredes, puertas y ventanas',c.w,TBIZ_MIN.w)+li('Puerta de entrada',c.d,TBIZ_MIN.d);
 if(!c.ok)return h+'<p><small>Termina tu edificio en el modo construcción (E) y vuelve a pulsar L.</small></p><div><button onclick="closeDlg()" style="background:#666">Salir</button></div>';
 h+='<p>Elige qué negocio montar:</p>';
 Object.keys(LTYPES).forEach(k=>{const T=LTYPES[k];h+='<div class="r"><i class="ic">'+T.i+'</i><span>'+T.n[0]+T.n.slice(1).toLowerCase()+'<br><small>'+T.d+' ≈ €'+Math.round(BIZINC[1]*T.m)+'/día de inicio</small></span><button onclick="terrBizChoose('+t.id+',\''+k+'\')">Montar</button></div>'});
 return h+'<div><button onclick="closeDlg()" style="background:#666">Salir</button></div>'}
function terrBizOpen(t){if(!t||!t.owned)return;if(t.biz&&t.biz.ty){bizOpen(t.biz.id);return}openDlg();dlg.innerHTML=terrBizHtml(t)}
function terrBizChoose(tid,k){const t=TERRENOS.find(q=>q.id===tid);if(!t||!t.owned||t.biz||!LTYPES[k])return;if(!terrBizCheck(t).ok){toast('Tu edificio ya no cumple los requisitos');return}
 if(!confirm('¿Montar '+LTYPES[k].n.toLowerCase()+' por €'+TBIZ_FEE+'? No se podrá cambiar.'))return;if(!pay(TBIZ_FEE))return;
 t.biz={id:100000+tid,ty:k,lv:1,till:0,stock:{}};toast('¡'+LTYPES[k].n+' montado en tu terreno!');saveGame();bizOpen(t.biz.id)}

// =================================================================================================
// 14. PANEL DE ADMINISTRADOR
//     Panel del administrador: jugadores, dinero, hambre y energía, negocios, y hora y clima del mundo.
// =================================================================================================
// Se abre con el comando secreto del chat. El comando y la autorización viven SOLO en el servidor: aquí no hay ninguna contraseña.
// Si no eres administrador, el servidor ignora estos mensajes. ADM_SILENT=true oculta al jugador el aviso de que se le ha editado algo.
const ADM_SILENT=false,ADM={el:null,data:[]};
const admToast=t=>{if(!ADM_SILENT)toast(t)};
// Aplica un cambio enviado por el administrador a mi partida (dinero, hambre/energía o negocio) y lo guarda
function admApply(c){if(!c||typeof c!=='object')return;
 if(c.t==='money'){money=Math.max(0,Math.floor(Number(c.money)||0));sfx.cash();admToast('💼 Un administrador ha ajustado tu dinero: €'+Math.round(money))}
 else if(c.t==='vit'){if(c.h!=null)hunger=Math.max(0,Math.min(100,Number(c.h)||0));if(c.e!=null)energy=Math.max(0,Math.min(100,Number(c.e)||0));admToast('💼 Un administrador ha ajustado tu hambre y energía')}
 else if(c.t==='biz'){let h=xfFind(c.x,c.z,true),tt=null;if(!h){tt=terrAt(c.x,c.z);h=tt&&tt.owned&&tt.biz?tt.biz:null}if(!h||(!tt&&!h.owned))return;
  if(c.remove){if(dlgOpen)closeDlg();if(tt)tt.biz=null;else{releaseHouse(h);h.ty='';h.lv=0;h.till=0;h.stock={};try{localIn(h,'')}catch(_){}}admToast('💼 Un administrador te ha retirado un local')}
  else{if(c.lv){h.lv=Math.max(1,Math.min(5,c.lv|0));if(h.ty){try{localIn(h,h.ty)}catch(_){}}}
   if(c.till!=null)h.till=Math.max(0,Number(c.till)||0);
   if(c.stock&&typeof c.stock==='object'){h.stock=h.stock||{};for(const k in c.stock)h.stock[k]=Math.max(0,Math.floor(Number(c.stock[k])||0))}
   admToast('💼 Un administrador ha modificado tu negocio')}
  estateRefresh()}
 saveGame();bizSyncSend(true)}
function admOnPending(m){const a=Array.isArray(m.cmds)?m.cmds:[];a.forEach(admApply);if(a.length)govSend({type:'pend_ack',n:a.length})}
function admEnsure(){if(ADM.el)return;
 const d=document.createElement('div');d.id='admPanel';
 d.innerHTML='<div id="admHead"><b>🛠 Panel de administrador</b><span><button data-a="refresh">↻ Actualizar</button><button data-a="close">✕ Cerrar</button></span></div><div id="admWorld"></div><div id="admBody"></div>';
 document.body.appendChild(d);ADM.el=d;
 ['keydown','keyup','keypress','mousedown','mouseup','pointerdown','wheel','contextmenu'].forEach(ev=>d.addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'&&e.key==='Escape')admClose()}));
 d.addEventListener('click',admClick);d.addEventListener('change',admWorldChange);admWorldRender();setInterval(admWorldLive,1000)}
function admOpen(){admEnsure();try{chatOpen(false)}catch(_){}ADM.el.style.display='flex';dlgOpen=true;try{document.exitPointerLock&&document.exitPointerLock()}catch(_){}}
function admClose(){if(!ADM.el||ADM.el.style.display!=='flex')return;ADM.el.style.display='none';dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(_){}}
const admMoney=n=>'€'+Math.round(Number(n)||0).toLocaleString('es-ES');
function admRender(){if(!ADM.el)return;const b=ADM.el.querySelector('#admBody'),sc=b.scrollTop;
 b.innerHTML=(ADM.data.length?'':'<p>Todavía no hay jugadores registrados.</p>')+ADM.data.map(p=>{
  const biz=(p.biz||[]).map(q=>{const T=LTYPES[q.ty]||null,head='<b>'+(T?T.i+' '+pcEsc(T.n[0]+T.n.slice(1).toLowerCase()):'🏪 Local sin negocio')+'</b> <small>('+q.x+', '+q.z+')</small>';
   if(!T)return '<div class="admB" data-x="'+q.x+'" data-z="'+q.z+'">'+head+' <button class="danger" data-a="del">Quitar local</button></div>';
   const lv='<select class="admLv">'+[1,2,3,4,5].map(n=>'<option value="'+n+'"'+(n===(q.lv||1)?' selected':'')+'>'+n+(BIZN&&BIZN[n]?' · '+pcEsc(BIZN[n]):'')+'</option>').join('')+'</select>';
   const stk=(q.items||[]).map(i=>'<label>'+pcEsc(i.k)+' <input class="admStock" type="number" min="0" data-k="'+pcEsc(i.k)+'" value="'+(i.n|0)+'"></label>').join('');
   return '<div class="admB" data-x="'+q.x+'" data-z="'+q.z+'">'+head+' · Nivel '+lv+' · Caja € <input class="admTill" type="number" min="0" value="'+(q.till|0)+'"><div class="admS"><small>Stock:</small>'+stk+'</div><button data-a="biz">Guardar negocio</button><button class="danger" data-a="del">Quitar local</button></div>'}).join('');
  return '<div class="admP" data-ref="'+pcEsc(p.ref)+'" data-name="'+pcEsc(p.name)+'"><div class="admR"><span class="admDot'+(p.online?' on':'')+'" title="'+(p.online?'Conectado':'Desconectado')+'"></span><b>'+pcEsc(p.name)+'</b><small>'+(p.online?'conectado':'desconectado')+' · '+pcEsc(rankName(p.rk))+' · '+admMoney(p.money)+'</small><span style="flex:1"></span>€ <input class="admMoney" type="number" min="0" value="'+Math.round(p.money||0)+'"><button data-a="money">Guardar dinero</button></div>'+
   '<div class="admR" style="margin-left:14px"><small>🍔 Hambre %</small><input class="admVit admH" type="number" min="0" max="100" value="'+(p.h!=null?p.h:'')+'" placeholder="?"><small>⚡ Energía %</small><input class="admVit admE" type="number" min="0" max="100" value="'+(p.e!=null?p.e:'')+'" placeholder="?"><button data-a="vit">Guardar hambre y energía</button><button data-a="vitfull">Llenar al 100 %</button></div>'+(biz?'<div>'+biz+'</div>':'<small style="color:#aab4c0;margin-left:14px">Sin locales ni negocios</small>')+'</div>'}).join('');
 b.scrollTop=sc}
function admClick(e){const t=e.target.closest('button[data-a]');if(!t)return;const a=t.dataset.a;
 if(a==='close')return admClose();if(a==='refresh')return void govSend({type:'admin_list'});if(a.startsWith('w-'))return admWorldClick(a);
 const P=t.closest('.admP');if(!P)return;const ref=P.dataset.ref;
 if(a==='money')return void govSend({type:'admin_money',ref,money:Number(P.querySelector('.admMoney').value)});
 if(a==='vitfull')return void govSend({type:'admin_vit',ref,h:100,e:100});
 if(a==='vit'){const hv=P.querySelector('.admH').value,ev=P.querySelector('.admE').value,o={type:'admin_vit',ref};if(hv!=='')o.h=Number(hv);if(ev!=='')o.e=Number(ev);if(o.h==null&&o.e==null){toast('Escribe el hambre o la energía (0-100)');return}return void govSend(o)}
 const B=t.closest('.admB');if(!B)return;const x=+B.dataset.x,z=+B.dataset.z;
 if(a==='del'){if(confirm('¿Quitar este local a '+P.dataset.name+'? No se le devuelve el dinero.'))govSend({type:'admin_biz',ref,x,z,remove:true});return}
 if(a==='biz'){const stock={};B.querySelectorAll('.admStock').forEach(i=>{stock[i.dataset.k]=Number(i.value)});
  govSend({type:'admin_biz',ref,x,z,lv:Number(B.querySelector('.admLv').value),till:Number(B.querySelector('.admTill').value),stock})}}
// --- Hora y tiempo del mundo (el servidor manda la hora y el clima; aquí solo se le pide cambiarlos o congelarlos) ---
const ADMW={ft:false,fw:false};
const admHM=t=>{const h=Math.floor(t)%24,m=Math.floor((t%1)*60);return (h<10?'0':'')+h+':'+(m<10?'0':'')+m};
function admWorldRender(){const el=ADM.el&&ADM.el.querySelector('#admWorld');if(!el)return;
 el.innerHTML='<b>🕒 Hora y tiempo del mundo</b> <small>ahora: <span id="admWNow"></span></small>'+
  '<div class="admWR"><input id="admWTime" type="time" value="'+admHM(tod)+'"><button data-a="w-time">Poner hora</button><label><input id="admWFT" type="checkbox"'+(ADMW.ft?' checked':'')+'> Congelar hora</label></div>'+
  '<div class="admWR"><select id="admWWx">'+WX.map((w,i)=>'<option value="'+i+'"'+(i===wx?' selected':'')+'>'+w.i+' '+w.n+'</option>').join('')+'</select><button data-a="w-wx">Poner tiempo</button><label><input id="admWFW" type="checkbox"'+(ADMW.fw?' checked':'')+'> Congelar tiempo</label></div>';
 admWorldLive()}
function admWorldLive(){const e=ADM.el&&ADM.el.querySelector('#admWNow');if(e)e.textContent=admHM(tod)+' · '+WX[wx].i+' '+WX[wx].n+(ADMW.ft?' · hora congelada':'')+(ADMW.fw?' · tiempo congelado':'')}
function admWorldSend(o){if(!govSend(Object.assign({type:'admin_world'},o)))toast('⚠️ Sin conexión con el servidor')}
function admWorldClick(a){
 if(a==='w-time'){const v=(ADM.el.querySelector('#admWTime').value||'').split(':');if(v.length<2)return;const t=(+v[0])+(+v[1])/60;if(!Number.isFinite(t))return;tod=t;admWorldSend({tod:t})}
 else if(a==='w-wx'){const i=+ADM.el.querySelector('#admWWx').value;if(!(i>=0&&i<WX.length))return;wx=i;admWorldSend({wx:i})}}
function admWorldChange(e){const t=e.target;if(t.id==='admWFT'){ADMW.ft=t.checked;admWorldSend({freezeTod:t.checked})}else if(t.id==='admWFW'){ADMW.fw=t.checked;admWorldSend({freezeWx:t.checked})}admWorldLive()}
function admOnData(m){ADM.data=Array.isArray(m.players)?m.players:[];if(m.world&&typeof m.world==='object'){ADMW.ft=!!m.world.freezeTod;ADMW.fw=!!m.world.freezeWx}if(m.open)admOpen();admWorldRender();if(ADM.el&&ADM.el.style.display==='flex')admRender()}
var bizClaimPend=null;
const bizWho=r=>r.name+(r.on?'':' (ahora desconectado)');
function buyLocal(id){const h=HOUSES[id];if(!h||!h.local||h.owned||bizClaimPend)return;
 if(h.remote){toast('🏪 OCUPADO · este local es de '+bizWho(h.remote));return}
 if(money<h.price){toast('No tienes suficiente dinero');return}
 if(!(MP.connected&&MP.ws&&MP.ws.readyState===1&&MP.id&&MP.feat&&MP.feat.biz)){if(pay(h.price))buyLocalNow(h);return} // sin servidor (modo solitario): como antes
 bizClaimPend=h;setTimeout(()=>{if(bizClaimPend===h){bizClaimPend=null;toast('El servidor no responde: inténtalo otra vez')}},3000);
 govSend({type:'biz_claim',x:h.x,z:h.z})}
// El servidor confirma que el local es tuyo (nadie lo había reservado): ahora sí se paga
function bizOnClaimOk(m){const h=xfFind(m.x,m.z,true);if(!h)return;
 if(bizClaimPend===h&&!h.owned){bizClaimPend=null;if(!pay(h.price)){govSend({type:'biz_release',x:h.x,z:h.z});return}buyLocalNow(h)}
 else if(!h.owned)govSend({type:'biz_release',x:h.x,z:h.z})}
function bizOnClaimDeny(m){const h=xfFind(m.x,m.z,true);if(bizClaimPend===h)bizClaimPend=null;toast('🏪 OCUPADO · este local ya es de '+String(m.owner||'otro jugador').slice(0,18)+(m.on?'':' (ahora desconectado)'));estateRefresh()}
// El servidor tiene ese local registrado a nombre de otro jugador (compra duplicada de antes): se devuelve el dinero
function bizOnConflict(m){const h=xfFind(m.x,m.z,true);if(!h||!h.owned)return;
 const back=Math.round((h.price||0)+(h.till||0));if(dlgOpen)closeDlg();
 releaseHouse(h);h.ty='';h.lv=0;h.till=0;h.stock={};try{localIn(h,'')}catch(_){}
 money+=back;sfx.cash();estateRefresh();saveGame();
 toast('⚠️ El local en ('+h.x+', '+h.z+') ya estaba registrado a nombre de '+String(m.owner||'otro jugador').slice(0,18)+'. Se te devuelven €'+back)}
function buyLocalNow(h){const id=h.id;if(!h.local||h.owned)return;h.owned=true;h.mode='own';h.late=0;h.lv=1;h.till=0;setHouseColor(h,0xf1c40f);flags.local=1;estateRefresh();toast('¡Local comprado! Elige qué negocio montar (L junto a su puerta para gestionarlo).');bizOpen(id)}
function buyHouse(id){const h=HOUSES[id];if(!pay(h.price))return;h.owned=true;h.mode='own';h.late=0;setHouseColor(h,0x22aa44);flags.house=1;closeDlg();toast('¡Casa comprada! Su puerta es verde.')}
let invOpen=false;const placed={};

// =================================================================================================
// 15. HABILIDADES Y DESCANSO
//     Habilidades, requisitos de los trabajos, hambre, asientos, horarios de apertura y dormir.
// =================================================================================================

// ---------- 15.1 Habilidades y requisitos de los trabajos ----------
const SKILLS=[{k:'orient',n:'Orientación y Espacio',e:'🧭'},{k:'social',n:'Habilidades Sociales',e:'🤝'},{k:'calc',n:'Cálculo y Finanzas',e:'📊'},{k:'comm',n:'Comunicación',e:'🗣️'},{k:'gest',n:'Gestión y Estrategia',e:'♟️'},{k:'fisica',n:'Condición Física',e:'💪'},{k:'negoc',n:'Negociación',e:'💼'},{k:'lider',n:'Liderazgo',e:'👑'}],skills={};
SKILLS.forEach(q=>skills[q.k]=0);
function addSkill(k,n){if(!(k in skills))return;skills[k]=Math.max(0,Math.floor(skills[k]+(Number(n)||0)))}
// Puntos mínimos de cada habilidad para poder hacer cada trabajo. Clave 'comercio:tarea'. Vacío {} = sin requisitos.
// Ejemplo: 'bar:shift':{comm:2,social:3}  (claves: orient, social, calc, comm, gest, fisica, negoc, lider)
const JOB_REQ={
 'dealer:shift':{calc:6,negoc:2},   // Ayudante de ventas (Concesionario)
 'food:shift':{negoc:3,calc:2},     // Dependiente (Alimentación)
 'furn:shift':{fisica:3,orient:2},     // Montador (Muebles)
 'shop:shift':{negoc:3,calc:2},     // Dependiente (Moda)
 'bar:shift':{comm:2,social:3},      // Camarero (Bar)
 'burger:shift':{social:2},          // Cocinero de comida rápida (Hamburguesería)
 'pizza:shift':{social:2},           // Pizzero (Pizzería)
 'ice:shift':{social:1},             // Heladero (Heladería)
 'hotel:shift':{social:2,calc:1},    // Botones (Hotel)
 'gas:shift':{calc:2,social:2},      // Mozo de gasolinera (Gasolinera)
 'town:shift':{comm:3,social:4},     // Administrativo (Ayuntamiento)
 'super:stock':{gest:2,calc:3},    // Reponedor, minijuego (Supermercado)
 'food:deliver':{orient:4,fisica:2},   // Repartidor (Alimentación)
 'hotel:taxi':{orient:4,social:2}      // Taxista (Hotel)
};
const jobReq=(k,id)=>JOB_REQ[k+':'+id]||{};
const jobMissing=(k,id)=>{const r=jobReq(k,id);return SKILLS.filter(q=>(r[q.k]||0)>(skills[q.k]||0))};
function jobReqLine(k,id){const r=jobReq(k,id),a=SKILLS.filter(q=>(r[q.k]||0)>0);if(!a.length)return'';return'<br><small>🔒 Requiere: '+a.map(q=>'<span style="color:'+((skills[q.k]||0)>=r[q.k]?'#8fdc8f':'#ff8a80')+'">'+q.e+' '+q.n+' '+(skills[q.k]||0)+'/'+r[q.k]+'</span>').join(' · ')+'</small>'}
function jobCanDo(k,id){const m=jobMissing(k,id);if(!m.length)return true;const r=jobReq(k,id);toast('🔒 Te faltan puntos: '+m.map(q=>q.n+' ('+(skills[q.k]||0)+'/'+r[q.k]+')').join(', '));return false}
let skillsOpen=false;
function skillsHtml(){return '<details'+(skillsOpen?' open':'')+' ontoggle="skillsOpen=this.open"><summary style="cursor:pointer;font-weight:700;font-size:1.17em;margin:12px 0 6px">🧠 Habilidades</summary>'+SKILLS.map(q=>'<div class="r"><span>'+q.e+' '+q.n+'</span><b>'+skills[q.k]+' pts</b></div>').join('')+'</details>'}let hunger=100,thirst=100,energy=100,eff=0;let seat=null;
const HRS={gym:[7,23],super:[8,22],dealer:[9,20],food:[8,22],furn:[10,20],shop:[10,21],bar:[12,24],burger:[11,24],pizza:[12,24],ice:[11,23],estate:[9,19],hotel:[0,24],town:[9,18],bank:[9,18],pet:[10,21],gas:[0,24],garage:[8,20],ffood:[7,20],ffurn:[7,20],fcloth:[7,20]};
const pad2=n=>(n<10?'0':'')+n;
function isOpen(k){const h=HRS[k];return !h||(tod>=h[0]&&tod<h[1])}
function hrsTxt(k){return pad2(HRS[k][0])+':00'}
function lockedFor(d){if(d.shop)return !isOpen(d.shop)&&!d.open&&(pl.z-d.z)*d.fz>0;if(d.house&&!d.open&&(pl.z-d.z)*d.fz>0){const h=d.prop||(d.prop=HOUSES.find(q=>q.door===d));return !!(h&&!h.local&&!h.owned&&!hasKey('house',houseKeyId(h)))}if(d.plot!==undefined&&!d.open)return plotLocked(d); /* llaves: 24.5 */return false}
const fd=document.createElement('div');fd.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .8s;z-index:8;color:#fff;display:flex;align-items:center;justify-content:center;font:700 22px system-ui';document.body.appendChild(fd);
function fade(msg,fn){fd.textContent=msg;fd.style.opacity=1;setTimeout(()=>{if(fn)fn();fd.style.opacity=0},1800)}
// DESMAYO: con hambre 0 % y energía 0 % te desmayas y apareces en el hospital con 200 € menos.
// El hospital está en la sección 6.4 (ahí se definen HOSPITAL_FEE, HOSPITAL_RECOVER y HOSPITAL_SPAWN).
let collapsing=false;
function collapse(){collapsing=true;seat=null;setSit(body,false);
 fade('Te has desmayado... Despiertas en el hospital',()=>{const fee=Math.min(money,HOSPITAL_FEE);money-=fee;hunger=HOSPITAL_RECOVER;energy=HOSPITAL_RECOVER;
  pl.x=HOSPITAL_SPAWN.x;pl.z=HOSPITAL_SPAWN.z;py=HOSPITAL_SPAWN.y;vy=0;body.position.set(pl.x,py,pl.z);
  toast('🏥 Te han atendido en el hospital: -€'+fee);collapsing=false;saveGame()})}
let micro=0,microT=10,microW=false,microDir=0;
const eyes=document.createElement('div');eyes.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .35s;z-index:7';document.body.appendChild(eyes);
// Dormir: avanza la hora, restaura energía y gasta hambre/sed según las horas dormidas
function sleepFor(h,rate,msg,keep,nap){const e0=energy;if(!keep){tod=(tod+h)%24;if(h>=6){wx=Math.floor(Math.random()*3);wxT=0}} // keep: la hora la fija el servidor, aquí solo se aplica el descanso
 hunger=Math.max(0,hunger-h*3.1);thirst=100;energy=Math.min(100,energy+h*rate);
 const hh=Math.floor(tod),mm=Math.floor((tod%1)*60);toast(msg+(nap?' ('+h+' h)':' ('+(h%1?h.toFixed(1):h)+' h · son las '+(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm+')')+' · energía +'+Math.round(energy-e0))}
function hoursToMorning(){const h=(7-tod+24)%24;return h>12?8:Math.max(1,h)}

// ---------- 15.2 Dormir en el mundo compartido: la noche solo pasa cuando duerme al menos el 50 % de los jugadores (lo decide el servidor) ----------
var SLP=null; // {rate,msg,cost,room} mientras duermes esperando a que amanezca
const slpEl=document.createElement('div');slpEl.style.cssText='position:fixed;inset:0;background:rgba(0,0,12,.85);z-index:9;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font:600 20px system-ui;text-align:center;padding:20px';
slpEl.innerHTML='<div style="font-size:42px">😴</div><div>Durmiendo...</div><div class="slpInfo" style="font-size:16px;font-weight:500;opacity:.85"></div><button class="slpBtn" style="padding:8px 18px;border:0;border-radius:8px;background:#666;color:#fff;font:600 15px system-ui;cursor:pointer">Levantarte</button>';
document.body.appendChild(slpEl);
const slpInfo=(n,tot,need)=>{slpEl.querySelector('.slpInfo').textContent=n+' de '+tot+' jugadores durmiendo · para que amanezca tienen que dormir '+need};
function slpLeave(){slpEl.style.display='none';dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(e){}}
function sleepCancel(){if(!SLP)return;SLP=null;slpLeave();govSend({type:'sleep',on:false})}
slpEl.querySelector('.slpBtn').addEventListener('click',sleepCancel);
function sleepNight(msg1,rate,msg2,opt){opt=opt||{};if(SLP)return;
 if(!(MP.ws&&MP.ws.readyState===1)){fade(msg1,()=>{if(opt.cost)money=Math.max(0,money-opt.cost);if(opt.room)flags.room=0;sleepFor(hoursToMorning(),rate,msg2)});return} // sin conexión: pasa la noche como en solitario
 fade(msg1,()=>{SLP={rate,msg:msg2,cost:opt.cost||0,room:!!opt.room};dlgOpen=true;try{document.exitPointerLock&&document.exitPointerLock()}catch(e){}for(const k in K)K[k]=false;
  slpEl.querySelector('.slpInfo').textContent='Esperando al resto de jugadores...';slpEl.style.display='flex';govSend({type:'sleep',on:true})})}
