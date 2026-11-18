export function createCanvasPrism(){
 const host=document.getElementById('prism');
 if(host.querySelector('canvas')&&!host.classList.contains('fallback'))return;
 host.querySelector('canvas')?.remove();
 const canvas=document.createElement('canvas');
 const ctx=canvas.getContext('2d');
 if(!ctx){host.classList.add('fallback');return;}
 host.prepend(canvas);
 host.classList.remove('fallback');
 const faces=[[0,2,3],[0,3,4],[0,4,5],[0,5,2],[1,3,2],[1,4,3],[1,5,4],[1,2,5]];
 const vertices=[[0,1.25,0],[0,-1.25,0],[.89,0,0],[0,0,.89],[-.89,0,0],[0,0,-.89]];
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 function draw(){
  const w=host.clientWidth,h=host.clientHeight;
  if(!w||!h)return;
  const ratio=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
  }
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const p=Math.max(0,Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
  const split=0;
  const unfold=smooth((p-.015)/.325);
  const glass=smooth((1-document.getElementById('case-replay').getBoundingClientRect().top/innerHeight-.12)/.63);
  const thickness=.045+.955*unfold;
  const yaw=unfold*2.05+glass*.51,tilt=-.015+unfold*.38-glass*.12;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(tilt),sx=Math.sin(tilt),scale=Math.min(w/4.65,h/3.9);
  function project([x,y,z]){
   z*=thickness;
   const xx=x*cy+z*sy,zz=z*cy-x*sy;
   const depth=y*sx+zz*cx,f=4.8/(4.8-depth);
   return [w/2+xx*scale*f,h/2-(y*cx-zz*sx)*scale*f,depth];
  }
  const ring=(rx,ry,angle,hue,alpha)=>{
   ctx.save();ctx.translate(w/2,h/2);ctx.rotate(angle);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
   ctx.strokeStyle='hsla('+hue+',85%,72%,'+alpha+')';ctx.lineWidth=1.6;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=8;ctx.stroke();ctx.restore();
  };
  ring(scale*(1.48+split*.35),scale*.56,-.35+p*.95,151,.73);
  if(glass>.01){
   ring(scale*1.72,scale*.48,.82-p*1.5,185,glass*.69);
   ring(scale*1.88,scale*.65,-.8+p*.39,262,glass*.54);
  }
  const panels=faces.map((face,i)=>{
   const points=face.map(k=>vertices[k]);
   const center=points[0].map((_,k)=>points.reduce((n,v)=>n+v[k],0)/3);
   const projected=points.map(v=>project(v.map((value,k)=>value+center[k]*split*(.75+i%3*.14))));
   return {i,projected,depth:projected.reduce((n,v)=>n+v[2],0)};
  }).sort((a,b)=>a.depth-b.depth);
  for(const {i,projected:q} of panels){
   const hue=[151,177,191,249,271,162,206,231][i];
   const gradient=ctx.createLinearGradient(q[0][0],q[0][1],(q[1][0]+q[2][0])/2,(q[1][1]+q[2][1])/2);
   gradient.addColorStop(0,'hsla('+hue+',76%,'+(11+unfold*10+glass*38+i%3*3)+'%,'+(1-glass*.31)+')');
   gradient.addColorStop(1,'hsla('+hue+',59%,'+(5+unfold*8+glass*21)+'%,'+(1-glass*.45)+')');
   ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);ctx.lineTo(q[1][0],q[1][1]);ctx.lineTo(q[2][0],q[2][1]);ctx.closePath();
   ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle='hsla('+hue+',90%,76%,'+(.52+glass*.38)+')';ctx.lineWidth=1.15;ctx.stroke();
  }
  const rays=document.getElementById('refracted');
  rays.style.opacity=String(glass*.82);
  rays.style.transform='rotate('+(-29+p*42)+'deg)';
  canvas.dataset.scrollProgress=p.toFixed(3);
 }
 let frame=0;
 function queue(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;draw()})}
 addEventListener('scroll',queue,{passive:true});
 addEventListener('resize',queue);
 draw();
 return ()=>{removeEventListener('scroll',queue);removeEventListener('resize',queue);cancelAnimationFrame(frame);canvas.remove()};
}
