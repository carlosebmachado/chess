class Queen extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess/assets/${color}-queen.png`, color, 'queen', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    this.possibleMoves = [];

    // right move
    this.findContinuousMovements(0, 1);
    // // left move
    this.findContinuousMovements(0, -1);
    // // up move
    this.findContinuousMovements(1, 0);
    // // down move
    this.findContinuousMovements(-1, 0);

    // top-left move
    this.findContinuousMovements(-1, -1);
    // down-right move
    this.findContinuousMovements(1, 1);
    // top-right move
    this.findContinuousMovements(-1, 1);
    // down-left move
    this.findContinuousMovements(1, -1);

  }

  render(g) {
    super.render(g);
  }

}