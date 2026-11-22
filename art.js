// Original Canvas artwork. The city and garage illustration are drawn once at their native resolution.
const vertical = [150, 480, 840, 1170, 1530];
const horizontal = [150, 470, 810, 1130];
const widthOf = n => n === 840 || n === 470 ? 116 : 84;
function box(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function polygon(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fill();
}
function line(c, color, width, points) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}
function oval(c, color, x, y, rx, ry) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  c.fill();
}
function seedRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function vents(c, x, y, quantity) {
  for (let i = 0; i < quantity; i++) {
    const u = x + i * 19;
    box(c, '#243139', u+3, y+3, 16, 13);
    box(c, '#818989', u, y, 16, 12);
    box(c, '#525f63', u+1, y+1, 14, 10);
    for (let k = 3; k <= 13; k += 3) box(c, '#90928c', u+k, y+3, 1, 6);
  }
}
const roofColors = [
  ['#934d42', '#b36d51', '#6c403a'], ['#4e6e74', '#75939a', '#354d55'],
  ['#837264', '#aa9080', '#635a54'], ['#686781', '#8b8392', '#4a4a61'],
  ['#466e63', '#739487', '#34534d'],
];
function building(c, x, y, w, h, style, random) {
  const [base, trim, wall] = roofColors[style % roofColors.length];
  box(c, '#233237', x+5, y+7, w, h);
  box(c, wall, x, y+5, w, h-5);
  for (let u = x + 6; u < x+w-8; u += 13) {
    box(c, random() < .53 ? '#f8c87d' : '#24383e', u, y+h-8, 7, 5);
    box(c, '#674c44', u+3, y+h-8, 1, 5);
  }
  box(c, trim, x, y, w, h-13);
  box(c, base, x+3, y+3, w-6, h-19);
  box(c, wall, x+4, y+4, w-8, 2);
  box(c, wall, x+4, y+4, 2, h-23);
  for (let v = y+17; v < y+h-21; v+=19) {
    box(c, wall, x+7, v, w-14, 1);
  }
  vents(c, x+10, y+10, w > 70 ? 2 : 1);
  if (w > 66 && h > 65) {
    box(c, wall, x+w-27, y+h-42, 13, 22);
    box(c, trim, x+w-29, y+h-44, 13, 22);
    for (let k = 0; k < 4; k++) box(c, '#48565c', x+w-27, y+h-41+k*4, 9, 2);
  }
}
function tree(c, x, y, variant) {
  oval(c, '#283c3c', x+4, y+6, 12, 9);
  box(c, '#735b42', x-2, y+3, 5, 10);
  const tones = variant ? ['#274d49','#3b6960','#58816c'] : ['#354e46','#54775e','#7f9068'];
  oval(c, tones[0], x, y, 12, 11);
  oval(c, tones[1], x-2, y-3, 10, 9);
  box(c, tones[2], x-7, y-8, 5, 2);
  box(c, tones[2], x-9, y-5, 3, 2);
}
function sign(c, x, y, text, accent) {
  c.font = 'bold 10px monospace';
  const w = Math.ceil(c.measureText(text).width)+12;
  box(c, '#232f38', x+2,y+2,w,15);
  box(c, accent, x,y,w,14);
  box(c, '#30373a',x+1,y+1,w-2,12);
  c.fillStyle = accent;
  c.textBaseline = 'top';
  c.fillText(text, x+6,y+2);
}
function park(c, x, y, w, h, random) {
  box(c, '#475f54', x,y,w,h);
  box(c, '#637768', x+5,y+5,w-10,h-10);
  box(c, '#9d9380', x+w*.48,y,11,h);
  box(c, '#9d9380', x,y+h*.48,w,10);
  const px = x+w*.5, py = y+h*.5;
  oval(c, '#b1a695', px,py,29,24);
  oval(c, '#435b65', px,py,23,18);
  oval(c, '#5c9695', px,py,20,15);
  box(c, '#a3cebb',px-8,py-4,13,2);
  for (let v = y+18; v < y+h-5; v+=40) {
    for (let u = x+17; u < x+w-8; u+=44) {
      if (Math.abs(u-px) > 22 && Math.abs(v-py) > 16)
        tree(c, u+random()*6, v+random()*5, random()<.5);
    }
  }
}
function yard(c, x,y,w,h) {
  box(c, '#53676a', x,y,w,h);
  for (let u = x+8; u < x+w-30; u+=37) {
    for (let v=y+8; v<y+h-54; v+=64) {
      const palette = roofColors[Math.abs(Math.floor((u+v)/30))%5];
      box(c, '#304248',u+3,v+4,27,49);
      box(c,palette[0],u,v,27,49);
      box(c,palette[1],u,v,27,2);
      for(let k=4;k<47;k+=5) box(c,palette[2],u+2,v+k,23,2);
    }
  }
}
function road(c, center, length, width) {
  box(c, '#626767', -width/2-16, 0,width+32,length);
  box(c, '#aaa293', -width/2-2,0,width+4,length);
  box(c, '#444850', -width/2,0,width,length);
  box(c, '#3d4149', -width/2+4,0,width-8,length);
  const large = width>100;
  for (let d=0;d<length;d+=37) {
    box(c, '#b7a47b', -1,d,2,16);
    if (large) {
      box(c,'#858385', -27,d+3,2,11);
      box(c,'#858385', 26,d+3,2,11);
    }
  }
  for (let d=8; d<length;d+=77) {
    box(c, '#454c50', -width/2-11,d,7,13);
    for(let k=0;k<4;k++) box(c,'#798080',-width/2-10,d+1+k*3,5,1);
  }
}
const signs = ['ДЕПО','ПОРТ','КАФЕ','РЫНОК','АТЕЛЬЕ','СЕРВИС','КИНО','ПОЧТА','ЦЕХ','СКЛАД'];
export function drawCity(c) {
  c.save();
  const random = seedRandom(4077);
  box(c,'#364d50',0,0,1680,1280);
  // Industrial blocks also frame the outermost perimeter streets.
  const xEdges=[-44,...vertical,1724], yEdges=[-44,...horizontal,1324];
  for(let j=0;j<yEdges.length-1;j++) for(let i=0;i<xEdges.length-1;i++) {
    const x=xEdges[i]+widthOf(xEdges[i])/2+17, y=yEdges[j]+widthOf(yEdges[j])/2+17;
    const w=xEdges[i+1]-widthOf(xEdges[i+1])/2-17-x;
    const h=yEdges[j+1]-widthOf(yEdges[j+1])/2-17-y;
    const id=j*6+i;
    if ((id===8 || id===21) && w>130) { park(c,x,y,w,h,random); continue; }
    if (i===5 || (j===4 && i===3)) { yard(c,x,y,w,h); continue; }
    box(c,'#626d6a',x,y,w,h);
    const cols=w>140?2:1, rows=h>145?2:1;
    for(let a=0;a<cols;a++) for(let b=0;b<rows;b++) {
      const bw=w/cols, bh=h/rows, bx=x+bw*a+4, by=y+bh*b+4;
      building(c,bx,by,bw-11,bh-13,id+a+b,random);
      if (a===0 && b===rows-1 && w>135 && h>120) {
        sign(c,bx+8,by+bh-34, signs[id%signs.length],id%2?'#ffd38c':'#92cfc0');
      }
    }
    if (w>140) tree(c,x+w*.5,y+h-6,id%2);
  }
  for (const x of vertical) {
    c.save(); c.translate(x,0); road(c,x,1280,widthOf(x)); c.restore();
  }
  for (const y of horizontal) {
    c.save(); c.translate(0,y); c.rotate(-Math.PI/2); road(c,y,1680,widthOf(y)); c.restore();
  }
  for(const x of vertical) for(const y of horizontal) {
    const rx=widthOf(x)/2, ry=widthOf(y)/2;
    box(c,'#3e424a',x-rx,y-ry-16,rx*2,2*ry+32);
    box(c,'#3e424a',x-rx-16,y-ry,rx*2+32,ry*2);
    for(let a=-rx+8; a<rx-5;a+=9) {
      for(const dir of [-1,1]) box(c,'#c0b9a7',x+a,y+dir*(ry+8)-4,4,9);
    }
    for(let b=-ry+8; b<ry-5;b+=9) {
      for(const dir of [-1,1]) box(c,'#aaa99e',x+dir*(rx+8)-4,y+b,9,4);
    }
    for (const dir of [-1,1]) {
      const sx=x+dir*(rx+9), sy=y-dir*(ry+8);
      box(c,'#414d4e',sx+2,sy+2,3,7);
      box(c,'#273637',sx,sy,5,7);
      box(c,dir===1?'#ffab6c':'#8fd1ae',sx+1,sy+1,3,3);
    }
  }
  for(let i=0;i<5400;i++) {
    box(c,i%2?'rgba(243,224,198,.10)':'rgba(22,37,42,.15)',Math.floor(random()*1680),Math.floor(random()*1280), 1+Math.floor(random()*3),1);
  }
  c.restore();
}
export function drawCar(c,x,y,heading,color='#ff702c') {
  c.save(); c.translate(x,y); c.rotate(heading);
  box(c,'rgba(12,19,27,.45)',-20,-8,43,22);
  for(const ax of [-14,10]) for(const ay of [-12,8]) box(c,'#151c22',ax,ay,8,5);
  polygon(c,'#262b31',[[-20,-10],[14,-10],[21,-6],[22,6],[15,11],[-20,11],[-22,8],[-22,-7]]);
  polygon(c,color,[[-20,-9],[14,-9],[20,-5],[20,5],[15,9],[-20,9]]);
  box(c,'rgba(255,249,211,.57)',-18,-8,20,2);
  box(c,'rgba(50,30,36,.28)',-17,6,19,2);
  box(c,'#ffebba',-17,-2,15,4);
  polygon(c,'#263b48',[[4,-8],[10,-7],[12,-4],[12,5],[9,7],[4,8]]);
  polygon(c,'#7fa8a6',[[5,-7],[9,-6],[10,-4],[6,2]]);
  box(c,'#fbf0bb',18,-7,3,4); box(c,'#fbf0bb',18,4,3,4);
  box(c,'#fc9270',-22,-7,2,4); box(c,'#fc9270',-22,4,2,4);
  c.restore();
}
function wheel(c,x,y,r) {
  // Octagonal tires and split metal rims, drawn on the same pixel grid as the body.
  polygon(c,'#181d26',[[x-r,y-5],[x-r+2,y-r+1],[x-3,y-r-3],[x+3,y-r-2],[x+r-1,y-r+2],[x+r+1,y-3],[x+r,y+5],[x+r-3,y+r],[x+2,y+r+3],[x-5,y+r+2],[x-r,y+5]]);
  oval(c,'#323944',x,y,r*.71,r*.86);
  oval(c,'#728085',x,y,r*.48,r*.62);
  oval(c,'#a4afad',x-1,y-1,r*.35,r*.48);
  box(c,'#46505a',x-2,y-1,4,4);
  box(c,'#e2ceaa',x-3,y-5,3,2);
}
function createHero(c) {
  const p=(color,...points)=>polygon(c,color,points);
  const b=(color,x,y,w,h)=>box(c,color,x,y,w,h);
  const ink='#24252d', cream='#ffecb9', bright='#ffab54', orange='#ee6931';
  // Foreshortened shadow below the van.
  p('rgba(6,13,22,.38)',[5,77],[35,68],[201,66],[243,81],[204,104],[61,103]);
  p('rgba(6,13,22,.45)',[18,79],[148,74],[234,79],[201,98],[49,94]);
  // Far tires peeking below the rear axle and the nose.
  wheel(c,59,77,9); wheel(c,209,82,10);
  p(ink,[11,40],[15,34],[45,21],[147,25],[167,29],[184,42],[195,48],[215,50],[231,57],[235,65],[235,80],[209,94],[194,97],[15,82],[10,75]);
  // Main side panels and roof. Deliberate hard-edged highlight bands give the paint its finish.
  p(orange,[14,40],[17,36],[134,42],[150,46],[170,62],[194,68],[201,73],[200,92],[16,79],[13,74]);
  p('#b1472c',[14,70],[200,84],[200,93],[16,80]);
  p('#fba154',[16,37],[44,24],[145,28],[163,31],[138,44]);
  p('#ffd491',[20,36],[46,25],[144,29],[155,31],[135,39]);
  for(let k=0;k<5;k++) {
    line(c,'#e69858',1,[[36+k*17,34],[48+k*17,29],[54+k*17,29]]);
  }
  p('#fa9146',[14,40],[133,45],[133,50],[14,45]);
  p('#cc4e2e',[14,60],[116,66],[116,72],[14,66]);
  // Parcel and fast-stripe graphic printed on the sliding door.
  p(cream,[17,53],[59,56],[56,59],[17,56]);
  p(cream,[16,58],[52,60],[48,63],[16,61]);
  p('#f6b276',[19,64],[43,65],[39,67],[19,66]);
  p(cream,[61,53],[70,49],[81,54],[71,59]);
  p(cream,[61,55],[69,60],[69,69],[61,64]);
  p(cream,[72,60],[81,56],[81,65],[72,69]);
  p('#d25c36',[66,52],[68,51],[76,55],[74,56]);
  line(c,'#b74d30',1,[[91,46],[89,70],[99,74],[116,75],[121,47]]);
  b('#95452e',108,56,7,2); b(cream,108,55,5,1);
  // Driver side window, thick divider and the slanted windshield.
  p(ink,[125,45],[138,45],[148,50],[163,63],[150,62],[125,58]);
  p('#436170',[127,47],[138,48],[154,60],[127,56]);
  p('#80a6a4',[131,48],[137,49],[146,56],[141,56]);
  p('#f3ae69',[140,44],[166,32],[180,44],[189,51],[166,63]);
  p(ink,[145,44],[166,34],[185,51],[166,60]);
  p('#547582',[149,44],[166,37],[181,50],[166,57]);
  p('#a4c6b6',[154,43],[164,39],[172,46],[167,48]);
  p('#779999',[169,53],[177,48],[180,51],[173,54]);
  line(c,'#35444c',1,[[166,56],[173,53],[176,53]]);
  // Hood and squared front grille, inset faceted headlights and bumper overriders.
  p('#ffac5c',[165,62],[189,51],[213,53],[230,58],[201,72]);
  p('#ffcb84',[177,60],[193,54],[211,55],[220,57],[202,65]);
  p('#cd572f',[202,73],[231,59],[232,77],[201,91]);
  p('#37373a',[204,75],[232,62],[232,68],[204,82]);
  p('#fce7ae',[203,73],[211,69],[211,74],[203,78]);
  p('#fce7ae',[228,62],[232,60],[232,65],[228,67]);
  for(let i=0;i<3;i++) line(c,'#798080',1,[[214,72+i*2],[225,67+i*2]]);
  p('#252b34',[201,85],[233,71],[233,78],[201,93]);
  p('#839092',[203,85],[231,73],[231,75],[203,88]);
  p('#e5d8af',[216,81],[224,77],[224,80],[216,84]);
  line(c,'#c45333',1,[[122,48],[120,73],[133,78],[153,79],[158,65]]);
  b('#292e36',126,60,7,2); b('#ffe0a3',126,59,5,1);
  b('#272f38',151,61,8,3); b(bright,152,60,5,1);
  // Running boards, rear lamps, fenders, wheels and painted wheel-arch lips.
  p('#4d4847',[17,76],[197,89],[197,92],[16,79]);
  p('#ffd08b',[61,75],[145,81],[145,83],[61,77]);
  b('#441e27',12,56,4,11); b('#ffb079',12,58,3,4);
  for (const [x,y,r] of [[45,79,12],[167,88,13]]) {
    p('#8d3c2e',[x-r-5,y],[x-r-4,y-8],[x-8,y-r-3],[x+3,y-r-4],[x+10,y-r],[x+r+3,y-5],[x+r+4,y+1]);
    line(c,bright,2,[[x-r-5,y-1],[x-r-4,y-7],[x-7,y-r-3],[x+3,y-r-3],[x+10,y-r+1]]);
    wheel(c,x,y,r);
  }
  p('#c85532',[177,78],[191,79],[196,83],[183,82]);
  p('#fff1c1',[189,72],[198,73],[199,76],[190,75]);
  b('#cfd4bd',16,73,4,3);
}
let heroImage;
export function drawHero(ctx,w,h) {
  if (!heroImage) {
    heroImage = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(248,108) : document.createElement('canvas');
    heroImage.width=248; heroImage.height=108;
    createHero(heroImage.getContext('2d'));
  }
  const scale=Math.min(w/248,h/108);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(heroImage,(w-248*scale)/2,(h-108*scale)/2,248*scale,108*scale);
  ctx.restore();
}
