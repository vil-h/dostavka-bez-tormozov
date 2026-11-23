// Sixteenth-note scores. Phrases, percussion and instrument envelopes are original.
export const scores={
 sprint:{name:'Городской удар',bpm:140,form:[0,0,1,2,0,1,2,3],root:[36,36,39,34],kick:[0,3,7,10,14],snare:[4,12],bass:[0,-1,-1,12,-1,0,7,-1,3,-1,0,-1,-1,7,-1,10],riff:[[-1,12,-1,15,-1,-1,12,-1,19,-1,18,-1,-1,15,-1,-1],[-1,19,19,-1,15,-1,-1,12,-1,10,-1,-1,12,-1,15,-1]],voice:'stab'},
 night:{name:'Ночной хищник',bpm:150,form:[0,0,1,1,2,0,2,3,1,2,3,0],root:[29,25,28,24],kick:[0,4,8,12],snare:[4,12,15],bass:[0,-1,0,-1,7,-1,0,-1,0,-1,12,-1,7,-1,3,-1],riff:[[19,-1,-1,-1,-1,-1,18,-1,15,-1,-1,-1,14,-1,-1,-1],[12,-1,-1,15,-1,-1,13,-1,12,-1,-1,-1,7,-1,10,-1]],voice:'metal'},
 express:{name:'Турбо М-7',bpm:172,form:[0,1,0,2,0,1,3,2,1,1,2,3,0,2,3,1],root:[33,36,31,28],kick:[0,6,10],snare:[4,12],bass:[0,-1,-1,-1,0,12,-1,7,-1,-1,3,-1,-1,0,10,-1],riff:[[12,-1,19,15,-1,12,-1,22,19,-1,-1,15,12,-1,10,-1],[19,17,-1,15,12,-1,15,-1,22,19,-1,17,-1,15,12,-1]],voice:'razor'}
};
const tau=Math.PI*2,rate=22050;
function sample(ctx,kind,note,length){
 const count=Math.ceil(rate*length),b=ctx.createBuffer(1,count,rate),out=b.getChannelData(0),hz=440*2**((note-69)/12);
 let seed=871,low=0,prev=0;
 for(let i=0;i<count;i++){
 const t=i/rate,u=t/length,phase=t*hz;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const noise=seed/2147483648-1,high=noise-prev;prev=noise;
 let v;
 if(kind==='kick')v=Math.sin(tau*(44*t+2.6*(1-Math.exp(-34*t))))*Math.exp(-7*u)+high*.1*Math.exp(-95*t);
 else if(kind==='snare')v=(.62*noise+.2*high)*Math.exp(-5*u)+.48*Math.sin(tau*(175*t+.5*(1-Math.exp(-38*t))))*Math.exp(-12*u);
 else if(kind==='hat')v=high*.4*Math.exp(-6*u);
 else if(kind==='bass'||kind==='sub'){const raw=Math.sin(tau*phase)+.34*Math.sin(tau*2*phase)+.17*Math.sin(tau*3*phase);v=Math.tanh(raw*(kind==='sub'?1.2:1.9))*Math.exp(-1.6*u)}
 else {const saw=2*(phase%1)-1,detune=2*((phase*1.006)%1)-1;
 const src=kind==='metal'?(.55*saw+.45*Math.sin(tau*phase+1.4*Math.sin(tau*phase*2))):kind==='razor'?saw*.55+detune*.45:Math.tanh(3*Math.sin(tau*phase));
 low+=(src-low)*(.07+.47*Math.exp(-4*u));v=low*Math.exp(-(kind==='metal'?1.5:3)*u)}
 out[i]=v*Math.min(1,t*700,(length-t)*75)
 }return b
}
export class RaceMusic{
 constructor(ctx,bus){this.ctx=ctx;this.bus=bus;this.cache=new Map();this.active=new Set();this.index=0}
 voice(kind,note,duration,volume,at){
 const key=[kind,note,duration.toFixed(3)].join('/');let b=this.cache.get(key);
 if(!b){b=sample(this.ctx,kind,note,duration);this.cache.set(key,b)}
 const src=this.ctx.createBufferSource(),env=this.ctx.createGain();src.buffer=b;env.gain.value=volume;src.connect(env);env.connect(this.bus);this.active.add(src);
 src.onended=()=>{this.active.delete(src);src.disconnect();env.disconnect()};src.start(at)
 }
 beat(n,at){const s=scores[this.id],bar=Math.floor(n/16)%s.form.length,f=s.form[bar],i=n%16,d=15/s.bpm,root=s.root[f],play=(...args)=>this.voice(...args,at);
 if(s.kick.includes(i)||(f===3&&i===14))play('kick',0,.24,.31);
 if(s.snare.includes(i)||(f===3&&i>12&&i%2))play('snare',0,.18,i===4||i===12?.21:.09);
 if(i%2===0||this.id==='express'||f===3)play('hat',0,i%4===2?.095:.045,i%2?.035:.065);
 const bass=s.bass[i];if(bass>=0)play(this.id==='express'?'sub':'bass',root+bass,s.bass[(i+1)%16]<0?d*1.85:d*.82,.23);
 const lead=s.riff[(bar+f)%2][i];if(lead>=0&&(f!==2||i%4!==1))play(s.voice,root+12+lead,d*(this.id==='night'?2.8:1.25),.12);
 if(this.id==='night'&&(i===0||i===10))for(const j of [0,3,7])play('metal',root+12+j,d*4,.055);
 if(this.id==='express'&&f>=2&&i%4===3)play('metal',root+31,d*.62,.07)
 }
 start(id,resume=false){if(!scores[id]||this.id===id&&this.timer)return;this.stop(resume&&this.id===id);this.id=id;this.next=this.ctx.currentTime+.015;
 const pump=()=>{if(this.ctx.state!=='running')return;const now=this.ctx.currentTime;if(this.next<now)this.next=now;
 while(this.next<now+.105){this.beat(this.index++,this.next);this.next+=15/scores[id].bpm}};
 pump();this.timer=setInterval(pump,32)
 }
 stop(keep=false){clearInterval(this.timer);this.timer=null;for(const src of this.active){try{src.stop()}catch{}}this.active.clear();if(!keep){this.id=null;this.index=0}}
}
