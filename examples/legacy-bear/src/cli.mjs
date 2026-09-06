#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {configure,validateFilm} from './core.mjs';
const require=createRequire(import.meta.url),{createCanvas,Path2D,loadImage}=require('@napi-rs/canvas');
configure({createCanvas,Path2D});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),command=args.shift()??'help';
const opt=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const filmPath=path.resolve(opt('film',path.join(root,'films/bear-waterfall/film.json')));
async function load(){const film=JSON.parse(await fs.readFile(filmPath,'utf8'));const info=validateFilm(film),base=path.dirname(filmPath);const {createScene}=await import(pathToFileURL(path.join(base,film.scene)));const background=await loadImage(path.join(base,film.background));return {film,info,scene:createScene(film,{background})};}
async function run(){
 if(command==='help'){console.log('brookframe render|frame|contact|validate|preview|init [--film path] [--output path] [--width 1920] [--time 4.3] [--port 8080]\nrender: lossless frame sampling → H.264 + optional soundtrack.wav\nframe: inspect an arbitrary timestamp\ncontact: shot-review contact sheet\npreview: local timeline editor');return;}
 if(command==='init'){
  const name=args[0];if(!name||!/^[a-z0-9-]+$/.test(name))throw Error('Use: brookframe init my-film (lowercase letters, numbers, hyphens)');
  const dest=path.join(root,'films',name);await fs.mkdir(dest);
  await fs.cp(path.join(root,'films/bear-waterfall'),dest,{recursive:true});
  const f=JSON.parse(await fs.readFile(path.join(dest,'film.json'),'utf8'));f.title=name.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');await fs.writeFile(path.join(dest,'film.json'),JSON.stringify(f,null,2));
  console.log(`Created ${dest}. Edit scene.mjs and film.json, then render --film ${dest}/film.json`);return;
 }
 if(command==='preview'){
  if(!filmPath.startsWith(root+path.sep))throw Error('Preview films must live inside the project directory');
  const manifest=JSON.parse(await fs.readFile(filmPath,'utf8'));validateFilm(manifest);
  const base='/'+path.relative(root,path.dirname(filmPath)).split(path.sep).join('/');
  const active={manifest:base+'/film.json',scene:base+'/'+manifest.scene,background:base+'/'+manifest.background,audio:base+'/soundtrack.wav'};
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.png':'image/png','.wav':'audio/wav','.mp4':'video/mp4'};
  const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/active-film.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(active));return;}const p=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/web/index.html':url.pathname));if(p!==root&&!p.startsWith(root+path.sep))throw Error('Outside project');const data=await fs.readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]??'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
  server.listen(Number(opt('port',8080)),'0.0.0.0',()=>console.log(`Preview: http://localhost:${opt('port',8080)}`));return;
 }
 const {film,info,scene}=await load();
 if(command==='validate'){console.log(JSON.stringify(info,null,2));return;}
 const width=Number(opt('width',film.width)),height=Math.round(width*film.height/film.width/2)*2;
 if(!Number.isFinite(width)||width<=0||width%2)throw Error('--width must be a positive even integer');
 const can=createCanvas(width,height),ctx=can.getContext('2d');
 const out=path.resolve(opt('output',path.join(root,'output',command==='render'?'the-other-side.mp4':command==='contact'?'contact-sheet.png':'frame.png')));await fs.mkdir(path.dirname(out),{recursive:true});
 if(command==='frame'){scene.render(ctx,Number(opt('time',4.3)));await fs.writeFile(out,can.toBuffer('image/png'));console.log(out);return;}
 if(command==='contact'){
  const times=[.5,2.4,3.7,4.34,5.45,6.6,7.9,9.2],sheet=createCanvas(1280,4*390),sc=sheet.getContext('2d');sc.fillStyle='#10231f';sc.fillRect(0,0,sheet.width,sheet.height);
  for(let i=0;i<times.length;i++){scene.render(ctx,times[i]);const x=(i%2)*640,y=Math.floor(i/2)*390;sc.drawImage(can,x,y,640,360);sc.fillStyle='#e3d6b8';sc.font='16px sans-serif';sc.fillText(`${times[i].toFixed(2)}s`,x+15,y+381);}await fs.writeFile(out,sheet.toBuffer('image/png'));console.log(out);return;
 }
 if(command!=='render')throw Error('Unknown command '+command);
 const soundtrack=path.join(path.dirname(filmPath),'soundtrack.wav');let hasAudio=true;try{await fs.access(soundtrack);}catch{hasAudio=false;}
 const ffargs=['-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-framerate',String(film.fps),'-i','pipe:0'];
 if(hasAudio)ffargs.push('-i',soundtrack);
 ffargs.push('-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart');if(hasAudio)ffargs.push('-c:a','aac','-b:a','256k');ffargs.push('-t',String(film.duration),out);
 const ff=spawn('ffmpeg',ffargs,{stdio:['pipe','ignore','pipe']});let log='';ff.stderr.on('data',b=>{log=(log+b).slice(-8000);});let processError;ff.on('error',e=>processError=e);ff.stdin.on('error',()=>{});
 const closed=once(ff,'close');
 for(let i=0;i<info.frames;i++){if(processError)throw processError;scene.render(ctx,i/film.fps);if(!ff.stdin.write(can.data()))await Promise.race([once(ff.stdin,'drain'),closed.then(()=>{throw Error(log);})]);if(i%24===0)console.log(`Rendering ${i}/${info.frames}`);}
 ff.stdin.end();const [code]=await closed;if(code!==0)throw Error(log);console.log(out);
 await fs.writeFile(out.replace(/\.mp4$/,'.render.json'),JSON.stringify({title:film.title,...info,width,height,audio:hasAudio,renderer:'@napi-rs/canvas',seed:film.seed},null,2));
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
