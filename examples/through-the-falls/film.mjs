import{landscape,water,flecks}from'./environment.mjs';
import{bear}from'./bear.mjs';
import{path,line,ellipse,grad,clamp,mix,smooth,pulse,rng}from'./paint.mjs';
export function performance(t){
 let x,walking=1;
 if(t<3.25){x=260+135*t-25*smooth(2.65,3.25,t);walking=1-smooth(2.8,3.25,t)}
 else if(t<5.5){x=673.75;walking=0}
 else{x=673.75+131*(Math.min(t,8.6)-5.5)-22*smooth(5.5,5.95,t)+12*smooth(8.6,9.4,t);walking=smooth(5.5,5.9,t)*(1-smooth(8.5,9.1,t))}
 return{x,y:714,distance:x-260,walking,duck:smooth(7.65,8.3,t),wet:smooth(7.5,8.8,t),tilt:-.05*pulse(2.6,3.2,3.7,3.9,t)+.035*smooth(4.3,5.0,t),close:t>=3.25&&t<5.5};
}
function splash(c,x,y,t,start,power=1){const age=t-start;if(age<0||age>.65)return;const r=rng(Math.round(start*101));for(let j=0;j<17;j++){const v=(50+r()*110)*power,theta=-Math.PI*(.15+r()*.7),X=x+Math.cos(theta)*v*age,Y=y+Math.sin(theta)*v*age+190*age*age;c.globalAlpha=(1-age/.65)*.8;ellipse(c,X,Y,1+r()*1.8,1+r()*2.5,'#d2e8d2')}c.globalAlpha=1;line(c,`M ${x-age*43} ${y+2} Q ${x} ${y+7} ${x+age*43} ${y+2}`,'#cee4ce88',1.4)}
function render(c,n,env){const t=env.time,p=performance(t);
 c.save();
 // Cinematography is sampled at absolute time, with deliberate cuts.
 if(t<3.25){const zoom=1.035+smooth(0,3.25,t)*.025;c.translate(800,450);c.scale(zoom,zoom);c.translate(-800-10*smooth(0,3.25,t),-450)}
 else if(t<5.5){const z=2.35+.08*smooth(3.25,5.5,t);c.translate(760,445);c.scale(z,z);c.translate(817,0);c.translate(-1660,-495)}
 else if(t>=8.65){const z=2.6+.12*smooth(8.65,10,t);c.translate(800,450);c.scale(z,z);c.translate(-1198,-535)}
 else{const z=1.23-.06*smooth(5.5,10,t);c.translate(800,450);c.scale(z,z);c.translate(-960-50*smooth(5.5,10,t),-467)}
 landscape(c);water(c,t,false);
 // Rippling reflection is restricted to the pool, below the walking ledge.
 c.save();c.clip(path(c,'M 940 788 L 1560 788 1650 930 750 930Z'));c.globalAlpha=.12;c.translate(0,1510);c.scale(1,-1);bear(c,t,p);c.restore();
 bear(c,t,p);
 // Near spray touches the face in the close shot, motivating the recoil.
 if(t>=3.25&&t<5.5){const hit=pulse(3.65,3.83,4.12,4.3,t);for(let i=0;i<15;i++){const a=(t-3.65)*2.8-i*.035;if(a>0&&a<1){c.globalAlpha=Math.sin(a*Math.PI)*.65;ellipse(c,1060-a*210,460+i*3+a*a*45,1.5,2.6,'#e5eed9')}}c.globalAlpha=1;
  if(hit>.1){line(c,'M 902 529 q 4 8 0 13','#bedacc',1.5)}
 }
 // The curtain occludes the bear progressively as he crosses behind it.
 if(p.x>875){c.save();const fade=clamp((p.x-875)/270);c.globalAlpha=fade;path(c,'M 1145 -40 Q 1125 160 1156 330 Q 1168 480 1110 700 Q 1218 735 1388 709 Q 1280 450 1355 260 L 1345 -40Z',grad(c,1110,0,1340,650,[[0,'#c5e2d5bb'],[.45,'#b4d9d2bb'],[.7,'#e4efdbc9'],[1,'#a5d0c9bb']]));c.restore()}
 if(t>8.4){c.save();c.globalAlpha=smooth(8.4,9.45,t)*.82;path(c,'M 1138 -40 Q 1118 125 1155 260 Q 1171 373 1132 523 Q 1124 625 1082 699 Q 1194 740 1415 706 Q 1280 539 1344 382 Q 1338 218 1348 -40Z',grad(c,1100,0,1360,650,[[0,'#c5e1d4'],[.5,'#c5e1d4'],[1,'#cde5d4']]));c.restore()}
 water(c,t,true);
 for(const[start,x]of[[6.47,970],[7.02,1020],[7.55,1090],[8.09,1152],[8.66,1225],[9.2,1275]])splash(c,x,724,t,start,.85);
 landscape(c,true);flecks(c,t);c.restore();
 // Restrained photographic finishing; no title interrupts the ten-second action.
 c.save();const v=c.createRadialGradient(790,410,250,800,460,990);v.addColorStop(0,'#12232a00');v.addColorStop(1,'#102a3248');c.fillStyle=v;c.fillRect(0,0,1600,900);
 c.fillStyle='#10252d';c.fillRect(0,0,1600,57);c.fillRect(0,843,1600,57);
 const fade=1-smooth(0,.28,t)+smooth(9.58,10,t);if(fade>0){c.globalAlpha=clamp(fade);c.fillStyle='#10252d';c.fillRect(0,0,1600,900)}c.restore();
}
export default{film:render};
