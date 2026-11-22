import test from 'node:test';
import assert from 'node:assert/strict';
import {bindPedals} from '../input.js';
test('Газ, поворот и ручник независимо удерживаются тремя касаниями',()=>{
 const buttons=['gas','left','hand'].map(key=>({dataset:{key},classList:{add(){},remove(){}},setPointerCapture(id){this.captured=id}}));
 const held=new Map();bindPedals(buttons,held,()=>{});
 buttons.forEach((b,i)=>b.onpointerdown({pointerId:i,preventDefault(){}}));
 assert.deepEqual([...held.values()],['gas','left','hand']);
 buttons[1].onpointerup({pointerId:1});assert.deepEqual([...held.values()],['gas','hand']);
 buttons[2].onpointercancel({pointerId:2});assert.deepEqual([...held.values()],['gas']);
 buttons[0].onlostpointercapture({pointerId:0});assert.equal(held.size,0)
});
