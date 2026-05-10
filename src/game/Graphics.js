class Graphics {
  constructor(ctx) {
    this.ctx = ctx;
  }

  rect(x, y, width, height, fillStyle) {
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(x, y, width, height);
  }

  strokeRect(x, y, width, height, strokeStyle, lineWidth) {
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = lineWidth || 3;
    this.ctx.strokeRect(x, y, width, height);
  }

  circle(x, y, radius, fillStyle) {
    this.ctx.fillStyle = fillStyle;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  strokeCircle(x, y, radius, strokeStyle, lineWidth) {
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = lineWidth || 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  drawArrow(x1, y1, x2, y2, strokeStyle, lineWidth) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var angle = Math.atan2(dy, dx);
    var headLen = (lineWidth || 3) * 4;

    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = lineWidth || 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    this.ctx.fillStyle = strokeStyle;
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
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