import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegends,moveLegends} from '../legends.js';
import {pointAt} from '../routing.js';
import {roadEdge} from '../geography.js';
import {createTraffic,advanceTraffic,roadTraffic,advanceRoadTraffic,freeRide} from '../city.js';
const spectator={x:2700,y:680,free:true};
function setup(id,s,speed){
 const c=createLegends({x:0,y:0,j:{id:11}}).find(v=>v.id===id);
 const p=pointAt(c.route,s);return Object.assign(c,{s,x:p.x-16*p.dy,y:p.y+16*p.dx,a:Math.atan2(p.dy,p.dx),speed});
}
for(const id of ['spark','fox'])test(id+' accelerates on the highway, brakes and regains grip after sliding',()=>{
 const c=setup(id,900,35);let top=0,slide=false,recovered=false,lowest=Infinity;
 for(let i=0;i<6400;i++){
  const x=c.x,y=c.y;moveLegends([c],1/60,spectator,[],()=>.95);
  const dx=c.x-x,dy=c.y-y;assert.ok(Math.hypot(dx,dy)<6.3);
  assert.ok(roadEdge(c.x,c.y)<3);top=Math.max(top,c.speed*.36);
  if(Math.abs(c.slip)>.14&&c.handbrake){
   assert.ok(Math.abs(60*(dy*Math.cos(c.a)-dx*Math.sin(c.a)))>9);
   slide=true;lowest=Math.min(lowest,c.speed*.36)
  }else if(slide&&Math.abs(c.slip)<.035&&c.speed>190)recovered=true
 }assert.ok(top>=(id==='spark'?120:105)&&top<=(id==='spark'?135:120));assert.ok(recovered&&lowest<65)
});
for(const mode of ['traffic','player','oncoming','abort','bend'])test('Passing decision: '+mode,()=>{
 const c=setup('spark',mode==='bend'?6600:1200,200),slow={x:c.x+195,y:c.y,speed:64,a:0};
 const opposing={x:c.x+300,y:c.y-37,a:Math.PI,speed:75};
 let prev=c.phase,states=[prev],maxSide=0,lastLane=c.lane,clearance=Infinity;
 for(let i=0;i<265;i++){slow.x+=slow.speed/60;const traffic=mode==='player'?[]:[slow];
  if(mode==='oncoming'||(mode==='abort'&&i>24))traffic.push(opposing);
  moveLegends([c],1/60,mode==='player'?slow:spectator,traffic);
  clearance=Math.min(clearance,Math.hypot(c.x-slow.x,c.y-slow.y));
  if(mode==='oncoming'&&opposing.x>c.x-60)assert.ok(c.lane>14);
  if(c.phase!==prev){states.push(c.phase);prev=c.phase;if(prev==='RETURN')assert.ok(c.x>slow.x+60)}
  maxSide=Math.max(maxSide,Math.abs(c.lane-lastLane));lastLane=c.lane;
 }
 if(mode==='traffic'||mode==='player'){assert.deepEqual(states,['FOLLOW','PREPARE','PULL_OUT','PASS','RETURN','FOLLOW']);assert.ok(clearance>29)}
 if(mode==='bend')assert.ok(!states.includes('PULL_OUT'));
 if(mode==='abort')assert.ok(states.includes('ABORT')&&!states.includes('PASS'));
 assert.ok(maxSide<1.4&&states.length<12)
});
test('Physics at 20 and 60 fps across near/far decision boundary',()=>{
 const a=setup('spark',1200,55),b=setup('spark',1200,55);
 for(let i=0;i<180;i++){const p=i<90?spectator:{x:0,y:0};moveLegends([a],1/20,p,[]);for(let j=0;j<3;j++)moveLegends([b],1/60,p,[])}
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.01);assert.ok(Math.abs(a.a-b.a)<.001)
});
test('Twenty minutes with moving traffic and alternating rural routes',()=>{
 let seed=2;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const p=freeRide(),racers=createLegends(p),city=createTraffic(),roads=roadTraffic();let last;
 for(let i=0;i<72000;i++){
  advanceTraffic(city,1/60,i/60,p,rng,racers);advanceRoadTraffic(roads,1/60,p,racers);
  moveLegends(racers,1/60,p,[...city,...roads],rng);if(i===54000)last=racers.map(c=>c.laps+c.s/c.route.length)
 }for(const [i,c] of racers.entries())assert.ok(c.laps+c.s/c.route.length>last[i]+.5,JSON.stringify([c.id,c.x,c.y,c.phase,c.speed,last[i],c.laps]))
});
