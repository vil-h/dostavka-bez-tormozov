// Per-driver telemetry. A corner window extends 90 world units either side of its apex.
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.argv[2]?pathToFileURL(path.resolve(process.argv[2])+'/'):new URL('../',import.meta.url);
const {newContest,advanceContest,botInput}=await import(new URL('contest.js',root));
const {stockCar}=await import(new URL('vehicles.js',root));
for(const id of ['sprint','night','express'])for(const mode of (process.argv[3]||'normal').split(',')){
 let seed=19;const s=newContest(id,'van',()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),mode);
 const rows=s.bots.map(()=>({distance:0,peak:0,corner:0,brakes:0,idle:0,braking:false,hits:0}));
 for(let i=0;i<9000&&s.bots.some(c=>c.finish===null);i++){
 const prev=s.bots.map(c=>[c.x,c.y,c.finish,c.finish===null&&!s.count&&botInput(c,s.e,s.t+1/60).brake]);advanceContest(s,{},1/60,stockCar('van').levels);
 s.bots.forEach((c,j)=>{if(prev[j][2]!==null||s.t===0)return;const r=rows[j];r.distance+=Math.hypot(c.x-prev[j][0],c.y-prev[j][1]);r.peak=Math.max(r.peak,c.speed*.36);
 if(s.e.turns.some(q=>Math.abs(q.s-c.progress)<90))r.corner+=1/60;if(c.speed<3)r.idle+=1/60;
 if(prev[j][3]&&!r.braking)r.brakes++;r.braking=prev[j][3];if(c.hit)r.hits++})
 }
 s.bots.forEach((c,j)=>{const r=rows[j];console.log(id,mode,c.name,...[c.finish,r.distance*.36/c.finish,r.peak,r.corner,r.brakes,r.idle,r.hits].map(n=>n?.toFixed(2)))})
}
