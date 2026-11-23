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

export function drawCourse(ctx,event,gateIndex,time=0){
  ctx.save();
  if(event.type==='drift'){
    if(event.zone)paintZone(ctx,event.zone);
    ctx.restore();return;
  }
  const points=event.points;
  if(!points?.length||gateIndex>=points.length){ctx.restore();return}
  const index=Math.max(0,gateIndex),gate=event.gates?.[index-1]?[event.gates[index-1].x,event.gates[index-1].y]:points[index],start=points[Math.max(0,index-1)];
  const angle=index?Math.atan2(gate[1]-start[1],gate[0]-start[0]):
    Math.atan2((points[1]?.[1]??gate[1])-gate[1],(points[1]?.[0]??gate[0])-gate[0]);
  const color=courseColor(event);
  if(index>0){
    // Sparse arrows on the approach communicate direction at street level.
    const dx=Math.cos(angle),dy=Math.sin(angle),length=Math.hypot(gate[0]-start[0],gate[1]-start[1]);
    for(let distance=28;distance<length-12;distance+=96){
      chevron(ctx,gate[0]-dx*distance,gate[1]-dy*distance,angle,event.night?'#aaf4fc99':'#d7f9a681');
    }
  }
  ctx.translate(gate[0],gate[1]);ctx.rotate(angle);
  const finish=index===points.length-1,span=34;
  ctx.fillStyle=event.night?'#92ebfb2e':'#bffa6726';ctx.fillRect(-8,-span,16,span*2);
  if(finish){
    for(let column=0;column<2;column++)for(let row=0;row<12;row++){
      ctx.fillStyle=(row+column)%2?'#273329':'#ecf2db';
      ctx.fillRect(column*5-5,row*(span/6)-span,5,span/6+.15);
    }
  }else{
    ctx.fillStyle=color;ctx.fillRect(-1,-span,2,span*2);
  }
  for(const sign of [-1,1]){
    const y=sign*(span+3);
    ctx.fillStyle='#172322';ctx.fillRect(-7,y-5,14,10);
    ctx.fillStyle=color;ctx.fillRect(-5,y-3,10,6);
    ctx.globalAlpha=.35+.20*Math.sin(time*5);ctx.fillRect(-9,y-6,18,12);ctx.globalAlpha=1;
  }
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
    ctx.fillStyle='#f5f5df';ctx.fillRect(last[0]-r,last[1]-r,2*r,2*r);
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
