import test from 'node:test';
import assert from 'node:assert/strict';
import {scores,RaceMusic} from '../raceMusic.js';
function render(id){
 const sources=[],ctx={currentTime:0,state:'running',createBuffer(ch,n){const data=new Float32Array(n);return {data,getChannelData:()=>data}},
 createGain(){return {gain:{value:0},connect(){},disconnect(){}}},
 createBufferSource(){const src={connect(g){this.vol=g},start(at){sources.push({at,buf:this.buffer.data,gain:this.vol.gain.value})},stop(){this.onended()},disconnect(){}};return src}};
 const m=new RaceMusic(ctx,{});m.id=id;const step=15/scores[id].bpm;
 for(let n=0;n<64;n++)m.beat(n,n*step);
 const mix=new Float32Array(Math.ceil((64*step+1)*22050));for(const {at,buf,gain} of sources){const j=Math.round(at*22050);for(let i=0;i<buf.length;i++)mix[i+j]+=buf[i]*gain}
 const peaks=[];for(let j=0;j<64;j++){let energy=0;for(let k=Math.floor(j*step*22050);k<(j+1)*step*22050;k++)energy+=mix[k]**2;peaks.push(Math.round(energy))}
 assert.ok(m.cache.size<sources.length/2);assert.ok(m.active.size>0);m.stop();assert.equal(m.active.size,0);return {peaks,mix}
}
for(const id of Object.keys(scores))test('Синтез четырёх тактов · '+id,()=>{const {mix,peaks}=render(id);assert.ok(peaks.filter(p=>p>0).length>=40);assert.ok(new Set(peaks).size>12);assert.ok(mix.every(x=>Number.isFinite(x)&&Math.abs(x)<1))});
test('Разные формы, ритмические рисунки и звуковые огибающие',()=>{
 const tracks=Object.keys(scores).map(id=>render(id).peaks.join());assert.equal(new Set(tracks).size,3);assert.equal(new Set(Object.values(scores).map(s=>s.form.length)).size,3)
});
