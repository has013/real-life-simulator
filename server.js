// =================================================================================================
// REAL LIFE SIMULATOR · SERVIDOR DEL MUNDO PÚBLICO · ÍNDICE
// =================================================================================================
// Busca (Ctrl+F) el número de la sección, por ejemplo «8.2».
//
//   1.   CONFIGURACIÓN Y ESTADO GENERAL
//   2.   SERVIDOR HTTP Y WEBSOCKET
//   3.   DORMIR
//   4.   TRANSFERENCIAS ENTRE JUGADORES (dinero, objetos, casas y negocios)
//   5.   GUARDADO EN DISCO
//   6.   GOBIERNO MUNICIPAL (elecciones, alcalde, impuestos, bans)
//   7.   NEGOCIOS DE JUGADORES (registro público y ventas a otros jugadores)
//   8.   CASAS EN TERRENOS (la construcción por módulos la ven todos los jugadores)
//          8.1 Registro de terrenos y construcción
//          8.2 Regalo de terrenos (lo usan las transferencias)
//   9.   BARCOS (un solo piloto por barco; los demás ven cómo navega)
//   10.  PANEL DE ADMINISTRADOR
//   11.  CUENTAS DE USUARIO Y PARTIDAS GUARDADAS
//          11.1 Cuentas: registro, inicio de sesión y sesiones recordadas
//          11.2 Partidas guardadas: un archivo por cuenta en saves/<uid>.json
//   12.  LLAVES DE LAS CASAS
//   13.  CONEXIÓN DE CADA JUGADOR
//          13.1 Entrada al mundo (join)
//          13.2 Chat y mensajes privados
//          13.3 Reparto de mensajes a cada sistema (transferencias, gobierno, negocios, casas, admin, dormir, barcos, partidas, llaves)
//          13.4 Estado del jugador: posición, vehículo, ropa, mascotas y perfil
//          13.5 Desconexión
//   14.  RELOJ Y CLIMA DEL MUNDO
//   15.  ARRANQUE, APAGADO Y ERRORES
// =================================================================================================

// =================================================================================================
// 1. CONFIGURACIÓN Y ESTADO GENERAL
//     Módulos, puerto (PORT), límite de jugadores, lista de jugadores conectados, historial del chat
//     y estado del mundo (hora y clima).
// =================================================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 20;
const players = new Map();
const chatHistory = [];
const SLEEP_PCT = Math.min(100, Math.max(1, Number(process.env.SLEEP_PCT) || 50)); // % de jugadores conectados que deben estar durmiendo para que pase la noche (variable de entorno SLEEP_PCT)
const world = { tod: 9, wx: 0, weatherTimer: 0, nextWeather: 90, freezeTod: false, freezeWx: false }; // freezeTod / freezeWx: los fija el administrador (no se guardan: al reiniciar el servidor vuelven a false)
let nextId = 1;

// =================================================================================================
// 2. SERVIDOR HTTP Y WEBSOCKET
//     Sirve el juego (index.html) y /health; send() y broadcast() envían mensajes a uno o a todos.
// =================================================================================================
const gameFile = path.join(__dirname, 'index.html');
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify({ok:true,players:players.size,maxPlayers:MAX_PLAYERS})); }
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'content-type':'text/html; charset=utf-8', 'cache-control':'no-store'});
    return fs.createReadStream(gameFile).pipe(res);
  }
  res.writeHead(404); res.end('Not found');
});
const wss = new WebSocketServer({ server, maxPayload: 1048576 }); // 1 MB: la partida guardada (sección 11.2) y la construcción de un terreno grande no caben en menos
function send(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function broadcast(data, except) { for (const [ws] of players) if (ws !== except) send(ws, data); }

// =================================================================================================
// 3. DORMIR
//     La noche solo pasa cuando duerme al menos el SLEEP_PCT % de los jugadores conectados.
// =================================================================================================
function hoursToMorning(tod) { const h = (7 - tod + 24) % 24; return h > 12 ? 8 : Math.max(1, h); } // misma regla que el cliente: hasta las 7:00 (o 8 h si es de día)
function sleepCheck() {
  let n = 0; for (const w of players.keys()) if (w.sleeping) n++;
  const total = players.size; if (!n || !total) return;
  const need = Math.ceil(total * SLEEP_PCT / 100);
  if (n < need) return broadcast({ type: 'sleepers', n, total, need }); // todavía no son suficientes: se avisa a todos del recuento
  const h = hoursToMorning(world.tod);
  if (!world.freezeTod) world.tod = (world.tod + h) % 24; // si el administrador congeló la hora, no se salta
  if (h >= 6 && !world.freezeWx) { world.wx = Math.floor(Math.random() * 3); world.weatherTimer = 0; }
  broadcast({ type: 'world', tod: world.tod, wx: world.wx });
  for (const w of players.keys()) if (w.sleeping) { w.sleeping = false; send(w, { type: 'wake', h }); } // cada durmiente recupera su energía
}

// =================================================================================================
// 4. TRANSFERENCIAS ENTRE JUGADORES (dinero, objetos, casas y negocios)
// =================================================================================================
// Flujo: A ofrece -> B acepta -> A confirma que lo tiene y lo descuenta -> B lo recibe.
// El servidor guarda la oferta validada; el cliente no puede cambiarla después.
const transfers = new Map();
let nextTid = 1;
const TRANSFER_RANGE = 15, TRANSFER_TTL = 60000;
const ITEM_CATS = ['Comida','Ropa','Muebles','Combustible','Mascotas','Ropa de mascota'];
const toInt = (v, min, max) => { v = Math.floor(Number(v)); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min; };
const cleanStr = (v, l) => String(v == null ? '' : v).replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, l);
function cleanProp(q, biz) {
  if (!q || typeof q !== 'object') return null;
  const x = Number(q.x), z = Number(q.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const r = { x: Math.round(x), z: Math.round(z) };
  if (biz) {
    r.ty = cleanStr(q.ty, 24); r.lv = toInt(q.lv, 1, 99); r.till = toInt(q.till, 0, 1e9); r.stock = {};
    if (q.stock && typeof q.stock === 'object') Object.entries(q.stock).slice(0, 30).forEach(([k, v]) => { const key = cleanStr(k, 30); if (key) r.stock[key] = toInt(v, 0, 1e6); });
  } else r.apt = !!q.apt;
  return r;
}
function cleanOffer(o) {
  if (!o || typeof o !== 'object') return null;
  const r = { money: toInt(o.money, 0, 1e9), items: [], houses: [], biz: [], plots: [] };
  if (Array.isArray(o.items)) {
    const seen = new Set();
    for (const i of o.items.slice(0, 20)) {
      if (!i || typeof i !== 'object') continue;
      const k = cleanStr(i.k, 40), cat = ITEM_CATS.includes(i.cat) ? i.cat : null, n = toInt(i.n, 0, 999);
      if (!k || !cat || n < 1 || seen.has(k)) continue;
      seen.add(k); r.items.push({ k, cat, n });
    }
  }
  for (const f of ['houses', 'biz']) {
    if (!Array.isArray(o[f])) continue;
    const seen = new Set();
    for (const q of o[f].slice(0, 5)) { const c = cleanProp(q, f === 'biz'); if (!c) continue; const key = c.x + ',' + c.z; if (seen.has(key)) continue; seen.add(key); r[f].push(c); }
  }
  if (Array.isArray(o.plots)) { // terrenos (id 0-63): solo el id; lo construido lo decide el servidor
    const seen = new Set();
    for (const q of o.plots.slice(0, 5)) { const id = plotIdOf(q && typeof q === 'object' ? q.id : q); if (id === null || seen.has(id)) continue; seen.add(id); r.plots.push({ id }); }
  }
  return (r.money || r.items.length || r.houses.length || r.biz.length || r.plots.length) ? r : null;
}
function wsById(id) { id = String(id); for (const [w, pl] of players) if (pl.id === id) return w; return null; }
function xferBusy(ws) { for (const t of transfers.values()) if (t.from === ws || t.to === ws) return t; return null; }
function endTransfer(t, toFrom, toTo) {
  clearTimeout(t.timer); transfers.delete(t.tid);
  if (toFrom) send(t.from, toFrom);
  if (toTo) send(t.to, toTo);
}
function handleTransfer(ws, p, msg) {
  if (msg.type === 'transfer') {
    const target = wsById(msg.to), tp = target && players.get(target), offer = cleanOffer(msg.offer);
    const err = reason => send(ws, { type: 'transfer_error', reason });
    if (!tp || target === ws || target.readyState !== WebSocket.OPEN) return err('Ese jugador ya no está conectado');
    if (!offer) return err('La oferta está vacía o no es válida');
    if (xferBusy(ws)) return err('Ya tienes una transferencia en curso');
    if (xferBusy(target)) return err(tp.name + ' está atendiendo otra oferta');
    if (Math.hypot(p.x - tp.x, p.z - tp.z) > TRANSFER_RANGE) return err('Estás demasiado lejos de ' + tp.name);
    const pe = plotGiftError(offer, p, tp); if (pe) return err(pe);
    offer.plots = offer.plots.map(q => ({ id: q.id, built: !!(plots[q.id] && plots[q.id].b) })); // el cartel de la oferta indica si el terreno tiene construcción
    const tid = String(nextTid++);
    const t = { tid, from: ws, to: target, offer, stage: 'offered', toGone: false, timer: null };
    t.timer = setTimeout(() => endTransfer(t, { type: 'transfer_result', tid, ok: false, reason: 'La oferta a ' + tp.name + ' ha caducado' }, { type: 'transfer_cancel', tid, reason: 'La oferta ha caducado' }), TRANSFER_TTL);
    transfers.set(tid, t);
    send(ws, { type: 'transfer_wait', tid, toName: tp.name, offer });
    send(target, { type: 'transfer_offer', tid, from: { id: p.id, name: p.name }, offer });
    return;
  }
  const t = transfers.get(String(msg.tid));
  if (!t) return;
  if (msg.type === 'transfer_reply' && t.to === ws && t.stage === 'offered') {
    if (!msg.accept) {
      const why = cleanStr(msg.reason, 100);
      return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: false, reason: why ? p.name + ' no puede aceptarla: ' + why : p.name + ' ha rechazado la oferta' }, null);
    }
    const pf = players.get(t.from), pe = pf && plotGiftError(t.offer, pf, p);
    if (pe) return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: false, reason: pe }, { type: 'transfer_cancel', tid: t.tid, reason: pe });
    for (const q of t.offer.plots || []) if (plots[q.id]) plots[q.id].xfAt = Date.now(); // mientras el emisor confirma, ni un house_own suyo puede soltar el terreno
    t.stage = 'commit';
    send(t.from, { type: 'transfer_commit', tid: t.tid, offer: t.offer });
    return;
  }
  if (msg.type === 'transfer_commit_ack' && t.from === ws && t.stage === 'commit') {
    if (!msg.ok) return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: false, reason: 'Ya no tenías todo lo que ofrecías' }, { type: 'transfer_cancel', tid: t.tid, reason: p.name + ' ya no tenía lo ofrecido' });
    const rp = players.get(t.to);
    if (t.toGone || !rp || t.to.readyState !== WebSocket.OPEN) { const back = plotBuilds(t.offer, p.uid, msg.bs); return endTransfer(t, { type: 'transfer_refund', tid: t.tid, offer: back.length ? Object.assign({}, t.offer, { plots: back }) : t.offer }, null); }
    bizTransfer(t.offer, p.uid, rp);
    const given = plotTransfer(t.offer, p.uid, rp, msg.bs); // terrenos con la construcción que el servidor tiene validada
    return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: true, toName: rp.name }, { type: 'transfer_deliver', tid: t.tid, from: { id: p.id, name: p.name }, offer: given ? Object.assign({}, t.offer, { plots: given }) : t.offer });
  }
}
function dropTransfersOf(ws) {
  for (const t of [...transfers.values()]) {
    if (t.from !== ws && t.to !== ws) continue;
    if (t.to === ws) {
      // El receptor se fue. Si el emisor ya descontó (fase commit), se espera su confirmación para devolverle lo suyo.
      if (t.stage === 'commit') { t.toGone = true; continue; }
      endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: false, reason: 'El jugador se ha desconectado' }, null);
    } else {
      endTransfer(t, null, { type: 'transfer_cancel', tid: t.tid, reason: 'El otro jugador se ha desconectado' });
    }
  }
}

// =================================================================================================
// 5. GUARDADO EN DISCO
//     Cómo se guardan los datos (accounts.json, saves/, keys.json, gov.json, biz.json, houses.json y players.json) sin que se estropeen.
// =================================================================================================
// Escritura atómica (archivo temporal + renombrar) y copia .bak: si el proceso se corta a mitad de guardar, el archivo nunca queda roto.
// Lectura con respaldo: si el archivo principal no se puede leer, se usa la copia .bak (y se avisa en la consola).
// Si no existe ni el archivo ni el .bak (p. ej. un hosting recién desplegado), se arranca con los datos vacíos sin avisar.
function writeJsonAtomic(file, data) {
  const json = JSON.stringify(data), tmp = file + '.tmp';
  try { fs.writeFileSync(tmp, json); if (fs.existsSync(file)) { try { fs.copyFileSync(file, file + '.bak'); } catch {} } fs.renameSync(tmp, file); }
  catch (e) { fs.writeFileSync(file, json); } // si renombrar falla, se escribe directamente
}
function readJsonSafe(file, label) {
  for (const f of [file, file + '.bak']) {
    let raw; try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') console.warn('[' + label + '] no se pudo leer ' + f + ': ' + e.message); continue; }
    try { const o = JSON.parse(raw); if (o && typeof o === 'object') { if (f !== file) console.warn('[' + label + '] ' + file + ' estaba dañado: restaurado desde la copia ' + f); return o; } }
    catch (e) { console.warn('[' + label + '] ' + f + ' está dañado (' + e.message + ')'); }
  }
  return null;
}

// =================================================================================================
// 6. GOBIERNO MUNICIPAL (elecciones, alcalde, impuestos, bans)
// =================================================================================================
// Todo vive en el servidor. La identidad de voto es el uid de la cuenta del jugador (sección 11; nunca se reenvía a otros jugadores).
const DAY_MS = Number(process.env.GOV_DAY_MS || 12 * 60 * 1000);         // «día de alcaldía» = 1 día de juego (12 min reales)
const ELECTION_DAYS = Number(process.env.ELECTION_DAYS || 10);
const ELECTION_MS = Number(process.env.ELECTION_MS || ELECTION_DAYS * DAY_MS); // la votación dura 10 días de juego (10 × 12 min = 2 h reales)
// Mandato del alcalde: 3 días REALES (72 h). Se puede cambiar con MANDATE_MS (milisegundos) o, como antes, con MANDATE_DAYS (días de juego de GOV_DAY_MS).
const MANDATE_MS = process.env.MANDATE_MS ? Number(process.env.MANDATE_MS) : process.env.MANDATE_DAYS ? Number(process.env.MANDATE_DAYS) * DAY_MS : 3 * 24 * 3600 * 1000;
const GOV_FILE = process.env.GOV_FILE || path.join(__dirname, 'gov.json');
let gov = { mayor: null, taxes: [], treasury: 0, election: null, nextTid: 1, lastDay: 0, lastDecree: 0 };
{ const g = readJsonSafe(GOV_FILE, 'gov'); if (g) gov = Object.assign(gov, g); }
console.log(gov.election ? '[elecciones] votación en curso restaurada: ' + gov.election.candidates.map(c => c.name).join(' vs ') + ' · ' + Object.keys(gov.election.votes || {}).length + ' votos · termina ' + new Date(gov.election.endsAt).toLocaleString() : gov.mayor ? '[elecciones] alcalde actual: ' + gov.mayor.name : '[elecciones] sin alcalde ni votación abierta');
function saveGov() { try { writeJsonAtomic(GOV_FILE, gov); } catch (e) { console.warn('No se pudo guardar gov.json', e.message); } }
const isMayor = p => !!(gov.mayor && p && p.uid === gov.mayor.uid);
function pub(p) { // versión pública del jugador: sin uid y con rango 9 si es el Alcalde
  const o = Object.assign({}, p); delete o.uid; delete o.vit; // vit (hambre/energía) solo lo ve el administrador
  if (isMayor(p)) o.profile = Object.assign({}, p.profile, { rk: 9 });
  return o;
}
const govDay = () => gov.mayor ? Math.floor((Date.now() - gov.mayor.since) / DAY_MS) + 1 : 0;
const govCap = () => gov.mayor ? Math.min(2, Math.round((0.5 + 0.1 * (govDay() - 1)) * 10) / 10) : 0; // día 1: 0,5% · +0,1%/día · tope 2,0%
const govRate = () => Math.round(gov.taxes.reduce((s, t) => s + t.pct, 0) * 10) / 10;
function govMsg(ws) {
  const p = players.get(ws), e = gov.election, mine = p && e ? e.candidates.find(c => c.uid === p.uid) : null;
  return {
    type: 'gov', now: Date.now(),
    mayor: gov.mayor ? { name: gov.mayor.name, since: gov.mayor.since, end: gov.mayor.since + MANDATE_MS } : null,
    taxes: gov.taxes.map(t => ({ id: t.id, reason: t.reason, pct: t.pct })), rate: govRate(), cap: govCap(), day: govDay(),
    election: e ? { endsAt: e.endsAt, candidates: e.candidates.map(c => ({ cid: c.cid, name: c.name, program: c.program })) } : null,
    me: { mayor: isMayor(p), voted: e && p ? (e.votes[p.uid] || null) : null, cid: mine ? mine.cid : null, treasury: isMayor(p) ? Math.round(gov.treasury) : 0 }
  };
}
function broadcastGov() { for (const ws of players.keys()) send(ws, govMsg(ws)); }
function sysChat(text, tag, name) {
  const message = { name: name || '📢 Ayuntamiento', text: String(text).slice(0, 180), time: Date.now(), sys: !tag, tag: tag || undefined };
  chatHistory.push(message); if (chatHistory.length > 40) chatHistory.shift();
  for (const c of players.keys()) send(c, { type: 'chat', message });
}
function banner(text, from) { for (const c of players.keys()) send(c, { type: 'decree', text: String(text).slice(0, 200), from: from || 'Ayuntamiento' }); }
function candidatesNow() { const m = new Map(); for (const p of players.values()) if (p.profile && p.profile.rk === 8 && !m.has(p.uid)) m.set(p.uid, p); return [...m.values()]; }
function openElection(cs) {
  gov.election = { endsAt: Date.now() + ELECTION_MS, candidates: cs.map((p, i) => ({ cid: String(i + 1), uid: p.uid, name: p.name, program: '' })), votes: {} };
  saveGov();
  console.log('[elecciones] abiertas: ' + cs.map(p => p.name).join(' vs ') + ' · duran hasta ' + new Date(gov.election.endsAt).toLocaleString() + ' (solo terminan por tiempo, nunca por desconexiones)');
  sysChat('🗳️ ¡Elecciones a la Alcaldía abiertas! Candidatos: ' + cs.map(p => p.name).join(', ') + '. Pulsa V para votar.');
  banner('🗳️ Elecciones a la Alcaldía abiertas · Pulsa V para votar', 'Elecciones');
  broadcastGov();
}
function closeElection() {
  const e = gov.election; if (!e) return;
  const tally = {}; e.candidates.forEach(c => tally[c.cid] = 0);
  let total = 0; for (const u in e.votes) if (tally[e.votes[u]] !== undefined) { tally[e.votes[u]]++; total++; }
  const max = Math.max(...Object.values(tally)), top = e.candidates.filter(c => tally[c.cid] === max);
  const w = top[Math.floor(Math.random() * top.length)], pct = total ? Math.round(max / total * 1000) / 10 : 0;
  gov.mayor = { uid: w.uid, name: w.name, since: Date.now() }; gov.taxes = []; gov.treasury = 0; gov.election = null; gov.lastDay = 1; gov.lastDecree = 0;
  saveGov(); console.log('[elecciones] cerradas por fin de plazo: gana ' + w.name + ' (' + total + ' votos)');
  const res = total ? pct + '% de los votos (' + max + ' de ' + total + ')' + (top.length > 1 ? ', desempate al azar' : '') : 'sorteo, nadie votó';
  sysChat('👑 ¡' + w.name + ' es el nuevo Alcalde con ' + res + '!');
  banner('👑 Nuevo Alcalde: ' + w.name + (total ? ' (' + pct + '%)' : ''), 'Elecciones');
  broadcastGov();
}
let govTicks = 0;
function govTick() {
  const now = Date.now();
  if (++govTicks % 30 === 0) saveGov();
  if (gov.election && now >= gov.election.endsAt) return closeElection();
  if (gov.mayor && now >= gov.mayor.since + MANDATE_MS) {
    const nm = gov.mayor.name; gov.mayor = null; gov.taxes = []; saveGov();
    sysChat('🏛️ Termina el mandato de ' + nm + '. Alcaldía vacante: impuestos al 0%.'); broadcastGov(); return;
  }
  if (gov.mayor) { const d = govDay(); if (d !== gov.lastDay) { gov.lastDay = d; broadcastGov(); } }
  if (!gov.mayor && !gov.election) { const cs = candidatesNow(); if (cs.length >= 2) openElection(cs); }
}
const govTimer = setInterval(govTick, 1000);
function handleGov(ws, p, msg) {
  const err = reason => send(ws, { type: 'gov_error', reason }), e = gov.election;
  if (msg.type === 'election_vote') {
    if (!e) return err('No hay elecciones abiertas');
    if (e.votes[p.uid]) return err('Ya has votado: el voto es inalterable');
    const c = e.candidates.find(c => c.cid === String(msg.cid)); if (!c) return err('Candidato no válido');
    e.votes[p.uid] = c.cid; saveGov();
    for (const [w, q] of players) if (q.uid === p.uid) send(w, govMsg(w));
    return send(ws, { type: 'gov_ok', text: '✅ Voto registrado para ' + c.name });
  }
  if (msg.type === 'election_program') {
    if (!e) return err('No hay elecciones abiertas');
    const c = e.candidates.find(c => c.uid === p.uid); if (!c) return err('No eres candidato');
    c.program = cleanStr(msg.text, 200); saveGov(); broadcastGov();
    return send(ws, { type: 'gov_ok', text: '✅ Programa electoral guardado' });
  }
  if (msg.type === 'tax_paid') { if (gov.mayor) gov.treasury += toInt(msg.amount, 0, 1e6); return; }
  if (!isMayor(p)) return err('Solo el Alcalde puede hacer eso');
  if (msg.type === 'tax_set') {
    const reason = cleanStr(msg.reason, 100); if (reason.length < 3) return err('Debes indicar el motivo del impuesto');
    const pct = Math.round(Number(msg.pct) * 10) / 10; if (!(pct >= 0.1)) return err('El porcentaje mínimo es 0,1%');
    let t = msg.id ? gov.taxes.find(x => x.id === String(msg.id)) : null;
    if (!t && gov.taxes.length >= 5) return err('Máximo 5 impuestos a la vez');
    const others = gov.taxes.filter(x => x !== t).reduce((s, x) => s + x.pct, 0), cap = govCap();
    if (Math.round((others + pct) * 10) / 10 > cap) return err('Superas el límite: hoy el máximo total es ' + cap + '% (otros impuestos: ' + Math.round(others * 10) / 10 + '%)');
    const isNew = !t;
    if (t) { t.reason = reason; t.pct = pct; } else { t = { id: String(gov.nextTid++), reason, pct }; gov.taxes.push(t); }
    saveGov();
    const txt = (isNew ? 'Nuevo impuesto ' : 'Impuesto modificado ') + pct + '% · ' + reason + ' · Total: ' + govRate() + '%';
    banner('📜 ' + txt, 'Ban municipal'); sysChat('📜 ' + txt); broadcastGov(); return;
  }
  if (msg.type === 'tax_del') {
    const i = gov.taxes.findIndex(x => x.id === String(msg.id)); if (i < 0) return;
    const [t] = gov.taxes.splice(i, 1); saveGov();
    const txt = 'Impuesto eliminado: ' + t.reason + ' · Total: ' + govRate() + '%';
    banner('📜 ' + txt, 'Ban municipal'); sysChat('📜 ' + txt); broadcastGov(); return;
  }
  if (msg.type === 'decree') {
    const text = cleanStr(msg.text, 170); if (text.length < 3) return err('Escribe el mensaje del ban');
    if (Date.now() - gov.lastDecree < 20000) return err('Espera unos segundos entre bans');
    gov.lastDecree = Date.now();
    banner('📜 ' + text, 'Alcalde ' + gov.mayor.name); sysChat('📜 ' + text, 'ALCALDE', gov.mayor.name);
    return send(ws, { type: 'gov_ok', text: '📜 Ban publicado' });
  }
}

// =================================================================================================
// 7. NEGOCIOS DE JUGADORES (registro público y ventas a otros jugadores)
// =================================================================================================
// El dueño publica su negocio (tipo, nivel, productos, precios y stock). Los demás lo ven y le compran.
// Las ventas se descuentan del stock del registro y se acreditan en la caja del dueño (en vivo o, si está desconectado, quedan pendientes hasta que vuelva).
const BIZ_FILE = process.env.BIZ_FILE || path.join(__dirname, 'biz.json');
const BIZ_TYPES = ['super', 'bar', 'ropa', 'muebles', 'pan'], BIZ_RANGE = 45;
let bizReg = {}, bizPending = {}, bizDirty = false;
// claims: dueño de cada LOCAL comprado (clave 'x,z'), aunque todavía no tenga negocio montado. Es la fuente de verdad: quien lo reserva primero se lo queda, esté conectado o no.
let claims = {};
{ const b = readJsonSafe(BIZ_FILE, 'biz'); if (b) { bizReg = b.reg || {}; bizPending = b.pending || {}; claims = b.claims || {}; } }
for (const [k, e] of Object.entries(bizReg)) if (!claims[k]) { const [x, z] = k.split(',').map(Number); claims[k] = { uid: e.uid, name: e.name, x, z }; } // migración: negocios ya registrados
function saveBiz() { try { writeJsonAtomic(BIZ_FILE, { reg: bizReg, pending: bizPending, claims }); bizDirty = false; } catch (e) { console.warn('No se pudo guardar biz.json', e.message); } }
const bizTimer = setInterval(() => { if (bizDirty) saveBiz(); }, 5000);
const bizKeyOf = (x, z) => Math.round(x) + ',' + Math.round(z);
const uidOnline = uid => { for (const q of players.values()) if (q.uid === uid) return true; return false; };
const ownsBiz = uid => Object.values(claims).some(c => c.uid === uid) || Object.values(bizReg).some(e => e.uid === uid);
function bizMsg(ws) {
  const p = players.get(ws);
  const list = Object.values(bizReg).map(e => ({ x: e.x, z: e.z, ty: e.ty, lv: e.lv, owner: e.name, own: !!p && e.uid === p.uid, on: uidOnline(e.uid), items: e.items }));
  const taken = new Set(Object.keys(bizReg));
  for (const [k, c] of Object.entries(claims)) if (!taken.has(k)) list.push({ x: c.x, z: c.z, ty: null, lv: 0, owner: c.name, own: !!p && c.uid === p.uid, on: uidOnline(c.uid), items: [], occ: true }); // local ocupado, aún sin negocio
  return { type: 'biz', list };
}
function broadcastBiz() { for (const ws of players.keys()) send(ws, bizMsg(ws)); }
function cleanBizEntry(q) {
  if (!q || typeof q !== 'object') return null;
  const x = Number(q.x), z = Number(q.z);
  if (!Number.isFinite(x) || !Number.isFinite(z) || !BIZ_TYPES.includes(q.ty)) return null;
  const items = Array.isArray(q.items) ? q.items.slice(0, 8).map(i => i && typeof i === 'object' ? { k: cleanStr(i.k, 30), p: toInt(i.p, 1, 100000), n: toInt(i.n, 0, 9999), e: cleanStr(i.e, 8) } : null).filter(i => i && i.k) : [];
  return { x: Math.max(-1000, Math.min(2000, x)), z: Math.max(-1000, Math.min(2000, z)), ty: q.ty, lv: toInt(q.lv, 1, 5), till: toInt(q.till, 0, 1e9), items };
}
function bizTransfer(offer, fromUid, toP) { // al traspasar un negocio por transferencia, el registro cambia de dueño
  let ch = false;
  for (const q of (offer && offer.biz) || []) { const k = bizKeyOf(q.x, q.z), e = bizReg[k], c = claims[k]; if (e && e.uid === fromUid) { e.uid = toP.uid; e.name = toP.name; ch = true; } if (c && c.uid === fromUid) { c.uid = toP.uid; c.name = toP.name; ch = true; } }
  if (ch) { bizDirty = true; broadcastBiz(); }
}
function handleBiz(ws, p, msg) {
  const err = reason => send(ws, { type: 'biz_error', reason });
  if (msg.type === 'biz_claim') { // reservar un local ANTES de pagarlo: el primero en llegar se lo queda
    const x = Math.round(Number(msg.x)), z = Math.round(Number(msg.z));
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 2000 || Math.abs(z) > 2000) return;
    const k = bizKeyOf(x, z), cur = claims[k];
    if (cur && cur.uid !== p.uid) return send(ws, { type: 'biz_claim_deny', x, z, owner: cur.name, on: uidOnline(cur.uid) });
    if (!cur && (Object.keys(claims).length >= 500 || Object.values(claims).filter(c => c.uid === p.uid).length >= 20)) return send(ws, { type: 'biz_error', reason: 'No puedes tener más locales' });
    claims[k] = { uid: p.uid, name: p.name, x, z }; bizDirty = true;
    send(ws, { type: 'biz_claim_ok', x, z }); broadcastBiz(); return;
  }
  if (msg.type === 'biz_release') { // el cliente no pudo completar la compra: libero la reserva (solo si no hay negocio montado)
    const k = bizKeyOf(Number(msg.x), Number(msg.z)), c = claims[k];
    if (c && c.uid === p.uid && !bizReg[k]) { delete claims[k]; bizDirty = true; broadcastBiz(); }
    return;
  }
  if (msg.type === 'biz_sync') {
    const now = Date.now(); if (now - (p.lastBiz || 0) < 1500) return; p.lastBiz = now;
    const list = Array.isArray(msg.list) ? msg.list.slice(0, 8).map(cleanBizEntry).filter(Boolean) : [];
    const ownedIn = Array.isArray(msg.owned) ? msg.owned.slice(0, 20).map(q => q && typeof q === 'object' ? { x: Math.round(Number(q.x)), z: Math.round(Number(q.z)) } : null).filter(q => q && Number.isFinite(q.x) && Number.isFinite(q.z)) : null;
    const ownedKeys = new Set((ownedIn || []).map(q => bizKeyOf(q.x, q.z)));
    for (const q of list) ownedKeys.add(bizKeyOf(q.x, q.z));
    const mineC = () => JSON.stringify(Object.values(claims).filter(c => c.uid === p.uid)), beforeC = mineC();
    const noTill = e => Object.assign({}, e, { till: 0 }), before = JSON.stringify(Object.values(bizReg).filter(e => e.uid === p.uid).map(noTill)), keep = new Set(), lost = new Set();
    for (const k of ownedKeys) { // ¿el servidor lo tiene a nombre de otro? Entonces ese jugador es el dueño registrado
      const c = claims[k], [x, z] = k.split(',').map(Number);
      if (c && c.uid !== p.uid) { lost.add(k); send(ws, { type: 'biz_conflict', x, z, owner: c.name }); }
      else claims[k] = { uid: p.uid, name: p.name, x, z };
    }
    if (ownedIn) for (const k of Object.keys(claims)) if (claims[k].uid === p.uid && !ownedKeys.has(k)) delete claims[k]; // ya no es suyo
    for (const q of list) {
      const key = bizKeyOf(q.x, q.z), cur = bizReg[key];
      if (lost.has(key) || (cur && cur.uid !== p.uid)) continue; // ese local ya tiene otro dueño registrado
      bizReg[key] = Object.assign({ uid: p.uid, name: p.name }, q); keep.add(key);
    }
    for (const k of Object.keys(bizReg)) if (bizReg[k].uid === p.uid && !keep.has(k)) delete bizReg[k];
    if (JSON.stringify(Object.values(bizReg).filter(e => e.uid === p.uid).map(noTill)) !== before || mineC() !== beforeC) { bizDirty = true; broadcastBiz(); }
    else if (lost.size) send(ws, bizMsg(ws));
    return;
  }
  if (msg.type === 'biz_ack') { const n = toInt(msg.n, 0, 100); if (bizPending[p.uid]) { bizPending[p.uid] = bizPending[p.uid].slice(n); if (!bizPending[p.uid].length) delete bizPending[p.uid]; bizDirty = true; } return; }
  if (msg.type === 'biz_buy') {
    const bk = bizKeyOf(Number(msg.x), Number(msg.z)), e = bizReg[bk]; if (!e) return err(claims[bk] ? 'Ese local es de ' + claims[bk].name + ' y todavía no tiene negocio abierto' : 'Ese negocio ya no existe');
    if (e.uid === p.uid) return err('Es tu propio negocio');
    if (Math.hypot(p.x - e.x, p.z - e.z) > BIZ_RANGE) return err('Estás demasiado lejos del local');
    const n = toInt(msg.n, 1, 20), it = e.items.find(i => i.k === cleanStr(msg.k, 30));
    if (!it) return err('Ese producto no existe'); if (it.n < n) return err('No queda stock suficiente de ' + it.k);
    const total = it.p * n; it.n -= n;
    const sale = { x: e.x, z: e.z, k: it.k, n, total, buyer: p.name };
    let delivered = false;
    for (const [w, q] of players) if (q.uid === e.uid) { send(w, Object.assign({ type: 'biz_sold' }, sale)); delivered = true; }
    if (!delivered) { (bizPending[e.uid] = bizPending[e.uid] || []).push(sale); if (bizPending[e.uid].length > 300) bizPending[e.uid].shift(); }
    bizDirty = true;
    send(ws, { type: 'biz_bought', ty: e.ty, k: it.k, n, total, owner: e.name });
    broadcastBiz();
  }
}

// =================================================================================================
// 8. CASAS EN TERRENOS (la construcción por módulos la ven todos los jugadores)
// =================================================================================================
// ---------- 8.1 Registro de terrenos y construcción ----------
// Cada terreno (id 0-63) tiene un dueño registrado en el servidor: el primero que lo reserva se lo queda, esté conectado o no.
// El dueño envía su construcción (house_set); el servidor la valida, la guarda en houses.json y la reenvía a los demás, que la dibujan.
// La construcción del propio jugador sigue siendo la de su partida guardada: al dueño nunca se le reenvía su casa.
const HOUSES_FILE = process.env.HOUSES_FILE || path.join(__dirname, 'houses.json');
let plots = {}, plotsDirty = false; // id -> { uid, name, b }
{ const h = readJsonSafe(HOUSES_FILE, 'houses'); if (h && h.plots && typeof h.plots === 'object') plots = h.plots; }
function saveHouses() { try { writeJsonAtomic(HOUSES_FILE, { plots }); plotsDirty = false; } catch (e) { console.warn('No se pudo guardar houses.json', e.message); } }
const housesTimer = setInterval(() => { if (plotsDirty) saveHouses(); }, 8000);
const CELL_RE = /^\d{1,2},\d{1,2}$/, EDGE_RE = /^[hv],\d{1,2},\d{1,2}$/, MAX_BUILD_JSON = 60000;
function cleanBuild(b) { // solo se guarda lo que el cliente sabe dibujar: celdas, aristas (paredes, puertas, garaje...), escaleras, tipos de techo y suelo exterior
  if (!b || typeof b !== 'object') return null;
  const cells = a => Array.isArray(a) ? [...new Set(a.slice(0, 600).filter(k => typeof k === 'string' && CELL_RE.test(k)))] : [];
  const pairs = (a, re, lo, hi, n) => Array.isArray(a) ? a.slice(0, n).filter(q => Array.isArray(q) && typeof q[0] === 'string' && re.test(q[0]) && Number.isInteger(q[1]) && q[1] >= lo && q[1] <= hi).map(q => [q[0], q[1]]) : [];
  const o = { f: cells(b.f), r: cells(b.r), e: pairs(b.e, EDGE_RE, 1, 6, 800) };
  const r2 = cells(b.r2); if (r2.length) o.r2 = r2;
  const e2 = pairs(b.e2, EDGE_RE, 1, 4, 800); if (e2.length) o.e2 = e2;
  const s = pairs(b.s, CELL_RE, 0, 3, 100); if (s.length) o.s = s;
  const rt = pairs(b.rt, CELL_RE, 1, 2, 600); if (rt.length) o.rt = rt;
  const ob = pairs(b.o, CELL_RE, 0, 2, 600); if (ob.length) o.o = ob;
  return (o.f.length || o.r.length || o.e.length || o.r2 || o.e2 || o.s || o.o) ? o : null;
}
const plotIdOf = v => { const n = Number(v); return Number.isInteger(n) && n >= 0 && n < 64 ? n : null; };
const plotMsg = (id, e) => ({ type: 'house', id: Number(id), owner: e.name, b: e.b || null });
function broadcastPlot(id, exceptUid) { const e = plots[id]; for (const [w, q] of players) if (q.uid !== exceptUid) send(w, e ? plotMsg(id, e) : { type: 'house_free', id: Number(id) }); }
function sendHouses(ws, p) { // al entrar: todos los terrenos con dueño (los míos solo marcados como míos) y una señal de fin
  for (const [id, e] of Object.entries(plots)) send(ws, e.uid === p.uid ? { type: 'house', id: Number(id), own: true, owner: e.name } : plotMsg(id, e));
  send(ws, { type: 'houses_ready' });
}
function handleHouses(ws, p, msg) {
  if (msg.type === 'house_claim') { // reservar el terreno ANTES de pagarlo: el primero en llegar se lo queda
    const id = plotIdOf(msg.id); if (id === null) return;
    const cur = plots[id];
    if (cur && cur.uid !== p.uid) return send(ws, { type: 'house_claim_deny', id, owner: cur.name });
    if (!cur) {
      if (Object.values(plots).filter(e => e.uid === p.uid).length >= 40) return send(ws, { type: 'house_claim_deny', id, owner: 'otro jugador (límite de terrenos)' });
      plots[id] = { uid: p.uid, name: p.name, b: null }; plotsDirty = true; broadcastPlot(id, p.uid);
    }
    return send(ws, { type: 'house_claim_ok', id });
  }
  if (msg.type === 'house_release') { // el cliente no pudo completar la compra: libero la reserva (solo si aún no hay construcción)
    const id = plotIdOf(msg.id), cur = id !== null && plots[id];
    if (cur && cur.uid === p.uid && !cur.b) { delete plots[id]; plotsDirty = true; broadcastPlot(id, p.uid); }
    return;
  }
  if (msg.type === 'house_own') { // lista COMPLETA de terrenos que el jugador tiene en su partida: reserva los que faltan, avisa si alguno ya era de otro y suelta los que ya no son suyos
    if (!Array.isArray(msg.ids)) return;
    const ids = [...new Set(msg.ids.slice(0, 64).map(plotIdOf).filter(v => v !== null))]; let ch = false;
    for (const id of ids) {
      const c = plots[id];
      if (c && c.uid !== p.uid) { send(ws, { type: 'house_conflict', id, owner: c.name }); send(ws, plotMsg(id, c)); continue; }
      if (!c) { plots[id] = { uid: p.uid, name: p.name, b: null }; ch = true; broadcastPlot(id, p.uid); }
      else if (c.name !== p.name) { c.name = p.name; ch = true; broadcastPlot(id, p.uid); }
    }
    for (const k of Object.keys(plots)) if (plots[k].uid === p.uid && !ids.includes(Number(k)) && Date.now() - (plots[k].xfAt || 0) > PLOT_GRACE_MS) { delete plots[k]; ch = true; broadcastPlot(k, p.uid); } // un terreno recién regalado se respeta unos segundos hasta que el receptor lo confirme
    if (ch) plotsDirty = true;
    return;
  }
  if (msg.type === 'house_set') { // el dueño publica su construcción
    const now = Date.now(); if (now - (p.lastHouse || 0) < 250) return; p.lastHouse = now;
    const id = plotIdOf(msg.id), c = id !== null && plots[id]; if (!c || c.uid !== p.uid) return;
    if (msg.b != null && JSON.stringify(msg.b).length > MAX_BUILD_JSON) return;
    const b = cleanBuild(msg.b);
    if (JSON.stringify(b) === JSON.stringify(c.b)) return;
    c.b = b; plotsDirty = true; broadcastPlot(id, p.uid);
  }
}

// ---------- 8.2 Regalo de terrenos (lo usan las transferencias) ----------
// Regalo de terrenos: comprobaciones y cambio de dueño en el registro (houses.json). Se llama desde las transferencias.
const PLOT_LIMIT = 40, PLOT_GRACE_MS = 15000;
function plotGiftError(offer, from, to) {
  const list = (offer && offer.plots) || []; if (!list.length) return '';
  for (const q of list) { const c = plots[q.id]; if (!c || c.uid !== from.uid) return 'El terreno nº ' + q.id + ' no está a tu nombre en el servidor (espera un momento y vuelve a intentarlo)'; }
  const have = Object.values(plots).filter(e => e.uid === to.uid).length;
  if (have + list.length > PLOT_LIMIT) return to.name + ' ya tiene demasiados terrenos (máximo ' + PLOT_LIMIT + ')';
  return '';
}
function plotBuilds(offer, fromUid, bs) { // construcción de cada terreno ofrecido: la que manda el emisor al confirmar (validada) o, si falta o es demasiado grande, la que ya tenía el servidor
  const out = [];
  for (const q of (offer && offer.plots) || []) {
    const c = plots[q.id]; if (!c || c.uid !== fromUid) continue;
    let b = c.b || null;
    if (bs && typeof bs === 'object' && Object.prototype.hasOwnProperty.call(bs, String(q.id))) {
      const raw = bs[String(q.id)];
      if (raw === null) b = null;
      else if (raw && typeof raw === 'object' && JSON.stringify(raw).length <= MAX_BUILD_JSON) b = cleanBuild(raw);
    }
    out.push({ id: q.id, b });
  }
  return out;
}
function plotTransfer(offer, fromUid, toP, bs) { // cambia el dueño en el registro y devuelve la lista entregada, con su construcción
  const list = plotBuilds(offer, fromUid, bs); if (!list.length) return null;
  for (const q of list) {
    const c = plots[q.id];
    c.b = q.b; c.uid = toP.uid; c.name = toP.name; c.xfAt = Date.now();
    broadcastPlot(q.id, toP.uid); // todos (incluido el que regala) ven el terreno como del nuevo dueño; el receptor lo recibe en la entrega
  }
  plotsDirty = true;
  return list;
}

// =================================================================================================
// 9. BARCOS (un solo piloto por barco; los demás ven cómo navega)
// =================================================================================================
// El identificador de un barco es su nombre (único en el cliente). El servidor decide quién lo pilota y recuerda dónde se quedó al bajar el piloto.
// Mientras alguien lo pilota, su posición viaja en el 'state' del piloto (vType 'boat' + vId); el servidor la copia al registro.
const boats = new Map(); // id -> { id, x, z, h, has, pilot }
const MAX_BOATS = 64;
function boatOf(id) {
  id = cleanStr(id, 30); if (!id) return null;
  let b = boats.get(id);
  if (!b) { if (boats.size >= MAX_BOATS) return null; b = { id, x: 0, z: 0, h: 0, has: false, pilot: null }; boats.set(id, b); }
  return b;
}
function boatsMsg() {
  return { type: 'boats', list: [...boats.values()].map(b => { const o = { id: b.id, pilot: b.pilot }; if (b.has) { o.x = Math.round(b.x * 100) / 100; o.z = Math.round(b.z * 100) / 100; o.h = Math.round(b.h * 1000) / 1000; } return o; }) };
}
function broadcastBoats() { broadcast(boatsMsg()); }
function releaseBoat(p) { // el jugador deja de pilotar; el barco se queda en la última posición recibida
  if (!p.boatId) return false;
  const b = boats.get(p.boatId); p.boatId = null; p.vId = null;
  if (!b || b.pilot !== p.id) return false;
  b.pilot = null; return true;
}
function handleBoat(ws, p, msg) {
  if (msg.type === 'boat_board') {
    const b = boatOf(msg.id), deny = reason => send(ws, { type: 'boat_deny', id: cleanStr(msg.id, 30), reason });
    if (!b) return deny('Ese barco no está disponible');
    if (b.pilot && b.pilot !== p.id) { const o = [...players.values()].find(q => q.id === b.pilot); return deny('Ya lo está pilotando ' + (o ? o.name : 'otro jugador')); }
    if (b.has && Math.hypot(p.x - b.x, p.z - b.z) > 30) return deny('Estás demasiado lejos del barco');
    if (p.boatId && p.boatId !== b.id) releaseBoat(p);
    b.pilot = p.id; p.boatId = b.id;
    send(ws, { type: 'boat_ok', id: b.id }); broadcastBoats(); return;
  }
  if (msg.type === 'boat_leave') {
    const b = boats.get(cleanStr(msg.id, 30)); if (!b || b.pilot !== p.id) return;
    const x = Number(msg.x), z = Number(msg.z), h = Number(msg.h);
    if (Number.isFinite(x) && Number.isFinite(z) && Number.isFinite(h) && (!b.has || Math.hypot(x - b.x, z - b.z) < 40)) {
      b.x = Math.max(-1000, Math.min(2000, x)); b.z = Math.max(-1000, Math.min(2000, z)); b.h = Math.max(-100, Math.min(100, h)); b.has = true;
    }
    b.pilot = null; p.boatId = null; p.vId = null; broadcastBoats();
  }
}

// =================================================================================================
// 10. PANEL DE ADMINISTRADOR
// =================================================================================================
// Se activa escribiendo en el chat el comando secreto (variable de entorno ADMIN_CMD; por defecto /serunarata). El comando NO está en el HTML: solo vive aquí.
// Quien lo escribe queda como administrador SOLO en esa conexión (si recarga la página tiene que volver a escribirlo). El mensaje nunca se difunde por el chat.
// El dinero y el estado de cada negocio viven en la partida de cada jugador, así que los cambios se le ENVÍAN a su cliente; si está desconectado se guardan y se aplican cuando entre.
const ADMIN_CMD = String(process.env.ADMIN_CMD || '/serunarata').trim().toLowerCase();
const PLAYERS_FILE = process.env.PLAYERS_FILE || path.join(__dirname, 'players.json');
const known = new Map(); // uid -> { uid, name, money, rk, last }  (jugadores que han entrado alguna vez)
let adminPending = {}, knownDirty = false;
{ const f = readJsonSafe(PLAYERS_FILE, 'players'); if (f) { (f.known || []).forEach(k => { if (k && k.uid) known.set(k.uid, k); }); adminPending = f.pending || {}; } }
function savePlayers() { try { writeJsonAtomic(PLAYERS_FILE, { known: [...known.values()], pending: adminPending }); knownDirty = false; } catch (e) { console.warn('No se pudo guardar players.json', e.message); } }
const playersTimer = setInterval(() => { if (knownDirty) savePlayers(); }, 10000);
const adminRef = uid => crypto.createHash('sha256').update('admin:' + uid).digest('hex').slice(0, 16); // el panel nunca ve el uid real (es la identidad de voto)
function touchKnown(p, live) {
  let k = known.get(p.uid);
  if (!k) { if (known.size >= 500) return; k = { uid: p.uid, name: p.name, money: 0, rk: 0, last: 0 }; known.set(p.uid, k); }
  k.name = p.name; k.last = Date.now();
  if (live && p.profile) { k.money = Math.round(Number(p.profile.money) || 0); k.rk = toInt(p.profile.rk, 0, 9); }
  if (live && p.vit) { k.h = p.vit.h; k.e = p.vit.e; }
  knownDirty = true;
}
function adminData() {
  const byUid = {}, names = {};
  for (const [k, c] of Object.entries(claims)) {
    const e = bizReg[k]; names[c.uid] = c.name;
    (byUid[c.uid] = byUid[c.uid] || []).push({ x: c.x, z: c.z, ty: e ? e.ty : null, lv: e ? e.lv : 0, till: e ? (e.till || 0) : 0, items: e ? e.items.map(i => ({ k: i.k, n: i.n, p: i.p })) : [] });
  }
  const uids = new Set([...known.keys(), ...Object.keys(byUid)]);
  const list = [...uids].map(uid => { const k = known.get(uid) || {}; return { ref: adminRef(uid), name: k.name || names[uid] || 'Jugador', online: uidOnline(uid), money: k.money || 0, rk: k.rk || 0, h: k.h != null ? k.h : null, e: k.e != null ? k.e : null, biz: byUid[uid] || [] }; });
  list.sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name));
  return { type: 'admin_data', players: list, world: { tod: world.tod, wx: world.wx, freezeTod: world.freezeTod, freezeWx: world.freezeWx } };
}
function adminDeliver(uid, cmd) { // al cliente del jugador si está conectado; si no, queda pendiente hasta que entre
  let sent = false;
  for (const [w, q] of players) if (q.uid === uid) { send(w, { type: 'admin_apply', cmd }); sent = true; }
  if (!sent) { const a = (adminPending[uid] = adminPending[uid] || []); a.push(cmd); if (a.length > 50) a.shift(); knownDirty = true; }
}
function handleAdmin(ws, p, msg) {
  const say = (type, text) => send(ws, { type, text });
  if (msg.type === 'admin_list') return send(ws, adminData());
  if (msg.type === 'admin_world') { // hora y tiempo del mundo: poner una hora/clima concretos y/o congelarlos (no lleva 'ref' de jugador)
    if (msg.tod !== undefined) { const t = Number(msg.tod); if (!Number.isFinite(t)) return say('admin_err', 'Hora no válida'); world.tod = ((t % 24) + 24) % 24; }
    if (msg.wx !== undefined) { const i = Number(msg.wx); if (!Number.isInteger(i) || i < 0 || i > 2) return say('admin_err', 'Tiempo no válido'); world.wx = i; world.weatherTimer = 0; }
    if (msg.freezeTod !== undefined) world.freezeTod = !!msg.freezeTod;
    if (msg.freezeWx !== undefined) world.freezeWx = !!msg.freezeWx;
    broadcast({ type: 'world', tod: world.tod, wx: world.wx });
    console.log('[admin] mundo:', p.name, 'hora', world.tod.toFixed(2), 'tiempo', world.wx, world.freezeTod ? '(hora congelada)' : '', world.freezeWx ? '(tiempo congelado)' : '');
    return say('admin_ok', '✅ Mundo: ' + (world.freezeTod ? 'hora congelada' : 'hora en marcha') + ' · ' + (world.freezeWx ? 'tiempo congelado' : 'tiempo en marcha'));
  }
  const refs = new Map(); for (const u of known.keys()) refs.set(adminRef(u), u); for (const c of Object.values(claims)) refs.set(adminRef(c.uid), c.uid);
  const uid = refs.get(String(msg.ref)); if (!uid) return say('admin_err', 'Jugador no encontrado');
  const nm = (known.get(uid) || {}).name || 'jugador';
  if (msg.type === 'admin_money') {
    const money = toInt(msg.money, 0, 1e12);
    adminDeliver(uid, { t: 'money', money });
    const k = known.get(uid); if (k) { k.money = money; knownDirty = true; }
    for (const q of players.values()) if (q.uid === uid && q.profile) q.profile.money = money;
    console.log('[admin]', p.name, 'puso el dinero de', nm, 'a', money);
    send(ws, adminData()); return say('admin_ok', '✅ Dinero de ' + nm + ': €' + money + (uidOnline(uid) ? '' : ' (se aplicará cuando entre)'));
  }
  if (msg.type === 'admin_vit') { // hambre y energía (0-100 %) de la partida del jugador
    const cmd = { t: 'vit' };
    if (msg.h != null) cmd.h = toInt(msg.h, 0, 100);
    if (msg.e != null) cmd.e = toInt(msg.e, 0, 100);
    if (cmd.h == null && cmd.e == null) return say('admin_err', 'Nada que cambiar');
    adminDeliver(uid, cmd);
    const k = known.get(uid); if (k) { if (cmd.h != null) k.h = cmd.h; if (cmd.e != null) k.e = cmd.e; knownDirty = true; }
    for (const q of players.values()) if (q.uid === uid && q.vit) { if (cmd.h != null) q.vit.h = cmd.h; if (cmd.e != null) q.vit.e = cmd.e; }
    console.log('[admin]', p.name, 'puso a', nm, 'hambre', cmd.h, 'energía', cmd.e);
    send(ws, adminData());
    return say('admin_ok', '✅ ' + nm + ': ' + [cmd.h != null ? 'hambre ' + cmd.h + ' %' : '', cmd.e != null ? 'energía ' + cmd.e + ' %' : ''].filter(Boolean).join(' · ') + (uidOnline(uid) ? '' : ' (se aplicará cuando entre)'));
  }
  if (msg.type === 'admin_biz') {
    const x = Math.round(Number(msg.x)), z = Math.round(Number(msg.z)), key = bizKeyOf(x, z), c = claims[key], e = bizReg[key];
    if (!c || c.uid !== uid) return say('admin_err', 'Ese local no es de ese jugador');
    if (msg.remove) {
      delete claims[key]; delete bizReg[key]; bizDirty = true;
      adminDeliver(uid, { t: 'biz', x, z, remove: true }); broadcastBiz();
      console.log('[admin]', p.name, 'quitó el local', key, 'a', nm);
    } else {
      const cmd = { t: 'biz', x, z };
      if (msg.lv != null) { cmd.lv = toInt(msg.lv, 1, 5); if (e) e.lv = cmd.lv; }
      if (msg.till != null) { cmd.till = toInt(msg.till, 0, 1e9); if (e) e.till = cmd.till; }
      if (msg.stock && typeof msg.stock === 'object') {
        cmd.stock = {};
        for (const [k, v] of Object.entries(msg.stock).slice(0, 12)) { const kk = cleanStr(k, 30); if (!kk) continue; cmd.stock[kk] = toInt(v, 0, 9999); if (e) { const it = e.items.find(i => i.k === kk); if (it) it.n = cmd.stock[kk]; } }
      }
      adminDeliver(uid, cmd); bizDirty = true; broadcastBiz();
      console.log('[admin]', p.name, 'editó el local', key, 'de', nm, JSON.stringify(cmd));
    }
    send(ws, adminData()); return say('admin_ok', '✅ Local actualizado' + (uidOnline(uid) ? '' : ' (se aplicará cuando ' + nm + ' entre)'));
  }
}

// =================================================================================================
// 11. CUENTAS DE USUARIO Y PARTIDAS GUARDADAS
//     Registrarse e iniciar sesión (accounts.json) y guardar la partida de cada cuenta en el servidor
//     (carpeta saves/), para que sea la misma desde cualquier dispositivo.
// =================================================================================================
// ---------- 11.1 Cuentas: registro, inicio de sesión y sesiones recordadas ----------
// accounts.json: { users: { "<nombre en minúsculas>": { name, pass, uid, created, last, tokens: [{ h, t }] } } }
// - pass: la contraseña NUNCA se guarda tal cual, sino cifrada con scrypt y una sal aleatoria: "scrypt$<sal>$<hash>".
// - tokens: sesiones recordadas (una por dispositivo). El dispositivo guarda el token y entra solo la próxima vez;
//   aquí solo se guarda el sha256 del token, así que aunque alguien lea el archivo no puede entrar con él.
// - uid: identidad interna del jugador (votos, negocios, terrenos, partida). Al registrarse se reutiliza el uid que ya tenía
//   ese dispositivo (si ninguna otra cuenta lo usa) para conservar lo que el jugador tenía antes de existir las cuentas.
const ACCOUNTS_FILE = process.env.ACCOUNTS_FILE || path.join(__dirname, 'accounts.json');
const USER_RE = /^[\p{L}\p{N} _.-]{3,18}$/u, PASS_MIN = 6, PASS_MAX = 100, MAX_TOKENS = 10;
const LOGIN_MAX_FAILS = 5, LOGIN_LOCK_MS = 60000; // tras 5 contraseñas incorrectas seguidas, ese usuario queda bloqueado 1 minuto
let accounts = { users: {} }, accDirty = false;
{ const a = readJsonSafe(ACCOUNTS_FILE, 'accounts'); if (a && a.users && typeof a.users === 'object') accounts.users = a.users; }
function saveAccounts() { try { writeJsonAtomic(ACCOUNTS_FILE, accounts); accDirty = false; } catch (e) { console.warn('No se pudo guardar accounts.json', e.message); } }
const accountsTimer = setInterval(() => { if (accDirty) saveAccounts(); }, 5000);
const userKey = u => String(u).normalize('NFC').toLowerCase();
const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const tokenIdx = new Map(); // sha256(token) -> clave del usuario
for (const [k, u] of Object.entries(accounts.users)) { u.tokens = Array.isArray(u.tokens) ? u.tokens : []; for (const t of u.tokens) tokenIdx.set(t.h, k); }
const loginFails = new Map(); // clave del usuario -> { n, until }
function hashPassword(pass) {
  const salt = crypto.randomBytes(16);
  return new Promise((ok, ko) => crypto.scrypt(pass, salt, 64, (e, k) => e ? ko(e) : ok('scrypt$' + salt.toString('hex') + '$' + k.toString('hex'))));
}
function checkPassword(pass, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash || hash.length !== 128) return Promise.resolve(false);
  return new Promise(ok => crypto.scrypt(pass, Buffer.from(salt, 'hex'), 64, (e, k) => ok(!e && crypto.timingSafeEqual(k, Buffer.from(hash, 'hex')))));
}
function newToken(key) { // crea una sesión recordada para un dispositivo (se guardan como mucho las 10 más recientes)
  const u = accounts.users[key], token = crypto.randomBytes(32).toString('hex');
  u.tokens.unshift({ h: sha256(token), t: Date.now() });
  for (const old of u.tokens.splice(MAX_TOKENS)) tokenIdx.delete(old.h);
  tokenIdx.set(u.tokens[0].h, key); accDirty = true;
  return token;
}
function authOk(ws, key, token) {
  const u = accounts.users[key]; u.last = Date.now(); accDirty = true;
  ws.account = { key, uid: u.uid, name: u.name };
  send(ws, { type: 'auth_ok', name: u.name, uid: u.uid, token: token || undefined, save: readSave(u.uid) });
}
async function handleAuth(ws, msg) {
  const fail = (reason, extra) => send(ws, Object.assign({ type: 'auth_fail', reason }, extra || {}));
  if (msg.type === 'auth_logout') { // cerrar sesión: el token de este dispositivo deja de valer
    const h = sha256(msg.token || ''), key = tokenIdx.get(h), u = key && accounts.users[key];
    if (u) { u.tokens = u.tokens.filter(t => t.h !== h); tokenIdx.delete(h); accDirty = true; saveAccounts(); }
    return send(ws, { type: 'auth_logged_out' });
  }
  if (ws.joined || ws.authBusy) return; // solo antes de entrar al mundo y de una en una
  if (msg.type === 'auth_token') { // entrada automática con la sesión recordada del dispositivo
    const h = sha256(msg.token || ''), key = tokenIdx.get(h), u = key && accounts.users[key];
    if (!u) return fail('Tu sesión ha caducado: vuelve a iniciar sesión.', { token: true });
    const t = u.tokens.find(x => x.h === h); if (t) t.t = Date.now();
    return authOk(ws, key, null);
  }
  if (msg.type !== 'auth_login' && msg.type !== 'auth_register') return;
  const user = String(msg.user || '').trim().replace(/\s+/g, ' '), pass = String(msg.pass || ''), key = userKey(user);
  if (!USER_RE.test(user)) return fail('El usuario debe tener entre 3 y 18 caracteres: letras, números, espacio, punto, guion o guion bajo.');
  if (pass.length < PASS_MIN || pass.length > PASS_MAX) return fail('La contraseña debe tener entre ' + PASS_MIN + ' y ' + PASS_MAX + ' caracteres.');
  const lock = loginFails.get(key);
  if (lock && lock.until > Date.now()) return fail('Demasiados intentos fallidos. Espera un minuto y vuelve a probar.');
  ws.authBusy = true;
  try {
    if (msg.type === 'auth_register') {
      if (accounts.users[key]) return fail('Ese nombre de usuario ya existe. Elige otro o inicia sesión.');
      const hash = await hashPassword(pass);
      if (accounts.users[key]) return fail('Ese nombre de usuario ya existe. Elige otro o inicia sesión.'); // por si otro lo ha registrado mientras tanto
      const dev = String(msg.device || ''), used = new Set(Object.values(accounts.users).map(u => u.uid));
      const uid = /^[A-Za-z0-9_-]{8,64}$/.test(dev) && !used.has(dev) ? dev : crypto.randomUUID();
      accounts.users[key] = { name: user, pass: hash, uid, created: Date.now(), last: 0, tokens: [] };
      const token = newToken(key); saveAccounts();
      console.log('[cuentas] nueva cuenta:', user);
      return authOk(ws, key, token);
    }
    const u = accounts.users[key], ok = await checkPassword(pass, u ? u.pass : 'scrypt$00$' + '0'.repeat(128)); // se calcula igual aunque no exista: no revela qué usuarios hay
    if (!u || !ok) {
      const f = loginFails.get(key) || { n: 0, until: 0 }; f.n++; if (f.n >= LOGIN_MAX_FAILS) { f.n = 0; f.until = Date.now() + LOGIN_LOCK_MS; } loginFails.set(key, f);
      ws.authFails = (ws.authFails || 0) + 1; if (ws.authFails >= 15) ws.close(4003, 'Demasiados intentos');
      return fail('Usuario o contraseña incorrectos.');
    }
    loginFails.delete(key);
    return authOk(ws, key, newToken(key));
  } finally { ws.authBusy = false; }
}

// ---------- 11.2 Partidas guardadas: un archivo por cuenta en saves/<uid>.json ----------
// El cliente manda su partida (la misma que antes solo se guardaba en el navegador) y el servidor la guarda;
// al iniciar sesión en cualquier dispositivo se le devuelve. Se escribe en disco cada pocos segundos, no a cada mensaje.
const SAVES_DIR = process.env.SAVES_DIR || path.join(__dirname, 'saves');
const MAX_SAVE = 900000; // bytes (el mensaje WebSocket admite hasta 1 MB)
try { fs.mkdirSync(SAVES_DIR, { recursive: true }); } catch (e) { console.warn('No se pudo crear ' + SAVES_DIR, e.message); }
const savePending = new Map(); // uid -> partida pendiente de escribir
const saveFile = uid => path.join(SAVES_DIR, String(uid).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) + '.json');
function readSave(uid) { return savePending.get(uid) || readJsonSafe(saveFile(uid), 'save') || null; }
function flushSaves() { for (const [uid, s] of savePending) { try { writeJsonAtomic(saveFile(uid), s); savePending.delete(uid); } catch (e) { console.warn('No se pudo guardar la partida de ' + uid, e.message); } } }
const savesTimer = setInterval(flushSaves, 5000);
function handleSave(ws, p, msg) {
  if (!ws.account || ws.account.uid !== p.uid) return;
  if (msg.type === 'save') {
    const s = msg.data;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return send(ws, { type: 'save_err', reason: 'Partida no válida' });
    if (JSON.stringify(s).length > MAX_SAVE) return send(ws, { type: 'save_err', reason: 'La partida es demasiado grande para guardarla en el servidor' });
    savePending.set(p.uid, s);
    return send(ws, { type: 'save_ok', at: Date.now() });
  }
  if (msg.type === 'save_delete') { // botón «Borrar partida»
    savePending.delete(p.uid);
    for (const f of [saveFile(p.uid), saveFile(p.uid) + '.bak']) { try { fs.unlinkSync(f); } catch {} }
    console.log('[cuentas]', p.name, 'ha borrado su partida');
    return send(ws, { type: 'save_deleted' });
  }
}

// =================================================================================================
// 12. LLAVES DE LAS CASAS
//     Solo se entra en una casa con su llave. El dueño tiene siempre la suya y puede dar copias a otros usuarios
//     (aunque no estén conectados) y quitarlas («cambiar la cerradura»).
// =================================================================================================
// Hay dos tipos de casa:
// - 'plot':  casa construida en un terreno (id 0-63). El servidor ya sabe quién es el dueño (sección 8).
// - 'house': casa o piso de la ciudad (id "x,z"). Su propiedad está en la partida de cada jugador, así que el cliente
//            manda la lista de las suyas (key_sync) y el servidor la recuerda para saber si una copia sigue valiendo.
// Una copia deja de valer sola si la casa cambia de dueño (venta, regalo, impago...). Los locales (negocios) no llevan llave.
const KEYS_FILE = process.env.KEYS_FILE || path.join(__dirname, 'keys.json');
const MAX_COPIES = 20; // copias de cada llave
let keyGrants = [], houseOwners = {}, keysDirty = false; // copia: { kind, id, owner, ownerName, holder, holderName, t } · houseOwners: uid -> ["x,z", ...]
{ const k = readJsonSafe(KEYS_FILE, 'keys'); if (k) { if (Array.isArray(k.grants)) keyGrants = k.grants; if (k.houseOwners && typeof k.houseOwners === 'object') houseOwners = k.houseOwners; } }
function saveKeys() { try { writeJsonAtomic(KEYS_FILE, { grants: keyGrants, houseOwners }); keysDirty = false; } catch (e) { console.warn('No se pudo guardar keys.json', e.message); } }
const keyIdOf = (kind, v) => { if (kind === 'plot') { const n = plotIdOf(v); return n === null ? null : String(n); } if (kind !== 'house') return null; const s = String(v == null ? '' : v); return /^-?\d{1,5},-?\d{1,5}$/.test(s) ? s : null; };
const ownsHouse = (uid, kind, id) => kind === 'plot' ? !!(plots[id] && plots[id].uid === uid) : !!(houseOwners[uid] && houseOwners[uid].includes(id));
const keyName = (kind, id) => kind === 'plot' ? 'casa del terreno nº ' + id : 'casa de (' + id.replace(',', ', ') + ')';
// quita las copias que ya no valen porque la casa cambió de dueño; devuelve los uid a los que hay que avisar
function keysPrune() { const hit = new Set(); keyGrants = keyGrants.filter(g => { if (ownsHouse(g.owner, g.kind, g.id)) return true; hit.add(g.owner); hit.add(g.holder); keysDirty = true; return false; }); return hit; }
const keysMsg = uid => ({ type: 'keys', mine: keyGrants.filter(g => g.holder === uid).map(g => ({ kind: g.kind, id: g.id, owner: g.ownerName })), given: keyGrants.filter(g => g.owner === uid).map(g => ({ kind: g.kind, id: g.id, holder: g.holderName })) });
function keysSendTo(uids) { for (const [w, q] of players) if (uids.has(q.uid)) send(w, keysMsg(q.uid)); }
const keysTimer = setInterval(() => { const hit = keysPrune(); if (hit.size) keysSendTo(hit); if (keysDirty) saveKeys(); }, 5000); // p. ej. un terreno que ha cambiado de dueño
function handleKeys(ws, p, msg) {
  const err = text => send(ws, { type: 'key_err', text });
  if (msg.type === 'key_sync') { // casas y pisos de la ciudad que tiene este jugador (los terrenos ya los sabe el servidor)
    const list = Array.isArray(msg.houses) ? [...new Set(msg.houses.slice(0, 200).map(v => keyIdOf('house', v)).filter(Boolean))].sort() : [];
    if (JSON.stringify(houseOwners[p.uid] || []) !== JSON.stringify(list)) { if (list.length) houseOwners[p.uid] = list; else delete houseOwners[p.uid]; keysDirty = true; }
    const hit = keysPrune(); hit.add(p.uid); return keysSendTo(hit);
  }
  const kind = msg.kind, id = keyIdOf(kind, msg.id);
  if (id === null) return err('Llave no válida');
  if (msg.type === 'key_give') { // el dueño da una copia a otro usuario (por su nombre de usuario)
    if (!ownsHouse(p.uid, kind, id)) return err('Esa casa no es tuya: solo el dueño puede hacer copias de la llave');
    const to = String(msg.to || '').trim(), acc = accounts.users[userKey(to)];
    if (!acc) return err('No existe ningún usuario llamado «' + to.slice(0, 18) + '»');
    if (acc.uid === p.uid) return err('Ya tienes la llave de tu casa');
    const mine = keyGrants.filter(g => g.kind === kind && g.id === id && g.owner === p.uid);
    if (mine.some(g => g.holder === acc.uid)) return err(acc.name + ' ya tiene una copia de esta llave');
    if (mine.length >= MAX_COPIES) return err('Como mucho puedes dar ' + MAX_COPIES + ' copias de cada llave');
    keyGrants.push({ kind, id, owner: p.uid, ownerName: p.name, holder: acc.uid, holderName: acc.name, t: Date.now() }); keysDirty = true;
    for (const [w, q] of players) if (q.uid === acc.uid) send(w, { type: 'key_new', kind, id, from: p.name });
    keysSendTo(new Set([p.uid, acc.uid]));
    console.log('[llaves]', p.name, 'da una copia de la llave de la', keyName(kind, id), 'a', acc.name);
    return send(ws, { type: 'key_ok', text: '🔑 Le has dado a ' + acc.name + ' una copia de la llave de la ' + keyName(kind, id) });
  }
  if (msg.type === 'key_revoke') { // quitar la copia a alguien (holder) o a todos («cambiar la cerradura»)
    const who = msg.holder ? String(msg.holder) : null, hit = new Set([p.uid]);
    keyGrants = keyGrants.filter(g => { if (g.kind === kind && g.id === id && g.owner === p.uid && (!who || g.holderName === who)) { hit.add(g.holder); return false; } return true; });
    keysDirty = true; keysSendTo(hit);
    return send(ws, { type: 'key_ok', text: who ? 'Le has quitado la copia de la llave a ' + who : '🔒 Has cambiado la cerradura: ya nadie más tiene copia' });
  }
  if (msg.type === 'key_drop') { // quien tiene una copia la tira
    const hit = new Set([p.uid]);
    keyGrants = keyGrants.filter(g => { if (g.kind === kind && g.id === id && g.holder === p.uid) { hit.add(g.owner); return false; } return true; });
    keysDirty = true; return keysSendTo(hit);
  }
}

// =================================================================================================
// 13. CONEXIÓN DE CADA JUGADOR
//     Qué pasa cuando alguien entra, cada mensaje que envía y cuando se va.
// =================================================================================================
wss.on('connection', ws => {
  if (players.size >= MAX_PLAYERS) { send(ws, {type:'full'}); return ws.close(1013, 'World full'); }
  const id = String(nextId++);
  ws.isAlive = true; ws.joined = false;
  ws.on('pong', () => ws.isAlive = true);
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (ws.kicked || !msg || typeof msg !== 'object') return; // conexión sustituida por otra de la misma cuenta
    if (typeof msg.type === 'string' && msg.type.startsWith('auth_')) { handleAuth(ws, msg).catch(e => { ws.authBusy = false; console.error('[cuentas]', e); }); return; } // ver sección 11
    // ---------- 13.1 Entrada al mundo (join): solo con una cuenta que haya iniciado sesión ----------
    if (!ws.joined) {
      if (msg.type !== 'join' || !ws.account) return;
      const again = [...players.values()].some(q => q.uid === ws.account.uid); // ya estaba dentro: no cuenta como plaza nueva
      if (!again && players.size >= MAX_PLAYERS) { send(ws, {type:'full'}); return ws.close(1013, 'World full'); }
      ws.joined = true;
      // una cuenta solo puede estar dentro una vez: si ya estaba conectada (otro dispositivo o pestaña), esa conexión se cierra
      for (const [w, q] of players) if (q.uid === ws.account.uid) { send(w, { type: 'kicked', reason: 'Has entrado con esta cuenta desde otro dispositivo o pestaña.' }); w.kicked = true; w.close(4001, 'Sesión abierta en otro sitio'); }
      const player = { id, uid: ws.account.uid, name: ws.account.name, x:24, y:0, z:1.5, yaw:0, vehicle:false, vType:null, vPt:0, vBk:0, vThr:0, vCol:0x4477aa, outfit:{}, pets:[], profile:{money:0,rk:0,properties:[],businesses:[],pets:[],career:[]} };
      players.set(ws, player); touchKnown(player);
      send(ws, {type:'welcome', id, players:[...players.values()].map(pub), chat:chatHistory, world:{tod:world.tod,wx:world.wx}, features:{boats:1,biz:1,houses:1}});
      broadcast({type:'joined', player:pub(player)}, ws); send(ws, govMsg(ws)); send(ws, bizMsg(ws)); send(ws, boatsMsg()); send(ws, { type: 'admin_pending', cmds: (adminPending[player.uid] || []).slice(0, 50) }); send(ws, { type: 'biz_pending', sales: (bizPending[player.uid] || []).slice(0, 100) }); if (ownsBiz(player.uid)) broadcastBiz(); sendHouses(ws, player); send(ws, keysMsg(player.uid)); sleepCheck();
      return;
    }
    const p = players.get(ws); if (!p) return;
    // ---------- 13.2 Chat y mensajes privados ----------
    if (msg.type === 'chat') {
      const text = String(msg.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
      if (!text) return;
      if (text.toLowerCase() === ADMIN_CMD) { if (!ws.admin) { ws.admin = true; console.log('[admin] panel abierto por', p.name); } return send(ws, Object.assign(adminData(), { open: true })); } // no se difunde ni se guarda en el chat
      const message = {name:p.name, id:p.id, text, time:Date.now(), tag:isMayor(p)?'ALCALDE':undefined};
      chatHistory.push(message);
      if (chatHistory.length > 40) chatHistory.shift();
      for (const client of players.keys()) send(client, {type:'chat', message});
      return;
    }
    if (msg.type === 'dm') { // mensaje privado: solo lo reciben el destinatario y el emisor; no se guarda ni pasa por el historial del chat
      const to = String(msg.to || ''), text = String(msg.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
      if (!text) return;
      const now = Date.now(); if (now - (ws.lastDm || 0) < 400) return send(ws, { type: 'dm_err', to, text: 'Vas muy rápido: espera un momento' }); ws.lastDm = now;
      const target = wsById(to), tp = target && players.get(target);
      if (!tp) return send(ws, { type: 'dm_err', to, text: 'Ese jugador ya no está conectado' });
      if (target === ws) return send(ws, { type: 'dm_err', to, text: 'No puedes escribirte a ti mismo' });
      send(target, { type: 'dm', from: { id: p.id, name: p.name }, text, time: now });
      send(ws, { type: 'dm_sent', to: { id: tp.id, name: tp.name }, text, time: now });
      return;
    }
    // ---------- 13.3 Reparto de mensajes a cada sistema (transferencias, gobierno, negocios, casas, admin, dormir, barcos, partidas, llaves) ----------
    if (typeof msg.type === 'string' && msg.type.startsWith('transfer')) { handleTransfer(ws, p, msg); return; }
    if (typeof msg.type === 'string' && (msg.type.startsWith('election_') || msg.type.startsWith('tax_') || msg.type === 'decree')) { handleGov(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('biz_')) { handleBiz(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('house_')) { handleHouses(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('admin_')) { if (ws.admin) handleAdmin(ws, p, msg); return; } // sin comando secreto previo, se ignora en silencio
    if (msg.type === 'sleep') { ws.sleeping = !!msg.on; sleepCheck(); return; }
    if (msg.type === 'pend_ack') { const n = toInt(msg.n, 0, 100); if (adminPending[p.uid]) { adminPending[p.uid] = adminPending[p.uid].slice(n); if (!adminPending[p.uid].length) delete adminPending[p.uid]; knownDirty = true; } return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('boat_')) { handleBoat(ws, p, msg); return; }
    if (msg.type === 'save' || msg.type === 'save_delete') { handleSave(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('key_')) { handleKeys(ws, p, msg); return; } // llaves (sección 12)
    // ---------- 13.4 Estado del jugador: posición, vehículo, ropa, mascotas y perfil ----------
    if (msg.type !== 'state') return;
    const n = v => Number.isFinite(Number(v)) ? Math.max(-1000, Math.min(2000, Number(v))) : 0;
    // Barcos: solo se acepta vType 'boat' si el barco está libre o ya lo pilota este jugador (también cubre reconexiones).
    let wantBoat = null, boatChanged = false;
    if (msg.vType === 'boat') { const b = boatOf(msg.vId); if (b && (!b.pilot || b.pilot === p.id)) wantBoat = b; }
    if (p.boatId && (!wantBoat || wantBoat.id !== p.boatId)) boatChanged = releaseBoat(p);
    if (wantBoat && wantBoat.pilot !== p.id) { wantBoat.pilot = p.id; p.boatId = wantBoat.id; boatChanged = true; }
    p.x=n(msg.x); p.y=Math.max(-30,Math.min(300,n(msg.y))); p.z=n(msg.z); p.yaw=n(msg.yaw);
    p.vehicle=!!msg.vehicle;
    p.vType=['hatch','sport','van','moto','bici','patinete','bus','avion','plane','heli','boat'].includes(msg.vType)?msg.vType:null;
    if (p.vType==='boat') { if (wantBoat) { p.vId=wantBoat.id; wantBoat.x=p.x; wantBoat.z=p.z; wantBoat.h=p.yaw; wantBoat.has=true; } else { p.vType=null; p.vehicle=false; p.vId=null; } } else p.vId=null;
    p.vCol=Number.isFinite(Number(msg.vCol))?Math.max(0,Math.min(0xffffff,Number(msg.vCol))):0x4477aa;
    p.vPt=Math.max(-1.5,Math.min(1.5,Number(msg.vPt)||0)); p.vBk=Math.max(-1.5,Math.min(1.5,Number(msg.vBk)||0)); p.vThr=Math.max(0,Math.min(1.2,Number(msg.vThr)||0)); // el helicóptero envía hasta 1.2 (régimen de rotor)
    p.outfit=(msg.outfit&&typeof msg.outfit==='object')?Object.fromEntries(Object.entries(msg.outfit).slice(0,12).map(([k,v])=>[String(k).slice(0,12),String(v).slice(0,50)])):{};
    p.pets=Array.isArray(msg.pets)?msg.pets.slice(0,3).map(q=>({
      t:['dog','cat','rabbit'].includes(q.t)?q.t:'dog',
      name:String(q.name||'Mascota').replace(/[<>\\u0000-\\u001f]/g,'').slice(0,14),
      col:Number.isFinite(Number(q.col))?Math.max(0,Math.min(0xffffff,Number(q.col))):0x999999,
      x:n(q.x),y:Math.max(-30,Math.min(300,n(q.y))),z:n(q.z),
      wear:q.wear&&typeof q.wear==='object'?Object.fromEntries(Object.entries(q.wear).slice(0,8).map(([k,v])=>[String(k).slice(0,12),String(v).slice(0,50)])):{}
    })):[]; 
    if (msg.profile && typeof msg.profile === 'object') {
      const pr=msg.profile;
      p.profile={
        money:Number.isFinite(Number(pr.money))?Math.max(0,Math.min(1e12,Number(pr.money))):0,
        rk:toInt(pr.rk,0,8), // rango social 0-8; el 9 (Alcalde) lo pone el servidor al ganar las elecciones (pub, sección 6)
        properties:Array.isArray(pr.properties)?pr.properties.slice(0,30).map(v=>String(v).slice(0,70)) : [],
        businesses:Array.isArray(pr.businesses)?pr.businesses.slice(0,20).map(v=>String(v).slice(0,70)) : [],
        pets:Array.isArray(pr.pets)?pr.pets.slice(0,3).map(v=>String(v).slice(0,40)) : [],
        career:Array.isArray(pr.career)?pr.career.slice(0,20).map(v=>String(v).slice(0,100)) : []
      };
    }
    if (msg.vit && typeof msg.vit === 'object') p.vit = { h: toInt(msg.vit.h, 0, 100), e: toInt(msg.vit.e, 0, 100) }; // hambre y energía: solo para el panel de administrador (no se difunde a los demás)
    touchKnown(p, true);
    if (boatChanged) broadcastBoats();
    broadcast({type:'state', player:pub(p)}, ws);
  });
  // ---------- 13.5 Desconexión ----------
  ws.on('close', () => { dropTransfersOf(ws); const p=players.get(ws); if(p){const freed=releaseBoat(p);if(gov.election&&gov.election.candidates.some(c=>c.uid===p.uid))console.log('[elecciones] el candidato '+p.name+' se desconectó: la votación sigue abierta');players.delete(ws);broadcast({type:'left',id:p.id});sleepCheck();if(freed)broadcastBoats();if(ownsBiz(p.uid))broadcastBiz();} });
  ws.on('error', () => {});
});

// =================================================================================================
// 14. RELOJ Y CLIMA DEL MUNDO
// =================================================================================================
// Reloj y clima únicos para todo el servidor. Un día del juego dura 12 minutos reales.
// Si no hay ningún jugador conectado, el tiempo del juego se detiene (hora y clima quedan congelados hasta que entre alguien).
const worldTick = setInterval(() => {
  if (!players.size) return;
  if (!world.freezeTod) world.tod = (world.tod + 1 / 30) % 24; // 1 segundo real = 2 minutos de juego (si el administrador congela la hora, no avanza)
  if (!world.freezeWx) {
    world.weatherTimer += 1;
    if (world.weatherTimer >= world.nextWeather) {
      world.weatherTimer = 0;
      world.nextWeather = 70 + Math.floor(Math.random() * 81);
      world.wx = Math.floor(Math.random() * 3);
    }
  }
  broadcast({type:'world', tod:world.tod, wx:world.wx});
}, 1000);

// =================================================================================================
// 15. ARRANQUE, APAGADO Y ERRORES
//     Comprobación de conexiones vivas, arranque del servidor, guardar todo al apagar y no caerse por un error.
// =================================================================================================
const heartbeat = setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive=false; ws.ping(); } }, 30000);
server.listen(PORT, '0.0.0.0', () => { console.log(`Real Life Simulator multiplayer: http://localhost:${PORT} (max ${MAX_PLAYERS})`); console.log('Funciones activas: sincronización de barcos, reserva de locales, casas en terrenos, panel de administrador'); });
const shutdown = () => { saveGov(); saveBiz(); saveHouses(); savePlayers(); saveAccounts(); flushSaves(); saveKeys(); clearInterval(accountsTimer); clearInterval(savesTimer); clearInterval(keysTimer); clearInterval(playersTimer); clearInterval(bizTimer); clearInterval(housesTimer); clearInterval(govTimer); clearInterval(heartbeat); clearInterval(worldTick); server.close(); process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown); // los hostings apagan con SIGTERM: se guarda todo antes de salir
// Un error en un mensaje suelto no debe tumbar el servidor (y con él a todos los jugadores): se registra y se sigue.
process.on('uncaughtException', e => console.error('[error no controlado]', e && e.stack || e));
process.on('unhandledRejection', e => console.error('[promesa rechazada]', e && e.stack || e));
