// ballMerge.js
// Gradient field renderer — maps the continuous metaball scalar field
// to a multi-stop color gradient via pixel buffer, with interference fringes.

// --- configurable field parameters ---
const FIELD_STEP = 8;        // grid spacing in pixels (larger = faster, blockier)
const FIELD_NORM = 4.0;      // normalization divisor: fieldValue / FIELD_NORM maps to [0,1] for LUT

// Cached pixel buffer for the gradient field
let _gradientImg = null;
let _gradientCols = 0;
let _gradientRows = 0;

// Fringe animation constants
const FRINGE_BASE_FREQ = 8.0;   // base frequency for sin() fringe pattern
const FRINGE_BASE_SPEED = 0.03; // base animation speed

// Scalar field: sum of r_i^2 / dist^2
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

// Ensure pixel buffer matches current canvas dimensions
function _ensureGradientBuffer() {
    const cols = Math.ceil(width / FIELD_STEP) + 1;
    const rows = Math.ceil(height / FIELD_STEP) + 1;
    if (!_gradientImg || cols !== _gradientCols || rows !== _gradientRows) {
        _gradientImg = createImage(cols, rows);
        _gradientCols = cols;
        _gradientRows = rows;
    }
}

// Draw the gradient field using pixel buffer
function drawGradientField() {
    if (balls.length === 0) return;

    // Ensure LUT exists
    if (!gradientLUT) rebuildGradientLUT();

    _ensureGradientBuffer();

    const cols = _gradientCols;
    const rows = _gradientRows;
    const lut = gradientLUT;

    // Audio-reactive modulation via routing matrix
    const routing = AppSettings.routing;
    const gradientEnergy = bassEnergy * routing.gradient.bass +
                           midEnergy * routing.gradient.mid +
                           trebleEnergy * routing.gradient.treble;
    const fringeEnergy = bassEnergy * routing.fringe.bass +
                         midEnergy * routing.fringe.mid +
                         trebleEnergy * routing.fringe.treble;

    // Gradient energy modulates the normalization — higher energy = wider gradient spread
    const normFactor = FIELD_NORM / (1 + gradientEnergy * 1.5);

    // Fringe parameters
    const fringeIntensity = AppSettings.fringeIntensity;
    const fringeFreq = FRINGE_BASE_FREQ * (1 + fringeEnergy * 3);
    const fringeSpeed = FRINGE_BASE_SPEED * (1 + fringeEnergy * 2);
    const fringeTime = frameCount * fringeSpeed;

    _gradientImg.loadPixels();
    const pixels = _gradientImg.pixels;

    for (let row = 0; row < rows; row++) {
        const py = row * FIELD_STEP;
        for (let col = 0; col < cols; col++) {
            const px = col * FIELD_STEP;

            // Compute scalar field value
            const fieldVal = fieldValueAt(px, py);

            // Normalize to [0, 1] and map to LUT index [0, 255]
            const normalized = Math.min(fieldVal / normFactor, 1);
            let lutIndex = Math.floor(normalized * 255);
            if (lutIndex > 255) lutIndex = 255;

            // Base color from LUT
            let r = lut[lutIndex * 4];
            let g = lut[lutIndex * 4 + 1];
            let b = lut[lutIndex * 4 + 2];

            // Apply interference fringes
            if (fringeIntensity > 0 && normalized > 0.01) {
                const fringe = Math.sin(fieldVal * fringeFreq + fringeTime);
                // Fringe modulates brightness: [-1,1] -> [1-intensity, 1+intensity]
                const fringeMod = 1 + fringe * fringeIntensity * 0.5;
                r = Math.min(255, Math.max(0, r * fringeMod));
                g = Math.min(255, Math.max(0, g * fringeMod));
                b = Math.min(255, Math.max(0, b * fringeMod));
            }

            const idx = (row * cols + col) * 4;
            pixels[idx]     = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
        }
    }

    _gradientImg.updatePixels();

    // Upscale to full canvas — browser uses bilinear interpolation
    image(_gradientImg, 0, 0, width, height);
}

// Recreate pixel buffer (call from windowResized)
function resetGradientBuffer() {
    _gradientImg = null;
}
