import test from 'node:test';
import assert from 'node:assert/strict';
import {circuits,modes,simulate} from '../qa/balance.mjs';
import {newContest,advanceContest,award} from '../contest.js';
import {vehicles,stockCar} from '../vehicles.js';
import {fresh,loadSave} from '../game.js';
import {raceKey} from '../challenges.js';
const levels=stockCar('van').levels,dt=1/60;
for(const id of circuits)for(const mode of modes)test(id+' · '+mode+' · 24 стартовые сетки',()=>{
 for(let seed=1;seed<=24;seed++){
 let n=seed;const s=newContest(id,'van',()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296),mode);
 let impacts=0;for(let frame=0;frame<6600&&s.bots.some(c=>c.finish===null);frame++){
 const old=s.bots.map(c=>[c.x,c.y,c.gate]);advanceContest(s,{},dt,levels);
 for(const [i,c] of s.bots.entries()){
 const cap=(292+c.levels.engine*28)*vehicles[c.model].top;
 assert.ok(c.speed<=cap+3);assert.ok(Math.hypot(c.x-old[i][0],c.y-old[i][1])<=(cap+3)*dt);
 assert.ok(c.gate-old[i][2]>=0&&c.gate-old[i][2]<=1);if(c.hit)impacts++
 }}
 assert.ok(s.bots.every(b=>b.gate===s.e.gates.length&&b.finish>0));assert.ok(impacts<=1);assert.equal(s.place,s.bots.length+1)
 }});
for(const id of circuits)test(id+' · риск ошибки и доступность победы',()=>{
 assert.equal(simulate(id,'normal').place,1);assert.ok(simulate(id,'normal','one').place>1);
 for(const mode of ['normal','pro']){assert.ok(simulate(id,mode,'three').place>1);assert.ok(simulate(id,mode,'three','coupe',19,true).place>1)}
 const record=simulate(id,'pro','clean','coupe',19,true);assert.equal(record.place,1);
 for(const model of Object.keys(vehicles))assert.ok(simulate(id,'normal','clean',model).time>0)
});
test('Соперники не подстраиваются под игрока; камбэк определяется движением',()=>{
 const a=simulate('express','normal'),b=simulate('express','normal','careful');a.bots.forEach((v,i)=>assert.ok(Math.abs(v-b.bots[i])<1e-8));
 const r=simulate('night','normal','comeback');assert.ok(r.place<r.worst)
});
test('Сложность и архив сохраняются, приз выдаётся один раз',()=>{
 const state=loadSave(JSON.stringify({difficulty:'invalid',money:400,records:{sprint151:{time:{value:8,model:'van'}}}}));assert.equal(state.difficulty,'normal');
 for(const d of modes){const s=newContest('sprint','van',()=>.5,d);s.done=true;s.player.finish=8;s.place=1;
 const v=award(s,state);assert.equal(v.pay,{rookie:272,normal:320,pro:368}[d]);assert.equal(award(s,state),null);assert.ok(state.records[raceKey(s.e,d)])}
 state.difficulty='pro';assert.deepEqual(loadSave(JSON.stringify(state)),state);assert.equal(state.money,1360);assert.equal(fresh().difficulty,'normal')
});
