let titleContainer, titleText, instructionsText;
let titleVisible = true;

function setupTitleDisplay() {
    // Create title container
    titleContainer = createDiv('')
        .style('position', 'fixed')
        .style('bottom', '40px')
        .style('left', '50%')
        .style('transform', 'translateX(-50%)')
        .style('text-align', 'center')
        .style('z-index', '100')
        .style('pointer-events', 'none');

    // Main title "sines" in 8-bit pixel style font
    titleText = createDiv('sines')
        .parent(titleContainer)
        .style('font-family', '"VT323", "Press Start 2P", "Pixelify Sans", "Courier New", monospace')
        .style('font-size', '56px')
        .style('font-weight', '700')
        .style('color', '#ffffff')
        .style('text-shadow', '3px 3px 0px #000000, 6px 6px 12px rgba(0,0,0,0.6)')
        .style('letter-spacing', '4px')
        .style('margin-bottom', '8px')
        .style('user-select', 'none')
        .style('text-transform', 'lowercase')
        .style('image-rendering', 'pixelated')
        .style('image-rendering', '-moz-crisp-edges')
        .style('image-rendering', 'crisp-edges')
        .style('font-smooth', 'never')
        .style('-webkit-font-smoothing', 'none')
        .style('-moz-osx-font-smoothing', 'unset');

    // Instructions text
    instructionsText = createDiv('spacebar: play/pause, e: customize, i: hide text')
        .parent(titleContainer)
        .style('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif')
        .style('font-size', '14px')
        .style('color', '#999999')
        .style('user-select', 'none');
}

function toggleTitle() {
    titleVisible = !titleVisible;
    if (titleVisible) {
        titleContainer.style('display', 'block');
    } else {
        titleContainer.style('display', 'none');
    }
}

function hideTitleDisplay() {
    titleVisible = false;
    titleContainer.style('display', 'none');
}

function showTitleDisplay() {
    titleVisible = true;
    titleContainer.style('display', 'block');
}