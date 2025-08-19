let pilsplaat, dawg, fft, amplitude, fhk;
const freqRanges = {
    low: { min: 20, max: 250, level: 0, peak: 0 },
    mid: { min: 251, max: 4000, level: 0, peak: 0 },
    high: { min: 4001, max: 20000, level: 0, peak: 0 }
};
const bassThreshold = 30;

function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav');
    dawg = loadImage('assets/dog.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fft = new p5.FFT(0.8, 1024);

    fft.setInput(pilsplaat);

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

function kickDetect() {

    let bassEnergy = fft.getEnergy('bass');

    if (bassEnergy > bassThreshold) {
        image(dawg, 0, 0, width, height);
    }
}

function draw() {
    background(255);
        
    let spectrum = fft.analyze();
    
    kickDetect();

    let w = width / spectrum.length*10;
            
    for (let i = 0; i < spectrum.length/10; i++) {
        // Map frequency amplitude to height
        let amp = spectrum[i];
        let h = map(amp, 0, 255, 0, height - 50);
        
        // Create color based on frequency
        let hue = map(i, 0, spectrum.length, 0, 360);
        colorMode(HSB);
        fill(hue, 80, map(amp, 0, 255, 30, 100));
        
        // Draw bar
        rect(i * w, height - h - 25, w - 1, h);
        if (amp > 50) {
            fill(hue, 60, 40, 0.3);
            rect(i * w - 2, height - h - 27, w + 3, h + 4);
        }   
    }
}