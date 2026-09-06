import {createCanvas,Path2D} from '@napi-rs/canvas';
export {createCanvas};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
export const pulse=(a,b,c,d,t)=>smooth(a,b,t)*(1-smooth(c,d,t));
export function rng(seed){let s=seed;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)}
export function path(c,d,fill,stroke,width=1){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(p)}return p}
export function line(c,d,color,w=1){return path(c,d,null,color,w)}
export function ellipse(c,x,y,rx,ry,fill,rotation=0){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rotation,0,Math.PI*2);c.fillStyle=fill;c.fill()}
export function grad(c,x,y,X,Y,stops){const g=c.createLinearGradient(x,y,X,Y);for(const[p,col]of stops)g.addColorStop(p,col);return g}
export function local(c,x,y,s,angle,fn){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);fn();c.restore()}
export function wash(c,d,colors,bounds,seed=1,count=1500){const[x,y,w,h]=bounds,p=path(c,d,grad(c,x,y,x+w*.5,y+h,colors));c.save();c.clip(p);const r=rng(seed);for(let i=0;i<count;i++){const xx=x+r()*w,yy=y+r()*h;c.globalAlpha=.018+r()*.048;c.strokeStyle=r()>.5?'#f9db9b':'#102b34';c.lineWidth=1+r()*4;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+8+r()*32,yy-4+r()*8);c.stroke()}c.restore();return p}
const parts=new Map();
export function fur(c,id,d,bounds,colors,seed=1){let a=parts.get(id);if(!a){const[x,y,w,h]=bounds,can=createCanvas(Math.ceil((w+12)*2),Math.ceil((h+12)*2)),q=can.getContext('2d');q.scale(2,2);q.translate(6-x,6-y);const p=path(q,d,grad(q,x,y,x+w*.45,y+h,[[0,colors[0]],[.42,colors[1]],[1,colors[2]]]),colors[3]??'#492b28',1.5);q.save();q.clip(p);const r=rng(seed);for(let i=0;i<w*h/20;i++){const xx=x+r()*w,yy=y+r()*h;q.globalAlpha=.035+r()*.095;line(q,`M ${xx} ${yy} q ${2+r()*2} ${2+r()*3} ${1+r()*5} ${5+r()*7}`,r()>.3?'#f4b977':'#532c2c',.3+r()*.7)}q.restore();a={can,x:x-6,y:y-6,w:w+12,h:h+12};parts.set(id,a)}c.drawImage(a.can,a.x,a.y,a.w,a.h)}
