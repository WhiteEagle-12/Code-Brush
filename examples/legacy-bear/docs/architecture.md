# Architecture

## Frame contract

`render(ctx, t)` is pure with respect to time: any frame can be requested in any order. Geometry textures may be cached, but animation state is never integrated across render calls. Particle positions use seeded indices and absolute time. This is essential for scrubbing, render retries and parallel rendering integrations.

The scene operates in a 1920×1080 coordinate system and scales into the destination canvas. Camera transforms apply around world coordinates. Screen-space titles and vignette are applied afterward.

## Character performance

The bear is a layered 2D vector puppet. Static part textures are rendered once from editable Bézier shapes with seeded fur strokes, then reused. Moving limbs use two-bone IK with near/far depth ordering. Feet use a distance-driven stance phase so root translation is canceled by the foot offset during ground contact; the swing phase raises and advances the paw. Head tilt, reaching, ducking and wetness are manifest tracks. Blinks, the droplet recoil, breathing and resolve accent are absolute-time procedural acting.

To replace the character, provide a drawing function with the same scene-level interface or modify the scene's pose adapter. The core IK and track sampler do not depend on the bear.

## Composition order

Background → pool highlights → rear waterfall ribbons/spray → motes → contact shadow → bear layer → world-space water occlusion → foreground waterfall → contact splashes → mist → foreground plants → screen treatment.

The waterfall mask is a physical screen region, not a time-based whole-character fade. As the bear travels right, its muzzle, head, body and trailing limbs become occluded in sequence. The walking plane descends slightly into the shallow water beyond the ledge.

## Render

The Node CLI loads the same scene as the browser, renders RGBA frames using Skia through `@napi-rs/canvas`, and streams them directly into FFmpeg. FFmpeg encodes H.264 yuv420p with an AAC soundtrack. No intermediate PNG sequence is needed. `frame` and `contact` are separate inspection commands.

## Current limits

- The sample renderer is 2D cutout/vector animation with painted textures, not frame-by-frame redraw animation.
- The scenery is a static generated painting. Water and foreground effects animate independently on top.
- Camera motion is authored in the sample scene; it is not yet a general camera-track editor.
- The studio supports the sample numeric track schema. It does not save to disk automatically: export JSON and replace the manifest.
- The CLI accepts custom manifests; the studio loads them through `--film`, provided they live inside this project.
- The manifest's `audio` values are descriptive in v0.1. Sound mixing levels are authored in the synthesis script; changing those JSON fields alone does not remix audio.
- The bundled audio synthesis script targets the included film. Other films can use any matching WAV.
- Pixel equality is tested within one runtime. Browser and native font rasterization can differ, especially for titles.
- There is no Synfig/OpenToonz adapter, drawing GUI, automatic lip-sync, model-based motion generation or asset marketplace.
