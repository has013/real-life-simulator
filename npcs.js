'use strict';
/* ============================================================================
   npcs.js — Peatones NPC simulados por el servidor (FASE 1)

   - Simula ~18 NPCs que caminan por las ACERAS de la ciudad (grafo de esquinas
     de manzana, así nunca atraviesan edificios) y cruzan calles por las esquinas.
   - Cada jugador solo recibe los NPCs que tiene cerca (radio con histéresis) y
     solo deltas: add / upd / rem. Los NPCs quietos no generan tráfico.
   - La simulación se detiene sola cuando no hay jugadores conectados.

   INTEGRACIÓN EN server.js (4 líneas):

     const npcs = require('./npcs').create();            // 1) arriba del todo

     // 2) cuando un jugador hace 'join' (ya tienes su id y su ws):
     npcs.join(player.id, s => { if (ws.readyState === 1) ws.send(s); });

     // 3) cuando llega un mensaje {type:'state', x, z, ...} de ese jugador:
     npcs.move(player.id, msg.x, msg.z);

     // 4) cuando el jugador se desconecta (close):
     npcs.leave(player.id);

     // y en el mensaje 'welcome', dentro de features:  features: { ..., npcs: true }
   ============================================================================ */

// --- Geometría de la ciudad (debe coincidir con el cliente: P, N, parcela 40 m) ---
const P = 54, N = 5, LOT = 40;
const PK_I = 1, PK_J = 3;      // manzana del parking: sin peatones
const A = 1.5;                 // la acera va a 1,5 m del borde de la parcela (los edificios empiezan a 3 m)

// --- Parámetros ---
const DEFAULTS = {
  count: 18,        // NPCs totales
  simHz: 10,        // pasos de simulación por segundo
  netEvery: 2,      // se envía cada N pasos (=5 Hz)
  enter: 85,        // un NPC entra en la vista de un jugador a < 85 m
  exit: 105,        // y sale a > 105 m (histéresis para que no parpadee)
};

/* ---------- Grafo de aceras ---------- */
function buildGraph() {
  const nodes = [];
  const id = (i, j, c) => (i * N + j) * 4 + c;
  const ok = (i, j) => i >= 0 && j >= 0 && i < N && j < N && !(i === PK_I && j === PK_J);
  // 4 esquinas por manzana: 0=(lo,lo) 1=(hi,lo) 2=(hi,hi) 3=(lo,hi)
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let c = 0; c < 4; c++) {
    const lo = A, hi = LOT - A;
    const cx = (c === 1 || c === 2) ? hi : lo, cz = (c >= 2) ? hi : lo;
    nodes[id(i, j, c)] = { x: i * P + cx, z: j * P + cz, adj: [], live: ok(i, j) };
  }
  const link = (a, b, cross) => {
    const na = nodes[a], nb = nodes[b];
    if (!na.live || !nb.live) return;
    const len = Math.hypot(nb.x - na.x, nb.z - na.z);
    na.adj.push({ to: b, len, cross }); nb.adj.push({ to: a, len, cross });
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    for (let c = 0; c < 4; c++) link(id(i, j, c), id(i, j, (c + 1) % 4), false); // perímetro de la manzana
    if (i + 1 < N) { link(id(i, j, 1), id(i + 1, j, 0), true); link(id(i, j, 2), id(i + 1, j, 3), true); } // cruce en X
    if (j + 1 < N) { link(id(i, j, 3), id(i, j + 1, 0), true); link(id(i, j, 2), id(i, j + 1, 1), true); } // cruce en Z
  }
  return nodes;
}

const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

function create(opts) {
  const cfg = Object.assign({}, DEFAULTS, opts || {});
  const nodes = buildGraph();
  const liveNodes = nodes.map((n, i) => (n.live ? i : -1)).filter(i => i >= 0);
  const dt = 1 / cfg.simHz;

  /* ---------- NPCs ---------- */
  const npcs = [];
  function pickNext(n) {
    const nd = nodes[n.a], opts2 = nd.adj;
    // no volver atrás salvo que sea el único camino; cruzar calle pesa menos que seguir en la acera
    let total = 0; const w = opts2.map(e => {
      const k = (e.to === n.from && opts2.length > 1) ? 0 : (e.cross ? 0.4 : 1);
      total += k; return k;
    });
    let r = Math.random() * total, pick = opts2[0];
    for (let q = 0; q < opts2.length; q++) { r -= w[q]; if (r <= 0) { pick = opts2[q]; break; } }
    n.from = n.a; n.b = pick.to; n.len = pick.len; n.u = 0;
  }
  function place(n) {
    const a = nodes[n.from], b = nodes[n.b];
    const f = n.len ? n.u / n.len : 1;
    const dx = b.x - a.x, dz = b.z - a.z, L = n.len || 1;
    // desplazamiento lateral (camina por su derecha); vale 0 en las esquinas, así no hay saltos
    const side = n.lat * Math.sin(Math.PI * f);
    n.x = a.x + dx * f + (-dz / L) * side;
    n.z = a.z + dz * f + (dx / L) * side;
    n.yaw = Math.atan2(dx, dz);
  }
  for (let k = 0; k < cfg.count; k++) {
    const a = liveNodes[(Math.random() * liveNodes.length) | 0];
    const n = {
      id: k + 1, seed: (Math.random() * 0xffffffff) >>> 0,
      from: a, a, b: a, len: 0, u: 0, x: 0, z: 0, yaw: 0,
      spd: 1.1 + Math.random() * 0.7, lat: 0.3 + Math.random() * 0.5,
      wait: 0, mv: false,
    };
    pickNext(n);
    n.u = Math.random() * n.len; // repartidos por el recorrido
    place(n);
    npcs.push(n);
  }

  function simStep() {
    for (const n of npcs) {
      if (n.wait > 0) { n.wait -= dt; n.mv = false; continue; }
      n.u += n.spd * dt; n.mv = true;
      if (n.u >= n.len) {
        n.a = n.b;
        if (Math.random() < 0.2) n.wait = 2 + Math.random() * 7; // a veces se para un rato en la esquina
        pickNext(n);
      }
      place(n);
    }
  }

  /* ---------- Jugadores / red ---------- */
  const players = new Map(); // id -> {send, x, z, has, known: Map(npcId -> mvFlag)}
  let timer = null, tick = 0;
  const stats = { sent: 0, bytes: 0 };

  function netStep() {
    const E2 = cfg.enter * cfg.enter, X2 = cfg.exit * cfg.exit;
    for (const p of players.values()) {
      if (!p.has) continue;
      const add = [], upd = [], rem = [];
      for (const n of npcs) {
        const dx = n.x - p.x, dz = n.z - p.z, d2 = dx * dx + dz * dz, kn = p.known.has(n.id);
        if (!kn) {
          if (d2 < E2) { p.known.set(n.id, n.mv); add.push([n.id, n.seed, r1(n.x), r1(n.z), r2(n.yaw), n.mv ? r1(n.spd) : 0]); }
        } else if (d2 > X2) {
          p.known.delete(n.id); rem.push(n.id);
        } else if (n.mv || p.known.get(n.id) !== n.mv) {
          p.known.set(n.id, n.mv); upd.push([n.id, r1(n.x), r1(n.z), r2(n.yaw), n.mv ? r1(n.spd) : 0]);
        }
      }
      if (add.length || upd.length || rem.length) {
        const m = { type: 'npc' }; if (add.length) m.add = add; if (upd.length) m.upd = upd; if (rem.length) m.rem = rem;
        const s = JSON.stringify(m);
        try { p.send(s); stats.sent++; stats.bytes += s.length; } catch (e) { /* conexión caída: leave() lo limpiará */ }
      }
    }
  }

  function loop() { simStep(); if (++tick % cfg.netEvery === 0) netStep(); }
  function ensureTimer() { if (!timer && players.size) timer = setInterval(loop, 1000 / cfg.simHz); }
  function stopIfEmpty() { if (timer && !players.size) { clearInterval(timer); timer = null; } }

  return {
    join(id, send) { players.set(String(id), { send, x: 0, z: 0, has: false, known: new Map() }); ensureTimer(); },
    move(id, x, z) {
      const p = players.get(String(id)); if (!p) return;
      x = Number(x); z = Number(z); if (!Number.isFinite(x) || !Number.isFinite(z)) return;
      p.x = x; p.z = z; p.has = true;
    },
    leave(id) { players.delete(String(id)); stopIfEmpty(); },
    stats() { return { npcs: npcs.length, players: players.size, running: !!timer, msgs: stats.sent, bytes: stats.bytes }; },
    // para tests / debug
    _npcs: npcs, _nodes: nodes, _step: loop,
  };
}

module.exports = { create, P, N, LOT, A };
