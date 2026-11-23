import test from 'node:test';
import assert from 'node:assert/strict';
import {newContest,checkGate,advanceContest,position,scoreSlide,bankDrift,award,botInput,finishOpponents} from '../contest.js';
import {events,medal} from '../challenges.js';
import {vehicles,stockCar} from '../vehicles.js';
import {fresh,loadSave,buy,edge} from '../game.js';
const stock=stockCar('van').levels,dt=1/60;
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
test('Решётка на асфальте, замороженный старт, повтор с нуля',()=>{
 const s=newContest('night','pickup');for(const c of [s.player,...s.bots])assert.ok(edge(c.x,c.y)<0);
 const coords=s.bots.map(c=>[c.x,c.y]);for(let i=0;i<180;i++)advanceContest(s,{gas:true},dt,stock);assert.deepEqual(coords,s.bots.map(c=>[c.x,c.y]));assert.equal(s.player.speed,0);
 for(let i=0;i<30;i++)advanceContest(s,{gas:true},dt,stock);assert.ok(s.player.speed>0);const next=newContest('night','pickup');assert.equal(next.t,0);assert.equal(next.fx.smoke.length,0)
});
test('Ворота требуют порядка, нужного направления и ширины улицы',()=>{
 const s=newContest('sprint','van'),p=s.player,e=s.e;const last=e.gates.at(-1);p.x=last.x+3;p.y=last.y;assert.ok(!checkGate(p,e,last.x-3,last.y,1));const g=e.gates[0];
 p.progress=g.s-1;p.x=g.x-1;p.y=g.y;assert.ok(!checkGate(p,e,g.x+1,g.y,1));p.x=g.x+1;p.y=g.y+70;assert.ok(!checkGate(p,e,g.x-1,p.y,1));
 p.y=g.y;assert.ok(checkGate(p,e,g.x-1,g.y,1));assert.equal(p.gate,1);assert.equal(p.finish,null)
});
for(const id of ['sprint','night'])test('30 стартов: все соперники проходят повороты и финиш · '+id,()=>{
 for(let seed=1;seed<=30;seed++){const s=newContest(id,'van',rng(seed));let n=0;
 while(s.bots.some(c=>c.finish===null)&&n++<7200){
 const old=s.bots.map(c=>[c.x,c.y,c.gate]);advanceContest(s,{},dt,stock);
 s.bots.forEach((c,i)=>{assert.ok(Math.hypot(c.x-old[i][0],c.y-old[i][1])<7);assert.ok(c.gate-old[i][2]<=1)})
 }for(const bot of s.bots){assert.equal(bot.gate,s.e.gates.length,'seed '+seed);assert.ok(bot.finish>0)}
 assert.equal(position(s),s.bots.length+1)}
});
for(const model of Object.keys(vehicles))for(const id of ['sprint','night','clock'])test('Завершение маршрута · '+id+' · '+model,()=>{
 const s=newContest(id,model,rng(21)),p=s.player;Object.assign(p,{lane:0,phase:0,sharp:2.7,cruise:200});
 for(let n=0;n<7200&&!s.done;n++)advanceContest(s,botInput(p,s.e,s.t),dt,stock);
 assert.ok(s.done);assert.equal(p.gate,s.e.gates.length);if(id==='sprint'&&model==='van')assert.equal(s.place,1);
 finishOpponents(s);assert.ok(s.bots.every(c=>c.finish!==null));const state=fresh(),v=award(s,state);assert.ok(v.pay>0&&v.improved);assert.equal(award(s,state),null);assert.equal(v.pay,state.money);
 assert.deepEqual(loadSave(JSON.stringify(state)).records,state.records)
});
test('Остановка, прямой ход, задний ход и микродвижения не дают очков',()=>{
 const {drift:d,e,player:c}=newContest('slide','hatch');for(const [vx,vy,dx] of [[0,0,0],[95,0,1.5],[-95,25,-1.5],[100,30,.01]]){
 Object.assign(c,{vx,vy,speed:Math.hypot(vx,vy)});for(let i=0;i<100;i++)scoreSlide(d,c,e.zone,dx,0,dt);assert.equal(d.chain,0)}
});
test('Цепочка нарастает, переносит коррекцию, фиксируется и сбрасывается при ударе или выезде',()=>{
 const {drift:d,e,player:c}=newContest('slide','hatch');Object.assign(c,{vx:100,vy:35,speed:106});
 const slide=()=>scoreSlide(d,c,e.zone,1.6,.5,dt);
 for(let i=0;i<240;i++)slide();assert.equal(d.mult,3);const chain=d.chain;
 for(let i=0;i<20;i++)scoreSlide(d,c,e.zone,0,0,dt);assert.equal(d.chain,chain);
 for(let i=0;i<20;i++)scoreSlide(d,c,e.zone,0,0,dt);assert.equal(d.total,Math.floor(chain));slide();c.hit=true;slide();assert.equal(d.chain,0);
 c.hit=false;slide();c.x=150;slide();assert.equal(d.chain,0);
});
for(const id of ['slide','master'])for(const model of ['hatch','van','coupe','pickup'])test('Дрифт на физике · '+id+' · '+model,()=>{
 const s=newContest(id,model),p=s.player;let next=0,big=0;
 const pts=id==='slide'?[[840,470],[840,810],[480,810],[480,470]]:[[1170,810],[1170,1130],[1530,1130],[1530,810],[840,810],[840,1130],[1170,1130]];
 while(!s.done){const [x,y]=pts[next],dist=Math.hypot(x-p.x,y-p.y),angle=Math.atan2(y-p.y,x-p.x)-p.a,delta=Math.atan2(Math.sin(angle),Math.cos(angle));
 const limit=Math.min(160,Math.max(82,dist*1.4))/(1+Math.abs(delta)*.28);
 const control={gas:p.speed<limit+6,brake:p.speed>limit+18,turn:Math.max(-1,Math.min(1,delta*2.5)),hand:Math.abs(delta)>.55&&p.speed>62};
 advanceContest(s,control,1/60,stockCar(model).levels);if(dist<36)next=(next+1)%pts.length;big=Math.max(big,s.drift.chain)
 }assert.ok(s.drift.total>=Math.min(s.e.goal,650));assert.ok(big>20);assert.equal(award(s,fresh()).pay,Math.round(s.e.reward*Math.min(1,s.drift.total/s.e.goal)))
});
test('Миграция гаража, отдельные рекорды, старые деньги и покупка после приза',()=>{
 const old=fresh();old.money=500;old.garage.coupe=stockCar('coupe');old.selected='coupe';old.garage.coupe.levels.grip=2;delete old.records;old.schema=3;const s=loadSave(JSON.stringify(old));assert.ok(buy(s,'engine'));assert.equal(s.money,320);assert.deepEqual(s.records,{});assert.equal(s.garage.coupe.levels.grip,2);
 assert.equal(medal(events.clock,14),'Золото');assert.equal(medal(events.clock,19),'Серебро');assert.equal(medal(events.clock,26),'Бронза');
});
