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
      const player = { id, name: cleanName(msg.name), x:24, y:0, z:1.5, yaw:0, vehicle:false, vType:null, vCol:0x4477aa, outfit:{}, pets:[], profile:{money:0,properties:[],businesses:[],pets:[],career:[]} };
      players.set(ws, player);
      send(ws, {type:'welcome', id, players:[...players.values()], chat:chatHistory, world:{tod:world.tod,wx:world.wx}});
      broadcast({type:'joined', player}, ws);
      return;
    }
    const p = players.get(ws); if (!p) return;
    if (msg.type === 'chat') {
      const text = String(msg.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
      if (!text) return;
      const message = {name:p.name, text, time:Date.now()};
      chatHistory.push(message);
      if (chatHistory.length > 40) chatHistory.shift();
      for (const client of players.keys()) send(client, {type:'chat', message});
      return;
    }
    if (msg.type !== 'state') return;
    const n = v => Number.isFinite(Number(v)) ? Math.max(-1000, Math.min(2000, Number(v))) : 0;
    p.x=n(msg.x); p.y=Math.max(-30,Math.min(300,n(msg.y))); p.z=n(msg.z); p.yaw=n(msg.yaw);
    p.vehicle=!!msg.vehicle;
    p.vType=['hatch','sport','van','moto','bici','patinete','bus'].includes(msg.vType)?msg.vType:null;
    p.vCol=Number.isFinite(Number(msg.vCol))?Math.max(0,Math.min(0xffffff,Number(msg.vCol))):0x4477aa;
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
        properties:Array.isArray(pr.properties)?pr.properties.slice(0,30).map(v=>String(v).slice(0,70)) : [],
        businesses:Array.isArray(pr.businesses)?pr.businesses.slice(0,20).map(v=>String(v).slice(0,70)) : [],
        pets:Array.isArray(pr.pets)?pr.pets.slice(0,3).map(v=>String(v).slice(0,40)) : [],
        career:Array.isArray(pr.career)?pr.career.slice(0,20).map(v=>String(v).slice(0,100)) : []
      };
    }
    broadcast({type:'state', player:p}, ws);
  });
  ws.on('close', () => { const p=players.get(ws); if(p){players.delete(ws);broadcast({type:'left',id:p.id});} });
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
process.on('SIGINT',()=>{clearInterval(heartbeat);clearInterval(worldTick);server.close(()=>process.exit(0));});
