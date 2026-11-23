import {highway,bends,yard} from './geography.js';
import {prepare,pointAt} from './routing.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const hub=[1060,470],cityLoop=[[1530,470],[1530,1130],[480,1130],[480,470]],country=[...highway,...bends.slice(1),[840,1130],[840,470]];
const courses=[country,cityLoop,[...highway,...yard.slice(1),...bends.slice(2),[480,1130],[480,470]]].map(path=>{const r={points:[hub,...path,hub],outside:true};prepare(r,[]);return r});
export const legends={spark:{name:'Искра',car:'Искра GT',color:'#47d8ff',style:'Поздно тормозит и обгоняет на длинных прямых М-7.'},fox:{name:'Лис',car:'Лис R',color:'#ffa748',style:'Ищет просвет в городском потоке и держит скорость на лесных связках.'}};
function pose(c){const p=pointAt(c.route,c.s);return {x:p.x-p.dy*c.lane,y:p.y+p.dx*c.lane,a:Math.atan2(p.dy,p.dx)}}
export function createLegends(player){
 if(!player.free&&player.j.id<5)return [];
 return Object.keys(legends).map((id,i)=>{const forestStart=id==='fox'&&player.j?.id===11,r=courses[forestStart?2:i],c={id,route:r,s:forestStart?r.length*.49:i?1250:r.length-1500,lane:16,speed:i?130:190,pass:0,laps:0};
 for(let tries=0;tries<8;tries++){Object.assign(c,pose(c));if(Math.hypot(c.x-player.x,c.y-player.y)>1050)break;if(tries===3)c.route=courses[2];c.s=(c.s+1300)%c.route.length}return c})
}
export function moveLegends(list,dt,player,traffic,rng=Math.random){
 for(const c of list){
 const near=Math.hypot(c.x-player.x,c.y-player.y)<1700; c.elapsed=(c.elapsed||0)+dt;if(!near&&c.elapsed<.12)continue;const frame=c.elapsed;c.elapsed=0;const dx=Math.cos(c.a),dy=Math.sin(c.a);
 const turn=c.route.turns.find(t=>t.s>=c.s-15),gap=turn?turn.s-c.s:Infinity,sharp=turn?.angle||0;
 const top=c.id==='spark'?328:267,apex=(c.id==='spark'?145:165)/Math.sqrt(Math.max(.22,sharp));
 let target=Math.min(top,Math.sqrt(apex**2+370*Math.max(0,gap-50))),lead=null,leadD=Infinity,clear=true,alongside=false;
 if(near){
 for(const o of [...traffic,player,...list]){if(o===c)continue;
 const x=o.x-c.x,y=o.y-c.y,d=x*dx+y*dy,side=-x*dy+y*dx;
 if(d>0&&d<Math.max(120,c.speed*.95)&&Math.abs(side+c.lane-16)<25&&d<leadD){lead=o;leadD=d}
 if(d>=-55&&d<=38&&Math.abs(side+c.lane-16)<25)alongside=true;
 if(d>-55&&d<c.speed*1.5+90&&Math.abs(side+c.lane+20)<27)clear=false}
 const leadSpeed=lead?(lead.speed||0)*Math.cos((lead.a??c.a)-c.a):0;
 if(lead&&target>leadSpeed+12&&leadSpeed>=-5&&clear&&gap>120&&leadD>20)c.pass=.9;
 else if(c.pass&&alongside&&clear)c.pass=.55;
 else c.pass=Math.max(0,c.pass-frame);
 if(!clear)c.pass=0;
 if(lead&&(c.pass===0||Math.abs(c.lane-16)<24))target=Math.min(target,Math.max(0,(leadD-40)*1.8));
 }else c.pass=0;
 const correction=c.id==='fox'&&c.laps%3===2&&gap<100?Math.sin(Math.max(0,gap)*.031)*3:0;
 const desired=c.pass>0?-21:16+correction;c.lane+=clamp(desired-c.lane,-64*frame,64*frame);
 const speed=c.speed+clamp(target-c.speed,-340*frame,(c.id==='spark'?166:146)*frame);
 const oldS=c.s,oldRoute=c.route;c.s+=speed*frame;
 if(c.s>=c.route.length){c.s-=c.route.length;c.laps++;c.route=c.id==='spark'?courses[rng()<.8?0:2]:courses[rng()<.55?1:2]}
 const p=pose(c);if(near&&traffic.concat(player,list).some(o=>o!==c&&Math.hypot(p.x-o.x,p.y-o.y)<27&&Math.hypot(p.x-o.x,p.y-o.y)<Math.hypot(c.x-o.x,c.y-o.y))){if(oldRoute!==c.route)c.laps--;c.route=oldRoute;c.s=oldS;c.speed=0;continue}
 c.speed=speed;Object.assign(c,p)
 }}
