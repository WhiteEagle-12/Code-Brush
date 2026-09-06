# Original reusable asset recipe. Executed by Blender MCP's headless script tool.
import bpy, math, random
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(42)
def material(name,color,roughness=.75):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Roughness'].default_value=roughness
 return m
stone=material('Slate',(0.15,.21,.20));moss=material('Moss',(.20,.35,.08));gold=material('Young growth',(.48,.57,.16));stem=material('Fern stem',(.13,.22,.05))
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1,location=(0,0,0))
rock=bpy.context.object;rock.name='Mossy river stone';rock.scale=(1.3,.9,.65)
for vertex in rock.data.vertices:vertex.co*=1+random.uniform(-.09,.09)
rock.data.materials.append(stone)
bevel=rock.modifiers.new('Soft worn edges','BEVEL');bevel.width=.05;bevel.segments=3
for i in range(44):
 a=random.uniform(0,math.tau);r=random.uniform(.1,.85);x=math.cos(a)*r;y=math.sin(a)*r*.65
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.06,.16),location=(x,y,.57-r*.13))
 ob=bpy.context.object;ob.scale.z=.30;ob.data.materials.append(moss if i%3 else gold)
for j in range(6):
 angle=j*.8;origin=Vector((-.35+j*.10,.05,.57))
 for i in range(7):
  u=i/7;z=.05+u*.55;spread=math.sin(u*math.pi)*.19+.02
  for side in [-1,1]:
   bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=1,location=origin+Vector((side*spread*math.cos(angle),side*spread*math.sin(angle),z)))
   leaf=bpy.context.object;leaf.scale=(.15*(1-u*.6),.035,.014);leaf.rotation_euler=(0,side*.3,angle);leaf.data.materials.append(gold if i>4 else moss)
bpy.ops.object.camera_add(location=(3.6,-5.2,3.0));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.3))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.6;bpy.context.scene.camera=camera
for location,power,size in [((1,-3,5),650,4),((-3,1,2),400,3)]:
 bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.world.color=(.15,.15,.15)
# Animate a small turntable camera move so exported views are visibly different.
for frame,x in [(1,3.6),(12,2.8),(24,2.0)]:
 camera.location.x=x;camera.rotation_euler=(Vector((0,0,.3))-camera.location).to_track_quat('-Z','Y').to_euler();camera.keyframe_insert(data_path='location',frame=frame);camera.keyframe_insert(data_path='rotation_euler',frame=frame)
