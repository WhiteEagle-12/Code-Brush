# Verification of the included film

- Final MP4: 1920×1080, 24 fps, 240 frames, duration 10.000 seconds.
- Video codec: H.264, yuv420p; fast-start enabled.
- Audio: AAC, stereo, 48 kHz; integrated loudness approximately -18.1 LUFS.
- Six tests passed: track sampling, seeded randomness, reachable IK, degenerate IK, shot-gap validation and pixel-identical random-access rendering.
- Inspected eight frames extracted from the encoded final film across all three shots, including the cold recoil and waterfall entry.
- Preview server smoke check: HTML, active-film manifest and scene module returned HTTP 200.
- Browser module syntax checked. Full browser interaction was not verified: the session browser blocked localhost access.
- A clean `npm ci` completed using the bundled lockfile.
