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

// Sprites of the currently displayed vehicle are cached in both views. Changing
// paint or trim replaces the pair, so the cache cannot grow with garage use.
const vehicleShapes={
  van:{length:184,width:56,wheelbase:[32,151],radius:13},
  hatch:{length:145,width:59,wheelbase:[26,119],radius:13},
  coupe:{length:202,width:65,wheelbase:[36,162],radius:15},
  pickup:{length:192,width:63,wheelbase:[37,159],radius:17},
};
const factoryColors={van:'#ff702c',hatch:'#61ad85',coupe:'#c34e44',pickup:'#647a89'};
const metal='#252e34',tire='#151a20',glass='#283d4b',glassLight='#85a9af',headlight='#fff0b5';
function paintColors(color){
  const value=parseInt(color.slice(1),16);
  const rgb=[value>>16,(value>>8)&255,value&255];
  function mix(target,amount){return 'rgb('+rgb.map((v,i)=>Math.round(v+(target[i]-v)*amount)).join(',')+')'}
  return {base:color,lit:mix([255,238,198],.38),glint:mix([255,246,222],.68),
    low:mix([22,30,38],.42),deep:mix([18,25,33],.7),
    print:rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>185?'#263840':'#ffeab5'};
}
function stamp(c,type,x,y,w,h,ink){
  c.save();c.translate(x,y);c.scale(w/30,h/14);
  switch(type){
    case 'stripes':
      polygon(c,ink,[[0,3],[30,3],[26,6],[0,6]]);
      polygon(c,ink,[[0,8],[24,8],[20,11],[0,11]]);break;
    case 'bolt':polygon(c,ink,[[3,7],[18,0],[15,5],[29,4],[8,14],[13,8]]);break;
    case 'number':
      box(c,ink,3,0,24,14);c.fillStyle=ink==='#263840'?'#ffeab5':'#263840';
      c.font='bold 13px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('27',15,7.4);break;
    case 'geo':
      for(let i=0;i<3;i++)polygon(c,ink,[[i*9,3],[i*9+5,1],[i*9+10,8],[i*9+5,12]]);
      break;
  }
  c.restore();
}
function customWheel(c,x,y,r,rims){
  if(rims==='standard'){wheel(c,x,y,r);return}
  oval(c,tire,x,y,r,r*1.12);oval(c,'#323a42',x,y,r*.86,r*.97);
  oval(c,rims==='dark'?'#474f56':'#c6d4cc',x,y,r*.68,r*.81);
  oval(c,'#18252d',x,y,r*.55,r*.67);
  const spokes=rims==='sport'?6:5;
  for(let n=0;n<spokes;n++){
    const a=2*Math.PI*n/spokes;
    line(c,rims==='sport'?'#e1e6d0':'#39434c',rims==='sport'?1.8:3,
      [[x,y],[x+r*.57*Math.cos(a),y+r*.67*Math.sin(a)]]);
  }
  oval(c,rims==='sport'?'#d3a75c':'#59636c',x,y,r*.19,r*.21);
}
function showroomProjection(shape){
  const left=(248-shape.length*.98-shape.width*.48)/2;
  return (u,v,z)=>[left+u*.98+v*.48,82+(u-shape.length/2)*.071-v*.30-z];
}
function showroomBody(c,model,look,colors){
  const shape=vehicleShapes[model],L=shape.length,W=shape.width;
  const at=showroomProjection(shape);
  const face=(color,...points)=>polygon(c,color,points.map(p=>at(...p)));
  const side=(color,points,depth=0)=>polygon(c,color,points.map(([u,z])=>at(u,depth,z)));
  const across=(color,u1,z1,u2,z2,v1=0,v2=W)=>face(color,[u1,v1,z1],[u1,v2,z1],[u2,v2,z2],[u2,v1,z2]);
  const seam=(color,width,...points)=>line(c,color,width,points.map(p=>at(...p)));
  const glassSide=points=>{side(glass,points);};
  const wind=(u1,z1,u2,z2)=>{
    across(metal,u1,z1,u2,z2,2,W-2);across('#547784',u1+1,z1-.8,u2-2,z2+1,6,W-6);
    face(glassLight,[u1+2,9,z1-1],[u1+2,18,z1-1],[u2-3,24,z2+2],[u2-3,14,z2+2]);
    seam('#354952',1,[u2-1,7,z2+2],[u2-4,W*.49,z2+4]);
  };
  const shadow=at(L*.5,W*.5,-7);oval(c,'#0d171b55',...shadow,L*.52,W*.32);
  const yWheel=shape.radius-2;
  for(const axle of shape.wheelbase){const [x,y]=at(axle,W-3,yWheel);wheel(c,x,y,shape.radius*.88)}
  const belt=model==='coupe'?25:model==='hatch'?30:36;
  const outer=[[0,13],[1,belt-4],[8,belt],[L*.72,belt+1],[L-9,belt-3],[L,belt-9],[L-1,10],[L-8,6],[6,6]];
  side(metal,outer);
  side(colors.base,[[2,15],[3,belt-4],[9,belt-2],[L*.72,belt-1],[L-10,belt-5],[L-2,belt-9],[L-3,12],[L-9,9],[7,9]]);
  side(colors.low,[[4,15],[L*.5,18],[L-4,14],[L-5,10],[8,8]]);
  across(colors.lit,8,belt,L*.73,belt+1);
  across(colors.lit,L*.73,belt+1,L-9,belt-3);
  across(colors.low,L-9,belt-3,L,belt-9);
  across(colors.deep,L,belt-9,L-1,10);
  if(model==='hatch'){
    side(colors.base,[[4,29],[10,48],[23,54],[68,55],[80,52],[103,32],[110,29]]);
    across(colors.lit,10,48,23,54);across(colors.lit,23,54,69,55);
    across(colors.glint,26,54.5,69,55,3,6);
    wind(71,54,104,31);
    glassSide([[12,32],[16,47],[25,50],[39,51],[38,32]]);
    glassSide([[44,32],[45,51],[68,51],[74,48],[97,32]]);
    side(glassLight,[[18,44],[25,49],[30,49],[23,39]]);
    side('#527986',[[47,48],[61,49],[49,34],[44,34]]);
    seam(colors.deep,1,[40,0,31],[41,0,15],[48,0,12],[85,0,12],[91,0,30]);
    side(metal,[[45,29],[52,29],[51,27],[45,27]]);
    across(metal,10,48,15,50,-2,W+2);
  }else if(model==='coupe'){
    side(colors.base,[[9,24],[23,29],[51,39],[66,44],[97,45],[109,43],[138,27],[154,23]]);
    across(colors.low,10,25,49,39);across(glass,20,28,48,38,6,W-6);
    across(colors.lit,49,39,65,44);across(colors.lit,65,44,97,45);
    wind(99,45,137,26);
    glassSide([[34,28],[58,39],[68,41],[74,41],[73,28]]);
    glassSide([[78,28],[79,41],[97,41],[105,39],[127,27]]);
    side(glassLight,[[84,39],[92,39],[81,29],[77,29]]);
    seam(colors.deep,1.3,[74,0,27],[69,0,15],[90,0,12],[119,0,17],[123,0,26]);
    side('#182a30',[[55,20],[70,22],[64,15],[55,14]]);
    seam(colors.glint,1.5,[136,9,27],[178,11,25],[188,16,24]);
    across(metal,8,32,12,32,-3,W+3);
    side(metal,[[9,25],[10,32],[13,32],[12,25]]);
  }else{
    // Bed rails, recessed floor and stamped ribs remain visible from the elevated view.
    across(metal,2,belt,78,belt,-1,W+1);
    across('#38494b',7,belt+1,73,belt+1,5,W-5);
    for(let n=9;n<W-8;n+=7)across('#62716c',9,belt+1,70,belt+1,n,n+2);
    seam(colors.glint,2,[3,0,belt+1],[76,0,belt+1]);
    seam(colors.glint,2,[3,W,belt+1],[76,W,belt+1]);
    side(colors.base,[[76,35],[78,56],[83,63],[108,64],[120,62],[143,39],[149,35]]);
    across(colors.lit,79,57,84,63);across(colors.lit,84,63,111,64);
    across(colors.glint,85,63,110,64,3,6);wind(113,64,145,37);
    glassSide([[82,40],[83,55],[86,59],[92,59],[92,40]]);
    glassSide([[96,40],[96,60],[108,60],[117,57],[135,40]]);
    side(glassLight,[[99,57],[110,57],[99,44],[96,44]]);
    seam(colors.deep,1.5,[76,0,34],[76,0,12]);seam(colors.deep,1,[93,0,38],[91,0,17],[125,0,17],[133,0,37]);
    side(metal,[[97,37],[104,37],[104,35],[97,35]]);
    side('#aab5a9',[[59,10],[131,10],[130,7],[59,7]]);
  }
  // Shared front fascia and side trim follow each vehicle's nose height.
  across(metal,L+.2,belt-11,L-.4,15,2,W-2);
  across(headlight,L+.5,belt-9,L+.3,belt-13,2,13);
  across(headlight,L+.5,belt-9,L+.3,belt-13,W-13,W-2);
  across('#637478',L+.6,belt-13,L+.6,belt-14,15,W-15);
  across(metal,L,13,L,9,-1,W+1);
  across('#d7d4ba',L+.5,14,L+.5,11,W*.40,W*.61);
  side('#873c40',[[1,belt-7],[6,belt-6],[6,belt-13],[1,belt-14]]);
  side('#f18f67',[[1,belt-8],[4,belt-7],[4,belt-10],[1,belt-11]]);
  seam(colors.glint,1,[8,0,belt-2],[L*.70,0,belt-1]);
  const printStart=model==='pickup'?12:model==='coupe'?68:47;
  const pos=at(printStart,0,belt-3);
  c.save();c.translate(...pos);c.transform(1,.071,0,1,0,0);
  stamp(c,look.decal,0,0,model==='pickup'?47:39,model==='coupe'?8:12,colors.print);c.restore();
  for(const axle of shape.wheelbase){
    const [x,y]=at(axle,-1,yWheel),r=shape.radius;
    oval(c,colors.deep,x,y,r+2,r*1.12+2);customWheel(c,x,y,r,look.rims);
    c.beginPath();c.ellipse(x,y,r+2,r*1.12+2,0,Math.PI+.28,2*Math.PI-.25);c.strokeStyle=colors.lit;c.lineWidth=1.5;c.stroke();
  }
}
function roadBody(c,model,look,colors){
  const shape=vehicleShapes[model],L=shape.length*.235,W=shape.width*.35;
  const back=-L/2,front=L/2,half=W/2;
  const face=(color,...vertices)=>polygon(c,color,vertices);
  const shell=(...vertices)=>{face(colors.base,...vertices);c.strokeStyle=colors.deep;c.lineWidth=1.3;c.stroke()};
  const windshield=(x1,x2)=>{
    face(glass,[x1,-half+1],[x2,-half+3],[x2,half-3],[x1,half-1]);
    face(glassLight,[x1+.5,-half+2],[x2-1,-half+3],[x1+1,2]);
  };
  oval(c,'#11191f66',2,2,L*.53,half+2);
  for(const axle of shape.wheelbase)for(const sign of [-1,1]){
    const x=back+axle*.235;
    box(c,tire,x-3.3,sign*half-2,7,4.5);
    const rim=look.rims==='dark'?'#38454c':look.rims==='sport'?'#f0ead4':'#9aa7a0';
    box(c,rim,x-2,sign*(half+1.3)-.7,4.3,1.4);
    if(look.rims==='sport')box(c,'#8b7954',x-.4,sign*(half+1.3)-.8,1,1.6);
  }
  if(model==='van'){
    shell([back,-half+1],[back+2,-half],[front-7,-half],[front-1,-half+3],[front,half-3],[front-5,half],[back+2,half],[back,half-1]);
    box(c,colors.lit,back+2,-half+1,L*.51,2);
    box(c,colors.low,back+2,half-3,L*.54,2);windshield(4,12);
    if(look.decal==='none')box(c,colors.print,back+5,-1.5,13,3);
  }else if(model==='hatch'){
    shell([back,-half+4],[back+4,-half],[front-8,-half],[front-2,-half+2],[front,-half+5],[front,half-5],[front-3,half-2],[front-8,half],[back+4,half],[back,half-4]);
    face(glass,[back+2,-half+4],[back+6,-half+2],[back+6,half-2],[back+2,half-4]);
    box(c,colors.lit,back+7,-half+2,10,2);windshield(1,7);
  }else if(model==='coupe'){
    shell([back,-half+2],[back+4,-half],[back+11,-half],[back+16,-half+2],[front-13,-half+2],[front-9,-half],[front-4,-half+2],[front,-half+6],[front,half-6],[front-4,half-2],[front-9,half],[front-13,half-2],[back+16,half-2],[back+11,half],[back+3,half],[back,half-2]);
    face(glass,[back+4,-half+3],[back+12,-half+2],[back+12,half-2],[back+4,half-3]);windshield(-1,6);
    box(c,metal,back+1,-half,2,W);box(c,colors.lit,7,-half+3,9,1.2);
  }else{
    shell([back,-half+1],[0,-half+1],[2,-half],[front-3,-half],[front,-half+2],[front,half-2],[front-3,half],[2,half],[0,half-1],[back,half-1]);
    box(c,metal,back+1.6,-half+2,L*.39,W-4);
    for(let v=-half+4;v<half-2;v+=3)box(c,'#53666a',back+3,v,L*.31,1);
    box(c,colors.lit,back+2,-half+1,L*.36,1.2);windshield(5,11);
  }
  const width=model==='pickup'?11:model==='hatch'?10:15;
  const start=model==='pickup'?-3:model==='coupe'?7:back+5;
  stamp(c,look.decal,start,-3.6,width,7.2,colors.print);
  for(const s of [-1,1]){
    box(c,headlight,front-2,s*(half-4)-1.5,2,3);
    box(c,'#ff956c',back,s*(half-3)-1.4,1.8,2.8);
  }
}
function canvasOf(w,h){
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
  canvas.width=w;canvas.height=h;return canvas;
}
function paintVan(c,look,colors){
  createHero(c);
  if(look.color!==factoryColors.van){
    const pixels=c.getImageData(0,0,248,108),d=pixels.data;
    const newRGB=[1,3,5].map(i=>parseInt(look.color.slice(i,i+2),16));
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]===0)continue;
      const r=d[i],g=d[i+1],b=d[i+2];
      // Restrict the lacquer replacement to warm body paint; glass, rims and
      // the cream factory parcel markings retain their original materials.
      if(r-g<35||g-b<7||r-b<65||g>225)continue;
      const brightness=Math.max(0,Math.min(1,(r*.30+g*.59+b*.11)/255));
      const level=brightness/.53,highlight=Math.max(0,level-1);
      for(let j=0;j<3;j++)d[i+j]=level<=1?newRGB[j]*level:newRGB[j]+(255-newRGB[j])*highlight;
    }
    c.putImageData(pixels,0,0);
  }
  if(look.rims!=='standard')for(const [x,y,r] of [[45,79,12],[167,88,13]])customWheel(c,x,y,r,look.rims);
  if(look.decal!=='none'){
    c.save();c.transform(1,.065,0,1,0,-1);
    box(c,colors.base,17,47,70,20);stamp(c,look.decal,22,49,56,16,colors.print);c.restore();
  }
}
let lastModel,lastColor,lastRims,lastDecal,roadSprite,showSprite;
function selectSprite(model,look){
  const color=look?.color||factoryColors[model],rims=look?.rims||'standard',decal=look?.decal||'none';
  if(model===lastModel&&color===lastColor&&rims===lastRims&&decal===lastDecal)return;
  lastModel=model;lastColor=color;lastRims=rims;lastDecal=decal;roadSprite=null;showSprite=null;
}
export function drawVehicle(ctx,x,y,heading,model='van',look){
  selectSprite(model,look);
  if(!roadSprite){
    roadSprite=canvasOf(112,68);
    const c=roadSprite.getContext('2d');c.translate(56,34);c.scale(2,2);
    roadBody(c,model,{rims:lastRims,decal:lastDecal},paintColors(lastColor));
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(heading);ctx.drawImage(roadSprite,-28,-17,56,34);ctx.restore();
}
export function drawShowroom(ctx,width,height,model='van',look){
  selectSprite(model,look);
  if(!showSprite){
    showSprite=canvasOf(248,108);
    const c=showSprite.getContext('2d'),style={color:lastColor,rims:lastRims,decal:lastDecal},colors=paintColors(lastColor);
    if(model==='van')paintVan(c,style,colors);else showroomBody(c,model,style,colors);
  }
  const scale=Math.min(width/248,height/108);
  ctx.save();ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(showSprite,(width-248*scale)/2,(height-108*scale)/2,248*scale,108*scale);ctx.restore();
}
