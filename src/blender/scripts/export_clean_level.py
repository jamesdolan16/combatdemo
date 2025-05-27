import bpy
import os

# === Helper Functions ===
def find_layer_collection(layer_coll, name):
    """Recursively find a layer collection by name"""
    if layer_coll.name == name:
        return layer_coll
    for child in layer_coll.children:
        result = find_layer_collection(child, name)
        if result:
            return result
    return None

def exclude_vis_collections(view_layer):
    """Exclude all collections starting with 'vis' from the view layer"""
    for collection in bpy.data.collections:
        if collection.name.startswith("vis"):
            lc = find_layer_collection(view_layer.layer_collection, collection.name)
            if lc:
                lc.exclude = True

def restore_vis_collections(view_layer):
    """Restore excluded collections after export"""
    for collection in bpy.data.collections:
        if collection.name.startswith("vis"):
            lc = find_layer_collection(view_layer.layer_collection, collection.name)
            if lc:
                lc.exclude = False

def export_clean_glb():
    view_layer = bpy.context.view_layer

    # Exclude vis* collections
    exclude_vis_collections(view_layer)

    # Get .blend filename without extension
    blend_name = os.path.basename(bpy.data.filepath)
    base_name, _ = os.path.splitext(blend_name)

    # Build export path
    export_path = os.path.join(bpy.path.abspath("//../../public/"), f"{base_name}.glb")

    # Export
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        use_selection=False,
        use_visible=True,
        export_apply=True,
        export_animations=True,
        export_extras=True,
    )

    print(f"✅ Exported: {export_path}")

    # Restore vis collections (optional)
    restore_vis_collections(view_layer)

try:
    if "generate_spawn_points" in bpy.data.texts:
        namespace = {}
        exec(bpy.data.texts["generate_spawn_points"].as_string(), namespace)
        namespace["generate_spawn_points"]()
        print("✅ Spawn points generated.")
        export_clean_glb()
        print("✅ Exported clean level.")
    else:
        print("⚠️ Could not find script 'generate_spawn_points' in bpy.data.texts.")
except Exception as e:
    print("⚠️ Failed to export clean level:", e)

