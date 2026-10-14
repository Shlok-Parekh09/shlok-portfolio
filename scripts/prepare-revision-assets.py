import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
out=root/'public/portfolio/models';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'diamond satellite.blend'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
center=Vector([(min(p[i] for p in points)+max(p[i] for p in points))/2 for i in range(3)])
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
 o.select_set(True);o.location-=center
 if not len(o.data.materials):
  m=bpy.data.materials.new('White silver diamond crown');m.use_nodes=True
  n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(.85,.87,.90,1);n.inputs['Metallic'].default_value=.35;n.inputs['Roughness'].default_value=.32;o.data.materials.append(m)
bpy.ops.export_scene.gltf(filepath=str(out/'diamond-satellite.glb'),export_format='GLB',use_selection=True,export_animations=False)
bpy.ops.wm.read_factory_settings(use_empty=True)
src=root/'evidence/pikachu-source';fbx=next((src/'source').glob('*.fbx'))
bpy.ops.import_scene.fbx(filepath=str(fbx))
for image in bpy.data.images:
 path=src/'textures'/Path(image.filepath.replace('\\','/')).name
 if path.exists():image.filepath=str(path);image.reload();image.pack()
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  for m in o.data.materials:
   if m and m.use_nodes:
    for node in m.node_tree.nodes:
     if node.type=='BSDF_PRINCIPLED':node.inputs['Metallic'].default_value=0;node.inputs['Roughness'].default_value=.8
bpy.ops.export_scene.gltf(filepath=str(out/'pikachu-dancing.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True)
print('ASSETS_READY',[(p.name,p.stat().st_size) for p in out.glob('*.glb')])
