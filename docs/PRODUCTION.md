# Agent production API

Run `node src/agent-cli.mjs` with one JSON request on stdin. The response is `{ok:true,result}` or `{ok:false,error}`. Through MCP, call `production` with the same `method` and `args`; `capabilities` describes available methods. Paths should be absolute for MCP calls; asset paths inside a project resolve relative to that project.

## Create, read and edit

`project.create` accepts `project` and optional `definition` in the scene format. It refuses to overwrite an existing file. `project.read` returns `{project,revision,file}`. Pass that revision as `expectedRevision` when editing:

```json
{
  "method": "project.edit",
  "args": {
    "project": "/production/film.json",
    "expectedRevision": "COPY_THE_HASH_FROM_PROJECT_READ",
    "operations": [
      {"op":"add","node":{"id":"bear","type":"group","children":[]}},
      {"op":"set","target":"bear","property":"x","value":100},
      {"op":"key","target":"bear","property":"x","time":0,"value":100,"ease":"linear"},
      {"op":"key","target":"bear","property":"x","time":2,"value":600}
    ]
  }
}
```

Edits are atomic batches. An exclusive lock prevents concurrent writes, stale revisions fail explicitly, and validation runs before saving. Re-read after a conflict and reconcile the new state. `set` uses dotted properties; `target` is a live source node ID, `camera`, or `project`. `add` accepts optional `parent`. `remove` deletes a node, descendants and their scene/shot tracks. `replace` with a full project `value` supports whole-document transactions. Shot tracks can be edited by setting their project property path.

`project.revisions` lists stored snapshots; `project.restore` takes `revision` and the current `expectedRevision`. Snapshots are project JSON, not a replacement for Git or backups of external files. Locks are `<project>.lock` directories; after an interrupted writer, verify that it has stopped before removing a stale lock.

## Assets and characters

`asset.import` takes `project,id,source,kind,provenance`, or `files` for an ordered image sequence plus `fps`. Accepted kinds are `image`, `sequence`, `audio`, and `blend`. Source bytes are copied under `assets/<sha256>.<extension>`. Metadata records source provenance, hash and size. Sequences return a ready-to-add `node`. For audio, use the returned record's `path` as `audioTracks[].file`. The importer records audio and `.blend` sources without trying to decode them as images.

`character.save` takes `project,node,output`. It exports that subtree, associated scene tracks, drawings and referenced project image assets to a reusable character JSON file. Asset paths are rewritten relative to the character file. Shot tracks remain in the film.

```json
{
  "characters":{"bear":"characters/bear.json"},
  "nodes":[
    {"id":"first","type":"instance","character":"bear","x":100},
    {"id":"second","type":"instance","character":"bear","x":700,"timeOffset":1}
  ]
}
```

The production loader expands instances and namespaces child IDs, drawings and assets (`first.face`, for example). Instance transforms apply to the character as a whole. Inherited character tracks run before film tracks, so film tracks can override them. Edit shared child structure in its character source; set film tracks through project properties when their targets exist only after expansion. `timeOffset` shifts inherited keyframe times; it does not retime replacement-drawing exposures. Nested character instances are not recursively resolved.

## Poses, deformation and constraints

Any evaluated node can have additive poses:

```json
{"poses":{"smile":{"rotation":8,"scaleY":-0.1}},"poseWeights":{"smile":0.75}}
```

Set base values (`rotation:0, scaleY:1` here), then animate `poseWeights.smile`. Pose values are numeric deltas, including matching numeric arrays. They combine after ordinary property tracks. Topology must match.

Meshes support `shapeKeys:{name:[[dx,dy],...]}` and `shapeWeights:{name:0.5}`. A lattice uses `columns,rows,bounds:[x,y,width,height],offsets:[[dx,dy],...]`, with `(columns+1)*(rows+1)` controls in row-major order. Shape deltas apply first, then bilinear lattice offsets, then per-vertex `offsets`.

Skeleton `constraints` are evaluated after the legacy two-bone `ik` list:

```json
[
  {"type":"ik","chain":["upper","lower","paw"],"target":[180,230],"iterations":64,"weight":1},
  {"type":"lookAt","bone":"head","target":[250,80],"weight":0.6},
  {"type":"copy","bone":"ear","source":"head","offset":5,"weight":0.4}
]
```

Chain IDs are ordered root to tip. Targets use skeleton-local coordinates. Bone `limits:[min,max]` restrict local rotation in degrees. Constraints run in list order and can be disabled. CCD is iterative; unreachable targets and limits can leave residual error. Inspect contact poses, especially under scaled parent bones.

Keyframe easing may be a named easing or `{type:"bezier",x1:0.42,y1:0,x2:0.58,y2:1}`. Control X values should stay within 0–1. Set `isolated:true` on groups for unified opacity; attach a `mask` node for alpha masking, optionally `invertMask:true`. This is raster compositing at output resolution.

## Inspect and render

| Method | Arguments beyond `project` |
|---|---|
| `project.validate` | none; loads and checks referenced assets |
| `pose.inspect` | `time`, optional `node`; returns evaluated properties |
| `frame.render` | `time`, optional `width,output,onion,guides,transparent` |
| `contact.render` | `output`, optional `times,width` |
| `film.render` | optional `output,width,startFrame,endFrame,transparent,jobFile` |

`frame.render` returns base64 PNG when `output` is omitted. Mark full-scene painted backgrounds `role:"background"` to exclude them from onion ghosts. `pose.inspect` returns evaluated source properties; use rendered guides to inspect constraint-solved bone positions.

Film frame ranges are zero-based, start-inclusive and end-exclusive. Output width must be even. H.264 is the default; transparent video requires `.mov` and uses ProRes 4444. Omit output to render a PNG sequence without encoding. The result includes its frame directory, job file and cache statistics.

Caches under `.codebrush/cache` include compiled project content, image bytes, plugin bytes, declared `dependencies`, renderer version and output settings. Declare any files loaded indirectly by plugins in `dependencies`. Plugins must be deterministic functions of absolute time. Re-running a job reuses completed PNGs; delete damaged cached frames to regenerate them. Audio is mixed freshly on each encoding pass; shot-range rendering trims the mix to match its video interval.

MCP `start_render(project,output,width,transparent)` returns immediately with `job_file`. Poll `render_status(job_file)` for queued/rendering/encoding/complete/failed state. The worker survives the MCP connection. These jobs cover Code-Brush's 2D composition and encoding; Blender asset jobs are separate.

## Review

Run `npm run studio -- /production/film.json [port]` for local editing. The studio uses the same revision-checked API. It is a property/keyframe and JSON editor, with onion skins and frame stepping, rather than a freehand drawing application or graphical Bézier curve editor. Author complex artwork as editable paths/drawings, imported images or Blender assets. Playback here is frame inspection; review the encoded film for final timing and sound.
