// Capture the shipped renderer with a test camera. Only the initial grid is staged.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),url=process.argv[2]||'http://film.test/',out=process.env.QA_OUTPUT||'qa-results';
function install(){
 window.longRide=()=>{
  const p={free:true,x:2200,y:770},c=createTraffic(),b=roadTraffic(),r=createLegends(p),all=[...c,...b,...r];
  let seed=2,maxStop=0;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let i=0;i<108000;i++){
   advanceTraffic(c,1/60,i/60,p,rng,[...b,...r]);advanceRoadTraffic(b,1/60,p,[...c,...r]);moveLegends(r,1/60,p,[...c,...b],rng);
   for(const v of all){v.idleTime=Math.abs(v.speed)<1?(v.idleTime||0)+1/60:0;maxStop=Math.max(maxStop,v.idleTime)}
  }return {maxStop,laps:r.map(v=>v.laps),count:all.length}
 };
 window.startFilm=(mode,grid)=>{
  cars=[];rural=[];roam=[];streetTracks=[];
  if(mode==='jam'){cars=grid;window.eye={x:920,y:490};Object.assign(run,{x:900,y:630});return}
  const id=mode==='forest'?'fox':'spark',c=createLegends({j:{id:11},x:0,y:0}).find(c=>c.id===id);
  const corner=c.route.turns.find(t=>t.p[0]===(id==='fox'?6790:4850)),s=corner.s-200,p=routingModule.pointAt(c.route,s);
  Object.assign(c,{s,x:p.x-p.dy*16,y:p.y+p.dx*16,a:Math.atan2(p.dy,p.dx),speed:205});roam=[c];window.eye=c;
 };
 window.observeFilm=()=>{
  const c=roam[0];if(!c)return cars.map(o=>({x:o.x,y:o.y,flow:o.flow}));

  return {s:c.s,slip:c.slip,speed:c.speed,phase:c.driftState,tracks:streetTracks.length}
 }
}
(async()=>{const {jamGrid}=await import('./traffic-grid.js');const b=await chromium.launch();
 try{const p=await b.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route(url,async r=>{const html=process.argv[2]?await(await r.fetch()).text():fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.ok(html.includes('ВЕРСИЯ 1.6.2'));const code=html.replace('const x=axis(r.x,r.vx,vw,bounds[0]),y=axis(r.y,r.vy,vh,bounds[1]);','const eye=window.eye||r,x=cam(eye.x,vw,bounds[0]),y=cam(eye.y,vh,bounds[1]);');
 const film=code.replace('Math.hypot(c.x-run.x,c.y-run.y)<820','Math.hypot(c.x-(window.eye||run).x,c.y-(window.eye||run).y)<820').replace('Math.abs(c.x-r.x)>vw||Math.abs(c.y-r.y)>vh','Math.abs(c.x-eye.x)>vw||Math.abs(c.y-eye.y)>vh');
 const at=film.lastIndexOf('</script>');await r.fulfill({contentType:'text/html',body:film.slice(0,at)+'\n('+install.toString()+')();\n'+film.slice(at)})});
 await p.clock.install();await p.goto(url);await p.clock.pauseAt(new Date(Date.now()+2000));await p.locator('[data-action=free]').click();
 for(const mode of ['jam','forest','highway']){
  await p.evaluate(([m,g])=>window.startFilm(m,g),[mode,jamGrid()]);const dir=path.join(out,mode);fs.mkdirSync(dir,{recursive:true});
  let slides=0,active=false,recovery=false,max=0,last,min=Infinity,maxStep=0,frameCount=0;
  for(let i=0;i<(mode==='jam'?210:mode==='forest'?120:155);i++){
   await p.clock.runFor(100);const v=await p.evaluate(()=>window.observeFilm());
   if(mode==='jam'){
    recovery||=v.some(c=>c.flow==='RECOVERING');if(last)for(let j=0;j<3;j++)maxStep=Math.max(maxStep,Math.hypot(v[j].x-last[j].x,v[j].y-last[j].y));
    for(let a=0;a<2;a++)for(let b=a+1;b<3;b++)min=Math.min(min,Math.hypot(v[a].x-v[b].x,v[a].y-v[b].y))
   }else{const now=Math.abs(v.slip)>.12;if(now&&!active)slides++;active=now;max=Math.max(max,Math.abs(v.slip)*180/Math.PI)}
   const image=await p.locator('#world').evaluate(c=>c.toDataURL('image/webp',.78).split(',')[1]);
   fs.writeFileSync(path.join(dir,i+'.webp'),Buffer.from(image,'base64'));last=v;frameCount=i+1;
   if(mode==='jam'&&v.every((c,i)=>Math.hypot(c.x-jamGrid()[i].x,c.y-jamGrid()[i].y)>100))break
  }
  fs.writeFileSync(path.join(dir,'frames.txt'),String(frameCount));console.log(mode,{slides,max,recovery,min,maxStep,last});if(mode==='jam'){assert.ok(recovery&&maxStep<12);assert.ok(last.every((c,i)=>Math.hypot(c.x-jamGrid()[i].x,c.y-jamGrid()[i].y)>100))}else assert.ok(slides>=3);
 }
 const long=await p.evaluate(()=>window.longRide());console.log('30 minutes',long);assert.ok(long.maxStop<45&&long.count===20);assert.deepEqual(errors,[]);console.log('PASS')
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
