let basePicker, peakPicker, bgPicker;
let BG_COLOR = [0, 0, 0];

function setBgColorFromHex(hex) {
    const c = color(hex);
    BG_COLOR = [red(c), green(c), blue(c)];
}

function setupColorControls(container) {
    // Base color
    const baseWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '8px');
    createSpan('Base color').parent(baseWrap);
    const baseRight = createDiv('').parent(baseWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px');
    basePicker = createColorPicker('#000000').parent(baseRight)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');
    baseColorLockPin = createLockPin(baseRight, 'baseColor');

    // Peak color
    const peakWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '8px');
    createSpan('Peak color').parent(peakWrap);
    const peakRight = createDiv('').parent(peakWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px');
    peakPicker = createColorPicker('#FFFFFF').parent(peakRight)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');
    peakColorLockPin = createLockPin(peakRight, 'peakColor');

    // Background color
    const bgWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    createSpan('Background').parent(bgWrap);
    const bgRight = createDiv('').parent(bgWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px');
    bgPicker = createColorPicker('#000000').parent(bgRight)
        .style('width', '40px')
        .style('height', '28px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer');
    bgColorLockPin = createLockPin(bgRight, 'bgColor');

    // Register UI sync so applySettings() can update pickers
    registerUISync('baseColor', (val) => basePicker.value(_rgbToHex(val)));
    registerUISync('peakColor', (val) => peakPicker.value(_rgbToHex(val)));
    registerUISync('bgColor', (val) => bgPicker.value(_rgbToHex(val)));

    // Set up color picker event handlers
    basePicker.input(() => {
        setBaseColorFromHex(basePicker.value());
        if (themeSetParams.has('baseColor')) {
            lockParam('baseColor');
            updateLockPinUI(baseColorLockPin, 'baseColor');
        }
    });
    peakPicker.input(() => {
        setPeakColorFromHex(peakPicker.value());
        if (themeSetParams.has('peakColor')) {
            lockParam('peakColor');
            updateLockPinUI(peakColorLockPin, 'peakColor');
        }
    });
    bgPicker.input(() => {
        setBgColorFromHex(bgPicker.value());
        if (themeSetParams.has('bgColor')) {
            lockParam('bgColor');
            updateLockPinUI(bgColorLockPin, 'bgColor');
        }
    });
}

function getBackgroundColor() {
    return BG_COLOR;
}
