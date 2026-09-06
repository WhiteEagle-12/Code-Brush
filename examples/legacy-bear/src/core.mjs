/** Pure time sampling. A frame never depends on which frame was drawn before it. */
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const ease={linear:t=>t,smooth:t=>t*t*(3-2*t),smoother:t=>t*t*t*(t*(t*6-15)+10),in:t=>t*t,out:t=>1-(1-t)**2};
export function track(keys,t){
 if(!keys.length) throw Error('An animation track needs keyframes');
 if(t<=keys[0][0]) return keys[0][1];
 for(let i=1;i<keys.length;i++){const [b,v,e='smooth']=keys[i], [a,u]=keys[i-1]; if(t<=b) return lerp(u,v,(ease[e]??ease.smooth)(clamp((t-a)/(b-a))));}
 return keys.at(-1)[1];
}
export const pulse=(t,a,b,c)=>t<a||t>c?0:t<b?ease.smooth((t-a)/(b-a)):1-ease.smooth((t-b)/(c-b));
export function random(seed=1){let s=seed>>>0; return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
export const hash=(i,seed=7)=>{let x=Math.imul(i+1,374761393)^seed;x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967296;};
export function ik2(root,target,a,b,bend=1){
 const dx=target.x-root.x,dy=target.y-root.y,d=clamp(Math.hypot(dx,dy),Math.abs(a-b)+.0001,a+b-.0001);
 const theta=Math.atan2(dy,dx),off=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1))*bend;
 return {x:root.x+Math.cos(theta+off)*a,y:root.y+Math.sin(theta+off)*a};
}
export function shotAt(shots,t){return shots.find(s=>t>=s.start&&t<s.end)??shots.at(-1);}
export function validateFilm(f){
 if(!(f.duration>0&&f.fps>0&&f.width>0&&f.height>0)) throw Error('Invalid film dimensions or timebase');
 if(f.width%2||f.height%2) throw Error('Video dimensions must be even');
 let end=0;for(const s of f.shots){if(s.start!==end||s.end<=s.start)throw Error('Shots must cover the film without gaps or overlap');end=s.end;}if(end!==f.duration)throw Error('Shot duration mismatch');
 for(const [name,keys] of Object.entries(f.tracks??{})){for(let i=0;i<keys.length;i++){if(!Number.isFinite(keys[i][0])||!Number.isFinite(keys[i][1])||(i&&keys[i][0]<=keys[i-1][0]))throw Error(`Invalid track ${name}`);}}
 return {frames:Math.round(f.duration*f.fps),duration:f.duration,shots:f.shots.length};
}
let platform;
export function configure(p){platform=p;}
export const canvas=(w,h)=>platform.createCanvas(w,h);
export const path=d=>new platform.Path2D(d);
export function shape(c,d,fill,stroke=null,width=1){const p=typeof d==='string'?path(d):d;if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}return p;}
export function ellipse(c,x,y,rx,ry,fill,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),rot,0,Math.PI*2);c.fillStyle=fill;c.fill();}
export function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
export function gradient(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
export function radial(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');return g;}
export function local(c,x,y,angle,fn){c.save();c.translate(x,y);c.rotate(angle);fn();c.restore();}
