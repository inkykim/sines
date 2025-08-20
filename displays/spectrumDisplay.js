function displayFullSpectrum(spectrum) {
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

