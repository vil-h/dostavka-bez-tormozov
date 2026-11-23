import {events,medal} from './challenges.js';
import {start,jobs,step,clamp,edge} from './game.js';
import {stockCar} from './vehicles.js';
const stock=stockCar('van').levels;
export function newContest(id,model,rng=Math.random){
 const e=events[id], [x,y]=e.points[0];
 function driver(m,back,lane){const c=start(jobs[0]);Object.assign(c,{model:m,j:null,x:x-back,y:y+lane,a:0,gate:0,split:0,finish:null});return c}
 const player=driver(model,0,0);
 const bots=(e.rivals||[]).map((name,i)=>{
 const car=driver(['hatch','van','coupe'][i],i===2?58:24,i===0?-22:i===1?22:-6);
 const skill=(e.night?[172,185,207]:[119,140])[i]+rng()*8;
 return Object.assign(car,{name,cruise:skill,lane:[-10,11,-3][i],phase:rng()*6,sharp:[2.4,2.8,2.55][i]})
 });
 return {e,player,bots,count:3,t:0,done:false,paid:false,place:1,drift:{total:0,chain:0,hold:0,gap:0,mult:1,best:0},fx:{marks:[],smoke:[]}};
}
export function checkGate(c,e,oldX,oldY,time){
 const g=e.gates[c.gate];if(!g||c.finish!==null)return false;
 const before=(oldX-g.x)*g.dx+(oldY-g.y)*g.dy,after=(c.x-g.x)*g.dx+(c.y-g.y)*g.dy;
 if(before>=0||after<0)return false;
 const f=-before/(after-before),crossX=oldX+(c.x-oldX)*f,crossY=oldY+(c.y-oldY)*f;
 if(Math.abs((crossX-g.x)*g.dy-(crossY-g.y)*g.dx)>40)return false;
 c.gate++;c.split=time;if(c.gate===e.gates.length)c.finish=time;return true;
}
export function botInput(c,e,t){
 const g=e.gates[c.gate],side=Math.sin(t*.8+c.phase)*4+c.lane;
 let x=g.x+g.dx*12-g.dy*side,y=g.y+g.dy*12+g.dx*side;
 // After a missed gate, approach it from the legal side again.
 const along=(c.x-g.x)*g.dx+(c.y-g.y)*g.dy;
 if(along>=0){x=g.x-g.dx*55;y=g.y-g.dy*55}
 const a=Math.atan2(y-c.y,x-c.x)-c.a,delta=Math.atan2(Math.sin(a),Math.cos(a));
 const dist=Math.hypot(x-c.x,y-c.y);
 const speed=Math.min(c.cruise,c.gate===e.gates.length-1?c.cruise:Math.max(54,dist*1.12))/(1+Math.abs(delta)*.8);
 return {turn:clamp(delta*c.sharp,-1,1),gas:c.speed<speed,brake:c.speed>speed+9};
}
function botStep(c,e,dt,time){if(c.finish!==null)return;const {x,y}=c;step(c,botInput(c,e,time),dt,stock);checkGate(c,e,x,y,time)}
function distance(c,e){
 const g=e.gates[c.gate];if(!g)return e.length;
 const [x,y]=e.points[c.gate];return g.base+clamp((c.x-x)*g.dx+(c.y-y)*g.dy,0,g.length-.01)
}
export function position(s){
 const p=s.player;
 return 1+s.bots.filter(c=>c.finish!==null?(p.finish===null||c.finish<p.finish):p.finish===null&&distance(c,s.e)>distance(p,s.e)).length;
}
export function bankDrift(d){d.total+=Math.floor(d.chain);d.best=Math.max(d.best,Math.floor(d.chain));d.chain=0;d.hold=0;d.gap=0;d.mult=1}
export function scoreSlide(d,c,zone,dx,dy,dt){
 const [l,t,r,b]=zone;
 if(c.hit||edge(c.x,c.y)>6||c.x<l||c.x>r||c.y<t||c.y>b){
 d.chain=0;d.hold=0;d.gap=0;d.mult=1;return;
 }
 const forward=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a),side=Math.abs(c.vy*Math.cos(c.a)-c.vx*Math.sin(c.a));
 const angle=Math.atan2(side,forward),meters=Math.hypot(dx,dy);
 if(forward>35&&side>10&&c.speed>55&&angle>.14&&angle<1.24&&meters>35*dt&&meters<=520*dt){
 d.hold+=dt;d.gap=0;d.mult=d.hold>=2.3?3:d.hold>=1.2?2:d.hold>=.55?1.5:1;
 d.chain+=meters*(.7+angle)*d.mult;
 }else if(d.chain>0){d.gap+=dt;if(d.gap>=.55)bankDrift(d)}
}
export function advanceContest(s,input,dt,levels){
 if(s.done)return;
 if(s.count>0){s.count=Math.max(0,s.count-dt);return}
 s.t+=dt;const p=s.player,{x,y}=p;step(p,input,dt,levels);
 if(s.e.type==='drift'){scoreSlide(s.drift,p,s.e.zone,p.x-x,p.y-y,dt);if(s.t>=s.e.limit){bankDrift(s.drift);s.done=true}return}
 checkGate(p,s.e,x,y,s.t);for(const bot of s.bots)botStep(bot,s.e,dt,s.t);s.place=position(s);s.done=p.finish!==null;
}
export function finishOpponents(s){
 // Continue their identical controller on the closed course after the player finishes.
 for(let n=1;n<=60*120&&s.bots.some(c=>c.finish===null);n++)
 for(const c of s.bots)botStep(c,s.e,1/60,s.t+n/60);
}
export function award(s,state){
 if(!s.done||s.paid)return null;
 s.paid=true;const {e,player:p,drift:d}=s;let pay=0,fields={};
 if(e.type==='race'){pay=Math.round(e.reward*([1,.62,.29,.12][s.place-1]));fields={place:s.place,time:p.finish}}
 if(e.type==='trial'){pay=Math.round(e.reward*({'Золото':1,'Серебро':.75,'Бронза':.5,'Без медали':.2}[medal(e,p.finish)]));fields={time:p.finish}}
 if(e.type==='drift'){pay=Math.round(e.reward*clamp(d.total/e.goal,0,1));fields={score:d.total,combo:d.best}}
 const records=state.records[e.id]||={};let improved=false;
 for(const [k,value] of Object.entries(fields)){if(value<=0)continue;
 if(!records[k]||(['score','combo'].includes(k)?value>records[k].value:value<records[k].value)){records[k]={value,model:p.model};improved=true}}
 state.money+=pay;return {pay,improved};
}
