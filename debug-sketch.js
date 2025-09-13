let pilsplaat, dawg, fft;
let currentTrack = null;
let fileInput, trackNameText;

// Flash text variables
let flashActive = false;
let flashStartTime = 0;
let flashDuration = 60; 
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
    fileInput.style('color', '#fff');
    fileInput.position(20, 20);

    const button = createButton('Play');
    button.position(20, 50);
    button.mousePressed(() => {
        userStartAudio();

        const snd = getActiveSound();
        if (!snd) return;

        if (snd.isPlaying()) snd.pause();
        else snd.loop();
    });

}

function draw() {
    background(0);
    let spectrum = fft.analyze();

    if (kickDetect(spectrum)) {
        onEventDetected();
    }

    // Draw flashing "kick" text
    drawFlashText("TEST");

    // commenting out spectrum display bars
    // displayFullSpectrum(spectrum); 
}

function onEventDetected() {
    console.log('Event detected!');
    flashActive = true;
    flashStartTime = millis();
}

function drawFlashText(label) {
    if (flashActive) {
        let elapsed = millis() - flashStartTime;
        if (elapsed >= flashDuration) {
            flashActive = false;
        }
        
        // Draw background box
        fill(255, 50, 50, 200); // red-ish background with transparency
        stroke(255);
        strokeWeight(3);
        rectMode(CENTER);
        rect(width/2, height/2, 200, 80, 10); // rounded corners
        
        // Draw text
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(48);
        textStyle(BOLD);
        text(label, width/2, height/2);
    }
}