let uiContainer;
let uiVisible = false;

// Lock pin references for auto-lock UI updates
let baseColorLockPin, peakColorLockPin, bgColorLockPin;
let ballCountLockPin, speedLockPin, metaModeLockPin;

function createCollapsibleSection(parent, title, defaultExpanded) {
    const section = createDiv('').parent(parent).style('margin-bottom', '16px');

    const header = createDiv('').parent(section)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('cursor', 'pointer')
        .style('padding', '4px 0')
        .style('user-select', 'none');

    const titleSpan = createSpan(title).parent(header)
        .style('font-weight', 'bold')
        .style('color', '#ccc');

    const arrow = createSpan(defaultExpanded ? '▾' : '▸').parent(header)
        .style('color', '#666')
        .style('font-size', '14px');

    const content = createDiv('').parent(section)
        .style('display', defaultExpanded ? 'block' : 'none')
        .style('padding-top', '8px');

    header.mousePressed(() => {
        const isOpen = content.style('display') !== 'none';
        content.style('display', isOpen ? 'none' : 'block');
        arrow.html(isOpen ? '▸' : '▾');
    });

    return content;
}

function createLockPin(parent, paramId) {
    const pin = createButton('🔓').parent(parent)
        .style('background', 'none')
        .style('border', 'none')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .style('padding', '2px 4px')
        .style('opacity', '0.5');

    pin.mousePressed(() => {
        if (isLocked(paramId)) {
            unlockParam(paramId);
            pin.html('🔓');
            pin.style('opacity', '0.5');
        } else {
            lockParam(paramId);
            pin.html('🔒');
            pin.style('opacity', '1');
        }
    });
    return pin;
}

function updateLockPinUI(pin, paramId) {
    if (pin) {
        if (isLocked(paramId)) {
            pin.html('🔒');
            pin.style('opacity', '1');
        } else {
            pin.html('🔓');
            pin.style('opacity', '0.5');
        }
    }
}

function setupUI() {
    // Create main UI container (hidden by default)
    uiContainer = createDiv('')
        .style('position', 'fixed')
        .style('top', '20px')
        .style('right', '20px')
        .style('width', '280px')
        .style('max-height', '80vh')
        .style('overflow-y', 'auto')
        .style('padding', '20px')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('backdrop-filter', 'blur(10px)')
        .style('border', '1px solid rgba(255,255,255,0.1)')
        .style('border-radius', '12px')
        .style('color', '#fff')
        .style('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif')
        .style('font-size', '12px')
        .style('display', 'none')
        .style('z-index', '999')
        .style('box-shadow', '0 8px 32px rgba(0,0,0,0.3)');

    // Add close button inside panel
    const closeButton = createButton('×')
        .parent(uiContainer)
        .style('position', 'absolute')
        .style('top', '10px')
        .style('right', '10px')
        .style('width', '24px')
        .style('height', '24px')
        .style('padding', '0')
        .style('background', 'rgba(255,255,255,0.1)')
        .style('color', '#fff')
        .style('border', 'none')
        .style('border-radius', '50%')
        .style('cursor', 'pointer')
        .style('font-size', '16px')
        .style('line-height', '1')
        .mousePressed(toggleUI);

    // Add title
    createDiv('Controls')
        .parent(uiContainer)
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('margin-bottom', '20px')
        .style('padding-right', '30px');

    // Setup all UI controls in collapsible sections
    const colorSection = createCollapsibleSection(uiContainer, 'Colors', true);
    setupColorControls(colorSection);

    const ballSection = createCollapsibleSection(uiContainer, 'Ball Settings', false);
    setupBallControls(ballSection);

    const audioSection = createCollapsibleSection(uiContainer, 'Audio Controls', false);
    setupAudioControls(audioSection);

    // Theme Generation section — expanded by default
    const themeSection = createCollapsibleSection(uiContainer, 'Theme Generation', true);
    setupThemeControls(themeSection);

    // Advanced section — collapsed by default
    const advancedSection = createCollapsibleSection(uiContainer, 'Advanced', false);
    setupAdvancedControls(advancedSection);

    setupTitleDisplay();

    // Initialize UI values
    setBaseColorFromHex(basePicker.value());
    setPeakColorFromHex(peakPicker.value());
    setBgColorFromHex(bgPicker.value());
    setBallCount(int(ballCountSlider.value()));
    setSpeed(int(speedSlider.value()));

    // Setup keyboard controls
    setupKeyboardControls();
}

function toggleUI() {
    uiVisible = !uiVisible;
    if (uiVisible) {
        uiContainer.style('display', 'block');
    } else {
        uiContainer.style('display', 'none');
    }
}

function setupKeyboardControls() {
    // Handle keyboard events
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                // Play/pause audio
                userStartAudio();
                const snd = getActiveSound();
                if (snd) {
                    if (snd.isPlaying()) snd.pause();
                    else snd.loop();
                }
                break;

            case 'KeyE':
                event.preventDefault();
                // Toggle UI panel
                toggleUI();
                break;

            case 'KeyD':
                event.preventDefault();
                // Toggle debug overlay
                toggleDebugMode();
                break;
        }
    });
}
