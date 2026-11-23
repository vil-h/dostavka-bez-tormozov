import {prepare} from './routing.js';
import {highway,bends} from './geography.js';
// Vertices are on existing streets. A gate sits just before each turn.
export const events={
 express:{name:'Загородный экспресс',type:'race',description:'М-7, открытая дуга у терминала и лесной перевал.',points:[[650,470],...highway,...bends.slice(1,13)],reward:690,rivals:['Лис','Рысь'],outside:true},
 serp:{name:'Серпантин',type:'trial',description:'От терминала через лесные связки к южным воротам города.',points:bends,reward:520,medals:[39,48,63],outside:true},
 sprint:{name:'Городской спринт',type:'race',description:'Два соперника и два поворота в центре.',points:[[220,470],[840,470],[840,810],[1380,810]],reward:320,rivals:['Лис','Рысь']},
 night:{name:'Ночной экспресс',type:'race',description:'От почтамта через порт к южному проспекту.',points:[[350,150],[1530,150],[1530,810],[480,810],[480,1130],[1250,1130]],reward:530,rivals:['Лис','Рысь','Искра'],night:true},
 slide:{name:'Первый занос',type:'drift',description:'Набирай очки на перекрёстках центрального проспекта.',points:[[510,470],[840,470],[840,810],[480,810]],zone:[400,390,930,900],limit:35,record:"slide15",goal:430,reward:265},
 master:{name:'Мастер асфальта',type:'drift',description:'Связывай заносы на улицах портового квартала.',points:[[910,810],[1170,810],[1170,1130],[1530,1130]],zone:[770,735,1600,1200],limit:45,record:"master15",goal:900,reward:430},
 clock:{name:'Против секундомера',type:'trial',description:'Три поворота, три сплита и личный рекорд.',points:[[220,1130],[480,1130],[480,810],[1170,810],[1170,470]],reward:350,medals:[15,20,30]}
};
const checks={sprint:[[0,.68],[1,.52]],night:[[0,.78],[2,.5],[3,.52]],express:[[2,.6],[6,.52],[10,.48],[14,.6]],serp:[[1,.55],[5,.5],[10,.48],[15,.55],[19,.5]],clock:[[1,.5],[2,.55]]};
for(const [id,e] of Object.entries(events)){
 e.id=id;if(e.zone){e.gates=[];e.length=0;continue}
 e.record=id+'151';prepare(e,checks[id])
}
export const difficulties={rookie:{name:'Новичок',pay:.85},normal:{name:'Обычный',pay:1},pro:{name:'Профессионал',pay:1.15}};
export function raceKey(e,mode){return e.type==='race'?e.id+'152_'+mode:e.record}
export function restoreRecords(raw){
 const records={};for(const [id,e] of Object.entries({...events,...Object.fromEntries(Object.values(events).flatMap(e=>[[e.record,e],...Object.keys(difficulties).map(d=>[raceKey(e,d),e])]))})){
 const src=raw?.[id];if(!src||typeof src!=='object')continue;
 const r={};for(const field of e.type==='drift'?['score','combo']:e.type==='race'?['time','place']:['time']){
 const entry=src[field];if(!entry||!Number.isFinite(entry.value)||entry.value<=0||!['van','hatch','coupe','pickup'].includes(entry.model))continue;
 if(field==='place'&&(!Number.isInteger(entry.value)||entry.value>e.rivals.length+1))continue;
 r[field]={value:entry.value,model:entry.model}
 }if(Object.keys(r).length)records[id]=r;
 }return records;
}
export function medal(e,time){return ['Золото','Серебро','Бронза'][e.medals.findIndex(t=>time<=t)]||'Без медали'}
