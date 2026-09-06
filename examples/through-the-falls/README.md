# Through the Falls

A ten-second original 2D bear-and-waterfall scene, made with Code-Brush. Art direction draws on the warm character colors, large wilderness compositions and painted backgrounds of *Brother Bear*.

All visible artwork is authored in JavaScript: the canyon painting, vegetation, bear shapes, fur marks, water ribbons and spray. No image-generation output, downloaded background, tracing or 3D asset is used. The score and Foley are synthesized locally from the included Python source. There is no dialogue.

## Render

From the repository root, install the standard Code-Brush requirements (Node 20+, FFmpeg and `npm ci`). The sound authoring script additionally needs Python, NumPy and SciPy:

```sh
python -m pip install numpy scipy
python examples/through-the-falls/soundtrack.py
printf '%s\n' '{"method":"film.render","args":{"project":"examples/through-the-falls/project.json","output":"output/through-the-falls.mp4","width":1600}}' | npm run --silent agent
```

The sound script writes three stereo WAV stems into the ignored `audio` directory. They are regenerated from a fixed seed. The supplied project mixes them through the harness. Rendering uses the harness production API, dependency-aware cache, scene timing and FFmpeg encoder.

## Edit

- `project.json`: duration, output dimensions, four shot boundaries and audio mix.
- `film.mjs`: staging, camera cuts, performance timing and interaction with the waterfall.
- `bear.mjs`: editable character paths, leg IK, distance-driven planted feet, eye and mouth drawings, head recoil and wet-coat details.
- `environment.mjs`: layered canyon painting, ferns, trees, stream stones, water ribbons and foreground vegetation.
- `paint.mjs`: deterministic drawing helpers and cached high-resolution fur painting.
- `soundtrack.py`: original score, river bed, footsteps, breath and splashes.

The film uses Code-Brush's custom-renderer extension to keep its specialized artwork and animation editable as code. Individual strokes are not exposed as separate studio scene nodes. It is a stylized procedural character production, rather than a frame-by-frame hand-drawn feature-film animation pipeline.

## Shot timing

| Time | Action |
|---|---|
| 0–3.25 s | A young bear follows a stone ledge toward the waterfall. |
| 3.25–5.5 s | A close shot catches his curious look, cold-spray recoil and recovery. |
| 5.5–8.65 s | He resumes walking, lowers his head and enters the falling water. |
| 8.65–10 s | A closer view of the curtain covering his face, ending in a fade. |

No Disney characters, film frames, recordings or soundtrack assets are included. Source is provided under the repository's MIT license.
