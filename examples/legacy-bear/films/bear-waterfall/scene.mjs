import {canvas,clamp,lerp,track,pulse,hash,shape,ellipse,line,gradient,radial,shotAt} from '../../src/core.mjs';
import {drawBear} from './bear.mjs';
export function createScene(film,assets){
 const bearLayer=canvas(1920,1080),bc=bearLayer.getContext('2d');
 function pose(t){
  const x=track(film.tracks.x,t),reach=track(film.tracks.reach,t),duck=track(film.tracks.duck,t);
  const speed=Math.abs(track(film.tracks.x,Math.min(10,t+.025))-track(film.tracks.x,Math.max(0,t-.025)))/.05;
  return {x,y:670+x*.042+clamp((x-1300)/120)*22,reach,duck,tilt:track(film.tracks.headTilt,t),wet:track(film.tracks.wet,t),walk:clamp(speed/155),phase:x/27.5};
 }
 function camera(t){
  if(t<3.1)return {x:960+t*8,y:544+2*t,z:1.035+t*.016};
  if(t<6.3)return {x:1136+(t-3.1)*9,y:552,z:1.76+(t-3.1)*.024};
  return {x:1150+(t-6.3)*5,y:572,z:1.27+(t-6.3)*.014};
 }
 function falls(c,t,front=false){
  const alpha=front?.60:.25;
  // Each ribbon is evaluated at absolute time. No particle integration or accumulated state.
  c.save();c.beginPath();c.rect(1355,0,212,754);c.clip();
  for(let i=0;i<108;i++){
   const h=hash(i,83),xx=1377+h*150,w=1+hash(i,92)*5;
   const yy=((hash(i,72)*1100+t*(190+hash(i,5)*290))%1100)-180;
   const len=45+hash(i,48)*180;
   c.globalAlpha=alpha*(.16+hash(i,41)*.5);
   shape(c,`M ${xx} ${yy} C ${xx-5} ${yy+len*.3} ${xx+7} ${yy+len*.7} ${xx+2} ${yy+len}`,null,i%3?'#d5f4e6':'#63aab5',w);
  }
  c.restore();
  // A continuously changing fringe of water beads and impact spray.
  for(let i=0;i<(front?125:70);i++){
   const age=(t*(.35+hash(i,17)*.42)+hash(i,91))%1;
   const origin=1370+hash(i,13)*175,vx=(hash(i,9)-.5)*420;
   const x=origin+vx*age,y=745-(70+hash(i,14)*155)*Math.sin(age*Math.PI)+age*25;
   c.globalAlpha=Math.sin(age*Math.PI)*(.1+hash(i,27)*.45);
   ellipse(c,x,y,.6+hash(i,71)*2.1,1.6+hash(i,87)*3,'#d9f4e5',-.2*vx/100);
  }c.globalAlpha=1;
 }
 function atmosphere(c,t,foreground=false){
  if(!foreground){
   for(let i=0;i<28;i++){
    const x=140+hash(i,16)*1120+Math.sin(t*.4+i)*10,y=90+hash(i,21)*590+Math.cos(t*.6+i)*7;
    c.globalAlpha=.12+hash(i,5)*.28;ellipse(c,x,y,1+hash(i,6)*1.8,1+hash(i,6)*1.8,'#f2d99b');
   }
  }else{
   for(let i=0;i<9;i++){
    const x=1220+i*40+Math.sin(t*.55+i)*32,y=731+Math.sin(t*.7+i*1.3)*20;
    c.fillStyle=radial(c,x,y,60+hash(i)*36,'rgba(187,227,216,.055)');c.fillRect(x-110,y-110,220,220);
   }
  }c.globalAlpha=1;
 }
 function pool(c,t){
  c.save();c.beginPath();c.moveTo(1350,749);c.lineTo(1905,767);c.lineTo(1890,910);c.lineTo(1400,864);c.closePath();c.clip();
  for(let i=0;i<90;i++){
   const x=1340+hash(i,98)*640+Math.sin(t*.8+i)*8,y=746+hash(i,4)*171;
   const len=9+hash(i,64)*46;c.globalAlpha=.08+(Math.sin(t*1.8+i)*.5+.5)*.19;
   line(c,[[x,y],[x+len*.4,y-1],[x+len,y]],i%3?'#c3e9d6':'#255f66',1+hash(i,82)*1.5);
  }c.restore();c.globalAlpha=1;
 }
 function splash(c,t,at,xx,strength=1){
  const age=t-at;if(age<0||age>.85)return;
  const y=670+xx*.042;
  for(let i=0;i<25;i++){
   const vx=(hash(i,44)-.5)*210*strength,vy=-(55+hash(i,39)*110)*strength;
   const x=xx+vx*age,yy=y+vy*age+190*age*age;
   c.globalAlpha=clamp(1-age/.85)*.75;ellipse(c,x,yy,1.2+hash(i,43)*1.9,2+hash(i,23)*3,'#e0f2d9',vx*.006);
  }c.globalAlpha=1;
 }
 function droplet(c,t,p){
  const a=t-4.02;if(a<0||a>.34)return;
  const q=a/.34,x=lerp(1260,p.x+105,q),y=lerp(390,p.y-276,q)+Math.sin(q*Math.PI)*-38;
  ellipse(c,x,y,3,7,'#dbf4e9',-.6);
  c.globalAlpha=.35;line(c,[[x+10,y-12],[x+3,y-3]],'#b9e2e0',2);c.globalAlpha=1;
 }
 function foregroundLeaves(c,t){
  // Extra foreground fronds sway independently of the painted background.
  for(const [xx,yy,s,flip] of [[54,1050,1.1,1],[1860,1070,1.15,-1],[152,1100,.75,1]]){
   c.save();c.translate(xx,yy);c.scale(s*flip,s);c.rotate(Math.sin(t*.65+xx)*.018);
   shape(c,'M 0 0 Q 48 -133 168 -197',null,'#173f36',3);
   for(let j=0;j<12;j++){
    const u=j/12,x=166*u,y=-197*u+32*Math.sin(u*Math.PI),sz=34*(1-u)+5;
    shape(c,`M ${x} ${y} q ${-sz} ${-sz*1.4} ${-sz*1.15} ${-sz*1.7} q ${sz*1.4} ${sz*.3} ${sz*1.15} ${sz*1.7}Z`,'#123b33');
    shape(c,`M ${x} ${y} q ${sz} ${-sz*.2} ${sz*1.65} ${-sz*.8} q ${-sz*.15} ${sz*.9} ${-sz*1.65} ${sz*.8}Z`,'#16483c');
   }c.restore();
  }
 }
 function render(c,time,{guides=false}={}){
  const t=clamp(time,0,film.duration),p=pose(t),cam=camera(t);
  c.save();c.scale(c.canvas.width/film.width,c.canvas.height/film.height);c.fillStyle='#0d211f';c.fillRect(0,0,1920,1080);
  c.save();c.translate(960,540);c.scale(cam.z,cam.z);c.translate(-cam.x,-cam.y);
  c.drawImage(assets.background,0,0,1920,1080);pool(c,t);falls(c,t,false);atmosphere(c,t,false);
  c.save();c.globalAlpha=.29*(1-clamp((p.x-1365)/120));ellipse(c,p.x+2,p.y+1,84,10,'#142721');c.globalAlpha=.12*(1-clamp((p.x-1365)/120));ellipse(c,p.x+2,p.y+1,110,16,'#293b27');c.restore();
  bc.clearRect(0,0,1920,1080);drawBear(bc,p,t);
  // Water occupies a world-space occlusion region, so limbs enter separately.
  bc.save();bc.globalCompositeOperation='destination-out';
  const mask=gradient(bc,1358,0,1515,0,[[0,'rgba(0,0,0,0)'],[.28,'rgba(0,0,0,.28)'],[.65,'rgba(0,0,0,.92)'],[1,'rgba(0,0,0,1)']]);
  bc.fillStyle=mask;bc.fillRect(1358,0,562,1080);bc.restore();c.drawImage(bearLayer,0,0);
  falls(c,t,true);droplet(c,t,p);
  for(const [at,xx,s] of [[7.57,1307,.75],[7.94,1355,1],[8.32,1411,1.25],[8.73,1460,1.2],[9.09,1510,.8]])splash(c,t,at,xx,s);
  atmosphere(c,t,true);foregroundLeaves(c,t);
  if(guides){c.strokeStyle='#ffe1a0';c.lineWidth=1/cam.z;c.strokeRect(p.x-115,p.y-363,270,363);c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(`${shotAt(film.shots,t).id} · x ${p.x.toFixed(0)}`,p.x-110,p.y-375);}
  c.restore();
  // Subtle optical vignette; never hides the acting.
  const vignette=c.createRadialGradient(960,500,400,960,540,1140);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(2,18,15,.30)');c.fillStyle=vignette;c.fillRect(0,0,1920,1080);
  const titleAlpha=pulse(t,.12,.7,2.8)*.88;
  if(titleAlpha){c.save();c.globalAlpha=titleAlpha;c.fillStyle='#f4e6c5';c.font='19px Georgia,serif';c.letterSpacing='5px';c.fillText('T H E   O T H E R   S I D E',106,128);c.restore();}
  c.restore();
 }
 return {render,pose,camera};
}
