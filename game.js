export const streetsX=[150,480,840,1170,1530];
export const streetsY=[150,470,810,1130];
export const cargo={
  parcel:['Посылка','Лёгкая коробка позволяет разогнаться до максимума.'],
  cake:['Торт','Сбрасывай скорость перед поворотом, чтобы торт не накренился.'],
  tank:['Аквариум','Держи дистанцию. Стекло особенно уязвимо при ударе.'],
  fridge:['Холодильник','Тяжёлый груз удлиняет тормозной путь.'],
  vase:['Ваза','Разгоняйся и тормози плавно. Обочина опасна для фарфора.']
};
export const jobs=[
 ['Первый рейс','parcel','Почтамт',[480,490],[840,490],55,220,'ясно'],
 ['К чаю','cake','Кондитерская',[840,490],[1170,830],58,310,'ясно'],
 ['Живая вода','tank','Океанариум',[480,170],[1170,490],57,370,'ясно'],
 ['Большой заказ','fridge','Склад № 4',[150,830],[840,1150],59,430,'ясно'],
 ['Тонкая работа','vase','Мастерская',[840,1150],[1530,490],58,470,'ясно'],
 ['До закрытия','parcel','Вокзал',[150,170],[1530,830],39,530,'срочно'],
 ['Мокрый асфальт','cake','Кафе «Маяк»',[1170,1150],[150,490],48,570,'дождь'],
 ['Ночная смена','tank','Старый порт',[480,1150],[1530,170],48,630,'ночь'],
 ['Последний экспресс','vase','Галерея',[1530,1150],[150,170],47,740,'дождь']
].map(([name,type,place,start,end,time,pay,weather],id)=>({id,name,type,place,start,end,time,pay,weather}));
export const parts={engine:'Двигатель',brakes:'Тормоза',suspension:'Подвеска',grip:'Сцепление',guard:'Защита груза'};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function fresh(){return {money:0,levels:Object.fromEntries(Object.keys(parts).map(k=>[k,0])),best:{},sfx:.65,music:.32}}
export function loadSave(raw){
 const s=fresh();
 try{const d=JSON.parse(raw); if(!d)return s;
 const num=(v,f,a,b)=>Number.isFinite(v)?clamp(v,a,b):f;
 s.money=Math.floor(num(d.money,0,0,1e9));
 for(const k in parts)s.levels[k]=Math.floor(num(d.levels?.[k],0,0,3));
 for(const j of jobs){const b=d.best?.[j.id];if(b&&Number.isInteger(b.score)&&Number.isFinite(b.time))s.best[j.id]={score:num(b.score,0,0,100),time:num(b.time,0,0,j.time)}}
 for(const k of ['music','sfx'])s[k]=num(d[k],s[k],0,1);
 }catch{}return s;
}
export const cost=level=>180+level*190;
export function buy(s,k){if(!(k in parts)||s.levels[k]>=3||s.money<cost(s.levels[k]))return false;s.money-=cost(s.levels[k]);s.levels[k]++;return true}
export function edge(x,y){
 return Math.min(...streetsX.map(v=>Math.abs(x-v)-(v===840?58:42)),...streetsY.map(v=>Math.abs(y-v)-(v===470?58:42)));
}
export function start(j){
 const direction=Math.sign(j.end[0]-j.start[0])||1;
 return {j,x:j.start[0]-80*direction,y:j.start[1],a:direction>0?0:Math.PI,vx:0,vy:0,speed:0,tilt:0,hp:100,t:0,hits:0,cool:0,loaded:false,done:'',drift:0,hit:false};
}
export const target=r=>r.loaded?r.j.end:r.j.start;
export function impact(r,v,levels){
 if(r.cool>0||v<30)return;
 r.hit=true;r.hits++;r.cool=.85;
 if(r.loaded)r.hp=clamp(r.hp-v*(r.j.kind==='Хрупкий заказ'?1.35:1)*(r.j.type==='tank'?.24:r.j.type==='vase'?.17:.09)/(1+levels.guard*.32),0,100)
}
export function step(r,input,dt,levels,cars=[]){
 if(r.done)return;
 if(!r.free||r.loaded)r.t+=dt;r.cool=Math.max(0,r.cool-dt);r.hit=false;
 const c=Math.cos(r.a),s=Math.sin(r.a),type=r.loaded?r.j.type:'parcel';
 let forward=r.vx*c+r.vy*s,side=-r.vx*s+r.vy*c;
 const verge=edge(r.x,r.y)>0,heavy=type==='fridge',hand=input.hand,turn=input.turn||0;
 const power=(148+levels.engine*25)*(heavy?.72:1);
 const braking=(275+levels.brakes*65)*(heavy?.63:1);
 const thrust=input.brake?(forward>4?-braking:-68):input.gas?power:0;
 forward+=thrust*dt;
 forward*=Math.exp(-(verge?1.25/(1+.2*levels.suspension):.20)*dt-(hand?.94*dt:0));
 forward=clamp(forward,-75,(type==='parcel'?292:255)+levels.engine*28);
 r.a+=turn*clamp(Math.abs(forward)/64,0,1)*Math.sign(forward)*(hand?3.3:2.32)*dt;
 side*=Math.exp(-(hand?1.6:(r.j?.weather==='дождь'?4.5:8)+levels.grip*1.8)*dt);
 // Carry lateral momentum as the front wheels change heading.
 const nc=Math.cos(r.a),ns=Math.sin(r.a),follow=clamp(dt*(hand?1.4:5+levels.grip),0,1);
 r.vx=(c+(nc-c)*follow)*forward-s*side;r.vy=(s+(ns-s)*follow)*forward+c*side;
 r.speed=Math.hypot(r.vx,r.vy);r.drift=Math.abs(side);
 const nx=r.x+r.vx*dt,ny=r.y+r.vy*dt;
 const blocked=(x,y)=>edge(x,y)>9||x<24||y<24||x>1656||y>1256;
 if(blocked(nx,ny)){impact(r,r.speed,levels);if(!blocked(nx,r.y))r.x=nx;if(!blocked(r.x,ny))r.y=ny;r.vx*=-.23;r.vy*=-.23}
 else{r.x=nx;r.y=ny}
 for(const car of cars)if(Math.hypot(r.x-car.x,r.y-car.y)<26&&r.cool<=0){impact(r,Math.max(55,r.speed),levels);r.vx*=-.35;r.vy*=-.35;break}
 const stress=Math.abs(turn)*r.speed/205;
 r.tilt+=(stress-r.tilt)*(1-Math.exp(-dt*4));
 let wear=type==='cake'?Math.max(0,r.tilt-.62)*12:0;
 if(type==='vase')wear+=Math.max(0,stress-.55)*6+(input.brake&&r.speed>90?2:0);
 if(verge&&r.speed>55)wear+=(type==='vase'?8:1.8)/(1+levels.suspension*.45);
 if(r.loaded)r.hp=Math.max(0,r.hp-wear*dt/(1+levels.guard*.32));
 if(!r.j)return;
 const [tx,ty]=target(r);
 if(r.t>=r.j.time||r.hp<=0)r.done='fail';
 else if(Math.hypot(tx-r.x,ty-r.y)<44&&r.speed<95){if(r.loaded)r.done='success';else r.loaded=true}
}
export function result(r){
 const score=Math.round(.60*r.hp+25*clamp(1-r.t/r.j.time,0,1)+15*Math.max(0,1-r.hits*.22));
 return {score,time:r.t,pay:r.done==='success'?Math.round(r.j.pay*score/100):0};
}
export function settle(s,r){
 if(r.done!=='success'||r.paid)return;r.paid=true;const v=result(r);s.money+=v.pay;
 if(r.free)return;
 const old=s.best[r.j.id];if(!old||v.score>old.score||v.score===old.score&&v.time<old.time)s.best[r.j.id]={score:v.score,time:v.time}
}
