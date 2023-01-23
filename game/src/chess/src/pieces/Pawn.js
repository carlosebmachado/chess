class Pawn extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess/assets/${color}-pawn.png`, color, 'pawn', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.currentSquare) return;

    if (this.playable) {
      this.findMovements(1);
    } else {
      this.findMovements(-1);
    }
  }

  findMovements(dir) {
    this.possibleMoves = [];
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;

    // normal move
    if (this.board.inBoardLimit(row - dir, col)) {
      let square = this.board.squares[row - dir][col];
      if (square && !square.piece) {
        this.possibleMoves.push(square);
      }
    }

    // attack move left
    if (this.board.inBoardLimit(row - dir, col - dir)) {
      let square = this.board.squares[row - dir][col - dir];
      if (square && square.piece && square.piece.color !== this.color) {
        this.possibleMoves.push(square);
        this.board.underAttackSquares.push(square);
        this.board.pieceAttackSquares.push(square);
      }
    }

    // attack move right
    if (this.board.inBoardLimit(row - dir, col + dir)) {
      let square = this.board.squares[row - dir][col + dir];
      if (square && square.piece && square.piece.color !== this.color) {
        this.possibleMoves.push(square);
        this.board.underAttackSquares.push(square);
        this.board.pieceAttackSquares.push(square);
      }
    }

    // first 2 squares move
    if (!this.firstMove) {
      let square = this.board.squares[row - (dir < 0 ? dir - 1 : dir + 1)][col];
      var square2 = this.board.squares[row - dir][col];
      if (!square2.piece && !square.piece) {
        this.possibleMoves.push(square);
      }
    }
  }

  render(g) {
    super.render(g);
  }

}