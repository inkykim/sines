---
date: 2026-04-06
topic: audio-visual-upgrade
---

# Audio-Visual Upgrade: Multi-Band Reactivity, Smooth Metaballs, Debug Consolidation

## Problem Frame
sines is an audio-reactive visual generator that currently has three limitations: (1) only sub-bass frequencies (FFT bins 1-7) drive the visuals, making it unresponsive to most musical content, (2) the metaball merge mode renders blocky edges because only 1 of 16 marching squares cases is implemented, and (3) a separate debug build duplicates the entire audio pipeline with diverging globals.

## Requirements

### Multi-Band Frequency Reactivity
- R1. Analyze three frequency bands each frame: bass, mids, and treble from the existing 1024-bin FFT
- R2. All balls react to all three bands simultaneously — no per-ball band assignment
- R3. Bass energy drives ball radius pulse (same axis as current kick, but continuous)
- R4. Mid energy drives ball speed modulation
- R5. Treble energy drives color shift toward peak color
- R6. The existing kick detection continues to work alongside continuous band reactivity (kick is a discrete event on top of continuous bass response)
- R7. Band energy mappings should feel smooth and continuous, not binary/threshold-gated

### Complete Marching Squares
- R8. Implement all 16 marching squares cases in `drawMergedBlob()` with proper edge interpolation between grid corners
- R9. The blob boundary should appear smooth at the current `FIELD_STEP=8` grid resolution
- R10. Existing `FIELD_THRESHOLD` and `FIELD_STEP` constants remain configurable

### Collapse Debug Build
- R11. Delete `debug.html` and `debug-sketch.js` — one codebase, one entry point
- R12. Pressing `D` in the main app toggles a debug overlay
- R13. Debug overlay shows: spectral flux graph, threshold line, kick flash indicator, FPS, live bass/mid/treble energy levels, ball count, and current parameter values
- R14. Debug overlay must not interfere with the underlying visualization (semi-transparent, positioned to avoid obscuring the center)
- R15. The file upload capability currently in `debug-sketch.js` moves into the main audio controls (it already exists in `audioControls.js`)

## Success Criteria
- The visualizer responds visibly to bass, mids, and treble across genres (electronic, jazz, ambient)
- Meta mode blob edges are smooth curves, not blocky staircases
- Only one HTML entry point exists (besides hex.html)
- Debug info is accessible via keypress in the main app

## Scope Boundaries
- No new UI sliders for band sensitivity tuning (use sensible defaults)
- No BPM detection or tempo sync
- No microphone input (separate future work)
- No changes to hex.html or hexGrid.js
- No event bus or architectural refactor — keep the existing global-based module pattern

## Key Decisions
- **All bands affect all balls**: Chosen over per-ball assignment for a more unified, energetic visual. Every ball reacts to bass (radius), mids (speed), and treble (color) simultaneously.
- **Bass maps to radius, mids to speed, treble to color**: Matches physical intuition — bass is "big", mids are "movement", treble is "bright".
- **Full debug overlay**: Shows spectral flux, threshold, kick indicator, FPS, band energy levels, ball count, and parameter values. Comprehensive over minimal.
- **Kick detection preserved alongside continuous reactivity**: The discrete kick pulse is layered on top of the continuous band-driven modulation, not replaced by it.

## Dependencies / Assumptions
- The existing 1024-bin FFT provides sufficient frequency resolution for three-band analysis
- p5.js `beginShape()`/`vertex()` calls are performant enough for full marching squares at FIELD_STEP=8

## Outstanding Questions

### Deferred to Planning
- [Affects R1][Technical] What exact FFT bin ranges define bass, mid, and treble bands?
- [Affects R3-R5][Needs research] What smoothing/scaling approach prevents visual chaos when all three bands drive all balls simultaneously?
- [Affects R8][Technical] Should marching squares use linear interpolation or a lookup table for the 16 cases?
- [Affects R13][Technical] Best p5.js approach for rendering a debug overlay that doesn't interfere with the main canvas blend modes?

## Next Steps
→ `/ce:plan` for structured implementation planning
