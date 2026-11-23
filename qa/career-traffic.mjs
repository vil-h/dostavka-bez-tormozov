import {jobs,start,step,fresh} from '../game.js';
import {createTraffic,roadTraffic,advanceTraffic,advanceRoadTraffic} from '../city.js';
import {travel} from '../geography.js';
import {createLegends,moveLegends} from '../legends.js';
const dt=1/60;
for(const job of jobs){
 const r=start(job),levels=fresh().levels,city=createTraffic(),road=roadTraffic(),roam=createLegends(r);
 let seed=162;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const path=job.via||[job.start,...travel(['start'+job.id,...job.start],['end'+job.id,...job.end]).via,job.end];
 const route=path.filter((p,i)=>!i||i===path.length-1||Math.hypot(p[0]-job.start[0],p[1]-job.start[1])>35&&Math.hypot(p[0]-job.end[0],p[1]-job.end[1])>35);
 const points=route.filter((p,i)=>!i||Math.hypot(p[0]-route[i-1][0],p[1]-route[i-1][1])>1);
 const lanes=points.map(([x,y],i)=>{if(!i||i===points.length-1)return [x,y];
 const [a,b]=points[i-1],[e,f]=points[i+1],l=Math.hypot(e-a,f-b);return [x-17*(f-b)/l,y+17*(e-a)/l]});
 let i=0;
 for(let n=0;n<job.time*60&&!r.done;n++){
  advanceTraffic(city,dt,n*dt,r,rng,[...road,...roam]);advanceRoadTraffic(road,dt,r,[...city,...roam]);moveLegends(roam,dt,r,[...city,...road],rng);
  const [x,y]=lanes[i],d=Math.hypot(x-r.x,y-r.y);
  let tx=x,ty=y,gap=Infinity;
  if(i&&d>80){const [px,py]=lanes[i-1],len=Math.hypot(x-px,y-py),dx=(x-px)/len,dy=(y-py)/len;
   const look=Math.min(len,Math.max(0,(r.x-px)*dx+(r.y-py)*dy)+100);tx=px+dx*look;ty=py+dy*look;
   for(const o of [...city,...road,...roam]){
    const ox=o.x-r.x,oy=o.y-r.y,forward=ox*dx+oy*dy;
    if(forward>0&&forward<140&&Math.abs(oy*dx-ox*dy)<26)gap=Math.min(gap,forward)
   }
   if(gap<100){tx+=dy*32;ty-=dx*32}
  }
  const a=Math.atan2(ty-r.y,tx-r.x)-r.a,delta=Math.atan2(Math.sin(a),Math.cos(a));
  const cap=job.type==='vase'?129:169,limit=Math.min(cap,Math.max(36,gap*1.9),Math.max(42,d*1.15))/(1+Math.abs(delta));
  step(r,{gas:r.speed<limit,brake:r.speed>limit+12,turn:Math.max(-1,Math.min(1,delta*2.5))},dt,levels,[...city,...road,...roam]);
  if(i===0&&r.loaded)i++;else if(i>0&&i<lanes.length-1&&d<26)i++
 }
 console.log(job.id+1,r.done,Math.round(r.t),Math.round(r.hp),r.hits);if(r.done!=='success')process.exitCode=1
}
