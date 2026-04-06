---
title: "feat: ML Audio Pipeline & Settings Architecture"
type: feat
status: active
date: 2026-04-06
origin: docs/brainstorms/2026-04-06-ml-audio-pipeline-requirements.md
---

# ML Audio Pipeline & Settings Architecture

## Overview

Transform sines from a manually-tuned visualizer into one that auto-generates coherent visual themes from audio analysis. Five interconnected systems: unified settings layer, audio feature extraction with rolling buffer, rule-based theme engine with 8 genre archetypes, auto-manual authority with lock pins, and configurable band-to-parameter routing — all housed in a revamped collapsible panel.

## Problem Statement

sines has ~35 scattered globals across 10 files with no unified access. There is no way to programmatically apply a bundle of settings, no persistence, and no audio analysis beyond frame-by-frame FFT. The user must manually configure every visual parameter for every track. (see origin: `docs/brainstorms/2026-04-06-ml-audio-pipeline-requirements.md`)

## Proposed Solution

### Resolved Design Questions

The SpecFlow analysis surfaced architectural gaps. These are the resolved defaults:

1. **Merge-mode ball fade:** Use radius scaling (grow in / shrink out) rather than opacity. The scalar field renderer cannot support per-ball transparency. In individual circle mode, use actual opacity fade via `fill(r,g,b,a)`.
2. **HSL interpolation:** Contained to the transition system only. Convert RGB→HSL on entry, lerp in HSL space, convert back to RGB each frame. All storage remains RGB. Manual conversion functions (no external dependency).
3. **Auto-lock timing:** Only activates for parameters that were set by the most recent theme generation. Manual edits before any Generate do not trigger auto-lock.
4. **Buffer minimum for Generate:** Button disabled until at least 64 frames (~1 second) have accumulated in the ring buffer.
5. **All parameters locked:** Allow the action, flash all locked controls, show inline "All parameters locked" text near the button that fades after 2 seconds.
6. **Theme schema is a subset:** Themes cannot set kick cooldown, kick floor, or global reactivity. Those are user-tuning-only parameters.
7. **Generate button state:** Check `getActiveSound().isPlaying()` in the draw loop and update button disabled state reactively.
8. **Frame-rate-independent transitions:** Use `deltaTime`-based lerp for all smooth transitions: `lerp(current, target, 1 - Math.exp(-speed * deltaTime / 1000))`.

## Implementation Phases

### Phase 1: Unified Settings Layer

**Goal:** Replace scattered globals with a single settings object, declarative schema, and universal `applySettings()` function with bidirectional UI sync.

**Files:** New `settings.js`, modify `sketch.js`, `displays/ballDisplay.js`, `displays/ballMerge.js`, `ui/colorControls.js`, `ui/ballControls.js`, `detections/kickDetection.js`, `index.html`

- [ ] Create `settings.js` with:
  - `AppSettings` object containing all current globals as properties: `baseColor`, `peakColor`, `bgColor`, `ballCount`, `speed`, `metaMode`, `cleanDisplay`, `kickSensitivity` (default 1.8), `kickCooldown` (default 200), `kickFloor` (default 15), `reactivity` (default 1.0, scales the noise floor), routing weights (default: `{radius: {bass:1, mid:0, treble:0}, speed: {bass:0, mid:1, treble:0}, color: {bass:0, mid:0, treble:1}}`)
  - `SETTINGS_SCHEMA` array of descriptors: `{ id, label, type: 'color'|'number'|'boolean'|'matrix', min, max, default, section, advanced }`
  - `applySettings(partial, options)` function that: iterates partial keys, checks lock state, calls appropriate setter, syncs UI control value, triggers transition for numeric/color params
  - `getSettings()` returns a plain serializable copy of `AppSettings`
  - Lock state: `lockedParams` Set, `themeSetParams` Set (tracks which params were set by last Generate)
  - `lockParam(id)`, `unlockParam(id)`, `isLocked(id)`, `unlockAll()`
- [ ] Refactor existing globals to read from `AppSettings` (keep backward-compatible global references that delegate to the settings object, so all existing code continues to work during migration)
- [ ] Extend existing setters (`setBaseColorFromHex`, `setBallCount`, `setSpeed`, etc.) to also write to `AppSettings` and sync the UI control value
- [ ] Make kick detection constants mutable: change `const kickCooldown = 200` to `let`, extract inline `1.8` multiplier and `15` floor into named variables that `applySettings()` can update
- [ ] Update `applyNoiseFloor()` in `sketch.js` to scale thresholds by `AppSettings.reactivity`
- [ ] Add `<script defer src="settings.js"></script>` to `index.html` before all other app scripts (first in load order after p5.js)

### Phase 2: Audio Feature Extraction

**Goal:** Build the rolling buffer and spectral centroid computation that the theme engine will consume.

**Files:** New `detections/audioFeatures.js`, modify `sketch.js`, `index.html`

- [ ] Create `detections/audioFeatures.js` with:
  - Ring buffer: array of `{ bass, mid, treble, kick, flux, centroid }` objects, max 128 entries
  - `pushAudioFrame(bass, mid, treble, kickDetected, flux, centroid)` — adds to buffer, trims to 128
  - `computeSpectralCentroid(spectrum)` — energy-weighted average of bin indices from the raw 1024-bin array, normalized to 0-1
  - `getTemporalStats()` — returns `{ bassMean, bassVariance, midMean, midVariance, trebleMean, trebleVariance, centroidMean, centroidVariance, kickRate, fluxMean }` computed from current buffer
  - `getBufferLength()` — for checking minimum frame threshold
- [ ] In `sketch.js` `draw()`, after `fft.analyze()` and band energy extraction: compute spectral centroid, push frame to buffer
- [ ] Add script to `index.html` after `kickDetection.js`

### Phase 3: Panel Revamp with Collapsible Sections

**Goal:** Restructure the UI panel with collapsible sections, making room for theme generation and advanced controls.

**Files:** Modify `ui/index.js`, `ui/colorControls.js`, `ui/ballControls.js`, `ui/audioControls.js`, new `ui/themeControls.js`

- [ ] Create a reusable `createCollapsibleSection(parent, title, defaultExpanded)` helper that returns a container div. Uses a clickable header with a toggle arrow (▸/▾) and hides/shows the content div.
- [ ] Refactor each `setup*` function to wrap its controls in a collapsible section:
  - Colors — expanded by default
  - Ball Settings — collapsed by default
  - Audio Controls — collapsed by default
  - Theme Generation — expanded by default (new section, Phase 4)
  - Advanced — collapsed by default (new section, Phase 5)
- [ ] Fix `setupAudioControls()` to accept `uiContainer` parameter (currently references it as a global inconsistently)
- [ ] Add lock pin toggle next to each control: a small 🔒/🔓 icon button. When clicked, toggles `lockParam(id)` / `unlockParam(id)`. When a param is locked, the control gets a subtle border/highlight.
- [ ] Wire auto-lock: when any control's `.input()` handler fires AND `themeSetParams.has(paramId)` is true, auto-lock that param.
- [ ] Add "theme-set" vs "user-set" subtle indicator per param (e.g., a thin colored bar: blue for theme-set, transparent for user-set)

### Phase 4: Rule-Based Theme Engine

**Goal:** Build the 8-archetype classifier and "Generate Theme" button.

**Files:** New `detections/themeEngine.js`, new `ui/themeControls.js`, modify `sketch.js`, `index.html`, `ui/debugOverlay.js`

- [ ] Create `detections/themeEngine.js` with:
  - `ARCHETYPES` array of 8 entries, each with: `{ name, profile: { bassMean, midMean, trebleMean, centroidMean, kickRate, bassVariance }, theme: { baseColor, peakColor, bgColor, ballCount, speed, metaMode, routing, kickSensitivity } }`
  - 8 archetypes with hand-tuned profiles and themes:
    - **Dark Trap:** high bass mean, high kick rate, low centroid → black bg, purple/magenta peak, 8-12 balls, fast speed
    - **Bright Pop:** balanced energy, high centroid → white bg, bright warm colors, 6-8 balls, medium speed
    - **Calm Classical:** low bass/mid, low kick rate, high centroid → cream/beige bg, soft gold/blue, 1-3 balls, slow speed
    - **Heavy/Metal:** high everything, high bass variance → dark red/black bg, white/red peak, 12-15 balls, fast speed
    - **Ambient:** very low kick rate, low bass variance, mid centroid → dark blue/teal bg, soft cyan, 2-4 balls, very slow
    - **Lo-Fi/Chill:** moderate bass, low kick rate, mid centroid → warm brown/orange bg, peach/cream, 4-6 balls, slow
    - **Techno/House:** high kick rate, steady bass, mid centroid → dark bg, neon green/cyan peak, 8-10 balls, medium-fast
    - **Jazz:** moderate bass, high mid variance, high centroid → dark warm bg, gold/amber, 3-5 balls, slow-medium
  - `classifyAudio(stats)` — computes weighted Euclidean distance from `stats` to each archetype's `profile`, returns `{ archetype, distance, theme }`
  - Feature weighting: kick rate and centroid weighted higher (most discriminative)
- [ ] Create `ui/themeControls.js` with:
  - "Generate Theme" button (styled consistently with existing buttons)
  - Button disabled state: check `getActiveSound().isPlaying()` AND `getBufferLength() >= 64` in draw loop
  - On click: call `getTemporalStats()`, call `classifyAudio(stats)`, call `applySettings(theme)` with transition
  - "All parameters locked" inline feedback label (fades after 2s)
  - Store last classification result for debug overlay
- [ ] HSL transition system within `applySettings()`:
  - Manual RGB↔HSL conversion functions (no external dependency):
    - `rgbToHsl(r, g, b)` returns `[h, s, l]` with h in 0-360, s/l in 0-1
    - `hslToRgb(h, s, l)` returns `[r, g, b]` in 0-255
  - For color transitions: convert current and target to HSL, choose shortest hue path, lerp h/s/l each frame, convert back to RGB
  - For numeric transitions: standard lerp with `deltaTime`-based smoothing
  - Ball count transitions: add new balls at r=0 that grow to rBase (radius scaling), removed balls shrink r→0 then get spliced. In individual circle mode, use opacity fade via `fill(r,g,b,a)`.
- [ ] Flash animation for locked params: when `applySettings` skips a locked param, add a CSS-like flash class (temporarily change border color to yellow for ~300ms)
- [ ] Update `debugOverlay.js`: show last matched archetype name and distance score in the overlay panel
- [ ] Add scripts to `index.html` in correct load order

### Phase 5: Configurable Band-to-Parameter Routing

**Goal:** Replace hardcoded band mappings with configurable weight matrix, exposed in Advanced panel.

**Files:** Modify `displays/ballDisplay.js`, `displays/ballMerge.js`, modify `ui/ballControls.js` or new section in panel

- [ ] Refactor `Metaball.update()` to use routing weights from `AppSettings.routing`:
  ```
  // Radius: weighted sum of all three bands
  const radiusEnergy = bassEnergy * routing.radius.bass + midEnergy * routing.radius.mid + trebleEnergy * routing.radius.treble;
  this.r = this.rBase * (1 + radiusEnergy * 0.5) + this.kickBurst;

  // Speed: weighted sum
  const speedEnergy = bassEnergy * routing.speed.bass + midEnergy * routing.speed.mid + trebleEnergy * routing.speed.treble;
  const speedMod = 1 + speedEnergy * 0.8;
  ```
- [ ] Refactor `Metaball.draw()` and `getScenePulseT()` in `ballMerge.js` to use `routing.color` weights:
  ```
  const colorEnergy = bassEnergy * routing.color.bass + midEnergy * routing.color.mid + trebleEnergy * routing.color.treble;
  let t = max(colorEnergy, this.pulseLevel / 255);
  ```
- [ ] Add Advanced section to panel (collapsed by default, revealed via "Advanced" toggle):
  - 3x3 weight matrix: rows (Bass, Mid, Treble) x columns (Radius, Speed, Color)
  - Each cell: a small slider (0-1) with value label
  - Changes write to `AppSettings.routing` and are lockable
  - Kick tuning sliders: sensitivity (0.5-5.0, default 1.8), cooldown (50-500ms, default 200), floor (0-50, default 15)
  - Global reactivity slider (0.1-3.0, default 1.0)

## Acceptance Criteria

### Functional
- [ ] R1-R3: Single settings object with schema, serializable, `applySettings()` works
- [ ] R4: Settings schema covers all listed parameters
- [ ] R5-R7: Rolling buffer accumulates frames, spectral centroid computed, temporal stats available
- [ ] R8-R11: 8 archetypes, weighted distance matching, button-only generation, disabled when not playing
- [ ] R12-R16: Smooth HSL color transitions, ball fade via radius scaling, archetype in debug only
- [ ] R17-R21: Lock pins on all params, auto-lock after theme gen, flash on skipped, theme/user indicators
- [ ] R22-R25: Routing matrix configurable, hidden in Advanced, theme sets routing
- [ ] R26-R31: Collapsible sections, correct default states, kick tuning + reactivity in Advanced

### Quality Gates
- [ ] Dark Trap and Calm Classical archetypes produce visually distinct themes
- [ ] Color transitions don't produce muddy mid-tones (HSL path)
- [ ] Ball count transitions look smooth (grow in / shrink out)
- [ ] Lock pins work: manual edit auto-locks, Generate skips with flash
- [ ] Frame rate stays above 30fps with all systems active
- [ ] Generate button correctly disabled when audio paused or buffer < 64 frames
- [ ] All existing functionality (kick detection, individual/merge modes, file upload) continues to work

## Dependencies & Risks

- **Archetype tuning:** The 8 feature profiles are hand-tuned starting points. They will need iteration with real audio. The weighted distance approach makes tuning straightforward — adjust profile vectors and feature weights.
- **Performance:** Rolling buffer (128 objects) + spectral centroid (1024-bin weighted sum) + theme distance computation (8 archetypes) adds per-frame cost. The distance computation only runs on button press, not every frame. The buffer push and centroid are lightweight.
- **Panel size:** With collapsible sections, lock pins, and the Advanced section, the panel is significantly larger. Collapsing by default mitigates this.
- **The kick detection `const` declarations** need to become `let` — straightforward but touches a sensitive module.
- **No test framework exists.** All verification is manual/visual.

## Sources & References

### Origin
- **Origin document:** [docs/brainstorms/2026-04-06-ml-audio-pipeline-requirements.md](docs/brainstorms/2026-04-06-ml-audio-pipeline-requirements.md) — Key decisions: button-only generation, 8 archetypes, advanced toggle for routing, auto-lock on manual edit, HSL color transitions, fade in/out for ball count, kick tuning in Advanced, no archetype label in casual UI.

### Internal References
- `displays/ballDisplay.js:57,61,86` — hardcoded band-to-parameter mappings to refactor
- `displays/ballMerge.js:13` — merged blob color uses trebleEnergy directly
- `detections/kickDetection.js:8,35,38` — const/hardcoded kick params to make mutable
- `sketch.js:22-27` — noise floor function to parameterize with reactivity
- `sketch.js:29-49` — draw loop hook points for feature extraction
- `ui/index.js:51-55` — panel setup sequence to refactor with collapsible sections
- `ui/ballControls.js:60-85` — slider/checkbox handlers to add lock pin + auto-lock
- `ui/colorControls.js:59-62` — color picker handlers to add lock pin + auto-lock
