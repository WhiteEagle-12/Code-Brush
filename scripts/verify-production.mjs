#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {serveStudio} from '../src/studio.mjs';
import {dispatch} from '../src/agent-api.mjs';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'code-brush-production-'));
let server;
try {
 const project=path.join(dir,'film.json'),tone=path.join(dir,'tone.wav');
 execFileSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','sine=frequency=440:duration=2',tone]);
 await dispatch('project.create',{project,definition:{version:1,width:128,height:72,fps:6,duration:2,nodes:[{id:'actor',type:'ellipse',x:40,y:36,rx:16,ry:20,fill:'#d89554'}],tracks:[{target:'actor',property:'x',keys:[[0,40],[2,95]]}],audioTracks:[{file:'tone.wav',gain:.2},{file:'tone.wav',start:.5,trim:.1,duration:.8,gain:.1,fadeIn:.1,fadeOut:.1}]}});
 server=serveStudio(project,0);await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const html=await(await fetch(base)).text();assert.ok(html.includes('<canvas')||html.includes('<img'));
 const read=await(await fetch(base+'/api',{method:'POST',body:JSON.stringify({method:'project.read'})})).json();assert.equal(read.ok,true);
 const frame=await fetch(base+'/frame?time=0.5&onion=1&guides=1');assert.equal(frame.status,200);assert.equal(frame.headers.get('content-type'),'image/png');assert.ok((await frame.arrayBuffer()).byteLength>100);
 const denied=await fetch(base+'/api',{method:'POST',headers:{Origin:'https://example.com'},body:JSON.stringify({method:'project.read'})});assert.equal(denied.status,400);
 const movie=path.join(dir,'film.mp4');await dispatch('film.render',{project,output:movie,startFrame:3,endFrame:9});
 const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const info=probe(movie);assert.equal(info.streams.find(s=>s.codec_type==='video').nb_frames,'6');assert.ok(info.streams.some(s=>s.codec_type==='audio'));assert.ok(Math.abs(Number(info.format.duration)-1)<.1);
 const alpha=path.join(dir,'alpha.mov');await dispatch('film.render',{project,output:alpha,transparent:true,startFrame:0,endFrame:2});
 const alphaInfo=probe(alpha).streams.find(s=>s.codec_type==='video');assert.equal(alphaInfo.codec_name,'prores');assert.ok(alphaInfo.pix_fmt.startsWith('yuva'));
 const badJob=path.join(dir,'failed.json');const child=await import('node:child_process');const result=child.spawnSync('node',['src/agent-cli.mjs'],{input:JSON.stringify({method:'film.render',args:{project:path.join(dir,'missing.json'),jobFile:badJob}}),encoding:'utf8'});assert.equal(result.status,1);assert.equal(JSON.parse(await fs.readFile(badJob)).state,'failed');
 console.log(JSON.stringify({status:'passed',studio:'HTTP/read/frame/origin checks',video:'6-frame H.264 with mixed audio',alpha:alphaInfo.pix_fmt,failedJob:'reported'}));
} finally {if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await fs.rm(dir,{recursive:true,force:true});}
