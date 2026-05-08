class Rook extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, color, 'rook', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    this.possibleMoves = [];

    this.calcMoves();
  }

  calcMoves() {
    this.findContinuousMovements(0, 1);
    this.findContinuousMovements(0, -1);
    this.findContinuousMovements(1, 0);
    this.findContinuousMovements(-1, 0);
  }

  render(g) {
    super.render(g);
  }

}