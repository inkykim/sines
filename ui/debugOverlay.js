// Debug overlay — toggled with D key
let debugMode = false;

// Kick flash state (extracted from debug-sketch.js)
let kickFlashActive = false;
let kickFlashStart = 0;
const KICK_FLASH_DURATION = 60; // ms

function toggleDebugMode() {
    debugMode = !debugMode;
}

function triggerKickFlash() {
    kickFlashActive = true;
    kickFlashStart = millis();
}

function drawDebugOverlay() {
    push();
    blendMode(BLEND);

    const panelX = 10;
    const panelY = 10;
    const panelW = 260;
    const panelH = 340;

    // Semi-transparent background panel
    fill(0, 0, 0, 180);
    noStroke();
    rectMode(CORNER);
    rect(panelX, panelY, panelW, panelH, 8);

    // Text styling
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(11);
    textStyle(NORMAL);

    let yPos = panelY + 10;
    const xPos = panelX + 10;
    const lineH = 16;

    // FPS
    fill(180, 255, 180);
    text(`FPS: ${Math.round(frameRate())}`, xPos, yPos);
    yPos += lineH;

    // Ball count
    fill(180, 220, 255);
    text(`Balls: ${balls.length}`, xPos, yPos);
    yPos += lineH;

    // Current speed (from first ball's base velocity)
    const spd = balls.length > 0 ? Math.abs(balls[0].baseVx).toFixed(1) : '—';
    text(`Base Speed: ${spd}`, xPos, yPos);
    yPos += lineH;

    // Colors
    fill(255);
    text(`Base: rgb(${BASE_COLOR.map(v => Math.round(v)).join(',')})`, xPos, yPos);
    yPos += lineH;
    text(`Peak: rgb(${PEAK_COLOR.map(v => Math.round(v)).join(',')})`, xPos, yPos);
    yPos += lineH;
    text(`BG:   rgb(${BG_COLOR.map(v => Math.round(v)).join(',')})`, xPos, yPos);
    yPos += lineH + 6;

    // Band energy bars
    fill(200, 200, 255);
    text('Band Energy', xPos, yPos);
    yPos += lineH;

    const barW = 160;
    const barH = 10;
    const barX = xPos + 60;

    // Bass
    fill(200);
    text('Bass:', xPos, yPos);
    fill(40);
    rect(barX, yPos + 1, barW, barH, 2);
    fill(255, 80, 80);
    rect(barX, yPos + 1, barW * bassEnergy, barH, 2);
    yPos += lineH;

    // Mid
    fill(200);
    text('Mid:', xPos, yPos);
    fill(40);
    rect(barX, yPos + 1, barW, barH, 2);
    fill(80, 255, 80);
    rect(barX, yPos + 1, barW * midEnergy, barH, 2);
    yPos += lineH;

    // Treble
    fill(200);
    text('Treble:', xPos, yPos);
    fill(40);
    rect(barX, yPos + 1, barW, barH, 2);
    fill(80, 150, 255);
    rect(barX, yPos + 1, barW * trebleEnergy, barH, 2);
    yPos += lineH + 6;

    // Spectral flux graph
    fill(200, 200, 255);
    text('Spectral Flux', xPos, yPos);
    yPos += lineH;

    const graphX = xPos;
    const graphW = panelW - 20;
    const graphH = 50;

    // Graph background
    fill(20);
    rect(graphX, yPos, graphW, graphH, 2);

    if (spectralFluxBuffer.length > 1) {
        const maxFlux = Math.max(...spectralFluxBuffer, lastThreshold, 1);
        const stepW = graphW / (fluxBufferSize - 1);

        // Flux line
        stroke(100, 200, 255);
        strokeWeight(1.5);
        noFill();
        beginShape();
        for (let i = 0; i < spectralFluxBuffer.length; i++) {
            const fx = graphX + i * stepW;
            const fy = yPos + graphH - (spectralFluxBuffer[i] / maxFlux) * graphH;
            vertex(fx, fy);
        }
        endShape();

        // Threshold line
        stroke(255, 100, 100, 150);
        strokeWeight(1);
        const threshY = yPos + graphH - (lastThreshold / maxFlux) * graphH;
        line(graphX, threshY, graphX + graphW, threshY);

        // Current flux marker
        if (spectralFluxBuffer.length > 0) {
            const lastIdx = spectralFluxBuffer.length - 1;
            const dotX = graphX + lastIdx * stepW;
            const dotY = yPos + graphH - (spectralFluxBuffer[lastIdx] / maxFlux) * graphH;
            noStroke();
            fill(100, 200, 255);
            circle(dotX, dotY, 5);
        }
    }

    noStroke();
    yPos += graphH + 4;

    // Flux / threshold values
    fill(160);
    textSize(10);
    text(`Flux: ${lastFlux.toFixed(1)}  |  Thresh: ${lastThreshold.toFixed(1)}`, xPos, yPos);

    // Last theme classification
    if (typeof lastClassification !== 'undefined' && lastClassification) {
        fill(200, 180, 255);
        textSize(11);
        text(`Theme: ${lastClassification.archetype} (d=${lastClassification.distance.toFixed(3)})`, xPos, yPos);
        yPos += lineH;
    }

    // Kick flash indicator
    if (kickFlashActive) {
        const elapsed = millis() - kickFlashStart;
        if (elapsed >= KICK_FLASH_DURATION) {
            kickFlashActive = false;
        } else {
            fill(255, 50, 50, 200);
            noStroke();
            rect(panelX + panelW - 50, panelY + 5, 40, 18, 4);
            fill(255);
            textSize(10);
            textAlign(CENTER, CENTER);
            text('KICK', panelX + panelW - 30, panelY + 14);
        }
    }

    pop();
}
