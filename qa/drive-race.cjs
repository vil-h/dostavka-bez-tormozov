// Read the displayed car pose and speed and drive with ordinary keyboard events.
// This driver does not call the game's AI, step function or recovery logic.
const assert=require('node:assert/strict');
module.exports=async function driveRace(page,e,pace,onFrame=()=>{}){
 const {project,pointAt}=await import('../routing.js');let held=new Set(),t=0;
 try{for(let i=0;i<2100;i++){
 const p=await page.evaluate(()=>{const el=document.querySelector('#mapCar').style;return {left:parseFloat(el.left),top:parseFloat(el.top),a:parseFloat(el.transform.split('rotate(')[1]),speed:parseInt(document.querySelector('#speed').textContent)/.36,guide:document.querySelector('#guide').textContent,done:document.querySelector('#hud').hidden}});
 if(p.done)return await page.locator('#panel').innerText();
 p.x=p.left*(e.outside?84:16.8);p.y=p.top*(e.outside?29:12.8);
 const near=project(e,p.x,p.y),look=pointAt(e,near.s+Math.max(62,p.speed*.48));
 if(e.length-near.s<65){look.x+=look.dx*60;look.y+=look.dy*60}
 const a=Math.atan2(look.y-p.y,look.x-p.x)-p.a,delta=Math.atan2(Math.sin(a),Math.cos(a));
 const turn=e.turns.find(q=>q.s>near.s-8),limit=Math.min(pace,turn?Math.max(85,155/turn.angle+.85*(turn.s-near.s-50)):pace)/(1+Math.abs(delta)*.7);
 const keys=new Set([p.speed<limit?'ArrowUp':p.speed>limit+11?'ArrowDown':null,delta>.083?'ArrowRight':delta<-.083?'ArrowLeft':null].filter(Boolean));
 for(const k of held)if(!keys.has(k))await page.keyboard.up(k);for(const k of keys)if(!held.has(k))await page.keyboard.down(k);held=keys;
 await onFrame(p,near,t);await page.clock.runFor(80);t+=.08
 }assert.fail(e.id+' did not finish')}finally{for(const k of held)await page.keyboard.up(k)}
}
