#!/usr/bin/env python3
"""Code-Brush production MCP, with an upstream headless Blender MCP client."""
import asyncio, json, os, pathlib, sys, uuid
from datetime import timedelta
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from fastmcp import FastMCP

ROOT=pathlib.Path(__file__).resolve().parents[1]
mcp=FastMCP('Code-Brush',instructions='Read the project and revision, edit atomically, inspect frames, then render. Use blender_tools and blender_call for 3D assets through the headless Blender MCP server. Persistent 3D state lives in .blend files.')
async def agent(method,args):
 p=await asyncio.create_subprocess_exec(os.environ.get('CODE_BRUSH_NODE','node'),str(ROOT/'src/agent-cli.mjs'),stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
 out,err=await p.communicate(json.dumps({'method':method,'args':args}).encode())
 try:result=json.loads(out)
 except Exception:raise RuntimeError(err.decode()[-3000:] or out.decode()[-3000:])
 if not result['ok']:raise RuntimeError(result['error'])
 return result['result']

@mcp.tool()
async def production(method:str,args:dict)->dict:
 """Create/read/edit/validate projects; import assets; save reusable characters; inspect poses; render frames, contact sheets or a film. Call capabilities for method argument documentation. Edits require expectedRevision from project.read."""
 return await agent(method,args)

@mcp.tool()
async def capabilities()->dict:
 """List production operations and their arguments, plus 3D integration instructions."""
 return {'methods':{
 'project.create':'project, definition?','project.read':'project','project.edit':'project, expectedRevision, operations[{op:set|key|add|remove,target,property,value,time,ease,parent,node}]',
 'project.validate':'project','project.revisions':'project','project.restore':'project, revision, expectedRevision',
 'asset.import':'project, id, source OR files[], kind:image|sequence|audio|blend, provenance, fps?',
 'character.save':'project, node, output','pose.inspect':'project, time, node?',
 'frame.render':'project, time, width?, output?, onion?, guides?, transparent?',
 'contact.render':'project, output, times[]?, width?',
 'film.render':'project, output?, width?, startFrame?, endFrame?, transparent?, jobFile?'
 },'documentation':str(ROOT/'docs/PROJECT_FORMAT.md'),'blender':'Use blender_tools to discover actual upstream schemas; blender_call forwards any tool. blender_asset opens/saves persistent .blend state and imports PNG passes.'}

async def upstream(name=None,arguments=None):
 command=os.environ.get('BLENDER_MCP_COMMAND','blender-mcp-server')
 extra=json.loads(os.environ.get('BLENDER_MCP_ARGS','[]'))
 async with stdio_client(StdioServerParameters(command=command,args=extra,env=dict(os.environ))) as (r,w):
  async with ClientSession(r,w,read_timeout_seconds=timedelta(seconds=600)) as client:
   await client.initialize()
   if name is None:
    result=await client.list_tools();return {'tools':[t.model_dump(mode='json') for t in result.tools]}
   result=await client.call_tool(name,arguments or {})
   if result.isError:raise RuntimeError(result.model_dump_json())
   return result.model_dump(mode='json')

@mcp.tool()
async def blender_tools()->dict:
 """Discover the configured upstream Blender MCP tools and JSON schemas."""
 return await upstream()

@mcp.tool()
async def blender_call(tool:str,arguments:dict)->dict:
 """Call an upstream Blender MCP tool. script_execute uses a headless Blender process. Save .blend files explicitly to persist state between calls."""
 return await upstream(tool,arguments)

@mcp.tool()
async def blender_asset(project:str,asset_id:str,code:str,blend_file:str,frames_directory:str,frames:list[int],fps:int=24,width:int=512,height:int=512,samples:int=32)->dict:
 """Execute authoring code through upstream headless Blender MCP, save a .blend, render transparent Cycles PNG frames, and import them as a 2D image sequence. Existing blend_file is opened before code runs. Code can build meshes, rigs, materials, lights, cameras or any Blender data. Supply a camera. Frames are Blender frame numbers."""
 if not frames or len(frames)>1000:raise ValueError('Supply 1–1000 frame numbers')
 if width<2 or height<2 or samples<1:raise ValueError('Invalid render settings')
 blend=str(pathlib.Path(blend_file).resolve());directory=str(pathlib.Path(frames_directory).resolve())
 paths=[str(pathlib.Path(directory)/f'{i:06d}.png') for i in range(len(frames))]
 config={'blend':blend,'directory':directory,'frames':frames,'paths':paths,'fps':fps,'width':width,'height':height,'samples':samples}
 script="import bpy, pathlib, json\n_cfg=json.loads("+repr(json.dumps(config))+ ")\n"
 script+="if pathlib.Path(_cfg['blend']).exists(): bpy.ops.wm.open_mainfile(filepath=_cfg['blend'])\n"
 script+=code+"\n"
 script+="""
pathlib.Path(_cfg['directory']).mkdir(parents=True,exist_ok=True)
pathlib.Path(_cfg['blend']).parent.mkdir(parents=True,exist_ok=True)
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=_cfg['samples']
s.render.resolution_x=_cfg['width'];s.render.resolution_y=_cfg['height'];s.render.resolution_percentage=100
s.render.fps=_cfg['fps'];s.render.film_transparent=True
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
if not s.camera: raise RuntimeError('Asset scene needs an active camera')
bpy.ops.wm.save_as_mainfile(filepath=_cfg['blend'])
for frame,dest in zip(_cfg['frames'],_cfg['paths']):
 s.frame_set(frame);s.render.filepath=dest;bpy.ops.render.render(write_still=True)
print('CODE_BRUSH_ASSET_COMPLETE')
"""
 result=await upstream('script_execute',{'code':script})
 # The upstream tool can return success:false inside a text result without isError.
 for item in result.get('content',[]):
  if item.get('type')=='text':
   try:value=json.loads(item['text'])
   except (ValueError,TypeError):continue
   if isinstance(value,dict) and value.get('success') is False:raise RuntimeError(str(value.get('output')))
 for file in paths:
  if not pathlib.Path(file).is_file():raise RuntimeError('Blender did not produce '+file)
 imported=await agent('asset.import',{'project':project,'id':asset_id,'files':paths,'kind':'sequence','fps':fps,'provenance':'Rendered with upstream Blender MCP in headless Blender; source '+blend})
 return {'blend_file':blend,'frames':paths,'import':imported}

@mcp.tool()
async def start_render(project:str,output:str,width:int=1920,transparent:bool=False)->dict:
 """Start a resumable render job and return immediately; use render_status with the returned job_file."""
 jobs=pathlib.Path(project).resolve().parent/'.codebrush'/'jobs';jobs.mkdir(parents=True,exist_ok=True)
 job=jobs/(uuid.uuid4().hex+'.json');job.write_text(json.dumps({'state':'queued','project':project,'output':output}))
 args={'project':project,'output':output,'width':width,'transparent':transparent,'jobFile':str(job)}
 request=jobs/(job.stem+'.request.json');request.write_text(json.dumps({'method':'film.render','args':args}))
 # Keep handles alive until spawn finishes; the independent worker updates jobFile.
 with request.open('rb') as stdin,(jobs/(job.stem+'.log')).open('wb') as log:
  import subprocess
  process=subprocess.Popen([os.environ.get('CODE_BRUSH_NODE','node'),str(ROOT/'src/agent-cli.mjs')],stdin=stdin,stdout=log,stderr=log,start_new_session=True)
 return {'job_file':str(job),'pid':process.pid}

@mcp.tool()
async def render_status(job_file:str)->dict:
 """Read progress, cache hits, errors and output location of a render job."""
 return json.loads(pathlib.Path(job_file).read_text())

if __name__=='__main__':mcp.run(transport='stdio',show_banner=False)
