import {roadEdge} from './geography.js';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function toward(a,b,d){const t=d/length(a,b);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
export function pointAt(e,s){
 const seg=e.segments.find(v=>v.end>=s)||e.segments.at(-1),u=clamp(s-seg.base,0,seg.len);
 return {x:seg.x+seg.dx*u,y:seg.y+seg.dy*u,dx:seg.dx,dy:seg.dy}
}
export function project(e,x,y,lo=0,hi=e.length){
 let nearest={s:lo,gap:Infinity};
 for(const v of e.segments){if(v.end<lo||v.base>hi)continue;
 const u=clamp((x-v.x)*v.dx+(y-v.y)*v.dy,Math.max(0,lo-v.base),Math.min(v.len,hi-v.base));
 const gap=Math.hypot(x-v.x-u*v.dx,y-v.y-u*v.dy);if(gap<nearest.gap)nearest={s:v.base+u,gap}}
 return nearest
}
export function prepare(e,stops){
 const raw=e.points,points=[raw[0]],corners=[];
 for(let i=1;i<raw.length-1;i++){const a=raw[i-1],b=raw[i],c=raw[i+1],r=Math.min(e.outside?85:66,length(a,b)/3,length(b,c)/3);
 const p=toward(b,a,r),q=toward(b,c,r),delta=Math.atan2((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]),(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1]));
 for(let j=0;j<=6;j++){const t=j/6,u=1-t;points.push([u*u*p[0]+2*u*t*b[0]+t*t*q[0],u*u*p[1]+2*u*t*b[1]+t*t*q[1]])}
 if(Math.abs(delta)>.23)corners.push({p:b,dir:delta>0?'НАПРАВО':'НАЛЕВО',angle:Math.abs(delta)})
 }
 points.push(raw.at(-1));e.points=points;e.segments=[];e.length=0;
 for(let i=1;i<points.length;i++){const [x,y]=points[i-1],len=length(points[i-1],points[i]);if(len<.01)continue;
 e.segments.push({x,y,dx:(points[i][0]-x)/len,dy:(points[i][1]-y)/len,len,base:e.length,end:e.length+len});e.length+=len}
 e.turns=corners.map(c=>({...c,s:project(e,...c.p).s}));
 e.gates=[...stops.map(([i,t])=>{const a=raw[i],b=raw[i+1];return project(e,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t).s}),e.length].map(s=>{
 const p=pointAt(e,s);return {...p,s,width:Math.min(66,9-roadEdge(p.x,p.y))}})
}
export function nextTurn(e,c){return e.turns.find(t=>t.s>c.progress+5)}
export function guidance(e,c){
 if(c.missed){const g=e.gates[c.gate],a=Math.atan2(g.y-c.y,g.x-c.x)-c.a;const arrow=['↑','↗','→','↘','↓','↙','←','↖'][((Math.round(a/(Math.PI/4))%8)+8)%8];
 return 'Контрольная точка пропущена · '+arrow+' '+Math.ceil(Math.hypot(g.x-c.x,g.y-c.y)/3)+' м'}
 if(c.off)return 'Вне трассы · вернись к линии';
 const turn=nextTurn(e,c),left=e.length-c.progress,range=190+c.speed*1.8;
 if(turn&&turn.s-c.progress<range)return (turn.dir==='НАПРАВО'?'↱ ':'↰ ')+turn.dir+' ЧЕРЕЗ '+Math.ceil((turn.s-c.progress)/3)+' М';
 return left<range?'⚑ ФИНИШ · '+Math.ceil(left/3)+' М':'↑ ПРЯМО'
}
