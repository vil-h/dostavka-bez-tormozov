// Test-only observer and repeatable starting grids injected into the built page.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://street.test/',out=process.env.QA_OUTPUT||'qa-results';
function observer(){
 let racer,slow;
 window.grid=(scenario)=>{
  const id=scenario.startsWith('drift')?'fox':'spark';
  racer=createLegends({x:0,y:0,j:{id:11}}).find(c=>c.id===id);
  const turn=racer.route.turns.find(t=>t.p[0]===(scenario==='drift2'?6250:6790));
  const s=id==='fox'?turn.s-145:scenario==='fast'?1000:1250;
  const p=routingModule.pointAt(racer.route,s);
  Object.assign(racer,{s,x:p.x-16*p.dy,y:p.y+16*p.dx,a:Math.atan2(p.dy,p.dx),speed:id==='fox'?150:scenario==='fast'?90:200});
  Object.assign(run,{x:racer.x,y:racer.y+125,vx:0,vy:0});cars=[];rural=[];roam=[racer];streetTracks=[];
  if(scenario.startsWith('pass')||scenario==='blocked'){
   slow=roadTraffic()[0];slow.speed=scenario==='pass2'?95:65;slow.pos=1100;
   advanceRoadTraffic([slow],0,run,[]);slow.pos+=racer.x+205-slow.x;advanceRoadTraffic([slow],0,run,[]);rural=[slow];
   if(scenario==='blocked'){
    const on=roadTraffic()[1];on.pos=0;advanceRoadTraffic([on],0,run,[]);
    // Find the westbound section at the observer's starting grid.
    for(let d=0;d<22000;d+=12){on.pos=d;on.age=1;advanceRoadTraffic([on],0,run,[]);
     if(Math.abs(on.x-racer.x-330)<12&&Math.abs(on.y-452)<3)break}rural.push(on)
   }
  }
  window.observeCar=racer;
 };
 window.readStreet=()=>({x:racer.x,y:racer.y,a:racer.a,vx:racer.vx,vy:racer.vy,v:racer.speed,phase:racer.phase,lane:racer.lane,s:racer.s,slow:slow?.x,skid:streetTracks.length});
}
(async()=>{
 const browser=await chromium.launch();
 try{const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route(url,async r=>{
  const html=process.argv[2]?await (await r.fetch()).text():fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
  assert.ok(html.includes('ВЕРСИЯ 1.6.1'));
  const src=html.replace('const x=axis(r.x,r.vx,vw,bounds[0]),y=axis(r.y,r.vy,vh,bounds[1]);',"const watch=window.observeCar||r; const x=cam(watch.x,vw,bounds[0]),y=cam(watch.y,vh,bounds[1]);")
   .replace('Math.abs(c.x-r.x)>vw||Math.abs(c.y-r.y)>vh','Math.abs(c.x-watch.x)>vw||Math.abs(c.y-watch.y)>vh');
  const at=src.lastIndexOf('</script>');await r.fulfill({contentType:'text/html',body:src.slice(0,at)+'\n('+observer.toString()+')();\n'+src.slice(at)})
 });
 await p.clock.install();await p.goto(url);await p.clock.pauseAt(new Date(Date.now()+2000));await p.locator('[data-action=free]').click();
 for(const name of ['pass1','pass2','blocked','drift1','drift2','fast']){
  await p.evaluate(n=>window.grid(n),name);
  const frames=[],phases=[];let old=null,max=0,maxSlip=0,side=0,maxLaneRate=0,min=Infinity,back=false,clearance=0;
  for(let i=0;i<(name==='fast'?175:45);i++){
   await p.clock.runFor(85);const c=await p.evaluate(()=>window.readStreet());
   if(!old){old=c;continue}
   const actual=Math.hypot(c.vx,c.vy)*.36;max=Math.max(max,actual);
   const slip=Math.abs(Math.atan2(Math.sin(c.a-Math.atan2(c.vy,c.vx)),Math.cos(c.a-Math.atan2(c.vy,c.vx))))*180/Math.PI;
   if(slip>maxSlip){maxSlip=slip;side=Math.abs(c.vy*Math.cos(c.a)-c.vx*Math.sin(c.a))*.36}
   if(maxSlip>5&&slip<2)back=true;if(max>120)min=Math.min(min,actual);
   maxLaneRate=Math.max(maxLaneRate,Math.abs(c.lane-old.lane)/.085);
   if(c.phase!==phases.at(-1)){phases.push(c.phase);if(c.phase==='RETURN')clearance=c.x-c.slow}
   if(name!=='fast'&&i%2===0)frames.push(await p.locator('#world').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]));
   old=c
  }
  console.log(name,{phases,max,maxSlip,side,back,maxLaneRate,clearance,min});
  if(frames.length){const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});frames.forEach((data,i)=>fs.writeFileSync(path.join(dir,i+'.png'),Buffer.from(data,'base64')))}
  if(name.startsWith('pass')){assert.ok(phases.includes('PASS')&&phases.includes('RETURN')&&phases.at(-1)==='FOLLOW');assert.ok(clearance>58)}
  if(name==='blocked')assert.ok(phases.includes('ABORT'));
  if(name.startsWith('drift'))assert.ok(maxSlip>5&&side>3&&back);
  if(name==='fast')assert.ok(max>=120&&min<100)
 }assert.deepEqual(errors,[]);console.log('PASS')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
