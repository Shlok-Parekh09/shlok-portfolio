import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'diamond satellite.blend'))
data=[]
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  points=[o.matrix_world@Vector(v) for v in o.bound_box]
  data.append(dict(name=o.name,vertices=len(o.data.vertices),min=[min(p[i] for p in points) for i in range(3)],max=[max(p[i] for p in points) for i in range(3)],materials=[m.name for m in o.data.materials if m]))
print('DIAMOND',json.dumps(data))
print('IMAGES',[(i.name,i.filepath,bool(i.packed_file)) for i in bpy.data.images])
