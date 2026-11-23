import assert from 'node:assert/strict';
import {createLegends,moveLegends} from '../legends.js';
import {pointAt} from '../routing.js';
import {createTraffic,roadTraffic,advanceTraffic,advanceRoadTraffic} from '../city.js';
import {roadEdge} from '../geography.js';
// Both long routes, in full, starting and finishing at the common city hub.
const observer={x:400,y:260,free:true};
for(const traffic of [false,true])for(const c of createLegends({x:0,y:0,j:{id:11}})){
 let seed=162;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const city=traffic?createTraffic():[],roads=traffic?roadTraffic():[],cars=[...city,...roads];let contacts=0,touch=false;
 const route=c.route,p=pointAt(route,0);
 Object.assign(c,{s:0,x:p.x,y:p.y+16,a:0,speed:70});
 const corners=route.turns.map(t=>({...t,peak:0,side:0,duration:0,off:0}));
 let off=0;
 for(let i=0;!c.laps&&i<36000;i++){
  advanceTraffic(city,1/60,i/60,observer,rng,[c,...roads]);advanceRoadTraffic(roads,1/60,observer,[c,...city]);
  moveLegends([c],1/60,observer,cars,()=>.9);
  const hit=cars.some(o=>Math.hypot(c.x-o.x,c.y-o.y)<26);if(hit&&!touch)contacts++;touch=hit;
  if(roadEdge(c.x,c.y)>0)off++;
  const t=corners.find(t=>Math.abs(t.s-c.s)<90);if(!t)continue;
  if(hit)t.contact=true;
  if(Math.abs(t.s-c.s)<8)t.apex=[Math.round(c.speed),c.phase,c.driftState,c.obstacle?.id,Math.round(c.obstacle?Math.hypot(c.x-c.obstacle.x,c.y-c.obstacle.y):0)];
  t.entry??=c.speed*.36;t.exit=c.speed*.36;
  const slip=Math.abs(c.slip)*180/Math.PI;
  t.peak=Math.max(t.peak,slip);t.side=Math.max(t.side,Math.abs(c.sideSpeed)*.36);
  if(slip>=7&&Math.abs(c.sideSpeed)*.36>=4)t.duration+=1/60;
 }
 const passed=corners.filter(t=>t.duration>=.12&&!t.contact);
 assert.ok(c.laps);assert.equal(off,0);
 const range=(list,key)=>[Math.min(...list.map(t=>t[key])),Math.max(...list.map(t=>t[key]))].map(x=>+x.toFixed(2));
 console.log(c.id,{traffic,contacts,total:corners.length,slides:passed.length,off,entry:range(passed,'entry'),exit:range(passed,'exit'),degrees:range(passed,'peak'),side:range(passed,'side'),seconds:range(passed,'duration'),normal:corners.filter(t=>!passed.includes(t)).map(t=>[t.p,Math.round(t.angle*57),Math.round(t.peak),t.apex?.join("/")])});
 assert.ok(passed.length>=(traffic?corners.length*.5:corners.length-2))
}
