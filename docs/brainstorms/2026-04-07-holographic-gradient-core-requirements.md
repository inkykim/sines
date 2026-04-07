---
date: 2026-04-07
topic: holographic-gradient-core
---

# Holographic Gradient Core

## Problem Frame
The current visualizer renders audio-reactive metaballs as flat-colored blobs via marching squares. The scalar field computes smooth continuous values but throws them away with a binary threshold. The result looks like bouncing circles, not the expressive gradient/holographic aesthetic the project is heading toward. This feature replaces the marching-squares renderer with a pixel-buffer gradient field, adds interference fringes for holographic shimmer, and upgrades the 2-color palette to a multi-stop gradient LUT system.

## Requirements

- R1. **Continuous gradient field renderer** — Replace the marching-squares binary threshold in `ballMerge.js` with a pixel-buffer renderer that maps the continuous scalar field values to colors via a gradient lookup table. Each grid cell's field value indexes into the LUT to produce smooth, full-canvas gradient visuals. Render at FIELD_STEP resolution into a `createImage()`/`pixels[]` buffer, upscaled to canvas size.

- R2. **Multi-stop gradient LUT system** — Replace the 2-color base/peak lerp with a gradient lookup table (256 entries). The LUT is generated from user-defined color stops (minimum 2, up to 8). Ship with a default palette tuned for the default song (`pilsplaat.wav`). The palette data structure must be extensible so the theme engine can set it programmatically later (when ML pipeline is in place). Activate the existing unused `rgbToHsl()`/`hslToRgb()` utilities for HSL-space interpolation between stops.

- R3. **Interference fringe overlay** — After the base gradient render pass, apply `sin(fieldValue * frequency + time * speed)` to modulate brightness and/or hue, producing concentric holographic rainbow bands around blob boundaries. Fringe frequency and animation speed are audio-reactive via the routing matrix.

- R4. **Fringe intensity control** — Expose a `fringeIntensity` parameter (0-100%) in AppSettings, controllable via UI. At 0%, no fringes are visible (pure gradient). At 100%, fringes are fully prominent. Default somewhere in the 30-50% range.

- R5. **Extended routing matrix** — Add new routing targets to `AppSettings.routing` for the gradient parameters: at minimum `gradient` (controls gradient spread/intensity) and `fringe` (controls fringe frequency/speed). Follows the existing `{ bass: N, mid: N, treble: N }` weight pattern so users can customize which bands drive which visual parameters.

- R6. **Invisible ball attractors** — Ball physics (bouncing, kick reactions, velocity) continue to drive the scalar field positions. Balls are not rendered directly — the user sees only their influence on the gradient field as moving pools of color.

- R7. **Palette customization UI** — Expose palette color stops in the UI so users can fully customize the gradient. The existing base/peak color pickers can evolve into gradient stop pickers, or a new palette section can be added.

## Success Criteria
- The visualizer produces smooth, full-canvas gradient visuals that react to audio across all three bands
- Interference fringes create visible holographic shimmer that is adjustable from invisible to intense
- The color palette supports more than two colors and interpolates smoothly in HSL space
- Frame rate stays above 30fps at 1080p with 10 balls (current default)
- The old marching-squares renderer is fully removed

## Scope Boundaries
- **Out of scope:** Display mode switching / mode abstraction (we're replacing, not adding alongside)
- **Out of scope:** Theme engine ML integration (palette structure is ready for it, but no ML work here)
- **Out of scope:** WebGL / shader-based rendering (staying in Canvas 2D)
- **Out of scope:** Temporal trail buffer (separate feature, can layer on later)
- **Out of scope:** Sine wave interference field formula swap (separate feature)

## Key Decisions
- **Replace, don't coexist:** The gradient field replaces the marching-squares blob entirely. No display mode toggle needed.
- **Extend routing matrix:** New gradient/fringe parameters plug into the existing `AppSettings.routing` architecture rather than having separate band-mapping UI.
- **HSL interpolation:** Use HSL space for gradient stop interpolation to avoid muddy RGB midpoints. Activates the currently unused utilities.
- **Fully customizable palettes:** No preset-only system. Everything is user-adjustable, with a good default. Theme engine will auto-generate palettes later.

## Dependencies / Assumptions
- The scalar field computation (`fieldValueAt()`, grid caching) is kept as-is — only the rendering pass changes
- `createImage()`/`pixels[]` performance at FIELD_STEP=8 resolution (~240x135 at 1080p) is sufficient for 30fps+ — this assumption should be validated early in implementation
- The existing `rgbToHsl()`/`hslToRgb()` utilities are correct and performant enough for LUT generation (not per-frame, just on palette change)

## Outstanding Questions

### Deferred to Planning
- [Affects R1][Technical] What upscaling method should be used for the low-res pixel buffer? `image()` with default bilinear, or a manual approach?
- [Affects R2][Needs research] What's a good default palette for `pilsplaat.wav`? Likely needs visual iteration during implementation.
- [Affects R3][Technical] Should fringe hue modulation use a fixed rainbow cycle or shift relative to the base gradient color at each pixel?
- [Affects R4][Technical] How should `fringeIntensity` blend — multiplicative on the fringe amplitude, or a lerp between fringed and unfringed output?
- [Affects R5][Technical] Exact routing target names and default weights for the new gradient/fringe routing entries.
- [Affects R7][Technical] UI layout for palette stop editing — inline color pickers per stop, or a gradient bar widget?

## Next Steps
→ `/ce:plan` for structured implementation planning
