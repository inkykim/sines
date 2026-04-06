// Theme generation UI controls
let generateBtn;
let allLockedLabel;
let allLockedTimeout;

function setupThemeControls(container) {
    // Generate Theme button
    generateBtn = createButton('Generate Theme').parent(container)
        .style('width', '100%')
        .style('padding', '10px')
        .style('background', 'rgba(100, 80, 200, 0.3)')
        .style('color', '#fff')
        .style('border', '1px solid rgba(100, 80, 200, 0.5)')
        .style('border-radius', '6px')
        .style('cursor', 'pointer')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .style('margin-bottom', '8px')
        .style('transition', 'opacity 0.2s')
        .mousePressed(onGenerateTheme);

    // "All parameters locked" feedback label
    allLockedLabel = createDiv('').parent(container)
        .style('color', '#ffaa00')
        .style('font-size', '11px')
        .style('text-align', 'center')
        .style('display', 'none')
        .style('margin-top', '4px');
}

function onGenerateTheme() {
    // Check preconditions
    const snd = getActiveSound();
    if (!snd || !snd.isPlaying()) return;
    if (getBufferLength() < 64) return;

    const stats = getTemporalStats();
    if (!stats) return;

    const result = classifyAudio(stats);

    // Build the partial settings object from the theme
    const theme = result.theme;
    const partial = {};

    if (theme.baseColor) partial.baseColor = [...theme.baseColor];
    if (theme.peakColor) partial.peakColor = [...theme.peakColor];
    if (theme.bgColor) partial.bgColor = [...theme.bgColor];
    if (theme.ballCount !== undefined) partial.ballCount = theme.ballCount;
    if (theme.speed !== undefined) partial.speed = theme.speed;
    if (theme.metaMode !== undefined) partial.metaMode = theme.metaMode;
    if (theme.routing) partial.routing = JSON.parse(JSON.stringify(theme.routing));
    if (theme.kickSensitivity !== undefined) partial.kickSensitivity = theme.kickSensitivity;

    const result2 = applySettings(partial);

    // Flash locked controls and show feedback
    if (result2 && result2.skipped && result2.skipped.length > 0) {
        flashLockedParams(result2.skipped);
        if (result2.applied.length === 0) {
            showAllLockedFeedback();
        }
    }
}

function flashLockedParams(paramIds) {
    const pinMap = {
        baseColor: baseColorLockPin,
        peakColor: peakColorLockPin,
        bgColor: bgColorLockPin,
        ballCount: ballCountLockPin,
        speed: speedLockPin,
        metaMode: metaModeLockPin
    };
    for (const id of paramIds) {
        const pin = pinMap[id];
        if (pin) {
            pin.style('background', 'rgba(255, 170, 0, 0.3)');
            setTimeout(() => pin.style('background', 'none'), 300);
        }
    }
}

function showAllLockedFeedback() {
    allLockedLabel.html('All parameters locked');
    allLockedLabel.style('display', 'block');
    if (allLockedTimeout) clearTimeout(allLockedTimeout);
    allLockedTimeout = setTimeout(() => {
        allLockedLabel.style('display', 'none');
    }, 2000);
}

// Called from draw loop to update button disabled state
function updateGenerateButtonState() {
    if (!generateBtn) return;
    const snd = getActiveSound();
    const canGenerate = snd && snd.isPlaying() && getBufferLength() >= 64;
    generateBtn.style('opacity', canGenerate ? '1' : '0.4');
    generateBtn.style('pointer-events', canGenerate ? 'auto' : 'none');
}
