---
date: 2026-04-06
topic: open-ideation
focus: open-ended
---

# Ideation: sines Improvements

## Codebase Context
- p5.js audio-reactive visual generator, no build step, served via `npx serve`
- Modular JS via deferred script tags, heavy global state (balls[], colors, toggles)
- Kick detection via spectral flux analysis (low-frequency FFT bins 1-7 only)
- Dual rendering: individual circles vs metaball merged blob (incomplete marching squares)
- Color interpolation: base-to-peak on audio events
- UI: color pickers, ball controls, audio controls, title display
- Three entry points: index.html (main), debug.html (debug with file upload), hex.html (hex grid beta)
- Pain points: globals pollution, no event system, code duplication between sketch.js and debug-sketch.js, incomplete metaball marching squares, hard-coded thresholds

## Ranked Ideas

### 1. Multi-Band Frequency Reactivity
**Description:** The FFT is 1024 bins but only bins 1-7 (sub-bass) are ever read. Map bass/mid/treble bands to different visual parameters — bass drives radius pulse, mids drive velocity, treble drives jitter or color shift. Assign each ball a frequency band so they respond independently.
**Rationale:** Single biggest visual expressiveness upgrade. Makes the visualizer genre-agnostic instead of kick-drum-only. Uses data already being computed and discarded every frame.
**Downsides:** Requires tuning per-band thresholds. Visuals may become chaotic without good defaults.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 2. Complete the Marching Squares Implementation
**Description:** ballMerge.js only handles case 15 (all corners inside). The 14 edge-interpolation cases that produce smooth blob boundaries are missing. This is the visual centerpiece — it's half-implemented.
**Rationale:** Blocked multiplier. Every future visual built on the metaball renderer inherits the jagged edge. Fixing it once permanently upgrades the entire rendering stack.
**Downsides:** Marching squares edge cases are fiddly. ~100-150 lines of geometry code.
**Confidence:** 95%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 3. Microphone / Live Audio Input
**Description:** Add a mic input toggle. Route p5.AudioIn into the existing fft.setInput() call. Makes sines reactive to live music, a DJ set, or ambient room sound.
**Rationale:** Transforms sines from a music player skin into something usable at live events, installations, and presentations. Minimal code change, maximum use-case expansion.
**Downsides:** Browser permissions UX. Feedback loop if speakers are on.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

### 4. Screenshot & Canvas Export
**Description:** Add a key binding that calls saveCanvas(). Optionally add MediaRecorder-based short video capture.
**Rationale:** A generative visual tool that can't export its output is fundamentally incomplete.
**Downsides:** Video recording adds complexity; screenshot alone is trivial.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 5. Persistent Settings + Shareable URL State
**Description:** Serialize all knob state to localStorage on change and restore on load. Additionally encode state in URL hash for zero-friction sharing.
**Rationale:** Creative tools that wipe state on refresh feel unfinished. URL state is the web's native sharing primitive.
**Downsides:** URL gets long with many params. Need migration strategy if params change.
**Confidence:** 90%
**Complexity:** Low-Medium
**Status:** Unexplored

### 6. Collapse Debug Build Into Main App
**Description:** Delete debug.html and debug-sketch.js. Add a D key toggle in the main app that overlays live spectral flux, threshold value, FPS, and kick-fire indicators.
**Rationale:** The debug build duplicates the entire audio pipeline with diverging global variables. Collapsing it removes duplication and makes debugging available everywhere.
**Downsides:** Debug overlay needs to not interfere with the visual. Minor design work.
**Confidence:** 90%
**Complexity:** Low
**Status:** Explored (2026-04-06)

### 7. Event Bus + Audio Analysis Layer
**Description:** Add a minimal event bus so modules emit/subscribe instead of calling globals directly. Wrap fft.analyze() into an audioAnalyzer that publishes named signals each frame.
**Rationale:** The single change that makes every future feature easier. New features become self-contained subscribers.
**Downsides:** Medium-sized migration. Over-engineering risk for a creative coding project.
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Silent audio failure feedback | Valid but minor polish — low leverage |
| 2 | Play/pause state indicator | Minor UI tweak |
| 3 | Global variable collisions | Solved by collapsing debug build |
| 4 | Inconsistent setupAudioControls API | Minor refactor, solved by event bus |
| 5 | Per-ball color channels | Derivative of multi-band reactivity |
| 6 | BPM/tempo sync | High complexity, better as brainstorm variant |
| 7 | Threshold-free metaball rendering | Not clearly better than completing marching squares |
| 8 | Auto-adaptive kick gate | Part of audio analysis layer |
| 9 | Audio-derived parameter inference | Removes user agency |
| 10 | Reactive background field | Artistic direction, not structural improvement |
| 11 | Per-frequency hue assignment | Removes user color choice |
| 12 | Spatial culling for metaball grid | Premature optimization |
| 13 | Visuals drive audio | Different project entirely |
| 14 | Boundary contour as exportable SVG | Niche, depends on marching squares first |
| 15 | Hex grid as primary renderer | Half-built, needs event bus first |
| 16 | Particle system instead of balls | Different project |
| 17 | Self-modifying autonomous controls | Confusing UX |
| 18 | Record and replay timeline | High complexity for uncertain value |
| 19 | Pluggable renderer interface | Premature abstraction |
| 20 | Reactive CSS custom properties | Minor UI enhancement |
| 21 | Kick detection sensitivity UI | Subsumed by multi-band reactivity |
| 22 | Shareable preset save/load | Subsumed by URL state |

## Session Log
- 2026-04-06: Initial ideation — 39 candidates generated across 5 frames, 7 survivors. Ideas #1, #2, #6 selected for brainstorming.
