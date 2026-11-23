// Inspect the real Web Audio output and scheduled sources while operating the UI.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),drive=require('./drive-race.cjs');
(async()=>{const live=process.argv[2],url=live||'http://audio.test/',{events}=await import('../challenges.js');const b=await chromium.launch();try{
 const p=await b.newPage({viewport:{width:740,height:390},isMobile:true,hasTouch:true});if(!live)await p.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8')}));
 await p.addInitScript(()=>{const rc=AudioContext.prototype.createDynamicsCompressor,rb=AudioContext.prototype.createBufferSource,ro=AudioContext.prototype.createOscillator;
 window.meter={sources:new Set(),loops:0,persistent:0,contexts:new Set(),notes:0};
 AudioContext.prototype.createDynamicsCompressor=function(){const node=rc.call(this);meter.contexts.add(this);meter.analyser=this.createAnalyser();node.connect(meter.analyser);return node};
 AudioContext.prototype.createBufferSource=function(){const node=rb.call(this),start=node.start.bind(node);node.start=(...a)=>{if(node.loop)meter.loops++;else{meter.notes++;meter.sources.add(node);node.addEventListener('ended',()=>meter.sources.delete(node))}start(...a)};return node};
 AudioContext.prototype.createOscillator=function(){const n=ro.call(this);meter.persistent++;n.addEventListener('ended',()=>meter.persistent--);return n}
 });
 await p.goto(url);const act=a=>p.locator('[data-action="'+a+'"]').click(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const measure=()=>p.evaluate(()=>{const samples=new Float32Array(meter.analyser.fftSize);meter.analyser.getFloatTimeDomainData(samples);return {peak:Math.max(...samples.map(Math.abs)),notes:meter.notes,active:meter.sources.size,contexts:meter.contexts.size,engine:meter.persistent}});
 await act('settings');
 for(const id of ['sprint','night','express']){await act('listen:'+id);await sleep(520);const a=await measure();assert.ok(a.peak>.002&&a.peak<1&&a.active>0);console.log('preview',id,a)}
 const vol=p.locator('[data-volume=music]');await vol.fill('0');await sleep(650);assert.ok((await measure()).peak<.001);await vol.fill('40');await act('listen:stop');await sleep(220);assert.equal((await measure()).active,0);await act('menu');
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+2000));
 for(const id of ['sprint','night','express']){
 await act('events');await act('category:race');await act('brief:'+id);await act('startEvent:'+id);const initial=(await measure()).notes;await p.clock.runFor(2450);assert.equal((await measure()).notes,initial);await p.clock.runFor(950);assert.ok((await measure()).notes>initial);
 await p.locator('#pause').click();await sleep(220);assert.equal((await measure()).active,0);
 await act('resume');await p.clock.runFor(200);assert.ok((await measure()).active>0);await p.locator('#pause').click();await act('startEvent:'+id);await p.clock.runFor(3250);
 const finish=await drive(p,events[id],245);assert.ok(finish.includes('₽'));await sleep(550);const a=await measure();assert.equal(a.active,0);assert.equal(a.contexts,1);assert.ok(a.engine>=3);await act('menu');console.log('finished',id,a)
 }console.log('PASS')
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1})
