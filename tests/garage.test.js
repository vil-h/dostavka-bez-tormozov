import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,loadSave,buy,impact,step,jobs,start} from '../game.js';
import {vehicles,purchase,selectCar,paintCar,stockCar,specs} from '../vehicles.js';
import {freeRide,makeOffer} from '../city.js';
test('Кошелёк, повторная покупка и выбор',()=>{
 const s=fresh();assert.deepEqual(Object.keys(s.garage),['van']);assert.equal(s.selected,'van');assert.ok(!purchase(s,'hatch'));assert.ok(!selectCar(s,'coupe'));
 s.money=900;assert.ok(purchase(s,'hatch'));assert.equal(s.money,0);assert.ok(!purchase(s,'hatch'));assert.ok(selectCar(s,'hatch'));assert.deepEqual(loadSave(JSON.stringify(s)),s)
});
for(const level of [0,1,3])test('Миграция уровней 1.0–1.2: '+level,()=>{
 const old={levels:{engine:level,brakes:level,grip:level,guard:level,suspension:level},money:6173,best:{1:{score:89,time:23}},sfx:.11,music:.33};
 if(level===3)old.controls={scheme:'buttons',size:1.15,opacity:.6,auto:true,swap:true,sensitivity:.75};
 const s=loadSave(JSON.stringify(old));assert.deepEqual(s.garage.van.levels,old.levels);assert.equal(s.money,6173);assert.deepEqual(s.best,old.best);assert.equal(s.sfx,.11);assert.equal(s.music,.33);if(old.controls)assert.deepEqual(s.controls,old.controls);
 assert.deepEqual(loadSave(JSON.stringify(s)),s);assert.deepEqual(Object.keys(s.garage),['van'])
});
test('Повреждение новых полей не затрагивает корректные записи',()=>{
 const s=loadSave(JSON.stringify({schema:3,money:577,selected:'missing',garage:{pickup:{levels:{brakes:2,guard:99},look:{color:'bad',decal:'bolt'}},hatch:false},levels:{engine:2}}));
 assert.equal(s.selected,'van');assert.equal(s.money,577);assert.equal(s.levels.engine,2);assert.deepEqual(Object.keys(s.garage),['van','pickup']);assert.equal(s.garage.pickup.look.decal,'bolt');assert.equal(s.garage.pickup.look.color,vehicles.pickup.color);assert.equal(s.garage.pickup.levels.brakes,2)
});
test('Улучшения и три вида тюнинга изолированы между автомобилями',()=>{
 const s=fresh();s.money=3000;purchase(s,'hatch');assert.ok(buy(s,'engine','hatch'));assert.equal(s.money,1920);assert.equal(s.levels.engine,0);
 for(const [key,value] of [['color','#353b42'],['rims','sport'],['decal','geo']])assert.ok(paintCar(s,'hatch',key,value));
 assert.ok(!paintCar(s,'pickup','rims','sport'));assert.ok(!paintCar(s,'hatch','rims','broken'));assert.deepEqual(s.garage.van,stockCar('van'));assert.deepEqual(loadSave(JSON.stringify(s)),s);
});
test('Смена на парковке, сохранение позиции и запрет во время заказа',()=>{
 const s=fresh(),r=freeRide();s.money=900;purchase(s,'hatch');r.vx=30;assert.ok(!selectCar(s,'hatch',r));r.vx=1;r.j=jobs[0];assert.ok(!selectCar(s,'hatch',r));r.j=null;const pos=[r.x,r.y,r.a];assert.ok(selectCar(s,'hatch',r));assert.deepEqual([r.x,r.y,r.a],pos);assert.equal(r.speed,0);assert.equal(r.vx,0)
});
test('Масса, скорость, защита, хрупкие грузы и время случайных заказов',()=>{
 const data={};
 for(const id of Object.keys(vehicles)){
 const levels=stockCar(id).levels,r=start(jobs[0]);r.model=id;
 const drive=type=>{const a={...r,j:{...r.j,type},loaded:true};for(let i=0;i<15;i++)step(a,{gas:true},1/60,levels);return a.speed};
 const empty=drive('parcel');r.loaded=true;impact(r,100,levels);
 data[id]={empty,heavy:drive('fridge')/empty,health:r.hp,max:specs(id,levels).speed,time:makeOffer({...freeRide(),model:id},()=>.7).time};
 }
 assert.ok(data.hatch.empty>data.van.empty);assert.ok(data.coupe.max>data.hatch.max);assert.ok(data.pickup.heavy>data.hatch.heavy);assert.ok(data.pickup.health>data.coupe.health);assert.ok(data.pickup.time>=data.van.time);
});
