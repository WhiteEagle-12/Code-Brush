# Code-Brush

**An agent-facing toolkit for editable animation production.**

Give an agent this repository and `AGENTS.md`. It can create project files, build layered artwork and characters, animate shots, render selected frames, inspect contact sheets, and produce an MP4. It can also extend the renderer through ordinary JavaScript.

The toolkit is independent of the example bear and does not prescribe an art style. Version **0.2** provides working 2D production primitives; it is **not yet a complete feature-film production suite** or a guarantee of animation quality.

## Install and try

Requires Node.js 20+ and FFmpeg for video output.

```sh
npm ci
node src/cli.mjs init examples/my-film.json
node src/cli.mjs inspect examples/my-film.json
node src/cli.mjs preview examples/my-film.json
node src/cli.mjs render examples/my-film.json --out output/my-film.mp4
```

## Implemented

- Layered scene graph, editable SVG-style paths, gradients, transforms, clipping and blend operations.
- Seeded pressure-sensitive brush strokes.
- Exposure sheets and replacement drawings for frame-by-frame animation and pose substitutions.
- Raster artwork, sprite-sheet crops and image sequences.
- Numeric, object and compatible-path keyframe interpolation.
- Hierarchical skeletal rigs, two-bone IK, weighted skinning and textured triangle meshes.
- Scene and shot tracks, camera animation and local shot timing.
- A custom-renderer interface for arbitrary Canvas-based drawing and effects.
- CLI project creation, property editing, keyframe insertion, validation and pose inspection.
- Headless frame, contact-sheet and H.264 video output.
- Local shot inspector with frame stepping and rig guides.
- Multitrack audio trimming, offsets, fades, mixing and limiting through FFmpeg.
- Optional rendering of an existing `.blend` file using an installed Blender executable.

## Examples

```sh
# Brush work, path morphing and mesh deformation
node src/cli.mjs render examples/drawing-lab.json --out output/drawing-lab.mp4
# A quadruped rig blockout in two rendering treatments
node src/cli.mjs frame examples/quadruped-study.json --time 2 --guides --out output/rig.png
node src/cli.mjs frame examples/ink-study.json --time 2 --out output/ink.png
# The earlier 10-second bear production, using its original custom renderer
node examples/legacy-bear/src/cli.mjs render
```

The quadruped studies are technical blockouts, not anatomical validation or finished film art. The legacy film demonstrates a specific puppet workflow; it is preserved as an example, not used as the architecture of the general toolkit.

## An agent's iteration loop

```sh
node src/cli.mjs key examples/my-film.json --node subject --property x --time 2 --value 650
node src/cli.mjs inspect examples/my-film.json --time 2 --node subject
node src/cli.mjs frame examples/my-film.json --time 2 --out output/pose.png
node src/cli.mjs contact examples/my-film.json --out output/review.png
npm test
node src/cli.mjs render examples/my-film.json --out output/final.mp4
```

See [AGENTS.md](AGENTS.md) for the production workflow and [the project format](docs/PROJECT_FORMAT.md) for every supported node and track.

## Different styles and realism

Artwork and rendering methods are replaceable. Ink, flat-color illustration, painted raster layers, replacement drawings and custom effects can share the same shot structure. The engine does not supply anatomical knowledge, reference drawings, automatic inbetweening or film direction; the authoring agent must provide them.

For photorealistic 3D, the current Blender command is only a launcher for an existing authored `.blend` project:

```sh
node src/cli.mjs blender scene.blend --start 1 --end 240 --out output/frame_
```

It is **not** a shared 3D authoring backend yet. Blender was not installed in the validation environment, so that integration has not been render-tested. Building a full common authoring layer, sophisticated deformation, constraint limits, curve editors and production asset/version management remains future work.

## Reproducibility and licensing

MIT-licensed source. The native renderer uses `@napi-rs/canvas`; FFmpeg handles encoding and audio. No hosted model service or API key is needed to render the bundled projects. Custom plugins must sample absolute time and use seeded randomness.

The legacy film's generated background and original synthesized audio are bundled with their provenance. See its `docs/art-direction.md`. Tests cover transforms, timing, skinning, IK, drawing substitutions, mesh texturing and deterministic random-access rendering.
