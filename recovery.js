import {roadEdge} from './geography.js';

// Follow references to the actual vehicles holding each other up. A queue
// ending at a traffic light or the courier has no cycle.
function cycleAt(car){
 let next=car.blocker,best=car;
 const rank=c=>(c.noRoom>0?-200:0)+(c.curve?100:0)+(typeof c.id==='number'?c.id:c.id==='fox'?21:20);
 for(let i=0;next&&i<24;i++,next=next.blocker){
  if(next===car)return best;
  if(rank(next)>rank(best))best=next;
 }
 return null
}
export function recovery(car,dt,obstacle,objects,player,legal=false){
 car.blocker=obstacle;car.noRoom=Math.max(0,(car.noRoom||0)-dt);
 car.retry=Math.max(0,(car.retry||0)-dt);
 const progress=car.s??car.pos,delta=Math.abs(progress-(car.lastProgress??progress));
 car.lastProgress=progress;if(!obstacle&&delta>dt*25)car.backed=false;
 if(car.escape){
  const e=car.escape;e.age+=dt;
  const dx=car.x-e.x,dy=car.y-e.y;
  if(Math.hypot(dx,dy)>(e.reverse?30:105)||e.age>(e.reverse?2.6:8)){car.escape=null;if(e.age>8&&Math.hypot(dx,dy)<15)car.noRoom=4;car.retry=e.reverse?.35:2;car.wait=0}
  else {car.flow='RECOVERING';return e}
 }
 car.wait=obstacle&&!legal&&obstacle!==player&&delta<dt*8?(car.wait||0)+dt:0;
 car.flow=car.wait>1?'BLOCKED':obstacle||legal?'YIELDING':'DRIVING';
 if(car.wait<1.25||car.retry>0||car.noRoom>0)return null;
 car.retry=.45;
 if(cycleAt(car)!==car)return null;
 car.failures=(car.failures||0)+1;
 const a=car.motion??car.a,dx=Math.cos(a),dy=Math.sin(a);
 for(const offset of [32,-32,20,-20,44,-44]){
  if(car.holdLine||roadEdge(car.x-dy*offset,car.y+dx*offset)>-10)continue;
  // A low-speed curved departure must fit throughout, including the return corridor.
  let clear=true;
  for(const [f,l] of [[4,.3],[12,.75],[25,1],[40,1]]){
   const x=car.x+dx*f-dy*offset*l,y=car.y+dy*f+dx*offset*l;
   if(roadEdge(x,y)>-10||objects.some(o=>o!==car&&Math.hypot(o.x-x,o.y-y)<Math.min(26,Math.hypot(o.x-car.x,o.y-car.y)+.1))){clear=false;break}
  }
  if(clear){car.flow='RECOVERING';car.attempts=(car.attempts||0)+1;
   return car.escape={x:car.x,y:car.y,offset,age:0,blocker:obstacle}}
 }
 const rear={x:car.x-40*dx,y:car.y-40*dy};
 if((car.s??car.pos)>38&&roadEdge(rear.x,rear.y)<-9&&objects.every(o=>o===car||Math.hypot(o.x-rear.x,o.y-rear.y)>45)&&!car.backed){
  car.backed=true;car.flow='RECOVERING';return car.escape={x:car.x,y:car.y,offset:0,age:0,reverse:true,blocker:obstacle}
 }
 car.noRoom=2.5;
 return null
}
export function blockerAhead(c,objects){
 const dx=Math.cos(c.a),dy=Math.sin(c.a);let best=null,gap=62;
 for(const o of objects){if(!o||o===c)continue;
  const x=o.x-c.x,y=o.y-c.y,d=x*dx+y*dy;
  if(d>0&&d<gap&&Math.abs(y*dx-x*dy)<23){gap=d;best=o}
 }
 return best
}

export function offscreenRecovery(c,player,objects,candidate){
 if(c.escape||!(c.failures>=3&&c.wait>10&&c.blocker&&c.retry>.4)||!player)return;
 const outside=p=>player.view?(p.x<player.view.x-160||p.x>player.view.right+160||p.y<player.view.y-160||p.y>player.view.bottom+160):Math.hypot(p.x-player.x,p.y-player.y)>1050;
 if(!outside(c))return;
 for(const d of [230,380,640]){
  const p=candidate(d);
  if(!p||!outside(p)||roadEdge(p.x,p.y)>-10||objects.some(o=>o!==c&&Math.hypot(o.x-p.x,o.y-p.y)<115))continue;
  Object.assign(c,p,{speed:0,shoulder:0,escape:null,wait:0,failures:0,noRoom:0,retry:5,blocker:null,flow:'DRIVING'});
  return true
 }
}
