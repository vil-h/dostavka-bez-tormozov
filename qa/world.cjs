const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [engine='chromium',live]=process.argv.slice(2),out=path.resolve(process.env.QA_OUTPUT||'qa-results'),url=live||'http://contest.test/';
(async()=>{fs.mkdirSync(out,{recursive:true});const {events}=await import('../challenges.js');const b=await ({chromium,webkit})[engine].launch();try{
 const ctx=await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(4500);
 if(!live)await page.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8')}));
 await page.addInitScript(()=>{if(!localStorage.getItem('dostavka-bez-tormozov.v1')) localStorage.setItem('dostavka-bez-tormozov.v1',JSON.stringify({schema:3,money:4000,levels:{guard:1},best:{0:{score:86,time:10}}}))});
 await page.clock.install();await page.goto(url);await page.clock.pauseAt(new Date(Date.now()+2000));
 const act=a=>page.locator('[data-action="'+a+'"]').click();
 async function model(id){await act('garage');await act('model:'+id);if(await page.locator('[data-action=purchase]').count())await act('purchase');await act('select');await act('menu')}
 const {highway,bends,yard,travel,outposts}=await import('../geography.js');
 const stops=[...outposts,['Депо',480,490],['Газетный киоск',660,490],['Почтамт',840,490],['Дом печати',1010,490],['Речной рынок',150,170],['Мастерская',480,170],['Галерея',1170,170],['Порт',1530,170],['Вокзал',150,830],['Кондитерская',1170,830],['Библиотека',840,830],['Склад',480,1150],['Маяк',1530,1150]];
 const shot=name=>page.screenshot({path:path.join(out,'world15-'+name+'.png')});
 await model('coupe');await act('free');await page.clock.runFor(160);
 let keys=new Set(),highest=0,fast=0,shots=new Set();
 async function input(wanted){const next=new Set(wanted.filter(Boolean));for(const k of keys)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!keys.has(k))await page.keyboard.down(k);keys=next}
 async function position(){return page.evaluate(()=>{const d=document.querySelector('#mapCar').style;return {x:parseFloat(d.left)*84,y:parseFloat(d.top)*29,a:parseFloat(d.transform.split('rotate(')[1]),v:parseInt(document.querySelector('#speed').textContent)/.36}})}
 async function drive(points,pace=175){const start=await position();let ax=start.x,ay=start.y;for(const [x,y] of points){
 const length=Math.hypot(x-ax,y-ay)||1,dx=(x-ax)/length,dy=(y-ay)/length;
 let idle=0;for(let k=0;k<600;k++){const p=await position(),dist=Math.hypot(x-p.x,y-p.y);
 if(dist<18)break;if(k===599)throw Error('stalled '+JSON.stringify({p,x,y}));
 idle=p.v<8?idle+1:0;if(idle>14){await input(['ArrowDown']);await page.clock.runFor(640);await input([]);idle=0;continue}
 const along=Math.min(length,Math.max(0,(p.x-ax)*dx+(p.y-ay)*dy)+110);const a=Math.atan2(ay+dy*along-p.y,ax+dx*along-p.x)-p.a,delta=Math.atan2(Math.sin(a),Math.cos(a));
 const lim=Math.min(pace,Math.max(48,dist*1.22))/(1+Math.abs(delta)*.96);
 await input([p.v<lim?'ArrowUp':p.v>lim+11?'ArrowDown':null,delta>.085?'ArrowRight':delta<-.085?'ArrowLeft':null]);
 await page.clock.runFor(96);highest=Math.max(highest,p.v*.36);if(p.v*.36>=128)fast+=.096;
 for(const [name,when] of [['highway',p.x>3000&&p.x<4300&&p.y<560],['industry',p.x>7830&&p.y>1250],['bends',p.x>6000&&p.y>2020]])if(when&&!shots.has(name)){await shot(name);shots.add(name)}
 }ax=x;ay=y;}
 await input([])}
 await drive([[1500,490],[1850,515],[4400,515]],365);await page.locator('#atlas').click();await shot('map');await act('resume');
 await drive(highway.slice(3));await drive(yard.slice(1));await drive(bends.slice(2));await drive([[1530,470],...highway.slice(1),bends[1],yard[2]]);
 // Wait at the terminal for a dispatch with pickup here. The active route is taken from the offer.
 let destination,origin;
 for(let n=0;n<30;n++){
 for(let t=0;t<55&&!(await page.locator('#offer').isVisible());t++)await page.clock.runFor(1000);
 const route=await page.locator('#route').innerText();[origin,destination]=route.split(' → ').map(q=>stops.find(p=>p[0]===q));
 if(origin?.[0]==='Терминал № 8'&&destination?.[0]==='Весовая'){await page.locator('#accept').click();break}await page.locator('#skip').click()
 }
 assert.equal(origin[0],'Терминал № 8');console.log('delivery',origin[0],destination[0]);const initial=parseInt(await page.locator('#wallet').innerText());
 await drive([origin.slice(1)],60);await page.clock.runFor(200);assert.ok((await page.locator('#order').innerText()).includes('Доставка'));
 await drive(travel(origin,destination).via.slice(1),95);await drive([destination.slice(1)],60);await page.clock.runFor(350);assert.ok(parseInt(await page.locator('#wallet').innerText())>initial,'delivery '+await page.locator('#order').innerText());console.log('delivery reward',parseInt(await page.locator('#wallet').innerText())-initial);
 await drive(travel(destination,stops.find(p=>p[0]==='Депо')).via.slice(1));console.log('returned',await position(),'max',highest,'seconds at 128+',fast);
 assert.ok(highest>=129&&shots.size===3);await page.locator('#home').click();
 for(const [width,height] of [[844,390],[740,390],[667,375],[390,844],[1280,720]]){await page.setViewportSize({width,height});await act('free');await page.locator('#atlas').click();assert.ok(await page.locator('#worldAtlas').isVisible());await act('resume');await page.locator('#home').click()}
 async function race(id,pace){
 const e=events[id];await act('events');await act('category:'+e.type);await act('brief:'+id);await act('startEvent:'+id);
 assert.equal(await page.locator('#startLight').innerText(),'3');await page.clock.runFor(800);await page.locator('#pause').click();await page.clock.runFor(1600);await act('resume');await page.clock.runFor(2550);
 const text=await require('./drive-race.cjs')(page,e,pace);console.log(engine,id,text.replace(/\n/g,' ').slice(0,240));
 assert.ok(/\+[1-9]\d* ₽/.test(text));await act('menu');return text
 }
 await race('express',295);await race('serp',270);await page.reload();const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('dostavka-bez-tormozov.v1')));assert.ok(stored.records.express151.time.value>0&&stored.records.serp151.time.value>0);await act('events');await act('category:records');assert.ok((await page.locator('.scorelist').innerText()).includes('Молния'));await act('menu');
 assert.deepEqual(errors,[]);console.log(engine,'PASS');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
