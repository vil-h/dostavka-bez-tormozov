// Track physical contacts independently so lifting one finger leaves other pedals held.
export function bindPedals(buttons,pointers,unlock){
 for(const button of buttons){
  const starts=new Map();
  button.onpointerdown=event=>{
   event.preventDefault();
   button.setPointerCapture(event.pointerId);
   pointers.set(event.pointerId,button.dataset.key);
   button.classList.add('held');
   starts.set(event.pointerId,event.clientY);
   unlock();
  };
  button.onpointermove=event=>{
   if(button.dataset.key!=='gas'||!pointers.has(event.pointerId))return;
   const rise=starts.get(event.pointerId)-event.clientY;
   pointers.set(event.pointerId,rise>28?'slide':'gas');
   button.classList.toggle('drifting',[...pointers.values()].includes('slide'));
  };
  const release=event=>{
   starts.delete(event.pointerId);
   button.classList.remove('drifting');
   pointers.delete(event.pointerId);
   if(![...pointers.values()].includes(button.dataset.key))button.classList.remove('held');
  };
  button.onlostpointercapture=release;
  button.onpointercancel=release;
  button.onpointerup=release;
 }
}

export function createSteering(){
 return {id:null,origin:0,radius:1,target:0,value:0};
}
export function steerTarget(offset,radius,sensitivity){
 const travel=Math.min(1,Math.abs(offset)/Math.max(1,radius));
 return Math.sign(offset)*Math.min(1,Math.max(0,(travel-.08)/.92)*sensitivity);
}
export function smoothSteering(wheel,dt){
 wheel.value+=(wheel.target-wheel.value)*(1-Math.exp(-22*dt));
 if(Math.abs(wheel.target-wheel.value)<.002)wheel.value=wheel.target;
 return wheel.value;
}
export function bindWheel(el,wheel,sensitivity){
 el.onpointerdown=e=>{
  if(wheel.id!==null)return;
  e.preventDefault();el.setPointerCapture(e.pointerId);
  wheel.id=e.pointerId;wheel.origin=e.clientX;wheel.radius=el.clientWidth*.32;wheel.target=0;
 };
 el.onpointermove=e=>{
  if(e.pointerId===wheel.id)wheel.target=steerTarget(e.clientX-wheel.origin,wheel.radius,sensitivity());
 };
 el.onpointerup=el.onpointercancel=el.onlostpointercapture=e=>{
  if(e.pointerId===wheel.id){wheel.id=null;wheel.target=0}
 };
}
export function driveInput(has,wheel,options,active){
 if(!active)return {turn:0,gas:false,brake:false,hand:false};
 const digital=Number(has('right'))-Number(has('left'));
 return {turn:digital||(options.scheme==='wheel'?wheel.value:0),gas:!has('brake')&&(has('gas')||has('slide')||options.auto),brake:has('brake'),hand:has('hand')||has('slide')};
}
