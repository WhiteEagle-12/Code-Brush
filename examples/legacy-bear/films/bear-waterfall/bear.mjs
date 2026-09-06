import {canvas,path,shape,ellipse,line,gradient,local,random,clamp,lerp,ik2,pulse} from '../../src/core.mjs';

// The rig is editable vector geometry. Painted fur is seeded and cached per part.
const cache=new Map();
function painted(id,d,bounds,colors,count=950,flow=.5){
 if(cache.has(id))return cache.get(id);
 const [x,y,w,h]=bounds,can=canvas(w+12,h+12),c=can.getContext('2d');c.translate(6-x,6-y);
 const p=path(d);shape(c,p,gradient(c,x,y,x+w*.8,y+h,[[0,colors[0]],[.45,colors[1]],[1,colors[2]]]),colors[3]??'#392d29',2.5);
 c.save();c.clip(p);const r=random([...id].reduce((a,b)=>a+b.charCodeAt(0),38));
 for(let i=0;i<count;i++){
  const xx=x+r()*w,yy=y+r()*h,len=2+r()*8,theta=1.1+flow*(xx-x-w*.5)/w+(r()-.5)*.5;
  c.globalAlpha=.07+r()*.15;line(c,[[xx,yy],[xx+Math.cos(theta)*len,yy+Math.sin(theta)*len]],r()>.48?'#f4c17b':'#402d26',.5+r()*.95);
 }
 c.globalAlpha=.7;c.strokeStyle=colors[0];c.lineWidth=2;c.stroke(p);c.restore();c.globalAlpha=1;
 const part={can,x:x-6,y:y-6};cache.set(id,part);return part;
}
function part(c,id,d,bounds,colors,count,flow){const p=painted(id,d,bounds,colors,count,flow);c.drawImage(p.can,p.x,p.y);}
const warm=['#cb9658','#926039','#513b2c','#463229'];
const dark=['#9d7048','#69442e','#352d26','#352b24'];
function segment(c,a,b,width,far=false){
 const len=Math.hypot(b.x-a.x,b.y-a.y),ang=Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2;
 local(c,a.x,a.y,ang,()=>{
  c.save();c.scale(width/28,len/95);
  part(c,far?'limb-far':'limb',`M -22 -9 C -33 10 -28 44 -23 77 Q -28 101 -6 104 Q 26 107 24 83 C 29 47 31 11 17 -7 Q 0 -21 -22 -9Z`,[-32,-24,66,134],far?dark:warm,520,.6);c.restore();
 });
}
function limb(c,root,target,upper,lower,width,far,bend=1){
 const elbow=ik2(root,target,upper,lower,bend);segment(c,root,elbow,width,far);segment(c,elbow,target,width*.84,far);
}
function foot(c,x,y,angle,far){local(c,x,y,angle,()=>{
 part(c,far?'foot-far':'foot','M -23 -20 Q -18 -37 0 -31 Q 18 -27 21 -17 Q 43 -14 44 -3 Q 42 5 23 5 L -17 4 Q -29 1 -23 -20Z',[-30,-36,79,45],far?dark:warm,240);
 for(let i=0;i<3;i++)shape(c,`M ${23+i*7} -5 q 6 -5 5 4 q -3 3 -5 -4`,'#b5aa85');
});}
function paw(c,x,y,rot,far){local(c,x,y,rot,()=>{
 part(c,far?'paw-far':'paw','M -20 -15 C -30 -4 -25 16 -10 23 Q 0 33 10 24 Q 30 26 30 5 Q 28 -12 16 -18 Q 0 -26 -20 -15Z',[-31,-27,68,60],far?dark:warm,240);
 line(c,[[0,13],[4,24]],'#53392d',1.7);line(c,[[13,10],[16,23]],'#53392d',1.7);
});}
export function drawBear(c,pose,t){
 const {x,y,phase,walk,reach,tilt,duck,wet}=pose;
 const cycle=Math.sin(phase);
 // Distance-driven stance: x + footOffset remains fixed while a foot is planted.
 const gait=(offset)=>{const u=((x/(104/.62)+offset)%1+1)%1;return u<.62?{dx:lerp(52,-52,u/.62),lift:0,angle:0}:{dx:lerp(-52,52,(u-.62)/.38),lift:Math.sin((u-.62)/.38*Math.PI)*29,angle:Math.sin((u-.62)/.38*Math.PI)*-.16};};
 const a=gait(0),b=gait(.5),liftA=a.lift*walk,liftB=b.lift*walk;
 const bob=Math.cos(phase*2)*3.8*walk,breath=Math.sin(t*2.6)*1.6;
 const flinch=pulse(t,4.22,4.34,4.75),resolve=pulse(t,5.0,5.45,5.92);
 c.save();c.translate(x,y);c.scale(1-.05*duck,1-.10*duck);
 // Grounded feet; body and head overlap separate articulated limbs.
 limb(c,{x:-29,y:-96+bob},{x:-28+b.dx*walk,y:-23-liftB},49,54,29,true,-1);
 foot(c,-28+b.dx*walk,-5-liftB,b.angle*walk,true);
 limb(c,{x:35,y:-96+bob},{x:28+a.dx*walk,y:-23-liftA},49,54,32,false,-1);
 foot(c,28+a.dx*walk,-5-liftA,a.angle*walk,false);
 c.save();c.translate(0,bob+breath+duck*10);
 const farHand={x:-80-cycle*22*walk,y:-95+Math.cos(phase)*8*walk};
 limb(c,{x:-57,y:-207},farHand,66,64,27,true,1);paw(c,farHand.x,farHand.y,.1,true);
 // Pear-shaped torso with a small tail and overlapping shoulder mass.
 part(c,'tail','M -80 -133 C -126 -154 -128 -104 -98 -108 Q -83 -110 -80 -133Z',[-130,-156,54,54],dark,230);
 part(c,'body',`M -43 -240 Q -76 -230 -79 -191 C -82 -170 -100 -140 -93 -105 Q -89 -77 -61 -69 Q -40 -62 -8 -66 C 36 -55 74 -74 77 -104 Q 91 -155 69 -202 Q 61 -229 37 -241 Q 5 -259 -43 -240Z`,[-101,-259,192,204],warm,2400,1.8);
 c.save();c.globalAlpha=.25;shape(c,'M -15 -216 C 33 -212 62 -166 58 -112 Q 51 -80 16 -78 Q -7 -80 -24 -97 C -45 -134 -40 -197 -15 -216Z',gradient(c,-35,-195,50,-90,[[0,'#ebc58b'],[1,'#b8884e']]));c.restore();
 // Hand reaches for spray, recoils, then shields the face as the bear ducks.
 const hand={x:lerp(78+cycle*28*walk,174,reach)-flinch*31-duck*4,y:lerp(-100-Math.cos(phase)*8*walk,-219,reach)-duck*97-flinch*38};
 limb(c,{x:54,y:-210},hand,72,68,30,false,-1);paw(c,hand.x,hand.y,-reach*.8-duck*.75,false);
 // Overlapping head gives a flexible neck, not a hinge-shaped gap.
 local(c,18+duck*22-flinch*12,-262-resolve*5+duck*15,tilt+flinch*.17,()=>{
  const earFlop=duck*.18+flinch*.15;
  local(c,-55,-63,-earFlop,()=>{part(c,'ear-left','M -25 13 C -46 -14 -19 -42 3 -29 Q 27 -17 17 12Z',[-39,-38,66,58],warm,380);ellipse(c,-7,-9,15,19,'#694633',-.3);ellipse(c,-9,-10,9,13,'#b07b58',-.3);});
  local(c,45,-74,earFlop,()=>{part(c,'ear-right','M -20 13 C -34 -11 -10 -34 11 -23 Q 33 -9 19 17Z',[-30,-32,62,58],dark,330);ellipse(c,2,-6,12,16,'#a27551');});
  part(c,'head',`M -69 -36 Q -62 -66 -33 -72 Q -10 -82 14 -70 Q 51 -74 68 -42 L 73 -29 Q 94 -9 77 18 Q 79 53 45 65 Q 24 83 -11 68 L -19 74 -31 66 -43 68 -49 57 -61 56 -63 46 Q -84 35 -79 7 L -84 0 -77 -14 -79 -25Z`,[-89,-83,187,163],warm,2300,1.5);
  // Dark eye sockets and soft cream cheek create a readable three-quarter face.
  ellipse(c,35,-19,22,25,'#785333',-.16);ellipse(c,-10,-19,16,21,'#855b37',-.12);
  const blink=Math.max(pulse(t,1.02,1.09,1.19),pulse(t,3.55,3.60,3.69),pulse(t,4.25,4.34,4.62),pulse(t,5.13,5.19,5.3),duck*.90);
  const surprise=flinch*.55,eyesOpen=Math.max(.07,1-blink);
  for(const [ex,ey,rx] of [[-9,-18,9],[37,-18,12]]){
   ellipse(c,ex,ey,rx,(13+surprise*8)*eyesOpen,'#f3e9cb',-.1);
   if(eyesOpen>.18){ellipse(c,ex+3+reach*2,ey-1-reach*3,rx*.62,10*eyesOpen,'#4e4b2a');ellipse(c,ex+4+reach*2,ey-1-reach*3,rx*.38,9*eyesOpen,'#131f19');ellipse(c,ex+5+reach*2,ey-4-reach*3,2.4,3*eyesOpen,'#fffbee');}
   else shape(c,`M ${ex-rx} ${ey} Q ${ex} ${ey+5} ${ex+rx} ${ey-1}`,null,'#342c24',3);
  }
  // Brows rotate from curiosity through shock to resolve.
  const brow=reach*6+flinch*11-resolve*4;
  shape(c,`M -24 ${-39-brow*.45} Q -10 ${-45-brow} 1 ${-36-brow*.2}`,null,'#4c3427',5);
  shape(c,`M 22 ${-39-brow*.2} Q 37 ${-48-brow} 52 ${-37-brow*.7}`,null,'#4c3427',6);
  part(c,'muzzle','M 25 8 Q 43 -1 64 8 Q 85 4 97 19 Q 105 41 77 49 Q 53 60 28 46 Q 14 34 25 8Z',[12,-2,96,63],['#dec18d','#c7a16a','#916a40','#705032'],650,.5);
  // Nose, nostrils and highlight.
  shape(c,'M 76 10 Q 91 2 103 15 Q 109 25 96 30 Q 83 33 76 24 Q 70 16 76 10Z',gradient(c,80,9,99,30,[[0,'#465449'],[1,'#1b2721']]),'#26332a',1.6);
  ellipse(c,88,13,7,2.4,'#87937a',.13);ellipse(c,100,22,3,2,'#111c18');
  shape(c,'M 89 31 Q 84 41 70 40',null,'#5b412d',2.4);
  if(flinch>.12)ellipse(c,58,47,6,5+flinch*5,'#4d3028',.1);
  else shape(c,`M 45 40 Q 54 ${49+resolve*4} 73 40`,null,'#63442c',2.2);
  for(let j=0;j<5;j++)ellipse(c,37+j*7,24+(j%2)*7,.9,.9,'#8e6b44');
  // Fur accents along cheek, brow and neck: individual drawn locks.
  for(let j=0;j<12;j++){const xx=-62+j*7,yy=44+Math.sin(j*.48)*12;line(c,[[xx,yy],[xx+2,yy+7]],'#b78950',1.5);}
  if(wet>.1){c.globalAlpha=wet*.8;for(let j=0;j<12;j++){const xx=-55+j*12,yy=-40+(j%3)*30;line(c,[[xx,yy],[xx+1,yy+9]],'#b1d3bd',1.3);}c.globalAlpha=1;}
 });
 c.restore();
 if(wet>0){c.globalAlpha=wet*.12;shape(c,'M -80 -227 Q 55 -269 81 -132 L 63 -65 -77 -69Z','#143e38');c.globalAlpha=1;}
 c.restore();
}
