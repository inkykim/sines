let pilsplaat, dawg, fft;
let currentTrack = null;
let fileInput, trackNameText;

let basePicker, peakPicker, bgPicker;
let uiContainer;
let BG_COLOR = [0, 0, 0];

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

    const regenerateButton = createButton('Regenerate');
    regenerateButton.position(20, 80);
    regenerateButton.mousePressed(() => {
        initializeBall();
    });

    // UI color pickers
    uiContainer = createDiv('').style('position', 'fixed')
                             .style('top', '12px')
                             .style('right', '12px')
                             .style('padding', '10px 12px')
                             .style('background', 'rgba(0,0,0,0.5)')
                             .style('backdrop-filter', 'blur(6px)')
                             .style('border-radius', '12px')
                             .style('color', '#fff')
                             .style('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif')
                             .style('font-size', '12px');

    createSpan('Base color ').parent(uiContainer).style('margin-right', '6px');
    basePicker = createColorPicker('#FFFFFF');
    basePicker.parent(uiContainer)
                .style('margin-right', '14px')
                .style('width', '32px')
                .style('height', '24px')
                .style('border', 'none')
                .style('padding', '0');

    createSpan('Peak color ').parent(uiContainer).style('margin-right', '6px');
    peakPicker = createColorPicker('#FF0000');
    peakPicker.parent(uiContainer)
                .style('width', '32px')
                .style('height', '24px')
                .style('border', 'none')
                .style('padding', '0');
    
    createSpan('Background color ').parent(uiContainer).style('margin-right', '6px');
    bgPicker = createColorPicker('#000000');
    bgPicker.parent(uiContainer)
                .style('width', '32px')
                .style('height', '24px')
                .style('border', 'none')
                .style('padding', '0');

    const countWrap = createDiv('').parent(uiContainer);
    countWrap.style('display', 'flex').style('gap', '6px').style('align-items', 'center');
    createSpan('# Balls').parent(countWrap);
    ballCountSlider = createSlider(1, 20, 10, 1).parent(countWrap);
    ballCountSlider.style('width', '80px');
    ballCountLabel = createSpan(ballCountSlider.value()).parent(countWrap);

    const speedWrap = createDiv('').parent(uiContainer);
    speedWrap.style('display', 'flex').style('gap', '6px').style('align-items', 'center');
    createSpan('Speed').parent(speedWrap);
    speedSlider = createSlider(1, 10, 4, 1).parent(speedWrap);
    speedSlider.style('width', '80px');
    speedLabel = createSpan(speedSlider.value()).parent(speedWrap);

    const mergeWrap = createDiv('').parent(uiContainer);
    mergeWrap.style('display', 'flex').style('gap', '6px').style('align-items', 'center');
    createSpan('Meta Mode').parent(mergeWrap);
    mergeToggle = createCheckbox('', USE_METAMERGE).parent(mergeWrap);
    mergeToggle.style('width', '18px').style('height', '18px');

    initializeBall();

    setBaseColorFromHex(basePicker.value());
    setPeakColorFromHex(peakPicker.value());
    setBgColorFromHex(bgPicker.value());
    setBallCount(int(ballCountSlider.value()));
    setSpeed(int(speedSlider.value()));

    basePicker.input(() => setBaseColorFromHex(basePicker.value()));
    peakPicker.input(() => setPeakColorFromHex(peakPicker.value()));
    bgPicker.input(() => setBgColorFromHex(bgPicker.value()));
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

function setBgColorFromHex(hex) {
    const c = color(hex);
    BG_COLOR = [red(c), green(c), blue(c)];
}

function draw() {
    background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);
    let spectrum = fft.analyze();

    if (kickDetect(spectrum)) {
        onEventDetected();
    }

    updateBall();
    drawBall();

    // commenting out spectrum display bars
    // displayFullSpectrum(spectrum); 
}