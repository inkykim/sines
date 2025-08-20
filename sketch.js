let pilsplaat, dawg, fft;
let currentTrack = null;
let fileInput, trackNameText;

function getActiveSound() {
    // prefer user-uploaded track, fallback to pilsplaat
    return currentTrack || pilsplaat;
}

function handleAudioFile(file) {
    if (!file || file.type !== 'audio') {
        console.warn('Please choose an audio file.');
        return;
    }

    // Load the chosen audio; file.data is a data URL
    loadSound(file.data, (snd) => {
        // stop any currently playing track
        const prev = getActiveSound();
        if (prev.isPlaying()) prev.stop();
    
        currentTrack = snd;
        fft.setInput(currentTrack);          // route FFT to new track
    
        // auto-play the new track in a loop
        userStartAudio();
        currentTrack.loop();
    
        // update label
        trackNameText.html(`${file.name}`);
        }, (err) => {
        console.error('Failed to load audio:', err);
    });
}


function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav');
    dawg = loadImage('assets/dog.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fft = new p5.FFT(0.8, 1024);

    fft.setInput(pilsplaat);

    // UI file picker and text
    fileInput = createFileInput(handleAudioFile, false); // false on multiple file input
    fileInput.position(20, 20);
    trackNameText = createSpan('pilsplaat.wav');
    trackNameText.position(150, 25);
    trackNameText.style('color', '#bbb');

    const button = createButton('Play');
    button.position(150, 50);
    button.mousePressed(() => {
        userStartAudio();

        const snd = getActiveSound();
        if (!snd) return;

        if (snd.isPlaying()) snd.pause();
        else snd.loop();
    });

    initializeBall();
}

function draw() {
    background(0);
    let spectrum = fft.analyze();

    if (kickDetect(spectrum)) {
        onEventDetected();
    }

    updateBall();
    updateFlash();
    drawBall();

    // commenting out spectrum display bars
    // displayFullSpectrum(spectrum); 
}