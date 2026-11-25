import {pointAt} from './routing.js';
import {roadEdge} from './geography.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cache=new WeakMap(),spacing=12;
function bell(distance,span){return Math.abs(distance)<span?(1+Math.cos(Math.PI*distance/span))*.5:0}
function clearance(p,lane){
 const x=p.x-p.dy*lane,y=p.y+p.dx*lane;
 return [-24,0,24].every(d=>roadEdge(x+d*p.dx,y+d*p.dy)<-13)
}
function build(route){
 const samples=[];
 for(let s=0;s<=route.length+spacing;s+=spacing){
  const p=pointAt(route,s);let shift=0,margin=0;
  for(const t of route.turns){
   const gap=s-t.s;if(Math.abs(gap)>240)continue;
   const sign=t.dir==='НАПРАВО'?1:-1;
   const tight=Math.min(1,t.angle/1.4);
   margin-=sign*tight*26*bell(gap,168);
   shift+=sign*(7*bell(gap,98)-10*bell(gap+126,122)-9*bell(gap-127,122))
  }
  const room=-roadEdge(p.x,p.y);
  const base=clamp(room*.34,10,16);
  const normal=Math.max(1,Math.min(base+4,base+margin));
  let lane=base+shift+margin;while(Math.abs(lane-normal)>1&&!clearance(p,lane))lane=(lane+normal)*.5;
  let left=normal,right=normal;
  while(left>-48&&clearance(p,left-3))left-=3;
  while(right<48&&clearance(p,right+3))right+=3;
  samples.push({p,lane,normalLane:normal,clearance:room,left,right})
 }
 for(const [i,v] of samples.entries()){
  for(const name of ['sport','normal']){
   const point=j=>{const {p,lane,normalLane}=samples[clamp(j,0,samples.length-1)],l=name==='sport'?lane:normalLane;return [p.x-p.dy*l,p.y+p.dx*l]};
   const [x,y]=point(i),[ax,ay]=point(i-3),[bx,by]=point(i+3);
   const ab=Math.hypot(bx-ax,by-ay),ac=Math.hypot(x-ax,y-ay),bc=Math.hypot(bx-x,by-y);
   v[name]=2*Math.abs((x-ax)*(by-y)-(y-ay)*(bx-x))/Math.max(1,ab*ac*bc)
  }
 }
 return samples
}
function samplesFor(r){let a=cache.get(r);if(!a){a=build(r);cache.set(r,a)}return a}
export function lineOffset(r,s,open=true){
 const a=samplesFor(r),u=clamp(s/spacing,0,a.length-1),i=Math.floor(u);
 const key=open?'lane':'normalLane';return a[i][key]+(a[Math.min(i+1,a.length-1)][key]-a[i][key])*(u-i)
}
export function fitLane(r,s,offset){
 const samples=samplesFor(r),i=clamp(Math.round(s/spacing),0,samples.length-1);
 return clamp(offset,samples[i].left,samples[i].right)
}
export function cornerLimit(c,style,open){
 const a=samplesFor(c.route),start=Math.floor(c.s/spacing),end=Math.min(a.length-1,start+38);
 let limit=style.top;
 for(let i=start;i<=end;i+=2){
  const curvature=a[i][open?'sport':'normal'];if(curvature<.0001)continue;
  const widthFactor=clamp((a[i].clearance-15)/23,.65,1);
  const lateral=style.lateral*widthFactor*(.93+.07*c.grip);
  const radiusCap=Math.min(lateral/curvature,(style.maxYaw/curvature)**2);
  const distance=Math.max(0,i*spacing-c.s-c.speed*.11);
  limit=Math.min(limit,Math.sqrt(radiusCap+2*style.brake*.86*distance))
 }
 return limit
}
