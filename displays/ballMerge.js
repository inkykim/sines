// ballMerge.js
// Handles "merge" rendering so balls look like one blob (metaball style)

// --- configurable field parameters ---
const FIELD_STEP = 8;        // grid spacing in pixels (larger = faster, blockier)
const FIELD_THRESHOLD = 1.9; // metaball threshold; tweak to taste
let USE_METAMERGE = false;    // toggle: merged blob vs. individual circles

// Scene-wide color (interpolates base→peak using max pulse level)
function getScenePulseT() {
    if (balls.length === 0) return 0;
    let m = 0;
    for (const b of balls) if (b.pulseLevel > m) m = b.pulseLevel;
    return m / 255; // 0..1
}

function getSceneColorRGB() {
    const t = getScenePulseT();
    const r = lerp(BASE_COLOR[0], PEAK_COLOR[0], t);
    const g = lerp(BASE_COLOR[1], PEAK_COLOR[1], t);
    const b = lerp(BASE_COLOR[2], PEAK_COLOR[2], t);
    return [r, g, b];
}

// Scalar field Σ r_i^2 / dist^2
function fieldValueAt(px, py) {
    let sum = 0;
    for (const b of balls) {
        const dx = px - b.x;
        const dy = py - b.y;
        const d2 = dx * dx + dy * dy + 1; // +1 avoids div by 0
        sum += (b.r * b.r) / d2;
    }
    return sum;
}

// Draw merged solid blob using marching squares
function drawMergedBlob() {
    const [cr, cg, cb] = getSceneColorRGB();
    noStroke();
    fill(cr, cg, cb, 255); // fully opaque

    for (let y = 0; y < height - FIELD_STEP; y += FIELD_STEP) {
        for (let x = 0; x < width - FIELD_STEP; x += FIELD_STEP) {
        const v0 = fieldValueAt(x, y);
        const v1 = fieldValueAt(x + FIELD_STEP, y);
        const v2 = fieldValueAt(x + FIELD_STEP, y + FIELD_STEP);
        const v3 = fieldValueAt(x, y + FIELD_STEP);

        const inside = (v0 >= FIELD_THRESHOLD) +
                        (v1 >= FIELD_THRESHOLD) * 2 +
                        (v2 >= FIELD_THRESHOLD) * 4 +
                        (v3 >= FIELD_THRESHOLD) * 8;

        if (inside === 15) {
            // Fill entire cell
            beginShape();
            vertex(x, y);
            vertex(x + FIELD_STEP, y);
            vertex(x + FIELD_STEP, y + FIELD_STEP);
            vertex(x, y + FIELD_STEP);
            endShape(CLOSE);
        }
        }
    }
}