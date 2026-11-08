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
      broadcast({type:'joined', player:pub(player)}, ws); send(ws, govMsg(ws));
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
    if (msg.type !== 'state') return;
    const n = v => Number.isFinite(Number(v)) ? Math.max(-1000, Math.min(2000, Number(v))) : 0;
    p.x=n(msg.x); p.y=Math.max(-30,Math.min(300,n(msg.y))); p.z=n(msg.z); p.yaw=n(msg.yaw);
    p.vehicle=!!msg.vehicle;
    p.vType=['hatch','sport','van','moto','bici','patinete','bus','avion','plane','heli'].includes(msg.vType)?msg.vType:null;
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
    broadcast({type:'state', player:pub(p)}, ws);
  });
  ws.on('close', () => { dropTransfersOf(ws); const p=players.get(ws); if(p){players.delete(ws);broadcast({type:'left',id:p.id});} });
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
process.on('SIGINT',()=>{saveGov();clearInterval(govTimer);clearInterval(heartbeat);clearInterval(worldTick);server.close(()=>process.exit(0));});
