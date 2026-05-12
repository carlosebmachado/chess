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
    this.ctx = canvas.getContext('2d');
    this.g = new Graphics(this.ctx);
    this.options = options || {};

    this.container = canvas.parentElement;
    this.wrapper = this.container.parentElement;

    this.resize();

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
    this.clickPending = null;

    this.isRightDown = false;
    this.rightClickStartX = 0;
    this.rightClickStartY = 0;
    this.rightClickStartRow = 0;
    this.rightClickStartCol = 0;

    this.running = true;
    this.loadObjects();
    this.loadEvents();

    if (this.wrapper) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.wrapper);
    }
  }

  resize() {
    if (!this.wrapper) return;
    var style = getComputedStyle(this.wrapper);
    var availW = this.wrapper.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var availH = this.wrapper.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (availW <= 0 || availH <= 0) return;

    var sidebarRatio = 230 / 600;
    var boardSize = Math.min(availH, Math.floor(availW / (1 + sidebarRatio)));
    boardSize = Math.max(boardSize, 100);
    var sidebarWidth = Math.floor(boardSize * sidebarRatio);

    this.canvas.width = boardSize;
    this.canvas.height = boardSize;
    this.rect = this.canvas.getBoundingClientRect();
    this.g.setWidth(boardSize);
    this.g.setHeight(boardSize);

    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.width = sidebarWidth + 'px';
      sidebar.style.maxHeight = boardSize + 'px';
      sidebar.style.overflow = 'hidden';
    }

    if (this.board) {
      this.board.resize(boardSize, boardSize);
    }
  }

  stop() {
    this.running = false;
    clearInterval(this.interval);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  loadObjects() {
    this.testAnimation = new TestAnimation();
    var playerColor = this.options.playerColor === 'black' ? Piece.BLACK : Piece.WHITE;
    this.board = new Board(playerColor, this.options);
    this.hud = new HUD(this.board);
  }

  loadEvents() {
    if (this.eventsLoaded) return;
    this.eventsLoaded = true;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    this.canvas.addEventListener("touchstart", this.handleTouchStart, false);
    this.canvas.addEventListener("touchend", this.handleTouchEnd, false);
    this.canvas.addEventListener("touchmove", this.handleTouchMove, false);

    window.addEventListener('keydown', this.handleKeyDown, false);
    window.addEventListener('keyup', this.handleKeyUp, false);
  }

  backToMenu() {
    this.stop();
    var canvas = document.getElementById('game-canvas');
    var sidebar = document.getElementById('sidebar');
    var menuOverlay = document.getElementById('menu-overlay');
    var confirmOverlay = document.getElementById('confirm-overlay');
    canvas.style.display = 'none';
    sidebar.style.display = 'none';
    menuOverlay.style.display = 'flex';
    confirmOverlay.style.display = 'none';
  }

  handleTouchStart = (e) => {
    var rect = this.canvas.getBoundingClientRect();
    var ox = e.touches[0].clientX - rect.left;
    var oy = e.touches[0].clientY - rect.top;

    this.clickPosX = ox;
    this.clickPosY = oy;
    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = ox;
    this.pushPosY = oy;

    this.isTouching = true;
    this.isPushing = true;

    e.preventDefault();
  }

  handleTouchEnd = (e) => {
    this.isTouching = false
    this.isPushing = false;

    if (!this.clickPending) {
      this.clickPending = {
        x: this.clickPosX,
        y: this.clickPosY,
        releaseX: this.pushPosX,
        releaseY: this.pushPosY
      };
    }

    e.preventDefault();
  }

  handleTouchMove = (e) => {
    var rect = this.canvas.getBoundingClientRect();
    var ox = e.touches[0].clientX - rect.left;
    var oy = e.touches[0].clientY - rect.top;

    this.touchPosX = e.touches[0].clientX;
    this.touchPosY = e.touches[0].clientY;

    this.pushPosX = ox;
    this.pushPosY = oy;

    e.preventDefault();
  }

  handleContextMenu = (e) => {
    e.preventDefault();
  }

  handleMouseDown = (e) => {
    if (e.button === 2) {
      this.rightClickStartX = e.offsetX;
      this.rightClickStartY = e.offsetY;
      this.rightClickStartRow = Math.floor(e.offsetY / this.board.squareSize);
      this.rightClickStartCol = Math.floor(e.offsetX / this.board.squareSize);
      this.isRightDown = true;
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    this.isClicking = true;
    this.isPushing = true;
    
    this.clickPosX = e.offsetX;
    this.clickPosY = e.offsetY;

    this.pushPosX = e.offsetX;
    this.pushPosY = e.offsetY;

    e.preventDefault();
  }

  handleMouseUp = (e) => {
    if (e.button === 2) {
      if (this.isRightDown && this.board) {
        var endCol = Math.floor(e.offsetX / this.board.squareSize);
        var endRow = Math.floor(e.offsetY / this.board.squareSize);
        if (this.board.inBoardLimit(this.rightClickStartRow, this.rightClickStartCol) &&
            this.board.inBoardLimit(endRow, endCol)) {
          var from = this.board.squares[this.rightClickStartRow][this.rightClickStartCol];
          var to = this.board.squares[endRow][endCol];
          if (from === to) {
            from.marked = !from.marked;
          } else {
            this.board.toggleArrow(from, to);
          }
        }
      }
      this.isRightDown = false;
      e.preventDefault();
      return;
    }

    this.isClicking = false;
    this.isPushing = false;

    if (!this.clickPending) {
      this.clickPending = {
        x: this.clickPosX,
        y: this.clickPosY,
        releaseX: this.pushPosX,
        releaseY: this.pushPosY
      };
    }

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
    if (e.key === 'Escape') {
      var confirmOverlay = document.getElementById('confirm-overlay');
      var menuOverlay = document.getElementById('menu-overlay');
      if (confirmOverlay.style.display === 'flex') {
        confirmOverlay.style.display = 'none';
      } else if (menuOverlay.style.display !== 'flex') {
        confirmOverlay.style.display = 'flex';
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft') {
      if (this.board) this.board.undoLastMove();
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') {
      if (this.board) this.board.redoNextMove();
      e.preventDefault();
      return;
    }
    if (e.key === 'd' || e.key === 'D') {
      Game.debug = !Game.debug;
    }
    if (e.key === 'z' || e.key === 'Z') {
      if (this.board) {
        this.board.undoLastMove();
        if (this.board.engine && this.board.turn !== this.board.playerColor) {
          this.board.undoLastMove();
        }
      }
    }

    e.preventDefault();
  }

  handleKeyUp = (e) => {

    e.preventDefault();
  }

}
