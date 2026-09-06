#!/usr/bin/env node
import http from'node:http';import fs from'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';import{dispatch}from'./agent-api.mjs';import{renderFrame}from'./production.mjs';
export function serveStudio(project,port=8080){
 const file=path.resolve(project),html=new URL('../studio/index.html',import.meta.url);
 const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(await fs.readFile(html));}
  else if(req.method==='GET'&&u.pathname==='/frame'){const t=Number(u.searchParams.get('time')??0);if(!Number.isFinite(t))throw Error('Invalid time');const result=await renderFrame(file,{time:t,width:960,onion:u.searchParams.get('onion')==='1',guides:u.searchParams.get('guides')==='1'});res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(result.bytes);}
  else if(req.method==='POST'&&u.pathname==='/api'){const origin=req.headers.origin;if(origin&&!['http://localhost:'+server.address().port,'http://127.0.0.1:'+server.address().port].includes(origin))throw Error('Origin is not the local studio');let text='';for await(const b of req){text+=b;if(text.length>10e6)throw Error('Request too large');}const request=JSON.parse(text);const allowed=['project.read','project.edit','project.validate','project.revisions','project.restore','pose.inspect'];if(!allowed.includes(request.method))throw Error('Method unavailable in studio');const result=await dispatch(request.method,{...request.args,project:file});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,result}));}
  else{res.writeHead(404);res.end();}
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:e.message}));}});
 server.listen(port,'127.0.0.1',()=>console.log('Studio http://localhost:'+server.address().port));return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){if(!process.argv[2])throw Error('Usage: node src/studio.mjs project.json [port]');serveStudio(process.argv[2],Number(process.argv[3]??8080));}
