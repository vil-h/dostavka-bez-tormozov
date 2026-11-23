import {events,medal} from './challenges.js';
import {vehicles} from './vehicles.js';
export const clockText=t=>Math.floor(t/60)+':'+(t%60).toFixed(1).padStart(4,'0');
const category={race:'Уличные гонки',drift:'Дрифт',trial:'Заезд на время'};
function best(e,r){
 if(!r||!Object.keys(r).length)return 'Первый старт впереди';
 if(e.type==='drift')return [r.score&&r.score.value+' очк. · '+vehicles[r.score.model].name,r.combo&&'Серия '+r.combo.value+' · '+vehicles[r.combo.model].name].filter(Boolean).join('<br>');
 const time=r.time?clockText(r.time.value)+' · '+vehicles[r.time.model].name:'Время —';
 return e.type==='race'?(r.place?r.place.value+' место · '+vehicles[r.place.model].name+'<br>':'')+time:medal(e,r.time.value)+' · '+time;
}
const btn=(text,action,primary=false)=>'<button data-action="'+action+'" class="'+(primary?'primary':'')+'">'+text+'</button>';
export function eventsView(state,tab){
 const nav='<div class="contestTabs">'+Object.entries({...category,records:'Рекорды'}).map(([k,v])=>btn(v,'category:'+k,tab===k)).join('')+'</div>';
 if(tab==='records')return nav+'<div class="scorelist">'+Object.values(events).map(e=>'<article class="item"><h3>'+e.name+'</h3><p>'+best(e,state.records[e.id])+'</p></article>').join('')+'</div>';
 return nav+'<div class="eventCards">'+Object.values(events).filter(e=>e.type===tab).map(e=>'<article class="eventCard"><canvas data-course="'+e.id+'" width="320" height="106"></canvas><div><small>'+category[e.type]+' · '+(e.limit?e.limit+' с':Math.round(e.length/3)+' м')+'</small><h3>'+e.name+'</h3><p>'+e.description+'</p><span class="meta">'+best(e,state.records[e.id])+'</span><div class="row"><b>до '+e.reward+' ₽</b>'+btn('Участвовать','brief:'+e.id,true)+'</div></div></article>').join('')+'</div>';
}
export function briefing(e,s){
 const details=e.rivals?'Соперники · '+e.rivals.join(', '):e.type==='trial'?'Золото до '+e.medals[0]+' с · серебро до '+e.medals[1]+' с · бронза до '+e.medals[2]+' с':'Цель · '+e.goal+' очков за '+e.limit+' с. Разгонись, поверни и скользи внутри разметки.';
 return '<article class="eventCard brief"><canvas data-course="'+e.id+'" width="510" height="140"></canvas><div><small>'+category[e.type]+'</small><h3>'+e.name+'</h3><p>'+details+'</p><div class="row"><b>'+vehicles[s.selected].name+' · до '+e.reward+' ₽</b>'+btn('На старт','startEvent:'+e.id,true)+'</div></div></article>'
}
export function resultsView(s,state,v){
 const e=s.e,d=s.drift;
 const headline=e.type==='race'?(s.place===1?'Победа!':s.place+' место'):e.type==='drift'?d.total+' очков':medal(e,s.t);
 const finishers=[{name:'Ты',finish:s.player.finish},...s.bots].sort((a,b)=>(a.finish??Infinity)-(b.finish??Infinity));
 const detail=e.type==='race'?finishers.map(c=>c.name+' · '+(c.finish===null?'не финишировал':clockText(c.finish))).join('<br>'):e.type==='drift'?'Лучшая серия · '+d.best+' очк.':'Время · '+clockText(s.t);
 return '<section class="page"><small class="eyebrow">'+e.name+' · '+vehicles[s.player.model].name+'</small><h2>'+headline+'</h2><article class="job"><h3>+'+v.pay+' ₽</h3><p>'+detail+'</p><small>'+(v.improved?'НОВЫЙ РЕКОРД':'ЛИЧНЫЙ РЕКОРД')+'</small><div>'+best(e,state.records[e.id])+'</div></article><div class="menu">'+btn('Повторить','startEvent:'+e.id,true)+btn('Другие соревнования','events')+btn('В меню','menu')+'</div></section>';
}
