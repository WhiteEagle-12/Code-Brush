# Working with Code-Brush

This repository is an animation production toolkit. The examples are replaceable projects, not the definition of the engine's capabilities.

## Start here

1. Read README.md, docs/PROJECT_FORMAT.md and docs/PRODUCTION.md.
2. Install dependencies with `npm ci`. FFmpeg must be on PATH for video. Use docs/BLENDER_MCP.md to configure headless Blender MCP when 3D assets are needed.
3. Create a film with `node src/cli.mjs init examples/my-film.json`.
4. Author the scene's assets, drawings, characters and shot tracks. Use standard JSON nodes or a JavaScript custom-renderer plugin.
5. Run `validate`, inspect important poses with `frame`, and review a `contact` sheet.
6. Render a draft MP4 and inspect motion before finishing the film. Static images cannot verify foot sliding or timing.
7. Run `npm test` after engine changes.

## Production workflow

- Establish character proportions, a palette, line treatment and environment design before animating.
- Block the story in shots, then stage strong readable poses. Build the animatic before adding detail.
- Use replacement drawings for major perspective changes, extreme expressions and foreshortening. Do not stretch one profile drawing into every view.
- Use skeletal IK for contact and articulated motion; weighted mesh skinning for deforming artwork; path morphs only between compatible shapes.
- Use frame-by-frame exposures when interpolation destroys the drawing's intended silhouette.
- For anatomy, use references supplied for the production. This toolkit provides mechanics; it does not infer anatomical correctness.
- Check feet against the ground plane, shoulder/pelvis movement, silhouette, gaze, depth ordering and shot continuity.
- Maintain absolute-time behavior. Do not use Date.now(), unseeded randomness, accumulated particle state or previous-frame-dependent transforms in render code.
- Keep assets local and document their provenance. Do not require a model API to reproduce a completed film.
- Inspect the final encoded output, not only source frames. Record duration, dimensions, sound and any remaining limitations.

## Useful commands

```sh
node src/cli.mjs inspect examples/my-film.json --time 2 --node character
node src/cli.mjs key examples/my-film.json --node character --property rotation --time 2 --value 15
node src/cli.mjs frame examples/my-film.json --time 2 --out output/pose.png --guides
node src/cli.mjs contact examples/my-film.json --out output/review.png
node src/cli.mjs render examples/my-film.json --width 1280 --out output/draft.mp4
```

`--value` takes JSON, so it can be a number, string, array or object. The command modifies the project atomically after validation. Read the current project before changing it; preserve unrelated content.

## Extend without imposing a style

Use a custom node and local plugin for rendering methods the standard nodes do not cover. Export a default object of renderer functions `(context, node, environment, resources)`. They receive the evaluated scene, absolute time, loaded images and canvas platform. Plugins are trusted executable project code, not a sandbox.

Add an independent example and a meaningful test when extending an engine capability. Do not describe a command wrapper or prototype as a mature production backend. For 3D authoring, use the MCP tools blender_tools, blender_call and blender_asset. Persist scenes in .blend files between calls; use transparent passes for 2D composition. The older CLI blender command remains an existing-file launcher.

## Agent interface

Prefer the production MCP or JSON stdin API over the older editing CLI. Read project revisions before edits, batch related operations, handle conflicts explicitly, and preserve unrelated work. Use project.revisions/project.restore for rollback. Use external character files for reusable designs. Render jobs provide resumable caches; inspect the final encoding before delivery. Never equate available rig controls with validated anatomy or a promised art-quality level.
