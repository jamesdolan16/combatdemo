import bpy

def sync_collection_instance_properties():
    for obj in bpy.context.scene.objects:
        if obj.type == 'EMPTY' and obj.instance_collection:
            parent = obj.instance_collection

            # Parent collection's custom properties
            parent_keys = {key for key in parent.keys() if key != "_RNA_UI"}

            # Add missing properties
            for key in parent_keys:
                if key not in obj.keys():
                    obj[key] = parent[key]

            # Remove properties that no longer exist on the parent
            instance_keys = {key for key in obj.keys() if key != "_RNA_UI"}
            for key in instance_keys:
                if key not in parent_keys:
                    del obj[key]

    print("✅ Clean sync completed: Custom properties copied from collection to instance.")
    

sync_collection_instance_properties()