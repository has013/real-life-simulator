/* ===============================================================================================
   FICHA · banco-casas.js
   Qué hay:          Banco y préstamos (16.1), casas: comprar, alquilar e hipotecar, inmobiliaria con su mapa, pagos diarios, hotel y sentarse (16.2).
   Tócalo si quieres: cambiar el banco, los préstamos, las casas o la inmobiliaria
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// =================================================================================================
// 16. BANCO, CASAS Y SERVICIOS
//     Préstamos, alquiler e hipoteca de casas, gasolineras, hotel y ascensores.
// =================================================================================================

// ---------- 16.1 Banco: préstamos ----------
const LOAN_MIN=1,LOAN_MAX=15000,LOAN_RATE_MAX=.20,LOAN_TERMS=[[5,.05],[10,.10],[20,.15]]; // [cuotas (1 por día de juego), interés base]; el interés sube con la cantidad y nunca pasa del 20 %
function loanRate(a,t){return Math.min(LOAN_RATE_MAX,LOAN_TERMS[t][1]+.05*Math.min(1,Math.max(0,a)/LOAN_MAX))}
function loanQuote(a,t){const r=loanRate(a,t),tot=Math.round(a*(1+r));return{r,tot,int:tot-a,cuota:Math.ceil(tot/LOAN_TERMS[t][0])}}
function loanPrev(){const el=document.getElementById('loanPrev');if(!el)return;const a=Math.floor(Number(document.getElementById('loanAmt').value)),t=+document.getElementById('loanTerm').value;
 if(!(a>=LOAN_MIN)){el.innerHTML='Escribe una cantidad entre €'+LOAN_MIN+' y €'+LOAN_MAX;return}
 if(a>LOAN_MAX){el.innerHTML='<span style="color:#ff8a8a">El máximo es €'+LOAN_MAX+'</span>';return}
 const q=loanQuote(a,t);el.innerHTML='Interés: <b>'+(q.r*100).toFixed(1)+'%</b> (+€'+q.int+') · Total a devolver: <b>€'+q.tot+'</b><br>'+LOAN_TERMS[t][0]+' cuotas de <b>€'+q.cuota+'</b>'}
function takeLoanForm(){const a=Math.floor(Number(document.getElementById('loanAmt').value)),t=+document.getElementById('loanTerm').value;
 if(!(a>=LOAN_MIN)){toast('Escribe una cantidad válida');return}
 if(a>LOAN_MAX){toast('No puedes pedir más de €'+LOAN_MAX);return}
 takeLoan(a,t)}
function bankHtml(){let h='<p>Las cuotas se cobran solas cada medianoche. Si no tienes saldo: recargo del 10 % de la cuota.</p>';
 if(loan){h+=`<h3>Tu préstamo</h3><div>Deuda pendiente: <b>€${loan.left}</b> · Cuotas restantes: <b>${loan.n}</b> de €${loan.cuota}${loan.rate?' · interés '+(loan.rate*100).toFixed(1)+'%':''}${loan.late?' · impagos: '+loan.late:''}</div><div><button onclick="loanPay1()">Adelantar una cuota (€${loan.n<=1?loan.left:Math.min(loan.cuota,loan.left)})</button> <button onclick="loanPayAll()">Liquidar deuda (€${loan.left})</button></div>`}
 else{h+='<h3>Pedir préstamo</h3><p style="margin:4px 0">Máximo €'+LOAN_MAX+' · interés máximo '+Math.round(LOAN_RATE_MAX*100)+'% (sube con la cantidad y el plazo)</p>'
  +'<div class="r"><span>Cantidad (€)</span><input id="loanAmt" type="number" min="'+LOAN_MIN+'" max="'+LOAN_MAX+'" step="1" value="1000" oninput="loanPrev()" style="width:120px;padding:6px;font-size:16px;border-radius:6px;border:0"></div>'
  +'<div class="r"><span>Plazo</span><select id="loanTerm" onchange="loanPrev()" style="padding:6px;font-size:15px;border-radius:6px;border:0">'+LOAN_TERMS.map((t,i)=>'<option value="'+i+'">'+t[0]+' cuotas (1 por día)</option>').join('')+'</select></div>'
  +'<div id="loanPrev" style="margin:6px 0"></div><div><button onclick="takeLoanForm()">Pedir préstamo</button></div>'}
 return h}
function bankRefresh(){if(bankW)talk(bankW)}
function takeLoan(a,i){if(loan){toast('Ya tienes un préstamo activo');return}a=Math.floor(Number(a));if(!(a>=LOAN_MIN&&a<=LOAN_MAX)||!LOAN_TERMS[i]){toast('Cantidad no válida (máx. €'+LOAN_MAX+')');return}const q=loanQuote(a,i);loan={left:q.tot,n:LOAN_TERMS[i][0],cuota:q.cuota,late:0,rate:q.r};money+=a;sfx.cash();toast('Préstamo concedido: +€'+a);bankRefresh()}
function loanCheck(){if(loan&&(loan.n<=0||loan.left<=0)){loan=null;toast('✅ Préstamo liquidado')}}
function loanPay1(){if(!loan)return;const c=loan.n<=1?loan.left:Math.min(loan.cuota,loan.left);if(!pay(c))return;loan.left-=c;loan.n--;loanCheck();bankRefresh()}
function loanPayAll(){if(!loan)return;if(!pay(loan.left))return;loan=null;toast('Deuda liquidada 🎉');bankRefresh()}
function loanDay(){if(!loan)return;const c=loan.n<=1?loan.left:Math.min(loan.cuota,loan.left);
 if(money>=c){money-=c;loan.left-=c;loan.n--;sfx.cash();const q=loan.n;toast('🏦 Cuota cobrada: -€'+c+(q>0?' · quedan '+q:''));loanCheck()}
 else{const r=Math.max(1,Math.round(c*.1));loan.left+=r;loan.late=(loan.late||0)+1;toast('🏦 Cuota impagada: recargo +€'+r)}}
function bankTick(){if(tod<prevTod-6){loanDay();houseDay();gymDay()}prevTod=tod}

// ---------- 16.2 Casas: alquiler e hipoteca ----------
const RENT=60,MORT_N=40,MORT_RATE=.20,MORT_DOWN=.20,HOUSE_LATE_MAX=3; // alquiler/día · cuotas · interés total · entrada · impagos seguidos antes de perder la casa
function releaseHouse(h){if(h.door.open){h.door.open=false;h.door.col.on=true}h.owned=false;h.mode=null;h.mort=null;h.late=0;if(h.om)h.door.leaf.material=h.om}
function debtTotal(){return(loan?loan.left:0)+HOUSES.reduce((a,h)=>a+(h.mort?h.mort.left:0),0)}
function houseInfoHtml(){return HOUSES.filter(h=>h.owned&&(h.mode==='rent'||h.mode==='mort')).map(h=>h.mode==='rent'?`<div>${h.apt?'Piso':'Casa'} (${h.x}, ${h.z}): alquiler €${RENT}/día</div>`:`<div>${h.apt?'Piso':'Casa'} (${h.x}, ${h.z}): hipoteca, debes €${h.mort.left} · ${h.mort.n} cuotas de €${h.mort.cuota}</div>`).join('')}
function estateHtml(){let h='<p>Compra al contado, alquila o financia con hipoteca (los pagos se cobran cada medianoche; con '+HOUSE_LATE_MAX+' impagos seguidos pierdes la vivienda).</p><div><button onclick="estateMap(\'all\')">🗺️ Ver en mapa</button></div>';
 const card=(x,ic,lb)=>{const e=Math.round(x.price*MORT_DOWN),tot=Math.round((x.price-e)*(1+MORT_RATE)),c=Math.ceil(tot/MORT_N);return '<div class="r"><i class="ic">'+ic+'</i><span>'+lb+' en ('+x.x+', '+x.z+')</span><b>€'+x.price+'</b><button onclick="buyHouse('+x.id+')">Comprar</button></div><div><button onclick="rentHouse('+x.id+')">Alquilar: €'+RENT+'/día</button> <button onclick="mortHouse('+x.id+')">Hipoteca: entrada €'+e+' + '+MORT_N+'×€'+c+'</button></div>'},
  near=f=>HOUSES.filter(f).sort((a,b)=>Math.hypot(a.x-pl.x,a.z-pl.z)-Math.hypot(b.x-pl.x,b.z-pl.z));
 h+=terrenosHtml();
 near(x=>!x.owned&&!x.local&&!x.apt).slice(0,3).forEach(x=>{h+=card(x,'🏠','Casa')});
 h+='<h3>Pisos</h3><p>Solo puedes entrar en las casas y pisos que son tuyos.</p>';near(x=>!x.owned&&x.apt).slice(0,3).forEach(x=>{h+=card(x,'🏢','Piso')});
 h+='<h3>Locales comerciales</h3><p>Para tu propio negocio. Compra al contado (puerta naranja en la calle).</p>';HOUSES.filter(x=>x.local).sort((a,b)=>Math.hypot(a.x-pl.x,a.z-pl.z)-Math.hypot(b.x-pl.x,b.z-pl.z)).forEach(x=>{h+=x.owned?`<div class="r"><i class="ic">🏪</i><span>Local en (${x.x}, ${x.z})</span><b>Tuyo</b></div>`:x.remote?`<div class="r"><i class="ic">🏪</i><span>Local en (${x.x}, ${x.z})<br><small>${x.remote.occ?'Local de':'Negocio de'} ${pcEsc(x.remote.name)}${x.remote.on?'':' · desconectado'}</small></span><b>Ocupado</b></div>`:`<div class="r"><i class="ic">🏪</i><span>Local en (${x.x}, ${x.z})<br><small>≈ €${bizInc(x,1)}/día de inicio</small></span><b>€${x.price}</b><button onclick="buyLocal(${x.id})">Comprar</button></div>`});
 const mine=HOUSES.filter(x=>x.owned&&(x.mode==='rent'||x.mode==='mort'));
 if(mine.length){h+='<h3>Tus contratos</h3>';mine.forEach(x=>{h+=x.mode==='rent'?`<div>${x.apt?'Piso':'Casa'} (${x.x}, ${x.z}) · alquiler €${RENT}/día <button onclick="endRent(${x.id})">Dejar el alquiler</button></div>`:`<div>${x.apt?'Piso':'Casa'} (${x.x}, ${x.z}) · debes €${x.mort.left} (${x.mort.n} cuotas de €${x.mort.cuota}) <button onclick="mortPay1(${x.id})">Adelantar cuota</button> <button onclick="mortPayAll(${x.id})">Liquidar (€${x.mort.left})</button></div>`})}
 return h}
function terrenosHtml(){const dist=t=>Math.hypot(t.x-pl.x,t.z-pl.z),free=TERRENOS.filter(t=>!t.owned&&!t.rem).sort((a,b)=>dist(a)-dist(b)),mine=TERRENOS.filter(t=>t.owned);
 let h='<h3>Terrenos</h3><p>Solo se pagan al contado. Cuando uno sea tuyo, ve a él y pulsa E para construir por módulos. Ordenados del más cercano al más lejano; los verás señalados en el mapa de la isla principal, con su cartel y número.</p>';
 free.forEach(t=>{h+='<div class="r"><i class="ic">🟩</i><span>Terreno nº '+t.id+' · '+t.w+'×'+t.d+' m<br><small>en ('+t.x+', '+t.z+') · '+Math.round(dist(t))+' m de ti</small></span><b>€'+t.price+'</b><button onclick="buyTerreno('+t.id+')">Comprar</button></div>'});
 if(!free.length)h+='<div>No quedan terrenos a la venta.</div>';;
 if(mine.length){h+='<div style="margin-top:6px"><b>Tus terrenos:</b> '+mine.map(t=>'nº '+t.id+' ('+t.w+'×'+t.d+' m)').join(' · ')+'</div>'}
 const oc=TERRENOS.filter(t=>t.rem);if(oc.length)h+='<div style="margin-top:6px"><b>De otros jugadores:</b> '+oc.map(t=>'nº '+t.id+' ('+pcEsc(t.rem.name)+')').join(' · ')+'</div>';
 return h}
function buyTerreno(id){const t=TERRENOS.find(q=>q.id===id);if(!t||t.owned)return;
 if(t.rem){toast('🟥 El terreno nº '+t.id+' ya es de '+t.rem.name);return}
 if(houseOnline()&&houseSynced){if(housePend&&performance.now()-housePend.time<5000)return;housePend={id,time:performance.now()};govSend({type:'house_claim',id});return} // con servidor: se reserva primero y después se cobra
 if(!pay(t.price))return;terrenoBought(t)} // sin servidor (modo solitario): como antes
function estateRefresh(){if(dlgOpen&&$('emc')){estateMap(EMAP.cat,EMAP.sel);return}if(estW)talk(estW)}
// Inmobiliaria: «Ver en mapa». Mismo recurso que el atlas de la biblioteca (el mapa estático `stat` dibujado en un canvas del diálogo).
// Pestañas: Todo · Locales · Terrenos · Casas · Pisos. Color = estado (naranja a la venta, amarillo tuyo, gris de otro jugador); letra = tipo (L local, C casa, P piso); los terrenos son rectángulos con su número.
// Los pisos de un mismo portal comparten punto: al tocarlo salen todas sus plantas. Desde el detalle se puede comprar/alquilar/hipotecar o marcar la ruta.
const EMAP={cat:'all',sel:null},EMC={all:['Todo','🗺️'],local:['Locales','🏪'],terr:['Terrenos','🟩'],casa:['Casas','🏠'],piso:['Pisos','🏢']},EMCOL={free:'#e67e22',mine:'#f1c40f',occ:'#999'};
function emGroups(cat){const G=new Map(),add=(c,o)=>{const k=c+':'+o.x+','+o.z;let g=G.get(k);if(!g){g={k,c,x:o.x,z:o.z,w:o.w,d:o.d,it:[]};G.set(k,g)}g.it.push(o)},on=c=>cat==='all'||cat===c;
 if(on('terr'))TERRENOS.forEach(t=>add('terr',t));
 HOUSES.forEach(h=>{const c=h.local?'local':h.apt?'piso':'casa';if(on(c))add(c,h)});
 const st=(c,o)=>o.owned?'mine':(c==='terr'?o.rem:o.remote)?'occ':'free';
 return[...G.values()].map(g=>{const s=g.it.map(o=>st(g.c,o));g.st=s.includes('free')?'free':s.includes('mine')?'mine':'occ';g.ss=s;return g})}
function emItemHtml(c,o,s){const R=(ic,lb,sub,b,btn)=>'<div class="r"><i class="ic">'+ic+'</i><span>'+lb+(sub?'<br><small>'+sub+'</small>':'')+'</span><b>'+b+'</b>'+(btn||'')+'</div>';
 if(c==='terr')return R('🟩','Terreno nº '+o.id+' · '+o.w+'×'+o.d+' m',s==='occ'?'De '+pcEsc(o.rem.name):s==='mine'?'Es tuyo: ve y pulsa E para construir':'Solo al contado',s==='free'?'€'+o.price:s==='mine'?'Tuyo':'Ocupado',s==='free'?'<button onclick="buyTerreno('+o.id+')">Comprar</button>':'');
 if(c==='local')return R('🏪','Local comercial',s==='occ'?(o.remote.occ?'Local de':'Negocio de')+' '+pcEsc(o.remote.name)+(o.remote.on?'':' · desconectado'):s==='mine'?'Es tuyo':'≈ €'+bizInc(o,1)+'/día de inicio',s==='free'?'€'+o.price:s==='mine'?'Tuyo':'Ocupado',s==='free'?'<button onclick="buyLocal('+o.id+')">Comprar</button>':'');
 const lb=c==='piso'?'Piso'+(o.door&&o.door.fl!=null?', planta '+o.door.fl:''):'Casa'+(o.isl?' (isla)':''),ic=c==='piso'?'🏢':'🏠';
 if(s==='mine')return R(ic,lb,o.mode==='rent'?'Alquilada · €'+RENT+'/día':o.mode==='mort'&&o.mort?'Hipoteca: debes €'+o.mort.left:'Es tuya','Tuya');
 const e=Math.round(o.price*MORT_DOWN),cu=Math.ceil(Math.round((o.price-e)*(1+MORT_RATE))/MORT_N);
 return R(ic,lb,'','€'+o.price,'<button onclick="buyHouse('+o.id+')">Comprar</button>')+'<div><button onclick="rentHouse('+o.id+')">Alquilar: €'+RENT+'/día</button> <button onclick="mortHouse('+o.id+')">Hipoteca: entrada €'+e+' + '+MORT_N+'×€'+cu+'</button></div>'}
function estateMap(cat,sel){cat=EMC[cat]?cat:EMAP.cat;const L=emGroups(cat);EMAP.cat=cat;EMAP.sel=L.some(g=>g.k===sel)?sel:null;openDlg();dlg.classList.add('wide');
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;L.forEach(g=>{const hw=(g.w||0)/2,hd=(g.d||0)/2;x0=Math.min(x0,g.x-hw);x1=Math.max(x1,g.x+hw);z0=Math.min(z0,g.z-hd);z1=Math.max(z1,g.z+hd)});
 if(!L.length){x0=x1=pl.x;z0=z1=pl.z}
 const Wd=Math.max(120,x1-x0+50,z1-z0+50),W0=(x0+x1)/2-Wd/2,Z0=(z0+z1)/2-Wd/2,S=L.find(g=>g.k===EMAP.sel);
 let h='<h2>🗺️ Mapa de la inmobiliaria</h2><div>'+Object.keys(EMC).map(c=>'<button onclick="estateMap(\''+c+'\')"'+(c===cat?' style="background:#2f7fe0;color:#fff"':'')+'>'+EMC[c][1]+' '+EMC[c][0]+'</button>').join(' ')+'</div>'+
  '<p><small><b style="color:'+EMCOL.free+'">●</b> a la venta · <b style="color:'+EMCOL.mine+'">●</b> tuyo · <b style="color:'+EMCOL.occ+'">●</b> ocupado · <b>L</b> local · <b>C</b> casa · <b>P</b> pisos · ▭ terreno (nº) · <b style="color:#ff3">▲</b> tú. Toca algo para ver sus datos.</small></p>'+
  '<div style="text-align:center"><button onclick="emZoom(1.5)">➕ Ampliar</button> <button onclick="emZoom(1/1.5)">➖ Reducir</button> <button onclick="emReset()">⟲ Ver todo</button><br><small>También con la rueda del ratón o pellizcando; arrastra para moverte.</small></div>'+
  '<canvas id="emc" width="540" height="540" style="width:100%;max-width:540px;cursor:pointer;border-radius:8px;display:block;margin:6px auto;touch-action:none"></canvas>';
 if(S){h+='<p><small>'+EMC[S.c][1]+' En ('+S.x+', '+S.z+') · '+Math.round(Math.hypot(S.x-pl.x,S.z-pl.z))+' m de ti</small></p>';S.it.forEach((o,i)=>h+=emItemHtml(S.c,o,S.ss[i]));h+='<button onclick="estateRoute('+S.x+','+S.z+')">📍 Marcar ruta</button> '}
 else{const n=L.filter(g=>g.st==='free').length;h+='<p><small>'+(L.length?n+' de '+L.length+' puntos con algo a la venta.':'No hay nada en esta categoría.')+'</small></p>'}
 h+='<button onclick="talk(estW)">← Volver</button> <button onclick="closeDlg()" style="background:#a33">Cerrar</button>';dlg.innerHTML=h;
 // vista (zoom y desplazamiento): se conserva al tocar un punto o al refrescar; se reinicia al abrir el mapa o cambiar de pestaña
 if(!(sel!==undefined&&EMAP.v&&EMAP.v.cat===cat))EMAP.v={cat,z:1,cx:W0+Wd/2,cz:Z0+Wd/2};
 Object.assign(EMAP.v,{L,W0,Z0,Wd,rm:cat==='all'?8:11});emDraw();emBind()}
function emView(){const V=EMAP.v,W=V.Wd/V.z,h=W/2;V.cx=clamp(V.cx,V.W0+h,V.W0+V.Wd-h);V.cz=clamp(V.cz,V.Z0+h,V.Z0+V.Wd-h);return{X0:V.cx-h,Z0:V.cz-h,W,k:540/W}}
function emZoom(f,px,py){const V=EMAP.v;if(!V||!$('emc'))return;const a=emView(),z=clamp(V.z*f,1,12);if(z===V.z)return;
 if(px!=null){const wx=a.X0+px/a.k,wz=a.Z0+py/a.k,W=V.Wd/z;V.cx=wx-(px/540-.5)*W;V.cz=wz-(py/540-.5)*W} // el punto bajo el cursor/dedos se queda quieto
 V.z=z;emDraw()}
function emReset(){const V=EMAP.v;if(!V)return;V.z=1;V.cx=V.W0+V.Wd/2;V.cz=V.Z0+V.Wd/2;emDraw()}
function emBind(){const c=$('emc'),P=new Map();let moved=false,pd=0;
 const pos=e=>{const b=c.getBoundingClientRect();return[(e.clientX-b.left)/b.width*540,(e.clientY-b.top)/b.height*540]};
 c.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);emZoom(e.deltaY<0?1.25:.8,p[0],p[1])},{passive:false});
 c.addEventListener('pointerdown',e=>{try{c.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,pos(e));if(P.size===1)moved=false;else{const[a,b]=[...P.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1]);moved=true}});
 c.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const p=pos(e),o=P.get(e.pointerId);
  if(P.size>=2){P.set(e.pointerId,p);const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd>0)emZoom(d/pd,(a[0]+b[0])/2,(a[1]+b[1])/2);pd=d;return}
  const dx=p[0]-o[0],dy=p[1]-o[1];if(!moved&&Math.hypot(dx,dy)<6)return;moved=true;P.set(e.pointerId,p);const V=EMAP.v,k=emView().k;V.cx-=dx/k;V.cz-=dy/k;emDraw()});
 const up=e=>{P.delete(e.pointerId);pd=0};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
 c.addEventListener('click',e=>{if(moved){moved=false;return}const p=pos(e);emPick(p[0],p[1])})}
function emPick(px,py){const V=EMAP.v,{X0,Z0,k}=emView(),tf=(x,z)=>[(x-X0)*k,(z-Z0)*k],rm=V.rm+Math.min(6,V.z-1);let best=null,tb=null,bd=(rm+8)**2;
 V.L.forEach(G=>{const q=tf(G.x,G.z);if(G.c==='terr'){if(Math.abs(q[0]-px)<=Math.max(10,G.w*k)/2&&Math.abs(q[1]-py)<=Math.max(10,G.d*k)/2)tb=G.k;return}const d=(q[0]-px)**2+(q[1]-py)**2;if(d<bd){bd=d;best=G.k}});estateMap(V.cat,best||tb)}
function emDraw(){const c=$('emc'),V=EMAP.v;if(!c||!V)return;const g=c.getContext('2d'),{X0,Z0,W,k}=emView(),tf=(x,z)=>[(x-X0)*k,(z-Z0)*k],rm=V.rm+Math.min(6,V.z-1),L=V.L;
 g.fillStyle='#2e78b8';g.fillRect(0,0,540,540);g.drawImage(stat,(X0+MOFF)*SC,(Z0+MOFF)*SC,W*SC,W*SC,0,0,540,540);
 g.textAlign='center';g.textBaseline='middle';g.font='bold 10px sans-serif';
 PLACES.forEach(p=>{const q=tf(p.x,p.z);if(q[0]<0||q[1]<0||q[0]>540||q[1]>540)return;g.globalAlpha=.55;g.fillStyle=p.c;g.beginPath();g.arc(q[0],q[1],6,0,7);g.fill();g.fillStyle='#fff';g.fillText(p.l,q[0],q[1]+1);g.globalAlpha=1});
 const ord=L.filter(G=>G.c==='terr').concat(L.filter(G=>G.c!=='terr').sort((a,b)=>(a.k===EMAP.sel)-(b.k===EMAP.sel)));
 ord.forEach(G=>{const q=tf(G.x,G.z),on=G.k===EMAP.sel,col=EMCOL[G.st];g.strokeStyle=on?'#fff':'#000';g.lineWidth=on?4:1.5;
  if(G.c==='terr'){const w=Math.max(10,G.w*k),d=Math.max(10,G.d*k);g.globalAlpha=.75;g.fillStyle=col;g.fillRect(q[0]-w/2,q[1]-d/2,w,d);g.globalAlpha=1;g.strokeRect(q[0]-w/2,q[1]-d/2,w,d);g.font='bold 12px sans-serif';g.fillStyle='#000';g.fillText(String(G.it[0].id),q[0],q[1]+1);return}
  const r=on?rm+4:rm;g.fillStyle=col;g.beginPath();if(G.c==='local')g.arc(q[0],q[1],r,0,7);else g.rect(q[0]-r,q[1]-r,r*2,r*2);g.fill();g.stroke();
  g.font='bold '+(r+2)+'px sans-serif';g.fillStyle=G.st==='mine'?'#000':'#fff';g.fillText(G.c==='local'?'L':G.c==='casa'?'C':'P',q[0],q[1]+1)});
 {const q=tf(pl.x,pl.z);if(q[0]>=0&&q[1]>=0&&q[0]<=540&&q[1]<=540){g.save();g.translate(q[0],q[1]);g.rotate(Math.PI-yaw);g.fillStyle='#ff3';g.strokeStyle='#000';g.lineWidth=1;g.beginPath();g.moveTo(0,-10);g.lineTo(7,8);g.lineTo(-7,8);g.closePath();g.fill();g.stroke();g.restore()}}
 {g.font='bold 13px sans-serif';g.textAlign='left';g.textBaseline='alphabetic';const tx='Zoom ×'+V.z.toFixed(1);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(6,514,g.measureText(tx).width+12,20);g.fillStyle='#fff';g.fillText(tx,12,528)}}
function estateRoute(x,z){navPlan({x,z,name:'el inmueble'});closeDlg();toast('📍 Ruta marcada en el mapa')}
function rentHouse(id){const h=HOUSES[id];if(h.owned)return;if(!pay(RENT))return;h.owned=true;h.mode='rent';h.late=0;setHouseColor(h,0x2f7fe0);flags.house=1;toast('Casa alquilada (puerta azul). Primer día pagado: -€'+RENT);estateRefresh()}
function endRent(id){const h=HOUSES[id];if(h.mode!=='rent')return;releaseHouse(h);toast('Has dejado el alquiler');estateRefresh()}
function mortHouse(id){const h=HOUSES[id];if(h.owned)return;const e=Math.round(h.price*MORT_DOWN);if(!pay(e))return;const tot=Math.round((h.price-e)*(1+MORT_RATE));h.mort={left:tot,n:MORT_N,cuota:Math.ceil(tot/MORT_N)};h.owned=true;h.mode='mort';h.late=0;setHouseColor(h,0x22aa44);flags.house=1;toast('Hipoteca firmada: entrada -€'+e+' · '+MORT_N+' cuotas de €'+h.mort.cuota);estateRefresh()}
function mortDone(h){if(h.mort.n<=0||h.mort.left<=0){h.mort=null;h.mode='own';toast('🏠 Hipoteca pagada: la casa es 100 % tuya')}}
function mortPay1(id){const h=HOUSES[id];if(!h.mort)return;const c=h.mort.n<=1?h.mort.left:Math.min(h.mort.cuota,h.mort.left);if(!pay(c))return;h.mort.left-=c;h.mort.n--;h.late=0;mortDone(h);estateRefresh()}
function mortPayAll(id){const h=HOUSES[id];if(!h.mort)return;if(!pay(h.mort.left))return;h.mort=null;h.mode='own';h.late=0;toast('🏠 Hipoteca liquidada');estateRefresh()}
function houseDay(){const msg=[];HOUSES.forEach(h=>{if(!h.owned)return;if(h.local){bizDay(h,msg);return}
 if(h.mode==='rent'){if(money>=RENT){money-=RENT;h.late=0;msg.push('alquiler -€'+RENT)}else{h.late=(h.late||0)+1;if(h.late>=HOUSE_LATE_MAX){releaseHouse(h);msg.push('⚠️ DESAHUCIO: has perdido la casa alquilada')}else msg.push('alquiler impagado ('+h.late+'/'+HOUSE_LATE_MAX+')')}}
 else if(h.mode==='mort'&&h.mort){const c=h.mort.n<=1?h.mort.left:Math.min(h.mort.cuota,h.mort.left);
  if(money>=c){money-=c;h.mort.left-=c;h.mort.n--;h.late=0;msg.push('hipoteca -€'+c);mortDone(h)}
  else{const r=Math.max(1,Math.round(c*.1));h.mort.left+=r;h.late=(h.late||0)+1;if(h.late>=HOUSE_LATE_MAX){releaseHouse(h);msg.push('⚠️ EMBARGO: el banco se queda tu casa')}else msg.push('hipoteca impagada ('+h.late+'/'+HOUSE_LATE_MAX+'), recargo +€'+r)}}});
 TERRENOS.forEach(t=>{if(t.owned&&t.biz&&t.biz.ty)bizDay(t.biz,msg)});
 if(msg.length){sfx.cash();const t='🏠 '+msg.join(' · ');setTimeout(()=>toast(t),loan?2700:0)}}
function hotelSleep(){if(money<100){toast('No tienes 100 €');return}closeDlg();sleepNight('Pasas la noche en el hotel...',15,'Has descansado en una cama de hotel',{cost:100})}
function sitAt(o){seat={x:o.x,z:o.z};pl.x=o.x;pl.z=o.z;setSit(body,true);toast('Te sientas (E o moverte para levantarte)')}
