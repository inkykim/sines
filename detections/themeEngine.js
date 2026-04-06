// Rule-based theme engine — classifies audio features into archetypes
// and returns a theme for the closest match.

// Last classification result (for debug overlay)
let lastClassification = null;

const ARCHETYPES = [
    {
        name: 'Dark Trap',
        profile: { bassMean: 0.6, midMean: 0.3, trebleMean: 0.2, centroidMean: 0.15, kickRate: 0.15, bassVariance: 0.04 },
        theme: {
            baseColor: [10, 0, 20], peakColor: [180, 0, 255], bgColor: [0, 0, 0],
            ballCount: 10, speed: 7, metaMode: true,
            routing: { radius: {bass:1,mid:0,treble:0}, speed: {bass:0.3,mid:1,treble:0}, color: {bass:0,mid:0,treble:1} },
            kickSensitivity: 1.5
        }
    },
    {
        name: 'Bright Pop',
        profile: { bassMean: 0.4, midMean: 0.5, trebleMean: 0.5, centroidMean: 0.55, kickRate: 0.1, bassVariance: 0.02 },
        theme: {
            baseColor: [255, 200, 50], peakColor: [255, 100, 150], bgColor: [255, 250, 240],
            ballCount: 7, speed: 5, metaMode: true,
            routing: { radius: {bass:1,mid:0.3,treble:0}, speed: {bass:0,mid:1,treble:0.3}, color: {bass:0,mid:0.3,treble:1} },
            kickSensitivity: 1.8
        }
    },
    {
        name: 'Calm Classical',
        profile: { bassMean: 0.15, midMean: 0.25, trebleMean: 0.3, centroidMean: 0.6, kickRate: 0.01, bassVariance: 0.005 },
        theme: {
            baseColor: [180, 170, 150], peakColor: [220, 200, 160], bgColor: [240, 235, 220],
            ballCount: 2, speed: 2, metaMode: false,
            routing: { radius: {bass:0.5,mid:0.5,treble:0}, speed: {bass:0,mid:0.5,treble:0.5}, color: {bass:0,mid:1,treble:0.5} },
            kickSensitivity: 2.5
        }
    },
    {
        name: 'Heavy Metal',
        profile: { bassMean: 0.7, midMean: 0.6, trebleMean: 0.5, centroidMean: 0.35, kickRate: 0.12, bassVariance: 0.06 },
        theme: {
            baseColor: [80, 0, 0], peakColor: [255, 255, 255], bgColor: [15, 0, 0],
            ballCount: 14, speed: 8, metaMode: true,
            routing: { radius: {bass:1,mid:0.5,treble:0}, speed: {bass:0.5,mid:1,treble:0.3}, color: {bass:0.3,mid:0,treble:1} },
            kickSensitivity: 1.3
        }
    },
    {
        name: 'Ambient',
        profile: { bassMean: 0.2, midMean: 0.2, trebleMean: 0.25, centroidMean: 0.45, kickRate: 0.005, bassVariance: 0.003 },
        theme: {
            baseColor: [0, 40, 60], peakColor: [0, 180, 200], bgColor: [5, 10, 25],
            ballCount: 3, speed: 1, metaMode: true,
            routing: { radius: {bass:0.5,mid:0.5,treble:0.3}, speed: {bass:0,mid:0.3,treble:0.5}, color: {bass:0.3,mid:0.5,treble:1} },
            kickSensitivity: 2.5
        }
    },
    {
        name: 'Lo-Fi Chill',
        profile: { bassMean: 0.35, midMean: 0.3, trebleMean: 0.2, centroidMean: 0.35, kickRate: 0.04, bassVariance: 0.01 },
        theme: {
            baseColor: [120, 80, 50], peakColor: [220, 180, 140], bgColor: [40, 25, 15],
            ballCount: 5, speed: 3, metaMode: false,
            routing: { radius: {bass:1,mid:0.3,treble:0}, speed: {bass:0,mid:1,treble:0}, color: {bass:0,mid:0.5,treble:1} },
            kickSensitivity: 2.0
        }
    },
    {
        name: 'Techno House',
        profile: { bassMean: 0.55, midMean: 0.35, trebleMean: 0.4, centroidMean: 0.4, kickRate: 0.18, bassVariance: 0.015 },
        theme: {
            baseColor: [0, 30, 10], peakColor: [0, 255, 180], bgColor: [0, 0, 0],
            ballCount: 9, speed: 6, metaMode: true,
            routing: { radius: {bass:1,mid:0,treble:0}, speed: {bass:0,mid:1,treble:0.5}, color: {bass:0,mid:0,treble:1} },
            kickSensitivity: 1.4
        }
    },
    {
        name: 'Jazz',
        profile: { bassMean: 0.3, midMean: 0.45, trebleMean: 0.35, centroidMean: 0.55, kickRate: 0.03, bassVariance: 0.02 },
        theme: {
            baseColor: [60, 40, 10], peakColor: [220, 180, 60], bgColor: [20, 15, 5],
            ballCount: 4, speed: 3, metaMode: false,
            routing: { radius: {bass:0.7,mid:0.5,treble:0}, speed: {bass:0,mid:1,treble:0.3}, color: {bass:0,mid:0.7,treble:1} },
            kickSensitivity: 2.2
        }
    }
];

// Feature weights for distance computation (kick rate and centroid weighted higher)
const FEATURE_WEIGHTS = {
    bassMean: 1.0, midMean: 0.8, trebleMean: 0.8,
    centroidMean: 1.5, kickRate: 1.5, bassVariance: 1.2
};

function classifyAudio(stats) {
    let bestDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < ARCHETYPES.length; i++) {
        const p = ARCHETYPES[i].profile;
        let dist = 0;
        for (const key of Object.keys(FEATURE_WEIGHTS)) {
            const diff = (stats[key] || 0) - (p[key] || 0);
            dist += FEATURE_WEIGHTS[key] * diff * diff;
        }
        dist = Math.sqrt(dist);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }

    lastClassification = {
        archetype: ARCHETYPES[bestIdx].name,
        distance: bestDist,
        theme: ARCHETYPES[bestIdx].theme
    };
    return lastClassification;
}
