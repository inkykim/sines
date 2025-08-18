let pilsplaat, dawg;

function preload() {
    pilsplaat = loadSound('assets/pilsplaat.wav');
    dawg = loadImage('assets/dog.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
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
}x