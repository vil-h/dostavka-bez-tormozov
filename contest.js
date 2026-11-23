import {pointAt,project,nextTurn} from './routing.js';
import {events,medal,difficulties,raceKey} from './challenges.js';
import {start,jobs,step,clamp,edge} from './game.js';
import {stockCar,vehicles} from './vehicles.js';
const stock=stockCar('van').levels;
const profiles=[
 {pace:.94,entry:148,braking:165,line:6,response:2.65,error:.12},
 {pace:1,entry:161,braking:222,line:12,response:2.85,error:.34},
 {pace:1,entry:175,braking:205,line:9,response:3.12,error:.07}
];
const paceScale={rookie:.64,normal:.90,pro:1};
export function newContest(id,model,rng=Math.random,difficulty='normal'){
 if(!Object.hasOwn(difficulties,difficulty))difficulty='normal';
 const e=events[id], [x,y]=e.points[0];
 const angle=Math.atan2(e.points[1][1]-y,e.points[1][0]-x),dx=Math.cos(angle),dy=Math.sin(angle);
 function driver(m,back,lane){const c=start(jobs[0]);Object.assign(c,{model:m,j:null,x:x-back*dx-lane*dy,y:y-back*dy+lane*dx,a:angle,progress:0,off:false,missed:false,gate:0,split:0,finish:null});return c}
 const player=driver(model,0,0);player.a=Math.atan2(e.points[1][1]-y,e.points[1][0]-x);
 const bots=(e.rivals||[]).map((name,i)=>{
 const body=id==='express'?'coupe':['hatch','van','coupe'][i],car=driver(body,i===2?58:24,i===0?-22:i===1?22:-6);
 const profile=profiles[i],scale=id==='express'&&difficulty==='normal'?.93:paceScale[difficulty],levels=stockCar(body).levels;
 if(id==='express'&&i===1){levels.engine=2;levels.brakes=1}
 const cruise=(292+28*levels.engine)*vehicles[body].top*profile.pace*scale*(.985+.015*rng());
 const errors=e.turns.map(()=>rng()<profile.error*(difficulty==='rookie'?1.8:difficulty==='pro'?.4:1)?rng():0);
 return Object.assign(car,{name,cruise,lane:[-7,8,0][i],phase:rng()*6,sharp:profile.response,profile,levels,scale,errors})
 });
 return {e,player,bots,difficulty,count:3,t:0,done:false,paid:false,place:1,drift:{total:0,chain:0,hold:0,gap:0,mult:1,best:0},fx:{marks:[],smoke:[]}};
}
export function checkGate(c,e,oldX,oldY,time){
 const g=e.gates[c.gate];if(!g||c.finish!==null)return false;
 const moved=Math.hypot(c.x-oldX,c.y-oldY),range=100+moved;
 const near=project(e,c.x,c.y,Math.max(0,c.progress-range),Math.min(e.length,c.progress+range));
 c.off=near.gap>70;
 if(!c.off)c.progress=near.s;
 else {const road=project(e,c.x,c.y);if(road.gap<65&&road.s>g.s+50)c.missed=true}
 const before=(oldX-g.x)*g.dx+(oldY-g.y)*g.dy,after=(c.x-g.x)*g.dx+(c.y-g.y)*g.dy;
 if(c.progress>g.s+45)c.missed=true;
 if(before>=0||after<0)return false;
 const f=-before/(after-before),crossX=oldX+(c.x-oldX)*f,crossY=oldY+(c.y-oldY)*f;
 if(Math.abs((crossX-g.x)*g.dy-(crossY-g.y)*g.dx)>g.width){if(Math.abs(c.progress-g.s)<90||(c.off&&Math.abs(c.progress-g.s)<360&&Math.hypot(c.x-g.x,c.y-g.y)<450))c.missed=true;return false}
 if(Math.abs(c.progress-g.s)>80)return false;
 c.gate++;c.missed=false;c.split=time;if(c.gate===e.gates.length)c.finish=time;return true;
}
export function recover(s){
 const c=s.player,e=s.e;if(e.zone||s.done||s.count>0||(!c.off&&!c.missed&&!(c.stuck>2)))return false;
 const prev=c.gate?e.gates[c.gate-1].s:0;
 const global=project(e,c.x,c.y),at=Math.min(c.progress,prev,global.s),p=pointAt(e,at);
 Object.assign(c,{x:p.x,y:p.y,a:Math.atan2(p.dy,p.dx),progress:at,vx:0,vy:0,speed:0,stuck:0,off:false,missed:false});for(let i=0;i<300;i++)for(const bot of s.bots)botStep(bot,e,1/60,s.t+(i+1)/60);s.t+=5;s.place=position(s);return true
}
export function botInput(c,e,t){
 if(c.profile)return rivalInput(c,e);
 const finish=e.segments.at(-1),to=pointAt(e,c.progress+Math.max(42,c.speed*.53)),side=c.lane+3*Math.sin(t*.8+c.phase);
 const beyond=c.progress>e.length-55?45:0;
 const x=to.x-to.dy*side+finish.dx*beyond,y=to.y+to.dx*side+finish.dy*beyond;
 const a=Math.atan2(y-c.y,x-c.x)-c.a,delta=Math.atan2(Math.sin(a),Math.cos(a)),turn=nextTurn(e,c);
 const limit=turn?Math.max(90,185/Math.max(.65,turn.angle)+(turn.s-c.progress-55)*.9):c.cruise;
 const speed=Math.min(c.cruise,limit)/(1+Math.abs(delta)*.75);
 return {turn:clamp(delta*c.sharp,-1,1),gas:c.speed<speed,brake:c.speed>speed+9};
}
function rivalInput(c,e){
 const {profile,scale}=c;
 // Preview the approach and keep steering through the apex until the exit.
 const i=e.turns.findIndex(v=>v.s>c.progress-26),turn=e.turns[i];
 const remaining=turn?turn.s-c.progress:Infinity,err=c.errors[i]||0;
 const approach=clamp(1-Math.abs(remaining)/175,0,1),sign=turn?.dir==='НАПРАВО'?1:-1;
 const side=c.lane+clamp((85-remaining)/50,-1,1)*sign*approach*profile.line+err*5*approach;
 const ahead=Math.max(43,c.speed*(.43+.06*scale)),to=pointAt(e,c.progress+ahead);
 const beyond=Math.max(0,c.progress+ahead-e.length);
 const x=to.x+to.dx*beyond-to.dy*side,y=to.y+to.dy*beyond+to.dx*side;
 const angle=Math.atan2(y-c.y,x-c.x)-c.a,delta=Math.atan2(Math.sin(angle),Math.cos(angle));
 const apex=turn?Math.min(c.cruise,profile.entry*scale/Math.sqrt(Math.max(.18,turn.angle))):c.cruise;
 const braking=profile.braking*scale*vehicles[c.model].brake;
 const target=Math.min(c.cruise,Math.sqrt(apex*apex+2*braking*Math.max(0,remaining-48+err*23)));
 const speed=target/(1+Math.abs(delta)*(.42+err*.28));
 return {turn:clamp(delta*c.sharp,-1,1),gas:c.speed<speed-1,brake:target<c.cruise-1&&c.speed>speed+(c.braking?1:11)}
}
function botStep(c,e,dt,time){if(c.finish!==null)return;const {x,y}=c;const input=botInput(c,e,time);c.braking=input.brake;step(c,input,dt,c.levels||stock);checkGate(c,e,x,y,time)}
function distance(c,e){
 return Math.min(c.progress,e.gates[c.gate]?.s??e.length)
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
 if((d.handTime||0)<1.1&&forward>35&&side>10&&c.speed>55&&angle>.14&&angle<1.24&&meters>35*dt&&meters<=520*dt){
 d.hold+=dt;d.gap=0;d.mult=d.hold>=2.3?3:d.hold>=1.2?2:d.hold>=.55?1.5:1;
 d.chain+=meters*(.7+angle)*d.mult;
 }else if(d.chain>0){d.gap+=dt;if(d.gap>=.55)bankDrift(d)}
}
export function advanceContest(s,input,dt,levels){
 if(s.done)return;
 if(s.count>0){s.count=Math.max(0,s.count-dt);return}
 s.t+=dt;const p=s.player,{x,y}=p;step(p,input,dt,levels);p.stuck=input.gas&&p.speed<14?(p.stuck||0)+dt:0;
 if(s.e.type==='drift'){s.drift.handTime=input.hand?(s.drift.handTime||0)+dt:0;scoreSlide(s.drift,p,s.e.zone,p.x-x,p.y-y,dt);if(s.t>=s.e.limit){bankDrift(s.drift);s.done=true}return}
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
 if(e.type==='race'){pay=Math.round(e.reward*difficulties[s.difficulty].pay*([1,.62,.29,.12][s.place-1]));fields={place:s.place,time:p.finish}}
 if(e.type==='trial'){pay=Math.round(e.reward*({'Золото':1,'Серебро':.75,'Бронза':.5,'Без медали':.2}[medal(e,p.finish)]));fields={time:p.finish}}
 if(e.type==='drift'){pay=Math.round(e.reward*clamp(d.total/e.goal,0,1));fields={score:d.total,combo:d.best}}
 const records=state.records[raceKey(e,s.difficulty)]||={};let improved=false;
 for(const [k,value] of Object.entries(fields)){if(value<=0)continue;
 if(!records[k]||(['score','combo'].includes(k)?value>records[k].value:value<records[k].value)){records[k]={value,model:p.model};improved=true}}
 state.money+=pay;return {pay,improved};
}
