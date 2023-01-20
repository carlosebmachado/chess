class Game {
  static VERTICAL_ORIENTATION = 'vertical';
  static HORIZONTAL_ORIENTATION = 'horizontal';

  static get() {
    if (!this.instance) {
      this.instance = new Game();
    }
    return this.instance;
  }

  run() {
    var tick = 1000 / 60;

    this.interval = setInterval(() => {
      if (this.running) {
        this.update(tick);
        this.render(this.g);
      }
    }, tick);
  }

  update(delta) {
    this.testAnimation.update(delta);
    this.board.update(delta);
    this.hud.update(delta);
  }

  render(g) {
    g.clear();

    this.testAnimation.render(g);
    this.board.render(g);
    this.hud.render(g);
  }

  start(canvas, orientation) {
    this.canvas = canvas;
    this.rect = this.canvas.getBoundingClientRect();
    this.ctx = canvas.getContext('2d');
    this.g = new Graphics(this.ctx);
    this.orientation = orientation;

    if (orientation === Game.VERTICAL_ORIENTATION) {
      this.g.setWidth(600);
      this.g.setHeight(800);
    } else {
      this.g.setWidth(800);
      this.g.setHeight(600);
    }

    this.mousePosX = 0;
    this.mousePosY = 0;
    this.clickPosX = 0;
    this.clickPosY = 0;
    this.isMouseDown = false;

    this.touchPosX = 0;
    this.touchPosY = 0;
    this.isTouching = false;

    this.pushPosX = 0;
    this.pushPosY = 0;
    this.isPushing = false;

    this.running = true;
    this.loadObjects();
    this.loadEvents();
  }

  stop() {
    this.running = false;
    clearInterval(this.interval);
  }

  loadObjects() {
    this.testAnimation = new TestAnimation();
    this.board = new Board();
    this.hud = new HUD(this.board);
  }

  loadEvents() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    this.canvas.addEventListener("touchstart", this.handleTouchStart, false);
    this.canvas.addEventListener("touchend", this.handleTouchEnd, false);
    this.canvas.addEventListener("touchmove", this.handleTouchMove, false);

    window.addEventListener('keydown', this.handleKeyDown, false);
    window.addEventListener('keyup', this.handleKeyUp, false);
  }

  handleTouchStart = (e) => {
    // this.touchPosX = e.touches[0].clientX - this.rect.left;
    // this.touchPosY = e.touches[0].clientY - this.rect.top;
    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = this.touchPosX;
    this.pushPosY = this.touchPosY;

    this.isTouching = true;
    this.isPushing = true;

    console.log(`tocou em ${this.touchPosX}:${this.touchPosY}`);

    e.preventDefault();
  }

  handleTouchEnd = (e) => {
    this.isTouching = false
    this.isPushing = false;

    console.log(`destocou em ${this.touchPosX}:${this.touchPosY}`);

    e.preventDefault();
  }

  handleTouchMove = (e) => {
    // this.touchPosX = e.touches[0].clientX - this.rect.left;
    // this.touchPosX = e.touches[0].clientY - this.rect.top;
    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = this.touchPosX;
    this.pushPosY = this.touchPosY;

    console.log(`moveu toque para ${this.touchPosX}:${this.touchPosY}`);

    e.preventDefault();
  }

  handleMouseDown = (e) => {
    this.isClicking = true;
    this.isPushing = true;
    
    this.clickPosX = this.mousePosX;
    this.clickPosY = this.mousePosY;

    this.pushPosX = this.mousePosX;
    this.pushPosY = this.mousePosY;

    console.log(`clicou em ${this.mousePosX}:${this.mousePosY}`);

    e.preventDefault();
  }

  handleMouseUp = (e) => {
    this.isClicking = false;
    this.isPushing = false;

    console.log(`desclicou em ${this.mousePosX}:${this.mousePosY}`);

    e.preventDefault();
  }

  handleMouseMove = (e) => {
    this.mousePosX = e.offsetX;
    this.mousePosY = e.offsetY;

    this.pushPosX = this.mousePosX;
    this.pushPosY = this.mousePosY;

    console.log(`moveu mouse para ${this.mousePosX}:${this.mousePosY}`);

    e.preventDefault();
  }

  handleKeyDown = (e) => {

    e.preventDefault();
  }

  handleKeyUp = (e) => {

    e.preventDefault();
  }

}
