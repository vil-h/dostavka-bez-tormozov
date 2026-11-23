const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const drive=require('./drive-race.cjs'),[engine='chromium',live]=process.argv.slice(2);
(async()=>{const {events}=await import('../challenges.js'),browser=await({chromium,webkit})[engine].launch();try{
 const ctx=await browser.newContext({viewport:{width:740,height:390},hasTouch:true,isMobile:true}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));const url=live||'http://duels.test/';
 if(!live)await p.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8')}));
 await p.addInitScript(()=>{const k='dostavka-bez-tormozov.v1';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({money:9000,records:{sprint151:{time:{value:10,model:'van'}}}}))});
 await p.clock.install();await p.goto(url);await p.clock.pauseAt(new Date(Date.now()+2000));
 const act=a=>p.locator('[data-action="'+a+'"]').click(),tick=ms=>p.clock.runFor(ms);
 const rank=async()=>parseInt(await p.locator('#order').innerText()),speed=async()=>parseInt(await p.locator('#speed').innerText());
 for(const [id,level,model,pace] of [['sprint','rookie','van',265],['sprint','normal','van',265],['night','normal','hatch',270],['express','pro','coupe',355],['sprint','normal','coupe',325]]){
 if(model!=='van'&&!(model==='coupe'&&id==='sprint')){await act('garage');await act('model:'+model);await act('purchase');await act('select');await act('menu')}
 await act('events');await act('category:race');await act('brief:'+id);await act('difficulty:'+id+':'+level);
 assert.equal(await p.locator('[data-action="difficulty:'+id+':'+level+'"]').getAttribute('aria-pressed'),'true');await act('startEvent:'+id);await tick(3250);
 const result=await drive(p,events[id],pace);assert.ok(result.includes('₽')&&!result.includes('не финишировал'));console.log(engine,id,level,model,result.replace(/\n/g,' ').slice(0,245));
 if(id==='sprint'&&model==='coupe'){
 await act('startEvent:sprint');await tick(3250);await p.keyboard.down('ArrowUp');await tick(1620);const before=await rank(),initial=await speed();
 await p.keyboard.down('ArrowLeft');await tick(475);await p.keyboard.up('ArrowLeft');
 let min=initial;for(let i=0;i<30;i++){await tick(50);min=Math.min(min,await speed());if(min<initial*.32)break}
 await p.keyboard.up('ArrowUp');assert.ok(min<initial*.32,'no wall impact');await tick(600);const after=await rank();console.log('wall',initial,min,before,after);assert.ok(after>before);
 await p.keyboard.down('ArrowDown');await tick(640);await p.keyboard.up('ArrowDown');
 const finish=await drive(p,events[id],210);console.log('after collision',finish.replace(/\n/g,' ').slice(0,165))
 }
 await act('menu')
 }
 await p.reload();await act('settings');assert.equal(await p.locator('#raceDifficulty').inputValue(),'normal');await p.locator('#raceDifficulty').selectOption('pro');await p.reload();
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('dostavka-bez-tormozov.v1')));assert.equal(saved.difficulty,'pro');
 for(const k of ['sprint151','sprint152_normal','sprint152_rookie','night152_normal','express152_pro'])assert.ok(saved.records[k]);assert.deepEqual(errors,[]);console.log('PASS')
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
