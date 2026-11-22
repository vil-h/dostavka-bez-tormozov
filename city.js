import {vehicles} from './vehicles.js';
import {streetsX,streetsY,jobs,cargo,start,result,settle} from './game.js';
const stops=[
 ['Депо',480,490],['Газетный киоск',660,490],['Почтамт',840,490],['Дом печати',1010,490],
 ['Речной рынок',150,170],['Мастерская',480,170],['Галерея',1170,170],['Порт',1530,170],
 ['Вокзал',150,830],['Кондитерская',1170,830],['Библиотека',840,830],['Склад',480,1150],['Маяк',1530,1150]
];
const pick=(list,rng)=>list[Math.floor(rng()*list.length)];
function routeLength(a,b){
 // All pickup bays are twenty pixels south of their street centerline.
 if(a[2]===b[2])return Math.abs(a[1]-b[1]);
 return Math.abs(a[2]-b[2])+Math.min(...streetsX.map(x=>Math.abs(a[1]-x)+Math.abs(b[1]-x)));
}
export function freeRide(){
 const r=start(jobs[0]);
 return Object.assign(r,{free:true,j:null,offer:null,nextOffer:7,notice:'',noticeTime:0,offersSeen:0});
}
export function makeOffer(r,rng=Math.random){
 // The first dispatch near the depot introduces pickup on a single street.
 const intro=r.offersSeen===0&&Math.hypot(r.x-400,r.y-490)<150;
 const from=intro?stops[0]:pick(stops,rng);
 const kind=pick(intro?['Обычная доставка','Срочная доставка']:['Обычная доставка','Срочная доставка','Хрупкий заказ','Дальний рейс'],rng);
 const byDistance=stops.filter(p=>routeLength(from,p)>240).sort((a,b)=>routeLength(from,b)-routeLength(from,a));
 const to=pick(intro?stops.slice(1,4):kind==='Дальний рейс'?byDistance.slice(0,3):byDistance,rng);
 const type=pick(kind==='Хрупкий заказ'?['vase','tank','cake']:Object.keys(cargo),rng);
 const length=routeLength(from,to);
 const cruise=type==='fridge'?85:type==='vase'||type==='cake'?92:110;
 const time=Math.ceil((14+length/(cruise*Math.min(1,vehicles[r.model].top))*2.3)*(kind==='Срочная доставка'?.80:1));
 const pay=Math.round((165+length*.25+(type==='parcel'?0:60))*(kind==='Обычная доставка'?1:1.3));
 return {kind,name:kind,type,from:from[0],place:to[0],start:from.slice(1),end:to.slice(1),time,pay,weather:'ясно'};
}
export function dispatch(r,dt,rng=Math.random){
 if(!r.free)return;
 r.noticeTime=Math.max(0,r.noticeTime-dt);
 if(r.j)return;
 r.nextOffer-=dt;if(r.nextOffer>0)return;
 if(r.offer){skipOffer(r,rng);return}
 r.offer=makeOffer(r,rng);r.offersSeen++;r.nextOffer=15;
}
export function skipOffer(r,rng=Math.random){if(!r.offer)return;r.offer=null;r.nextOffer=24+rng()*18}
export function acceptOffer(r){
 if(!r.offer||r.j)return false;
 Object.assign(r,{j:r.offer,offer:null,t:0,hits:0,hp:100,tilt:0,loaded:false,done:'',paid:false});return true;
}
export function closeDelivery(r,state,rng=Math.random){
 if(!r.free||!r.j||!r.done)return false;
 const reward=result(r).pay;settle(state,r);
 r.notice=r.done==='success'?'Доставлено · +'+reward+' ₽':r.hp<=0?'Груз повреждён · рейс окончен':'Время вышло · рейс окончен';
 Object.assign(r,{j:null,t:0,done:'',loaded:false,noticeTime:5,nextOffer:28+rng()*16});return true;
}
// Each directed road ends 40 px before its junction. A quadratic curve links
// its right-hand lane to the next road without introducing position jumps.
const dirs=[[1,0],[0,1],[-1,0],[0,-1]];
const point=(i,j,d,along)=>{const [dx,dy]=dirs[d];return [streetsX[i]+dx*along-dy*18,streetsY[j]+dy*along+dx*18]};
const valid=(i,j,d)=>{const [x,y]=dirs[d];return i+x>=0&&i+x<5&&j+y>=0&&j+y<4};
function segment(car){
 const [dx,dy]=dirs[car.d];car.toI=car.i+dx;car.toJ=car.j+dy;
 car.p=point(car.i,car.j,car.d,40);car.q=point(car.toI,car.toJ,car.d,-40);
 car.len=Math.hypot(car.q[0]-car.p[0],car.q[1]-car.p[1]);car.curve=false;car.pos=0;
}
function pose(c){
 const t=c.pos/c.len,u=1-t;
 if(!c.curve){c.x=c.p[0]*u+c.q[0]*t;c.y=c.p[1]*u+c.q[1]*t;c.a=c.d*Math.PI/2;return}
 c.x=u*u*c.p[0]+2*u*t*c.ctrl[0]+t*t*c.q[0];c.y=u*u*c.p[1]+2*u*t*c.ctrl[1]+t*t*c.q[1];
 c.a=Math.atan2(u*(c.ctrl[1]-c.p[1])+t*(c.q[1]-c.ctrl[1]),u*(c.ctrl[0]-c.p[0])+t*(c.q[0]-c.ctrl[0]));
}
export function createTraffic(){
 return [[0,0,0],[2,0,1],[3,0,0],[4,1,1],[3,2,2],[0,2,1],[1,3,0],[3,3,3],[1,1,3],[0,1,0]].map(([i,j,d],id)=>{
 const c={i,j,d,id,speed:0,max:54+(id%5)*9};segment(c);c.pos=c.len*(.20+.05*(id%6));pose(c);return c
 });
}
export function green(i,j,d,time){return (Math.floor((time+i*2+j)/6)%2)===d%2}
function turn(c,rng){
 c.i=c.toI;c.j=c.toJ;
 const choices=[c.d,(c.d+1)%4,(c.d+3)%4].filter(d=>valid(c.i,c.j,d));
 const next=pick(choices,rng),old=dirs[c.d];c.p=c.q;c.q=point(c.i,c.j,next,40);
 
 c.ctrl=c.d===next?point(c.i,c.j,next,0):[old[0]?c.q[0]:c.p[0],old[1]?c.q[1]:c.p[1]];
 c.len=Math.hypot(c.p[0]-c.ctrl[0],c.p[1]-c.ctrl[1])+Math.hypot(c.q[0]-c.ctrl[0],c.q[1]-c.ctrl[1]);
 c.d=next;c.curve=true;c.pos=0;
}
export function advanceTraffic(cars,dt,time,player,rng=Math.random){
 for(const c of cars){
 const dx=Math.cos(c.a),dy=Math.sin(c.a);
 const ahead=o=>{const x=o.x-c.x,y=o.y-c.y,along=x*dx+y*dy;return along>0&&along<54&&Math.abs(x*dy-y*dx)<17};
 const stop=cars.some(o=>o!==c&&ahead(o))||player&&ahead(player);
 const red=!c.curve&&(c.toI===2||c.toJ===1)&&!green(c.toI,c.toJ,c.d,time);
 const limit=stop?0:red?Math.min(c.max,Math.max(0,(c.len-c.pos-5)*2)):c.curve?48:c.max;
 c.speed+=Math.max(-220*dt,Math.min(80*dt,limit-c.speed));c.pos+=c.speed*dt;
 if(c.pos>=c.len){if(c.curve)segment(c);else turn(c,rng)}
 pose(c);
 }
}
