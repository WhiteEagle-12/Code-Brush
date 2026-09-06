# Code-Brush

**An open-source animation production harness for agents.**

Give an agent this repository and [AGENTS.md](AGENTS.md). It can author editable 2D films, reuse characters, animate poses and drawings, review shots, manage revisions, mix audio, and render final video. When a production needs 3D assets, its MCP server delegates authoring to **headless Blender MCP**, saves `.blend` sources, and imports transparent rendered passes into the 2D timeline.

Version **1.0.0** includes the production API, MCP server, local editing studio and Blender asset pipeline. Artistic quality depends on the assets, animation and direction supplied by the agent. The harness supports different styles; it does not automatically produce feature-film-quality character animation from a prompt.

## Start a 2D production

Requires Node.js 20+ and FFmpeg on PATH.

```sh
npm ci
node src/cli.mjs init examples/my-film.json
npm run studio -- examples/my-film.json
```

The local studio provides a scene tree, shot navigation, frame stepping, onion skins, rig guides, property/keyframe editing, JSON node editing, validation and revision restore. Preview speed depends on frame rendering; use encoded video to assess real-time motion and sound.

Agents use JSON requests over stdin or the same operations through MCP:

```sh
printf '%s\n' '{"method":"project.read","args":{"project":"examples/my-film.json"}}' | npm run --silent agent
printf '%s\n' '{"method":"film.render","args":{"project":"examples/my-film.json","output":"output/film.mp4"}}' | npm run --silent agent
```

See [the production API](docs/PRODUCTION.md) for transactions, reusable characters, render jobs and complete examples. Use this API for production editing and rendering; the original CLI remains available for standalone examples.

## Give the agent Blender

Install Blender 4.5 and [uv](https://docs.astral.sh/uv/), then run:

```sh
bash scripts/setup-blender-mcp.sh
```

Configure your agent with [mcp/config.example.json](mcp/config.example.json), replacing its absolute paths. Code-Brush runs its own MCP server and starts the pinned upstream headless Blender MCP as a child process. No Blender GUI session or add-on socket is needed for this backend.

- `blender_tools` discovers upstream tools and schemas.
- `blender_call` forwards an upstream tool call for modeling, materials, rigs, animation and rendering.
- `blender_asset` opens or creates a `.blend`, executes Blender Python through MCP, saves the source, renders transparent Cycles passes, and imports them as a 2D sequence.

[Blender setup and workflow](docs/BLENDER_MCP.md) explains persistence, frame timing and render settings. Direct Blender tools remain available for full 3D films, GPU rendering and other passes.

## Production tools

- Layered paths, gradients, pressure-sensitive brushes, raster artwork, replacement drawings and exposure sheets.
- Keyframes, cubic Bézier timing, shot-local tracks and animated cameras.
- Skeletal rigs, weighted skinning, two-bone IK, longer CCD chains, joint limits, gaze and rotation constraints.
- Additive facial poses, mesh shape keys, lattice deformation, alpha masks and isolated compositing.
- Reusable character files with namespaced nodes, assets, drawings and tracks.
- Atomic revision-checked edits, snapshots, restore and content-addressed asset imports with provenance.
- Deterministic frame inspection, contact sheets, resumable frame caches and background render jobs.
- H.264 MP4, transparent PNG sequences, ProRes 4444 alpha video and multitrack audio.
- Local JavaScript renderer extensions for project-specific drawing and effects.

Read [the scene format](docs/PROJECT_FORMAT.md) and [the production extensions](docs/PRODUCTION.md). Project plugins and Blender Python are trusted executable authoring code; run projects you trust.

## Examples and verification

```sh
npm test
npm run verify:production
npm run demo
node src/cli.mjs frame examples/quadruped-study.json --time 2 --guides --out output/rig.png
# With the Blender MCP environment configured:
.runtime/venv/bin/python scripts/verify-mcp.py
```

The Blender integration test builds a moss-covered rock with a fern, saves its source, renders three transparent frames through actual MCP, composites a six-frame video and verifies cache reuse. The production smoke test checks studio HTTP endpoints, audio/video encoding and alpha export. Unit tests cover editing, deformation, timing, revision conflicts and rendering.

`examples/legacy-bear` preserves the earlier ten-second bear film. It is a specific puppet production. The quadruped studies are rig blockouts; neither establishes anatomical accuracy or a feature-film quality benchmark. The new [Through the Falls](examples/through-the-falls) production contains a ten-second bear-and-waterfall scene with entirely code-authored artwork, original sound and a reproducible render workflow.

## License

MIT source. Rendering bundled 2D projects requires no model API or hosted service. Blender and the upstream MCP retain their own licenses. Generated legacy artwork and original synthesized audio carry provenance in `examples/legacy-bear/docs/art-direction.md`.
