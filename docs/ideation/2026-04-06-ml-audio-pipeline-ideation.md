---
date: 2026-04-06
topic: ml-audio-pipeline
focus: ML pipeline for auto-generating visual settings from audio analysis, plus customization panel revamp
---

# Ideation: ML Audio Pipeline & Customization Revamp

## Codebase Context
- p5.js audio-reactive visual generator, vanilla JS, no build step
- FFT: 1024-bin, extracts bass/mid/treble energy each frame via fft.getEnergy()
- Kick detection via spectral flux on bins 1-7
- Signal composition: bass→radius, mid→speed, treble→color (hardcoded)
- UI panel: color pickers (base/peak/bg), ball count (1-20), speed (1-10), meta mode, clean display
- No persistence, no presets, no ML, no offline audio analysis
- All settings are scattered globals with individual setter functions

## Ranked Ideas

### 1. Unified Settings Layer (Foundation)
**Description:** Replace scattered globals with a single AppSettings object + declarative parameter schema + one applySettings(partial) function. ML, presets, URL restore, and UI all read/write through the same path.
**Rationale:** Foundation that everything else builds on. ML writes one object, presets are one-liners, adding a parameter is one schema entry.
**Downsides:** Medium migration to refactor existing globals.
**Confidence:** 95%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 2. Audio Feature Extraction Stack
**Description:** Rolling ring buffer of last ~128 frames with bass/mid/treble/kick/flux per frame. Add spectral centroid as new feature. Compute temporal stats (mean, variance, kick rate) from the buffer.
**Rationale:** Classifier needs temporal context — single FFT frame is noise. Variance and centroid are the most discriminative features for mood.
**Downsides:** Memory and per-frame computation overhead.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 3. Rule-Based Theme Engine
**Description:** Visual theme schema + lookup table of audio archetypes. Compare rolling feature vector against archetypes via weighted distance. Nearest archetype drives the theme. Ship with 5-8 hand-tuned archetypes.
**Rationale:** Achieves the ML vision without servers or model weights. Heuristic rules are auditable and define boundaries a future ML model would learn.
**Downsides:** Hand-tuning archetypes requires iteration. May not generalize to edge genres.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 4. Auto-Manual Authority System
**Description:** Per-parameter lock pins, smooth interpolation for ML-applied changes, override tracking, visible ML-set vs user-set state.
**Rationale:** Core tension in the vision is ML vs manual conflict. Lock pins resolve it cleanly.
**Downsides:** Adds UI complexity to every parameter.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Explored (2026-04-06)

### 5. Configurable Band-to-Parameter Routing Matrix
**Description:** Replace hardcoded bass→radius/mid→speed/treble→color with a configurable weight matrix. ML theme engine can set routing as part of a theme.
**Rationale:** True genre differentiation requires rerouting, not just magnitude changes. Biggest expressiveness unlock.
**Downsides:** Bad combinations look terrible. Needs constraints and sensible defaults.
**Confidence:** 80%
**Complexity:** Medium-High
**Status:** Explored (2026-04-06)

### 6. Preset System with A/B Compare + URL Sharing
**Description:** Named preset slots in localStorage, A/B toggle, ML auto-saves to "ML" slot, URL hash for sharing.
**Rationale:** Makes ML output valuable — generate, save, tweak, compare, share.
**Downsides:** URL length, localStorage tab conflicts.
**Confidence:** 90%
**Complexity:** Low-Medium
**Status:** Unexplored

### 7. Schema-Driven Panel Revamp
**Description:** UI panel renders dynamically from parameter schema. Self-registering sections. Collapsible groups for expanded parameter surface.
**Rationale:** Panel needs ~20+ controls. Hand-coding each is unsustainable.
**Downsides:** Upfront abstraction cost. p5.js DOM limitations.
**Confidence:** 75%
**Complexity:** Medium-High
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Mood-space 2D navigation | Premature abstraction |
| 2 | User interactions as ML training | Needs rules engine first |
| 3 | Canvas-as-settings-panel | Too radical a UX departure |
| 4 | Audio waveform scrubber | Tangential to ML pipeline |
| 5 | Section boundary detection | Complex, better as v2 |
| 6 | Offline full-buffer analysis | Heavyweight; rolling buffer sufficient |
| 7 | ML confidence bars | Premature — no ML model yet |
| 8 | Drift indicator | Subset of auto-manual system |
| 9 | Undo/redo stack | Tangential to core vision |
| 10 | Keyboard shortcut discovery | Minor UX |
| 11 | JSON file export/import | Subsumed by presets + URL |
| 12 | Per-band sensitivity sliders | Subset of routing matrix |
| 13 | Kick detection tuning | Subset of exposing all settings |
| 14 | Continuous time functions | Hard to control |
| 15 | Spectrum-derived auto-colors | Removes user agency |
| 16 | Settings change event bus | Implementation detail |
| 17 | Analysis progress indicator | Premature |
| 18 | UI section registration | Implementation detail of panel revamp |

## Session Log
- 2026-04-06: Initial ideation — 38 candidates generated across 5 frames, 7 survived. Ideas #1-5 selected for brainstorming.
