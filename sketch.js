let pilsplaat, fft;
let audioLoadError = false;

// Band energy globals (0-1, updated each frame, noise-floor filtered)
let bassEnergy = 0, midEnergy = 0, trebleEnergy = 0;

function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav',
        function() { /* success */ },
        function(err) { console.error('Failed to load default audio:', err); audioLoadError = true; }
    );
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fft = new p5.FFT(0.8, 1024);

    fft.setInput(pilsplaat);

    setupUI();
    initializeBall();
}

// Soft ramp noise floor: energy below low maps to 0,
// low-high ramps linearly, above high maps linearly.
// Thresholds are scaled by AppSettings.reactivity (higher = more sensitive).
function applyNoiseFloor(raw) {
    const low  = 12 / AppSettings.reactivity;
    const high = 40 / AppSettings.reactivity;
    if (raw < low) return 0;
    if (raw < high) return (raw - low) / (high - low) * (high / 255);
    return raw / 255;
}

function draw() {
    const bgColor = getBackgroundColor();
    background(bgColor[0], bgColor[1], bgColor[2]);

    // Show error overlay if audio failed to load
    if (audioLoadError) {
        push();
        fill(255, 80, 80);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16);
        text('Audio failed to load. Try uploading a file.', width / 2, height / 2);
        pop();
    }

    let spectrum = fft.analyze();

    // Extract band energies with noise floor
    bassEnergy = applyNoiseFloor(fft.getEnergy("bass"));
    midEnergy = applyNoiseFloor(fft.getEnergy("mid"));
    trebleEnergy = applyNoiseFloor(fft.getEnergy("treble"));

    const centroid = computeSpectralCentroid(spectrum);
    const kickDetected = kickDetect(spectrum);
    if (kickDetected) onEventDetected();
    pushAudioFrame(bassEnergy, midEnergy, trebleEnergy, kickDetected, lastFlux, centroid);

    updateBall();
    drawBall();

    if (typeof updateGenerateButtonState === 'function') updateGenerateButtonState();

    if (typeof debugMode !== 'undefined' && debugMode) {
        drawDebugOverlay();
    }
}
