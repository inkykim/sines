---
title: "feat: Holographic gradient core renderer"
type: feat
status: active
date: 2026-04-07
origin: docs/brainstorms/2026-04-07-holographic-gradient-core-requirements.md
---

# feat: Holographic Gradient Core Renderer

## Overview

Replace the marching-squares metaball renderer with a pixel-buffer gradient field that maps the continuous scalar field to multi-stop color gradients, adds interference fringe overlays for holographic shimmer, and extends the routing matrix with new audio-reactive targets. Balls become invisible attractors driving pools of flowing color.

## Problem Statement / Motivation

The current renderer (287 lines of marching squares in `ballMerge.js`) computes a smooth continuous scalar field via `fieldValueAt()` then throws away all gradient information by thresholding to a binary inside/outside decision. The result is flat-colored blobs. The scalar field already contains the data needed for rich gradient visuals — this feature reinterprets it as color rather than geometry. (see origin: `docs/brainstorms/2026-04-07-holographic-gradient-core-requirements.md`)

## Proposed Solution

Three layered changes that compose into one cohesive visual upgrade:

1. **Pixel-buffer gradient renderer** — Walk the FIELD_STEP grid, index each cell's field value into a 256-entry color LUT, write RGBA into a low-res `createImage()` buffer, upscale via `image()`. Replaces all marching-squares code.
2. **Multi-stop gradient LUT** — Generate a 256-entry color array from 2-8 user-defined HSL-interpolated stops. Regenerated on palette change. `baseColor`/`peakColor` become aliases for stop[0] and stop[N-1] for backward compatibility with the theme engine.
3. **Interference fringe overlay** — After base gradient, modulate each pixel with `sin(fieldValue * fringeFreq + frameCount * fringeSpeed)` scaled by `fringeIntensity` (0-100%). Produces concentric holographic rainbow bands.

## Technical Considerations

### Architecture

- The scalar field computation (`fieldValueAt()`, grid caching, ball loop) is unchanged — only the rendering pass after the grid is computed changes
- `baseColor`/`peakColor` are kept in AppSettings and SETTINGS_SCHEMA as aliases for palette stop[0] and stop[N-1]. The setter bridge, theme engine, and lock pins continue to work. When either is set, the corresponding palette stop updates. When the palette is set directly, baseColor/peakColor sync.
- `metaMode` is deprecated. The gradient field always renders. Archetypes that set `metaMode: false` (Calm Classical, Lo-Fi Chill, Jazz) differentiate via palette, ball count, speed, and fringe settings instead of a separate rendering path.
- New routing targets `gradient` and `fringe` follow the existing `{ bass: N, mid: N, treble: N }` weight pattern

### Performance

- At 1080p with FIELD_STEP=8: grid is ~240x135 = 32,400 cells
- Field evaluation: 10 balls × 32,400 cells = 324,000 distance calculations (unchanged from current)
- LUT lookup: O(1) per cell (array index)
- Fringe sin(): 32,400 calls per frame — trivial on modern hardware
- Pixel buffer is low-res (`createImage(cols, rows)`) — `loadPixels()`/`updatePixels()` operates on ~130KB, not the full canvas
- Upscaling via `image()` uses browser's hardware-accelerated bilinear interpolation
- Target: 30fps+ at 1080p with 10 balls (matches origin spec)

### Pre-existing Bug Fix

- `spectrumDisplay.js:10` calls `colorMode(HSB)` without restoring RGB, which will corrupt the gradient renderer's pixel writes if spectrum is drawn in the same frame. Wrap in `push()`/`pop()`.

## Implementation Phases

### Phase 1: Gradient LUT System (`settings.js`, new `displays/gradientLUT.js`)

**Goal:** Build the palette data model and LUT generator before touching the renderer.

**Tasks:**
- [ ] Create `displays/gradientLUT.js` with:
  - `generateGradientLUT(stops)` → returns `Uint8Array(256 * 4)` (RGBA) using HSL shortest-arc interpolation between stops
  - Each stop: `{ position: 0-1, color: [r, g, b] }`
  - Shortest-arc HSL hue interpolation using existing `rgbToHsl()`/`hslToRgb()`
- [ ] Add to `SETTINGS_SCHEMA`: `{ id: 'palette', type: 'palette', label: 'Gradient Palette', default: [{position: 0, color: [0,0,0]}, {position: 1, color: [255,255,255]}] }`
- [ ] Add to `SETTINGS_SCHEMA`: `{ id: 'fringeIntensity', type: 'float', label: 'Fringe Intensity', min: 0, max: 1, default: 0.4 }`
- [ ] Add `'palette'` type validation to `_validateSetting()`: clamp stop count to [2,8], ensure positions ordered in [0,1], validate color arrays
- [ ] Add `palette` and `fringeIntensity` to `AppSettings` defaults
- [ ] Add `palette` setter to `_setterMap` that: updates AppSettings.palette, regenerates the LUT, syncs `baseColor`←stop[0] and `peakColor`←stop[N-1]
- [ ] Add `baseColor`/`peakColor` setter bridge: when either changes, update the corresponding palette stop and regenerate LUT
- [ ] Add `fringeIntensity` setter to `_setterMap`
- [ ] Extend `AppSettings.routing` default with: `gradient: { bass: 0.5, mid: 0.3, treble: 0.2 }`, `fringe: { bass: 0, mid: 0.3, treble: 1 }`
- [ ] Add `<script src="displays/gradientLUT.js" defer></script>` to `index.html` (before `ballMerge.js`)

**Files:** `settings.js`, `displays/gradientLUT.js` (new), `index.html`

### Phase 2: Pixel-Buffer Gradient Renderer (`displays/ballMerge.js`)

**Goal:** Replace marching squares with pixel-buffer gradient writes.

**Tasks:**
- [ ] Remove all marching-squares code: `interpEdge()`, the 16-case switch in `drawMergedBlob()`, the `FIELD_THRESHOLD` constant
- [ ] Rewrite `drawMergedBlob()` as `drawGradientField()`:
  1. Compute grid of field values (reuse existing grid cache logic)
  2. Create or reuse a `p5.Image` at grid resolution (`cols × rows`)
  3. `loadPixels()` on the image
  4. For each grid cell: normalize field value → clamp to [0, 255] → index into LUT → write RGBA into `pixels[]`
  5. Apply fringe: `sin(fieldValue * fringeFreq + frameCount * fringeSpeed)` modulates the pixel, blended by `fringeIntensity`
  6. `updatePixels()` on the image
  7. `image(gradientImg, 0, 0, width, height)` to upscale to canvas
- [ ] Field value normalization: map raw field value range to [0, 255] for LUT indexing. Use a configurable normalization factor (field values near ball centers are very high, edges approach 0). Consider: `lutIndex = constrain(floor(fieldValue / maxExpectedField * 255), 0, 255)` where maxExpectedField is tuned to the visual.
- [ ] Read routing matrix for audio-reactive modulation:
  - `gradient` routing target modulates the normalization factor (bass makes gradients spread wider)
  - `fringe` routing target modulates fringe frequency and/or speed
- [ ] Cache the `p5.Image` — only recreate on window resize
- [ ] Update `windowResized()` to recreate the pixel buffer
- [ ] Remove `getScenePulseT()` and `getSceneColorRGB()` (no longer needed — color comes from LUT)
- [ ] Update `drawBall()` in `ballDisplay.js`: always call `drawGradientField()`, remove the `USE_METAMERGE` branch and individual `ball.draw()` path. `Metaball.draw()` method can be removed.
- [ ] Fix `spectrumDisplay.js`: wrap `displayFullSpectrum()` body in `push()`/`pop()` to isolate `colorMode(HSB)`

**Files:** `displays/ballMerge.js`, `displays/ballDisplay.js`, `displays/spectrumDisplay.js`

### Phase 3: Theme Engine + Routing UI Updates

**Goal:** Wire new settings into theme engine archetypes and the Advanced panel routing matrix.

**Tasks:**
- [ ] Add `fringeIntensity` and extended routing (`gradient`, `fringe`) to all 8 archetypes in `themeEngine.js`. Suggested defaults:
  - Dark Trap: fringeIntensity 0.5, gradient {bass:1, mid:0, treble:0}, fringe {bass:0, mid:0.3, treble:1}
  - Bright Pop: fringeIntensity 0.3, gradient {bass:0.5, mid:0.5, treble:0}, fringe {bass:0, mid:0.5, treble:1}
  - Calm Classical: fringeIntensity 0.1, gradient {bass:0.3, mid:0.5, treble:0.3}, fringe {bass:0, mid:0.5, treble:0.5}
  - Heavy Metal: fringeIntensity 0.6, gradient {bass:1, mid:0.3, treble:0}, fringe {bass:0, mid:0, treble:1}
  - Ambient: fringeIntensity 0.3, gradient {bass:0.3, mid:0.5, treble:0.5}, fringe {bass:0, mid:0.5, treble:1}
  - Lo-Fi Chill: fringeIntensity 0.2, gradient {bass:0.5, mid:0.5, treble:0}, fringe {bass:0, mid:0.7, treble:0.5}
  - Techno House: fringeIntensity 0.5, gradient {bass:1, mid:0, treble:0}, fringe {bass:0, mid:0, treble:1}
  - Jazz: fringeIntensity 0.15, gradient {bass:0.5, mid:0.5, treble:0}, fringe {bass:0, mid:0.5, treble:0.5}
- [ ] Remove `metaMode` from archetype themes (deprecated — gradient always renders)
- [ ] Update `advancedControls.js` routing matrix UI: add `gradient` and `fringe` columns to the band routing grid. Update `params` array from `['radius', 'speed', 'color']` to `['radius', 'speed', 'color', 'gradient', 'fringe']` and `colLabels` accordingly
- [ ] Deprecate `metaMode` in `ballControls.js` — remove the toggle or gray it out with a note

**Files:** `detections/themeEngine.js`, `ui/advancedControls.js`, `ui/ballControls.js`

### Phase 4: Palette Customization UI

**Goal:** Let users add/remove/edit gradient color stops.

**Tasks:**
- [ ] Add a "Gradient" collapsible section in `setupUI()` (after Colors, before Ball Settings)
- [ ] For each palette stop: render a row with a color picker and a position slider (0.0-1.0)
- [ ] Add "+" button to add a stop (up to 8), "-" button to remove (minimum 2)
- [ ] On any change: update `AppSettings.palette`, regenerate LUT, sync `baseColor`/`peakColor` if stop[0] or stop[N-1] changed
- [ ] Add fringe intensity slider to the Gradient section using `_advancedSliderRow()` pattern
- [ ] Register UI sync for `palette` and `fringeIntensity` so `applySettings()` can update the UI
- [ ] Create new file `ui/gradientControls.js` and add to `index.html` (before `ui/index.js`)

**Files:** `ui/gradientControls.js` (new), `ui/index.js`, `index.html`

### Phase 5: Polish + Default Palette

**Goal:** Tune the default palette for `pilsplaat.wav`, set good normalization values, verify performance.

**Tasks:**
- [ ] Tune field value normalization factor by running with the default song — ensure the gradient fills the canvas attractively with 10 balls
- [ ] Design default palette (iterative — try HSL-spread palettes, warm-to-cool progressions, etc.)
- [ ] Tune default fringe frequency and speed constants
- [ ] Verify 30fps+ at 1080p with 10 balls in Chrome/Firefox/Safari
- [ ] Verify window resize recreates the pixel buffer correctly
- [ ] Test theme engine transitions — ensure new params apply and UI syncs
- [ ] Remove dead code: `FIELD_THRESHOLD`, `interpEdge()`, any remaining marching-squares references

**Files:** All modified files, manual testing

## System-Wide Impact

- **Settings architecture**: New settings (`palette`, `fringeIntensity`) and extended routing targets (`gradient`, `fringe`) flow through the existing `SETTINGS_SCHEMA` → `_setterMap` → `_validateSetting()` → `_syncUI()` pipeline. `baseColor`/`peakColor` gain bidirectional alias behavior with palette stops.
- **Theme engine**: All 8 archetypes gain `fringeIntensity` and extended routing weights. `metaMode` is deprecated. Archetypes differentiate via palette, fringe, and routing instead of rendering-path toggles.
- **Rendering pipeline**: `drawBall()` always calls `drawGradientField()`. Individual ball rendering (`Metaball.draw()`) is removed. Ball physics (update, bounce, kick) are unchanged.
- **Script loading**: Two new `<script defer>` tags in `index.html`: `gradientLUT.js` (before `ballMerge.js`) and `gradientControls.js` (before `ui/index.js`).

## Acceptance Criteria

- [ ] Full-canvas smooth gradient visuals that react to audio across all three bands
- [ ] Interference fringes produce visible holographic shimmer, adjustable from 0% (invisible) to 100% (intense)
- [ ] Palette supports 2-8 color stops with HSL shortest-arc interpolation
- [ ] `baseColor`/`peakColor` remain functional as aliases for first/last palette stops
- [ ] Extended routing matrix (gradient, fringe targets) works in the Advanced panel UI
- [ ] Theme engine applies new settings (fringeIntensity, routing) per archetype
- [ ] Frame rate ≥ 30fps at 1080p with 10 balls
- [ ] Window resize handled without artifacts
- [ ] `spectrumDisplay.js` colorMode(HSB) leak fixed
- [ ] All marching-squares code removed

## Dependencies & Risks

- **Performance assumption**: `createImage()` at ~240x135 with `loadPixels()`/`updatePixels()` + `image()` upscale must hit 30fps. Validate early in Phase 2. If too slow, increase FIELD_STEP to 12 or 16.
- **Visual tuning**: Field value normalization and default palette require iterative tuning with audio playing. Cannot be determined in advance.
- **HSL hue wrapping**: Shortest-arc interpolation must correctly handle the 0/360 boundary. Edge case: stops at H=350 and H=10 should interpolate through 0, not through 180.

## Sources & References

### Origin

- **Origin document:** [docs/brainstorms/2026-04-07-holographic-gradient-core-requirements.md](docs/brainstorms/2026-04-07-holographic-gradient-core-requirements.md) — Key decisions: replace (don't coexist) marching-squares renderer, fully customizable palettes with good defaults, extend routing matrix for gradient/fringe targets, balls as invisible attractors, adjustable fringe intensity knob.

### Internal References

- Scalar field computation: `displays/ballMerge.js:28-36` (`fieldValueAt()`)
- Grid caching: `displays/ballMerge.js:66-74`
- Settings architecture: `settings.js:51-236` (schema, AppSettings, setter bridge, validation, applySettings)
- Routing matrix: `settings.js:65-69`, `ui/advancedControls.js:28-58`
- HSL utilities: `settings.js:8-49` (`rgbToHsl`, `hslToRgb`)
- Theme archetypes: `detections/themeEngine.js:7-88`
- UI pattern: `ui/index.js:8-38` (collapsible sections), `ui/advancedControls.js:123-149` (slider rows)
- colorMode leak: `displays/spectrumDisplay.js:10`

### Ideation

- [docs/ideation/2026-04-07-holographic-gradient-ideation.md](docs/ideation/2026-04-07-holographic-gradient-ideation.md) — 40 candidates generated, 6 survivors, ideas #1+#2+#3 selected as "Holographic Gradient Core" combo
