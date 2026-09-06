import{applyPoses}from'./character.mjs';
import{sample,setProperty}from'./math.mjs';
export function indexNodes(nodes,map=new Map()){for(const n of nodes??[]){if(map.has(n.id))throw Error('Duplicate node id '+n.id);map.set(n.id,n);indexNodes(n.children,map);if(n.mask)indexNodes([n.mask],map);for(const s of n.slots??[])indexNodes([s.node],map);}return map;}
export function validate(p){
 const errors=[];if(p.version!==1)errors.push('version must be 1');
 for(const k of['width','height','fps','duration'])if(!Number.isFinite(p[k])||p[k]<=0)errors.push(k+' must be positive');
 if(p.width%2||p.height%2)errors.push('width and height must be even for video');
 let nodes;try{nodes=indexNodes(p.nodes);for(const[id,n]of nodes){if(!id)errors.push('Every node requires an id');if(!['group','path','ellipse','rect','image','text','brush','mesh','skeleton','drawing','custom'].includes(n.type))errors.push('Unknown node type '+n.type);}}catch(e){errors.push(e.message);}
 const tracks=[...(p.tracks??[]),...(p.shots??[]).flatMap(s=>s.tracks??[])];
 for(const tr of tracks){if(tr.target!=='camera'&&!nodes?.has(tr.target))errors.push('Unknown target '+tr.target);if(!tr.property)errors.push('Missing track property');if(!tr.keys?.length)errors.push('Empty track '+tr.target);for(let i=0;i<(tr.keys?.length??0);i++){const k=tr.keys[i];if(!Number.isFinite(k[0])||(i&&k[0]<=tr.keys[i-1][0]))errors.push('Unordered keyframes '+tr.target);}}
 if(p.shots?.length){let end=0;for(const s of p.shots){if(s.start!==end||s.end<=s.start)errors.push('Shots must be contiguous');end=s.end;}if(end!==p.duration)errors.push('Shots must cover duration');}
 if(errors.length)throw Error(errors.join('\n'));return{frames:Math.round(p.duration*p.fps),nodes:nodes.size,shots:p.shots?.length??1,tracks:tracks.length};
}
export function evaluate(project,time){
 const p=structuredClone(project),nodes=indexNodes(p.nodes);p.camera??={};const shot=p.shots?.find(s=>time>=s.start&&time<s.end)??p.shots?.at(-1);
 if(shot?.camera)Object.assign(p.camera,shot.camera);
 for(const tr of[...(p.tracks??[]),...(shot?.tracks??[])]){const t=tr.local&&shot?time-shot.start:time;setProperty(tr.target==='camera'?p.camera:nodes.get(tr.target),tr.property,sample(tr.keys,t));}
 for(const node of nodes.values())applyPoses(node);p.currentShot=shot?.id??'main';return p;
}
export function exposures(entries,t){let found=null;for(const e of entries??[]){if(t>=e.start&&t<e.end)found=e.drawing;}return found;}
