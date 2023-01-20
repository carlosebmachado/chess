class Graphics {
  constructor(ctx) {
    this.ctx = ctx;

    // this.setWidth(window.innerWidth);
    // this.setHeight(window.innerHeight);

    // window.addEventListener('resize', () => {
    //   this.setWidth(window.innerWidth);
    //   this.setHeight(window.innerHeight);
    // });
  }

  rect(x, y, width, height, fillStyle) {
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(x, y, width, height);
  }

  circle(x, y, radius, fillStyle) {
    this.ctx.fillStyle = fillStyle;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  drawText(text, x, y, font, fillStyle, maxWidth = null, fill = true) {
    this.ctx.font = font;
    this.ctx.fillStyle = fillStyle;
    var m = this.ctx.measureText(text)
    if (fill) {
      this.ctx.fillText(text, x, y, maxWidth || m.width);
    } else {
      this.ctx.strokeText(text, x, y, maxWidth || m.width);
    }
  }

  drawImage(image, x, y, width, height) {
    if (!width || !height) {
      this.ctx.drawImage(image, x, y);
    } else {
      this.ctx.drawImage(image, x, y, width, height);
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
  }

  setWidth(width) {
    this.ctx.canvas.width = width;
  }

  getWidth() {
    return this.ctx.canvas.width;
  }

  setHeight(height) {
    this.ctx.canvas.height = height;
  }

  getHeight() {
    return this.ctx.canvas.height;
  }

}