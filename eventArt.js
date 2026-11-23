import {roads} from './geography.js';
import {pointAt,nextTurn} from './routing.js';
import {streetsX,streetsY} from './game.js';

const lime='#c7fc68',amber='#ffae69',ice='#96ebfe';
const courseColor=e=>e.type==='drift'?amber:e.night?ice:lime;

function trace(ctx,points){
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
}

function paintZone(ctx,[left,top,right,bottom]){
  // Clip to the same urban road widths that feed the vehicle physics.
  ctx.save();
  ctx.beginPath();
  for(const x of streetsX){const r=x===840?58:42;ctx.rect(x-r,0,r*2,1280)}
  for(const y of streetsY){const r=y===470?58:42;ctx.rect(0,y-r,1680,r*2)}
  ctx.clip();
  ctx.fillStyle='#ffad5911';ctx.fillRect(left,top,right-left,bottom-top);
  ctx.strokeStyle='#ffb56fb5';ctx.lineWidth=4;ctx.setLineDash([13,9]);
  ctx.strokeRect(left,top,right-left,bottom-top);
  ctx.restore();
}

function chevron(ctx,x,y,rotation,color){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
  trace(ctx,[[-5,-6],[1,0],[-5,6]]);ctx.lineWidth=3;ctx.strokeStyle=color;ctx.stroke();
  ctx.restore();
}

export function drawMini(ctx,event){
  const w=ctx.canvas.width,h=ctx.canvas.height;
  if(w<1||h<1)return;
  const route=event.points||[];
  const z=event.zone,points=z?[[z[0],z[1]],[z[2],z[3]]]:route;
  ctx.save();ctx.fillStyle='#1c2925';ctx.fillRect(0,0,w,h);
  if(!points.length){ctx.restore();return}
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x1=Math.min(...xs),x2=Math.max(...xs),y1=Math.min(...ys),y2=Math.max(...ys);
  const scale=Math.min(w/(x2-x1+275),h/(y2-y1+210));
  ctx.translate((w-(x1+x2)*scale)/2,(h-(y1+y2)*scale)/2);ctx.scale(scale,scale);
  ctx.strokeStyle='#43564c';ctx.lineWidth=Math.max(14,2/scale);
  ctx.beginPath();
  for(const x of streetsX){ctx.moveTo(x,0);ctx.lineTo(x,1280)}
  for(const y of streetsY){ctx.moveTo(0,y);ctx.lineTo(1680,y)}
  ctx.stroke();
  const color=courseColor(event);
  if(z){
    ctx.fillStyle='#fdad642e';ctx.fillRect(x1,y1,x2-x1,y2-y1);
    ctx.strokeStyle=color;ctx.lineWidth=2/scale;ctx.setLineDash([5/scale,3/scale]);ctx.strokeRect(x1,y1,x2-x1,y2-y1);
  }else{
    trace(ctx,route);ctx.strokeStyle=color;ctx.lineWidth=2.6/scale;ctx.lineJoin='round';ctx.stroke();
    const first=route[0],last=route[route.length-1],r=3/scale;
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(first[0],first[1],r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f5f5df';ctx.fillRect(last[0]-r/4,last[1]-4*r,r/2,4*r);ctx.fillRect(last[0],last[1]-4*r,2.4*r,1.4*r);
  }
  ctx.restore();
}

export function updateTrails(fx,car,dt,mobile=false){
  const smoke=fx.smoke,marks=fx.marks;
  // Oldest particles expire first; the arrays have strict upper bounds.
  for(const p of smoke){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  while(smoke.length&&smoke[0].age>=.64)smoke.shift();
  fx.wait=Math.max(0,(fx.wait||0)-dt);
  const dx=Math.cos(car.a),dy=Math.sin(car.a);
  const lateral=Math.abs(-dy*car.vx+dx*car.vy);
  if(car.hit||car.speed<45||lateral<14){fx.previous=null;return}
  if(fx.wait>0)return;
  fx.wait=mobile?.07:.042;
  const x=car.x-13*dx,y=car.y-13*dy,previous=fx.previous;
  if(previous&&Math.hypot(x-previous.x,y-previous.y)<28){
    marks.push({x,y,dx,dy,previous});
    if(marks.length>(mobile?110:190))marks.shift();
  }
  fx.previous={x,y,dx,dy};
  const side=(fx.side||1);fx.side=-side;
  if(lateral>21){
    smoke.push({x:x-side*dy*8,y:y+side*dx*8,age:0,vx:-dx*11-side*dy*5,vy:-dy*11+side*dx*5,amp:Math.min(1,lateral/70)});
    if(smoke.length>(mobile?14:28))smoke.shift();
  }
}

export function drawTrails(ctx,fx){
  ctx.save();ctx.beginPath();ctx.strokeStyle='#1c222798';ctx.lineWidth=2.2;
  for(const m of fx.marks){
    const p=m.previous;
    for(const side of [-7,7]){
      ctx.moveTo(p.x-side*p.dy,p.y+side*p.dx);ctx.lineTo(m.x-side*m.dy,m.y+side*m.dx);
    }
  }
  ctx.stroke();ctx.fillStyle='#e2e3d8';
  for(const p of fx.smoke){
    ctx.globalAlpha=(.64-p.age)*(.19+.24*p.amp);
    ctx.beginPath();ctx.arc(p.x,p.y,3+p.age*12,0,2*Math.PI);ctx.fill();
  }
  ctx.restore();
}

function ribbon(c,e,from,to,width,color){
 const start=pointAt(e,from),end=pointAt(e,to);
 c.beginPath();c.moveTo(start.x,start.y);for(const s of e.segments)if(s.base>from&&s.base<to)c.lineTo(s.x,s.y);
 c.lineTo(end.x,end.y);c.strokeStyle=color;c.lineWidth=width;c.lineJoin=c.lineCap='round';c.stroke()
}
export function drawCourse(c,e,p,t){
 c.save();
 if(e.zone){paintZone(c,e.zone);c.restore();return}
 const s=p.progress,far=Math.min(e.length,s+1050);
 ribbon(c,e,Math.max(0,s-130),far,9,'#a4efdc60');ribbon(c,e,s,Math.min(e.length,s+320),6,'#a4ffdcba');
 for(let d=Math.ceil(s/94)*94;d<far;d+=94){const a=pointAt(e,d);chevron(c,a.x,a.y,Math.atan2(a.dy,a.dx),d<s+320?'#e0ffe6':'#aad5c2')}
 const g=e.gates[p.gate];if(g){
 const last=p.gate===e.gates.length-1,w=g.width-5;c.translate(g.x,g.y);c.rotate(Math.atan2(g.dy,g.dx));
 c.fillStyle=last?'#f3f6de':'#fbc96c';c.fillRect(-2,-w,4,w*2);
 if(last){for(let i=0;i<2;i++)for(let j=0;j<12;j++){c.fillStyle=(i+j)%2?'#182329':'#fff9d9';c.fillRect(i*7-7,-w+j*w/6,7,w/6+.3)}}
 for(const side of [-1,1]){c.fillStyle='#1f2f32';c.fillRect(-9,side*w-5,18,10);c.fillStyle=last?'#fff':'#ffbc57';c.fillRect(-6,side*w-3,12,6)}
 if(last){c.fillStyle='#152522';c.fillRect(-23,-w-25,50,18);c.fillStyle='#fff7cb';c.font='bold 12px system-ui';c.fillText('ФИНИШ',-21,-w-12)}
 }c.restore()
}
export function liveMap(c,s){
 const {e,player:p}=s,w=c.canvas.width,h=c.canvas.height;
 const k=.14,tx=w/2-p.x*k,ty=h/2-p.y*k;const screen=(x,y)=>[x*k+tx,y*k+ty];
 c.save();c.fillStyle='#142724';c.fillRect(0,0,w,h);c.translate(tx,ty);c.scale(k,k);
 c.strokeStyle='#324843';c.lineWidth=15;c.beginPath();for(const x of streetsX){c.moveTo(x,0);c.lineTo(x,1280)}for(const y of streetsY){c.moveTo(0,y);c.lineTo(1680,y)}c.stroke();
 for(const road of roads){trace(c,road.points);c.stroke()}
 ribbon(c,e,0,e.length,30,'#567975');ribbon(c,e,p.progress,Math.min(e.length,p.progress+380),25,'#9cf7cd');
 const turn=nextTurn(e,p);if(turn){const t=pointAt(e,turn.s);c.fillStyle='#ffc66e';const mx=p.x+Math.max(-(w/2-7)/k,Math.min((w/2-7)/k,t.x-p.x)),my=p.y+Math.max(-(h/2-7)/k,Math.min((h/2-7)/k,t.y-p.y));c.beginPath();c.arc(mx,my,29,0,7);c.fill()}
 for(const b of s.bots){c.fillStyle=b.name==='Лис'?'#ffc376':b.name==='Рысь'?'#ff807a':'#cab0ff';c.beginPath();c.arc(b.x,b.y,35,0,7);c.fill();c.lineWidth=8;c.strokeStyle='#382a30';c.stroke()}c.restore();
 const end=e.points.at(-1),[fx,fy]=screen(...end),x=Math.max(9,Math.min(w-15,fx)),y=Math.max(14,Math.min(h-5,fy));
 c.fillStyle='#f5efce';c.font='bold 17px system-ui';c.fillText('⚑',x-5,y);
 c.save();c.translate(w/2,h/2);c.rotate(p.a);trace(c,[[11,0],[-8,-7],[-4,0],[-8,7],[11,0]]);c.fillStyle='#fff';c.fill();c.strokeStyle='#21312e';c.lineWidth=1;c.stroke();c.restore()
}
