// Ball display and animation functions
let balls = [];
let NUM_BALLS = 10;
const R_MIN = 60;
const R_MAX = 180;

let BASE_COLOR = [255, 255, 255];
let PEAK_COLOR = [255, 0, 0];

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
    BALL_COUNT = n;

    const diff = n - balls.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
        balls.push(new Metaball(random(width), random(height)));
        }
    } else if (diff < 0) {
        balls.splice(n);
    }
}

class Metaball {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.rBase = random(R_MIN, R_MAX);
        this.r = this.rBase;
        this.vx = random(-4, 4);
        this.vy = random(-4, 4);
        this.pulseLevel = 0;
    }

    update() { // update position, handle bouncing and pulsing
        this.x += this.vx;
        this.y += this.vy;

        // bounce off walls
        if (this.x + this.r >= width)  { this.x = width - this.r;  this.vx *= -1; }
        if (this.x - this.r <= 0)      { this.x = this.r;          this.vx *= -1; }
        if (this.y + this.r >= height) { this.y = height - this.r; this.vy *= -1; }
        if (this.y - this.r <= 0)      { this.y = this.r;          this.vy *= -1; }

        // fade back from pulse
        this.r = lerp(this.r, this.rBase, 0.08);
        this.pulseLevel = max(this.pulseLevel - 10, 0);
    }

    // set brightness to max for pulse effect, slightly increase radius
    pulse(amount = 10) {
        this.r = min(this.r + amount, this.rBase * 1.8);
        this.pulseLevel = 255;
    }

    draw() {
        let t = this.pulseLevel / 255;
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
}

// draw the balls
function drawBall() {
    push();
    blendMode(BLEND);
    for (const ball of balls) ball.draw();
    pop();
}
