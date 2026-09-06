import{path,line,ellipse,grad,local,fur,mix,smooth,pulse,clamp,rng}from'./paint.mjs';
const gold=['#d99956','#b96b3d','#753e32','#56332c'],shade=['#a46540','#814830','#4e3030','#482d2b'];
function paw(c,x,y,angle,far){local(c,x,y,1,angle,()=>{
 fur(c,far?'paw-far':'paw','M -22 -27 Q -26 -46 -6 -45 Q 12 -44 17 -27 C 20 -18 40 -17 43 -7 Q 46 1 31 3 L -15 3 Q -28 0 -22 -27Z',[-29,-48,78,56],far?shade:gold,74);
 for(let i=0;i<3;i++){line(c,`M ${16+i*8} -12 Q ${18+i*8} -5 ${16+i*8} 0`,far?'#51312b':'#864731',1.25);path(c,`M ${23+i*7} -5 Q ${30+i*7} -8 ${28+i*7} 1 L ${24+i*7} 1Z`,far?'#8a8270':'#d0b586')}
})}
function joint(a,b,L1,L2,bend){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.01,Math.min(Math.hypot(dx,dy),L1+L2-.001)),base=Math.atan2(dy,dx),theta=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1));return[a[0]+Math.cos(base+bend*theta)*L1,a[1]+Math.sin(base+bend*theta)*L1]}
function leg(c,root,foot,far,hind){const knee=joint(root,foot,hind?78:99,hind?80:88,hind?-1:1),[ax,ay]=root,[bx,by]=knee,[fx,fy]=foot;
 const w=hind?36:29;
 const d=`M ${ax-w} ${ay-12} Q ${ax+w*.8} ${ay-25} ${ax+w} ${ay+9} Q ${bx+25} ${by-13} ${bx+22} ${by+10} Q ${bx+17} ${by+31} ${fx+15} ${fy+6} Q ${fx} ${fy+17} ${fx-20} ${fy+4} Q ${fx-18} ${fy-27} ${bx-20} ${by+5} Q ${ax-w-6} ${ay+46} ${ax-w} ${ay-12}Z`;
 path(c,d,grad(c,ax-30,ay,fx+20,fy,[[0,far?'#915030':'#bf793f'],[.65,far?'#6c3b2d':'#a45b35'],[1,far?'#4e3030':'#754330']]),far?'#4e302a':'#633a2c',1.5);
 if(!far){line(c,`M ${ax-13} ${ay+12} Q ${bx-9} ${by-6} ${fx-10} ${fy-9}`,'#d4944f',3);line(c,`M ${bx+12} ${by+2} Q ${bx+7} ${by+14} ${bx+5} ${by+20}`,'#79402f',1.5)}
}
function ear(c,x,y,angle,far){local(c,x,y,1,angle,()=>{fur(c,far?'ear-far':'ear','M -22 13 C -43 -9 -30 -42 -8 -42 Q 21 -47 27 -19 Q 30 3 14 18Z',[-40,-48,76,74],far?shade:gold,88);path(c,'M -15 6 C -27 -5 -20 -29 -6 -29 Q 11 -31 15 -13 Q 17 0 9 9Z',far?'#573733':'#754638');path(c,'M -11 3 Q -20 -10 -8 -21 Q 4 -25 10 -12 Q 5 -13 1 -4Z',far?'#86523c':'#b5714c')})}
export function head(c,t,{tilt=0,duck=0,wet=0,close=false}={}){
 const surprise=pulse(3.79,3.89,4.08,4.3,t),resolve=smooth(4.45,5.12,t),blink=Math.max(pulse(1.44,1.50,1.57,1.66,t),pulse(3.89,3.96,4.10,4.25,t),pulse(4.64,4.69,4.72,4.81,t),duck*.85),look=close?1:0;
 local(c,153+duck*12-surprise*11,-209+duck*27-surprise*4,1,tilt+surprise*.15+duck*.18,()=>{
  ear(c,19,-61,-.1-surprise*.18,true);
  fur(c,'head','M -72 -33 Q -63 -69 -32 -76 Q -6 -80 16 -63 Q 41 -63 55 -42 Q 64 -24 59 -5 Q 78 5 68 26 Q 62 55 35 62 L 24 70 11 65 -2 71 -12 61 -23 65 -30 57 -42 60 -46 51 -58 50 -62 37 -74 34 -73 21 -82 17 -76 4 -81 -4 -73 -14Z',[-88,-83,170,162],gold,83);
  // Sculpted warm forehead and cheek planes.
  path(c,'M -58 -31 Q -43 -68 -17 -63 Q 16 -55 23 -31 Q -1 -44 -25 -25 L -34 4 -62 15Z',grad(c,-40,-70,-2,25,[[0,'#e0a05cbb'],[1,'#d1844500']]));
  path(c,'M -60 12 Q -44 21 -40 42 L -24 38 -31 56 -10 52 0 64 Q -44 72 -63 42Z','#97512f');
  ear(c,-54,-47,.14+surprise*.28+duck*.24,false);
  // Far eye, partially occluded by the bridge of the muzzle.
  const open=Math.max(.055,1-blink),brow=surprise*9-resolve*2;
  ellipse(c,43,-16,12,15,'#97522f',-.18);
  ellipse(c,45,-16,8,(10+surprise*5)*open,'#ead7a4',-.15);
  if(open>.18){ellipse(c,48-look*2,-16,4.4,8*open,'#62472f');ellipse(c,49-look*2,-16,2.5,7*open,'#202b28');ellipse(c,50-look*2,-19,1.5,2,'#fff3c7')}
  // Broad cheek rather than a circular eye patch.
  path(c,'M -3 -38 Q 14 -48 34 -29 Q 44 -13 32 7 Q 15 21 -5 5 Q -17 -11 -3 -38Z',grad(c,-4,-37,24,20,[[0,'#985230'],[1,'#ba7440']]));
  path(c,`M -1 -13 Q 10 ${-29-surprise*7} 27 -15 Q 30 ${-3+surprise*4} 10 ${-1+surprise*3} Q 3 -3 -1 -13Z`,'#6c3c2d');
  if(open>.13){c.save();c.translate(13,-13);c.scale(1,open);path(c,'M -12 0 Q -4 -15 12 -3 Q 17 5 3 10 Q -6 10 -12 0Z','#f3e3b9');ellipse(c,6-look*4,-1,6.8,9,'#987738');ellipse(c,7-look*4,-1,3.9,8,'#263029');ellipse(c,8-look*4,-4,2.1,2.3,'#fff9dc');c.restore();line(c,`M 0 ${-13-2*open} Q 12 ${-13-17*open} 26 ${-13-2*open}`,'#633b2b',2.1)}else line(c,'M -1 -12 Q 13 -3 28 -14','#633b2b',2.6);
  line(c,`M -6 ${-35-brow} Q 7 ${-43-brow*1.2} 25 ${-31-brow*.3}`,'#71412d',5);line(c,`M 37 ${-35-brow*.7} Q 47 ${-39-brow} 55 ${-28-brow*.5}`,'#75422d',3.5);
  // Bridge, soft muzzle, nose and expressive lower lip.
  fur(c,'muzzle','M 26 3 Q 34 -10 49 -4 Q 66 5 85 9 Q 106 9 113 23 Q 123 41 100 48 Q 89 59 64 54 Q 46 62 26 43 Q 11 29 26 3Z',[12,-13,115,80],['#e1b777','#cb975a','#a96c3c','#875133'],82);
  path(c,'M 34 5 Q 50 0 68 13 Q 85 16 99 15 Q 106 17 107 22 Q 77 21 56 18 Q 42 14 34 5Z','#ecc99366');
  path(c,'M 97 10 Q 113 6 122 18 Q 129 28 116 36 Q 108 40 102 31 Q 95 27 93 20Z',grad(c,97,8,119,36,[[0,'#4b5145'],[.45,'#293b34'],[1,'#192c2a']]),'#314037',1.8);
  ellipse(c,106,14,7,2.3,'#8b9980',.2);ellipse(c,120,24,2.5,3.3,'#101f20',.4);
  if(surprise>.12){path(c,`M 49 49 Q 64 ${57+surprise*13} 91 48 Q 73 ${75+surprise*8} 49 49Z`,'#57352e');path(c,'M 60 58 Q 72 54 80 58 Q 70 63 60 58Z','#bb7560')}
  else{line(c,`M 44 44 Q 59 ${55+resolve*3} 89 45 Q 101 43 104 36`,'#70452f',2);line(c,'M 40 40 Q 39 45 43 48','#965d35',1.3)}
  for(let j=0;j<6;j++)ellipse(c,52+j*7,26+(j%2)*7,.85,.85,'#aa7746');
  // Individual cheek locks and eyelid folds.
  for(const d of['M -37 16 q 4 10 10 13','M -36 31 l 10 8','M -20 40 l 9 8','M -10 19 q 2 7 7 8','M -22 -29 l 6 -4'])line(c,d,'#d48c48',1.35);
  if(wet){c.globalAlpha=wet;for(let i=0;i<8;i++){const x=-22+i*15,y=-30+(i%3)*20;path(c,`M ${x} ${y} q -3 8 0 10 q 4 -2 0 -10Z`,'#bfd7c488')}c.globalAlpha=1}
 })
}
export function bear(c,t,pose){const{x,y,distance,walking=1,duck=0,wet=0,tilt=0,close=false}=pose;
 const cycle=distance/142,bob=Math.cos(cycle*Math.PI*4)*2.5*walking,breath=Math.sin(t*2)*.8;
 const gait=(offset,base)=>{const u=((cycle+offset)%1+1)%1,stance=.66;return u<stance?{x:base+47-142*u,y:0,rot:0}:{x:base-47+94*smooth(0,1,(u-stance)/(1-stance)),y:-Math.sin((u-stance)/(1-stance)*Math.PI)*31,rot:Math.sin((u-stance)/(1-stance)*Math.PI)*-.17}};
 const a=gait(0,92),b=gait(.5,87),d=gait(.16,-126),e=gait(.66,-123);for(const g of[a,b,d,e]){g.y*=walking;g.rot*=walking;}
 local(c,x,y,1,0,()=>{
  // Soft contact shadow with four planted-foot accents.
  ellipse(c,0,6,197,13,'#1c333b28');
  for(const g of[a,b,d,e])if(g.y>-4)ellipse(c,g.x,4,27,5,'#192d3638');
  // Far limbs are offset in depth and exposed beneath the torso.
  leg(c,[-123,-136+bob],[e.x,-23+e.y],true,true);paw(c,e.x,e.y,e.rot,true);
  leg(c,[85,-177+bob],[b.x,-25+b.y],true,false);paw(c,b.x,b.y,b.rot,true);
  // Small tail behind the rounded pelvis.
  fur(c,'tail','M -164 -174 C -204 -205 -215 -162 -191 -151 Q -179 -148 -164 -174Z',[-216,-206,60,61],shade,90);
  c.save();c.translate(0,bob+breath+duck*4);
  fur(c,'torso','M -163 -176 C -158 -211 -127 -225 -87 -218 Q -54 -215 -28 -230 Q 14 -261 64 -247 Q 94 -247 118 -223 L 126 -210 138 -208 134 -193 143 -184 137 -173 144 -160 133 -153 137 -139 Q 119 -125 114 -94 Q 76 -72 28 -86 Q -21 -80 -62 -95 Q -87 -83 -122 -104 Q -166 -111 -174 -143 L -183 -148 -176 -159 -181 -166Z',[-191,-268,346,203],gold,91);
  path(c,'M -147 -187 Q -122 -220 -91 -211 Q -56 -202 -30 -219 Q 9 -247 55 -237 Q 22 -223 10 -197 Q -56 -180 -94 -190 Q -121 -199 -147 -187Z',grad(c,-60,-233,-60,-173,[[0,'#e1a65e99'],[1,'#e5a15600']]));
  // Belly, scapula and haunch contours track the animal's mass.
  path(c,'M -150 -131 Q -108 -115 -84 -135 Q -34 -102 16 -107 Q 60 -103 106 -131 L 105 -96 Q 63 -72 22 -88 Q -22 -83 -62 -100 Q -108 -80 -146 -121Z','#87482f55');
  line(c,'M 62 -224 Q 33 -198 45 -151 Q 53 -132 70 -124','#a15a33',2.5);
  line(c,'M 51 -217 Q 34 -195 43 -175','#e5a45b',2.6);
  line(c,'M -119 -193 Q -80 -174 -94 -127','#a25932',2);
  for(let i=0;i<8;i++)line(c,`M ${-12+i*12} ${-223+Math.sin(i)*5} l -5 9`,'#edb46977',1.3);
  c.restore();
  leg(c,[-127,-143+bob],[d.x,-24+d.y],false,true);paw(c,d.x,d.y,d.rot,false);
  // Near shoulder merges into the foreleg instead of showing a hinged cylinder.
  leg(c,[79,-184+bob],[a.x,-24+a.y],false,false);paw(c,a.x,a.y,a.rot,false);
  path(c,`M 51 ${-224+bob} Q 80 ${-240+bob} 105 ${-214+bob} Q 124 ${-183+bob} 105 ${-147+bob} L 84 ${-136+bob} Q 57 ${-142+bob} 52 ${-173+bob}Z`,grad(c,45,-230,108,-132,[[0,'#c88245'],[1,'#a55d34']]));
  line(c,`M 62 ${-215+bob} Q 51 ${-188+bob} 66 ${-168+bob}`,'#e1a159',2.1);
  // Neck ruff overlaps shoulder and cheek.
  fur(c,'ruff','M 87 -232 Q 108 -258 145 -246 Q 180 -232 167 -195 Q 169 -167 144 -137 L 132 -143 127 -132 119 -143 108 -140 104 -153 94 -153 96 -167 86 -173 91 -190 83 -202Z',[77,-264,100,139],gold,96);
  c.save();c.translate(0,bob+breath);head(c,t,{tilt,duck,wet,close});c.restore();
  if(wet>.01){c.globalAlpha=wet*.15;path(c,'M -164 -175 Q -90 -213 -20 -222 Q 57 -252 108 -220 L 128 -136 Q 85 -85 4 -98 L -125 -103Z','#2c4b4d');c.globalAlpha=1;const r=rng(99);for(let i=0;i<22;i++){const px=-137+r()*253,py=-208+r()*122;c.globalAlpha=wet*.65;line(c,`M ${px} ${py} l 2 ${5+r()*7}`,'#a1c9b9',1)}c.globalAlpha=1}
 })
}
