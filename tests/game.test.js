import test from 'node:test';
import assert from 'node:assert/strict';
import {jobs,cargo,start,fresh,step,result,impact,buy,cost,loadSave,settle,edge} from '../game.js';
const levels=fresh().levels, dt=1/60;
for(const model of ['van','hatch','coupe','pickup'])for(const j of jobs)test(model+' · Рейс '+(j.id+1)+' · '+j.name,()=>{
 const r=start(j);r.model=model;
 // Follow marked road lanes. Slow down at the pickup, corner and destination.
 const path=j.via||[j.start,[j.end[0],j.start[1]],j.end];
 let i=0;
 for(let n=0;n<j.time*60&&!r.done;n++){
  const [x,y]=path[i],d=Math.hypot(x-r.x,y-r.y);
  const a=Math.atan2(y-r.y,x-r.x)-r.a,delta=Math.atan2(Math.sin(a),Math.cos(a));
  const limit=Math.min(166,Math.max(42,d*1.15))/(1+Math.abs(delta));
  step(r,{gas:r.speed<limit,brake:r.speed>limit+12,turn:Math.max(-1,Math.min(1,delta*2.5))},dt,levels);
  if(i===0&&r.loaded)i++;else if(i>0&&i<path.length-1&&d<26)i++;
 }
 assert.equal(r.done,'success');assert.ok(r.hp>0);
 const s=fresh();settle(s,r);const paid=s.money;assert.ok(paid>0);settle(s,r);assert.equal(s.money,paid);assert.ok(s.best[j.id]);
});
test('Разгон, тормоза и двигатель',()=>{
 function drive(l,brake=false){const r=start(jobs[0]);r.x=540;r.vx=95;for(let i=0;i<10;i++)step(r,{gas:!brake,brake},dt,l);return r.speed}
 assert.ok(drive({...levels,engine:3})>drive(levels));assert.ok(drive({...levels,brakes:3},true)<drive(levels,true));
});
test('Ручник и сцепление меняют боковое скольжение',()=>{
 const slide=(l,hand)=>{const r=start(jobs[0]);r.vx=140;r.vy=25;for(let i=0;i<10;i++)step(r,{turn:1,hand},dt,l);return r.drift};
 assert.ok(slide(levels,true)>slide(levels,false));assert.ok(slide({...levels,grip:3},false)<slide(levels,false));
});
test('Пять грузов по-разному реагируют на езду',()=>{
 const runs={};for(const type of Object.keys(cargo)){const r=start({...jobs[0],type});r.loaded=true;r.vx=180;for(let i=0;i<15;i++)step(r,{turn:1,brake:true},dt,levels);runs[type]=r}
 assert.ok(runs.fridge.speed>runs.parcel.speed);assert.ok(runs.cake.tilt>0);assert.ok(runs.vase.hp<runs.parcel.hp);
 impact(runs.tank,100,levels);impact(runs.parcel,100,levels);assert.ok(runs.tank.hp<runs.parcel.hp);
 const cake=start({...jobs[0],type:'cake'});cake.loaded=true;cake.vx=220;cake.tilt=1;step(cake,{turn:1},dt,levels);assert.ok(cake.hp<100)
});
test('Удар, защита и снижение награды',()=>{
 const r=start(jobs[0]);r.loaded=true;r.done='success';const max=result(r).pay;
 const safe={...r};impact(r,120,levels);impact(safe,120,{...levels,guard:3});assert.ok(safe.hp>r.hp);assert.ok(result(r).pay<max);
});
test('Обочина, подвеска, стены и трафик',()=>{
 const r=start(jobs[0]);r.x=620;r.y=532;r.vx=150;r.loaded=true;
 assert.ok(edge(r.x,r.y)>0);const better={...r};step(r,{},dt,levels);step(better,{},dt,{...levels,suspension:3});assert.ok(better.hp>r.hp&&better.speed>r.speed);
 r.vy=140;r.y=537;step(r,{},dt,levels);assert.ok(r.hit);
 const c=start(jobs[0]);step(c,{},dt,levels,[{x:c.x,y:c.y}]);assert.ok(c.hit)
});
test('Гараж, сохранения и повторный запуск',()=>{
 const s=fresh();assert.equal(buy(s,'grip'),false);s.money=3000;for(let l=0;l<3;l++){const old=s.money;assert.ok(buy(s,'grip'));assert.equal(old-s.money,cost(l))}assert.equal(buy(s,'grip'),false);
 s.best[0]={score:83,time:18};s.music=0;assert.deepEqual(loadSave(JSON.stringify(s)),s);assert.deepEqual(loadSave('{'),fresh());
 const r=start(jobs[0]);r.t=55;step(r,{},dt,levels);assert.equal(r.done,'fail');assert.equal(start(jobs[0]).t,0)
});
