// Audio detection functions and variables

// Spectral flux kick detection variables
let prevLowSpectrum = [];
let spectralFluxBuffer = [];
const fluxBufferSize = 20;
let lastKickTime = 0;
const kickCooldown = 200; // ms

// Spectral flux kick detection for low frequencies
function kickDetect(spectrum) {
    let lowBinStart = 1;
    let lowBinEnd = 7;
    let kickDetected = false
    
    let currentLowSpectrum = spectrum.slice(lowBinStart, lowBinEnd + 1);
    
    if (prevLowSpectrum.length > 0) {
        let flux = 0;
        for (let i = 0; i < currentLowSpectrum.length; i++) {
            let diff = currentLowSpectrum[i] - prevLowSpectrum[i];
            if (diff > 0) flux += diff;
        }
        
        spectralFluxBuffer.push(flux);
        if (spectralFluxBuffer.length > fluxBufferSize) spectralFluxBuffer.shift();
        
        let meanFlux = spectralFluxBuffer.reduce((a, b) => a + b, 0) / spectralFluxBuffer.length;
        let threshold = meanFlux * 1.8;
        
        let now = millis();
        if (flux > threshold && flux > 15 && now - lastKickTime > kickCooldown) {
            kickDetected = true;
            lastKickTime = now;
        }
    }
    
    prevLowSpectrum = [...currentLowSpectrum];

    return kickDetected;
}
