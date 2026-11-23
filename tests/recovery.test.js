import test from 'node:test';
import assert from 'node:assert/strict';
import {jamGrid} from '../qa/traffic-grid.js';
import {advanceTraffic,advanceRoadTraffic,createTraffic,roadTraffic} from '../city.js';
import {createLegends,moveLegends} from '../legends.js';
import {pointAt} from '../routing.js';
import {roadEdge} from '../geography.js';
import {offscreenRecovery} from '../recovery.js';
const dt=1/60,observer={x:900,y:630,free:true,view:{x:300,y:180,right:1500,bottom:850}};
for(const [kind,n] of [['head',2],['head',3],['junction',3],['junction',4]])test(kind+' with '+n+' vehicles clears on camera',()=>{
 const cars=jamGrid(kind,n),start=cars.map(c=>[c.x,c.y]);let escape=false;
 for(let i=0;i<2100;i++){
  const prev=cars.map(c=>[c.x,c.y]);advanceTraffic(cars,dt,i*dt,observer,()=>.1);
  cars.forEach((c,j)=>{assert.ok(Math.hypot(c.x-prev[j][0],c.y-prev[j][1])<4);escape||=!!c.escape})
 }
 cars.forEach((c,j)=>assert.ok(Math.hypot(c.x-start[j][0],c.y-start[j][1])>100));if(kind==='head')assert.ok(escape)
});
test('A courier across the road may wait indefinitely; a stopped queue restarts in order',()=>{
 const cars=jamGrid('head',1);for(const dx of [58,116]){const c={...cars[0],id:dx,x:890-dx,pos:110-dx};cars.push(c)}
 const p={x:941,y:486,a:Math.PI/2};
 for(let i=0;i<600;i++)advanceTraffic(cars,dt,i*dt,p,()=>.1);
 assert.ok(cars.every(c=>c.speed<1));assert.equal(p.x,941);
 p.y+=120;for(let i=0;i<150;i++)advanceTraffic(cars,dt,(i+600)*dt,p,()=>.1);
 assert.ok(cars.every(c=>c.speed>20))
});
for(const [id,section] of [['forest',9000],['terminal',7200],['racer',1300]])test('Interrupted pass and blocked racer on '+id,()=>{
 const player={x:30,y:30,free:true},legends=createLegends({x:0,y:0,j:{id:11}}),c=legends[1],p=pointAt(c.route,section);
 Object.assign(c,{s:section,x:p.x-p.dy*16,y:p.y+p.dx*16,a:Math.atan2(p.dy,p.dx)+.65,speed:0,phase:'ABORT'});
 const car={id:12,x:c.x+p.dx*46,y:c.y+p.dy*46,speed:0,a:c.a+Math.PI};c.leader=car;
 const start=[c.x,c.y];for(let i=0;i<900;i++){
  if(i===180)car.y+=150;
  moveLegends([c],dt,player,[car]);assert.ok(roadEdge(c.x,c.y)<4)
 }assert.ok(Math.hypot(c.x-start[0],c.y-start[1])>180);assert.equal(c.phase,'FOLLOW')
});
test('Offscreen fallback needs a stalled blocker, an empty road and two hidden positions',()=>{
 const c={x:890,y:486,wait:12,failures:4,retry:.45,blocker:{}},p={x:5000,y:400,view:observer.view};
 const spot={x:2200,y:487};assert.ok(!offscreenRecovery(c,p,[],()=>spot));p.view={x:4000,y:100,right:5700,bottom:800};
 assert.ok(!offscreenRecovery(c,p,[spot],()=>spot));assert.ok(offscreenRecovery(c,p,[],()=>spot))
});
test('30 minutes with a full city, highway, two racers and a parked observer',()=>{
 let seed=2;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const p={x:2200,y:770,free:true},r=createLegends(p),a=createTraffic(),b=roadTraffic(),all=[...a,...b,...r];let longest=0;
 for(let i=0;i<108000;i++){
  advanceTraffic(a,dt,i*dt,p,rng,[...b,...r]);advanceRoadTraffic(b,dt,p,[...a,...r]);moveLegends(r,dt,p,[...a,...b],rng);
  for(const c of all){c.still=Math.abs(c.speed)<1?(c.still||0)+dt:0;longest=Math.max(longest,c.still)}
 }
 assert.ok(longest<45,'longest stop '+longest);assert.ok(r.every(c=>c.laps>3))
});
test('Two racers rejoin the same lane without remaining alongside one another',()=>{
 const r=createLegends({j:{id:11},x:0,y:0}),s=1200;
 for(const [i,c] of r.entries()){
  const p=pointAt(c.route,s+47*i);Object.assign(c,{s:s+47*i,x:p.x,y:p.y+(i?16:-19),offset:i?16:-19,lane:i?16:-19,a:0,speed:30,phase:'RETURN'})
 }
 for(let i=0;i<600;i++)moveLegends(r,dt,observer,[]);
 assert.ok(r.every(c=>c.x>2700&&c.phase==='FOLLOW'&&Math.abs(c.lane-16)<4))
});
test('A stalled legend and opposing traffic clear a shared lane under observation',()=>{
 const c=createLegends(observer)[0],s=1200,p=pointAt(c.route,s);
 Object.assign(c,{x:p.x,y:p.y+16,s,a:0,speed:0});
 const other=jamGrid('head',2)[1],x=c.x+44,y=c.y;
 Object.assign(other,{x,y,p:[x+110,y],q:[x-340,y]});
 const player={x:x-30,y:y+120,free:true};
 for(let i=0;i<540;i++){advanceTraffic([other],dt,i*dt,player,()=>.2,[c]);moveLegends([c],dt,player,[other])}
 assert.ok(c.x>x+60&&other.x<x-65)
});
