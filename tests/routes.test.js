import test from 'node:test';
import assert from 'node:assert/strict';
import {events} from '../challenges.js';
import {newContest,checkGate,recover,advanceContest} from '../contest.js';
import {pointAt,guidance,project} from '../routing.js';
import {roadEdge} from '../geography.js';
import {fresh,loadSave} from '../game.js';
const road=Object.values(events).filter(e=>!e.zone);
for(const e of road)test(e.name+' · линия на асфальте, ворота на прямых, подсказки по направлению',()=>{
 assert.ok(e.gates.length<e.points.length);assert.equal(e.gates.at(-1).s,e.length);
 for(let s=0;s<e.length;s+=4){const p=pointAt(e,s);assert.ok(roadEdge(p.x,p.y)<=0);assert.ok(Math.abs(project(e,p.x,p.y).s-s)<.01)}
 for(const g of e.gates){assert.ok(g.width>=40);assert.ok(e.turns.every(t=>Math.abs(t.s-g.s)>65))}
 for(const t of e.turns){const c={progress:t.s-10,speed:120};assert.ok(guidance(e,c).includes(t.dir));const a=pointAt(e,t.s-20),b=pointAt(e,t.s+20);
 assert.equal(t.dir,(a.dx*b.dy-a.dy*b.dx)>0?'НАПРАВО':'НАЛЕВО')}
});
test('Скорость меняет дальность предупреждения, проеханный поворот больше не показывается',()=>{
 const e=events.sprint,s=e.turns[0].s-370;assert.ok(guidance(e,{progress:s,speed:30}).includes('ПРЯМО'));assert.ok(guidance(e,{progress:s,speed:180}).includes('НАПРАВО'));
 assert.ok(!guidance(e,{progress:e.turns[0].s+8,speed:180}).includes('НАПРАВО'))
});
test('Обе обочины засчитываются, обход квартала сообщает о пропуске, финиш остаётся закрыт',()=>{
 const e=events.sprint,g=e.gates[0];
 for(const side of [-1,1]){const c=newContest('sprint','van').player;Object.assign(c,{progress:g.s-2,x:g.x+2,y:g.y+side*(g.width-1)});assert.ok(checkGate(c,e,g.x-2,c.y,4))}
 const c=newContest('sprint','van').player;Object.assign(c,{progress:260,x:g.x+3,y:150});assert.ok(!checkGate(c,e,g.x-3,150,4));assert.ok(c.missed);assert.match(guidance(e,c),/пропущена/);
 const last=e.gates.at(-1);c.x=last.x+3;c.y=last.y;assert.ok(!checkGate(c,e,last.x-3,c.y,8));assert.equal(c.finish,null);assert.equal(c.gate,0)
});
test('Возврат только назад, ворота сохраняются, соперники едут во время штрафа',()=>{
 const s=newContest('sprint','van'),c=s.player;s.count=0;assert.equal(recover(s),false);
 Object.assign(c,{gate:1,progress:680,off:true,x:1020,y:470,speed:130,vx:130});assert.ok(recover(s));assert.equal(s.t,5);assert.equal(c.gate,1);assert.equal(c.speed,0);assert.equal(c.vx,0);
 assert.ok(c.progress<=s.e.gates[0].s);assert.ok(roadEdge(c.x,c.y)<0);assert.ok(s.bots.every(b=>b.progress>0));assert.equal(recover(s),false)
});
test('20 загородных стартов · физический финиш обоих соперников',()=>{
 for(let i=0;i<20;i++){let seed=i+1;const s=newContest('express','van',()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 for(let n=0;n<6000&&s.bots.some(b=>b.finish===null);n++){const old=s.bots.map(c=>[c.x,c.y,c.gate]);advanceContest(s,{},1/60,freshLevels);
 s.bots.forEach((b,j)=>{assert.ok(Math.hypot(b.x-old[j][0],b.y-old[j][1])<7);assert.ok(b.gate<=old[j][2]+1)})}
 assert.ok(s.bots.every(b=>b.gate===s.e.gates.length&&b.finish>45))}
});
const freshLevels=fresh().levels;
test('Прежние и новые результаты всех трасс разделены, миграция не меняет кошелёк',()=>{
 const state=fresh();state.money=4582;for(const e of road){state.records[e.id]={time:{model:'van',value:70}};state.records[e.record]={time:{model:'coupe',value:65}}}
 const loaded=loadSave(JSON.stringify(state));assert.deepEqual(loaded.records,state.records);assert.equal(loaded.money,4582)
});
