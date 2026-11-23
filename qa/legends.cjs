const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=process.env.QA_OUTPUT||'qa-results',live=process.argv[2],url=live||'http://legends.test/';
(async()=>{fs.mkdirSync(out,{recursive:true});const {jobs}=await import('../game.js'),b=await chromium.launch();try{
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await ctx.newPage();p.setDefaultTimeout(4500);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(!live)await p.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8')}));
 await p.addInitScript(()=>{let seed=161;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);const key='dostavka-bez-tormozov.v1';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({schema:5,difficulty:'pro',sfx:.53,music:.37,money:9000,best:Object.fromEntries(Array.from({length:9},(_,i)=>[i,{score:90,time:15}])),records:{sprint151:{time:{model:'van',value:9}}}}));
 window.encounters={};window.closestStreet=Infinity;window.streetPos=[];window.visibleCars=[];window.ahead=Infinity;
 const rect=CanvasRenderingContext2D.prototype.fillRect;
 CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(this.canvas.id==='world'&&x===-20&&y===-8&&w===43&&h===22)window.visibleCars.push(this.getTransform());return rect.call(this,x,y,w,h)};
 const write=CanvasRenderingContext2D.prototype.fillText;
 CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){if(this.canvas.id==='world'&&/^(ИСКРА|ЛИС)( ›)?$/i.test(text))throw Error('Street label: '+text);return write.call(this,text,x,y,...args)};
 const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(args[0]===-28&&args[2]===56&&this.canvas.id==='world'){
 const m=this.getTransform(),scale=Math.hypot(m.a,m.b);window.ahead=Infinity;for(const pos of window.streetPos)window.closestStreet=Math.min(window.closestStreet,Math.hypot(pos.e-m.e,pos.f-m.f)/scale);window.streetPos=[];
 for(const o of window.visibleCars){const dx=(o.e-m.e)/scale,dy=(o.f-m.f)/scale,along=(m.a*dx+m.b*dy)/scale,side=(-m.b*dx+m.a*dy)/scale;
 if(along>0&&Math.abs(side)<24)window.ahead=Math.min(window.ahead,along)}window.visibleCars=[]}
 if(im?.dataset?.legendSprite&&this.canvas.id==='world'){const m=this.getTransform(),w=this.canvas.width,h=this.canvas.height;window.streetPos.push(m);window.visibleCars.push(m);if(m.e>w*.12&&m.e<w*.88&&m.f>65&&m.f<h-65)window.encounters[im.dataset.legendSprite]=performance.now()}return draw.call(this,im,...args)}
 });
 await p.clock.install();await p.goto(url);await p.clock.pauseAt(new Date(Date.now()+2000));const act=a=>p.locator('[data-action="'+a+'"]').click(),tick=t=>p.clock.runFor(t);
 const shot=(f,loc=p)=>loc.screenshot({path:path.join(out,'legends16-'+f+'.png')});
 await act('events');await act('legends');await p.setViewportSize({width:1280,height:720});await tick(80);await shot('pair',p.locator('.legendCards'));
 const images={};for(const id of ['spark','fox']){const el=p.locator('[data-legend="'+id+'"]');await shot(id,el);images[id]=await el.evaluate(c=>c.toDataURL())}
 await act('menu');await act('garage');for(const [id,model] of [['spark','coupe'],['fox','hatch']]){
 await act('model:'+model);const ordinary=await p.locator('#displayCar').evaluate(c=>c.toDataURL());
 const data=await p.evaluate(async({custom,ordinary,id})=>{const cv=document.createElement('canvas');cv.width=1000;cv.height=285;const c=cv.getContext('2d');c.fillStyle='#1b2929';c.fillRect(0,0,1000,285);for(const [i,src] of [custom,ordinary].entries()){const im=new Image();im.src=src;await im.decode();c.drawImage(im,i*500,0,500,228)}c.fillStyle='#eff3df';c.font='bold 22px system-ui';c.fillText(id==='spark'?'Искра GT':'Лис R',20,263);c.fillText(id==='spark'?'Молния':'Шустрик',520,263);return cv.toDataURL().split(',')[1]},{custom:images[id],ordinary,id});fs.writeFileSync(path.join(out,'legends16-'+id+'-compare.png'),Buffer.from(data,'base64'));
 }await act('menu');await p.setViewportSize({width:844,height:390});await tick(100);
 let keys=new Set(),snapped=new Set();
 async function input(arr){let next=new Set(arr.filter(Boolean));for(const k of keys)if(!next.has(k))await p.keyboard.up(k);for(const k of next)if(!keys.has(k))await p.keyboard.down(k);keys=next}
 async function drive(points,pace,free=false){
 let last;for(let i=0;i<points.length;i++){
 const [x,y]=points[i];for(let n=0;n<1000;n++){
 const v=await p.evaluate(()=>{const dot=document.querySelector('#mapCar').style;return {ahead:window.ahead,x:parseFloat(dot.left)*84,y:parseFloat(dot.top)*29,a:parseFloat(dot.transform.split('rotate(')[1]),v:parseInt(document.querySelector('#speed').textContent)/.36,done:document.querySelector('#hud').hidden,seen:Object.keys(window.encounters).filter(k=>performance.now()-window.encounters[k]<80)}});last=v;
 if(free){for(const id of v.seen)if(!snapped.has(id)){await shot('road-'+id);snapped.add(id);console.log('encounter',id,Math.round(v.x),Math.round(v.y))}}
 if(v.done){await input([]);return}const dist=Math.hypot(x-v.x,y-v.y);if(dist<(i===points.length-1?14:22))break;
 if(n===999)throw Error('stalled '+JSON.stringify({v,x,y}));
 let ax=x,ay=y;if(i){const [sx,sy]=points[i-1],l=Math.hypot(x-sx,y-sy);if(l>150){const t=Math.min(1,Math.max(0,((v.x-sx)*(x-sx)+(v.y-sy)*(y-sy))/(l*l))+140/l);ax=sx+(x-sx)*t;ay=sy+(y-sy)*t}}
 const a=Math.atan2(ay-v.y,ax-v.x)-v.a,delta=Math.atan2(Math.sin(a),Math.cos(a));const limit=Math.min(free?Infinity:Math.max(12,(v.ahead-31)*2),pace,Math.max(39,dist*.98))/(1+Math.abs(delta)*.9);
 await input([v.v<limit?'ArrowUp':v.v>limit+11?'ArrowDown':null,delta>.077?'ArrowRight':delta<-.077?'ArrowLeft':null]);await tick(72)
 }}
 await input([]);await tick(150);return last
 }
 for(const [id,model] of [[9,'van'],[10,'pickup'],[11,'hatch']]){
 if(model!=='van'){await act('garage');await act('model:'+model);await act('purchase');await act('select');await act('menu')}
 await act('orders');assert.ok(await p.locator('[data-action="go:'+id+'"]').isEnabled());if(id<11)assert.ok(await p.locator('[data-action="go:'+(id+1)+'"]').isDisabled());await act('go:'+id);await tick(100);
 const lane=jobs[id].via.map(([x,y],i,path)=>{if(!i||i===path.length-1)return [x,y];const [a,b]=path[i-1],[d,e]=path[i+1],l=Math.hypot(d-a,e-b);return [x-20*(e-b)/l,y+20*(d-a)/l]});
 await p.evaluate(()=>window.closestStreet=Infinity);if(id===11){for(let i=0;i<90&&await p.evaluate(()=>window.closestStreet>150);i++)await tick(200)}await drive(lane,id===11?113:158);const nearest=await p.evaluate(()=>window.closestStreet);console.log("nearest street racer",id+1,nearest);if(id===11)assert.ok(nearest<350);const text=await p.locator('#panel').innerText();console.log('mission',id+1,model,text.replace(/\n/g,' '));assert.match(text,/Доставлено!/);await act('menu')
 }
 await p.reload();const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('dostavka-bez-tormozov.v1')));assert.equal(Object.keys(save.best).length,12);assert.ok(save.garage.pickup&&save.records.sprint151);assert.equal(save.music,.37);assert.equal(save.difficulty,'pro');
 await act('free');await tick(100);const {highway,bends}=await import('../geography.js');
 await drive([[840,486],[1530,486],[3200,510]],108,true);
 async function watch(id,name){
 for(let i=0;i<1300;i++){await tick(200);if(await p.evaluate(id=>performance.now()-(window.encounters[id]??-1e6)<75,id)){await shot(name);snapped.add(id);console.log('observed',name,i/5);return true}}return false}
 assert.ok(await watch('spark','m7-encounter'),'spark visible on M-7');
 await drive([[4400,470],...highway.slice(3),...bends.slice(1,7)],142,true);
 assert.ok(await watch('fox','forest-fox'),'fox on forest bends');
 assert.equal(snapped.size,2);assert.deepEqual(errors,[]);console.log('PASS')
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1})
