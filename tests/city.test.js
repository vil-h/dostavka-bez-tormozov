import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,step,edge,loadSave,buy} from '../game.js';
import {freeRide,dispatch,makeOffer,acceptOffer,skipOffer,closeDelivery,createTraffic,advanceTraffic,green} from '../city.js';
const dt=1/60;
function sequence(){let seed=713;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
test('Свободная езда без дедлайна, штрафа или проигрыша',()=>{
 const r=freeRide(),s=fresh();for(let n=0;n<24000;n++)step(r,{gas:true,turn:.12},dt,s.levels);
 assert.ok(r.hits>1);assert.equal(r.hp,100);assert.equal(r.done,'');assert.equal(r.t,0);assert.equal(s.money,0)
});
test('2000 заказов на дорогах, четыре категории, пять грузов и запас времени',()=>{
 const r=freeRide(),rng=sequence(),types=new Set(),kinds=new Set();r.offersSeen=1;
 for(let n=0;n<2000;n++){const j=makeOffer(r,rng);types.add(j.type);kinds.add(j.kind);
 for(const [x,y] of [j.start,j.end])assert.ok(edge(x,y)<=0&&x>0&&y>0&&x<8400&&y<2900);
 const len=Math.abs(j.end[0]-j.start[0])+Math.abs(j.end[1]-j.start[1]);assert.ok(j.time>len/125+8);assert.ok(len>0&&j.pay>0)}
 assert.equal(types.size,5);assert.equal(kinds.size,4)
});
test('Пропуск и истечение предложения дают паузу между вызовами',()=>{
 const r=freeRide();dispatch(r,7);assert.ok(r.offer);skipOffer(r);assert.ok(!r.offer&&r.nextOffer>=24);dispatch(r,r.nextOffer);assert.ok(r.offer);dispatch(r,15);assert.ok(!r.offer&&!r.j);assert.equal(acceptOffer(r),false);
});
test('Погрузка без лимита, доставка движением и единственная выплата',()=>{
 const r=freeRide(),s=fresh();s.best[2]={score:71,time:21};dispatch(r,7,()=>0);
 const origin=[r.x,r.y,r.vx,r.vy,r.a];assert.ok(acceptOffer(r));assert.deepEqual(origin,[r.x,r.y,r.vx,r.vy,r.a]);assert.equal(acceptOffer(r),false);
 for(let i=0;i<7200;i++)step(r,{},dt,s.levels);assert.equal(r.t,0);
 for(let i=0;i<2400&&!r.done;i++)step(r,{gas:r.speed<65},dt,s.levels);
 assert.equal(r.done,'success');const location=[r.x,r.y,r.vx,r.vy];assert.ok(closeDelivery(r,s));const paid=s.money;assert.ok(paid>=180);assert.equal(closeDelivery(r,s),false);
 assert.equal(s.money,paid);assert.deepEqual(location,[r.x,r.y,r.vx,r.vy]);assert.deepEqual(Object.keys(s.best),['2']);assert.ok(!r.j&&!r.done);
 assert.ok(buy(s,'engine'));assert.deepEqual(loadSave(JSON.stringify(s)),s)
});
test('Просроченный заказ освобождает машину и ничего не начисляет',()=>{
 const r=freeRide(),s=fresh();dispatch(r,8);acceptOffer(r);r.loaded=true;r.t=r.j.time;step(r,{},dt,s.levels);assert.equal(r.done,'fail');closeDelivery(r,s);assert.equal(r.j,null);assert.equal(s.money,0);assert.equal(r.done,'')
});
test('Трафик непрерывен, поворачивает в обе стороны и остаётся на дорогах',()=>{
 const cars=createTraffic(),rng=sequence(),turns=new Set();let stopped=false;
 for(let n=0;n<6000;n++){const prev=cars.map(c=>[c.x,c.y,c.d]);advanceTraffic(cars,dt,n*dt,null,rng);cars.forEach((c,i)=>{
 assert.ok(Math.hypot(c.x-prev[i][0],c.y-prev[i][1])<4);assert.ok(edge(c.x,c.y)<0);
 if(c.d!==prev[i][2])turns.add((c.d-prev[i][2]+4)%4);
 if(!c.curve&&(c.toI===2||c.toJ===1)&&!green(c.toI,c.toJ,c.d,n*dt)&&c.len-c.pos<7&&c.speed<2)stopped=true
 })}
 assert.equal(cars.length,10);assert.deepEqual([...turns].sort(),[1,3]);assert.ok(stopped)
});
test('Машина уступает препятствию в своей полосе',()=>{
 const [c]=createTraffic();const player={x:c.x+48,y:c.y};advanceTraffic([c],1,0,player);assert.equal(c.speed,0);advanceTraffic([c],dt,0,null);assert.ok(c.speed>0)
});
