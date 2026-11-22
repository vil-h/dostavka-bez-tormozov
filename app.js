import {drawCity,drawCar,drawHero} from './art.js';
import {Sound} from './sound.js';
import {jobs,parts,cargo,fresh,loadSave,buy,cost,start,step,target,traffic,result,settle,clamp} from './game.js';
const $=id=>document.getElementById(id), panel=$('panel'),world=$('world'),ctx=world.getContext('2d');
const city=document.createElement('canvas');city.width=1680;city.height=1280;drawCity(city.getContext('2d'));
const key='dostavka-bez-tormozov.v1';
let state=fresh(),saveWarning='';
try{state=loadSave(localStorage.getItem(key))}catch{saveWarning='Хранилище недоступно в этом браузере.'}
const sound=new Sound();sound.levels(state.sfx,state.music);
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{saveWarning='Браузер не сохранил прогресс.'}}
let run,scene='menu',last=performance.now(),acc=0,marks=[],flash=0;
const keys=new Set(),pointers=new Map();
const has=k=>keys.has(k)||[...pointers.values()].includes(k);
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const number=i=>String(i+1).padStart(2,'0');
const nextJob=()=>jobs.find(j=>!state.best[j.id])||jobs.at(-1);
const available=j=>j.id===0||!!state.best[j.id-1];
const button=(label,action,cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
function shell(content,foot=''){
 $('hud').hidden=true;sound.idle();keys.clear();pointers.clear();
 document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));
 panel.innerHTML='<div class="wrap"><header><div class="brand"><i class="logo">≋</i> КУРЬЕРСКАЯ СЛУЖБА</div><strong class="balance">'+state.money+' ₽</strong></header>'+content+'<footer><span>'+foot+'</span><span>'+saveWarning+'</span></footer></div>';
 panel.scrollTop=0;
 const hero=$('hero');if(hero)drawHero(hero.getContext('2d'),hero.width,hero.height);
}
const poster='<div class="poster"><canvas id="hero" width="620" height="255" aria-label="Оранжевый курьерский фургон"></canvas><span class="plate">ФУРГОН · ДБТ–01</span></div>';
function menu(){
 scene='menu';const j=nextJob();
 shell('<div class="hero"><div><span class="eyebrow">ГОРОДСКАЯ АРКАДА</span><h1>ДОСТАВКА<br> <em>БЕЗ ТОРМОЗОВ</em></h1><p>Успей к двери клиента и довези груз целым.</p></div>'+poster+'</div><div class="sectiontitle"><h2>Диспетчерская</h2><small>РЕЙСЫ '+Object.keys(state.best).length+' / 9</small></div><article class="job"><div class="row"><div><small>ЗАКАЗ '+number(j.id)+' · '+cargo[j.type][0].toUpperCase()+'</small><h3>'+j.name+'</h3></div><b class="balance">до '+j.pay+' ₽</b></div><p>'+j.place+' · '+j.time+' сек · '+j.weather+'</p>'+button('Взять заказ','go:'+j.id,'primary')+'</article><div class="menu">'+button('Все заказы','orders')+button('Гараж','garage')+button('Настройки','settings')+'</div>','WASD или стрелки · Пробел — ручник · Esc — пауза');
}
function page(name,title,body,foot=''){scene=name;shell('<section class="page"><div class="cardhead"><h2>'+title+'</h2>'+button('В меню','menu')+'</div>'+body+'</section>',foot)}
function orders(){page('orders','Заказы','<div class="list orders">'+jobs.map(j=>'<article class="item"><small>РЕЙС '+number(j.id)+' · '+cargo[j.type][0]+'</small><h3>'+j.name+'</h3><span class="meta">'+j.place+' · '+j.time+' с · '+j.weather+'</span>'+button(state.best[j.id]?'Повторить · '+state.best[j.id].score+'/100':available(j)?'Взять · '+j.pay+' ₽':'После рейса '+number(j.id-1),'go:'+j.id,'',!available(j))+'</article>').join('')+'</div>')}
const effects={engine:'Больше тяги и выше максимальная скорость.',brakes:'Короче тормозной путь.',suspension:'Меньше тряски и потери скорости на обочине.',grip:'Быстрее возвращает сцепление после заноса.',guard:'Снижает повреждения при ударах и тряске.'};
function garage(){page('garage','Гараж',poster+'<div class="list">'+Object.entries(parts).map(([k,n])=>{const l=state.levels[k];return '<article class="item row"><div><h3>'+n+'</h3><span class="meta">'+effects[k]+'</span><small class="level">УРОВЕНЬ '+l+' / 3</small></div>'+button(l===3?'Максимум':cost(l)+' ₽','buy:'+k,'',l===3||state.money<cost(l))+'</article>'}).join('')+'</div>','Улучшения оплачиваются из заработка за рейсы.')}
function settings(confirm=false){page('settings','Настройки','<div class="item">'+[['sfx','Эффекты'],['music','Музыка']].map(([k,n])=>'<label>'+n+' <output id="val-'+k+'">'+Math.round(state[k]*100)+'%</output><input type="range" data-volume="'+k+'" min="0" max="100" value="'+Math.round(state[k]*100)+'"></label>').join('')+'</div><div class="actions">'+(confirm?'Удалить деньги, рекорды и улучшения? '+button('Удалить','reset','danger')+button('Отмена','settings'):button('Сбросить прогресс','confirm','danger'))+'</div>')}
function begin(id){if(!jobs[id]||!available(jobs[id]))return;run=start(jobs[id]);marks=[];flash=0;acc=0;resume();sound.fx('start')}
function resume(){scene='drive';panel.innerHTML='';$('hud').hidden=false;last=performance.now();acc=0;updateHud()}
function pause(){if(scene!=='drive')return;scene='pause';shell('<section class="page"><h2>На паузе</h2><p class="desc">'+run.j.name+'</p><div class="menu">'+button('Продолжить','resume','primary')+button('Заново','go:'+run.j.id)+button('В меню','menu')+'</div></section>','Таймер остановлен.')}
function finish(){
 scene='result';const ok=run.done==='success',v=result(run);settle(state,run);save();sound.fx(run.done);
 shell('<section class="page"><small class="eyebrow">РЕЙС '+number(run.j.id)+' · '+run.j.name+'</small><h2>'+(ok?'Доставлено!':run.hp<=0?'Груз разбит':'Время вышло')+'</h2><div class="item"><h3>'+(ok?'Оценка '+v.score+' / 100 · +'+v.pay+' ₽':'Попробуй другой маршрут')+'</h3><p>Время '+fmt(run.t)+' · Груз '+Math.round(run.hp)+'% · Удары '+run.hits+'</p></div><div class="menu">'+(ok&&run.j.id<jobs.length-1?button('Следующий рейс','go:'+(run.j.id+1),'primary'):'')+button('Повторить','go:'+run.j.id)+button('Гараж','garage')+button('В меню','menu')+'</div></section>');
}
panel.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;sound.unlock();const [action,arg]=b.dataset.action.split(':');
 if(action==='go')begin(Number(arg));else if(action==='buy'){if(buy(state,arg)){save();sound.fx('buy')}garage()}
 else if(action==='reset'){const {sfx,music}=state;state={...fresh(),sfx,music};save();settings()}
 else ({menu,garage,orders,resume,settings,confirm:()=>settings(true)})[action]?.()
});
panel.addEventListener('input',e=>{const k=e.target.dataset.volume;if(!k)return;state[k]=Number(e.target.value)/100;$('val-'+k).textContent=e.target.value+'%';sound.unlock();sound.levels(state.sfx,state.music);save()});
$('pause').onclick=pause;
const bindings={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'hand'};
addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.repeat){if(scene==='pause'){sound.unlock();resume()}else pause()}if(scene==='drive'&&bindings[e.code]){e.preventDefault();keys.add(bindings[e.code])}});
addEventListener('keyup',e=>keys.delete(bindings[e.code]));
for(const b of document.querySelectorAll('[data-key]')){
 b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.key);b.classList.add('held');sound.unlock()};
 b.onlostpointercapture=b.onpointercancel=b.onpointerup=e=>{pointers.delete(e.pointerId);b.classList.remove('held')};
}
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();sound.suspend()}});
function updateHud(){const r=run,[tx,ty]=target(r);
 $('order').textContent=(r.loaded?'Доставка · '+r.j.place:'Погрузка · '+cargo[r.j.type][0])+' · '+Math.round(Math.hypot(tx-r.x,ty-r.y)/3)+' м';
 $('clock').textContent=fmt(Math.ceil(r.j.time-r.t));$('health').textContent='Груз '+(r.loaded?Math.ceil(r.hp)+'%':'—');$('speed').textContent=Math.round(r.speed*.36)+' км/ч';
 $('guide').textContent=!r.loaded?'Подъедь к зелёному кругу и притормози':Math.hypot(tx-r.x,ty-r.y)<115?'Притормози в круге доставки':r.j.type==='cake'&&r.tilt>.6?'Торт накренился!':cargo[r.j.type][1];
}
let w=1,h=1,dpr=1;
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);world.width=Math.round(w*dpr);world.height=Math.round(h*dpr);draw()}
function draw(){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#1d302f';ctx.fillRect(0,0,w,h);
 if(!run){ctx.drawImage(city,0,0,w,h);return}
 const r=run,z=Math.max(.76,Math.min(1.55,Math.min(w,h)/435)),vw=w/z,vh=h/z;
 const cam=(v,size,total)=>size>=total?(total-size)/2:clamp(v-size/2,0,total-size);
 const x=cam(r.x+r.vx*.25,vw,1680),y=cam(r.y+r.vy*.25,vh,1280);
 ctx.save();ctx.scale(z,z);ctx.translate(-x,-y);ctx.drawImage(city,0,0);
 for(const m of marks){ctx.fillStyle='#23262990';ctx.fillRect(m.x,m.y,3,4)}
 const cars=traffic(r.t);cars.forEach((car,i)=>drawCar(ctx,car.x,car.y,car.a,['#87b6b1','#bea7b2','#d4bd7e'][i%3]));
 if(r.j.weather==='ночь'){ctx.fillStyle='#12193c80';ctx.fillRect(x,y,vw,vh);ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.a);ctx.fillStyle='#fff5b237';ctx.beginPath();ctx.moveTo(12,-7);ctx.lineTo(115,-36);ctx.lineTo(115,36);ctx.lineTo(12,7);ctx.fill();ctx.restore()}
 const [tx,ty]=target(r);ctx.strokeStyle='#cbff6a';ctx.lineWidth=3;ctx.fillStyle='#afff4a39';ctx.beginPath();ctx.arc(tx,ty,34+3*Math.sin(r.t*4),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#18271d';ctx.fillRect(tx-12,ty-12,24,24);ctx.fillStyle='#d2ff70';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(r.loaded?'Б':'А',tx,ty+6);
 drawCar(ctx,r.x,r.y,r.a);ctx.restore();
 if(r.j.weather==='дождь'){ctx.strokeStyle='#cbf1ff64';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<55;i++){const a=(i*223+r.t*140)%w,b=(i*131+r.t*390)%h;ctx.moveTo(a,b);ctx.lineTo(a-4,b-11)}ctx.stroke()}
 const sx=(tx-x)*z,sy=(ty-y)*z;
 if(sx<35||sy<95||sx>w-35||sy>h-95){const ax=clamp(sx,28,w-28),ay=clamp(sy,110,h-102);ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(ty-r.y,tx-r.x));ctx.fillStyle='#c8f85f';ctx.strokeStyle='#142117';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-9,-9);ctx.lineTo(-5,0);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 if(flash>0){ctx.fillStyle='rgba(255,99,44,'+flash+')';ctx.fillRect(0,0,w,h)}
}
function tick(now){const elapsed=Math.min((now-last)/1000,.12);last=now;
 if(scene==='drive'){acc+=elapsed;const input={gas:has('gas'),brake:has('brake'),hand:has('hand'),turn:Number(has('right'))-Number(has('left'))};
 while(acc>=1/60&&!run.done){acc-=1/60;const loaded=run.loaded,hp=run.hp;step(run,input,1/60,state.levels,traffic(run.t));if(!loaded&&run.loaded)sound.fx('pickup');if(run.hit){sound.fx('hit');flash=.21}if(Math.floor(hp/10)>Math.floor(run.hp/10))sound.fx('damage');
 if(run.drift>18){marks.push({x:run.x,y:run.y});if(marks.length>220)marks.shift()}}
 flash=Math.max(0,flash-elapsed);sound.drive(run.speed/300,input.gas,input.brake,run.drift>20);draw();updateHud();if(run.done)finish()}
 requestAnimationFrame(tick)}
addEventListener('resize',resize);resize();menu();requestAnimationFrame(tick);
