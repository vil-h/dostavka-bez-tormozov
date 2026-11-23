// Coordinates and widths are shared by painting, routing and vehicle contact.
export const bounds=[8400,2900];
export const avenue=[150,480,840,1170,1530];
export const cross=[150,470,810,1130];
export const highway=[[1530,470],[2100,470],[4400,470],[4850,530],[5200,710],[5600,800],[6000,800],[6460,650],[6900,650],[7250,880],[7550,1180],[7940,1180]];
export const bends=[[7940,1180],[7940,1600],[7660,1830],[7220,1830],[6980,2010],[6790,2270],[6530,2300],[6250,2050],[5980,2080],[5750,2350],[5480,2380],[5220,2150],[5000,1770],[4700,1730],[4410,1950],[4100,1900],[3830,1580],[3540,1480],[3150,1480],[2770,1250],[2470,1130],[1530,1130]];
export const yard=[[7940,1180],[8180,1180],[8180,1600],[7940,1600]];
export const roads=[{points:highway,width:116},{points:bends,width:82},{points:yard,width:64}];
const segments=roads.flatMap(({points,width})=>points.slice(1).map(([x,y],i)=>{
 const [a,b]=points[i],dx=x-a,dy=y-b;
 return {a,b,dx,dy,len2:dx*dx+dy*dy,r:width/2,min:Math.min(a,x)-width,max:Math.max(a,x)+width};
}));
export function roadEdge(x,y){
 let best=Infinity;
 if(x<=1680&&y<=1280){
 for(const v of avenue)best=Math.min(best,Math.max(Math.abs(x-v)-(v===840?58:42),y-1280));
 for(const v of cross)best=Math.min(best,Math.max(Math.abs(y-v)-(v===470?58:42),x-1680));
 }
 if(x<1460)return best;
 for(const s of segments){if(x<s.min||x>s.max)continue;
 const u=Math.min(1,Math.max(0,((x-s.a)*s.dx+(y-s.b)*s.dy)/s.len2));
 best=Math.min(best,Math.hypot(x-s.a-u*s.dx,y-s.b-u*s.dy)-s.r)}
 return best
}
export const outposts=[['АЗС «Восток»',4400,482],['Весовая',6000,812],['Терминал № 8',8180,1588],['Лесничество',5480,2368]];
// Join the city grid and delivery bays into the same graph as the countryside.
const graph=new Map();
function link(p,q,factor=1){const a=p.join(),b=q.join(),d=Math.hypot(p[0]-q[0],p[1]-q[1]);
 for(const [k,to] of [[a,b],[b,a]]){if(!graph.has(k))graph.set(k,[]);graph.get(k).push({to,d,cost:d*factor})}}
for(const y of cross){const xs=y===470?[...avenue,660,1010].sort((a,b)=>a-b):avenue;xs.slice(1).forEach((v,i)=>link([xs[i],y],[v,y]))}
for(const x of avenue)cross.slice(1).forEach((v,i)=>link([x,cross[i]],[x,v]));
roads.forEach(({points},j)=>points.slice(1).forEach((p,i)=>link(points[i],p,[1,1.3,1.2][j])));
function nearest(x,y){let key,dist=Infinity;for(const k of graph.keys()){const [a,b]=k.split(',').map(Number),d=Math.hypot(x-a,y-b);if(d<dist){key=k;dist=d}}return key}
const cache=new Map();
export function travel(a,b){
 const k=a[0]+'|'+b[0];if(cache.has(k))return cache.get(k);
 const from=nearest(a[1],a[2]),to=nearest(b[1],b[2]),open=new Map([[from,{d:0,cost:0,via:[from.split(',').map(Number)]}]]),done=new Set();
 while(open.size){const [id,v]=[...open].sort((a,b)=>a[1].cost-b[1].cost)[0];if(id===to){cache.set(k,v);return v}
 open.delete(id);done.add(id);for(const e of graph.get(id)){const cost=v.cost+e.cost;if(!done.has(e.to)&&cost<(open.get(e.to)?.cost??Infinity))open.set(e.to,{cost,d:v.d+e.d,via:[...v.via,e.to.split(',').map(Number)]})}}
 throw Error('Disconnected road network')
}
