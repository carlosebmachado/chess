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

        this.board.addUnderAttackSquare(movSquare, this.color);

        if (this.board.underAttackSquares[Board.getInverseListColor(this.color)].includes(movSquare)) {
          continue;
        }

        if (movSquare.piece && movSquare.piece.color === this.color) continue;

        this.possibleMoves.push(movSquare);
        if (movSquare.piece && movSquare.piece.color !== this.color) {
          this.board.addPieceAttackSquare(movSquare);
        }
      }
    }

    if (this.firstMove) return;
    this.checkCastling();
  }

  checkCastling() {
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;
    var enemy = Board.getInverseListColor(this.color);

    // Kingside
    var ksRookSquare = this.board.squares[row][7];
    if (ksRookSquare.piece && ksRookSquare.piece.name === 'rook' && !ksRookSquare.piece.firstMove &&
        !this.board.squares[row][5].piece && !this.board.squares[row][6].piece &&
        !this.board.isInCheck(this.color) &&
        !this.board.underAttackSquares[enemy].includes(this.board.squares[row][5]) &&
        !this.board.underAttackSquares[enemy].includes(this.board.squares[row][6]) &&
        this.board.isCastlingLegal(this, this.board.squares[row][6])) {
      this.possibleMoves.push(this.board.squares[row][6]);
    }

    // Queenside
    var qsRookSquare = this.board.squares[row][0];
    if (qsRookSquare.piece && qsRookSquare.piece.name === 'rook' && !qsRookSquare.piece.firstMove &&
        !this.board.squares[row][1].piece && !this.board.squares[row][2].piece && !this.board.squares[row][3].piece &&
        !this.board.isInCheck(this.color) &&
        !this.board.underAttackSquares[enemy].includes(this.board.squares[row][3]) &&
        !this.board.underAttackSquares[enemy].includes(this.board.squares[row][2]) &&
        this.board.isCastlingLegal(this, this.board.squares[row][2])) {
      this.possibleMoves.push(this.board.squares[row][2]);
    }
  }

  move(square) {
    if (!square) return;

    if (Math.abs(square.col - this.currentSquare.col) === 2) {
      this.executeCastling(square);
      return;
    }

    super.move(square);
  }

  executeCastling(square) {
    var colDiff = square.col - this.currentSquare.col;
    var row = this.currentSquare.row;
    var rookStartCol = colDiff > 0 ? 7 : 0;
    var rookDestCol = colDiff > 0 ? 5 : 3;
    var fromSquare = this.currentSquare;
    var rookStartSquare = this.board.squares[row][rookStartCol];
    var rookDestSquare = this.board.squares[row][rookDestCol];
    var rook = rookStartSquare.piece;

    fromSquare.piece = null;
    square.piece = this;
    this.currentSquare = square;

    rookStartSquare.piece = null;
    rookDestSquare.piece = rook;
    rook.currentSquare = rookDestSquare;

    this.firstMove = true;
    rook.firstMove = true;
    this.board.enPassantTarget = null;

    this.board.moveList.add({
      piece: { name: this.name, color: this.color },
      from: { row: fromSquare.row, col: fromSquare.col },
      to: { row: square.row, col: square.col },
      take: false
    });

    this.board.halfMoveClock++;
    this.board.nextTurn();
  }

  render(g) {
    super.render(g);
  }

}