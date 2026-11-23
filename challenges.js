// Vertices are on existing streets. A gate sits just before each turn.
export const events={
 sprint:{name:'Городской спринт',type:'race',description:'Два соперника и два поворота в центре.',points:[[220,470],[840,470],[840,810],[1170,810]],reward:320,rivals:['Лис','Рысь']},
 night:{name:'Ночной экспресс',type:'race',description:'От почтамта через порт к южному проспекту.',points:[[550,150],[1170,150],[1170,470],[1530,470],[1530,810],[840,810],[840,1130],[480,1130]],reward:530,rivals:['Лис','Рысь','Искра'],night:true},
 slide:{name:'Первый занос',type:'drift',description:'Набирай очки на перекрёстках центрального проспекта.',points:[[510,470],[840,470],[840,810],[480,810]],zone:[400,390,930,900],limit:35,goal:180,reward:265},
 master:{name:'Мастер асфальта',type:'drift',description:'Связывай заносы на улицах портового квартала.',points:[[910,810],[1170,810],[1170,1130],[1530,1130]],zone:[770,735,1600,1200],limit:45,goal:650,reward:430},
 clock:{name:'Против секундомера',type:'trial',description:'Три поворота, четыре сплита и личный рекорд.',points:[[220,1130],[480,1130],[480,810],[1170,810],[1170,470]],reward:350,medals:[15,20,30]}
};
for(const [id,e] of Object.entries(events)){
 e.id=id;e.length=0;e.gates=e.points.slice(1).map(([x,y],i)=>{
 const [sx,sy]=e.points[i],dx=Math.sign(x-sx),dy=Math.sign(y-sy),length=Math.hypot(x-sx,y-sy);
 e.length+=length;const inset=i===e.points.length-2?0:15;
 return {x:x-dx*inset,y:y-dy*inset,dx,dy,length,base:e.length-length}
 });
}
export function restoreRecords(raw){
 const records={};for(const [id,e] of Object.entries(events)){
 const src=raw?.[id];if(!src||typeof src!=='object')continue;
 const r={};for(const field of e.type==='drift'?['score','combo']:e.type==='race'?['time','place']:['time']){
 const entry=src[field];if(!entry||!Number.isFinite(entry.value)||entry.value<=0||!['van','hatch','coupe','pickup'].includes(entry.model))continue;
 if(field==='place'&&(!Number.isInteger(entry.value)||entry.value>e.rivals.length+1))continue;
 r[field]={value:entry.value,model:entry.model}
 }if(Object.keys(r).length)records[id]=r;
 }return records;
}
export function medal(e,time){return ['Золото','Серебро','Бронза'][e.medals.findIndex(t=>time<=t)]||'Без медали'}
