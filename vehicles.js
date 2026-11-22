// Multipliers are relative to the 1.2 courier van. Mass controls the effect
// of the refrigerator on acceleration and stopping distance.
export const vehicles={
 van:{name:'ДБТ-01 «Курьер»',body:'Курьерский фургон',price:0,color:'#ff702c',accel:1,top:1,brake:1,turn:1,grip:1,slide:1,mass:1,stability:1,tone:1,tip:'Предсказуемый поворот и сбалансированная защита груза.'},
 hatch:{name:'Шустрик',body:'Компактный хэтчбек',price:900,color:'#99bc4d',accel:1.19,top:.94,brake:1.1,turn:1.23,grip:.91,slide:1.25,mass:.82,stability:.86,tone:1.16,tip:'Быстрый старт и короткий поворот. С тортом входи в вираж мягче.'},
 coupe:{name:'Молния',body:'Спортивное купе',price:2200,color:'#677ee9',accel:1.32,top:1.24,brake:1.08,turn:.98,grip:1.16,slide:1.06,mass:1.04,stability:.78,tone:1.34,tip:'Высокая скорость на прямой. Для хрупкого груза тормози заранее.'},
 pickup:{name:'Бизон',body:'Грузовой пикап',price:4200,color:'#d8b159',accel:.87,top:.9,brake:.85,turn:.87,grip:1.14,slide:.86,mass:1.8,stability:1.4,tone:.76,tip:'Тяжёлый кузов бережёт груз. Для остановки нужно больше места.'}
};
export const paints={'#ff702c':'Оранжевый','#ce5351':'Красный','#677ee9':'Синий','#353b42':'Графит','#edeedc':'Белый','#d8b159':'Жёлтый','#99bc4d':'Зелёный','#996cc3':'Фиолетовый'};
export const rims={standard:'Стандартные',sport:'Спортивные',dark:'Тёмные'};
export const decals={none:'Без наклеек',stripes:'Полосы',bolt:'Молния',number:'Номер',geo:'Геометрия'};
export function stockCar(id){return {levels:{engine:0,brakes:0,suspension:0,grip:0,guard:0},look:{color:vehicles[id].color,rims:'standard',decal:'none'}}}
const lists={color:paints,rims,decal:decals};
export function paintCar(s,id,key,value){
 if(!Object.hasOwn(s.garage,id)||!Object.hasOwn(lists,key)||!Object.hasOwn(lists[key],value))return false;
 s.garage[id].look[key]=value;return true;
}
export function restoreGarage(s,d){
 for(const id of Object.keys(vehicles)){
  const car=d.garage?.[id];
  if(id!=='van'&&(!car||typeof car!=='object'||Array.isArray(car)))continue;
  const record=s.garage[id]=stockCar(id);
  for(const key of Object.keys(record.levels)){
   const level=car?.levels?.[key]??(id==='van'?d.levels?.[key]:0);
   if(Number.isFinite(level))record.levels[key]=Math.max(0,Math.min(3,Math.floor(level)));
  }
  for(const key of Object.keys(lists))paintCar(s,id,key,car?.look?.[key]);
 }
 if(Object.hasOwn(s.garage,d.selected))s.selected=d.selected;
}
export function purchase(s,id){
 if(!Object.hasOwn(vehicles,id)||Object.hasOwn(s.garage,id)||s.money<vehicles[id].price)return false;
 s.money-=vehicles[id].price;s.garage[id]=stockCar(id);return true;
}
export function parked(r){return !r||(r.free&&!r.j&&Math.hypot(r.vx,r.vy)<3)}
export function selectCar(s,id,r=null){
 if(!Object.hasOwn(s.garage,id)||!parked(r))return false;
 s.selected=id;
 if(r){Object.assign(r,{model:id,speed:0,vx:0,vy:0,drift:0});}
 return true;
}
export function specs(id,levels){
 const v=vehicles[id];
 return {speed:(292+28*levels.engine)*v.top*.36,acceleration:(148+25*levels.engine)*v.accel*.36,braking:(275+65*levels.brakes)*v.brake*.36,turn:2.32*v.turn*180/Math.PI,grip:(8+1.8*levels.grip)*v.grip,shield:v.stability*(1+.32*levels.guard),verge:1.25/(1+.2*levels.suspension)};
}
