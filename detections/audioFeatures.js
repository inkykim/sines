// Ring buffer of audio features (max 128 frames, ~2 seconds at 60fps)
let audioFeatureBuffer = [];
const AUDIO_BUFFER_SIZE = 128;

function pushAudioFrame(bass, mid, treble, kickDetected, flux, centroid) {
    audioFeatureBuffer.push({ bass, mid, treble, kick: kickDetected ? 1 : 0, flux, centroid });
    if (audioFeatureBuffer.length > AUDIO_BUFFER_SIZE) audioFeatureBuffer.shift();
}

function getBufferLength() {
    return audioFeatureBuffer.length;
}

function computeSpectralCentroid(spectrum) {
    // Energy-weighted average of bin indices, normalized to 0-1
    let weightedSum = 0;
    let totalEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
        weightedSum += i * spectrum[i];
        totalEnergy += spectrum[i];
    }
    if (totalEnergy === 0) return 0;
    return (weightedSum / totalEnergy) / spectrum.length;  // normalized 0-1
}

function getTemporalStats() {
    const len = audioFeatureBuffer.length;
    if (len === 0) return null;

    // Compute means
    let bassMean=0, midMean=0, trebleMean=0, centroidMean=0, kickCount=0, fluxMean=0;
    for (const f of audioFeatureBuffer) {
        bassMean += f.bass;
        midMean += f.mid;
        trebleMean += f.treble;
        centroidMean += f.centroid;
        kickCount += f.kick;
        fluxMean += f.flux;
    }
    bassMean /= len; midMean /= len; trebleMean /= len;
    centroidMean /= len; fluxMean /= len;

    // Compute variances
    let bassVar=0, midVar=0, trebleVar=0, centroidVar=0;
    for (const f of audioFeatureBuffer) {
        bassVar += (f.bass - bassMean) ** 2;
        midVar += (f.mid - midMean) ** 2;
        trebleVar += (f.treble - trebleMean) ** 2;
        centroidVar += (f.centroid - centroidMean) ** 2;
    }
    bassVar /= len; midVar /= len; trebleVar /= len; centroidVar /= len;

    return {
        bassMean, bassVariance: bassVar,
        midMean, midVariance: midVar,
        trebleMean, trebleVariance: trebleVar,
        centroidMean, centroidVariance: centroidVar,
        kickRate: kickCount / len,  // kicks per frame (0-1)
        fluxMean
    };
}
