class Game {
  static debug = false;
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
    if (Game.debug) this.testAnimation.update(delta);
    this.board.update(delta);
    this.hud.update(delta);
  }

  render(g) {
    g.clear();

    if (Game.debug) this.testAnimation.render(g);
    this.board.render(g);
  }

  start(canvas, orientation, options) {
    this.canvas = canvas;
    this.rect = this.canvas.getBoundingClientRect();
    this.ctx = canvas.getContext('2d');
    this.g = new Graphics(this.ctx);
    this.options = options || {};

    var size = 600;
    this.g.setWidth(size);
    this.g.setHeight(size);

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
    var playerColor = this.options.playerColor === 'black' ? Piece.BLACK : Piece.WHITE;
    this.board = new Board(playerColor, this.options);
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
    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = this.touchPosX;
    this.pushPosY = this.touchPosY;

    this.isTouching = true;
    this.isPushing = true;

    e.preventDefault();
  }

  handleTouchEnd = (e) => {
    this.isTouching = false
    this.isPushing = false;

    e.preventDefault();
  }

  handleTouchMove = (e) => {
    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = this.touchPosX;
    this.pushPosY = this.touchPosY;

    e.preventDefault();
  }

  handleMouseDown = (e) => {
    this.isClicking = true;
    this.isPushing = true;
    
    this.clickPosX = e.offsetX;
    this.clickPosY = e.offsetY;

    this.pushPosX = e.offsetX;
    this.pushPosY = e.offsetY;

    e.preventDefault();
  }

  handleMouseUp = (e) => {
    this.isClicking = false;
    this.isPushing = false;

    e.preventDefault();
  }

  handleMouseMove = (e) => {
    this.mousePosX = e.offsetX;
    this.mousePosY = e.offsetY;

    this.pushPosX = this.mousePosX;
    this.pushPosY = this.mousePosY;

    e.preventDefault();
  }

  handleKeyDown = (e) => {
    if (e.key === 'd' || e.key === 'D') {
      Game.debug = !Game.debug;
    }

    e.preventDefault();
  }

  handleKeyUp = (e) => {

    e.preventDefault();
  }

}
