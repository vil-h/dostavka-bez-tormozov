// Hand-built coachwork in longitudinal / lateral / height coordinates.
// The orthographic road sprite and the larger three-quarter portrait share body panels.
import {legends} from './legends.js';
const cache=new Map();
export function paintLegend(c,id,top=false){
 const gt=id==='spark',L=gt?104:79,W=gt?44:40,front=L*.61,rear=-L*.63,R=gt?16:17;
 const main=gt?'#214a86':'#d26926',light=gt?'#5987b5':'#ffae52',mid=gt?'#335c91':'#e68739',dark=gt?'#142b4a':'#753518',trim=gt?'#56d6fa':'#f5bc57',ink='#15212c';
 const project=([x,y,z])=>top?[x,y-z*.045]:[x*.91-y*.57,x*.235+y*.48-z*.96];
 function poly(color,pts,edge){c.beginPath();pts.map(project).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.lineWidth=.85;c.strokeStyle=edge;c.stroke()}}
 function quad(color,a,b,d,e){poly(color,[a,b,d,e])}
 function strip(color,x1,x2,y1,y2,z){quad(color,[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z])}
 function wheel(x,y){const ring=(r,d,color)=>{const pts=[];for(let i=0;i<36;i++){const a=i*Math.PI/18;pts.push([x+r*Math.cos(a),y+d,R+r*Math.sin(a)])}poly(color,pts)};
 const sign=Math.sign(y);if(top){strip('#101820',x-R,x+R,y-3,y+3,R);return}
 ring(R,0,'#101820');ring(R*.88,sign,'#283038');ring(R*.73,sign*1.2,gt?'#b9cddd':'#e5a74b');ring(R*.61,sign*1.3,'#19232d');
 for(let i=0;i<(gt?7:5);i++){const a=i*Math.PI*2/(gt?7:5),p=(r,ang)=>[x+Math.cos(ang)*r,y+sign*1.5,R+Math.sin(ang)*r];poly(gt?'#a4bacb':'#ebb063',[p(2,a),p(R*.64,a+.25),p(R*.66,a+.50),p(3,a+.75)])}ring(2,sign*2,'#d8e2df')}
 const shadow=project([0,0,0]);c.fillStyle='#050e1799';c.beginPath();c.ellipse(shadow[0],shadow[1]+(top?2:6),L*1.03,W*(top?.97:.9),top?0:.22,0,7);c.fill();
 for(const x of [rear,front])wheel(x,-W);
 const outline=[[-L,-W*.7,18],[-L*.87,-W,23],[rear+10,-W-2,25],[0,-W*.79,23],[front-10,-W,25],[L*.89,-W*.89,21],[L,-W*.62,15],[L,W*.62,15],[L*.89,W*.89,21],[front-10,W,25],[0,W*.79,23],[rear+10,W+2,25],[-L*.87,W,23],[-L,W*.7,18]];
 poly(mid,outline,ink);
 for(const s of [-1,1]){
 poly(s===1?dark:main,[[-L,s*W*.7,18],[-L*.87,s*W,23],[rear+10,s*(W+2),25],[0,s*W*.79,23],[front-10,s*W,25],[L*.89,s*W*.89,21],[L,s*W*.62,15],[L*.94,s*W*.78,5],[front+9,s*(W+1),6],[rear-10,s*(W+1),6],[-L,s*W*.72,8]]);
 quad(ink,[rear+9,s*W,7],[front+12,s*W,7],[front+7,s*(W+4),3],[rear+6,s*(W+4),3]);
 poly(trim,gt?[[rear+4,s*W,19],[10,s*(W*.83),20],[31,s*W,24],[5,s*(W*.85),16]]:[[-L*.88,s*W,22],[-16,s*W*.85,19],[4,s*W*.81,23],[-7,s*W*.85,14],[25,s*W*.89,19],[3,s*W*.88,10]]);
 }
 const windshield=gt?30:29,tail=gt?-54:-55,back=gt?-30:-46,high=gt?36:48;
 quad('#243649',[tail,-W*.74,24],[windshield,-W*.72,24],[windshield,W*.72,24],[tail,W*.74,24]);
 quad('#506978',[tail,-W*.74,24],[back,-W*.58,high],[back,W*.58,high],[tail,W*.74,24]);
 quad('#202833',[back,-W*.58,high],[6,-W*.59,high],[6,W*.59,high],[back,W*.58,high]);
 strip(gt?'#69cef2':'#e4ae5d',back+1,5,-W*.48,-W*.41,high+.4);
 quad('#354e60',[6,-W*.59,high],[windshield,-W*.72,24],[windshield,W*.72,24],[6,W*.59,high]);
 quad('#6e8792',[9,-W*.49,high-1],[windshield-2,-W*.6,25],[windshield-3,-W*.39,25],[10,-W*.40,high-1]);
 for(const s of [-1,1]){poly('#142736',[[tail+3,s*W*.75,25],[back+2,s*W*.60,high-2],[4,s*W*.61,high-2],[windshield-3,s*W*.73,25]],dark);
 quad(main,[-23,s*W*.61,high-1],[-19,s*W*.61,high-1],[-15,s*W*.75,24],[-19,s*W*.75,24]);
 strip(main,14,22,s*W*.8,s*(W+2),28)}
 poly(main,[[windshield+1,-W*.7,24],[L*.84,-W*.78,21],[L,-W*.56,16],[L,W*.56,16],[L*.84,W*.78,21],[windshield+1,W*.7,24]]);
 if(gt){poly('#397bac',[[34,-7,24],[L*.86,-9,20],[L*.91,-6,18],[38,-3,24]]);poly('#d7f1f4',[[45,-10,24],[L*.80,-13,21],[L*.84,-11,20],[48,-8,24]])}
 else{poly('#26323a',[[33,-12,24],[L*.83,-17,22],[L*.92,-12,20],[31,2,24]]);strip(trim,36,45,-3,-1,24)}
 for(const s of [-1,1]){
 quad(ink,[front-5,s*W*.62,24],[front+17,s*W*.61,22],[front+10,s*W*.32,22],[front-12,s*W*.34,24]);
 for(let j=0;j<3;j++)strip(light,front-6+j*5,front-5+j*5,s*W*.38,s*W*.56,24);
 poly('#edfbff',[[L*.76,s*W*.83,22],[L*.94,s*W*.69,19],[L*.94,s*W*.43,18],[L*.87,s*W*.66,20]]);
 }
 quad(dark,[L,-W*.62,15],[L,W*.62,15],[L*.98,W*.73,6],[L*.98,-W*.73,6]);
 quad(ink,[L+.2,-W*.49,13],[L+.2,W*.49,13],[L+.2,W*.35,7],[L+.2,-W*.35,7]);
 strip('#29333a',L*.87,L+3,-W*.79,W*.79,4);
 for(const s of [-1,1]){quad(trim,[L+.4,s*W*.73,12],[L+.4,s*W*.52,12],[L+.4,s*W*.54,10],[L+.4,s*W*.73,10]);quad('#394a50',[L+.5,s*W*.38,9],[L+.5,0,9],[L+.5,0,10],[L+.5,s*W*.38,10])}
 poly(ink,[[14,W*.83,19],[front-13,W*.98,24],[front-20,W*.98,12],[9,W*.86,12]]);
 for(let j=0;j<3;j++)quad(light,[13+j*4,W*.9,13],[15+j*4,W*.9,13],[20+j*4,W*.91,19],[19+j*4,W*.91,19]);
 for(const x of [rear,front]){wheel(x,W+1);if(!top){const arc=[];for(let j=0;j<=12;j++){const a=Math.PI*j/12;arc.push([x+(R+2)*Math.cos(a),W+1,R+(R+2)*Math.sin(a)])}for(let j=12;j>=0;j--){const a=Math.PI*j/12;arc.push([x+(R+5)*Math.cos(a),W*.97,R+(R+4)*Math.sin(a)])}poly(main,arc)}}
 for(const s of [-1,1])quad(ink,[-L+11,s*W*.49,23],[-L+6,s*W*.49,gt?39:47],[-L+2,s*W*.49,gt?39:47],[-L+6,s*W*.49,23]);
 const wing=gt?40:48;poly(ink,[[-L-5,-W*1.07,wing],[-L+9,-W,wing],[-L+9,W,wing],[-L-5,W*1.07,wing]],main);
 strip(trim,-L-4,-L-2,-W,W,wing+1);
 if(!gt)poly('#fff1c0',[[-31,3,high+1],[-14,-6,high+1],[-21,2,high+1],[-12,1,high+1],[-29,12,high+1],[-23,4,high+1]])
}
export function legendSprite(id){
 if(!cache.has(id)){const cv=document.createElement('canvas');cv.dataset.legendSprite=id;cv.width=144;cv.height=84;const c=cv.getContext('2d');c.translate(72,42);c.scale(.59,.59);paintLegend(c,id,true);cache.set(id,cv)}return cache.get(id)
}
export function portrait(cv,id){const c=cv.getContext('2d'),w=cv.width,h=cv.height,g=c.createLinearGradient(0,0,w,h);
 g.addColorStop(0,id==='spark'?'#17364a':'#443125');g.addColorStop(1,'#10191c');c.fillStyle=g;c.fillRect(0,0,w,h);
 c.save();c.translate(w*.5,h*.63);c.scale(Math.min(w/266,h/145),Math.min(w/266,h/145));paintLegend(c,id);c.restore();
 c.fillStyle=legends[id].color;c.fillRect(14,h-18,34,3)}
