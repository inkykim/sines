// Ball display and animation functions
let balls = [];
let NUM_BALLS = 10;
const R_MIN = 30;
const R_MAX = 90;

let BASE_COLOR = [0, 0, 0];
let PEAK_COLOR = [255, 255, 255];

// functions for bringing changes from UI
function setBaseColorFromHex(hex) {
    const c = color(hex);
    BASE_COLOR = [red(c), green(c), blue(c)];
}

function setPeakColorFromHex(hex) {
    const c = color(hex);
    PEAK_COLOR = [red(c), green(c), blue(c)];
}

function setBallCount(n) {
    n = int(constrain(n, 1, 20));
    NUM_BALLS = n;

    const diff = n - balls.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
        balls.push(new Metaball(random(width), random(height)));
        }
    } else if (diff < 0) {
        balls.splice(n);
    }
}

function setSpeed(s) {
    s = int(constrain(s, 1, 10));
    for (const ball of balls) {
        ball.baseVx = (ball.baseVx > 0 ? 1 : -1) * s;
        ball.baseVy = (ball.baseVy > 0 ? 1 : -1) * s;
    }
}

class Metaball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.rBase = random(R_MIN, R_MAX);
        this.r = this.rBase;
        this.baseVx = random(-4, 4);
        this.baseVy = random(-4, 4);
        this.kickBurst = 0;
        this.pulseLevel = 0; // kick-only, drives color flash
    }

    update() {
        // Radius: routed band energy scaling + decaying kick burst
        const routing = AppSettings.routing;
        const radiusEnergy = bassEnergy * routing.radius.bass + midEnergy * routing.radius.mid + trebleEnergy * routing.radius.treble;
        this.r = this.rBase * (1 + radiusEnergy * 0.5) + this.kickBurst;
        // Frame-rate-independent decay using deltaTime
        const decay = 1 - Math.exp(-5 * deltaTime / 1000);
        this.kickBurst = lerp(this.kickBurst, 0, decay);

        // Speed: routed band energy modulates around user-set baseline
        const speedEnergy = bassEnergy * routing.speed.bass + midEnergy * routing.speed.mid + trebleEnergy * routing.speed.treble;
        const speedMod = 1 + speedEnergy * 0.8;
        const vx = this.baseVx * speedMod;
        const vy = this.baseVy * speedMod;

        this.x += vx;
        this.y += vy;

        // bounce off walls
        if (this.x + this.r >= width)  { this.x = width - this.r;  this.baseVx *= -1; }
        if (this.x - this.r <= 0)      { this.x = this.r;          this.baseVx *= -1; }
        if (this.y + this.r >= height) { this.y = height - this.r; this.baseVy *= -1; }
        if (this.y - this.r <= 0)      { this.y = this.r;          this.baseVy *= -1; }

        // Frame-rate-independent pulse decay
        this.pulseLevel = max(this.pulseLevel - 600 * deltaTime / 1000, 0);
    }

    // Kick: set burst and pulse level
    pulse(amount) {
        this.kickBurst = this.rBase * 0.8;
        this.pulseLevel = 255;
    }

}

// initialize list of balls
function initializeBall() {
    balls = [];
    for (let i = 0; i < NUM_BALLS; i++) {
        balls.push(new Metaball(random(width), random(height)));
    }
}

// apply update to all balls
function updateBall() {
    for (const ball of balls) ball.update();
}

// start pulse effect on all balls
function onEventDetected() {
    for (const ball of balls) ball.pulse();
    if (typeof triggerKickFlash === 'function') triggerKickFlash();
}

// draw the gradient field (balls are invisible attractors)
function drawBall() {
    push();
    blendMode(BLEND);
    drawGradientField();
    pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (typeof resetGradientBuffer === 'function') resetGradientBuffer();
}
