var size = 40;
var heightCnt = 100, widthCnt = 100;
var hexList = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  generateHexGrid();
}

function generateHexGrid() {
  hexList = [];
  
  for (var i = 0; i < heightCnt; i++) {
    for (var j = 0; j < widthCnt; j++) {
      var h = new Hex(j, i);
      // Only add hexagons that are visible on screen
      if (h.x > -size * 2 && h.x < width + size * 2 && 
          h.y > -size * 2 && h.y < height + size * 2) {
        hexList.push(h);
      }
    }
  }
}

class Hex {
  constructor(_x, _y) {
    // Calculate hex position based on row (even/odd offset)
    if (_y % 2 == 0) {
      this.x = 2 * size * sqrt(3) * _x;
      this.y = 3 * size * _y;
    } else {
      this.x = 2 * size * sqrt(3) * _x - size * sqrt(3);
      this.y = 3 * size * _y;
    }
    this.size = size;
  }
  
  drawHex() {
    push();
    translate(this.x, this.y);
    
    // Top face - lightest
    fill(map(this.x + this.y, 0, width + height, 255, 100));
    beginShape();
    vertex(0, 0);
    vertex(this.size * sqrt(3), this.size * -1);
    vertex(0, this.size * -2);
    vertex(this.size * -sqrt(3), this.size * -1);
    endShape(CLOSE);
    
    // Left face - medium
    fill(map(this.x + this.y, 0, width + height, 155, 0));
    beginShape();
    vertex(0, 0);
    vertex(this.size * -sqrt(3), this.size * -1);
    vertex(this.size * -sqrt(3), this.size * 1);
    vertex(0, this.size * 2);
    endShape(CLOSE);
    
    // Right face - darkest
    fill(map(this.x + this.y, 0, width + height, 205, 0));
    beginShape();
    vertex(0, 0);
    vertex(this.size * sqrt(3), this.size * -1);
    vertex(this.size * sqrt(3), this.size * 1);
    vertex(0, this.size * 2);
    endShape(CLOSE);
    
    pop();
  }
}

function draw() {
  background(100);
  
  for (var i = 0; i < hexList.length; i++) {
    hexList[i].drawHex();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateHexGrid();
}