import {scores} from './raceMusic.js';
import {legends,createLegends,moveLegends} from './legends.js';
import {legendSprite,portrait} from './legendArt.js';
import {guidance,pointAt} from './routing.js';
import {bounds} from './geography.js';
import {atlas,drawRegion} from './countryside.js';
import {roadTraffic,advanceRoadTraffic} from './city.js';
import {events,difficulties} from './challenges.js';
import {newContest,advanceContest,finishOpponents,award,recover} from './contest.js';
import {eventsView,briefing,resultsView,clockText} from './contestUI.js';
import {drawCourse,drawMini,liveMap,updateTrails,drawTrails} from './eventArt.js';
import {vehicles,stockCar,purchase,selectCar,paintCar,parked} from './vehicles.js';
import {garageView} from './garage.js';
import {bindPedals,bindWheel,createSteering,smoothSteering,driveInput} from './input.js';
import {freeRide,dispatch,acceptOffer,skipOffer,closeDelivery,createTraffic,advanceTraffic,green} from './city.js';
import {drawCity,drawCar,drawVehicle,drawShowroom} from './art.js';
import {Sound} from './sound.js';
import {jobs,parts,cargo,fresh,loadSave,buy,cost,start,step,target,streetsX,streetsY,result,settle,clamp} from './game.js';
const $=id=>document.getElementById(id), panel=$('panel'),world=$('world'),ctx=world.getContext('2d');
const city=document.createElement('canvas');city.width=1680;city.height=1280;drawCity(city.getContext('2d'));
const key='dostavka-bez-tormozov.v1';
let state=fresh(),saveWarning='';
try{state=loadSave(localStorage.getItem(key))}catch{saveWarning='Хранилище недоступно в этом браузере.'}
const sound=new Sound();sound.levels(state.sfx,state.music);
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{saveWarning='Браузер не сохранил прогресс.'}}
let rural=[],roam=[];
let competition=null,eventTab='race';
let run,scene='menu',last=performance.now(),acc=0,marks=[],flash=0;
const keys=new Set(),pointers=new Map();
const wheel=createSteering();
const has=k=>keys.has(k)||[...pointers.values()].includes(k);
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const number=i=>String(i+1).padStart(2,'0');
const available=j=>j.id===0||!!state.best[j.id-1];
const button=(label,action,cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
function shell(content,foot=''){
 $('hud').hidden=true;sound.idle(scene==='pause'||scene==='atlas');resetInput();

 panel.innerHTML='<div class="wrap"><header><div class="brand"><i class="logo">≋</i> КУРЬЕРСКАЯ СЛУЖБА</div><strong class="balance">'+state.money+' ₽</strong></header>'+content+'<footer><span>'+foot+'</span><span>'+saveWarning+'</span></footer></div>';
 panel.scrollTop=0;
 const hero=$('hero');if(hero)drawShowroom(hero.getContext('2d'),hero.width,hero.height,state.selected,state.garage[state.selected].look);
}
const poster=()=>'<div class="poster"><canvas id="hero" width="620" height="255" aria-label="' + vehicles[state.selected].name + '"></canvas><span class="plate">' + vehicles[state.selected].name + '</span></div>';
function menu(){
 scene='menu';run=null;competition=null;
 shell('<div class="hero"><div><span class="eyebrow">ВЕРСИЯ 1.6 · ЛЕГЕНДЫ УЛИЦ</span><h1>ДОСТАВКА<br> <em>БЕЗ ТОРМОЗОВ</em></h1><p>За рулём решаешь ты. Исследуй район или возьми заказ по пути.</p></div>'+poster()+'</div><article class="job"><small>СВОБОДНЫЙ ГОРОД</small><h3>Город в твоём распоряжении</h3><p>Езжай куда хочется. Диспетчер предложит работу в дороге.</p>'+button('Свободная езда','free','primary launch')+'</article><div class="menu">'+button('Соревнования','events')+button('Карьера · '+Object.keys(state.best).length+'/'+jobs.length,'orders')+button('Гараж','garage')+button('Настройки','settings')+'</div>','WASD или стрелки · Пробел — ручник · Esc — пауза');
}
function page(name,title,body,foot=''){scene=name;shell('<section class="page"><div class="cardhead"><h2>'+title+'</h2>'+button('В меню','menu')+'</div>'+body+'</section>',foot)}
function eventPage(body){
 page('events','Соревнования',body);
 for(const el of panel.querySelectorAll('[data-course]'))drawMini(el.getContext('2d'),events[el.dataset.course]);
}
function openEvents(){competition=null;run=null;eventPage(button('Легенды улиц','legends')+eventsView(state,eventTab))}
function startEvent(id){
 competition=newContest(id,state.selected,Math.random,state.difficulty);run=competition.player;cars=[];rural=[];roam=[];sound.score?.stop();marks=[];cityTime=0;flash=0;
 for(const bot of competition.bots){if(bot.name==='Лис'||bot.name==='Искра'){bot.custom=true;bot.sprite=legendSprite(bot.name==='Лис'?'fox':'spark');continue}const sprite=document.createElement('canvas');sprite.width=64;sprite.height=44;drawVehicle(sprite.getContext('2d'),32,22,0,bot.model,{...stockCar(bot.model).look,color:bot.name==='Лис'?'#ff9f4b':bot.name==='Рысь'?'#dc6268':'#997acb'});bot.sprite=sprite}
 const m=$('mapRoad').getContext('2d');if(competition.e.zone){m.drawImage(city,0,0,168,128);const [l,t,r,b]=competition.e.zone;m.fillStyle='#ffb24d45';m.strokeStyle='#ffc777';m.fillRect(l/10,t/10,(r-l)/10,(b-t)/10);m.strokeRect(l/10,t/10,(r-l)/10,(b-t)/10)}
 resume();sound.fx('count');
}
function competitionHud(){
 const s=competition,e=s.e,p=s.player,d=s.drift;
 $('hud').classList.remove('idle');$('offer').hidden=true;$('health').hidden=true;$('clock').hidden=false;
 $('order').textContent=e.type==='race'?s.place+' / '+(s.bots.length+1)+' место'+(s.noticeUntil>s.t?' · '+s.notice:''):e.name;
 $('clock').textContent=clockText(e.limit?Math.max(0,e.limit-s.t):s.t);
 $('speed').textContent=Math.round(p.speed*.36)+' км/ч';$('wallet').textContent=e.type==='drift'?(d.total+Math.floor(d.chain))+' очк.':'Ворота '+p.gate+'/'+e.gates.length;
 $('guide').textContent=e.type==='drift'?(p.x<e.zone[0]||p.y<e.zone[1]||p.x>e.zone[2]||p.y>e.zone[3]?'За границей дрифт-зоны':'Серия +'+Math.floor(d.chain)+' · ×'+d.mult):guidance(e,p);
 $('recover').hidden=!!e.zone||!(p.missed||p.off||p.stuck>2);if(!e.zone)liveMap($('mapRoad').getContext('2d'),s);$('mapCar').hidden=!e.zone;
 $('startLight').hidden=s.count<=0&&s.t>.7;$('startLight').textContent=s.count>0?Math.ceil(s.count):'СТАРТ!';
 const dot=$('mapCar');dot.style.left=p.x/(e.outside?bounds[0]:1680)*100+'%';dot.style.top=p.y/(e.outside?bounds[1]:1280)*100+'%';dot.style.transform='translate(-50%,-50%) rotate('+p.a+'rad)';
}
function contestFrame(input,dt){
 const s=competition,d=s.drift,lastCount=Math.ceil(s.count),lastPlace=s.place,oldChain=d.chain,oldMulti=d.mult;
 advanceContest(s,input,dt,state.garage[run.model].levels);
 if(lastCount>0&&s.count===0&&scores[s.e.id])sound.score?.start(s.e.id);
 if(lastCount!==Math.ceil(s.count))sound.fx(s.count>0?'count':'go');
 if(s.place!==lastPlace&&s.t>.5){s.notice=s.place<lastPlace?'Обгон':'Обошли';s.noticeUntil=s.t+1.2;if(s.place<lastPlace)sound.fx('pass')}
 if(!oldChain&&d.chain)sound.fx('combo');else if(d.mult>oldMulti)sound.fx('multi');else if(oldChain&&!d.chain&&run.hit)sound.fx('loss');
 updateTrails(s.fx,run,dt,w<950);
}
function endContest(){
 const s=competition;finishOpponents(s);
 const v=award(s,state);save();scene='contestResult';
 sound.fx(s.e.type==='race'&&s.place===1?'win':'finish');if(v.improved)sound.fx('record');
 shell(resultsView(s,state,v));
}
function orders(){page('orders','Карьера курьера','<div class="list orders">'+jobs.map(j=>'<article class="item"><small>РЕЙС '+number(j.id)+' · '+cargo[j.type][0]+'</small><h3>'+j.name+'</h3><span class="meta">'+j.place+' · '+j.time+' с · '+j.weather+'</span>'+button(state.best[j.id]?'Повторить · '+state.best[j.id].score+'/100':available(j)?'Взять · '+j.pay+' ₽':'После рейса '+number(j.id-1),'go:'+j.id,'',!available(j))+'</article>').join('')+'</div>')}
let browseModel='van',bayTab='stats',returnToRide=false;
function garage(){
 returnToRide=scene==='pause'&&run?.free&&!run.j;
 if(returnToRide&&!parked(run))return;
 browseModel=state.selected;bayTab='stats';renderGarage();
}
function renderGarage(){
 scene='garage';shell(garageView(state,browseModel,bayTab,returnToRide));
 const canvas=$('displayCar'),car=state.garage[browseModel]||stockCar(browseModel);
 drawShowroom(canvas.getContext('2d'),canvas.width,canvas.height,browseModel,car.look);
}
function garageAction(action,arg,value){
 let changed=false;
 if(action==='model'&&Object.hasOwn(vehicles,arg))browseModel=arg;
 else if(action==='tab')bayTab=arg;
 else if(action==='purchase')changed=purchase(state,browseModel);
 else if(action==='select')changed=selectCar(state,browseModel,returnToRide?run:null);
 else if(action==='trim')changed=paintCar(state,browseModel,arg,value);
 else if(action==='upgrade')changed=buy(state,arg,browseModel);
 else return false;
 if(changed){save();if(action==='purchase'||action==='upgrade')sound.fx('buy')}
 renderGarage();return true;
}
function controlsForm(){
 const c=state.controls;
 const range=(k,name,min,max)=>'<label>'+name+' <output id="setting-'+k+'">'+Math.round(c[k]*100)+'%</output><input data-control="'+k+'" type="range" min="'+min+'" max="'+max+'" step="5" value="'+Math.round(c[k]*100)+'"></label>';
 const check=(k,name)=>'<label class="check"><input data-control="'+k+'" type="checkbox" '+(c[k]?'checked':'')+'>'+name+'</label>';
 return '<fieldset class="item"><legend>Управление</legend><label>Поворот<select data-control="scheme"><option value="wheel">Аналоговый руль</option><option value="buttons" '+(c.scheme==='buttons'?'selected':'')+'>Стрелки</option></select></label>'+range('sensitivity','Чувствительность руля',70,160)+range('size','Размер управления',85,115)+range('opacity','Непрозрачность',45,100)+check('swap','Поменять стороны')+check('auto','Автоматический газ')+'<p>Для дрифта ведите палец с газа вверх. Верните его вниз, чтобы отпустить ручник.</p></fieldset>';
}
function applyControls(){
 const c=state.controls,t=$('touch');t.dataset.scheme=c.scheme;t.classList.toggle('swap',c.swap);
 t.style.setProperty('--scale',c.size);t.style.setProperty('--alpha',c.opacity);
}
function resetInput(){
 keys.clear();pointers.clear();Object.assign(wheel,createSteering());
 $('knob').style.transform='translateX(0px)';
 document.querySelectorAll('.held,.drifting').forEach(el=>el.classList.remove('held','drifting'));
}
async function fullscreen(){
 const el=document.documentElement;
 try{const request=el.requestFullscreen||el.webkitRequestFullscreen;
 if(!request)throw Error();await request.call(el);
 }catch{const status=$('fullscreenStatus');if(status)status.textContent='Полный экран недоступен в этом браузере.'}
}
const fullButton=()=>button('На весь экран','fullscreen')+'<span id="fullscreenStatus" role="status"></span>';
function settings(confirm=false){page('settings','Настройки','<fieldset class="jukebox"><legend>Музыка гонок</legend>'+Object.entries(scores).map(([k,v])=>button(v.name,'listen:'+k)).join('')+button('Стоп','listen:stop')+'<output id="playing"></output></fieldset>'+controlsForm()+'<label class="item">Сложность гонок <select id="raceDifficulty">'+Object.entries(difficulties).map(([d,v])=>'<option value="'+d+'" '+(d===state.difficulty?'selected':'')+'>'+v.name+'</option>').join('')+'</select></label>'+fullButton()+'<div class="item">'+[['sfx','Эффекты'],['music','Музыка']].map(([k,n])=>'<label>'+n+' <output id="val-'+k+'">'+Math.round(state[k]*100)+'%</output><input type="range" data-volume="'+k+'" min="0" max="100" value="'+Math.round(state[k]*100)+'"></label>').join('')+'</div><div class="actions">'+(confirm?'Удалить деньги, рекорды и улучшения? '+button('Удалить','reset','danger')+button('Отмена','settings'):button('Сбросить прогресс','confirm','danger'))+'</div>')}
let cars=[],cityTime=0,shownOffer=null;
function enterCity(r){competition=null;run=r;run.model=state.selected;cars=createTraffic();rural=roadTraffic();roam=createLegends(r);atlas($('mapRoad'),null,null,null,false);cityTime=0;marks=[];flash=0;resume();sound.fx('start')}
function begin(id){if(!jobs[id]||!available(jobs[id]))return;enterCity(start(jobs[id]))}
function resume(){if(competition&&competition.count===0&&scores[competition.e.id])sound.score?.start(competition.e.id,true);scene='drive';panel.innerHTML='';$('hud').hidden=false;last=performance.now();acc=0;updateHud()}
function pause(){if(scene!=='drive')return;scene='pause';shell('<section class="page"><h2>На паузе</h2><p class="desc">'+(competition?.e.name||run.j?.name||'Свободная езда')+'</p><div class="menu">'+button('Продолжить','resume','primary')+button('Карта мира','atlas')+fullButton()+(competition?button('Заново','startEvent:'+competition.e.id):run.free?button(run.j?'Гараж после доставки':parked(run)?'Гараж':'Остановись для гаража','garage','',!parked(run)):button('Заново','go:'+run.j.id))+button('В меню','menu')+'</div></section>','Таймер остановлен.')}
function finish(){
 scene='result';const ok=run.done==='success',v=result(run);settle(state,run);save();sound.fx(run.done);
 shell('<section class="page"><small class="eyebrow">РЕЙС '+number(run.j.id)+' · '+run.j.name+'</small><h2>'+(ok?'Доставлено!':run.hp<=0?'Груз разбит':'Время вышло')+'</h2><div class="item"><h3>'+(ok?'Оценка '+v.score+' / 100 · +'+v.pay+' ₽':'Попробуй другой маршрут')+'</h3><p>Время '+fmt(run.t)+' · Груз '+Math.round(run.hp)+'% · Удары '+run.hits+'</p></div><div class="menu">'+(ok&&run.j.id<jobs.length-1?button('Следующий рейс','go:'+(run.j.id+1),'primary'):'')+button('Повторить','go:'+run.j.id)+button('Гараж','garage')+button('В меню','menu')+'</div></section>');
}
panel.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;sound.unlock();const [action,arg,value]=b.dataset.action.split(':');
 if(scene==='garage'&&garageAction(action,arg,value))return;
 if(action==='legends'){page('legends','Легенды улиц','<div class="legendCards">'+Object.entries(legends).map(([id,l])=>'<article><canvas width="680" height="310" data-legend="'+id+'"></canvas><small>'+l.name+' · Уличный гонщик</small><h3>'+l.car+'</h3><p>'+l.style+'</p></article>').join('')+'</div>'+button('К соревнованиям','events'));for(const cv of panel.querySelectorAll('[data-legend]'))portrait(cv,cv.dataset.legend)}
 else if(action==='listen'){if(arg==='stop')sound.score?.stop();else sound.score?.start(arg);const out=$('playing');if(out)out.textContent=scores[arg]?.name||'Остановлено'}
 else if(action==='events')openEvents();
 else if(action==='category'){eventTab=arg;openEvents()}
 else if(action==='difficulty'){state.difficulty=value;save();eventPage(briefing(events[arg],state))}
 else if(action==='brief')eventPage(briefing(events[arg],state));
 else if(action==='startEvent')startEvent(arg);
 else if(action==='go')begin(Number(arg));
 else if(action==='reset'){const {sfx,music,controls,difficulty}=state;state=Object.assign(fresh(),{sfx,music,controls,difficulty});save();settings()}
 else ({atlas:showAtlas,fullscreen,menu,free:()=>enterCity(freeRide()),garage,orders,resume,settings,confirm:()=>settings(true)})[action]?.()
});
panel.addEventListener('input',e=>{
 const el=e.target,k=el.dataset.control;if(el.id==='raceDifficulty'){state.difficulty=el.value;save();return}if(!k)return;
 if(el.type==='range'){state.controls[k]=Number(el.value)/100;$('setting-'+k).textContent=el.value+'%'}
 else state.controls[k]=el.type==='checkbox'?el.checked:el.value;
 resetInput();applyControls();save();
});
panel.addEventListener('input',e=>{const k=e.target.dataset.volume;if(!k)return;state[k]=Number(e.target.value)/100;$('val-'+k).textContent=e.target.value+'%';sound.unlock();sound.levels(state.sfx,state.music);save()});
function showAtlas(){
 if(!run)return;scene='atlas';resetInput();
 shell('<section class="page"><div class="cardhead"><h2>Карта мира</h2>'+button('К поездке','resume','primary')+'</div><canvas id="worldAtlas" width="840" height="290"></canvas><p>● Вы · оранжевая метка — текущая цель</p></section>');
 const goal=competition?.e.gates[run.gate];
 atlas($('worldAtlas'),[run.x,run.y],goal?[goal.x,goal.y]:run.j?target(run):null,competition?.e.points||run.j?.via);
}
$('atlas').onclick=showAtlas;
$('pause').onclick=pause;
$('recover').onclick=()=>{if(scene==='drive'&&competition&&recover(competition)){competition.fx.previous=null;resetInput();updateHud()}};
$('home').onclick=menu;
function answer(accept){if(scene!=='drive'||!run.offer)return;if(accept)acceptOffer(run);else skipOffer(run);updateHud()}
$('accept').onclick=()=>answer(true);$('skip').onclick=()=>answer(false);
const bindings={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'hand'};
addEventListener('keydown',e=>{if(!e.repeat&&scene==='drive'&&run.offer&&['KeyE','KeyQ'].includes(e.code)){answer(e.code==='KeyE');e.preventDefault();return}if(e.code==='Escape'&&!e.repeat){if(scene==='pause'||scene==='atlas'){sound.unlock();resume()}else pause()}if(scene==='drive'&&bindings[e.code]){e.preventDefault();keys.add(bindings[e.code])}});
addEventListener('keyup',e=>keys.delete(bindings[e.code]));
applyControls();bindWheel($('wheel'),wheel,()=>state.controls.sensitivity);
bindPedals(document.querySelectorAll('[data-key]'),pointers,()=>sound.unlock());
addEventListener('blur',()=>{if(scene==='drive')pause();else sound.idle();if($('playing'))$('playing').textContent='Остановлено'});document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();sound.suspend()}});
function updateHud(){
 $('recover').hidden=true;$('mapCar').hidden=false;
 $('navigator').hidden=!(competition||run?.free||run?.j?.via);$('startLight').hidden=true;$('hud').classList.toggle('racing',!!competition);
 if(competition){competitionHud();return}
 const r=run;const locator=$('mapCar');locator.style.left=r.x/bounds[0]*100+'%';locator.style.top=r.y/bounds[1]*100+'%';locator.style.transform='translate(-50%,-50%) rotate('+r.a+'rad)';const j=r.j,showTimer=j&&(!r.free||r.loaded);
 const distance=j?Math.round(Math.hypot(target(r)[0]-r.x,target(r)[1]-r.y)/3):0;
 $('order').textContent=j?(r.loaded?'Доставка · '+j.place:'Погрузка · '+(j.from||cargo[j.type][0]))+' · '+distance+' м':'Свободная езда';
 $('clock').hidden=!showTimer;if(showTimer)$('clock').textContent=fmt(Math.ceil(j.time-r.t));
 $('health').hidden=!r.loaded;if(r.loaded)$('health').textContent=cargo[j.type][0]+' '+Math.ceil(r.hp)+'%';
 $('speed').textContent=Math.round(r.speed*.36)+' км/ч';$('wallet').textContent=state.money+' ₽';
 $('hud').classList.toggle('idle',!j&&!r.noticeTime);
 $('guide').textContent=r.noticeTime>0?r.notice:!j?'Газ и поворот · ручник для заноса':!r.loaded?'Притормози у метки А':distance<38?'Притормози у метки Б':cargo[j.type][1];
 $('offer').hidden=!r.offer;
 if(r.offer&&r.offer!==shownOffer){
  shownOffer=r.offer;const o=r.offer;$('kind').textContent=o.kind;
  $('route').textContent=o.from+' → '+o.place;
  $('terms').textContent=cargo[o.type][0]+' · до '+o.pay+' ₽ · '+o.time+' с после погрузки';
 }
}
let w=1,h=1,dpr=1;
const screenBox=document.querySelector('main');
function resize(){
 const v=window.visualViewport;
 const width=Math.round(v?.width||innerWidth),height=Math.round(v?.height||innerHeight);
 if((w>h)!==(width>height))resetInput();
 w=width;h=height;screenBox.style.width=w+'px';screenBox.style.height=h+'px';
 dpr=Math.min(devicePixelRatio||1,2);world.width=Math.round(w*dpr);world.height=Math.round(h*dpr);draw();
}
function draw(){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#1d302f';ctx.fillRect(0,0,w,h);
 if(!run){ctx.drawImage(city,0,0,w,h);return}
 const r=run,z=Math.max(.76,Math.min(1.55,Math.min(w,h)/435)),vw=w/z,vh=h/z;
 const cam=(v,size,total)=>size>=total?(total-size)/2:clamp(v-size/2,0,total-size);
 const mobile=w<=950&&h<=500;
 const axis=(position,velocity,size,total)=>mobile?clamp(cam(position+velocity*(.32+.18*clamp((r.x-1600)/400,0,1)),size,total),position-size*.68,position-size*.32):cam(position+velocity*.25,size,total);
 const x=axis(r.x,r.vx,vw,bounds[0]),y=axis(r.y,r.vy,vh,bounds[1]);
 ctx.save();ctx.scale(z,z);ctx.translate(-x,-y);drawRegion(ctx,x,y,vw,vh);if(x<1680&&y<1280)ctx.drawImage(city,0,0);
 for(const c of roam){if(Math.abs(c.x-r.x)>vw||Math.abs(c.y-r.y)>vh)continue;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.drawImage(legendSprite(c.id),-38,-22,76,44);ctx.restore();ctx.fillStyle=legends[c.id].color;ctx.font='bold 10px system-ui';ctx.fillText(legends[c.id].name.toUpperCase()+(c.pass>0?' ›':''),c.x-13,c.y-23)}
 for(const m of marks){ctx.fillStyle='#23262990';ctx.fillRect(m.x,m.y,3,4)}
 for(let i=0;i<streetsX.length;i++)for(let j=0;j<streetsY.length;j++){
 if(i!==2&&j!==1)continue;
 for(let d=0;d<4;d++){const angle=d*Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
 const lx=streetsX[i]-dx*49-dy*34,ly=streetsY[j]-dy*49+dx*34;
 ctx.fillStyle='#17201e';ctx.fillRect(lx-5,ly-5,10,10);ctx.fillStyle=green(i,j,d,cityTime)?'#a2f574':'#ff845b';ctx.fillRect(lx-3,ly-3,6,6)}
 }
 cars.concat(rural).filter(c=>c.x>x-50&&c.x<x+vw+50&&c.y>y-50&&c.y<y+vh+50).forEach((car,i)=>drawCar(ctx,car.x,car.y,car.a,['#87b6b1','#bea7b2','#d4bd7e'][i%3]));
 if(r.j?.weather==='ночь'||competition?.e.night){ctx.fillStyle='#12193c80';ctx.fillRect(x,y,vw,vh);ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.a);ctx.fillStyle='#fff5b237';ctx.beginPath();ctx.moveTo(12,-7);ctx.lineTo(115,-36);ctx.lineTo(115,36);ctx.lineTo(12,7);ctx.fill();ctx.restore()}
 if(competition){
 drawCourse(ctx,competition.e,r,competition.t);drawTrails(ctx,competition.fx);
 for(const bot of competition.bots){ctx.save();ctx.translate(bot.x,bot.y);ctx.rotate(bot.a);if(bot.custom)ctx.drawImage(bot.sprite,-38,-22,76,44);else ctx.drawImage(bot.sprite,-32,-22);ctx.restore()}
 }
 const gate=competition?.e.type!=='drift'?competition?.e.gates[r.gate]:null;
 const aim=gate&&!r.missed?pointAt(competition.e,r.progress+(r.off?0:230)):gate;
 const [tx,ty]=aim?[aim.x,aim.y]:r.j?target(r):[r.x,r.y];if(r.j){ctx.strokeStyle='#cbff6a';ctx.lineWidth=3;ctx.fillStyle='#afff4a39';ctx.beginPath();ctx.arc(tx,ty,34+3*Math.sin(cityTime*4),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#18271d';ctx.fillRect(tx-12,ty-12,24,24);ctx.fillStyle='#d2ff70';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(r.loaded?'Б':'А',tx,ty+6);}
 drawVehicle(ctx,r.x,r.y,r.a,r.model,state.garage[r.model].look);ctx.restore();
 if(r.j?.weather==='дождь'){ctx.strokeStyle='#cbf1ff64';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<55;i++){const a=(i*223+r.t*140)%w,b=(i*131+r.t*390)%h;ctx.moveTo(a,b);ctx.lineTo(a-4,b-11)}ctx.stroke()}
 const sx=(tx-x)*z,sy=(ty-y)*z;
 if((r.j||gate&&(r.off||r.missed))&&(sx<35||sy<95||sx>w-35||sy>h-95)){const ax=clamp(sx,28,w-28),ay=clamp(sy,110,h-102);ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(ty-r.y,tx-r.x));ctx.fillStyle='#c8f85f';ctx.strokeStyle='#142117';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-9,-9);ctx.lineTo(-5,0);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 if(flash>0){ctx.fillStyle='rgba(255,99,44,'+flash+')';ctx.fillRect(0,0,w,h)}
}
function tick(now){if(Math.round(window.visualViewport?.width||innerWidth)!==w||Math.round(window.visualViewport?.height||innerHeight)!==h)resize();const elapsed=Math.min((now-last)/1000,.12);last=now;
 if(scene==='drive'){acc+=elapsed;smoothSteering(wheel,elapsed);const input=driveInput(has,wheel,state.controls,true);
 $('knob').style.transform='translateX('+wheel.value*wheel.radius*.8+'px)';
 while(acc>=1/60&&!run.done&&!competition?.done){acc-=1/60;if(competition){contestFrame(input,1/60);continue}const loaded=run.loaded,hp=run.hp;cityTime+=1/60;advanceTraffic(cars,1/60,cityTime,run,Math.random,roam);advanceRoadTraffic(rural,1/60,run,roam);const traffic=cars.concat(rural);moveLegends(roam,1/60,run,traffic);step(run,input,1/60,state.garage[run.model].levels,traffic.concat(roam));dispatch(run,1/60);if(!loaded&&run.loaded)sound.fx('pickup');if(run.hit){sound.fx('hit');flash=.21}if(Math.floor(hp/10)>Math.floor(run.hp/10))sound.fx('damage');
 if(run.drift>18){marks.push({x:run.x,y:run.y});if(marks.length>220)marks.shift()}}
 flash=Math.max(0,flash-elapsed);sound.drive(run.speed/300,input.gas&&!competition?.count,input.brake,clamp((run.drift-12)/55,0,1),vehicles[run.model].tone,!!scores[competition?.e.id]);sound.nearby(roam,run);draw();updateHud();if(competition?.done)endContest();else if(run.done){if(run.free){sound.fx(run.done);closeDelivery(run,state);save();updateHud()}else finish()}}
 requestAnimationFrame(tick)}
window.visualViewport?.addEventListener('resize',resize);addEventListener('resize',resize);resize();menu();requestAnimationFrame(tick);
