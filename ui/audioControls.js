let fileInput, trackNameText;
let currentTrack = null;

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

function setupAudioControls() {
    // Audio section title
    createDiv('Audio Controls')
        .parent(uiContainer)
        .style('font-weight', 'bold')
        .style('margin', '0 0 10px 0')
        .style('color', '#ccc');

    // File input
    const fileWrap = createDiv('').parent(uiContainer)
    fileInput = createFileInput(handleAudioFile, false).parent(fileWrap)
        .style('width', '90%')
        .style('color', '#fff')
        .style('border', '1px solid rgba(255,255,255,0.2)')
        .style('border-radius', '4px')
        .style('padding', '6px');

    // Track name display
    trackNameText = createDiv('Default: pilsplaat.wav').parent(uiContainer)
        .style('margin-bottom', '12px')
        .style('font-size', '11px')
        .style('color', '#aaa')
        .style('font-style', 'italic');

    // Control buttons
    const buttonWrap = createDiv('').parent(uiContainer)
        .style('display', 'flex')
        .style('gap', '8px')
        .style('margin-bottom', '20px');

    const regenerateButton = createButton('Regenerate').parent(buttonWrap)
        .style('width', '100%')
        .style('padding', '8px')
        .style('background', 'rgba(255,255,255,0.1)')
        .style('color', '#fff')
        .style('border', '1px solid rgba(255,255,255,0.2)')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .mousePressed(() => {
            initializeBall();
        });
}
