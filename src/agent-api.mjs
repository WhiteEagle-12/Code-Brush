import fs from 'node:fs/promises';import path from 'node:path';import {readProject,editProject,restoreRevision,importAsset,checkProject,renderFrame,renderJob,contactSheet,compileProject,atomic,digest} from './production.mjs';import{evaluate,indexNodes}from'./index.mjs';
export const methods=['project.create','project.read','project.edit','project.validate','project.revisions','project.restore','asset.import','character.save','frame.render','contact.render','film.render','pose.inspect'];
export async function dispatch(method,args={}){
 const file=path.resolve(args.project??'film.json');
 switch(method){
 case'project.create':{const p=args.definition??{version:1,title:'Untitled',width:1920,height:1080,fps:24,duration:10,background:'#f1ead8',nodes:[],tracks:[],shots:[{id:'shot-01',start:0,end:10}]};await compileProject(p,file);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(p,null,2),{flag:'wx'});return readProject(file);}
 case'project.read':return readProject(file);
 case'project.edit':if(!args.expectedRevision)throw Error('expectedRevision is required');return editProject(file,args.operations,args.expectedRevision);
 case'project.validate':return checkProject(file);
 case'project.revisions':{const dir=path.join(path.dirname(file),'.codebrush','revisions');let files=[];try{files=await fs.readdir(dir);}catch{}return{revisions:files.filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5))};}
 case'project.restore':if(!args.expectedRevision)throw Error('expectedRevision is required');return restoreRevision(file,args.revision,args.expectedRevision);
 case'asset.import':return importAsset(file,args);
 case'character.save':{const p=(await readProject(file)).project,node=indexNodes(p.nodes).get(args.node);if(!node)throw Error('Unknown character root');const ids=new Set(indexNodes([node]).keys()),character={version:1,drawings:structuredClone(p.drawings??{}),nodes:[node],tracks:(p.tracks??[]).filter(t=>ids.has(t.target)),assets:{}};for(const[id,v]of Object.entries(p.assets??{}))character.assets[id]=path.relative(path.dirname(path.resolve(args.output)),path.resolve(path.dirname(file),v));await atomic(args.output,JSON.stringify(character,null,2));return{output:args.output,nodes:ids.size};}
 case'frame.render':{const{bytes,...result}=await renderFrame(file,args);if(!args.output)result.png=bytes.toString('base64');return result;}
 case'contact.render':return contactSheet(file,args);
 case'film.render':return renderJob(file,args);
 case'pose.inspect':{const{project,revision}=await readProject(file),p=evaluate(await compileProject(project,file),args.time??0);return{revision,shot:p.currentShot,camera:p.camera,nodes:args.node?[indexNodes(p.nodes).get(args.node)]:[...indexNodes(p.nodes).values()]};}
 default:throw Error('Unknown method '+method);
 }
}
