export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const easing={linear:t=>t,smooth:t=>t*t*(3-2*t),smoother:t=>t*t*t*(t*(6*t-15)+10),in:t=>t*t,out:t=>1-(1-t)**2,hold:()=>0};
export function interpolate(a,b,t){
 if(typeof a==='number'&&typeof b==='number')return lerp(a,b,t);
 if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length)return a.map((v,i)=>interpolate(v,b[i],t));
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)){const o={...a};for(const k of Object.keys(b))o[k]=k in a?interpolate(a[k],b[k],t):b[k];return o;}
 return t<1?a:b;
}
export function sample(keys,t){if(!keys?.length)throw Error('Empty keyframe track');if(t<=keys[0][0])return structuredClone(keys[0][1]);for(let i=1;i<keys.length;i++){const[a,u]=keys[i-1],[b,v,e='smooth']=keys[i];if(t<=b){if(t===b)return structuredClone(v);return interpolate(u,v,(easing[e]??easing.smooth)(clamp((t-a)/(b-a))));}}return structuredClone(keys.at(-1)[1]);}
export function random(seed=1){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
export const identity=()=>[1,0,0,1,0,0];
export function multiply(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export function inverse(m){const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-12)throw Error('Singular transform');return[m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
export const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function matrix(n={}){const r=(n.rotation??0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sx=n.scaleX??n.scale??1,sy=n.scaleY??n.scale??1;const m=[c*sx,s*sx,-s*sy,c*sy,n.x??0,n.y??0];if(n.pivot)m[4]-=m[0]*n.pivot[0]+m[2]*n.pivot[1],m[5]-=m[1]*n.pivot[0]+m[3]*n.pivot[1];return m;}
export function solveIK(root,target,a,b,bend=1){const dx=target[0]-root[0],dy=target[1]-root[1],d=clamp(Math.hypot(dx,dy),Math.abs(a-b)+1e-7,a+b-1e-7),base=Math.atan2(dy,dx),off=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1))*bend;const joint=[root[0]+Math.cos(base+off)*a,root[1]+Math.sin(base+off)*a];return{joint,rootAngle:(base+off)*180/Math.PI,childAngle:(Math.atan2(target[1]-joint[1],target[0]-joint[0])-base-off)*180/Math.PI};}
export function boneMatrices(bones){const out={},byId=new Map(bones.map(b=>[b.id,b])),visiting=new Set();function visit(b){if(out[b.id])return out[b.id];if(visiting.has(b.id))throw Error('Cyclic bone hierarchy');visiting.add(b.id);const p=b.parent?byId.get(b.parent):null;if(b.parent&&!p)throw Error('Unknown parent bone '+b.parent);out[b.id]=multiply(p?visit(p):identity(),matrix(b));visiting.delete(b.id);return out[b.id];}bones.forEach(visit);return out;}
export function skin(vertices,weights,bind,pose){return vertices.map((v,i)=>{const w=weights[i]??[],sum=w.reduce((a,q)=>a+q.weight,0);if(!sum)return[...v];return w.reduce((a,q)=>{if(!bind[q.bone]||!pose[q.bone])throw Error('Unknown skin bone '+q.bone);const p=point(multiply(pose[q.bone],inverse(bind[q.bone])),v);return[a[0]+p[0]*q.weight/sum,a[1]+p[1]*q.weight/sum];},[0,0]);});}
export function setProperty(object,path,value){const parts=path.split('.');if(parts.some(p=>['__proto__','prototype','constructor'].includes(p)))throw Error('Unsafe property path');let o=object;for(const key of parts.slice(0,-1)){if(o[key]===undefined)o[key]={};o=o[key];if(!o||typeof o!=='object')throw Error('Invalid property path');}o[parts.at(-1)]=structuredClone(value);}
