let ballCountSlider, ballCountLabel;
let speedSlider, speedLabel;
let mergeToggle;

function setupBallControls(uiContainer) {
    // Ball section title
    createDiv('Ball Settings')
        .parent(uiContainer)
        .style('font-weight', 'bold')
        .style('margin', '0 0 10px 0')
        .style('color', '#ccc');

    // Ball count
    const countWrap = createDiv('').parent(uiContainer)
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

    // Speed
    const speedWrap = createDiv('').parent(uiContainer)
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

    // Meta mode
    const mergeWrap = createDiv('').parent(uiContainer)
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    createSpan('Meta Mode').parent(mergeWrap);
    mergeToggle = createCheckbox('', USE_METAMERGE).parent(mergeWrap)
        .style('width', '18px')
        .style('height', '18px')
        .style('cursor', 'pointer');

    // Set up event handlers
    ballCountSlider.input(() => {
        setBallCount(ballCountSlider.value());
        ballCountLabel.html(ballCountSlider.value());
    });
    speedSlider.input(() => {
        setSpeed(speedSlider.value());
        speedLabel.html(speedSlider.value());
    });
    mergeToggle.changed(() => {
        USE_METAMERGE = mergeToggle.checked();
    });
}
