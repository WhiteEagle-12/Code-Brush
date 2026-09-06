import {clamp,lerp,matrix,boneMatrices,inverse,point} from './math.mjs';

function get(object,path){return path.split('.').reduce((o,k)=>o?.[k],object);}
function put(object,path,value){const keys=path.split('.');if(keys.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Unsafe pose path');let o=object;for(const k of keys.slice(0,-1)){if(o[k]===undefined)o[k]={};o=o[k];}o[keys.at(-1)]=value;}
function sum(base,delta,w){if(typeof base==='number'&&typeof delta==='number')return base+delta*w;if(Array.isArray(base)&&Array.isArray(delta)&&base.length===delta.length)return base.map((v,i)=>sum(v,delta[i],w));throw Error('Pose deltas must match numeric property topology');}
/** Sparse additive poses permit simultaneous facial expressions and corrective shapes. */
export function applyPoses(node){for(const[name,weight]of Object.entries(node.poseWeights??{})){const pose=node.poses?.[name];if(!pose)throw Error('Unknown pose '+name);for(const[property,delta]of Object.entries(pose))put(node,property,sum(get(node,property)??0,delta,weight));}return node;}
export function deformVertices(node){
 let vertices=node.vertices.map(v=>[...v]);
 for(const[name,weight]of Object.entries(node.shapeWeights??{})){const delta=node.shapeKeys?.[name];if(!delta||delta.length!==vertices.length)throw Error('Invalid shape key '+name);vertices=vertices.map((v,i)=>[v[0]+delta[i][0]*weight,v[1]+delta[i][1]*weight]);}
 if(node.lattice){const{columns,rows,bounds,offsets}=node.lattice,[x,y,w,h]=bounds;if(columns<1||rows<1||w<=0||h<=0||offsets.length!==(columns+1)*(rows+1))throw Error('Invalid lattice');vertices=vertices.map(v=>{const u=clamp((v[0]-x)/w)*columns,q=clamp((v[1]-y)/h)*rows,i=Math.min(columns-1,Math.floor(u)),j=Math.min(rows-1,Math.floor(q)),a=u-i,b=q-j;const at=(xx,yy)=>offsets[yy*(columns+1)+xx];const d=[0,1].map(k=>lerp(lerp(at(i,j)[k],at(i+1,j)[k],a),lerp(at(i,j+1)[k],at(i+1,j+1)[k],a),b));return[v[0]+d[0],v[1]+d[1]];});}
 return vertices.map((v,i)=>[v[0]+(node.offsets?.[i]?.[0]??0),v[1]+(node.offsets?.[i]?.[1]??0)]);
}
const limit=b=>{if(b.limits)b.rotation=clamp(b.rotation??0,b.limits[0],b.limits[1]);};
/** CCD supports chains of arbitrary length and enforces local joint limits. */
export function solveRig(source,constraints=[]){
 const bones=structuredClone(source),byId=new Map(bones.map(b=>[b.id,b]));bones.forEach(limit);
 for(const con of constraints){if(con.enabled===false)continue;const weight=clamp(con.weight??1);
  if(con.type==='copy'){const a=byId.get(con.bone),b=byId.get(con.source);if(!a||!b)throw Error('Unknown copy bone');a.rotation=lerp(a.rotation??0,(b.rotation??0)+(con.offset??0),weight);limit(a);continue;}
  const chain=con.chain??[con.bone];if(!chain.length||chain.some(id=>!byId.has(id)))throw Error('Unknown constraint chain');
  if(!Array.isArray(con.target)||con.target.length!==2)throw Error('Constraint target must be [x,y]');
  const initial=new Map(chain.map(id=>[id,byId.get(id).rotation??0]));
  for(let iter=0;iter<(con.type==='lookAt'?1:Math.min(128,con.iterations??32));iter++){
   for(const id of [...chain].reverse()){
    const m=boneMatrices(bones),b=byId.get(id),tip=byId.get(chain.at(-1)),origin=point(m[id],[0,0]),end=con.type==='lookAt'?point(m[id],[b.length??1,0]):point(m[tip.id],[tip.length??0,0]);
    const a=Math.atan2(end[1]-origin[1],end[0]-origin[0]),z=Math.atan2(con.target[1]-origin[1],con.target[0]-origin[0]);let delta=(z-a)*180/Math.PI;while(delta>180)delta-=360;while(delta<-180)delta+=360;b.rotation=(b.rotation??0)+delta;limit(b);
   }
   const m=boneMatrices(bones),tip=byId.get(chain.at(-1)),end=point(m[tip.id],[tip.length??0,0]);if(Math.hypot(end[0]-con.target[0],end[1]-con.target[1])<(con.tolerance??.05))break;
  }
  for(const id of chain){const b=byId.get(id);b.rotation=lerp(initial.get(id),b.rotation??0,weight);limit(b);}
 }
 return bones;
}
