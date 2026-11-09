const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 20;
const players = new Map();
const chatHistory = [];
const world = { tod: 9, wx: 0, weatherTimer: 0, nextWeather: 90 };
let nextId = 1;
const gameFile = path.join(__dirname, 'index.html');
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify({ok:true,players:players.size,maxPlayers:MAX_PLAYERS})); }
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'content-type':'text/html; charset=utf-8', 'cache-control':'no-store'});
    return fs.createReadStream(gameFile).pipe(res);
  }
  res.writeHead(404); res.end('Not found');
});
const wss = new WebSocketServer({ server, maxPayload: 16384 });
function send(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function broadcast(data, except) { for (const [ws] of players) if (ws !== except) send(ws, data); }
function cleanName(v) { return String(v || 'Jugador').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0,18) || 'Jugador'; }

// ===== TRANSFERENCIAS (dinero, objetos, casas y negocios) =====
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
  const r = { money: toInt(o.money, 0, 1e9), items: [], houses: [], biz: [] };
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
  return (r.money || r.items.length || r.houses.length || r.biz.length) ? r : null;
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
    t.stage = 'commit';
    send(t.from, { type: 'transfer_commit', tid: t.tid, offer: t.offer });
    return;
  }
  if (msg.type === 'transfer_commit_ack' && t.from === ws && t.stage === 'commit') {
    if (!msg.ok) return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: false, reason: 'Ya no tenías todo lo que ofrecías' }, { type: 'transfer_cancel', tid: t.tid, reason: p.name + ' ya no tenía lo ofrecido' });
    const rp = players.get(t.to);
    if (t.toGone || !rp || t.to.readyState !== WebSocket.OPEN) return endTransfer(t, { type: 'transfer_refund', tid: t.tid, offer: t.offer }, null);
    bizTransfer(t.offer, p.uid, rp);
    return endTransfer(t, { type: 'transfer_result', tid: t.tid, ok: true, toName: rp.name }, { type: 'transfer_deliver', tid: t.tid, from: { id: p.id, name: p.name }, offer: t.offer });
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

// ===== GOBIERNO MUNICIPAL (elecciones, alcalde, impuestos, bans) =====
// Todo vive en el servidor. La identidad de voto es el uid persistente que cada navegador genera y guarda (nunca se reenvía a otros jugadores).
const ELECTION_MS = Number(process.env.ELECTION_MS || 24 * 3600 * 1000); // duración de la votación (24 h reales)
const DAY_MS = Number(process.env.GOV_DAY_MS || 12 * 60 * 1000);         // «día de alcaldía» = 1 día de juego (12 min reales)
const MANDATE_DAYS = Number(process.env.MANDATE_DAYS || 10);              // mandato: 10 días de juego (= 2 h reales)
const GOV_FILE = process.env.GOV_FILE || path.join(__dirname, 'gov.json');
let gov = { mayor: null, taxes: [], treasury: 0, election: null, nextTid: 1, lastDay: 0, lastDecree: 0 };
try { const g = JSON.parse(fs.readFileSync(GOV_FILE, 'utf8')); if (g && typeof g === 'object') gov = Object.assign(gov, g); } catch {}
function saveGov() { try { fs.writeFileSync(GOV_FILE, JSON.stringify(gov)); } catch (e) { console.warn('No se pudo guardar gov.json', e.message); } }
const isMayor = p => !!(gov.mayor && p && p.uid === gov.mayor.uid);
function pub(p) { // versión pública del jugador: sin uid y con rango 9 si es el Alcalde
  const o = Object.assign({}, p); delete o.uid;
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
    mayor: gov.mayor ? { name: gov.mayor.name, since: gov.mayor.since, end: gov.mayor.since + MANDATE_DAYS * DAY_MS } : null,
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
  saveGov();
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
  if (gov.mayor && now >= gov.mayor.since + MANDATE_DAYS * DAY_MS) {
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

// ===== NEGOCIOS DE JUGADORES (registro público + ventas a otros jugadores) =====
// El dueño publica su negocio (tipo, nivel, productos, precios y stock). Los demás lo ven y le compran.
// Las ventas se descuentan del stock del registro y se acreditan en la caja del dueño (en vivo o, si está desconectado, quedan pendientes hasta que vuelva).
const BIZ_FILE = process.env.BIZ_FILE || path.join(__dirname, 'biz.json');
const BIZ_TYPES = ['super', 'bar', 'ropa', 'muebles', 'pan'], BIZ_RANGE = 45;
let bizReg = {}, bizPending = {}, bizDirty = false;
// claims: dueño de cada LOCAL comprado (clave 'x,z'), aunque todavía no tenga negocio montado. Es la fuente de verdad: quien lo reserva primero se lo queda, esté conectado o no.
let claims = {};
try { const b = JSON.parse(fs.readFileSync(BIZ_FILE, 'utf8')); if (b && typeof b === 'object') { bizReg = b.reg || {}; bizPending = b.pending || {}; claims = b.claims || {}; } } catch {}
for (const [k, e] of Object.entries(bizReg)) if (!claims[k]) { const [x, z] = k.split(',').map(Number); claims[k] = { uid: e.uid, name: e.name, x, z }; } // migración: negocios ya registrados
function saveBiz() { try { fs.writeFileSync(BIZ_FILE, JSON.stringify({ reg: bizReg, pending: bizPending, claims })); bizDirty = false; } catch (e) { console.warn('No se pudo guardar biz.json', e.message); } }
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
  return { x: Math.max(-1000, Math.min(2000, x)), z: Math.max(-1000, Math.min(2000, z)), ty: q.ty, lv: toInt(q.lv, 1, 5), items };
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
    const before = JSON.stringify(Object.values(bizReg).filter(e => e.uid === p.uid)), keep = new Set(), lost = new Set();
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
    if (JSON.stringify(Object.values(bizReg).filter(e => e.uid === p.uid)) !== before || mineC() !== beforeC) { bizDirty = true; broadcastBiz(); }
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

// ===== BARCOS (un solo piloto por barco; los demás ven cómo navega) =====
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

wss.on('connection', ws => {
  if (players.size >= MAX_PLAYERS) { send(ws, {type:'full'}); return ws.close(1013, 'World full'); }
  const id = String(nextId++);
  ws.isAlive = true; ws.joined = false;
  ws.on('pong', () => ws.isAlive = true);
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!ws.joined) {
      if (msg.type !== 'join') return;
      ws.joined = true;
      const player = { id, uid: cleanStr(msg.uid, 64) || ('c' + id), name: cleanName(msg.name), x:24, y:0, z:1.5, yaw:0, vehicle:false, vType:null, vPt:0, vBk:0, vThr:0, vCol:0x4477aa, outfit:{}, pets:[], profile:{money:0,rk:0,properties:[],businesses:[],pets:[],career:[]} };
      players.set(ws, player);
      send(ws, {type:'welcome', id, players:[...players.values()].map(pub), chat:chatHistory, world:{tod:world.tod,wx:world.wx}});
      broadcast({type:'joined', player:pub(player)}, ws); send(ws, govMsg(ws)); send(ws, bizMsg(ws)); send(ws, boatsMsg()); send(ws, { type: 'biz_pending', sales: (bizPending[player.uid] || []).slice(0, 100) }); if (ownsBiz(player.uid)) broadcastBiz();
      return;
    }
    const p = players.get(ws); if (!p) return;
    if (msg.type === 'chat') {
      const text = String(msg.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
      if (!text) return;
      const message = {name:p.name, text, time:Date.now(), tag:isMayor(p)?'ALCALDE':undefined};
      chatHistory.push(message);
      if (chatHistory.length > 40) chatHistory.shift();
      for (const client of players.keys()) send(client, {type:'chat', message});
      return;
    }
    if (typeof msg.type === 'string' && msg.type.startsWith('transfer')) { handleTransfer(ws, p, msg); return; }
    if (typeof msg.type === 'string' && (msg.type.startsWith('election_') || msg.type.startsWith('tax_') || msg.type === 'decree')) { handleGov(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('biz_')) { handleBiz(ws, p, msg); return; }
    if (typeof msg.type === 'string' && msg.type.startsWith('boat_')) { handleBoat(ws, p, msg); return; }
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
        rk:toInt(pr.rk,0,8), // rango social 0-8; el 9 (Alcalde) lo asignará el servidor en las elecciones
        properties:Array.isArray(pr.properties)?pr.properties.slice(0,30).map(v=>String(v).slice(0,70)) : [],
        businesses:Array.isArray(pr.businesses)?pr.businesses.slice(0,20).map(v=>String(v).slice(0,70)) : [],
        pets:Array.isArray(pr.pets)?pr.pets.slice(0,3).map(v=>String(v).slice(0,40)) : [],
        career:Array.isArray(pr.career)?pr.career.slice(0,20).map(v=>String(v).slice(0,100)) : []
      };
    }
    if (boatChanged) broadcastBoats();
    broadcast({type:'state', player:pub(p)}, ws);
  });
  ws.on('close', () => { dropTransfersOf(ws); const p=players.get(ws); if(p){const freed=releaseBoat(p);players.delete(ws);broadcast({type:'left',id:p.id});if(freed)broadcastBoats();if(ownsBiz(p.uid))broadcastBiz();} });
  ws.on('error', () => {});
});
// Reloj y clima únicos para todo el servidor. Un día del juego dura 12 minutos reales.
const worldTick = setInterval(() => {
  world.tod = (world.tod + 1 / 30) % 24; // 1 segundo real = 2 minutos de juego
  world.weatherTimer += 1;
  if (world.weatherTimer >= world.nextWeather) {
    world.weatherTimer = 0;
    world.nextWeather = 70 + Math.floor(Math.random() * 81);
    world.wx = Math.floor(Math.random() * 3);
  }
  if (players.size) broadcast({type:'world', tod:world.tod, wx:world.wx});
}, 1000);
const heartbeat = setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive=false; ws.ping(); } }, 30000);
server.listen(PORT, '0.0.0.0', () => console.log(`Real Life Simulator multiplayer: http://localhost:${PORT} (max ${MAX_PLAYERS})`));
process.on('SIGINT',()=>{saveGov();saveBiz();clearInterval(bizTimer);clearInterval(govTimer);clearInterval(heartbeat);clearInterval(worldTick);server.close(()=>process.exit(0));});
