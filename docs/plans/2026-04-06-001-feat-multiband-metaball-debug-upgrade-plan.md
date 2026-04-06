---
title: "feat: Multi-Band Reactivity, Smooth Metaballs, Debug Consolidation"
type: feat
status: active
date: 2026-04-06
origin: docs/brainstorms/2026-04-06-audio-visual-upgrade-requirements.md
---

# Multi-Band Reactivity, Smooth Metaballs, Debug Consolidation

## Overview

Three coordinated improvements to sines: (1) make the visualizer respond to bass, mids, and treble — not just kick drums, (2) complete the marching squares implementation so metaball mode renders smooth blob edges instead of blocky staircases, and (3) collapse the separate debug build into a toggleable overlay in the main app.

## Problem Statement / Motivation

sines currently funnels a 1024-bin FFT down to a single binary event (kick detected or not). The metaball renderer only handles 1 of 16 marching squares cases, producing jagged edges. A separate `debug.html` duplicates the entire audio pipeline with diverging globals. These three issues limit visual expressiveness, rendering quality, and developer velocity respectively.

(see origin: `docs/brainstorms/2026-04-06-audio-visual-upgrade-requirements.md`)

## Proposed Solution

### Signal Composition Model

This is the critical architectural decision. Three continuous signals (bass, mid, treble) and one discrete signal (kick) all target ball properties. The composition model:

**Radius:** `ball.r = rBase * (1 + bassEnergy * 0.5) + kickBurst`
- `bassEnergy` (0-1, derived from `fft.getEnergy("bass")` / 255) continuously scales the base radius
- `kickBurst` is a separate decaying value (starts at `rBase * 0.8` on kick, lerps to 0). This replaces the current `pulse()` approach of writing directly to `ball.r`
- The existing `lerp(r, rBase, 0.08)` decay is removed — bass energy now sets the continuous floor, kick burst handles the transient

**Speed:** `effectiveV = baseSpeed * (1 + midEnergy * 0.8)`
- `baseSpeed` is what the user sets via the speed slider (stored per-ball as `ball.baseVx`, `ball.baseVy`)
- `midEnergy` (0-1) multiplies on top — slider remains the user's baseline control
- Applied each frame in `update()`, not as a one-time set

**Color:** `t = max(trebleT, kickPulseT)`
- `trebleT` (0-1, from `fft.getEnergy("treble")` / 255) provides continuous warmth
- `kickPulseT` (the existing `pulseLevel / 255`, decaying from 1.0) provides the brief flash
- `max()` ensures kicks always punch through — they are brief and should dominate
- This requires separating `pulseLevel` (kick-only) from color interpolation input

**Noise floor:** Soft ramp — band energy below 12 (out of 255, ~5%) maps to 0, energy 12-40 ramps linearly from 0 to its proportional value, above 40 maps linearly. This avoids jitter during silence without hard threshold gating (satisfies R7).

### Frequency Bands

Use p5.FFT's built-in `fft.getEnergy("bass")`, `fft.getEnergy("mid")`, `fft.getEnergy("treble")` which return 0-255 per band. These are predefined in p5.sound:
- bass: 20-140 Hz
- mid: 400-2600 Hz  
- treble: 5200-14000 Hz

This avoids overlap with the kick detector's narrow sub-bass range (bins 1-7, ~43-344 Hz), so kicks remain a distinct sub-bass event while continuous bass captures wider low-frequency energy.

### Marching Squares

Implement all 16 cases with linear edge interpolation. The existing bit ordering is: bit0=TL, bit1=TR, bit2=BR, bit3=BL — this is non-standard and the lookup table must match. Use interpolation formula: `t = (FIELD_THRESHOLD - v_a) / (v_b - v_a)` to find exact contour crossing on each edge.

Performance optimization: cache field values in a 2D grid array so each corner is computed once instead of up to 4 times (shared by adjacent cells). This halves the ~1.3M distance calculations per frame.

Extend loop bounds to cover full canvas edge (currently stops 8px short at right and bottom).

### Debug Consolidation

Add `let debugMode = false` global, toggled by `D` key. Extract `drawFlashText()` from `debug-sketch.js` into a new `ui/debugOverlay.js`. The overlay renders after `drawBall()` in the draw loop, wrapped in `push()/pop()` with explicit `blendMode(BLEND)` to isolate from any canvas blend mode changes.

Delete `debug.html` and `debug-sketch.js`. The `handleAudioFile()` and `getActiveSound()` already exist in `audioControls.js`.

## Technical Considerations

**Architecture:** All new state (band energies, debug mode) follows the existing globals pattern — no event bus, no modules (see origin: scope boundaries).

**Performance:** Marching squares field grid caching is the main optimization. The band energy extraction via `fft.getEnergy()` is near-free since FFT is already computed. Debug overlay rendering is conditional and lightweight.

**`spectrumDisplay.js` color mode leak:** Line 11 calls `colorMode(HSB)` without resetting. The debug overlay must not copy this pattern — always wrap in `push()/pop()`.

**Script load order:** New `debugOverlay.js` must load after `kickDetection.js` (needs access to flux data) and before `ui/index.js` (which sets up keyboard controls). Insert it in `index.html` between `spectrumDisplay.js` and `colorControls.js`.

## Implementation Phases

### Phase 1: Marching Squares Completion (~ballMerge.js)

**Why first:** This is self-contained and has zero dependencies on other changes. It immediately improves visual quality.

- [ ] Add field value grid cache (2D array, compute once per frame)
- [ ] Implement edge interpolation helper: `interpEdge(v0, v1, p0, p1)` returns the point where field crosses threshold
- [ ] Implement all 16 marching squares cases using lookup table matched to existing bit ordering (bit0=TL, bit1=TR, bit2=BR, bit3=BL)
- [ ] Extend grid loop to cover full canvas (change `< height - FIELD_STEP` to `<= height`, same for width; treat out-of-bounds field values as 0)
- [ ] Verify smooth edges at `FIELD_STEP=8` / `FIELD_THRESHOLD=1.9`

**Files:** `displays/ballMerge.js`

### Phase 2: Multi-Band Frequency Reactivity

**Why second:** Builds the signal infrastructure that the debug overlay will display.

- [ ] Add globals in `sketch.js`: `let bassEnergy = 0, midEnergy = 0, trebleEnergy = 0`
- [ ] In `draw()`, after `fft.analyze()`: extract band energies using `fft.getEnergy("bass")` etc., apply noise floor soft ramp, normalize to 0-1
- [ ] Refactor `Metaball` class in `ballDisplay.js`:
  - Add `baseVx`, `baseVy` properties (set from constructor random and `setSpeed()`)
  - Add `kickBurst` property (replaces direct `r` manipulation in `pulse()`)
  - `pulse()` now sets `kickBurst = rBase * 0.8` and `pulseLevel = 255`
  - `update()` computes: `r = rBase * (1 + bassEnergy * 0.5) + kickBurst`, decays `kickBurst` via lerp to 0, applies `effectiveV = baseVx * (1 + midEnergy * 0.8)` to position
  - `draw()` computes: `t = max(trebleEnergy, pulseLevel / 255)` for color interpolation
- [ ] Update `setSpeed()` in `ballDisplay.js` to write `baseVx`/`baseVy` instead of directly overwriting `vx`/`vy`
- [ ] Verify kick detection continues to work independently (it reads spectrum directly, unaffected by band energy globals)

**Files:** `sketch.js`, `displays/ballDisplay.js`

### Phase 3: Debug Build Consolidation

**Why last:** Benefits from the band energy globals from Phase 2, which the overlay displays.

- [ ] Create `ui/debugOverlay.js` with:
  - `let debugMode = false`
  - `toggleDebugMode()` function
  - `drawDebugOverlay()` function that renders (inside `push()/pop()` with `blendMode(BLEND)`):
    - Spectral flux graph (reads `spectralFluxBuffer` from `kickDetection.js`)
    - Current threshold line (expose `lastThreshold` as global from `kickDetection.js`)
    - Kick flash indicator (extracted `drawFlashText()` logic from `debug-sketch.js`)
    - FPS counter (`frameRate()`)
    - Live bass/mid/treble energy bars (reads globals from Phase 2)
    - Ball count (`balls.length`)
    - Current parameter values (speed, colors, merge mode)
  - Semi-transparent background panel, positioned top-left to avoid center
- [ ] Expose `lastThreshold` and current `flux` as globals in `kickDetection.js` (add 2 `let` declarations, set them during `kickDetect()`)
- [ ] Add `case 'KeyD'` to keyboard handler in `ui/index.js`
- [ ] Add `if (debugMode) drawDebugOverlay()` at end of `draw()` in `sketch.js`
- [ ] Add `<script defer src="ui/debugOverlay.js"></script>` to `index.html` in correct load order position
- [ ] Delete `debug.html` and `debug-sketch.js`
- [ ] Update title display instructions in `titleDisplay.js` to mention D key

**Files:** new `ui/debugOverlay.js`, `detections/kickDetection.js`, `ui/index.js`, `sketch.js`, `index.html`, `ui/titleDisplay.js`, delete `debug.html`, delete `debug-sketch.js`

## Acceptance Criteria

### Functional Requirements
- [ ] R1-R2: Three band energies (bass, mid, treble) extracted each frame; all balls react to all three
- [ ] R3: Bass energy continuously drives ball radius scaling
- [ ] R4: Mid energy continuously modulates ball speed around the slider-set baseline
- [ ] R5: Treble energy continuously shifts color toward peak color
- [ ] R6: Kick detection fires discrete pulses layered on top of continuous effects
- [ ] R7: Band effects feel smooth and continuous; noise floor prevents silence jitter
- [ ] R8-R9: All 16 marching squares cases implemented with edge interpolation; blob boundary is smooth
- [ ] R10: `FIELD_THRESHOLD` and `FIELD_STEP` remain configurable constants
- [ ] R11: `debug.html` and `debug-sketch.js` are deleted
- [ ] R12: D key toggles debug overlay in main app
- [ ] R13: Debug overlay shows spectral flux, threshold, kick flash, FPS, band levels, ball count, params
- [ ] R14: Debug overlay uses `push()/pop()` + `blendMode(BLEND)`, positioned to not obscure center
- [ ] R15: File upload works via `audioControls.js` (already exists, verified)

### Quality Gates
- [ ] Metaball edges are visually smooth at default settings
- [ ] Visualization responds noticeably to bass, mid, and treble on varied music genres
- [ ] No visible jitter during silence or paused audio
- [ ] Debug overlay text is readable on both light and dark backgrounds
- [ ] No `onEventDetected` naming conflicts after debug-sketch deletion
- [ ] Frame rate stays above 30fps on a standard laptop at 1080p

## Dependencies & Risks

- **p5.FFT `getEnergy()` accuracy:** Assumed to return meaningful per-band values. If the predefined bands don't feel right, the bin ranges can be customized with `getEnergy(freq1, freq2)`.
- **Marching squares performance:** Caching field values halves computation, but at 1080p with 10+ balls, the grid scan is still ~32K cells. Monitor frame rate; `FIELD_STEP` can be increased if needed.
- **The non-standard bit ordering** in the existing marching squares code (bit0=TL, bit1=TR, bit2=BR, bit3=BL) means standard lookup tables from references will not work without remapping.

## Sources & References

### Origin
- **Origin document:** [docs/brainstorms/2026-04-06-audio-visual-upgrade-requirements.md](docs/brainstorms/2026-04-06-audio-visual-upgrade-requirements.md) — Key decisions: all bands affect all balls, bass→radius/mid→speed/treble→color, full debug overlay, kick preserved alongside continuous reactivity.

### Internal References
- `displays/ballMerge.js:50-53` — existing marching squares bit ordering
- `displays/ballDisplay.js:43-85` — Metaball class (pulse, update, draw)
- `detections/kickDetection.js:11-41` — kick detection pipeline
- `debug-sketch.js:93-115` — `drawFlashText()` to extract
- `ui/index.js:77-105` — keyboard handler to extend
- `displays/spectrumDisplay.js:11` — colorMode(HSB) leak to avoid

### External References
- p5.FFT.getEnergy(): p5.js sound reference
- Marching squares algorithm: standard 16-case lookup table (remap to match existing bit ordering)
