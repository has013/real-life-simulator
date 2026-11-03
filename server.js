const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 20;
const players = new Map();
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
const wss = new WebSocketServer({ server, maxPayload: 2048 });
function send(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function broadcast(data, except) { for (const [ws] of players) if (ws !== except) send(ws, data); }
function cleanName(v) { return String(v || 'Jugador').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0,18) || 'Jugador'; }
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
      const player = { id, name: cleanName(msg.name), x:24, y:0, z:1.5, yaw:0, vehicle:false };
      players.set(ws, player);
      send(ws, {type:'welcome', id, players:[...players.values()]});
      broadcast({type:'joined', player}, ws);
      return;
    }
    const p = players.get(ws); if (!p || msg.type !== 'state') return;
    const n = v => Number.isFinite(Number(v)) ? Math.max(-1000, Math.min(2000, Number(v))) : 0;
    p.x=n(msg.x); p.y=Math.max(-30,Math.min(300,n(msg.y))); p.z=n(msg.z); p.yaw=n(msg.yaw); p.vehicle=!!msg.vehicle;
    broadcast({type:'state', player:p}, ws);
  });
  ws.on('close', () => { const p=players.get(ws); if(p){players.delete(ws);broadcast({type:'left',id:p.id});} });
  ws.on('error', () => {});
});
const heartbeat = setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive=false; ws.ping(); } }, 30000);
server.listen(PORT, '0.0.0.0', () => console.log(`Real Life Simulator multiplayer: http://localhost:${PORT} (max ${MAX_PLAYERS})`));
process.on('SIGINT',()=>{clearInterval(heartbeat);server.close(()=>process.exit(0));});
