# Validation

The initial Code-Brush 0.2 implementation was verified with:

- 21 passing tests across the general engine and preserved legacy demo.
- Keyframe interpolation, held boundaries, matrix inversion, bone ordering, cycle detection, skinning, IK, topology, local shot timing, source immutability and prototype-path rejection.
- Pixel tests for replacement drawings, raster triangle mapping and deterministic rendering after arbitrary seeks.
- A textured-triangle seam found by the pixel test was corrected with clip-edge overlap. Translucent textures can still show overlap artifacts; an offscreen premultiplied mesh compositor remains future work.
- CLI project creation, key insertion and evaluated node inspection.
- HTTP smoke checks of the shot inspector and a rendered PNG endpoint.
- An encoded 4-second H.264 drawing-lab animation exercising brush strokes, compatible path morphs and mesh vertex deformation.
- Visual inspection of the drawing lab and rig blockout frames. Rig blockouts are not anatomical or artistic quality benchmarks.

The full browser UI was not interaction-tested. Blender was not installed, so the optional existing-file Blender launcher was not render-tested. Those limitations must not be represented as completed backend validation.
