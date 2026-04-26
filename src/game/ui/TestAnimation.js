class TestAnimation {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 5;
    this.vy = 5;
  }

  update(delta) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x + 100 > Game.get().g.getWidth()) {
      this.vx *= -1;
    }

    if (this.y + 100 > Game.get().g.getHeight()) {
      this.vy *= -1;
    }

    if (this.x < 0) {
      this.vx *= -1;
    }

    if (this.y < 0) {
      this.vy *= -1;
    }
  }

  render(g) {
    g.rect(this.x, this.y, 100, 100, 'red');
  }

}