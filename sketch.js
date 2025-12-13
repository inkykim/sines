let pilsplaat, dawg, fft;


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

function draw() {
    const bgColor = getBackgroundColor();
    background(bgColor[0], bgColor[1], bgColor[2]);
    let spectrum = fft.analyze();

    if (kickDetect(spectrum)) {
        onEventDetected();
    }

    updateBall();
    drawBall();

    // commenting out spectrum display bars
    // displayFullSpectrum(spectrum); 
}