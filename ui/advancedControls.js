// Advanced panel: routing matrix, kick tuning, reactivity, archetype info
let _archetypeInterval = null;

function setupAdvancedControls(container) {
    // Clear any existing poll interval (prevents leak on re-init)
    if (_archetypeInterval) { clearInterval(_archetypeInterval); _archetypeInterval = null; }
    // ── Band Routing (3x3 matrix) ─────────────────────────────────────────
    createDiv('Band Routing').parent(container)
        .style('font-weight', 'bold')
        .style('color', '#ccc')
        .style('margin-bottom', '6px');

    // Column headers
    const headerRow = createDiv('').parent(container)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '2px');
    createDiv('').parent(headerRow).style('width', '50px'); // spacer for row label
    const colLabels = ['Radius', 'Speed', 'Color', 'Gradient'];
    for (const label of colLabels) {
        createDiv(label).parent(headerRow)
            .style('width', '60px')
            .style('text-align', 'center')
            .style('color', '#999')
            .style('font-size', '10px');
    }

    const bands = ['bass', 'mid', 'treble'];
    const params = ['radius', 'speed', 'color', 'gradient'];
    const bandLabels = { bass: 'Bass', mid: 'Mid', treble: 'Treble' };

    for (const band of bands) {
        const row = createDiv('').parent(container)
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-bottom', '4px');

        createDiv(bandLabels[band]).parent(row)
            .style('width', '50px')
            .style('color', '#ccc')
            .style('font-size', '11px');

        for (const param of params) {
            const cell = createDiv('').parent(row)
                .style('width', '60px')
                .style('text-align', 'center');

            const slider = createSlider(0, 1, AppSettings.routing[param][band], 0.1).parent(cell)
                .style('width', '50px')
                .style('accent-color', '#888');

            // Capture current param/band in closure
            (function(p, b, sl) {
                sl.input(function() {
                    AppSettings.routing[p][b] = parseFloat(this.value());
                });
            })(param, band, slider);
        }
    }

    // ── Kick Detection ────────────────────────────────────────────────────
    createDiv('Kick Detection').parent(container)
        .style('font-weight', 'bold')
        .style('color', '#ccc')
        .style('margin-top', '12px')
        .style('margin-bottom', '6px');

    // Sensitivity
    _advancedSliderRow(container, 'Sensitivity', 0.5, 5.0, kickSensitivityMultiplier, 0.1, function(val) {
        kickSensitivityMultiplier = val;
        AppSettings.kickSensitivity = val;
    });

    // Cooldown
    _advancedSliderRow(container, 'Cooldown', 50, 500, kickCooldown, 10, function(val) {
        kickCooldown = val;
        AppSettings.kickCooldown = val;
    });

    // Floor
    _advancedSliderRow(container, 'Floor', 0, 50, kickMinFloor, 1, function(val) {
        kickMinFloor = val;
        AppSettings.kickFloor = val;
    });

    // ── Reactivity ────────────────────────────────────────────────────────
    createDiv('Reactivity').parent(container)
        .style('font-weight', 'bold')
        .style('color', '#ccc')
        .style('margin-top', '12px')
        .style('margin-bottom', '6px');

    _advancedSliderRow(container, 'Global', 0.1, 3.0, AppSettings.reactivity, 0.1, function(val) {
        AppSettings.reactivity = val;
    });

    // ── Archetype Display ─────────────────────────────────────────────────
    createDiv('Archetype').parent(container)
        .style('font-weight', 'bold')
        .style('color', '#ccc')
        .style('margin-top', '12px')
        .style('margin-bottom', '4px');

    const archetypeLabel = createDiv('--').parent(container)
        .style('color', '#999')
        .style('font-size', '11px')
        .style('font-style', 'italic')
        .id('adv-archetype-label');

    // Poll archetype every ~500ms
    _archetypeInterval = setInterval(function() {
        const el = select('#adv-archetype-label');
        if (!el) return;
        if (typeof lastClassification !== 'undefined' && lastClassification) {
            el.html(lastClassification.archetype + ' (d=' + lastClassification.distance.toFixed(3) + ')');
        } else {
            el.html('--');
        }
    }, 500);
}

// Helper: creates a labeled slider row (label left, slider + value right)
function _advancedSliderRow(parent, label, min, max, defaultVal, step, onChange) {
    const row = createDiv('').parent(parent)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '4px');

    createDiv(label).parent(row)
        .style('width', '70px')
        .style('color', '#ccc')
        .style('font-size', '11px');

    const slider = createSlider(min, max, defaultVal, step).parent(row)
        .style('width', '120px')
        .style('accent-color', '#888');

    const valLabel = createDiv(String(defaultVal)).parent(row)
        .style('width', '40px')
        .style('text-align', 'right')
        .style('color', '#999')
        .style('font-size', '11px');

    slider.input(function() {
        const v = parseFloat(this.value());
        valLabel.html(String(v));
        onChange(v);
    });
}
