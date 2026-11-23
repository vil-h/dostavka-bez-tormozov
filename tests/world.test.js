import test from 'node:test';
import assert from 'node:assert/strict';
import {roads,roadEdge,travel,outposts} from '../geography.js';
import {roadTraffic,advanceRoadTraffic,makeOffer,freeRide} from '../city.js';
import {newContest,advanceContest,botInput,finishOpponents,award} from '../contest.js';
import {stockCar,vehicles} from '../vehicles.js';
import {fresh,loadSave} from '../game.js';
const dt=1/60;
test('Оба въезда, стыки и поверхность всей сети совпадают с линиями отрисовки',()=>{
 for(const {points,width} of roads)for(let i=1;i<points.length;i++){
 const [x,y]=points[i-1],[a,b]=points[i];for(let n=0;n<=100;n++)assert.ok(roadEdge(x+(a-x)*n/100,y+(b-y)*n/100)<=-width/2+.001)}
 assert.equal(roadEdge(3100,528),0);assert.equal(roadEdge(3100,534),6);assert.ok(roadEdge(3100,539)>9);
 assert.ok(roadEdge(1830,810)>9);assert.ok(roadEdge(150,2500)>9);
});
test('Сеть заказов возвращает путь по реальным дорогам до каждой новой точки',()=>{
 for(const a of [['Депо',480,490],...outposts])for(const b of outposts){const route=travel(a,b);assert.ok(route.cost>=route.d);
 for(const [i,p] of route.via.entries()){assert.ok(roadEdge(...p)<0);if(i){const q=route.via[i-1];assert.ok(roadEdge((p[0]+q[0])/2,(p[1]+q[1])/2)<0)}}}
 const r=freeRide();[r.x,r.y]=outposts[2].slice(1);const j=makeOffer(r);assert.equal(j.type,'fridge');assert.equal(j.place,'Весовая');assert.ok(j.time>travel(outposts[2],outposts[1]).d/90);
});
test('Загородные полосы замкнуты, встречные машины остаются на полотне',()=>{
 const cars=roadTraffic();assert.equal(cars.length,8);assert.equal(new Set(cars.map(c=>c.lane)).size,2);
 for(let i=0;i<22000;i++)for(const c of cars){const old={x:c.x,y:c.y};advanceRoadTraffic([c],dt,old);assert.ok(Math.hypot(c.x-old.x,c.y-old.y)<3);assert.ok(roadEdge(c.x,c.y)<=0)}
});
for(const id of ['express','serp'])for(const model of Object.keys(vehicles))test(id+' · '+model+' · реальные ворота и финиш',()=>{
 const s=newContest(id,model,()=>.4),p=s.player;Object.assign(p,{lane:0,phase:.2,sharp:2.7,cruise:265});
 for(let i=0;i<7200&&!s.done;i++)advanceContest(s,botInput(p,s.e,s.t),dt,stockCar(model).levels);
 assert.equal(p.gate,s.e.gates.length);assert.ok(p.finish>45&&p.finish<90);finishOpponents(s);
 for(const c of s.bots){assert.equal(c.gate,s.e.gates.length);assert.ok(c.finish>45&&c.finish<90)}
 if(model==='van'&&id==='express')assert.equal(s.place,1);
 const state=fresh();assert.ok(award(s,state).pay>0);assert.equal(award(s,state),null);assert.deepEqual(loadSave(JSON.stringify(state)).records,state.records)
});
test('Архив дрифта 1.4 и рекорды 1.5 переживают загрузку вместе',()=>{
 const d=fresh(),score={value:310,model:'hatch'};d.schema=4;d.records={slide:{score},slide15:{score:{...score,value:530}}};
 assert.deepEqual(loadSave(JSON.stringify(d)).records,d.records)
});
