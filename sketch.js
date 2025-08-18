let pilsplaat, dawg, fft, amplitude;
const freqRanges = {
    low: { min: 20, max: 250, level: 0, peak: 0 },
    mid: { min: 250, max: 4000, level: 0, peak: 0 },
    high: { min: 4000, max: 20000, level: 0, peak: 0 }
};

function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav');
    dawg = loadImage('assets/dog.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fft = new p5.FFT(0.8, 1024);
    amplitude = new p5.Amplitude(); 
    fft.setInput(pilsplaat);
    amplitude.setInput(pilsplaat);
    const button = createButton('Play');
    button.position(150, 50);
    button.mousePressed(() => {
        userStartAudio();

        if (!pilsplaat) return;

        if (pilsplaat.isPlaying()) {
            pilsplaat.pause();
        } else {
            pilsplaat.loop();
        }
    });
}

function draw() {
    background(255);
    image(dawg, 100, 110, 300, 300);
    
    freqRanges.low.level = fft.getEnergy(freqRanges.low.min, freqRanges.low.max);
    freqRanges.mid.level = fft.getEnergy(freqRanges.mid.min, freqRanges.mid.max);
    freqRanges.high.level = fft.getEnergy(freqRanges.high.min, freqRanges.high.max);

    noStroke();
    fill(255, 0, 0);
    rect(100, 450, 50, -freqRanges.low.level);
    fill(0, 255, 0);
    rect(200, 450, 50, -freqRanges.mid.level);
    fill(0, 0, 255);
    rect(300, 450, 50, -freqRanges.high.level);
}