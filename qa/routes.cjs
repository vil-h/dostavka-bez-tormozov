const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const drive=require('./drive-race.cjs'),[engine='chromium',live]=process.argv.slice(2),out=process.env.QA_OUTPUT||'qa-results';
(async()=>{const {events}=await import('../challenges.js');fs.mkdirSync(out,{recursive:true});const b=await({chromium,webkit})[engine].launch();
try{const ctx=await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));const url=live||'http://routes.test/';
 if(!live)await page.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8')}));
 await page.addInitScript(()=>{const k='dostavka-bez-tormozov.v1';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({money:12000,records:{sprint:{time:{value:11,model:'van'}}}}))});
 await page.clock.install();await page.goto(url);await page.clock.pauseAt(new Date(Date.now()+2000));const act=a=>page.locator('[data-action="'+a+'"]').click();
 async function start(id){await act('events');await act('category:'+events[id].type);await act('brief:'+id);await act('startEvent:'+id);await page.clock.runFor(3250)}
 async function select(id){await act('garage');await act('model:'+id);if(await page.locator('[data-action=purchase]').count())await act('purchase');await act('select');await act('menu')}
 for(const [id,model,pace,w,h] of [['sprint','van',185,844,390],['night','hatch',178,740,390],['express','coupe',305,667,375],['serp','pickup',195,390,844],['clock','pickup',150,1280,720]]){
 await page.setViewportSize({width:w,height:h});if(model!=='van'&&id!=='clock')await select(model);
 await start(id);const arrows=new Set();let shot=false;
 const watch=async(p,near)=>{arrows.add(p.guide.split(' ЧЕРЕЗ')[0]);if(!shot&&p.guide.includes('ЧЕРЕЗ')&&p.speed>80){
 if(engine==='chromium'&&['sprint','express','night'].includes(id)){await page.screenshot({path:path.join(out,'routes151-'+id+'.png')});if(id==='express')await page.locator('#navigator').screenshot({path:path.join(out,'routes151-minimap.png')})}
 const hint=await page.locator('#guide').boundingBox();for(const sel of ['#wheel','[data-key=gas]','#navigator']){const z=await page.locator(sel).boundingBox();if(z)assert.ok(hint.x+hint.width<=z.x||hint.x>=z.x+z.width||hint.y+hint.height<=z.y||hint.y>=z.y+z.height,'overlap '+id+' '+sel)}
 shot=true}};
 const result=await drive(page,events[id],pace,watch);assert.ok(shot&&[...arrows].some(x=>x.includes('ФИНИШ')));assert.ok(!result.includes('не финишировал'));console.log(id,model,result.replace(/\n/g,' ').slice(0,222),[...arrows].filter(x=>x.includes('↰')||x.includes('↱')));
 if(id==='sprint'){await act('startEvent:sprint');await page.clock.runFor(3250);const detour={points:[[220,470],[480,470],[480,150],[840,150]]};
 const {prepare}=await import('../routing.js');prepare(detour,[]);const missed=Symbol('missed');
 try{await drive(page,detour,112,async p=>{if(p.guide.includes('пропущена'))throw missed})}catch(err){if(err!==missed)throw err}
 assert.match(await page.locator('#guide').innerText(),/Контрольная точка пропущена/);
 assert.match(await page.locator('#wallet').innerText(),/Ворота 0/);
 const recover=page.locator('#recover');assert.ok(await recover.isVisible());await recover.click();assert.equal(parseInt(await page.locator('#speed').innerText()),0);await page.locator('#home').click()}else await act('menu')
 }
 await page.reload();await act('events');await act('category:records');assert.ok((await page.locator('.scorelist').innerText()).includes('Архив 1.5'));const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('dostavka-bez-tormozov.v1')).records);
 for(const id of ['sprint','night','express','serp','clock'])assert.ok(records[events[id].rivals?id+'152_normal':id+'151'].time.value>0);assert.equal(records.sprint.time.value,11);assert.deepEqual(errors,[]);console.log(engine,'PASS')
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
