import {bounds,roads,avenue,cross,outposts,roadEdge} from './geography.js';
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y))}
function stripe(c,points,width,color){path(c,points);c.lineWidth=width;c.strokeStyle=color;c.stroke()}
const lots=[[8030,1270,98,116],[8020,1430,108,68],[8240,1220,110,230],[7680,1300,156,82],[7680,1440,180,72]];
const labels=[[1830,380,'М-7   ВОСТОК →'],[4380,380,'АЗС   24'],[6030,710,'ВЕСОВАЯ'],[7520,1050,'ТЕРМИНАЛ   08'],[5490,2460,'ЛЕСНИЧЕСТВО'],[3120,1570,'←   В ГОРОД']];
export function landscape(c,x,y,w,h){
 if(x+w<1620&&y+h<1280)return;
 c.save();c.fillStyle='#667547';c.fillRect(x,y,w,h);
 const contains=(a,b,p=140)=>a>=x-p&&b>=y-p&&a<=x+w+p&&b<=y+h+p;
 for(let i=Math.floor((x-20)/180);i<=Math.floor((x+w)/180);i++)for(let j=Math.floor((y-20)/160);j<=Math.floor((y+h)/160);j++){
 const a=i*180,b=j*160;if(a<1550&&b<1200)continue;
 const n=Math.abs((i*72391+j*15679)^((i+j)*481));
 const forest=b>1450&&a<7650;
 c.fillStyle=forest?['#5e7652','#667c53','#607751'][n%3]:['#819150','#78894b','#91a15d','#849855'][n%4];c.fillRect(a,b,179,159);
 c.strokeStyle='#a7ad6a55';c.lineWidth=2;c.beginPath();for(let k=8;!forest&&k<160;k+=15){c.moveTo(a,b+k);c.lineTo(a+178,b+k)}c.stroke();
 for(let k=0;k<(forest?11:4);k++){const tx=a+(n+k*67+k*k*7)%178,ty=b+(n*3+k*97)%155;if(roadEdge(tx,ty)<22)continue;
 c.fillStyle='#42563d';c.beginPath();c.arc(tx+3,ty+5,12,0,7);c.fill();c.fillStyle=k%2?'#476944':'#53774a';c.beginPath();c.arc(tx,ty,11+(k%3),0,7);c.fill();c.fillStyle='#86a362';c.beginPath();c.arc(tx-3,ty-4,5,3.2,5.5);c.strokeStyle='#76915c';c.lineWidth=2;c.stroke()}
 }
 c.fillStyle='#737b76';c.fillRect(7550,1080,840,610);
 c.lineJoin=c.lineCap='round';
 for(const {points,width} of roads){stripe(c,points,width+18,'#b4a381');stripe(c,points,width,'#454d50');stripe(c,points,width-7,'#c9c5a8');stripe(c,points,width-12,'#454d50')}
 for(const {points} of roads){c.setLineDash([19,24]);stripe(c,points,2,'#e2d6a6');c.setLineDash([])}
 for(const [i,{points,width}] of roads.entries())for(let j=1;j<points.length;j++){
 const [a,b]=points[j-1],[endX,endY]=points[j],angle=Math.atan2(endY-b,endX-a),len=Math.hypot(endX-a,endY-b);
 if(i===2||j%3===1)continue;
 for(let t=54;t<len-45;t+=72){const cx=a+t*Math.cos(angle),cy=b+t*Math.sin(angle);if(!contains(cx,cy))continue;
 c.save();c.translate(cx,cy);c.rotate(angle);c.fillStyle='#544f40';c.fillRect(-27,width/2+9,4,8);c.fillRect(24,width/2+9,4,8);c.fillStyle='#c2bfac';c.fillRect(-34,width/2+7,68,3);c.restore()}
 }
 for(const [a,b,l,h] of lots){if(!contains(a,b,250))continue;c.fillStyle='#394547';c.fillRect(a+7,b+8,l,h);c.fillStyle='#a1a8a3';c.fillRect(a,b,l,h);c.fillStyle='#62767a';for(let u=4;u<l;u+=10)c.fillRect(a+u,b,3,h);c.fillStyle='#e4a65e';c.fillRect(a,b+h-8,l,6);c.fillStyle='#d7d3bc';c.fillRect(a+12,b+10,40,16);c.fillStyle='#4b5b5d';c.font='bold 11px monospace';c.fillText('Т–08',a+17,b+22);
 for(let d=12;d<l-20;d+=36){c.fillStyle='#303f43';c.fillRect(a+d,b+h-3,22,8);c.fillStyle='#d5c878';c.fillRect(a+d-2,b+h+7,26,2)}}
 for(let i=0;i<10;i++){const a=7730+i%5*34,b=1535+Math.floor(i/5)*25;c.fillStyle=i%2?'#b26846':'#46696e';c.fillRect(a,b,31,19)}
 if(contains(4400,380,230)){
 c.fillStyle='#8b8980';c.fillRect(4290,306,200,96);c.fillStyle='#c9c4a1';c.fillRect(4300,312,82,43);
 c.fillStyle='#3c5458';c.fillRect(4309,340,63,12);c.fillStyle='#404c41';c.fillRect(4399,324,73,54);
 c.fillStyle='#d1b982';c.fillRect(4394,318,73,45);c.fillStyle='#b75d3d';c.fillRect(4394,352,73,10);
 for(let i=0;i<3;i++){c.fillStyle='#dbd9bd';c.fillRect(4400+22*i,370,8,13);c.fillStyle='#54666b';c.fillRect(4401+22*i,372,6,5)}}
 for(const [a,b,title] of labels){if(!contains(a,b))continue;c.fillStyle='#323e35';c.fillRect(a,b,4,29);c.font='bold 12px monospace';const l=c.measureText(title).width+14;c.fillStyle='#c8d5ba';c.fillRect(a-4,b-21,l,21);c.fillStyle='#31594e';c.fillRect(a-2,b-19,l-4,17);c.fillStyle='#fff3cf';c.fillText(title,a+2,b-6)}
 c.restore()
}
export function atlas(canvas,player,target,route,labels=true){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,sx=w/bounds[0],sy=h/bounds[1];
 c.save();c.fillStyle='#263d36';c.fillRect(0,0,w,h);c.scale(sx,sy);c.fillStyle='#455658';c.fillRect(0,0,1680,1280);
 for(const x of avenue)stripe(c,[[x,0],[x,1280]],23,'#9daaa1');for(const y of cross)stripe(c,[[0,y],[1680,y]],23,'#9daaa1');
 roads.forEach(({points},i)=>stripe(c,points,labels?30:60,['#eac784','#a3cfa2','#9abec3'][i]));
 if(route)stripe(c,route,32,'#d5ff77');c.restore();
 if(labels){c.font='bold 15px system-ui';c.fillStyle='#f4f0d6';for(const [a,b,t] of [[120,1450,'Старый город'],[3030,300,'М-7 · Загородное шоссе'],[6750,1040,'Промзона'],[4700,2680,'Лесной серпантин']])c.fillText(t,a*sx,b*sy);
 c.fillStyle='#e3b374';for(const [,a,b] of outposts)c.fillRect(a*sx-2,b*sy-2,4,4)}
 for(const [p,color] of [[target,'#ff9c65'],[player,'#c9ff63']])if(p){c.fillStyle=color;c.beginPath();c.arc(p[0]*sx,p[1]*sy,labels?6:3,0,7);c.fill();c.strokeStyle='#101e18';c.lineWidth=2;c.stroke()}
}
const tiles=new Map(),side=512;
export function drawRegion(c,x,y,w,h){
 for(let i=Math.max(0,Math.floor(x/side));i<=Math.floor((x+w)/side);i++)for(let j=Math.max(0,Math.floor(y/side));j<=Math.floor((y+h)/side);j++){
 if((i+1)*side<=1680&&(j+1)*side<=1280)continue;
 const key=i+','+j;let tile=tiles.get(key);if(!tile){
 tile=document.createElement('canvas');tile.width=tile.height=side;const t=tile.getContext('2d');t.translate(-i*side,-j*side);landscape(t,i*side,j*side,side,side);
 if(tiles.size>=18)tiles.delete(tiles.keys().next().value)
 }else tiles.delete(key);
 tiles.set(key,tile);c.drawImage(tile,i*side,j*side)}
}
