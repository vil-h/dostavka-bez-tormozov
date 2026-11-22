import test from 'node:test';
import assert from 'node:assert/strict';
import {bindWheel,createSteering,steerTarget,smoothSteering,driveInput} from '../input.js';
import {fresh,loadSave} from '../game.js';
const opts=fresh().controls;
test('Аналоговый ввод имеет мёртвую зону, пропорциональное усилие и предел',()=>{
 assert.equal(steerTarget(2,40,1),0);
 for(const sign of [-1,1]){
 const light=steerTarget(sign*12,40,1),medium=steerTarget(sign*26,40,1);
 assert.ok(light*sign>0&&medium*sign>light*sign&&medium*sign<1);
 assert.equal(steerTarget(sign*100,40,1.4),sign);
 assert.ok(steerTarget(sign*12,40,1.4)*sign>light*sign)
 }
});
for(const release of ['onpointerup','onpointercancel','onlostpointercapture']){
 test('Плавный захват, независимость пальцев и возврат · '+release,()=>{
 const el={clientWidth:120,setPointerCapture(){}},w=createSteering();
 bindWheel(el,w,()=>1);el.onpointerdown({pointerId:2,clientX:30,preventDefault(){}});
 el.onpointermove({pointerId:3,clientX:128});assert.equal(w.target,0);
 el.onpointermove({pointerId:2,clientX:128});smoothSteering(w,1/60);assert.ok(w.value>0&&w.value<1);
 el[release]({pointerId:3});assert.equal(w.target,1);
 el[release]({pointerId:2});for(let n=0;n<60;n++)smoothSteering(w,1/60);assert.equal(w.value,0);assert.equal(w.id,null);
 })
}
test('Газ, руль и ручник совмещаются, включая жест правым пальцем',()=>{
 const w={value:-.63};
 for(const set of [new Set(['gas','hand']),new Set(['slide'])])assert.deepEqual(driveInput(k=>set.has(k),w,opts,true),{gas:true,turn:-.63,hand:true,brake:false});
});
test('Автогаз отключается при торможении и паузе',()=>{
 const c={...opts,auto:true},w=createSteering();assert.ok(driveInput(()=>false,w,c,true).gas);
 assert.equal(driveInput(k=>k==='brake',w,c,true).gas,false);assert.deepEqual(driveInput(()=>true,w,c,false),{turn:0,gas:false,brake:false,hand:false});
});
test('Смена схемы сохраняет цифровой поворот клавиатуры',()=>{
 const w={value:.4};for(const scheme of ['buttons','wheel'])assert.equal(driveInput(k=>k==='left',w,{...opts,scheme},true).turn,-1);
 assert.equal(driveInput(()=>false,w,{...opts,scheme:'buttons'},true).turn,0);
 assert.equal(driveInput(()=>false,w,opts,true).gas,false)
});
test('Настройки и старый прогресс читаются из одной записи',()=>{
 const old=fresh();delete old.controls;old.money=819;old.levels.engine=2;old.best[0]={score:96,time:11};
 const s=loadSave(JSON.stringify(old));assert.deepEqual(s,{...old,controls:opts});
 s.controls={scheme:'buttons',auto:true,swap:true,opacity:.55,size:1.15,sensitivity:.8};
 assert.deepEqual(loadSave(JSON.stringify(s)),s);
});
