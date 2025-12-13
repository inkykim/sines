let uiContainer;
let uiVisible = false;

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

    // Setup all UI controls
    setupColorControls(uiContainer);
    setupBallControls(uiContainer);
    setupAudioControls();
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
                
            case 'KeyI':
                event.preventDefault();
                // Toggle title display
                toggleTitle();
                break;
        }
    });
}
