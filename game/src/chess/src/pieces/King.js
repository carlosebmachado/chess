class King extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess/assets/${color}-king.png`, color, 'kingpawn', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    this.findMovements();
  }

  findMovements() {
    for (var row = -1; row < 2; ++row) {
      for (var col = -1; col < 2; ++col) {
        if (row === 0 && col === 0) continue;
        this.addNormalMovement(this.currentSquare.row + row, this.currentSquare.col + col);
      }
    }
  }

  render(g) {
    super.render(g);
  }

}