let pilsplaat, dawg, fft;

// Band energy globals (0-1, updated each frame, noise-floor filtered)
let bassEnergy = 0, midEnergy = 0, trebleEnergy = 0;

function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav');
    dawg = loadImage('assets/dog.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fft = new p5.FFT(0.8, 1024);

    fft.setInput(pilsplaat);

    setupUI();
    initializeBall();
}

// Soft ramp noise floor: energy below 12 maps to 0,
// 12-40 ramps linearly, above 40 maps linearly.
function applyNoiseFloor(raw) {
    if (raw < 12) return 0;
    if (raw < 40) return (raw - 12) / (40 - 12) * (40 / 255);
    return raw / 255;
}

function draw() {
    const bgColor = getBackgroundColor();
    background(bgColor[0], bgColor[1], bgColor[2]);
    let spectrum = fft.analyze();

    // Extract band energies with noise floor
    bassEnergy = applyNoiseFloor(fft.getEnergy("bass"));
    midEnergy = applyNoiseFloor(fft.getEnergy("mid"));
    trebleEnergy = applyNoiseFloor(fft.getEnergy("treble"));

    if (kickDetect(spectrum)) {
        onEventDetected();
    }

    updateBall();
    drawBall();

    if (typeof debugMode !== 'undefined' && debugMode) {
        drawDebugOverlay();
    }
}
