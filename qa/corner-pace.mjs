// Run against either checkout with the same start, road geometry and traffic seed.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const base=process.argv[2]?pathToFileURL(resolve(process.argv[2])+'/'):new URL('../',import.meta.url);
const {createLegends,moveLegends}=await import(new URL('legends.js',base));
const {createTraffic,roadTraffic,advanceTraffic,advanceRoadTraffic}=await import(new URL('city.js',base));
const {roadEdge}=await import(new URL('geography.js',base));
const p={x:400,y:260,free:true},dt=1/60,results=[];
for(const traffic of [false,true])for(const c of createLegends({x:0,y:0,j:{id:11}})){
 const r=c.route,a=traffic?createTraffic():[],b=traffic?roadTraffic():[],cars=[...a,...b];
 let seed=162;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const turns=r.turns.map(t=>({x:t.p[0],y:t.p[1],s:t.s,brake:null,min:Infinity,n:0,sum:0,slide:0,peak:0,hits:0,off:0}));
 Object.assign(c,{x:r.points[0][0],y:r.points[0][1]+16,s:0,speed:70,a:0});
 let time=0,touch=false,hits=0,off=0,idle=0,maxStop=0,bodyOff=0,worst=-Infinity,worstXY;
 while(!c.laps&&time<600){const old=c.speed;
  advanceTraffic(a,dt,time,p,rng,[...b,c]);advanceRoadTraffic(b,dt,p,[...a,c]);moveLegends([c],dt,p,cars,()=>.9);time+=dt;
  const hit=cars.some(o=>Math.hypot(c.x-o.x,c.y-o.y)<26),outside=roadEdge(c.x,c.y)>0;
  const cs=Math.cos(c.a),sn=Math.sin(c.a);
  const edge=Math.max(...[-21,21].flatMap(f=>[-9,9].map(w=>roadEdge(c.x+cs*f-sn*w,c.y+sn*f+cs*w))));
  if(edge>0)bodyOff++;if(edge>worst){worst=edge;worstXY=[c.x,c.y,c.speed*.36]}
  if(hit&&!touch)hits++;touch=hit;if(outside)off++;
  idle=c.speed<1?idle+dt:0;maxStop=Math.max(maxStop,idle);
  const next=turns.find(t=>t.s>=c.s);if(next&&next.s-c.s<400&&old-c.speed>.18)next.brake??=Math.round(next.s-c.s);
  const t=turns.find(t=>Math.abs(t.s-c.s)<=90);if(!t)continue;
  const v=c.speed*.36;t.entry??=v;t.exit=v;t.n++;t.sum+=v;t.min=Math.min(t.min,v);t.peak=Math.max(t.peak,Math.abs(c.slip)*180/Math.PI);
  if(Math.abs(c.slip)>.12217&&Math.abs(c.sideSpeed)*.36>=4)t.slide+=dt;
  if(hit)t.hits++;if(outside)t.off++
 }
 if(!c.laps)throw Error('unfinished lap '+c.id);
 const mean=k=>turns.reduce((s,t)=>s+t[k],0)/turns.length;
 for(const t of turns)t.avg=t.sum/t.n;
 results.push({id:c.id,traffic,time,hits,off,bodyOff,worst,worstXY,maxStop,entry:mean('entry'),min:mean('min'),avg:mean('avg'),exit:mean('exit'),technical:turns.reduce((s,t)=>s+t.n*dt,0),drifts:turns.filter(t=>t.slide>=.12&&!t.hits&&!t.off).length,duration:mean('slide'),peak:mean('peak'),turns})
}
console.log(JSON.stringify(results,(k,v)=>typeof v==='number'?+v.toFixed(3):v,2))
