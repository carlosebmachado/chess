class King extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, color, 'king', squareSize, playable);
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
    this.findMovements();
  }

  findMovements() {
    for (let row = -1; row < 2; ++row) {
      for (let col = -1; col < 2; ++col) {
        if (row === 0 && col === 0) continue;

        var calcRow = this.currentSquare.row + row;
        var calcCol = this.currentSquare.col + col

        if (!this.board.inBoardLimit(calcRow, calcCol)) continue;

        var movSquare = this.board.squares[calcRow][calcCol];

        if (this.board.underAttackSquares[Board.getInverseListColor(this.color)].includes(movSquare)) {
          continue;
        }

        this.addNormalMovement(calcRow, calcCol);
      }
    }
  }

  render(g) {
    super.render(g);
  }

}