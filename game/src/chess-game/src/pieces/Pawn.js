class Pawn extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, `../src/chess-game/assets/${color}-pawn.png`, color, 'pawn', squareSize, playable);
    this.firstMove = false;

    this.didValidMoveEvent.push(() => {
      this.firstMove = true;
    });
  }

  update(delta) {
    super.update(delta);
    // console.log("pawn update");

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
    var square = null;
    try {
      square = this.board.squares[row - dir][col];
    } catch (e) { }
    if (square && !square.piece) {
      this.possibleMoves.push(square);
    }

    // attack move left
    square = null;
    try {
      square = this.board.squares[row - dir][col - dir];
    } catch (e) { }
    if (square && square.piece && square.piece.color !== this.color) {
      this.possibleMoves.push(square);
      this.board.underAttackSquares.push(square);
    }

    // attack move right
    square = null;
    try {
      square = this.board.squares[row - dir][col + dir];
    } catch (e) { }
    if (square && square.piece && square.piece.color !== this.color) {
      this.possibleMoves.push(square);
      this.board.underAttackSquares.push(square);
    }

    // first 2 squares move
    // if (dir != 1) return;
    if (!this.firstMove) {
      square = this.board.squares[row - (dir < 0 ? dir - 1 : dir + 1)][col];
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