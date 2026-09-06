# Project format, version 1

A project declares `version`, `width`, `height`, `fps`, `duration`, `nodes`, and optional `assets`, `drawings`, `tracks`, `shots`, `camera`, `audioTracks`, `plugin` and `background`.

All times are seconds. Transforms use pixels and **degrees**. Coordinates are local to the parent. Node IDs are unique across the live node tree, including skeleton slots. Drawing-library entries have their own local IDs and are selected through exposures; animate the enclosing drawing node or replace its drawing.

## Common node fields

`id`, `type`, `x`, `y`, `rotation`, `scale`, `scaleX`, `scaleY`, `pivot: [x,y]`, `opacity`, `visible`, `start`, `end`, `blend`, `clip`, `blur`, and `shadow: {color,blur,x,y}`.

Clip accepts an SVG path string or command array in local coordinates. Blend is a Canvas composite-operation name. Group opacity is applied per child; groups are not isolated compositing buffers.

## Node types

| Type | Fields |
|---|---|
| group | `children` |
| path | `d` SVG string or `commands`, `fill`, `stroke`, `strokeWidth`, `dash`, `fillRule` |
| ellipse | `rx`, `ry`, fill/stroke |
| rect | `width`, `height`, fill/stroke |
| image | `asset`, `width`, `height`, optional `crop: [x,y,w,h]` |
| image sequence | image node with `frames: [assetId,...]`, `fps`, `offset`, `loop` |
| text | `text`, `font`, `align`, `baseline`, `fill` |
| brush | `points: [[x,y,pressure],...]`, `size`, `color`, `flow`, `spacing`, `scatter`, `grain`, `seed`, `roundness`, `angle` (radians) |
| drawing | `drawing` and optional `exposures: [{start,end,drawing}]` |
| mesh | `vertices`, `uv` (source image pixels), `triangles`, `asset`, optional `offsets`; fill/stroke when untextured |
| skeleton | `bones`, `bindBones`, `slots`, `ik` |
| custom | `renderer` plus arbitrary fields for a local JavaScript plugin |

A fill is a color string or `{type: 'linear', from: [x,y], to: [x,y], stops: [[0,color],[1,color]]}`. Radial fills use `type: 'radial', x, y, radius, stops`.

Commands are arrays such as `[['M',0,0],['C',20,-30,80,-30,100,0],['L',50,60],['Z']]`. Supported commands: M, L, C, Q, Z. A path string remains fully editable as SVG syntax, but continuous morphing requires command arrays with identical topology.

## Tracks and shots

```json
{"target":"head","property":"rotation","keys":[[0,0],[1.5,-12,"smooth"],[2,8,"out"]]}
```

The property may be nested, e.g. `bones.0.rotation` or `ik.0.target`. Values can be numeric, arrays or objects; nonnumeric values hold until the destination keyframe. The destination key defines easing: linear, smooth, smoother, in, out, hold. All keys must have strictly increasing finite timestamps.

Shots are contiguous `{id,start,end,camera,tracks}` entries covering the film. Project tracks apply first, then the active shot's tracks. A shot track with `local: true` samples relative to the shot start. `target: 'camera'` animates `x`, `y`, `zoom` or `rotation`.

## Skeletal animation

```json
{
 "id":"arm", "type":"skeleton",
 "bones":[
  {"id":"upper","x":100,"y":100,"length":80,"rotation":0},
  {"id":"lower","parent":"upper","x":80,"y":0,"length":60,"rotation":0}
 ],
 "ik":[{"root":"upper","child":"lower","target":[190,160],"bend":1}],
 "slots":[{"bone":"upper","node":{"id":"upperArt","type":"rect","width":80,"height":20,"fill":"#865"}}]
}
```

Bones point along their local +X axis. Child origins are usually at the parent's tip. IK targets are in skeleton coordinates; root and child must be a two-bone chain with positive lengths. Use bone lengths and drawing geometry appropriate to the character. Joint-angle limits and general multi-chain constraint solving are not implemented yet.

A mesh slot can use `skin: [[{bone:'upper',weight:1}], ...]` instead of a bone attachment. `bindBones` supplies the unposed skeleton; weighted inverse-bind transforms deform the mesh vertices. Weights are normalized per vertex. A vertex with no weights retains its original position.

## Artwork and custom rendering

`assets` maps IDs to local file paths relative to the project JSON. Image sequences reference those IDs. `drawings` maps drawing names to arrays of nodes. Exposure ranges are start-inclusive and end-exclusive; the last matching exposure wins.

`plugin: './my-renderers.mjs'` loads a trusted JavaScript module exporting a default map of functions. Custom nodes specify one of those functions with `renderer`. This is the escape hatch for procedural effects, specialized painting, simulation caches and other renderers. Keep outputs deterministic at a given time.

## Audio

```json
{"audioTracks":[
 {"file":"music.wav","start":0,"gain":0.4,"duration":10,"fadeIn":0.2,"fadeOut":1},
 {"file":"splash.wav","start":7.4,"trim":0.1,"gain":0.8}
]}
```

FFmpeg trims, offsets, fades, mixes and limits the tracks. `duration` is needed for a fade-out. A simple `audio: 'soundtrack.wav'` is also supported. There is no speech generation or automatic lip-sync.
