// Gradient palette controls
let _paletteContainer = null;

function setupGradientControls(container) {
    // ── Palette Stops ────────────────────────────────────────────────────
    createDiv('Gradient Palette').parent(container)
        .style('color', '#ccc')
        .style('margin-bottom', '6px');

    _paletteContainer = createDiv('').parent(container);

    _renderPaletteStops();

    // Add stop button
    const addBtn = createButton('+ Add Stop').parent(container)
        .style('background', 'rgba(255,255,255,0.1)')
        .style('color', '#ccc')
        .style('border', '1px solid rgba(255,255,255,0.2)')
        .style('border-radius', '4px')
        .style('padding', '4px 10px')
        .style('cursor', 'pointer')
        .style('font-size', '11px')
        .style('margin-top', '6px');

    addBtn.mousePressed(function() {
        const palette = AppSettings.palette;
        if (palette.length >= 8) return;
        // Add a stop at the midpoint of the last two stops
        const lastPos = palette[palette.length - 1].position;
        const prevPos = palette.length >= 2 ? palette[palette.length - 2].position : 0;
        const newPos = (prevPos + lastPos) / 2;
        palette.splice(palette.length - 1, 0, {
            position: Math.round(newPos * 100) / 100,
            color: [128, 128, 128]
        });
        _onPaletteChanged();
        _renderPaletteStops();
    });

    // Register UI sync for applySettings()
    registerUISync('palette', function() {
        _renderPaletteStops();
    });
}

function _renderPaletteStops() {
    // Clear existing stop rows
    _paletteContainer.html('');

    const palette = AppSettings.palette;

    for (let i = 0; i < palette.length; i++) {
        const stop = palette[i];
        const row = createDiv('').parent(_paletteContainer)
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px')
            .style('margin-bottom', '4px');

        // Color picker
        const picker = createColorPicker(_rgbToHex(stop.color)).parent(row)
            .style('width', '32px')
            .style('height', '24px')
            .style('border', 'none')
            .style('border-radius', '3px')
            .style('cursor', 'pointer');

        // Position slider (0.00 - 1.00)
        const posSlider = createSlider(0, 1, stop.position, 0.01).parent(row)
            .style('width', '80px')
            .style('accent-color', '#888');

        const posLabel = createDiv(stop.position.toFixed(2)).parent(row)
            .style('width', '30px')
            .style('color', '#999')
            .style('font-size', '10px');

        // Remove button (only if more than 2 stops)
        if (palette.length > 2) {
            const removeBtn = createButton('x').parent(row)
                .style('background', 'none')
                .style('color', '#666')
                .style('border', 'none')
                .style('cursor', 'pointer')
                .style('font-size', '11px')
                .style('padding', '2px 4px');

            (function(idx) {
                removeBtn.mousePressed(function() {
                    AppSettings.palette.splice(idx, 1);
                    _onPaletteChanged();
                    _renderPaletteStops();
                });
            })(i);
        }

        // Wire up events
        (function(idx, pk, sl, pl) {
            pk.input(function() {
                const c = color(pk.value());
                AppSettings.palette[idx].color = [red(c), green(c), blue(c)];
                _onPaletteChanged();
            });
            sl.input(function() {
                const v = parseFloat(this.value());
                AppSettings.palette[idx].position = v;
                pl.html(v.toFixed(2));
                _onPaletteChanged();
            });
        })(i, picker, posSlider, posLabel);
    }
}

function _onPaletteChanged() {
    // Sort by position
    AppSettings.palette.sort(function(a, b) { return a.position - b.position; });
    // Sync base/peak colors
    const p = AppSettings.palette;
    if (p.length >= 2) {
        AppSettings.baseColor = p[0].color.slice();
        AppSettings.peakColor = p[p.length - 1].color.slice();
        if (typeof BASE_COLOR !== 'undefined') BASE_COLOR = p[0].color.slice();
        if (typeof PEAK_COLOR !== 'undefined') PEAK_COLOR = p[p.length - 1].color.slice();
        // Sync color pickers
        _syncUI('baseColor', p[0].color);
        _syncUI('peakColor', p[p.length - 1].color);
    }
    rebuildGradientLUT();
}
