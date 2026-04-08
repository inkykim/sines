// gradientLUT.js
// Generates a 256-entry RGBA lookup table from multi-stop gradient palettes.
// Uses HSL shortest-arc interpolation via rgbToHsl()/hslToRgb() from settings.js.

// The active LUT — a Uint8Array(256 * 4) of RGBA values.
// Index by: lut[i * 4], lut[i * 4 + 1], lut[i * 4 + 2], lut[i * 4 + 3]
let gradientLUT = null;

// Generate a 256-entry RGBA LUT from an array of color stops.
// Each stop: { position: 0-1, color: [r, g, b] }
// Stops must be sorted by position ascending.
function generateGradientLUT(stops) {
    const lut = new Uint8Array(256 * 4);

    if (!stops || stops.length < 2) {
        // Fallback: black to white
        for (let i = 0; i < 256; i++) {
            lut[i * 4]     = i;
            lut[i * 4 + 1] = i;
            lut[i * 4 + 2] = i;
            lut[i * 4 + 3] = 255;
        }
        return lut;
    }

    // Convert all stops to HSL for interpolation
    const hslStops = stops.map(function(s) {
        const hsl = rgbToHsl(s.color[0], s.color[1], s.color[2]);
        return { position: s.position, h: hsl[0], s: hsl[1], l: hsl[2] };
    });

    for (let i = 0; i < 256; i++) {
        const t = i / 255; // normalized position [0, 1]

        // Find the two stops that bracket this position
        let lower = hslStops[0];
        let upper = hslStops[hslStops.length - 1];

        for (let j = 0; j < hslStops.length - 1; j++) {
            if (t >= hslStops[j].position && t <= hslStops[j + 1].position) {
                lower = hslStops[j];
                upper = hslStops[j + 1];
                break;
            }
        }

        // Interpolation factor within this segment
        const range = upper.position - lower.position;
        const segT = range > 0 ? (t - lower.position) / range : 0;

        // HSL shortest-arc hue interpolation
        let hDiff = upper.h - lower.h;
        if (hDiff > 180) hDiff -= 360;
        if (hDiff < -180) hDiff += 360;
        let h = lower.h + hDiff * segT;
        if (h < 0) h += 360;
        if (h >= 360) h -= 360;

        const s = lower.s + (upper.s - lower.s) * segT;
        const l = lower.l + (upper.l - lower.l) * segT;

        const rgb = hslToRgb(h, s, l);
        lut[i * 4]     = rgb[0];
        lut[i * 4 + 1] = rgb[1];
        lut[i * 4 + 2] = rgb[2];
        lut[i * 4 + 3] = 255;
    }

    return lut;
}

// Rebuild the active LUT from current AppSettings.palette
function rebuildGradientLUT() {
    gradientLUT = generateGradientLUT(AppSettings.palette);
}
