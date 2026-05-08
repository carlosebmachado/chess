class Knight extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, color, 'knight', squareSize, playable);
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
    this.findMovements(-2, 1);
    this.findMovements(-1, 2);
    this.findMovements(1, 2);
    this.findMovements(2, 1);
    this.findMovements(2, -1);
    this.findMovements(1, -2);
    this.findMovements(-1, -2);
    this.findMovements(-2, -1);
  }

  findMovements(rowOffset, colOffset) {
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;

    var calcRow = row + rowOffset;
    var calcCol = col + colOffset;

    this.addNormalMovement(calcRow, calcCol);
  }

  render(g) {
    super.render(g);
  }

}