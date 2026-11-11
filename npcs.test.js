const {create,P,N,LOT}=require('./npcs');
const m=create();
let bad=0,badPk=0,minD=1e9,maxD=-1e9;
const players=[];
for(let i=0;i<20;i++){const id='p'+i;players.push(id);m.join(id,()=>{});m.move(id,Math.random()*270,Math.random()*270)}
// medir bytes con un jugador concreto
let bytes=0,msgs=0;m.join('probe',s=>{bytes+=s.length;msgs++});m.move('probe',135,135);
const steps=10*60*10; // 10 min a 10 Hz
for(let s=0;s<steps;s++){m._step();
  for(const n of m._npcs){
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x0=i*P,z0=j*P;
      if(n.x>x0+3&&n.x<x0+37&&n.z>z0+3&&n.z<z0+37)bad++;
      if(i==1&&j==3&&n.x>x0-2&&n.x<x0+42&&n.z>z0-2&&n.z<z0+42)badPk++}
    minD=Math.min(minD,n.x,n.z);maxD=Math.max(maxD,n.x,n.z)}}
console.log({dentroDeEdificio:bad,enParking:badPk,minCoord:+minD.toFixed(1),maxCoord:+maxD.toFixed(1)});
console.log('probe (centro de la ciudad):',(bytes/600).toFixed(0),'B/s ·',(msgs/600).toFixed(1),'msg/s');
const t=Date.now();for(let s=0;s<10000;s++)m._step();console.log('10000 pasos sim+red con 21 jugadores:',Date.now()-t,'ms');
console.log(m.stats());
m.leave('probe');players.forEach(i=>m.leave(i));console.log('tras salir todos:',m.stats().running?'sigue corriendo':'parado');
