class Square {
  static LIGHT = '#f0d9b5';
  static DARK = '#b58863';

  constructor(x, y, row, col, size, color, piece, board) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.col = col;
    this.size = size;
    this.color = color === 'white' ? Square.LIGHT : Square.DARK;
    this.piece = piece;
    this.board = board;
    this.highlight = false;
    this.marked = false;
  }

  update(delta) {
    
  }

  isUnderAttack() {
    return this.board.underAttackSquares[0].includes(this) ||
           this.board.underAttackSquares[1].includes(this);
  }

  render(g) {
    g.rect(this.x, this.y, this.size, this.size, this.color);

    if (this.board.lastMove) {
      var lastFrom = this.board.lastMove.from;
      var lastTo = this.board.lastMove.to;
      if (this === lastFrom || this === lastTo) {
        g.rect(this.x, this.y, this.size, this.size, 'rgba(255, 255, 0, 0.3)');
      }
    }

    if (this.piece && this.board.selectedPiece === this.piece) {
      g.rect(this.x, this.y, this.size, this.size, 'rgba(100, 180, 255, 0.3)');
    }

    if (this === this.board.hoveredSquare) {
      g.strokeRect(this.x + 2, this.y + 2, this.size - 4, this.size - 4, 'rgba(0, 0, 0, 0.35)', 3);
    }

    if (this.highlight) {
      g.circle(this.x + this.size / 2, this.y + this.size / 2, this.size / 5, 'rgba(0, 0, 0, 0.25)');
    }

    if (this.marked) {
      g.rect(this.x, this.y, this.size, this.size, 'rgba(0, 200, 0, 0.25)');
    }

    if (Game.debug) this.drawDebug(g);
  }

  drawDebug(g) {
    if (this.isUnderAttack()) {
      g.rect(this.x, this.y, this.size, this.size, 'rgba(200, 80, 80, 0.2)');
    }

    var font = '16px monospace';
    var color = 'green';

    // debug square
    var rcText = `${Board.RNAME[this.row]}${Board.CNAME[this.col]}`;
    g.drawText(rcText, this.x + 5, this.y + 15, font, color);
  }

}