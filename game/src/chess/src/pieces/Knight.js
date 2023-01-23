class Knight extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess/assets/${color}-knight.png`, color, 'knight', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    this.possibleMoves = [];

    // up-right move
    this.findMovements(-2, 1);
    // right-up move
    this.findMovements(-1, 2);
    // right-down move
    this.findMovements(1, 2);
    // down-right move
    this.findMovements(2, 1);
    // down-left move
    this.findMovements(2, -1);
    // left-down move
    this.findMovements(1, -2);
    // left-up move
    this.findMovements(-1, -2);
    // up-left move
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