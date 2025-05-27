import bpy, os, re

def get_all_objects_in_collection(collection):
    objs = list(collection.objects)
    for child in collection.children:
        objs.extend(get_all_objects_in_collection(child))
    return objs

def get_base_name(name):
    # Example: strip trailing dot-number suffixes like ".001", ".002"
    # So "shack.001" -> "shack"
    match = re.match(r"(.+?)(\.\d+)?$", name)
    if match:
        return match.group(1)
    return name

def generate_spawn_points():
    empty_parent_collection_name = "SPAWN_POINTS"

    # Create or get the SPAWN_POINTS collection
    if empty_parent_collection_name not in bpy.data.collections:
        empty_col = bpy.data.collections.new(empty_parent_collection_name)
        bpy.context.scene.collection.children.link(empty_col)
    else:
        empty_col = bpy.data.collections[empty_parent_collection_name]

    # Clear existing empties
    for obj in list(empty_col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    vis_collections = [col for col in bpy.data.collections if col.name.lower().startswith("vis")]
    if not vis_collections:
        print("No collections starting with 'vis' found.")
        return

    created_count = 0

    for col in vis_collections:
        category = col.name[3:]  # Strip 'vis' prefix
        print("CATEGORY" + category)
        all_objects = get_all_objects_in_collection(col)
        print(f"Found {len(all_objects)} objects in collection '{col.name}'")

        for obj in all_objects:
            if obj.type == 'EMPTY' and obj.instance_collection:
                empty = bpy.data.objects.new(f"s_{obj.name}", None)
                empty.empty_display_type = 'ARROWS'
                empty.empty_display_size = 0.5
                empty.location = obj.location
                empty.rotation_euler = obj.rotation_euler
                empty.scale = obj.scale

                # Copy custom properties except Blender internals
                for key in obj.keys():
                    if key not in "_RNA_UI":
                        empty[key] = obj[key]

                # Add category and base_name user data
                empty["category"] = category
                empty["baseName"] = get_base_name(obj.name)

                empty_col.objects.link(empty)
                created_count += 1

    print(f"✅ Cleared SPAWN_POINTS and created {created_count} spawn point empties with category & base_name.")

generate_spawn_points()
