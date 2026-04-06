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
        // Radius: continuous bass scaling + decaying kick burst
        this.r = this.rBase * (1 + bassEnergy * 0.5) + this.kickBurst;
        this.kickBurst = lerp(this.kickBurst, 0, 0.08);

        // Speed: mid energy modulates around user-set baseline
        const midMod = 1 + midEnergy * 0.8;
        const vx = this.baseVx * midMod;
        const vy = this.baseVy * midMod;

        this.x += vx;
        this.y += vy;

        // bounce off walls
        if (this.x + this.r >= width)  { this.x = width - this.r;  this.baseVx *= -1; }
        if (this.x - this.r <= 0)      { this.x = this.r;          this.baseVx *= -1; }
        if (this.y + this.r >= height) { this.y = height - this.r; this.baseVy *= -1; }
        if (this.y - this.r <= 0)      { this.y = this.r;          this.baseVy *= -1; }

        // Decay kick pulse level (for color flash)
        this.pulseLevel = max(this.pulseLevel - 10, 0);
    }

    // Kick: set burst and pulse level
    pulse(amount) {
        this.kickBurst = this.rBase * 0.8;
        this.pulseLevel = 255;
    }

    draw() {
        // Color: max of treble continuous warmth and kick pulse flash
        let t = max(trebleEnergy, this.pulseLevel / 255);
        let r = lerp(BASE_COLOR[0], PEAK_COLOR[0], t);
        let g = lerp(BASE_COLOR[1], PEAK_COLOR[1], t);
        let b = lerp(BASE_COLOR[2], PEAK_COLOR[2], t);

        noStroke();
        fill(r, g, b);
        circle(this.x, this.y, this.r * 2);
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

// draw the balls
function drawBall() {
    push();
    blendMode(BLEND);
    if (USE_METAMERGE) {
        drawMergedBlob();
    } else {
        for (const ball of balls) ball.draw();
    }
    pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
