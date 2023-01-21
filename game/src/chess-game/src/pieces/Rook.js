class Rook extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess-game/assets/${color}-rook.png`, color, 'rook', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    // right move
    this.findMovements(1, 0);
    // left move
    this.findMovements(-1, 0);
    // up move
    this.findMovements(0, 1);
    // down move
    this.findMovements(0, -1);
  }

  findMovements(i, j) {
    this.possibleMoves = [];
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;

    while(true) {
      var square = null;
      try {
        square = this.board.squares[row + i][col + j];
      } catch (e) {
        break;
      }
      if (square && !square.piece) {
        this.possibleMoves.push(square);
        this.board.underAttackSquares.push(square);
      }
      if (square && square.piece && square.piece.color !== this.color) {
        this.possibleMoves.push(square);
        this.board.underAttackSquares.push(square);
        break;
      }

      i += i !== 0 && i > 0 ? 1 : -1;
      j += j !== 0 && j > 0 ? 1 : -1;

      // console.log(i, j);
    }

  }

  render(g) {
    super.render(g);
  }

}