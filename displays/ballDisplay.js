// Ball display and animation functions

let ball = {
    x: 0,
    y: 0,
    vx: 4.2,
    vy: 3.1,
    r: 200
};

let flashAlpha = 0;

// Initialize ball position
function initializeBall() {
    ball.x = width / 2;
    ball.y = height / 2;
}

// Update ball physics and handle kick events
function updateBall() {
    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Handle bouncing off walls
    if (ball.x + ball.r >= width)  { ball.x = width - ball.r;  ball.vx *= -1; }
    if (ball.x - ball.r <= 0)      { ball.x = ball.r;          ball.vx *= -1; }
    if (ball.y + ball.r >= height) { ball.y = height - ball.r; ball.vy *= -1; }
    if (ball.y - ball.r <= 0)      { ball.y = ball.r;          ball.vy *= -1; }
}

// Handle detection event
function onEventDetected() {
    flashAlpha = 255;
    ball.x = random(ball.r, width - ball.r);
    ball.y = random(ball.r, height - ball.r);
}

// Update flash effect
function updateFlash() {
    if (flashAlpha > 0) {
        flashAlpha -= 10;
        flashAlpha = max(flashAlpha, 0);
    }
}

// Draw the ball with current flash effect
function drawBall() {
    fill(0);
    noStroke();
    
    // Apply flash effect if active
    if (flashAlpha > 0) {
        fill(255, 0, 0, flashAlpha);
    }
    
    circle(ball.x, ball.y, ball.r * 2);
}
