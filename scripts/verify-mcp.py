#!/usr/bin/env python3
"""Real stdio MCP integration: Blender authoring -> RGBA passes -> 2D composite -> cache."""
import asyncio,json,os,pathlib,sys,uuid
from datetime import timedelta
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client
ROOT=pathlib.Path(__file__).resolve().parents[1]
async def main():
 out=ROOT/'output'/('mcp-verification-'+uuid.uuid4().hex[:8]);out.mkdir(parents=True)
 env=dict(os.environ)
 params=StdioServerParameters(command=sys.executable,args=[str(ROOT/'mcp/server.py')],env=env)
 async with stdio_client(params) as (r,w):
  async with ClientSession(r,w,read_timeout_seconds=timedelta(seconds=600)) as client:
   await client.initialize()
   async def call(name,args):
    result=await client.call_tool(name,args)
    if result.isError:raise RuntimeError(result.model_dump_json())
    data=result.structuredContent
    if data is None:data=json.loads(next(c.text for c in result.content if c.type=='text'))
    return data
   capabilities=await call('capabilities',{});assert 'methods' in capabilities
   project=str(out/'film.json')
   await call('production',{'method':'project.create','args':{'project':project,'definition':{'version':1,'title':'MCP asset integration','width':640,'height':360,'fps':6,'duration':1,'background':'#d7dfcf','nodes':[]}}})
   tools=await call('blender_tools',{});assert any(t['name']=='script_execute' for t in tools['tools'])
   asset=await call('blender_asset',{'project':project,'asset_id':'stone','code':(ROOT/'examples/blender/moss-rock.py').read_text(),'blend_file':str(out/'stone.blend'),'frames_directory':str(out/'passes'),'frames':[1,12,24],'fps':3,'width':256,'height':256,'samples':12})
   node=asset['import']['node'];node.update({'x':190,'y':45,'width':256,'height':256})
   state=await call('production',{'method':'project.read','args':{'project':project}})
   await call('production',{'method':'project.edit','args':{'project':project,'expectedRevision':state['revision'],'operations':[{'op':'add','node':node}]}})
   await call('production',{'method':'frame.render','args':{'project':project,'time':.5,'output':str(out/'composite.png')}})
   first=await call('production',{'method':'film.render','args':{'project':project,'output':str(out/'composite.mp4'),'width':640}})
   second=await call('production',{'method':'film.render','args':{'project':project,'width':640}})
   assert second['cached']==6
   assert pathlib.Path(asset['blend_file']).stat().st_size>1000
   assert first['state']=='complete'
   job=await call('start_render',{'project':project,'output':str(out/'background.mp4'),'width':640})
   for _ in range(120):
    status=await call('render_status',{'job_file':job['job_file']})
    if status['state'] in ('complete','failed'):break
    await asyncio.sleep(.25)
   assert status['state']=='complete',status
   assert status['cached']==6

   report={'status':'passed','upstream_tools':len(tools['tools']),'frames':len(asset['frames']),'render_frames':first['frames'],'cache_hits':second['cached'],'project':project,'blend':asset['blend_file'],'video':str(out/'composite.mp4')}
   (out/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
asyncio.run(main())
