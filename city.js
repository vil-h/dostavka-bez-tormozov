import {blockerAhead,recovery,offscreenRecovery} from './recovery.js';
import {outposts,travel,highway,bends,yard,roadEdge} from './geography.js';
import {vehicles} from './vehicles.js';
import {streetsX,streetsY,jobs,cargo,start,result,settle} from './game.js';
const stops=[
 ['Депо',480,490],['Газетный киоск',660,490],['Почтамт',840,490],['Дом печати',1010,490],
 ['Речной рынок',150,170],['Мастерская',480,170],['Галерея',1170,170],['Порт',1530,170],
 ['Вокзал',150,830],['Кондитерская',1170,830],['Библиотека',840,830],['Склад',480,1150],['Маяк',1530,1150],...outposts
];
const pick=(list,rng)=>list[Math.floor(rng()*list.length)];
export function freeRide(){
 const r=start(jobs[0]);
 return Object.assign(r,{free:true,j:null,offer:null,nextOffer:7,notice:'',noticeTime:0,offersSeen:0});
}
export function makeOffer(r,rng=Math.random){
 // The first dispatch near the depot introduces pickup on a single street.
 const intro=r.offersSeen===0&&Math.hypot(r.x-400,r.y-490)<150;
 const near=stops.filter(p=>Math.hypot(p[1]-r.x,p[2]-r.y)<1450);
 const terminal=outposts[2],localRun=!r.terminalOffered&&Math.hypot(r.x-terminal[1],r.y-terminal[2])<160;
 const from=localRun?terminal:intro?stops[0]:pick(near.length?near:stops,rng);
 const kind=localRun?'Дальний рейс':pick(intro?['Обычная доставка','Срочная доставка']:['Обычная доставка','Срочная доставка','Хрупкий заказ','Дальний рейс'],rng);
 const byDistance=stops.filter(p=>travel(from,p).d>240).sort((a,b)=>travel(from,b).d-travel(from,a).d);
 const to=localRun?outposts[1]:pick(intro?stops.slice(1,4):kind==='Дальний рейс'?byDistance.slice(0,3):byDistance,rng);
 const type=localRun?'fridge':pick(kind==='Хрупкий заказ'?['vase','tank','cake']:Object.keys(cargo),rng);
 const {d:length,cost,via}=travel(from,to);
 const cruise=type==='fridge'?85:type==='vase'||type==='cake'?92:110;
 const time=Math.ceil((14+cost/(cruise*Math.min(1,vehicles[r.model].top))*2.3)*(kind==='Срочная доставка'?.80:1));
 const pay=Math.round((165+Math.min(length,2500)*.24+Math.max(0,length-2500)*.047+(type==='parcel'?0:60))*(kind==='Обычная доставка'?1:1.3));
 return {via,kind,name:kind,type,from:from[0],place:to[0],start:from.slice(1),end:to.slice(1),time,pay,weather:'ясно'};
}
export function dispatch(r,dt,rng=Math.random){
 if(!r.free)return;
 r.noticeTime=Math.max(0,r.noticeTime-dt);
 if(r.j)return;
 r.nextOffer-=dt;if(r.nextOffer>0)return;
 if(r.offer){skipOffer(r,rng);return}
 r.offer=makeOffer(r,rng);r.offersSeen++;r.nextOffer=15;
}
export function skipOffer(r,rng=Math.random){if(!r.offer)return;r.offer=null;r.nextOffer=24+rng()*18}
export function acceptOffer(r){
 if(!r.offer||r.j)return false;
 if(r.offer.from===outposts[2][0])r.terminalOffered=true;
 Object.assign(r,{j:r.offer,offer:null,t:0,hits:0,hp:100,tilt:0,loaded:false,done:'',paid:false});return true;
}
export function closeDelivery(r,state,rng=Math.random){
 if(!r.free||!r.j||!r.done)return false;
 const reward=result(r).pay;settle(state,r);
 r.notice=r.done==='success'?'Доставлено · +'+reward+' ₽':r.hp<=0?'Груз повреждён · рейс окончен':'Время вышло · рейс окончен';
 Object.assign(r,{j:null,t:0,done:'',loaded:false,noticeTime:5,nextOffer:28+rng()*16});return true;
}
// Each directed road ends 40 px before its junction. A quadratic curve links
// its right-hand lane to the next road without introducing position jumps.
const dirs=[[1,0],[0,1],[-1,0],[0,-1]];
const point=(i,j,d,along)=>{const [dx,dy]=dirs[d];return [streetsX[i]+dx*along-dy*18,streetsY[j]+dy*along+dx*18]};
const valid=(i,j,d)=>{const [x,y]=dirs[d];return i+x>=0&&i+x<5&&j+y>=0&&j+y<4};
function segment(car){
 const [dx,dy]=dirs[car.d];car.toI=car.i+dx;car.toJ=car.j+dy;
 car.p=point(car.i,car.j,car.d,40);car.q=point(car.toI,car.toJ,car.d,-40);
 car.len=Math.hypot(car.q[0]-car.p[0],car.q[1]-car.p[1]);car.curve=false;car.pos=0;
}
function pose(c){
 const t=c.pos/c.len,u=1-t;
 if(!c.curve){c.x=c.p[0]*u+c.q[0]*t;c.y=c.p[1]*u+c.q[1]*t;c.a=c.d*Math.PI/2;return}
 c.x=u*u*c.p[0]+2*u*t*c.ctrl[0]+t*t*c.q[0];c.y=u*u*c.p[1]+2*u*t*c.ctrl[1]+t*t*c.q[1];
 c.a=Math.atan2(u*(c.ctrl[1]-c.p[1])+t*(c.q[1]-c.ctrl[1]),u*(c.ctrl[0]-c.p[0])+t*(c.q[0]-c.ctrl[0]));
}
export function createTraffic(){
 return [[0,0,0],[2,0,1],[3,0,0],[4,1,1],[3,2,2],[0,2,1],[1,3,0],[3,3,3],[1,1,3],[0,1,0]].map(([i,j,d],id)=>{
 const c={i,j,d,id,speed:0,max:54+(id%5)*9};segment(c);c.pos=c.len*(.20+.05*(id%6));pose(c);return c
 });
}
export function green(i,j,d,time){return (Math.floor((time+i*2+j)/6)%2)===d%2}
function turn(c,rng){
 c.i=c.toI;c.j=c.toJ;
 const choices=[c.d,(c.d+1)%4,(c.d+3)%4].filter(d=>valid(c.i,c.j,d));
 const next=pick(choices,rng),old=dirs[c.d];c.p=c.q;c.q=point(c.i,c.j,next,40);
 
 c.ctrl=c.d===next?point(c.i,c.j,next,0):[old[0]?c.q[0]:c.p[0],old[1]?c.q[1]:c.p[1]];
 c.len=Math.hypot(c.p[0]-c.ctrl[0],c.p[1]-c.ctrl[1])+Math.hypot(c.q[0]-c.ctrl[0],c.q[1]-c.ctrl[1]);
 c.d=next;c.curve=true;c.pos=0;
}
function bypass(c,dt,e,oldX,oldY){
 let goal=e?e.offset:0;
 if(goal&&roadEdge(c.x-Math.sin(c.a)*goal,c.y+Math.cos(c.a)*goal)>-10)goal=0;
 c.shoulder=(c.shoulder||0)+Math.max(-23*dt,Math.min(23*dt,goal-(c.shoulder||0)));
 c.x-=Math.sin(c.a)*c.shoulder;c.y+=Math.cos(c.a)*c.shoulder;
 const dx=c.x-oldX,dy=c.y-oldY;
 if(!e&&Math.abs(c.shoulder)<.1){c.drawAngle=c.a;return}
 if(Math.hypot(dx,dy)>.01){
  const heading=Math.atan2(dy,dx)+(c.speed<0?Math.PI:0),old=c.drawAngle??c.a;
  const delta=Math.atan2(Math.sin(heading-old),Math.cos(heading-old));
  c.drawAngle=old+Math.max(-1.8*dt,Math.min(1.8*dt,delta))
 }
}
export function advanceTraffic(cars,dt,time,player,rng=Math.random,racers=[]){
 // Reserve the crossing before entry so two turning vehicles cannot deadlock nose to nose.
 const occupied=new Map(cars.filter(c=>c.curve).map(c=>[c.i+','+c.j,c]));
 const objects=[...cars,...racers,...(player?[player]:[])];
 for(const c of cars){
 const oldX=c.x,oldY=c.y;
 let ahead=blockerAhead(c,objects);
 // The tangent of an intersection curve can point directly at a stationary
 // vehicle on a different exit. Check the remaining swept path instead.
 if(c.curve&&ahead){let conflicts=false;
  const probe={...c};
  for(let d=4;d<=54;d+=6){probe.pos=Math.min(c.len,c.pos+d);pose(probe);
   if(Math.hypot(probe.x-ahead.x,probe.y-ahead.y)<27){conflicts=true;break}}
  if(!conflicts)ahead=null
 }
 const red=!c.curve&&(c.toI===2||c.toJ===1)&&!green(c.toI,c.toJ,c.d,time);
 const junction=c.toI+','+c.toJ;
 const waiting=!c.curve&&occupied.has(junction);
 const obstacle=ahead||(waiting&&c.len-c.pos<15?occupied.get(junction):null);
 c.holdLine=waiting&&c.len-c.pos<18;
 const e=recovery(c,dt,obstacle,objects,player,red&&!c.curve);
 if(offscreenRecovery(c,player,objects,d=>{
  const probe={...c};let remaining=d;
  while(remaining>probe.len-probe.pos){remaining-=probe.len-probe.pos;if(probe.curve)segment(probe);else turn(probe,rng)}
  probe.pos+=remaining;pose(probe);return probe
 }))continue;
 const stop=ahead&&(!e||ahead!==e.blocker);
 const limit=e?.reverse?-15:e&&!stop?22:stop?0:(red||waiting)?Math.min(c.max,Math.max(0,(c.len-c.pos-5)*2)):c.curve?48:c.max;
 c.speed+=Math.max(-220*dt,Math.min(80*dt,limit-c.speed));c.pos+=c.speed*dt;
 if(waiting&&c.pos>=c.len){c.pos=c.len-.01;c.speed=0}
 if(c.pos>=c.len){if(c.curve)segment(c);else {turn(c,rng);occupied.set(junction,c)}}
 pose(c);bypass(c,dt,e,oldX,oldY);
 }
}
// Continuous closed lanes. Only nearby vehicles need an updated pose each step.
const peripheralLoop=[...highway,...yard.slice(1),...bends.slice(2),[1530,810]];
function lanePath(points){
 const unit=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/l,(b[1]-a[1])/l]};
 const lane=points.map((p,i)=>{const u=unit(points[(i+points.length-1)%points.length],p),v=unit(p,points[(i+1)%points.length]),d=18/(1+u[0]*v[0]+u[1]*v[1]);return [p[0]-(u[1]+v[1])*d,p[1]+(u[0]+v[0])*d]});
 let total=0;const sections=lane.map((p,i)=>{const q=lane[(i+1)%lane.length],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy),base=total;total+=len;return {p,dx,dy,len,base}});
 return {sections,total}
}
const lanes=[lanePath(peripheralLoop),lanePath([...peripheralLoop].reverse())];
function roadPose(c){const lane=lanes[c.lane],s=lane.sections.find(s=>c.pos<s.base+s.len)||lane.sections[0],u=(c.pos-s.base)/s.len;c.x=s.p[0]+s.dx*u;c.y=s.p[1]+s.dy*u;c.a=Math.atan2(s.dy,s.dx)}
export function roadTraffic(){return Array.from({length:8},(_,i)=>{const lane=i%2,c={lane,pos:lanes[lane].total*((i+.4)/8),speed:75+i*5,id:10+i};roadPose(c);return c})}
export function advanceRoadTraffic(cars,dt,player,racers=[]){
 const objects=[...cars,...racers,...(player?[player]:[])];
 for(const c of cars){
  const oldX=c.x,oldY=c.y;
  c.cruise??=c.speed;
  const obstacle=blockerAhead(c,objects);
  const e=recovery(c,dt,obstacle,objects,player);
  if(offscreenRecovery(c,player,objects,d=>{const probe={...c,pos:(c.pos+d)%lanes[c.lane].total};roadPose(probe);return probe}))continue;
  const target=e?.reverse?-15:obstacle&&obstacle!==e?.blocker?0:e?22:c.x>7720&&c.y>1100?52:c.cruise;
  c.speed+=Math.max(-260*dt,Math.min(85*dt,target-c.speed));
  c.pos=(c.pos+c.speed*dt)%lanes[c.lane].total;
  roadPose(c);bypass(c,dt,e,oldX,oldY)
 }
}
