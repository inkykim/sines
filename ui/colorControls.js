let basePicker, peakPicker, bgPicker;
let BG_COLOR = [0, 0, 0];

function setBgColorFromHex(hex) {
    const c = color(hex);
    BG_COLOR = [red(c), green(c), blue(c)];
}

function setupColorControls(uiContainer) {
    // Color section title
    createDiv('Colors')
        .parent(uiContainer)
        .style('font-weight', 'bold')
        .style('margin', '0 0 10px 0')
        .style('color', '#ccc');

    // Base color
    const baseWrap = createDiv('').parent(uiContainer)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '8px');
    createSpan('Base color').parent(baseWrap);
    basePicker = createColorPicker('#000000').parent(baseWrap)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');

    // Peak color
    const peakWrap = createDiv('').parent(uiContainer)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '8px');
    createSpan('Peak color').parent(peakWrap);
    peakPicker = createColorPicker('#FFFFFF').parent(peakWrap)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');
    
    // Background color
    const bgWrap = createDiv('').parent(uiContainer)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    createSpan('Background').parent(bgWrap);
    bgPicker = createColorPicker('#000000').parent(bgWrap)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');

    // Set up color picker event handlers
    basePicker.input(() => setBaseColorFromHex(basePicker.value()));
    peakPicker.input(() => setPeakColorFromHex(peakPicker.value()));
    bgPicker.input(() => setBgColorFromHex(bgPicker.value()));
}

function getBackgroundColor() {
    return BG_COLOR;
}
