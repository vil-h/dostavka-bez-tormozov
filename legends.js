import {highway,bends,yard,roadEdge} from './geography.js';
import {prepare,pointAt,project} from './routing.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const hub=[1060,470],cityLoop=[[1530,470],[1530,1130],[480,1130],[480,470]],country=[...highway,...bends.slice(1),[840,1130],[840,470]];
const courses=[country,cityLoop,[...highway,...yard.slice(1),...bends.slice(2),[480,1130],[480,470]]].map(path=>{const r={points:[hub,...path,hub],outside:true};prepare(r,[]);return r});
export const legends={spark:{name:'Искра',car:'Искра GT',color:'#47d8ff',style:'Поздно тормозит и обгоняет на длинных прямых М-7.'},fox:{name:'Лис',car:'Лис R',color:'#ffa748',style:'Ищет просвет в городском потоке и держит скорость на лесных связках.'}};
function pose(c){const p=pointAt(c.route,c.s);return {x:p.x-p.dy*c.lane,y:p.y+p.dx*c.lane,a:Math.atan2(p.dy,p.dx)}}
export function createLegends(player){
 if(!player.free&&player.j.id<5)return [];
 return Object.keys(legends).map((id,i)=>{const forestStart=id==='fox'&&player.j?.id===11,r=courses[forestStart?2:i],c={id,route:r,s:forestStart?r.length*.49:i?1250:r.length-1500,lane:16,speed:i?130:190,phase:"FOLLOW",phaseTime:0,cooldown:0,offset:16,yaw:0,grip:1,laps:0};
 for(let tries=0;tries<8;tries++){Object.assign(c,pose(c));if(Math.hypot(c.x-player.x,c.y-player.y)>1050)break;if(tries===3)c.route=courses[2];c.s=(c.s+1300)%c.route.length}return c})
}
const styles={
 spark:{top:370,accel:158,brake:350,turnSpeed:112,steer:4,driftAngle:1.48,room:600},
 fox:{top:325,accel:155,brake:405,turnSpeed:119,steer:5,driftAngle:.65,room:470}
};
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const approach=(a,b,limit)=>a+clamp(b-a,-limit,limit);
function phase(c,name){if(name!==c.phase){c.phase=name;c.phaseTime=0}}
function trafficPlan(c,objects,p,gap,style){
 const own=16,other=-22;let lead=null,clear=true,merge=true,crossLimit=Infinity;
 const horizon=Math.max(style.room,c.speed*2.4);
 const relative=o=>{
  const x=o.x-c.x,y=o.y-c.y;
  return {o,d:x*p.dx+y*p.dy,lane:c.lane-x*p.dy+y*p.dx,
   speed:(o.speed||0)*Math.cos((o.a??c.a)-Math.atan2(p.dy,p.dx))};
 };
 for(const o of objects){
  if(o===c||Math.abs(o.x-c.x)>horizon+220||Math.abs(o.y-c.y)>horizon+220)continue;
  const v=relative(o);
  if(Math.abs(v.lane-own)<25){
   if(v.d>0&&(!lead||v.d<lead.d))lead=v;
   if(v.d>-62&&v.d<56)merge=false;
  }
  if(Math.abs(v.lane-other)<24&&v.d>-60&&v.d<horizon+Math.max(0,-v.speed)*1.6)clear=false;
  if(Math.abs(v.lane-c.lane)<25&&v.d>=0&&v.d<120&&o!==c.leader)
   crossLimit=Math.min(crossLimit,Math.max(0,v.speed)+(Math.max(0,v.d-49))*1.7);
 }
 const room=p.x>1680&&gap>style.room&&roadEdge(p.x,p.y)<-37;
 const tracked=c.leader&&relative(c.leader);
 switch(c.phase){
 case 'FOLLOW':
  if(c.cooldown<=0&&lead&&!lead.o.route&&lead.d<horizon*.65&&lead.speed>=-3&&lead.speed<style.top-28&&room){
   c.leader=lead.o;phase(c,'PREPARE')
  }break;
 case 'PREPARE':
  if(!clear||!room||!tracked||tracked.d<40)phase(c,'ABORT');
  else if(c.phaseTime>.13)phase(c,'PULL_OUT');break;
 case 'PULL_OUT':case 'PASS':
  if(!clear||(gap<105&&c.phase!=='PASS')){phase(c,'ABORT');break}
  if(c.phase==='PULL_OUT'&&c.lane<-15)phase(c,'PASS');
  if(tracked&&tracked.d<-63&&merge)phase(c,'RETURN');break;
 case 'RETURN':case 'ABORT':
  if(Math.abs(c.lane-own)<3&&Math.abs(c.offset-own)<1){phase(c,'FOLLOW');c.leader=null;c.cooldown=1.5}break;
 }
 const stayOut=c.phase==='PASS'||c.phase==='PULL_OUT'||(c.phase==='ABORT'&&c.lane<-3&&!merge);
 c.aim=stayOut?other:own;
 let limit=crossLimit;
 if(lead&&Math.abs(c.lane-own)<29)limit=Math.min(limit,Math.max(0,lead.speed+(lead.d-51)*1.7));
 if(c.phase==='ABORT'&&stayOut&&tracked)limit=Math.min(limit,Math.max(0,tracked.speed-55));
 c.emergency=limit<c.speed-65;
 return limit;
}
// Check relative velocity as well as lane occupancy when the courier crosses a bend.
function yieldToCourier(c,player,target){
 const dx=player.x-c.x,dy=player.y-c.y;
 if(Math.abs(dx)>240||Math.abs(dy)>240)return target;
 const a=c.motion??c.a,along=dx*Math.cos(a)+dy*Math.sin(a);
 if(along<3)return target;
 const rx=c.speed*Math.cos(a)-(player.vx??(player.speed||0)*Math.cos(player.a||0));
 const ry=c.speed*Math.sin(a)-(player.vy??(player.speed||0)*Math.sin(player.a||0));
 const closing=Math.max(1,rx*rx+ry*ry),time=(dx*rx+dy*ry)/closing;
 if(time<0||time>1.1||Math.hypot(dx-time*rx,dy-time*ry)>32)return target;
 const lead=(player.vx||0)*Math.cos(a)+(player.vy||0)*Math.sin(a);
 return Math.min(target,Math.max(0,lead+1.4*(along-56)));
}
function drive(c,dt,objects,near,rng,player){
 const r=c.route,style=styles[c.id];
 c.s=project(r,c.x,c.y,Math.max(0,c.s-75),Math.min(r.length,c.s+90)).s;
 if(c.s>=r.length-2){c.laps++;c.route=c.id==='spark'?courses[rng()<.8?0:2]:courses[rng()<.55?1:2];c.s=0}
 const p=pointAt(c.route,c.s);
 c.lane=(c.y-p.y)*p.dx-(c.x-p.x)*p.dy;
 c.phaseTime+=dt;c.cooldown-=dt;c.planIn=(c.planIn||0)-dt;
 if(c.planIn<=0){
  c.planIn=near?.075:.20;
  const turn=c.route.turns.find(t=>t.s>c.s-65);
  const gap=turn?turn.s-c.s:Infinity,bend=turn?.angle||0;
  const apex=style.turnSpeed/Math.sqrt(Math.max(.12,bend));
  c.handbrake=bend>=style.driftAngle&&gap<58&&gap>-38&&c.speed>72&&c.phase==='FOLLOW';
  const space=clamp(-roadEdge(p.x,p.y)/55,.65,1);
  c.target=Math.min(style.top*(.73+.27*space),Math.sqrt(apex*apex*space+2*style.brake*.79*Math.max(0,gap-80)),
   trafficPlan(c,objects,p,turn?gap:Infinity,style));
 }
 c.offset=approach(c.offset,c.aim??16,dt*58);
 const look=clamp(20+c.speed*.14,23,72);
 const goal=pointAt(c.route,Math.min(c.route.length,c.s+look));
 const extra=Math.max(0,c.s+look-c.route.length);
 const heading=Math.atan2(goal.y+extra*goal.dy+goal.dx*c.offset-c.y,goal.x+extra*goal.dx-goal.dy*c.offset-c.x);
 c.motion??=c.a;
 const error=angle(heading-c.motion);
 c.grip=approach(c.grip,c.handbrake?.35:1,dt*(c.handbrake?4:2.4));
 const steer=clamp(error*style.steer-angle(c.a-c.motion)*2.2,-2.35,2.35);
 c.yaw=approach(c.yaw,steer,dt*9);
 c.a=angle(c.a+c.yaw*dt*Math.min(1,c.speed/45));
 const safeSpeed=near?yieldToCourier(c,player,c.target):c.target;
 c.speed=approach(c.speed,safeSpeed,dt*(safeSpeed<c.speed?(c.emergency||safeSpeed<c.target?620:style.brake):style.accel));
 c.motion=angle(c.motion+angle(c.a-c.motion)*(1-Math.exp(-dt*(3+16*c.grip*c.grip))));
 c.slip=angle(c.a-c.motion);c.sideSpeed=c.speed*Math.sin(c.slip);
 c.vx=c.speed*Math.cos(c.motion);c.vy=c.speed*Math.sin(c.motion);
 c.x+=c.vx*dt;c.y+=c.vy*dt;
}
export function moveLegends(list,dt,player,traffic,rng=Math.random){
 const objects=[...traffic,player,...list];
 for(const c of list){
  const near=Math.hypot(c.x-player.x,c.y-player.y)<1700;
  let left=dt;
  while(left>1e-8){const frame=Math.min(left,1/60);drive(c,frame,objects,near,rng,player);left-=frame}
 }
}
