class Rook extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess/assets/${color}-rook.png`, color, 'rook', squareSize, playable);
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
  }

  render(g) {
    super.render(g);
  }

}