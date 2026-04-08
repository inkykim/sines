---
date: 2026-04-07
topic: holographic-gradient-transition
focus: transitioning from metaballs to expressive gradient visuals, holographic patterns, and waves
---

# Ideation: Holographic Gradient Transition

## Codebase Context
- p5.js vanilla JS audio-reactive visualizer, no build step, served via `npx serve`
- Currently 2D canvas with CPU-side metaball scalar field rendering (FIELD_STEP=8px grid)
- No WEBGL mode — canvas created in 2D mode
- 2-color palette only (base + peak lerp). HSL utilities (rgbToHsl/hslToRgb) exist in settings.js but unused
- Multi-band audio reactivity: bass/mid/treble energies drive radius, speed, color via routing matrix in AppSettings
- displays/ has ballDisplay.js, ballMerge.js, spectrumDisplay.js — no display mode abstraction
- drawBall() called unconditionally in sketch.js — no mode switcher
- All state flows through AppSettings with setter-bridge pattern
- No past learnings documented in docs/solutions/

## Ranked Ideas

### 1. Continuous Gradient Field
**Description:** Replace marching-squares binary threshold with direct pixel-buffer writes. The scalar field already computed by fieldValueAt() maps to a multi-stop color gradient instead of inside/outside. Uses createImage()/pixels[] at FIELD_STEP resolution, upscaled by the browser.
**Rationale:** The existing field math already contains the gradient data — the threshold throws it away. Removing the 16-case switch and writing colors via pixels[] is simpler code that produces richer output. At FIELD_STEP=8, only ~32K pixels to write.
**Downsides:** Requires building a gradient LUT system. Low-resolution pixel buffer needs smooth upscaling.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored (2026-04-07)

### 2. Interference Fringe Overlay
**Description:** Second render pass: sin(fieldValue * frequency + time * speed) mapped to brightness/hue over the base gradient. Produces concentric rainbow bands around blob boundaries. Bass controls fringe spacing, treble controls animation speed.
**Rationale:** This is literally how holograms work — interference fringes. One trig call per grid cell with zero additional field evaluation. Cheapest path to a genuinely holographic look.
**Downsides:** Needs tuning to avoid visual noise. Fringe density must scale with canvas size.
**Confidence:** 85%
**Complexity:** Low
**Status:** Explored (2026-04-07)

### 3. Multi-Stop Gradient LUT with Band-Driven Crossfade
**Description:** Replace 2-color base/peak lerp with 4-8 color lookup tables (256 entries each). Each archetype theme defines its own LUT. Band energies shift gradient stop positions or crossfade between LUTs. Activates the unused rgbToHsl()/hslToRgb() utilities.
**Rationale:** The 2-color palette is the expressiveness bottleneck. A LUT is a single array lookup — near-zero cost. Band-driven stop shifts make bass, mid, and treble visually distinguishable in the color field.
**Downsides:** Designing good palettes is a taste problem. Requires UI for palette selection.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Explored (2026-04-07)

### 4. Sine Wave Interference Field
**Description:** Replace metaball formula (r^2/d^2) with sin(d*freq - time*speed)/d. Balls become wave emitters. Bass=slow wide ripples, treble=tight fast fringes.
**Rationale:** The project is called "sines" but has zero sine wave visuals. One-line formula swap in fieldValueAt() that changes output from blobs to waves. Interference patterns are the physical basis of holograms.
**Downsides:** sin() more expensive than multiply — may need coarser FIELD_STEP. Aesthetic tuning non-trivial.
**Confidence:** 70%
**Complexity:** Medium-High
**Status:** Unexplored

### 5. Temporal Trail Buffer
**Description:** Replace background() full-clear with semi-transparent wash (alpha 10-40, bass-driven). Previous frames persist and fade into flowing aurora-like ribbons.
**Rationale:** 1-line change that transforms every other visual idea. Gradient fields become flowing light-paintings.
**Downsides:** Classic Canvas2D ghosting (alpha never reaches true zero) requires threshold clear.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 6. Radial Gradient Balls (Quick Win)
**Description:** Replace circle() with drawingContext.createRadialGradient() in non-metamerge path. 5-line change for immediate soft glow effect.
**Rationale:** Immediate visual upgrade from flat circles to glowing orbs. Works as fallback and proof-of-concept.
**Downsides:** Not holographic on its own. Only affects non-metamerge path.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Chromatic Aberration | 3x rendering cost on CPU-bound pipeline; glitch aesthetic not holographic |
| 2 | Canvas2D Filter Post-Processing | CSS blur is full-canvas CPU convolution; tanks framerate |
| 3 | Gravitational Lensing | Dependent texture lookup is a shader op; catastrophically slow CPU-side |
| 4 | FFT Waveform Mesh | Different visualizer entirely; abandons metaball field and ball physics |
| 5 | Delaunay Gradient Mesh | Low-poly faceted look opposite of smooth holographic; needs external lib |
| 6 | Band-Separated Layer Canvases | 3x field evaluation cost; implementation detail not a feature |
| 7 | Display Mode Abstraction | Pure architecture with zero visual impact; build renderer first |
| 8 | Multi-Threshold Isobands | Half-step toward continuous gradient; still flat bands with hard edges |
| 9 | Perlin Noise Domain Warping | Expensive JS noise(); lava lamp not holographic; better as later modifier |
| 10 | Spectral Centroid Hue Rotation | Global tint doesn't create gradients/patterns; too simple |
| 11 | Radial Gradient Compositing | 20 large overlapping radial fills hammer compositor; loses merge topology |

## Session Log
- 2026-04-07: Initial ideation — 40 candidates generated (5 sub-agents), 17 unique after dedup, 6 survived adversarial filtering
- 2026-04-07: User selected ideas #1+#2+#3 ("Holographic Gradient Core" combo) for brainstorming on new branch from main
