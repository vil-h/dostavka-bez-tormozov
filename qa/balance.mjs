import {pointAt,nextTurn} from '../routing.js';
import {newContest,advanceContest,finishOpponents} from '../contest.js';
import {stockCar} from '../vehicles.js';
export const circuits=['sprint','night','express'],modes=['rookie','normal','pro'];
export function simulate(id,mode,style='clean',model=id==='sprint'?'van':'coupe',seed=19,upgraded=false){
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const s=newContest(id,model,rng,mode),p=s.player,levels=stockCar(model).levels;
 if(upgraded)for(const k of Object.keys(levels))levels[k]=3;
 // A bad approach costs speed through the actual brake and acceleration model.
 const faults={one:[.30],three:[.18,.48,.76],comeback:[.16]}[style]||[];
 let n=0,slowing=false,hold=0,worst=1;
 for(let i=0;i<10800&&!s.done;i++){
 const q=pointAt(s.e,p.progress+Math.max(48,p.speed*.47)),end=Math.max(0,p.progress+80-s.e.length);
 const a=Math.atan2(q.y+q.dy*end-p.y,q.x+q.dx*end-p.x)-p.a,delta=Math.atan2(Math.sin(a),Math.cos(a)),turn=nextTurn(s.e,p);
 const limit=style==='careful'?162:style==='comeback'&&n===0?205:500;
 const target=Math.min(limit,turn?Math.sqrt((172/Math.sqrt(turn.angle))**2+420*Math.max(0,turn.s-p.progress-42)):500)/(1+Math.abs(delta)*.55);
 const input={gas:p.speed<target,brake:p.speed>target+9,turn:Math.max(-1,Math.min(1,delta*2.9))};
 if(n<faults.length&&p.progress>=s.e.length*faults[n]){slowing=true;n++}
 if(slowing){input.gas=false;input.brake=p.speed>12;if(p.speed<=12&&++hold>=52){slowing=false;hold=0}}
 advanceContest(s,input,1/60,levels);if(n)worst=Math.max(worst,s.place)
 }
 if(!s.done)throw Error(id+' '+style+' did not finish');finishOpponents(s);
 return {time:p.finish,place:s.place,worst,bots:s.bots.map(c=>c.finish),hits:p.hits}
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 for(const id of circuits)for(const mode of modes){
 const runs=Array.from({length:12},(_,i)=>simulate(id,mode,'clean',undefined,i+1)),times=runs.flatMap(r=>r.bots);
 const results=['clean','one','three','careful','comeback'].map(style=>simulate(id,mode,style));
 console.log(id,mode,(times.reduce((a,b)=>a+b)/times.length).toFixed(1),Math.min(...times).toFixed(1),...results.map(r=>r.time.toFixed(1)+'/'+r.place), 'recovery',results[4].worst+'→'+results[4].place)
 }}
