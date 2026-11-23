// Reproducible post-impact positions; subsequent updates use the ordinary game drivers.
export function jamGrid(kind='head',count=3){
 const car=(id,x,y,d)=>{
  const dx=[1,0,-1,0][d],dy=[0,1,0,-1][d],p=[x-dx*110,y-dy*110];
  return {id,x,y,d,a:d*Math.PI/2,p,q:[p[0]+dx*450,p[1]+dy*450],i:1,j:1,toI:2,toJ:1,len:450,pos:110,max:65,speed:0,curve:false}
 };
 if(kind==='junction'){
  const junction=[840,470];
  return [0,1,2,3].slice(0,count).map((d,i)=>{
   const dx=[1,0,-1,0][d],dy=[0,1,0,-1][d];
   const c=car(i,junction[0]-dx*42-dy*18,junction[1]-dy*42+dx*18,d);
   c.i=2-dx;c.j=1-dy;c.len=112;c.q=[c.p[0]+dx*112,c.p[1]+dy*112];return c
  })
 }
 return [car(1,890,486,0),car(2,939,486,2),car(3,833,486,0)].slice(0,count)
}
