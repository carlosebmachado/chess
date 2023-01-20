class Square {
  constructor(x, y, row, col, size, color, piece, board) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.col = col;
    this.size = size;
    this.color = color;
    this.piece = piece;
    this.board = board;
    this.highlight = false;
  }

  update(delta) {
    
  }

  isUnderAttack() {
    for (let i = 0; i < this.board.underAttackSquares.length; ++i) {
      if (this.board.underAttackSquares[i].row == this.row && this.board.underAttackSquares[i].col == this.col) {
        return true;
      }
    }
    return false;
  }

  render(g) {
    g.rect(this.x, this.y, this.size, this.size, this.color);

    if (this.highlight) {
      // g.rect(this.x, this.y, this.size, this.size, 'rgba(255, 255, 255, 0.5)');
      g.circle(this.x + this.size / 2, this.y + this.size / 2, this.size / 4, 'red');
    }

    if (this.isUnderAttack()) {
      g.rect(this.x, this.y, this.size, this.size, 'rgba(255, 0, 0, 0.25)');
      // g.circle(this.x + this.size / 2, this.y + this.size / 2, this.size / 4, 'red');
    }
  }

}