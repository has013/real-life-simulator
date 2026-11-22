/* ===============================================================================================
   FICHA · estudios-gimnasio.js
   Qué hay:          Biblioteca (minijuegos de estudio), gimnasio (abonos y aparatos), universidad (matrícula, clases y examen), comida basura y la lista IDEF con lo que hace la E en cada objeto (IDEF.tipo = {txt, act}).
   Tócalo si quieres: cambiar los minijuegos de la biblioteca o del gimnasio, la universidad, o ver ejemplos de objetos con E
   Este fichero se carga en el orden de la lista de <script> de index.html y comparte variables con todos los demás.
   =============================================================================================== */
'use strict';
// Biblioteca: sesión de estudio de 15 min de juego; +2 a +5 puntos de la habilidad; enfriamiento entre sesiones de la misma actividad
const LIBACT={calc:{n:'Contabilidad',e:'📊',cd:0},comm:{n:'Manuales de Comunicación',e:'🗣️',cd:0},orient:{n:'Atlas y Cartografía',e:'🧭',cd:0},gest:{n:'Simulación de negocios',e:'♟️',cd:0},social:{n:'Tertulia',e:'🤝',cd:0},negoc:{n:'Regateo',e:'💼',cd:0},lider:{n:'Liderazgo',e:'👑',cd:0}};
function libStudy(k){const d=LIBACT[k];if(tm<d.cd){toast('Ya has estudiado esto hace poco: descansa un rato');return}
 if(energy<20){toast('Estás demasiado cansado para estudiar');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 fade(d.e+' '+d.n+'... (15 min)',()=>{const p=2+Math.floor(Math.random()*4),sk=SKILLS.find(q=>q.k===k);tod=(tod+.25)%24;hunger=Math.max(0,hunger-.8);thirst=100;energy=Math.max(0,energy-2);
  addSkill(k,p);d.cd=tm+90;toast(sk.e+' +'+p+' '+sk.n+' ('+skills[k]+')')})}
// Biblioteca, parte 2: simulación de negocios en los ordenadores (cafetería, 5 semanas; +2 a +5 Gestión y Estrategia según lo cerca que estés del beneficio óptimo)
const BZ={ev:[{n:'Demanda baja',b:60},{n:'Demanda media',b:100},{n:'Demanda alta',b:150}],cp:[{n:'competencia normal',p:[1.35,1,.65]},{n:'competencia agresiva (rebaja precios)',p:[1.2,.7,.35]},{n:'competencia cara',p:[1.5,1.3,1]}],pr:[['Bajo',4],['Medio',6],['Alto',9]],ad:[0,100,250],am:[1,1.2,1.35],CAP:120,s:null};
const bzUnits=(w,pi,ai)=>Math.round(Math.min(BZ.CAP,w.e.b*w.c.p[pi]*BZ.am[ai])),bzProfit=(w,pi,ai)=>bzUnits(w,pi,ai)*(BZ.pr[pi][1]-3)-BZ.ad[ai],
 bzBest=w=>{let b=-1e9;for(let p=0;p<3;p++)for(let a=0;a<3;a++)b=Math.max(b,bzProfit(w,p,a));return b};
function bzStart(){const d=LIBACT.gest;if(tm<d.cd){toast('Ya has jugado hace poco: descansa un rato');return}
 if(energy<20){toast('Estás demasiado cansado para concentrarte');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 const pk=a=>a[Math.floor(Math.random()*a.length)];BZ.s={w:Array.from({length:5},()=>({e:pk(BZ.ev),c:pk(BZ.cp)})),i:0,pi:1,ai:0,cash:1000,tot:0,best:0,last:''};bzRender()}
function bzRender(){const s=BZ.s,w=s.w[s.i];openDlg();const bt=(v,j,k,t)=>`<button style="${v===j?'background:#a84be8':''}" onclick="bzSet('${k}',${j})">${t}</button>`;
 dlg.innerHTML=`<h2>💻 Simulación de negocios · Cafetería</h2><p>Semana ${s.i+1}/5 · Caja: <b>€${s.cash}</b></p>`+(s.last?`<p><small>${s.last}</small></p>`:'')+
  `<p>Previsión: <b>${w.e.n}</b> con <b>${w.c.n}</b>. Capacidad máxima: ${BZ.CAP} cafés por semana (coste: €3 por café).</p>`+
  `<div class="r"><span>Precio</span>${BZ.pr.map((p,j)=>bt(s.pi,j,'pi',p[0]+' (€'+p[1]+')')).join('')}</div><div class="r"><span>Publicidad</span>${BZ.ad.map((a,j)=>bt(s.ai,j,'ai','€'+a)).join('')}</div>`+
  `<button onclick="bzGo()">Confirmar semana</button> <button onclick="closeDlg()" style="background:#a33">Salir</button>`}
function bzSet(k,j){BZ.s[k]=j;bzRender()}
function bzGo(){const s=BZ.s,w=s.w[s.i],u=bzUnits(w,s.pi,s.ai),p=bzProfit(w,s.pi,s.ai),b=bzBest(w);s.cash+=p;s.tot+=p;s.best+=b;s.i++;
 s.last='Semana '+s.i+': vendes '+u+' cafés → beneficio €'+p+' (lo mejor posible era €'+b+')';if(s.i<5){bzRender();return}
 const d=LIBACT.gest,r=s.best>0?clamp(s.tot/s.best,0,1):0,pts=r>=.9?5:r>=.75?4:r>=.55?3:2,sk=SKILLS.find(q=>q.k==='gest');
 tod=(tod+.25)%24;hunger=Math.max(0,hunger-.8);thirst=100;energy=Math.max(0,energy-2);addSkill('gest',pts);d.cd=tm+90;
 dlg.innerHTML=`<h2>💻 Simulación terminada</h2><p>${s.last}</p><p>Beneficio total: <b>€${s.tot}</b> de €${s.best} posibles (${Math.round(r*100)}%).</p><p>${sk.e} <b>+${pts} ${sk.n}</b> (${skills.gest})</p><button onclick="closeDlg()">Cerrar</button>`}
// Biblioteca, parte 3: atlas y rutas. 5 rondas: marca en el mapa dónde está un comercio; +2 a +5 Orientación y Espacio según la precisión
const AT={s:null};
function atStart(){const d=LIBACT.orient;if(tm<d.cd){toast('Ya has estudiado esto hace poco: descansa un rato');return}
 if(energy<20){toast('Estás demasiado cansado para estudiar');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 const cnt={};PLACES.forEach(p=>cnt[p.key]=(cnt[p.key]||0)+1);const c=PLACES.filter(p=>SHOPS[p.key]&&!p.nt&&cnt[p.key]===1&&p.x>-30&&p.x<300&&p.z>-30&&p.z<300);
 if(c.length<3){libStudy('orient');return}
 c.sort(()=>Math.random()-.5);AT.s={r:c.slice(0,5),i:0,sc:0,msg:''};atRender()}
function atRender(){const s=AT.s,p=s.r[s.i];openDlg();dlg.classList.add('wide');
 dlg.innerHTML='<h2>🧭 Atlas y rutas</h2><p>Ronda '+(s.i+1)+'/'+s.r.length+': marca en el mapa dónde está <b>'+SHOPS[p.key].n+'</b>.</p>'+(s.msg?'<p><small>'+s.msg+'</small></p>':'')+
  '<canvas id="atc" width="540" height="540" style="width:100%;max-width:540px;cursor:crosshair;border-radius:8px;display:block;margin:6px auto"></canvas><button onclick="closeDlg()" style="background:#a33">Salir</button>';
 const c=$('atc'),g=c.getContext('2d'),W0=-30,Wd=330;g.drawImage(stat,(W0+MOFF)*SC,(W0+MOFF)*SC,Wd*SC,Wd*SC,0,0,540,540);
 c.onclick=e=>{const b=c.getBoundingClientRect();atPick((e.clientX-b.left)/b.width*Wd+W0,(e.clientY-b.top)/b.height*Wd+W0)}}
function atPick(mx,mz){const s=AT.s,p=s.r[s.i],d=Math.hypot(p.x-mx,p.z-mz),dx=p.x-mx,dz=p.z-mz;s.sc+=d<12?1:d<25?.6:d<45?.3:0;
 s.msg=SHOPS[p.key].n+': has marcado a '+Math.round(d)+' m'+(d<12?' · ¡justo!':' · estaba más '+(Math.abs(dz)>Math.abs(dx)?(dz<0?'arriba':'abajo'):(dx<0?'a la izquierda':'a la derecha'))+' en el mapa');s.i++;if(s.i<s.r.length){atRender();return}
 const r=s.sc/s.r.length,pts=r>=.85?5:r>=.6?4:r>=.35?3:2,sk=SKILLS.find(q=>q.k==='orient'),d0=LIBACT.orient;
 tod=(tod+.25)%24;hunger=Math.max(0,hunger-.8);thirst=100;energy=Math.max(0,energy-2);addSkill('orient',pts);d0.cd=tm+90;
 dlg.classList.remove('wide');dlg.innerHTML='<h2>🧭 Estudio terminado</h2><p>'+s.msg+'</p><p>Precisión: <b>'+Math.round(r*100)+'%</b></p><p>'+sk.e+' <b>+'+pts+' '+sk.n+'</b> ('+skills.orient+')</p><button onclick="closeDlg()">Cerrar</button>'}
// Biblioteca, parte 4: minijuegos de test para Contabilidad (cuentas) y Comunicación (elegir la mejor frase). 5 preguntas; +2 a +5 según los aciertos
const QZ={s:null},qzRi=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),qzShuf=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]),
 COMM=[['Quieres pedir un aumento de sueldo a tu jefe.','«Llevo un año superando objetivos; me gustaría hablar de revisar mi sueldo.»','«Necesito más dinero, ya no me llega.»','«Seguro que tú también piensas que me lo merezco, ¿no?»'],
 ['Un cliente se queja de un retraso.','«Entiendo la molestia y lamento el retraso. Te propongo esta solución…»','«No es culpa mía, hay mucho trabajo.»','«Eso les pasa a todos, no te quejes.»'],
 ['Tienes que rechazar la invitación de un amigo.','«Gracias por pensar en mí; esta vez no puedo, ¿quedamos otro día?»','«No.»','No contestar y esperar a que se le olvide.'],
 ['Vas a presentar un proyecto ante un grupo.','Empezar con la idea principal, dar tres puntos y cerrar con una conclusión.','Leer las diapositivas en voz baja sin mirar al público.','Contar todos los detalles sin orden y acabar de golpe.'],
 ['Escribes un correo a un desconocido para pedir información.','Asunto claro, saludo educado, la petición concreta y agradecimiento.','Sin asunto y todo en mayúsculas.','Un párrafo larguísimo sin decir qué quieres.'],
 ['Un compañero critica tu trabajo en público.','«Gracias por el comentario; ¿lo vemos luego con calma y lo mejoramos?»','«Tú lo haces peor, mira lo tuyo.»','Marcharte sin decir nada.'],
 ['Quieres convencer a alguien de tu idea.','Escuchar sus dudas y responder con ejemplos y datos concretos.','Repetir lo mismo cada vez más fuerte.','Decirle que está equivocado.'],
 ['Tienes que explicarle algo complicado a un niño.','Usar palabras sencillas y un ejemplo de su día a día.','Usar términos técnicos para impresionarle.','Decirle que lo entenderá cuando sea mayor.']],
 SOC=[['Un compañero te cuenta que está agobiado con el trabajo.','«Parece que pasas una mala racha; ¿quieres hablar o te echo una mano?»','«Todos estamos igual, no es para tanto.»','«Qué suerte, yo ni tengo tiempo para escucharte.»'],
 ['Conoces a alguien nuevo en una fiesta.','Presentarte, preguntarle algo sobre él y escuchar su respuesta.','Hablar solo de ti sin parar.','Quedarte en una esquina mirando el móvil.'],
 ['Un amigo no está de acuerdo contigo en un tema.','Escuchar su punto de vista y explicar el tuyo con respeto.','Subir la voz hasta que ceda.','Darle la razón en todo aunque no lo pienses.'],
 ['Un vecino te saluda mientras vas con prisa.','Devolverle el saludo con una sonrisa y decirle que hablan otro día.','Fingir que no lo has visto.','Contestar con mala cara y seguir.'],
 ['Alguien llora tras recibir una mala noticia.','Quedarte a su lado, escucharle y no juzgar.','Decirle que no llore y cambiar de tema.','Contarle una historia tuya todavía peor.'],
 ['Se te olvida el cumpleaños de un amigo.','Disculparte con sinceridad y proponer celebrarlo juntos.','Inventar una excusa larguísima.','Hacer como si nada hubiera pasado.'],
 ['En un grupo hay una persona que nunca habla.','Preguntarle con amabilidad su opinión sobre el tema.','Ignorarla para no incomodarla.','Burlarte de que no habla.']],
 LID=[['Tu equipo va retrasado y el plazo se acerca.','Reunir al equipo, repasar prioridades y repartir tareas según las fortalezas de cada uno.','Hacerlo todo tú en una noche sin decir nada.','Culpar al más lento delante de todos.'],
 ['Dos miembros del equipo discuten.','Hablar con cada uno por separado y luego mediar para llegar a un acuerdo.','Dejar que se peleen hasta cansarse.','Echar a uno sin escuchar.'],
 ['Hay que decidir algo urgente y el equipo está dividido.','Escuchar las opciones brevemente, decidir y explicar el porqué.','Aplazarlo hasta que alguien más decida.','Imponer tu opción sin escuchar a nadie.'],
 ['Un miembro nuevo está perdido.','Asignarle un compañero de apoyo y objetivos claros al principio.','Dejar que aprenda solo a base de errores.','Quitarle responsabilidades para siempre.'],
 ['El equipo ha logrado un gran resultado.','Reconocer públicamente el trabajo de todos y agradecerlo.','Llevarte tú todo el mérito.','No decir nada porque era lo esperado.'],
 ['Cometes un error que afecta al equipo.','Reconocerlo, asumir la responsabilidad y proponer cómo repararlo.','Echar la culpa a otro.','Esconderlo y esperar que nadie lo note.'],
 ['Tu equipo está desmotivado tras un fracaso.','Analizar qué se aprendió y marcar un siguiente objetivo realista.','Decir que no pasa nada y seguir igual.','Exigirles más horas sin cambiar nada.']],
 QBANK={comm:COMM,social:SOC,lider:LID},QT={calc:'Cuadrar las cuentas',comm:'Redacción y oratoria',social:'Tertulia: ¿qué haces?',lider:'Dilemas de liderazgo'};
function qzBuild(k){const out=[];if(QBANK[k]){qzShuf(QBANK[k]).slice(0,5).forEach(c=>{const o=qzShuf([c[1],c[2],c[3]]);out.push({t:c[0]+' ¿Qué es lo mejor?',o,c:o.indexOf(c[1])})});return out}
 for(let i=0;i<5;i++){const t=i%3;let q,a;
  if(t===0){const n=[qzRi(2,9)*100,qzRi(2,9)*50,qzRi(1,6)*100,qzRi(1,5)*20];a=n[0]+n[1]-n[2]-n[3];q='Ingresos: €'+n[0]+' y €'+n[1]+'. Gastos: €'+n[2]+' y €'+n[3]+'. ¿Cuál es el beneficio?'}
  else if(t===1){const p=qzRi(1,9)*100;a=p*21/100;q='Un producto cuesta €'+p+' sin IVA. ¿Cuánto IVA (21 %) hay que sumarle?'}
  else{const p=qzRi(2,12)*50;a=p*.8;q='Un artículo de €'+p+' tiene un 20 % de descuento. ¿Cuánto pagas?'}
  const set=[a];while(set.length<3){const v=a+qzRi(-5,5)*10;if(!set.includes(v))set.push(v)}const o=qzShuf(set);out.push({t:q,o:o.map(v=>'€'+v),c:o.indexOf(a)})}return out}
function qzStart(k){const d=LIBACT[k];if(tm<d.cd){toast('Ya has estudiado esto hace poco: descansa un rato');return}
 if(energy<20){toast('Estás demasiado cansado para estudiar');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 QZ.s={k,q:qzBuild(k),i:0,ok:0,msg:''};qzRender()}
function qzRender(){const s=QZ.s,q=s.q[s.i],d=LIBACT[s.k];openDlg();
 dlg.innerHTML='<h2>'+d.e+' '+QT[s.k]+'</h2><p>Pregunta '+(s.i+1)+'/5</p>'+(s.msg?'<p><small>'+s.msg+'</small></p>':'')+'<p><b>'+q.t+'</b></p>'+
  q.o.map((o,j)=>'<div class="r"><button style="flex:1;text-align:left" onclick="qzAns('+j+')">'+o+'</button></div>').join('')+'<button onclick="closeDlg()" style="background:#a33">Salir</button>'}
function qzAns(j){const s=QZ.s,q=s.q[s.i];if(j===q.c){s.ok++;s.msg='✅ ¡Correcto!'}else s.msg='❌ Lo mejor era: '+q.o[q.c];s.i++;if(s.i<s.q.length){qzRender();return}
 const k=s.k,d=LIBACT[k],pts=k==='fisica'?(s.ok>=4?2:s.ok>=3?1:0):Math.max(2,s.ok),sk=SKILLS.find(x=>x.k===k);tod=(tod+.25)%24;hunger=Math.max(0,hunger-.8);thirst=100;energy=Math.max(0,energy-2);addSkill(k,pts);d.cd=tm+90;
 dlg.innerHTML='<h2>'+d.e+' Estudio terminado</h2><p>'+s.msg+'</p><p>Aciertos: <b>'+s.ok+'/5</b></p><p>'+(pts?sk.e+' <b>+'+pts+' '+sk.n+'</b> ('+skills[k]+')':'❌ Menos de 3 aciertos: no sumas puntos de '+sk.n)+'</p><button onclick="closeDlg()">Cerrar</button>'}
// Biblioteca, ampliación: regateo con un proveedor (Negociación). 4 rondas; cuanto más cerca de su mínimo oculto cierres, más puntos (+2 a +5)
const NG={s:null},ngRound=v=>Math.round(v/10)*10;
function ngStart(){const d=LIBACT.negoc;if(tm<d.cd){toast('Ya has estudiado esto hace poco: descansa un rato');return}
 if(energy<20){toast('Estás demasiado cansado para estudiar');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 const ask=qzRi(8,20)*100;NG.s={ask0:ask,ask,floor:ngRound(ask*(.55+Math.random()*.15)),r:1,msg:'El proveedor pide €'+ask+' por el lote.'};ngRender()}
function ngRender(){const s=NG.s;openDlg();dlg.innerHTML='<h2>💼 Regateo con el proveedor</h2><p>Ronda '+s.r+'/4</p><p><small>'+s.msg+'</small></p><p>Su precio actual: <b>€'+s.ask+'</b>. ¿Cuánto ofreces?</p>'+
  [['Muy bajo',.6],['Razonable',.75],['Cercano',.9]].map(o=>'<div class="r"><button style="flex:1;text-align:left" onclick="ngOffer('+o[1]+')">'+o[0]+' (€'+ngRound(s.ask*o[1])+')</button></div>').join('')+'<button onclick="closeDlg()" style="background:#a33">Salir</button>'}
function ngOffer(f){const s=NG.s,o=ngRound(s.ask*f);let paid=-1;
 if(o>=s.floor){paid=o;s.msg='Aceptan tu oferta de €'+o+'.'}
 else if(o<s.floor*.8&&Math.random()<.5){paid=0;s.msg='Tu oferta de €'+o+' les ofende y se marchan.'}
 else if(s.r>=4){paid=s.ask;s.msg='No hay más margen: cierras al precio final de €'+s.ask+'.'}
 else{const old=s.ask;s.ask=Math.max(s.floor+10,Math.min(old-10,ngRound((old+o)/2)));s.msg='Rechazan €'+o+' y bajan a €'+s.ask+'.';s.r++;ngRender();return}
 const r=paid>0?clamp((s.ask0-paid)/(s.ask0-s.floor),0,1):0,pts=paid>0?(r>=.85?5:r>=.6?4:r>=.35?3:2):2,sk=SKILLS.find(q=>q.k==='negoc'),d=LIBACT.negoc;
 tod=(tod+.25)%24;hunger=Math.max(0,hunger-.8);thirst=100;energy=Math.max(0,energy-2);addSkill('negoc',pts);d.cd=tm+90;
 dlg.innerHTML='<h2>💼 Negociación terminada</h2><p>'+s.msg+'</p><p>'+(paid>0?'Pagas €'+paid+' (pedían €'+s.ask0+'; su mínimo era €'+s.floor+').':'No hay acuerdo (pedían €'+s.ask0+'; su mínimo era €'+s.floor+').')+'</p><p>'+sk.e+' <b>+'+pts+' '+sk.n+'</b> ('+skills.negoc+')</p><button onclick="closeDlg()">Cerrar</button>'}
// Gimnasio, parte 2 (los locales son dos antiguas inmobiliarias: busca GYM_AT y gymIn): abonos hablando con la monitora de la recepción y entrenamientos de Condición Física.
// Cada entrenamiento (cinta, pesas, saco) dura 30 min de juego, cansa (energía −10, hambre −2,5) y da de +1 a +3 puntos (0 por debajo del 50 %)
// según la nota del minijuego; 90 s de enfriamiento por aparato. El tablón del monitor es un test de 5 preguntas (15 min; +2 con 4-5 aciertos, +1 con 3, 0 con menos).
// Abono: flags.gym = días que le quedan (se guarda con la partida; bankTick → gymDay descuenta uno cada medianoche).
const GYM={day:15,week:80},GYMACT={run:{n:'Cinta de correr',e:'🏃',cd:0},lift:{n:'Press de banca',e:'🏋️',cd:0},box:{n:'Saco de boxeo',e:'🥊',cd:0}};
LIBACT.fisica={n:'Consejos del monitor',e:'💪',cd:0};QT.fisica='Consejos del monitor';
function gymDay(){if(flags.gym>0){flags.gym--;if(!flags.gym)setTimeout(()=>toast('🏋️ Tu abono del gimnasio ha caducado'),5200)}}
function gymDesk(){openDlg();const d=flags.gym||0,sk=SKILLS.find(q=>q.k==='fisica');
 dlg.innerHTML='<h2>🏋️ Gimnasio · Recepción</h2><p>Monitora: «¡Hola! Con un abono puedes usar las cintas de correr, los bancos de pesas, los sacos de boxeo y el tablón del monitor. Abrimos de 07:00 a 23:00.»</p>'+
  '<p><small>'+(d?'✅ Tienes abono: '+(d===1?'válido hasta esta medianoche':'quedan '+d+' días'):'❌ No tienes abono')+' · '+sk.e+' '+sk.n+': <b>'+skills.fisica+' pts</b> · energía '+Math.round(energy)+'%</small></p>'+
  '<div class="r"><button onclick="gymBuy(1)">Pase de día: €'+GYM.day+'</button> <button onclick="gymBuy(7)">Abono semanal (7 días): €'+GYM.week+'</button></div><button onclick="closeDlg()" style="background:#666">Cerrar</button>'}
function gymBuy(n){if(!isOpen('gym')){toast('El gimnasio está cerrado: abre a las 07:00');return}if(!pay(n===7?GYM.week:GYM.day))return;
 flags.gym=(flags.gym||0)+n;toast('🏋️ '+(n===7?'Abono semanal':'Pase de día')+' comprado');saveGame();gymDesk()}
function gymOk(a){if(!isOpen('gym')){toast('El gimnasio está cerrado: abre a las 07:00');return false}
 if(!(flags.gym>0)){toast('Necesitas un abono: pásate por la recepción');return false}
 if(tm<a.cd){toast('Ya has entrenado aquí hace poco: prueba otro aparato o descansa un rato');return false}
 if(energy<25){toast('Estás demasiado cansado para entrenar');return false}if(hunger<20){toast('Con hambre no tienes fuerzas para entrenar');return false}return true}
function gymEnd(k,r,txt){const a=GYMACT[k],pts=r>=.85?3:r>=.65?2:r>=.5?1:0,sk=SKILLS.find(q=>q.k==='fisica');
 tod=(tod+.5)%24;hunger=Math.max(0,hunger-2.5);thirst=100;energy=Math.max(0,energy-10);addSkill('fisica',pts);a.cd=tm+90;openDlg();
 dlg.innerHTML='<h2>'+a.e+' Entrenamiento terminado</h2><p>'+txt+'</p><p>Nota: <b>'+Math.round(r*100)+'%</b></p><p>'+(pts?sk.e+' <b>+'+pts+' '+sk.n+'</b> ('+skills.fisica+')':'❌ Por debajo del 50 %: no sumas puntos de '+sk.n)+'</p><p><small>30 min · energía −10 · hambre −2,5</small></p><button onclick="closeDlg()">Cerrar</button>'}
// Cinta de correr: hay que pisar alternando pie izquierdo y derecho al ritmo de la cinta (la luz que parpadea). 16 pasos; a mitad, la cinta acelera.
const TR={s:null};
function trStart(){if(!gymOk(GYMACT.run))return;TR.s={i:0,n:16,sc:0,ft:-1,t0:0,beat:.6,msg:''};const a=GYMACT.run;openDlg();
 dlg.innerHTML='<h2>'+a.e+' '+a.n+'</h2><p><small>Corre al ritmo de la cinta: pisa alternando 🦶 izquierdo y derecho, un paso cada vez que se enciende la luz. Si repites pie, tropiezas. A mitad, la cinta acelera.</small></p>'+
  '<style>@keyframes trBeat{0%,30%{background:#2a9d4a;transform:scale(1.2)}31%,100%{background:#444;transform:scale(1)}}</style>'+
  '<div style="display:flex;align-items:center;gap:10px;margin:8px 0"><div id="trDot" style="width:22px;height:22px;border-radius:50%;flex:none;animation:trBeat .6s linear infinite"></div><span id="trInfo">Paso 1/16 · empieza cuando quieras</span></div>'+
  '<div style="height:10px;border-radius:5px;background:rgba(255,255,255,.12);margin:6px 0 12px;overflow:hidden"><div id="trBar" style="height:100%;width:0;background:#1e88e5;transition:width .2s"></div></div>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button style="font-size:20px;padding:14px 0" onclick="trStep(0)">🦶 Izquierdo</button><button style="font-size:20px;padding:14px 0" onclick="trStep(1)">Derecho 🦶</button></div><p></p><button onclick="closeDlg()" style="background:#a33">Salir</button>'}
function trStep(f){const s=TR.s;if(!s||!$('trInfo'))return;const now=performance.now()/1000;let g;
 if(f===s.ft){g=0;s.msg='¡Tropiezas! Has repetido pie'}
 else if(!s.t0){g=1;s.msg='¡Arrancas!'}
 else{const dt=now-s.t0,e=Math.abs(dt-s.beat);g=e<.1?1:e<.22?.6:0;s.msg=g===1?'Buen ritmo':g?'Casi':(dt<s.beat?'Vas demasiado rápido':'Te quedas atrás')}
 s.sc+=g;s.ft=f;s.t0=now;s.i++;
 if(s.i>=s.n){TR.s=null;gymEnd('run',s.sc/s.n,'Has dado '+s.n+' zancadas en la cinta. Última: '+s.msg);return}
 if(s.i===s.n/2){s.beat=.45;$('trDot').style.animationDuration='.45s';s.msg+=' · ¡La cinta acelera!'}
 $('trInfo').textContent='Paso '+(s.i+1)+'/'+s.n+' · '+s.msg;$('trBar').style.width=(s.i/s.n*100)+'%'}
// Press de banca: mantén pulsado «Empujar» para subir la barra y suéltalo en la zona verde (brazos estirados). Si llegas arriba del todo, bloqueas
// los codos y fallas. La barra tiembla al subir; 6 repeticiones y cada una pesa 10 kg más (sube más rápido y la zona se estrecha).
const BP={s:null,raf:0};
function bpStart(){if(!gymOk(GYMACT.lift))return;BP.s={i:0,n:6,sc:0,p:0,hold:false,sp:.55,zc:.78,zw:.16,kg:40,msg:'',lt:0};bpRender()}
function bpRender(){const s=BP.s,a=GYMACT.lift;openDlg();
 dlg.innerHTML='<h2>'+a.e+' '+a.n+'</h2><p><small>Mantén pulsado «Empujar» para subir la barra y suéltalo cuando esté en la zona verde (brazos estirados). Si llegas a la franja roja, bloqueas los codos y fallas.</small></p><p>Repetición '+(s.i+1)+'/'+s.n+' · <b>'+s.kg+' kg</b>'+(s.msg?' · '+s.msg:'')+'</p>'+
  '<div style="display:flex;gap:16px;align-items:center"><div style="position:relative;width:46px;height:170px;border-radius:10px;background:rgba(255,255,255,.12);overflow:hidden;flex:none">'+
  '<div style="position:absolute;left:0;right:0;background:#2a9d4a;bottom:'+((s.zc-s.zw/2)*100)+'%;height:'+(s.zw*100)+'%"></div><div style="position:absolute;left:0;right:0;top:0;height:4%;background:#c0392b"></div>'+
  '<div id="bpm" style="position:absolute;left:0;right:0;height:8px;margin-bottom:-4px;background:#ddd;border-radius:4px;bottom:0"></div></div>'+
  '<button id="bpBtn" style="flex:1;font-size:20px;padding:26px 0;touch-action:none;user-select:none;-webkit-user-select:none">🏋️ Empujar</button></div><p></p><button onclick="closeDlg()" style="background:#a33">Salir</button>';
 const b=$('bpBtn');
 b.onpointerdown=e=>{e.preventDefault();if(BP.s!==s)return;s.hold=true;try{b.setPointerCapture(e.pointerId)}catch(_){}};
 b.onpointerup=b.onpointercancel=()=>{if(BP.s!==s||!s.hold)return;s.hold=false;if(s.p>=.1)bpRelease()}; // un toque sin subir la barra no cuenta como repetición
 b.oncontextmenu=e=>e.preventDefault();
 s.p=0;s.lt=performance.now();cancelAnimationFrame(BP.raf);BP.raf=requestAnimationFrame(bpTick)}
function bpTick(now){const s=BP.s,m=$('bpm');if(!s||!m||!dlgOpen)return;const dt=Math.min(.05,Math.max(0,now-s.lt)/1000);s.lt=now;
 if(s.hold){s.p+=s.sp*dt*(1+.4*Math.sin(now/90));if(s.p>=.96){s.p=.96;s.hold=false;bpRelease();return}}else s.p=Math.max(0,s.p-.6*dt);
 m.style.bottom=(s.p*100)+'%';BP.raf=requestAnimationFrame(bpTick)}
function bpRelease(){const s=BP.s;if(!s)return;cancelAnimationFrame(BP.raf);const d=Math.abs(s.p-s.zc),h=s.zw/2;
 if(s.p>=.96)s.msg='¡Bloqueas los codos!';else if(d<=h*.4){s.sc+=1;s.msg='¡Repetición perfecta!'}else if(d<=h){s.sc+=.7;s.msg='Buena repetición'}else s.msg=s.p<s.zc?'Te quedas corto':'Demasiado arriba';
 s.i++;if(s.i>=s.n){BP.s=null;gymEnd('lift',s.sc/s.n,'Has hecho '+s.n+' repeticiones, hasta '+s.kg+' kg. Última: '+s.msg);return}
 s.kg+=10;s.sp+=.12;s.zw=Math.max(.08,s.zw-.015);s.zc=.62+Math.random()*.22;bpRender()}
// Saco de boxeo: el entrenador canta un golpe y hay que pulsarlo antes de que se acabe el tiempo (cada golpe, menos tiempo). 10 golpes.
const BX={s:null,to:0},BXP=[['⬅️','Crochet izquierdo'],['⬆️','Directo'],['⬇️','Gancho'],['➡️','Crochet derecho']];
function bxStart(){if(!gymOk(GYMACT.box))return;BX.s={i:0,n:10,sc:0,t:0,win:1.8,msg:''};bxNext()}
function bxNext(){const s=BX.s;s.t=Math.random()*4|0;s.t0=performance.now();const o=qzShuf([0,1,2,3]),a=GYMACT.box;openDlg();
 dlg.innerHTML='<h2>'+a.e+' '+a.n+'</h2><p><small>El entrenador canta un golpe: pulsa el botón correcto antes de que se acabe la barra. Cada vez hay menos tiempo.</small></p><p>Golpe '+(s.i+1)+'/'+s.n+(s.msg?' · '+s.msg:'')+'</p>'+
  '<p style="font-size:24px;text-align:center;margin:8px 0">¡<b>'+BXP[s.t][1]+'</b>!</p><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin:6px 0 10px"><div id="bxt" style="height:100%;width:100%;border-radius:3px;background:#c0392b;transition:width '+s.win+'s linear"></div></div>'+
  '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">'+o.map(j=>'<button style="padding:10px 4px" onclick="bxHit('+j+')">'+BXP[j][0]+' '+BXP[j][1]+'</button>').join('')+'</div><p></p><button onclick="closeDlg()" style="background:#a33">Salir</button>';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const t=$('bxt');if(t)t.style.width='0%'}));
 clearTimeout(BX.to);BX.to=setTimeout(()=>{if(BX.s===s&&dlgOpen&&$('bxt'))bxHit(-1)},s.win*1000)}
function bxHit(j){const s=BX.s;if(!s)return;clearTimeout(BX.to);const el=(performance.now()-s.t0)/1000;
 if(j===s.t){const g=el<s.win*.5?1:.7;s.sc+=g;s.msg=g===1?'¡Golpe limpio!':'Bien'}else s.msg=j<0?'Demasiado lento':'Golpe equivocado';
 s.i++;if(s.i>=s.n){BX.s=null;gymEnd('box',s.sc/s.n,'Has terminado el asalto de '+s.n+' golpes. Último: '+s.msg);return}
 s.win=Math.max(.8,s.win-.1);bxNext()}
// Tablón del monitor: test de 5 preguntas de Condición Física (las mismas del examen de la universidad, en EXB.fisica)
function gymTips(){if(!gymOk(LIBACT.fisica))return;QBANK.fisica=EXB.fisica;qzStart('fisica')}
// Universidad, parte 2: secretaría (matrícula). Estado en flags.uni (se guarda con la partida): {enr: título en curso, done: títulos obtenidos, prog: 0 hasta que empiecen las clases}
const UNI={fplog:{n:'FP en Logística y Transporte',p:500,r:{orient:7,fisica:5}},fpcom:{n:'FP en Comercio y Atención al Cliente',p:500,r:{social:7,comm:5}},fpadm:{n:'FP en Administración de Comercio',p:750,r:{calc:8,gest:6}},
 geco:{n:'Grado en Economía y Finanzas',p:2500,req:'fpadm',r:{calc:12,gest:8}},gder:{n:'Grado en Derecho y Ciencias Políticas',p:3000,r:{comm:10,negoc:7,lider:5}},gade:{n:'Grado en Dirección de Empresas (ADE)',p:3500,req:'geco',r:{gest:10,lider:8,negoc:7}}},
 uniS=()=>flags.uni||(flags.uni={enr:null,done:[],prog:0});
for(const k in UNI){UNI[k].t=/^f/.test(k)?'fp':'gr';UNI[k].tasa=UNI[k].t==='fp'?100:250} // t: dónde se cursa (fp: ala norte, gr: ala sur); tasa: precio de repetir el examen
function uniGrant(k){const t=UNI[k],u=uniS();for(const q in t.r)addSkill(q,t.r[q]);u.done.push(k);u.enr=null;u.prog=0;u.fail=0;u.paid=0} // se usará al aprobar (parte 3)
function uniMenu(){const u=uniS();openDlg();dlg.classList.add('wide');
 const row=k=>{const t=UNI[k],ok=!t.req||u.done.includes(t.req),have=u.done.includes(k),en=u.enr===k,
  rw=Object.keys(t.r).map(q=>{const x=SKILLS.find(z=>z.k===q);return'+'+t.r[q]+' '+x.e+' '+x.n}).join(' · ');let a;
  if(have)a='✅ Obtenido';else if(en)a='📘 En curso: '+(u.prog>=4?'examen pendiente':'clases '+u.prog+'/4')+' · aula: ala '+(t.t==='fp'?'norte':'sur')+' '+(u.prog?'':'<button onclick="uniCancel()" style="margin-left:8px">Anular (te devuelven €'+t.p+')</button>');
  else if(!ok)a='🔒 Requiere: '+UNI[t.req].n;else a='<button '+(u.enr?'disabled style="opacity:.5"':'')+' onclick="uniEnroll(\''+k+'\')">Matricularme (€'+t.p+')</button>';
  return'<div style="margin:6px 0;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.07)"><b>'+t.n+'</b><br><small>'+rw+'</small><br>'+a+'</div>'};
 dlg.innerHTML='<h2>🎓 Secretaría de la Universidad</h2><p><small>Solo puedes cursar un título a la vez. Cada título tiene 4 clases de 1 hora (a cualquier hora del día) en su aula y un examen final. El FP se cursa en el ala norte y los grados en la sur.</small></p><h3>Ciclos de FP</h3>'+['fplog','fpcom','fpadm'].map(row).join('')+'<h3>Grados</h3>'+['geco','gder','gade'].map(row).join('')+'<button onclick="closeDlg()">Cerrar</button>'}
function uniEnroll(k){const t=UNI[k],u=uniS();if(u.enr||u.done.includes(k)||(t.req&&!u.done.includes(t.req))||!pay(t.p))return;u.enr=k;u.prog=0;toast('🎓 Matriculado en '+t.n);uniMenu()}
function uniCancel(){const u=uniS(),t=UNI[u.enr];if(!t||u.prog)return;money+=t.p;u.enr=null;toast('Matrícula anulada: te devuelven €'+t.p);uniMenu()}
// Universidad, parte 3: 4 clases de 1 h de juego (a cualquier hora) en el aula del título y examen final (8 preguntas, se aprueba con 5). Suspender no pierde las clases; repetir cuesta una tasa (FP €100, grado €250)
const EXB={orient:[['¿Qué instrumento indica el norte?','Una brújula','Un cronómetro','Un termómetro'],['Si el sol sale por tu derecha (hemisferio norte), ¿hacia dónde miras?','Hacia el sur','Hacia el norte','Hacia el oeste'],['En un mapa, ¿qué indica la escala?','La relación entre la distancia del mapa y la real','La altura de las montañas','La hora de las rutas'],['Para ir antes entre dos puntos, ¿qué ruta eliges normalmente?','La más corta, sin obstáculos ni atascos','La que tiene más curvas','La que pasa por más calles'],['¿Cuántos grados tiene un giro completo?','360','180','90'],['Si miras al norte y giras 90° a la derecha, ¿hacia dónde miras?','Al este','Al oeste','Al sur']],
 fisica:[['¿Qué conviene hacer antes de un ejercicio intenso?','Calentar los músculos','Comer mucho justo antes','Quedarte quieto'],['¿Qué ayuda más a recuperarse tras entrenar?','Hidratarse y descansar','No beber nada','Entrenar sin parar'],['Al levantar un peso del suelo, ¿cómo proteges la espalda?','Doblando las rodillas con la espalda recta','Doblando la espalda con las piernas rectas','Girando el tronco con el peso'],['¿Cada cuánto se recomienda hacer actividad física?','Varios días a la semana','Una vez al año','Solo en vacaciones'],['¿Qué mejora la resistencia?','El ejercicio cardiovascular regular','Dormir poco','Evitar moverse'],['Si te mareas haciendo ejercicio, ¿qué haces?','Parar, sentarte y beber agua','Seguir más rápido','Taparte la cara']],
 gest:[['Tienes pocos recursos y muchas tareas. ¿Qué haces primero?','Priorizar lo más importante y urgente','Empezar por lo más fácil sin plan','Hacerlo todo a la vez'],['Un negocio gasta más de lo que ingresa. ¿Qué es lo más sensato?','Revisar costes y ajustar precios o gastos','Gastar más en publicidad sin analizar','Ignorar los números'],['¿Para qué sirve un objetivo medible?','Para saber si se está cumpliendo','Para decorar el plan','Para evitar decidir'],['Un competidor baja precios. ¿Qué haces?','Analizar tu margen y tu valor diferencial antes de reaccionar','Bajar por debajo del coste','Cerrar sin pensarlo'],['¿Qué es un riesgo en una empresa?','Algo que puede afectar negativamente al resultado','Un beneficio garantizado','Un tipo de impuesto'],['Tienes dos proyectos y dinero para uno. ¿Cómo eliges?','Comparando retorno esperado, riesgo y plazo','Tirando una moneda','Escogiendo el más caro']],
 negoc:[['Antes de negociar, ¿qué conviene definir?','Tu objetivo y tu límite mínimo','Solo cuánto quieres ganar','Nada: improvisar'],['La otra parte te ofrece menos de lo esperado. ¿Qué haces?','Contraofertar con argumentos','Aceptar al instante','Levantarte sin hablar'],['Un buen acuerdo suele ser...','Beneficioso para ambas partes','Uno donde una parte lo pierde todo','El más rápido siempre'],['Si hay un bloqueo, ¿qué ayuda?','Buscar intereses comunes y alternativas','Repetir tu postura más fuerte','Amenazar'],['¿Qué es tu alternativa si no hay acuerdo (plan B)?','Lo que harás si la negociación fracasa','El precio inicial','Un regalo para la otra parte'],['Para ceder sin perder, ¿qué haces?','Pedir algo a cambio de cada concesión','Ceder sin decir nada','Ceder todo al principio']]},
 EX={s:null},exArea=k=>EXB[k]?qzShuf(EXB[k]).slice(0,5).map(c=>{const o=qzShuf([c[1],c[2],c[3]]);return{t:c[0],o,c:o.indexOf(c[1])}}):qzBuild(k);
const uniCost=()=>{tod=(tod+1)%24;hunger=Math.max(0,hunger-3.2);thirst=100;energy=Math.max(0,energy-5)};
function uniTxt(t){const u=uniS(),k=u.enr;if(!k||UNI[k].t!==t)return'E: aula ('+(k?'tu título se cursa en la otra ala':'necesitas una matrícula')+')';return u.prog<4?'E: asistir a clase ('+(u.prog+1)+'/4, 1 h)':'E: hacer el examen final'+(u.fail?' (tasa €'+UNI[k].tasa+')':'')}
function uniAula(t){const u=uniS(),k=u.enr;if(!k){toast('Primero matricúlate en la secretaría');return}if(UNI[k].t!==t){toast('Tu título se cursa en el aula de la otra ala');return}
 if(energy<15){toast('Estás demasiado cansado');return}if(hunger<15){toast('Con hambre no puedes concentrarte');return}
 if(u.prog<4){fade('📘 Clase de '+UNI[k].n+' (1 h)...',()=>{uniCost();u.prog++;toast(u.prog<4?'📘 Clase '+u.prog+'/4 completada':'🎓 Clases completadas: ya puedes hacer el examen final')});return}
 if(u.fail&&!u.paid){if(!pay(UNI[k].tasa))return;u.paid=1}
 const ar=k==='fplog'?['orient','fisica']:k==='fpcom'?['social','comm']:k==='fpadm'||k==='geco'?['calc','gest']:k==='gder'?['comm','negoc','lider']:['gest','lider','negoc'],pk=ar.map(exArea),q=[];
 for(let i=0;q.length<8;i++){const x=pk[i%pk.length].pop();if(x)q.push(x)}EX.s={k,q,i:0,ok:0};exRender()}
function exRender(){const s=EX.s,q=s.q[s.i];openDlg();dlg.innerHTML='<h2>📝 Examen final · '+UNI[s.k].n+'</h2><p>Pregunta '+(s.i+1)+'/8 (se aprueba con 5 aciertos)</p><p><b>'+q.t+'</b></p>'+q.o.map((o,j)=>'<div class="r"><button style="flex:1;text-align:left" onclick="exAns('+j+')">'+o+'</button></div>').join('')+'<button onclick="closeDlg()" style="background:#a33">Salir (sin penalización)</button>'}
function exAns(j){const s=EX.s;if(j===s.q[s.i].c)s.ok++;s.i++;if(s.i<8){exRender();return}
 const u=uniS(),t=UNI[s.k],pass=s.ok>=5;uniCost();u.paid=0;let h='<h2>📝 Examen terminado</h2><p>Aciertos: <b>'+s.ok+'/8</b></p>';
 if(pass){uniGrant(s.k);h+='<p>🎓 <b>¡Aprobado! Has obtenido: '+t.n+'</b></p><p>'+Object.keys(t.r).map(q=>{const x=SKILLS.find(z=>z.k===q);return'+'+t.r[q]+' '+x.e+' '+x.n+' ('+skills[q]+')'}).join('<br>')+'</p>';toast('🎓 Título obtenido: '+t.n)}
 else{u.fail=1;h+='<p>❌ Suspendido. Conservas las 4 clases; para repetir el examen hay que pagar una tasa de €'+t.tasa+'.</p>'}
 dlg.innerHTML=h+'<button onclick="closeDlg()">Cerrar</button>'}
Object.assign(IDEF,{
 unifp:{txt:()=>uniTxt('fp'),act:()=>uniAula('fp')},
 unigr:{txt:()=>uniTxt('gr'),act:()=>uniAula('gr')},
 unisec:{txt:()=>'E: secretaría de la universidad (matrícula)',act:()=>uniMenu()},
 libsoc:{txt:()=>'E: tertulia en la mesa redonda (15 min)',act:()=>qzStart('social')},
 libneg:{txt:()=>'E: manuales de negociación: regateo (15 min)',act:()=>ngStart()},
 liblid:{txt:()=>'E: mesa de juntas: casos de liderazgo (15 min)',act:()=>qzStart('lider')},
 libcalc:{txt:()=>'E: estudiar Contabilidad (15 min)',act:()=>qzStart('calc')},
 libcomm:{txt:()=>'E: leer manuales de Comunicación (15 min)',act:()=>qzStart('comm')},
 libatlas:{txt:()=>'E: estudiar el atlas y los mapas (15 min)',act:()=>atStart()},
 mayordesk:{txt:()=>'E: despacho del Alcalde',act:()=>mayorOffice()},
 libpc:{txt:()=>'E: usar el ordenador (simulación de negocios, 15 min)',act:()=>bzStart()},
 gymrun:{txt:()=>'E: correr en la cinta (30 min)',act:()=>trStart()},
 gymlift:{txt:()=>'E: press de banca (30 min)',act:()=>bpStart()},
 gymbox:{txt:()=>'E: golpear el saco de boxeo (30 min)',act:()=>bxStart()},
 gymtips:{txt:()=>'E: tablón del monitor: consejos de entrenamiento (15 min)',act:()=>gymTips()},
 hosdesk:{txt:()=>'E: recepción del hospital (atención médica €'+HOSPITAL_FEE+')',act:()=>hospitalDesk()},
 hosbed:{txt:()=>'E: descansar en la cama del hospital',act:()=>{if(energy>90)toast('No necesitas descansar ahora mismo');else fade('Descansas en la cama...',()=>sleepFor(2,10,'Has descansado en el hospital',true,true))}},
 souv:{txt:()=>'E: comprar souvenir (€12)',act:()=>{if(!pay(12))return;flags.souv=(flags.souv||0)+1;toast('Has comprado un souvenir de la montaña ('+flags.souv+')')}},
 bed:{txt:()=>'E: dormir',act:()=>{if(tod>=19||tod<6)sleepNight('Duermes hasta la mañana...',14,'Amanece');else if(energy>90)toast('No tienes sueño ahora mismo');else fade('Echas una siesta...',()=>sleepFor(2,10,'Has echado una siesta',true,true))}},
 sit:{txt:()=>'E: sentarte',act:o=>sitAt(o)},
 fridge:{txt:()=>'E: abrir la nevera',act:o=>{if(hunger>94){toast('No tienes hambre');return}if(tm<o.use){toast('La nevera está casi vacía, vuelve en un rato');return}hunger=Math.min(100,hunger+25);o.use=tm+40;toast('Comes algo de la nevera (hambre +25)')}},
 tv:{txt:o=>o.on?'E: apagar la tele':'E: encender la tele',act:o=>{o.on=!o.on;o.m.material=mat(o.on?0x4aa3ff:0x050505);toast(o.on?'Tele encendida':'Tele apagada')}},
 toilet:{txt:()=>'E: usar el baño',act:()=>toast('Qué alivio...')},
 sink:{txt:()=>'E: lavarte las manos',act:()=>toast('Te lavas las manos')},
 bath:{txt:()=>'E: darte un baño',act:()=>fade('Te das un baño relajante...',()=>toast('Te sientes limpio'))},
 wardrobe:{txt:()=>'E: abrir el armario',act:()=>{const r=Object.keys(inv).filter(k=>inv[k].cat==='Ropa'&&inv[k].n>0);toast(r.length?'Tu ropa: '+r.join(', ')+(Object.keys(worn).length?' · Llevas puesto: '+Object.values(worn).join(', '):'')+' (ponte o quítate cosas en el inventario, tecla I)':'El armario está vacío (compra ropa en Moda)')}},
 stove:{txt:()=>'E: cocinar',act:()=>{const k=Object.keys(inv).find(x=>inv[x].cat==='Comida'&&inv[x].n>0);if(!k){toast('No tienes ingredientes: compra comida');return}inv[k].n--;const g=Math.round((FOOD[k]||10)*1.5);hunger=Math.min(100,hunger+g);toast('Cocinas y comes: '+k+' (hambre +'+g+')'+junkEat(k))}},
 fishmkt:{txt:()=>'E: vender pescado en la lonja',act:()=>fishMarketOpen()},
 shelf:{txt:()=>'E: ver productos',act:o=>talk(WORKERS.find(w=>w.key===o.extra))}});
const FOOD={Manzanas:15,Pan:20,Agua:5,Pizza:45,Leche:12,Bocadillo:35,Fruta:15,Refresco:8,Chocolate:12,'Café':6,Cerveza:5,Tapa:25,'Pescado fresco':40,
 'Hamburguesa':40,'Hamburguesa doble':55,'Patatas fritas':20,'Pollo frito':40,'Nuggets':30,'Perrito caliente':30,'Refresco de cola':8,'Batido':15,'Menú completo':70};
// Comida basura (hamburguesería): quita el hambre pero resta Condición Física. Valor = puntos (enteros) que resta.
const JUNK={'Hamburguesa':1,'Hamburguesa doble':2,'Patatas fritas':1,'Pollo frito':1,'Nuggets':1,'Perrito caliente':1,'Refresco de cola':1,'Batido':1,'Menú completo':2};
function junkEat(k){const j=JUNK[k];if(!j)return'';const b=skills.fisica;addSkill('fisica',-j);const l=b-skills.fisica;return l?' · 💪 Condición Física −'+l+' ('+skills.fisica+')':' · 🍟 comida basura'}
const THIRST={Agua:35,Leche:15,Refresco:25,Cerveza:10,'Café':8,'Refresco de cola':25,'Batido':15},ENERGY={'Café':25,Chocolate:10,Refresco:8,'Refresco de cola':8};
function eat(k){const o=inv[k];o.n--;const g=FOOD[k]||10,t=THIRST[k]||0,en=ENERGY[k]||0;hunger=Math.min(100,hunger+g);energy=Math.min(100,energy+en);
 toast((t&&g<=8?'Has bebido: ':'Has comido: ')+k+' (hambre +'+g+''+(en?', energía +'+en:'')+')'+junkEat(k))}
function eatQuick(){const k=Object.keys(inv).find(x=>inv[x].cat==='Comida'&&inv[x].n>0);if(!k){toast('No tienes comida: cómprala en un comercio');return}eat(k)}
function toggleInv(){const e=$('inv');
 if(invOpen){invOpen=false;e.style.display='none';dlgOpen=false;try{ren.domElement.requestPointerLock()}catch(x){}return}
 invOpen=true;dlgOpen=true;document.exitPointerLock&&document.exitPointerLock();for(const k in K)K[k]=false;renderInv()}
function renderInv(){const e=$('inv'),cats={};
 Object.keys(inv).forEach(k=>{if(inv[k].n>0)(cats[inv[k].cat]=cats[inv[k].cat]||[]).push(k)});
 let h='<h2>🎒 Inventario</h2><div>Dinero: <b>€'+money+'</b></div>'+(loan?'<div>Deuda: <b>€'+loan.left+'</b> · '+loan.n+' cuotas de €'+loan.cuota+'</div>':'')+houseInfoHtml()+petInfoHtml();const ks=Object.keys(cats);
 if(!ks.length)h+='<p>Aún no has comprado objetos.</p>';
 ks.forEach(c=>{h+='<h3>'+c+'</h3>';cats[c].forEach(k=>{const o=inv[k];const wr=o.cat==='Ropa'&&CLOTH[k]&&worn[CLOTH[k].slot]===k;h+='<div class="r">'+(o.cat==='Ropa'&&CLOTH[k]?'<img class="ti" src="'+thumbOf(k)+'">':'')+'<span>'+k+' ×'+o.n+(wr?' ✔ puesto':'')+'</span><button onclick="useItem(\''+k+'\')">'+(wr?'Quitarse':o.act)+'</button></div>'})});
 const cs=cars.filter(c=>c.owned),hs=HOUSES.filter(x=>x.owned);
 h+='<h3>Vehículos</h3>'+(cs.map(c=>'<div>'+c.spec.name+'</div>').join('')||'<div>ninguno</div>');
 const ts=TERRENOS.filter(x=>x.owned);h+='<h3>Propiedades</h3>'+((hs.map(x=>'<div>Casa en ('+x.x+', '+x.z+')</div>').join('')+ts.map(x=>'<div>Terreno nº '+x.id+' ('+x.w+'×'+x.d+' m)</div>').join(''))||'<div>ninguna</div>');
 h+=keysInvHtml();h+=rankHtml();h+=skillsHtml();h+=jobsInv();const pc={};TERRENOS.forEach(t=>{if(t.owned&&t.b)for(const v of t.b.m.values())pc[v[0]]=(pc[v[0]]||0)+1});const pk=Object.keys(pc);if(pk.length)h+='<h3>Colocado en casa</h3>'+pk.map(k=>'<div>'+k+' ×'+pc[k]+'</div>').join('');
 e.innerHTML=h+'<div><button onclick="toggleInv()" style="background:#666">Cerrar (I)</button></div>';e.style.display='block';keysInvBind()}
function useItem(k){const o=inv[k];if(!o||o.n<1)return;
 if(o.cat==='Muebles'){const q=TERRENOS.find(x=>x.owned&&Math.abs(pl.x-x.x)<x.w/2+10&&Math.abs(pl.z-x.z)<x.d/2+10);
  if(q){invOpen=false;$('inv').style.display='none';BM.fi=FURN[k]?k:null;bmEnter(q);BM.tool='furn';BM.hv=null;bmToolsUpd();bmGhostUpd();toast('🛋️ Haz clic en una casilla con suelo para colocar: '+k);return}
  toast(TERRENOS.some(x=>x.owned)?'Acércate a tu terreno, pulsa E para construir y elige 🛋️ Muebles':'Necesitas un terreno propio con suelo para colocar muebles');return}
 else if(o.cat==='Ropa'){const it=CLOTH[k];if(!it)toast('Te has puesto: '+k);else{if(worn[it.slot]===k){delete worn[it.slot];toast('Te has quitado: '+k)}else{worn[it.slot]=k;toast('Te has puesto: '+k)}applyOutfit()}}else if(o.cat==='Combustible')useJerry(k);else if(o.cat==='Mascotas')feedPets(k);else if(o.cat==='Ropa de mascota')wearPet(k);else eat(k)
 renderInv()}
function objective(){if(!flags.worked)return['Trabaja un turno: pulsa E junto a un trabajador de un comercio','super'];
 if(!flags.car)return['Compra un coche en el concesionario (C)','dealer'];if(!flags.house)return['Compra una casa en la inmobiliaria (I)','estate'];return['¡Objetivos completados! Explora la ciudad.',null]}

