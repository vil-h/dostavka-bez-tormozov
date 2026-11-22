// Track physical contacts independently so lifting one finger leaves other pedals held.
export function bindPedals(buttons,pointers,unlock){
 for(const button of buttons){
  button.onpointerdown=event=>{
   event.preventDefault();
   button.setPointerCapture(event.pointerId);
   pointers.set(event.pointerId,button.dataset.key);
   button.classList.add('held');
   unlock();
  };
  const release=event=>{
   pointers.delete(event.pointerId);
   if(![...pointers.values()].includes(button.dataset.key))button.classList.remove('held');
  };
  button.onlostpointercapture=release;
  button.onpointercancel=release;
  button.onpointerup=release;
 }
}
