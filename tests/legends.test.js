import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegends,moveLegends} from '../legends.js';
import {roadEdge} from '../geography.js';
import {pointAt} from '../routing.js';
import {jobs,start,fresh,loadSave} from '../game.js';
const player={free:true,x:400,y:490};
test('Рейсы и сохранения · независимые NPC появляются на безопасном расстоянии',()=>{
 assert.equal(jobs.length,12);assert.deepEqual(createLegends(start(jobs[0])),[]);const state=fresh();
 for(const j of jobs){assert.ok(createLegends(start(j)).every(c=>Math.hypot(c.x-start(j).x,c.y-start(j).y)>1000));state.best[j.id]={score:83,time:21}}
 assert.deepEqual(loadSave(JSON.stringify(state)).best,state.best);
 for(const j of jobs.slice(9)){assert.ok(roadEdge(start(j).x,start(j).y)<=0);assert.equal(createLegends(start(j)).length,2)}
});
test('20 минут свободного движения: замкнутые маршруты, стыки, выбор дорог и обочины',()=>{
 const cars=createLegends(player);let max=0;for(let n=0;n<72000;n++){
 const prev=cars.map(c=>[c.x,c.y]);moveLegends(cars,1/60,player,[],()=>.9);
 cars.forEach((c,i)=>{const d=Math.hypot(c.x-prev[i][0],c.y-prev[i][1]);if(Math.hypot(prev[i][0]-player.x,prev[i][1]-player.y)<1550)assert.ok(d<7);
 assert.ok(roadEdge(c.x,c.y)<8);max=Math.max(max,c.x)})
 }assert.ok(cars.every(c=>c.laps>5));assert.ok(max>8100)
});
test('Свободная встречная полоса позволяет обойти тихоход и вернуться вправо',()=>{
 const c=createLegends(player)[0];c.s=1200;c.speed=200;const q=pointAt(c.route,c.s);Object.assign(c,{x:q.x,y:q.y+16,a:0});
 const by={x:q.x+26,y:q.y+240},slow={x:q.x+130,y:q.y+16};let left=false,gap=Infinity;
 for(let n=0;n<240;n++){slow.x+=55/60;moveLegends([c],1/60,by,[slow]);if(c.lane<-15)left=true;gap=Math.min(gap,Math.hypot(c.x-slow.x,c.y-slow.y))}
 assert.ok(left&&c.x>slow.x+60&&c.lane>14);assert.ok(gap>=26)
});
test('При встречной машине водитель уступает и снижает скорость',()=>{
 const c=createLegends(player)[0];c.s=1200;c.speed=200;const q=pointAt(c.route,c.s);Object.assign(c,{x:q.x,y:q.y+16,a:0});
 const slow={x:q.x+75,y:q.y+16},oncoming={x:q.x+125,y:q.y-18};
 for(let n=0;n<60;n++)moveLegends([c],1/60,{x:q.x,y:q.y+250},[slow,oncoming]);
 assert.ok(c.lane>13);assert.ok(c.speed<55);assert.ok(c.x<slow.x-24)
});
