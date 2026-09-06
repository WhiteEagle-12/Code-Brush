import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {Renderer,validate,evaluate,indexNodes,setProperty} from './index.mjs';
import {audioGraph} from './audio.mjs';
const require=createRequire(import.meta.url),platform=require('@napi-rs/canvas');
export const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
export async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(tmp,data);await fs.rename(tmp,file);}
const json=value=>JSON.stringify(value,null,2);
const metadata=file=>path.join(path.dirname(file),'.codebrush');
export async function readProject(file){const raw=await fs.readFile(file,'utf8');return{project:JSON.parse(raw),revision:digest(raw),file:path.resolve(file)};}

/** Expand externally authored characters with namespaced IDs and assets. */
export async function compileProject(project,file){
 const p=structuredClone(project),base=path.dirname(file);p.assets??={};const inherited=[];
 async function expand(nodes){const result=[];for(const n of nodes??[]){
  if(n.type==='instance'){
   const ref=p.characters?.[n.character];if(!ref)throw Error('Unknown character '+n.character);
   const characterFile=path.resolve(base,ref),character=JSON.parse(await fs.readFile(characterFile,'utf8'));
   const prefix=n.id+'.',assets=new Map(Object.keys(character.assets??{}).map(id=>[id,prefix+id]));
   for(const[id,v]of Object.entries(character.assets??{}))p.assets[prefix+id]=path.resolve(path.dirname(characterFile),v);
   function namespace(node){node.id=prefix+node.id;if(assets.has(node.asset))node.asset=assets.get(node.asset);if(node.drawing)node.drawing=prefix+node.drawing;for(const e of node.exposures??[])e.drawing=prefix+e.drawing;if(node.frames)node.frames=node.frames.map(id=>assets.get(id)??id);for(const c of node.children??[])namespace(c);for(const s of node.slots??[])namespace(s.node);if(node.mask)namespace(node.mask);}
   p.drawings??={};for(const[id,nodes]of Object.entries(character.drawings??{})){const drawings=structuredClone(nodes);drawings.forEach(namespace);p.drawings[prefix+id]=drawings;}const children=structuredClone(character.nodes??[]);children.forEach(namespace);
   for(const t of character.tracks??[])inherited.push({...structuredClone(t),target:prefix+t.target,keys:t.keys.map(k=>[k[0]+(n.timeOffset??0),...k.slice(1)])});
   result.push({...n,type:'group',children});
  }else{if(n.children)n.children=await expand(n.children);result.push(n);}
 }return result;}
 p.nodes=await expand(p.nodes);p.tracks=[...inherited,...(p.tracks??[])];validate(p);return p;
}
export async function loadProduction(file){
 const state=await readProject(file),p=await compileProject(state.project,file),assets={},base=path.dirname(file);
 for(const[id,v]of Object.entries(p.assets??{}))assets[id]=await platform.loadImage(path.resolve(base,v));
 let plugins={};if(p.plugin)plugins=(await import(pathToFileURL(path.resolve(base,p.plugin)))).default;
 return{...state,compiled:p,renderer:new Renderer(platform,assets,plugins)};
}
function walkRemove(nodes,target){return nodes.filter(n=>n.id!==target).map(n=>{if(n.children)n.children=walkRemove(n.children,target);if(n.slots)n.slots=n.slots.filter(s=>s.node.id!==target).map(s=>({...s,node:walkRemove([s.node],target)[0]}));if(n.mask?.id===target)delete n.mask;else if(n.mask)n.mask=walkRemove([n.mask],target)[0];return n;});}
export async function editProject(file,operations,expectedRevision){
 const lock=file+'.lock';await fs.mkdir(lock).catch(()=>{throw Error('Project is being edited; retry after reading its revision');});
 try{
  const state=await readProject(file);if(expectedRevision&&state.revision!==expectedRevision)throw Error('REVISION_CONFLICT: read the latest project before retrying');const previous=structuredClone(state.project),p=state.project;
  for(const op of operations){const nodes=indexNodes(p.nodes),target=op.target==='project'?p:op.target==='camera'?(p.camera??={}):nodes.get(op.target);
   if(op.op==='replace'){for(const k of Object.keys(p))delete p[k];Object.assign(p,structuredClone(op.value));}
   else if(op.op==='add'){if(op.parent){const parent=nodes.get(op.parent);if(!parent)throw Error('Unknown parent');(parent.children??=[]).push(op.node);}else(p.nodes??=[]).push(op.node);}
   else if(op.op==='remove'){if(!target)throw Error('Unknown node');const ids=new Set(indexNodes([target]).keys());p.nodes=walkRemove(p.nodes,op.target);p.tracks=(p.tracks??[]).filter(t=>!ids.has(t.target));for(const s of p.shots??[])s.tracks=(s.tracks??[]).filter(t=>!ids.has(t.target));}
   else if(op.op==='set'){if(!target)throw Error('Unknown target '+op.target);setProperty(target,op.property,op.value);}
   else if(op.op==='key'){if(!target)throw Error('Unknown target');p.tracks??=[];let tr=p.tracks.find(t=>t.target===op.target&&t.property===op.property);if(!tr){tr={target:op.target,property:op.property,keys:[]};p.tracks.push(tr);}const k=tr.keys.find(k=>k[0]===op.time);if(k)k.splice(1,2,op.value,op.ease??'smooth');else tr.keys.push([op.time,op.value,op.ease??'smooth']);tr.keys.sort((a,b)=>a[0]-b[0]);}
   else throw Error('Unknown edit operation '+op.op);
  }
  await compileProject(p,file);await atomic(path.join(metadata(file),'revisions',state.revision+'.json'),json(previous));const content=json(p);await atomic(file,content);return{revision:digest(content),previous:state.revision};
 }finally{await fs.rmdir(lock);}
}
export async function restoreRevision(file,revision,expectedRevision){if(!/^[a-f0-9]{64}$/.test(revision))throw Error('Invalid revision');const p=JSON.parse(await fs.readFile(path.join(metadata(file),'revisions',revision+'.json'),'utf8'));return editProject(file,[{op:'replace',value:p}],expectedRevision);}
export async function importAsset(file,{id,source,kind='image',provenance='',fps=24,files}){
 if(!/^[a-zA-Z0-9_.-]+$/.test(id))throw Error('Asset id may contain letters, numbers, dots, underscores and hyphens');
 const sources=files??[source],records=[],mapping={};for(let i=0;i<sources.length;i++){
  const bytes=await fs.readFile(sources[i]),sha=digest(bytes),extension=path.extname(sources[i]).toLowerCase(),dest=path.join(path.dirname(file),'assets',sha+extension),assetId=files?id+'.'+String(i).padStart(6,'0'):id;
  await atomic(dest,bytes);mapping[assetId]=path.relative(path.dirname(file),dest).split(path.sep).join('/');records.push({id:assetId,sha256:sha,bytes:bytes.length,kind,provenance,path:mapping[assetId]});
 }
 const state=await readProject(file);const result=await editProject(file,[{op:'set',target:'project',property:'assets',value:{...(state.project.assets??{}),...(['image','sequence'].includes(kind)?mapping:{})}},{op:'set',target:'project',property:'assetMetadata',value:{...(state.project.assetMetadata??{}),[id]:{kind,provenance,records,fps}}}],state.revision);
 return{...result,assets:records,node:files?{id,type:'image',frames:Object.keys(mapping),fps}:undefined};
}
export async function checkProject(file){const{project,compiled,revision}=await loadProduction(file),warnings=[];
 for(const n of indexNodes(compiled.nodes).values()){
  if(n.type==='skeleton'&&(n.slots??[]).some(s=>s.skin)&&!n.bindBones)warnings.push(`${n.id}: skinned rig has no explicit bindBones`);
  if(n.type==='mesh'&&n.asset&&n.triangles.length>20000)warnings.push(`${n.id}: large CPU mesh; consider a Blender asset pass`);
 }
 return{...validate(compiled),revision,warnings,assets:Object.keys(compiled.assets??{}).length};}
export async function renderFrame(file,{time=0,width,output,onion=false,guides=false,transparent=false}={}){
 const{compiled:p,renderer}=await loadProduction(file);width??=p.width;const height=Math.round(width*p.height/p.width),can=platform.createCanvas(width,height),c=can.getContext('2d');renderer.render(c,p,time,{guides,background:!transparent});
 if(onion){const ghost=structuredClone(p);ghost.nodes=ghost.nodes.filter(n=>n.role!=='background');for(const dt of[-1/p.fps,1/p.fps]){const layer=platform.createCanvas(width,height),lc=layer.getContext('2d');renderer.render(lc,ghost,Math.max(0,time+dt),{background:false});lc.globalCompositeOperation='source-in';lc.fillStyle=dt<0?'#ee6479':'#53b4d2';lc.fillRect(0,0,width,height);c.globalAlpha=.23;c.drawImage(layer,0,0);}c.globalAlpha=1;}
 const bytes=can.toBuffer('image/png');if(output)await atomic(output,bytes);return{bytes,width,height,time,output};
}
async function run(command,args){return new Promise((resolve,reject)=>{const p=spawn(command,args,{stdio:['ignore','pipe','pipe']});let log='';p.stderr.on('data',b=>log=(log+b).slice(-6000));p.once('error',reject);p.once('exit',code=>code?reject(Error(log)):resolve());});}
export async function renderJob(file,options={}){
 const{compiled:p,renderer,revision}=await loadProduction(file),width=options.width??p.width,height=Math.round(width*p.height/p.width/2)*2,start=options.startFrame??0,end=options.endFrame??Math.round(p.duration*p.fps);
 if(!Number.isInteger(width)||width<2||width%2||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>Math.round(p.duration*p.fps))throw Error('Invalid render dimensions or frame range');
 const dependencies=[];for(const v of [...Object.values(p.assets??{}),...(p.plugin?[p.plugin]:[]),...(p.dependencies??[])])dependencies.push(digest(await fs.readFile(path.resolve(path.dirname(file),v))));
 const key=digest(json({project:p,dependencies,width,height,transparent:!!options.transparent,engine:'code-brush-1.0.0',canvas:require('@napi-rs/canvas/package.json').version})),dir=path.join(metadata(file),'cache',key);await fs.mkdir(dir,{recursive:true});
 const jobFile=options.jobFile??path.join(metadata(file),'jobs',crypto.randomUUID()+'.json'),record={state:'rendering',project:file,revision,key,startFrame:start,endFrame:end,completed:0,cached:0,output:options.output};await atomic(jobFile,json(record));
 try{
  const can=platform.createCanvas(width,height),c=can.getContext('2d');
  for(let i=start;i<end;i++){const name=path.join(dir,String(i).padStart(6,'0')+'.png');let cached=false;try{const stat=await fs.stat(name);cached=stat.size>0;}catch{}if(cached)record.cached++;else{renderer.render(c,p,i/p.fps,{background:!options.transparent});await atomic(name,can.toBuffer('image/png'));}record.completed++;if(i%8===0)await atomic(jobFile,json(record));}
  if(options.output){await fs.mkdir(path.dirname(path.resolve(options.output)),{recursive:true});record.state='encoding';await atomic(jobFile,json(record));const args=['-y','-framerate',String(p.fps),'-start_number',String(start),'-i',path.join(dir,'%06d.png')],audio=audioGraph(p,path.dirname(file));args.push(...audio.inputs);if(audio.enabled){const filter=audio.filters.replace('[mix]',`[fullmix];[fullmix]atrim=start=${start/p.fps}:duration=${(end-start)/p.fps},asetpts=PTS-STARTPTS[mix]`);args.push('-filter_complex',filter,'-map','0:v:0','-map','[mix]');}
   if(options.transparent&&path.extname(options.output)==='.mov')args.push('-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le');else if(options.transparent)throw Error('Alpha video requires a .mov output (ProRes 4444), or omit output for PNG frames');else args.push('-c:v','libx264','-crf',String(options.crf??18),'-pix_fmt','yuv420p','-movflags','+faststart');if(audio.enabled)args.push('-c:a','aac','-b:a','192k');args.push('-frames:v',String(end-start),'-t',String((end-start)/p.fps),options.output);await run('ffmpeg',args);
  }
  Object.assign(record,{state:'complete',framesDirectory:dir,width,height,frames:end-start,duration:(end-start)/p.fps});await atomic(jobFile,json(record));return{...record,jobFile};
 }catch(e){record.state='failed';record.error=e.message;await atomic(jobFile,json(record));throw e;}
}
export async function contactSheet(file,{output,width=1200,times}={}){const{project:p}=await readProject(file);times??=Array.from({length:9},(_,i)=>i*(p.duration-1/p.fps)/8);const cols=3,tw=Math.floor(width/cols),th=Math.round(tw*p.height/p.width),can=platform.createCanvas(width,Math.ceil(times.length/cols)*(th+28)),c=can.getContext('2d');c.fillStyle='#17241e';c.fillRect(0,0,can.width,can.height);for(let i=0;i<times.length;i++){const f=await renderFrame(file,{time:times[i],width:tw});c.drawImage(await platform.loadImage(f.bytes),i%cols*tw,Math.floor(i/cols)*(th+28));c.fillStyle='#e8dbc0';c.font='14px sans-serif';c.fillText(times[i].toFixed(3)+'s',i%cols*tw+10,Math.floor(i/cols)*(th+28)+th+20);}await atomic(output,can.toBuffer('image/png'));return{output,times};}
