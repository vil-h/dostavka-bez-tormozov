import {vehicles,stockCar,specs,paints,rims,decals} from './vehicles.js';
import {parts,cost} from './game.js';

const action=(label,name,disabled=false,cls='')=>'<button class="'+cls+'" data-action="'+name+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
const metrics=[
 ['speed','Макс. скорость','км/ч',190],['acceleration','Тяга','км/ч/с',110],
 ['braking','Торможение','км/ч/с',200],['turn','Поворот','°/с',180],
 ['grip','Сцепление','с⁻¹',16],['shield','Защита груза','×',3]
];
function dashboard(stats){
 return '<div class="meters">'+metrics.map(([k,label,unit,max])=>'<div class="meter"><div><span>'+label+'</span><b>'+Number(stats[k].toFixed(k==='shield'?2:0))+' '+unit+'</b></div><i><u style="width:'+Math.min(100,100*stats[k]/max)+'%"></u></i></div>').join('')+'</div>';
}
function upgrades(id,car,wallet,owned){
 return Object.entries(parts).map(([k,label])=>{
 const l=car.levels[k],price=cost(l);
 return '<div class="upgrade"><span>'+label+' <small>'+l+'/3</small></span>'+action(l===3?'Максимум':price+' ₽','upgrade:'+k,!owned||l===3||wallet<price)+'</div>'
 }).join('');
}
function choices(look,owned){
 return Object.entries({color:['Кузов',paints],rims:['Диски',rims],decal:['Наклейки',decals]}).map(([key,[label,list]])=>
 '<fieldset class="trim"><legend>'+label+'</legend>'+Object.entries(list).map(([value,name])=>
 '<button data-action="trim:'+key+':'+value+'" aria-label="'+name+'" title="'+name+'" aria-pressed="'+(look[key]===value)+'" '+(owned?'':'disabled')+' '+(key==='color'?'class="swatch" style="--paint:'+value+'"':'')+'>'+(key==='color'?'':name)+'</button>').join('')+'</fieldset>').join('');
}
export function garageView(state,id,tab,returnToRide){
 const model=vehicles[id],owned=Object.hasOwn(state.garage,id),selected=id===state.selected,car=state.garage[id]||stockCar(id);
 const tabs={stats:'Характеристики',upgrade:'Улучшения',look:'Внешний вид'};
 const tabsHtml=Object.entries(tabs).map(([k,n])=>action(n,'tab:'+k,false,tab===k?'active':'')).join('');
 const content=tab==='stats'?dashboard(specs(id,car.levels))+'<p>'+model.tip+'</p>':tab==='upgrade'?upgrades(id,car,state.money,owned):choices(car.look,owned);
 return '<section class="showroom"><div class="bayhead"><h2>Свой гараж</h2>'+action(returnToRide?'К поездке':'В меню',returnToRide?'resume':'menu')+'</div><nav class="models" aria-label="Автомобили">'+Object.entries(vehicles).map(([k,v])=>action(v.name,'model:'+k,false,id===k?'active':'')).join('')+'</nav><div class="baygrid"><div><div class="bayart"><canvas id="displayCar" width="640" height="264" aria-label="'+model.name+'"></canvas></div><div class="bayname"><div><small>'+model.body+'</small><h3>'+model.name+'</h3></div>'+action(owned?(selected?'Выбрано':'Выбрать'):'Купить · '+model.price+' ₽',owned?'select':'purchase',selected||(!owned&&state.money<model.price),'primary')+'</div><small class="price">'+(owned?(model.price?'Цена '+model.price+' ₽':'Стартовый автомобиль'):'Не хватает '+Math.max(0,model.price-state.money)+' ₽').replace('Не хватает 0 ₽','Доступен к покупке')+'</small></div><div class="baycontrols"><nav class="baytabs">'+tabsHtml+'</nav>'+content+'</div></div></section>';
}
