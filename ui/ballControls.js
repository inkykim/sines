let ballCountSlider, ballCountLabel;
let speedSlider, speedLabel;
let mergeToggle;

function setupBallControls(container) {
    // Ball count
    const countWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '12px');
    createSpan('Ball Count').parent(countWrap);
    const countControls = createDiv('').parent(countWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px');
    ballCountSlider = createSlider(1, 20, 10, 1).parent(countControls)
        .style('width', '100px');
    ballCountLabel = createSpan(ballCountSlider.value()).parent(countControls)
        .style('min-width', '20px')
        .style('text-align', 'center');
    ballCountLockPin = createLockPin(countControls, 'ballCount');

    // Speed
    const speedWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '12px');
    createSpan('Speed').parent(speedWrap);
    const speedControls = createDiv('').parent(speedWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px');
    speedSlider = createSlider(1, 10, 4, 1).parent(speedControls)
        .style('width', '100px');
    speedLabel = createSpan(speedSlider.value()).parent(speedControls)
        .style('min-width', '20px')
        .style('text-align', 'center');
    speedLockPin = createLockPin(speedControls, 'speed');

    // Meta mode
    const mergeWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    createSpan('Meta Mode').parent(mergeWrap);
    const mergeRight = createDiv('').parent(mergeWrap)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px');
    mergeToggle = createCheckbox('', USE_METAMERGE).parent(mergeRight)
        .style('width', '18px')
        .style('height', '18px')
        .style('cursor', 'pointer');
    metaModeLockPin = createLockPin(mergeRight, 'metaMode');

    // Clean display (hide title/instructions)
    const cleanWrap = createDiv('').parent(container)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    createSpan('Clean Display').parent(cleanWrap);
    const cleanToggle = createCheckbox('', false).parent(cleanWrap)
        .style('width', '18px')
        .style('height', '18px')
        .style('cursor', 'pointer');
    cleanToggle.changed(() => {
        if (cleanToggle.checked()) hideTitleDisplay();
        else showTitleDisplay();
    });

    // Set up event handlers
    ballCountSlider.input(() => {
        setBallCount(ballCountSlider.value());
        ballCountLabel.html(ballCountSlider.value());
        if (themeSetParams.has('ballCount')) {
            lockParam('ballCount');
            updateLockPinUI(ballCountLockPin, 'ballCount');
        }
    });
    speedSlider.input(() => {
        setSpeed(speedSlider.value());
        speedLabel.html(speedSlider.value());
        if (themeSetParams.has('speed')) {
            lockParam('speed');
            updateLockPinUI(speedLockPin, 'speed');
        }
    });
    mergeToggle.changed(() => {
        USE_METAMERGE = mergeToggle.checked();
        if (themeSetParams.has('metaMode')) {
            lockParam('metaMode');
            updateLockPinUI(metaModeLockPin, 'metaMode');
        }
    });
}
