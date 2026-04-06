// ballMerge.js
// Handles "merge" rendering so balls look like one blob (metaball style)

// --- configurable field parameters ---
const FIELD_STEP = 8;        // grid spacing in pixels (larger = faster, blockier)
const FIELD_THRESHOLD = 1.9; // metaball threshold; tweak to taste
let USE_METAMERGE = true;    // toggle: merged blob vs. individual circles

// Scene-wide color: max of treble continuous warmth and kick pulse flash
function getScenePulseT() {
    if (balls.length === 0) return 0;
    let m = 0;
    for (const b of balls) if (b.pulseLevel > m) m = b.pulseLevel;
    const routing = AppSettings.routing;
    const colorEnergy = bassEnergy * routing.color.bass + midEnergy * routing.color.mid + trebleEnergy * routing.color.treble;
    return max(colorEnergy, m / 255);
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

// Linear interpolation along an edge to find where field crosses threshold
// v0, v1: field values at the two endpoints
// p0, p1: [x,y] coordinates of the two endpoints
function interpEdge(v0, v1, p0x, p0y, p1x, p1y) {
    const t = (FIELD_THRESHOLD - v0) / (v1 - v0);
    return [
        p0x + t * (p1x - p0x),
        p0y + t * (p1y - p0y)
    ];
}

// Marching squares edge lookup table
// Bit ordering: bit0=TL(v0), bit1=TR(v1), bit2=BR(v2), bit3=BL(v3)
// Edges: top=0(TL-TR), right=1(TR-BR), bottom=2(BR-BL), left=3(BL-TL)
// Each case maps to a list of triangle fans (arrays of edge indices or corner indices)
// We use a polygon-based approach: for each case, list the vertices (corners + edge crossings)
// that form the filled region, in order.

// Draw merged solid blob using marching squares (all 16 cases)
function drawMergedBlob() {
    const [cr, cg, cb] = getSceneColorRGB();
    noStroke();
    fill(cr, cg, cb, 255);

    const cols = Math.ceil(width / FIELD_STEP) + 1;
    const rows = Math.ceil(height / FIELD_STEP) + 1;

    // Cache field values in a 2D grid
    const grid = new Array(rows);
    for (let row = 0; row < rows; row++) {
        grid[row] = new Float32Array(cols);
        const py = row * FIELD_STEP;
        for (let col = 0; col < cols; col++) {
            grid[row][col] = fieldValueAt(col * FIELD_STEP, py);
        }
    }

    const T = FIELD_THRESHOLD;

    for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
            const x = col * FIELD_STEP;
            const y = row * FIELD_STEP;
            const s = FIELD_STEP;

            // Corner values: TL=v0, TR=v1, BR=v2, BL=v3
            const v0 = grid[row][col];         // TL
            const v1 = grid[row][col + 1];     // TR
            const v2 = grid[row + 1][col + 1]; // BR
            const v3 = grid[row + 1][col];     // BL

            // Bit field: bit0=TL, bit1=TR, bit2=BR, bit3=BL
            const inside = (v0 >= T ? 1 : 0) |
                           (v1 >= T ? 2 : 0) |
                           (v2 >= T ? 4 : 0) |
                           (v3 >= T ? 8 : 0);

            if (inside === 0) continue;  // all outside
            if (inside === 15) {
                // all inside — fill entire cell
                beginShape();
                vertex(x, y);
                vertex(x + s, y);
                vertex(x + s, y + s);
                vertex(x, y + s);
                endShape(CLOSE);
                continue;
            }

            // Edge interpolation points (computed on demand)
            // Top edge: between TL and TR
            let eTop, eRight, eBottom, eLeft;

            // Case-by-case rendering
            // Using the polygon approach: trace the boundary of the "inside" region
            switch (inside) {
                case 1: { // only TL inside
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(eTop[0], eTop[1]);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 2: { // only TR inside
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    beginShape();
                    vertex(eTop[0], eTop[1]);
                    vertex(x + s, y);
                    vertex(eRight[0], eRight[1]);
                    endShape(CLOSE);
                    break;
                }
                case 3: { // TL + TR inside
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(x + s, y);
                    vertex(eRight[0], eRight[1]);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 4: { // only BR inside
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    beginShape();
                    vertex(eRight[0], eRight[1]);
                    vertex(x + s, y + s);
                    vertex(eBottom[0], eBottom[1]);
                    endShape(CLOSE);
                    break;
                }
                case 5: { // TL + BR inside (saddle case)
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    // Two separate triangles for the saddle
                    beginShape();
                    vertex(x, y);
                    vertex(eTop[0], eTop[1]);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    beginShape();
                    vertex(eRight[0], eRight[1]);
                    vertex(x + s, y + s);
                    vertex(eBottom[0], eBottom[1]);
                    endShape(CLOSE);
                    break;
                }
                case 6: { // TR + BR inside
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    beginShape();
                    vertex(eTop[0], eTop[1]);
                    vertex(x + s, y);
                    vertex(x + s, y + s);
                    vertex(eBottom[0], eBottom[1]);
                    endShape(CLOSE);
                    break;
                }
                case 7: { // TL + TR + BR inside (BL outside)
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(x + s, y);
                    vertex(x + s, y + s);
                    vertex(eBottom[0], eBottom[1]);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 8: { // only BL inside
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(eBottom[0], eBottom[1]);
                    vertex(x, y + s);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 9: { // TL + BL inside
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(eTop[0], eTop[1]);
                    vertex(eBottom[0], eBottom[1]);
                    vertex(x, y + s);
                    endShape(CLOSE);
                    break;
                }
                case 10: { // TR + BL inside (saddle case)
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    // Two separate triangles for the saddle
                    beginShape();
                    vertex(eTop[0], eTop[1]);
                    vertex(x + s, y);
                    vertex(eRight[0], eRight[1]);
                    endShape(CLOSE);
                    beginShape();
                    vertex(eBottom[0], eBottom[1]);
                    vertex(x, y + s);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 11: { // TL + TR + BL inside (BR outside)
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eBottom = interpEdge(v2, v3, x + s, y + s, x, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(x + s, y);
                    vertex(eRight[0], eRight[1]);
                    vertex(eBottom[0], eBottom[1]);
                    vertex(x, y + s);
                    endShape(CLOSE);
                    break;
                }
                case 12: { // BR + BL inside
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(eRight[0], eRight[1]);
                    vertex(x + s, y + s);
                    vertex(x, y + s);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
                case 13: { // TL + BR + BL inside (TR outside)
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eRight = interpEdge(v1, v2, x + s, y, x + s, y + s);
                    beginShape();
                    vertex(x, y);
                    vertex(eTop[0], eTop[1]);
                    vertex(eRight[0], eRight[1]);
                    vertex(x + s, y + s);
                    vertex(x, y + s);
                    endShape(CLOSE);
                    break;
                }
                case 14: { // TR + BR + BL inside (TL outside)
                    eTop = interpEdge(v0, v1, x, y, x + s, y);
                    eLeft = interpEdge(v0, v3, x, y, x, y + s);
                    beginShape();
                    vertex(eTop[0], eTop[1]);
                    vertex(x + s, y);
                    vertex(x + s, y + s);
                    vertex(x, y + s);
                    vertex(eLeft[0], eLeft[1]);
                    endShape(CLOSE);
                    break;
                }
            }
        }
    }
}
