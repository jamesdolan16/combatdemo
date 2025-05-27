import bpy
import os
from math import floor

# === Settings ===
chunk_size = 10  # Adjust for your world scale
export_dir = bpy.path.abspath("//chunks")  # Relative to current .blend
scene = bpy.context.scene

# Create export dir if needed
if not os.path.exists(export_dir):
    os.makedirs(export_dir)

# === Helper ===
def get_chunk_coords(obj):
    x, y = obj.location.x, obj.location.y
    return floor(x / chunk_size), floor(y / chunk_size)

# === Group objects by chunk ===
chunk_map = {}

for obj in scene.objects:
    if obj.type in {'MESH', 'EMPTY'} and obj.visible_get():
        cx, cy = get_chunk_coords(obj)
        key = f"chunk_{cx}_{cy}"

        if key not in chunk_map:
            chunk_map[key] = []

        chunk_map[key].append(obj)

# === Export each chunk ===
for chunk_name, objects in chunk_map.items():
    # Create a new collection for the chunk
    temp_col = bpy.data.collections.new(name=chunk_name)
    scene.collection.children.link(temp_col)

    for obj in objects:
        temp_col.objects.link(obj)
        for col in obj.users_collection:
            col.objects.unlink(obj)

    # Select all objects in collection
    bpy.ops.object.select_all(action='DESELECT')
    for obj in temp_col.objects:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

    # Export GLB
    export_path = os.path.join(export_dir, f"{chunk_name}.glb")
    bpy.ops.export_scene.gltf(filepath=export_path, use_selection=True, export_format='GLB')

    # Cleanup: remove temp collection
    for obj in temp_col.objects:
        temp_col.objects.unlink(obj)
        scene.collection.objects.link(obj)
    bpy.data.collections.remove(temp_col)

    print(f"Exported {chunk_name} to {export_path}")

print("✅ Done exporting all chunks.")
