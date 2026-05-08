class Bishop extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, color, 'bishop', squareSize, playable);
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
    this.findContinuousMovements(-1, -1);
    this.findContinuousMovements(1, 1);
    this.findContinuousMovements(-1, 1);
    this.findContinuousMovements(1, -1);
  }

  render(g) {
    super.render(g);
  }

}