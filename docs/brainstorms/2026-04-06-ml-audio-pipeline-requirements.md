---
date: 2026-04-06
topic: ml-audio-pipeline
---

# ML Audio Pipeline & Settings Architecture

## Problem Frame
sines has no way to auto-generate visual settings from audio content. Users must manually dial in colors, speed, and ball count for every track. The settings are scattered globals with no unified access path, making presets, persistence, and programmatic control impossible. The vision: a "Generate Theme" button analyzes the playing audio and produces a coherent visual theme (dark trap → black+purple+fast, classical calm → desaturated+slow+few balls), while all settings remain manually customizable with clear auto/manual authority.

## Requirements

### Settings Layer
- R1. All visual parameters live in a single settings object with a declarative schema (id, label, type, min, max, default)
- R2. One `applySettings(partial)` function applies any subset of settings, syncs UI controls, and respects lock pins
- R3. Settings object is JSON-serializable for future preset/URL support
- R4. Settings schema includes: base color, peak color, bg color, ball count, speed, meta mode, band-to-parameter routing weights, kick sensitivity, kick cooldown, kick floor, global reactivity sensitivity

### Audio Feature Extraction
- R5. Maintain a rolling ring buffer of the last ~128 frames (~2 seconds at 60fps) storing per-frame: bassEnergy, midEnergy, trebleEnergy, kickDetected, spectralFlux
- R6. Compute spectral centroid each frame from the raw FFT spectrum (energy-weighted average bin index)
- R7. Expose temporal statistics from the buffer: mean, variance, and kick rate per window

### Rule-Based Theme Engine
- R8. Define a visual theme schema: base color, peak color, bg color, ball count, speed, meta mode, band-to-parameter routing weights, kick sensitivity
- R9. Ship 8 built-in audio archetypes: Dark Trap, Bright Pop, Calm Classical, Heavy/Metal, Ambient, Lo-Fi/Chill, Techno/House, Jazz
- R10. Each archetype has an expected feature profile (bass mean, mid mean, treble mean, centroid, kick rate, energy variance) and an associated visual theme
- R11. "Generate Theme" button analyzes the current audio feature buffer, computes weighted distance to each archetype, and applies the nearest match's theme
- R12. Theme generation only fires on explicit button press — no automatic analysis
- R13. Generate button is disabled when audio is not playing
- R14. Theme application uses smooth HSL interpolation (~30 frames) for colors, smooth lerp for numeric parameters
- R15. Ball count changes during theme transition use fade in/out: new balls fade in (opacity 0→1), removed balls fade out (1→0). Metaball class needs an opacity property.
- R16. Archetype name is NOT shown in the casual UI — it IS shown in the debug overlay and Advanced panel for developer visibility

### Auto-Manual Authority
- R17. Each parameter in the settings panel has a lock pin toggle
- R18. When locked, `applySettings()` skips that parameter — user's manual value is preserved
- R19. Manually editing a parameter after theme generation auto-locks that parameter
- R20. When "Generate Theme" runs with locked parameters, locked controls briefly flash/highlight to indicate they were skipped
- R21. Parameters show subtle visual state: "theme-set" vs "user-set"

### Band-to-Parameter Routing
- R22. The hardcoded bass→radius, mid→speed, treble→color mapping becomes configurable weights stored in the theme schema
- R23. Routing matrix is hidden by default behind an "Advanced" toggle in the panel
- R24. When exposed, show a 3-column matrix (radius, speed, color) x 3 rows (bass, mid, treble) with weight sliders (0-1)
- R25. Theme generation sets routing weights as part of the applied theme

### Panel Revamp
- R26. Panel sections are collapsible with expand/collapse toggles
- R27. Panel sections: Colors, Ball Settings, Audio Controls, Theme Generation, Advanced (contains routing matrix, kick tuning, reactivity)
- R28. Default state on open: Colors and Theme Generation expanded, rest collapsed
- R29. "Generate Theme" button lives in the Theme Generation section
- R30. Advanced section includes: kick sensitivity slider, kick cooldown slider, kick floor slider, global reactivity sensitivity slider, band routing matrix
- R31. Debug overlay shows matched archetype name and distance score after theme generation

## Success Criteria
- Clicking "Generate Theme" while playing a bass-heavy trap track produces a visually distinct theme from clicking it during a quiet classical passage
- All 8 archetypes produce meaningfully different visual themes
- Users can lock any parameter (or have it auto-lock on manual edit), generate a theme, and see locked values preserved with visual flash feedback
- Routing matrix in advanced mode allows remapping which bands drive which visual params
- Settings object is serializable (enables future preset/URL features)
- Ball count transitions feel smooth with fade in/out animation
- Color transitions through HSL space look natural (no muddy mid-tones)

## Scope Boundaries
- No server-side ML, no model weights, no external APIs — all client-side JS
- No preset save/load or URL sharing (foundation only — settings object is serializable but no persistence UI)
- No continuous/automatic theme adaptation — button-only
- No undo/redo
- No offline full-buffer audio analysis — real-time rolling buffer only
- No section boundary detection
- No per-band sensitivity sliders — one global reactivity slider only
- Archetype name not shown in casual UI (debug/advanced only)

## Key Decisions
- **Button-only generation**: User explicitly triggers. No auto on track load. Rationale: user stays in control.
- **8 built-in archetypes**: Dark Trap, Bright Pop, Calm Classical, Heavy/Metal, Ambient, Lo-Fi/Chill, Techno/House, Jazz. Rationale: wide mood coverage.
- **Advanced toggle for routing**: Hidden by default. Rationale: clean casual UI, full power for advanced users.
- **Auto-lock on manual edit**: Touching a slider after theme gen locks that param. Rationale: intuitive — "I changed this, keep it."
- **No archetype label in casual UI**: Classification is developer-facing only (debug overlay + advanced). Rationale: user judges by visual result, not label.
- **HSL color interpolation**: Colors transition through hue space. Rationale: avoids muddy RGB mid-tones.
- **Fade in/out for ball count**: New balls fade in, removed fade out. Rationale: polished transitions.
- **Kick tuning in Advanced**: Sensitivity, cooldown, floor become sliders. Rationale: all settings customizable.
- **Global reactivity slider**: One slider scales noise floor for all bands. Rationale: covers loud vs quiet track calibration without per-band complexity.
- **Audio must be playing**: Generate button disabled when paused. Rationale: buffer might contain stale data.

## Dependencies / Assumptions
- Spectral centroid can be computed cheaply from the existing 1024-bin FFT array
- 128-frame ring buffer provides sufficient temporal context for archetype matching
- p5.js DOM supports the collapsible section pattern needed for the panel
- Existing global setters continue to work and are wrapped by applySettings()

## Outstanding Questions

### Deferred to Planning
- [Affects R6][Needs research] Exact formula and normalization for spectral centroid from p5.FFT's 1024-bin array
- [Affects R9-R10][Needs research] Feature profiles for each of the 8 archetypes — requires listening tests and iteration
- [Affects R14][Technical] Best approach for HSL interpolation in p5.js (colorMode switching or manual conversion)
- [Affects R15][Technical] How to implement per-ball opacity in the Metaball class and in the metaball merge renderer (ballMerge.js scalar field doesn't naturally support per-ball opacity)
- [Affects R22][Technical] How to refactor hardcoded band mappings in Metaball.update() and .draw() to read from configurable weight arrays
- [Affects R26][Technical] Best p5.js DOM approach for collapsible sections

## Next Steps
→ `/ce:plan` for structured implementation planning
