// Unified settings layer — canonical source for all visual parameters.
// Loaded FIRST (before kickDetection.js) so every other script can read AppSettings.
// Existing globals (BASE_COLOR, PEAK_COLOR, BG_COLOR, NUM_BALLS, etc.) are kept
// in sync by calling their original setter functions from applySettings().

// ── Color conversion utilities (for future HSL theme transitions) ──────────

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ── Schema descriptors (for future UI generation) ──────────────────────────

const SETTINGS_SCHEMA = [
    { id: 'baseColor',        type: 'color',   label: 'Base Color',         default: [0, 0, 0] },
    { id: 'peakColor',        type: 'color',   label: 'Peak Color',         default: [255, 255, 255] },
    { id: 'bgColor',          type: 'color',   label: 'Background Color',   default: [0, 0, 0] },
    { id: 'ballCount',        type: 'int',     label: 'Ball Count',         min: 1, max: 20, default: 10 },
    { id: 'speed',            type: 'int',     label: 'Speed',              min: 1, max: 10, default: 4 },
    { id: 'metaMode',         type: 'bool',    label: 'Meta Mode',          default: true },
    { id: 'cleanDisplay',     type: 'bool',    label: 'Clean Display',      default: false },
    { id: 'kickSensitivity',  type: 'float',   label: 'Kick Sensitivity',   min: 0.5, max: 5, default: 1.8 },
    { id: 'kickCooldown',     type: 'int',     label: 'Kick Cooldown (ms)', min: 50, max: 1000, default: 200 },
    { id: 'kickFloor',        type: 'float',   label: 'Kick Floor',         min: 0, max: 100, default: 15 },
    { id: 'reactivity',       type: 'float',   label: 'Reactivity',         min: 0.1, max: 5, default: 1.0 },
    { id: 'routing',          type: 'object',  label: 'Band Routing',       default: {
        radius: { bass: 1, mid: 0, treble: 0 },
        speed:  { bass: 0, mid: 1, treble: 0 },
        color:  { bass: 0, mid: 0, treble: 1 }
    }}
];

// ── AppSettings — the canonical state object ───────────────────────────────

const AppSettings = {
    baseColor:       [0, 0, 0],
    peakColor:       [255, 255, 255],
    bgColor:         [0, 0, 0],
    ballCount:       10,
    speed:           4,
    metaMode:        true,
    cleanDisplay:    false,
    kickSensitivity: 1.8,
    kickCooldown:    200,
    kickFloor:       15,
    reactivity:      1.0,
    routing: {
        radius: { bass: 1, mid: 0, treble: 0 },
        speed:  { bass: 0, mid: 1, treble: 0 },
        color:  { bass: 0, mid: 0, treble: 1 }
    }
};

// ── Lock state management ──────────────────────────────────────────────────
// lockedParams: manually pinned by user (survives theme changes)
// themeSetParams: tracks which params were last set by a theme (for auto-lock)

const lockedParams   = new Set();
const themeSetParams = new Set();

function lockParam(id)   { lockedParams.add(id); }
function unlockParam(id) { lockedParams.delete(id); }
function isLocked(id)    { return lockedParams.has(id); }
function unlockAll()     { lockedParams.clear(); }

// ── Setter bridge — maps setting keys to existing global setters ───────────
// Each entry calls the legacy setter so globals stay in sync.

function _rgbToHex(rgb) {
    return '#' + rgb.map(function(v) {
        let hex = Math.round(Math.max(0, Math.min(255, v))).toString(16);
        return hex.length < 2 ? '0' + hex : hex;
    }).join('');
}

const _setterMap = {
    baseColor: function(val) {
        AppSettings.baseColor = val.slice();
        if (typeof setBaseColorFromHex === 'function') setBaseColorFromHex(_rgbToHex(val));
        else if (typeof BASE_COLOR !== 'undefined') BASE_COLOR = val.slice();
    },
    peakColor: function(val) {
        AppSettings.peakColor = val.slice();
        if (typeof setPeakColorFromHex === 'function') setPeakColorFromHex(_rgbToHex(val));
        else if (typeof PEAK_COLOR !== 'undefined') PEAK_COLOR = val.slice();
    },
    bgColor: function(val) {
        AppSettings.bgColor = val.slice();
        if (typeof setBgColorFromHex === 'function') setBgColorFromHex(_rgbToHex(val));
        else if (typeof BG_COLOR !== 'undefined') BG_COLOR = val.slice();
    },
    ballCount: function(val) {
        AppSettings.ballCount = val;
        if (typeof setBallCount === 'function') setBallCount(val);
        else if (typeof NUM_BALLS !== 'undefined') NUM_BALLS = val;
    },
    speed: function(val) {
        AppSettings.speed = val;
        if (typeof setSpeed === 'function') setSpeed(val);
    },
    metaMode: function(val) {
        AppSettings.metaMode = val;
        if (typeof USE_METAMERGE !== 'undefined') USE_METAMERGE = val;
    },
    cleanDisplay: function(val) {
        AppSettings.cleanDisplay = val;
        if (val) {
            if (typeof hideTitleDisplay === 'function') hideTitleDisplay();
        } else {
            if (typeof showTitleDisplay === 'function') showTitleDisplay();
        }
    },
    kickSensitivity: function(val) {
        AppSettings.kickSensitivity = val;
        if (typeof kickSensitivityMultiplier !== 'undefined') kickSensitivityMultiplier = val;
    },
    kickCooldown: function(val) {
        AppSettings.kickCooldown = val;
        if (typeof kickCooldown !== 'undefined') kickCooldown = val;
    },
    kickFloor: function(val) {
        AppSettings.kickFloor = val;
        if (typeof kickMinFloor !== 'undefined') kickMinFloor = val;
    },
    reactivity: function(val) {
        AppSettings.reactivity = val;
        // reactivity is read directly from AppSettings in applyNoiseFloor()
    },
    routing: function(val) {
        AppSettings.routing = JSON.parse(JSON.stringify(val));
        // routing is read directly from AppSettings by the band-routing system
    }
};

// ── Input validation — clamp values to schema bounds ──────────────────────

function _validateSetting(key, val) {
    const schema = SETTINGS_SCHEMA.find(function(s) { return s.id === key; });
    if (!schema) return val;

    if (schema.type === 'int') {
        val = Math.round(val);
        if (schema.min !== undefined) val = Math.max(schema.min, val);
        if (schema.max !== undefined) val = Math.min(schema.max, val);
    } else if (schema.type === 'float') {
        if (schema.min !== undefined) val = Math.max(schema.min, val);
        if (schema.max !== undefined) val = Math.min(schema.max, val);
    } else if (schema.type === 'color') {
        if (Array.isArray(val)) {
            val = val.map(function(v) { return Math.round(Math.max(0, Math.min(255, v))); });
        }
    } else if (schema.type === 'bool') {
        val = !!val;
    }
    return val;
}

// ── UI sync — update DOM controls after programmatic settings change ──────

const _uiSyncMap = {};

function registerUISync(paramId, syncFn) {
    _uiSyncMap[paramId] = syncFn;
}

function _syncUI(key, val) {
    if (_uiSyncMap[key]) _uiSyncMap[key](val);
}

// ── applySettings(partial) — the main entry point for bulk updates ─────────

function applySettings(partial) {
    let applied = [];
    let skipped = [];

    for (let key in partial) {
        if (!partial.hasOwnProperty(key)) continue;

        if (lockedParams.has(key)) {
            skipped.push(key);
            continue;
        }

        const val = _validateSetting(key, partial[key]);

        if (_setterMap[key]) {
            _setterMap[key](val);
        } else {
            AppSettings[key] = val;
        }
        _syncUI(key, val);
        themeSetParams.add(key);
        applied.push(key);
    }

    return { applied: applied, skipped: skipped };
}

// ── getSettings() — serializable snapshot ──────────────────────────────────

function getSettings() {
    return JSON.parse(JSON.stringify(AppSettings));
}
