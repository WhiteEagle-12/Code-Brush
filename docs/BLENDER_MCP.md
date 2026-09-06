# Headless Blender MCP

Code-Brush uses the [sandraschi/blender-mcp](https://github.com/sandraschi/blender-mcp) backend, pinned to `78f73ce8668f7fcbc92028dc476b9e1e35b521d6`. Its `script_execute` tool starts Blender in background mode. This is a different transport from GUI add-on servers that require an already-open Blender application.

## Setup

1. Install Node 20+, FFmpeg, Git, uv and Blender 4.5.
2. Run `npm ci` and `bash scripts/setup-blender-mcp.sh` from this repository.
3. Copy the entries in `mcp/config.example.json` into your agent's MCP configuration and replace every `/absolute/path` value. Host applications differ in where they store that configuration.
4. Restart/reload the MCP client. Call `capabilities`, then `blender_tools`.

The Python dependencies live in `.runtime/venv`. `BLENDER_EXECUTABLE` identifies the actual Blender executable. `BLENDER_MCP_COMMAND` identifies the upstream MCP server executable. Optional `BLENDER_MCP_ARGS` is a JSON array of command arguments. `CODE_BRUSH_NODE` can select a specific Node executable. Python 3.11+ is recommended.

The release was exercised with Blender 4.5.1, FastMCP 3.4.7 and MCP Python 1.29.1 on Linux. `scripts/verify-mcp.py` launches Code-Brush over stdio, discovers the upstream server, authors and renders an asset, and encodes its 2D composite. The setup shell script targets Unix systems.

## Author an asset

Call `blender_asset` with:

```json
{
  "project": "/absolute/path/film.json",
  "asset_id": "rock",
  "code": "import bpy\nbpy.ops.object.camera_add(location=(0, 0, 6))\nbpy.context.scene.camera=bpy.context.object\nbpy.ops.mesh.primitive_ico_sphere_add()",
  "blend_file": "/absolute/path/source/rock.blend",
  "frames_directory": "/absolute/path/passes/rock",
  "frames": [1, 2, 3],
  "fps": 24,
  "width": 512,
  "height": 512,
  "samples": 32
}
```

The camera in this minimal example faces down its local negative Z axis. A more developed asset recipe is provided in `examples/blender/moss-rock.py`. Pass its contents as `code`.

An existing source file is opened before your code executes. Keep incremental authoring code idempotent or deliberately update existing objects. The tool saves a `.blend` before rendering; each requested Blender frame becomes one sequential imported image. `fps` is both Blender's configured frame rate and the playback rate of the imported sequence. Sparse frame selection does not preserve gaps: `[1,12,24]` plays as three consecutive images. Request consecutive frames for normal real-time animation, or set the sequence playback rate intentionally.

The result includes `import.node`. Add this image node to your project using a revision-checked `project.edit`; set position, dimensions, offset and loop as appropriate. Imported PNGs are copied to the project's asset directory and tracked by hash. Keep the returned `.blend` source alongside your production for future edits.

## Full Blender access

`blender_tools` returns the live upstream schemas (71 tools in the tested revision). `blender_call` accepts `tool` and `arguments` and forwards them. The upstream response is preserved, including any tool-specific success/error payload. Agents should inspect that payload.

`script_execute` exposes Blender Python: meshes, curves, geometry nodes, armatures, shape keys, animation, materials, lighting, cameras, compositing and render engines. Use it for capabilities beyond the transparent asset helper, including photorealistic full-scene rendering or GPU configuration. Save persistent work with `bpy.ops.wm.save_as_mainfile` and reopen with `bpy.ops.wm.open_mainfile` in the next call: each upstream session is independent.

The convenience asset helper deliberately selects CPU Cycles and RGBA PNG for reliable headless asset extraction. It is not the only supported rendering route. The pinned upstream script tool has a roughly 300-second execution timeout: render expensive or long sequences in small batches, or launch/manage a dedicated render process through authored Blender code. Code-Brush's 2D render cache does not resume interrupted Blender renders automatically.
