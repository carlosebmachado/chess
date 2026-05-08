class Bot {
  constructor(board, color) {
    this.board = board;
    this.color = color;
  }

  update(delta) {
    if (this.board.turn !== this.color) return;

    if (this.board.gameOver) return;

    var botPieces = [];

    for (let i = 0; i < this.board.squares.length; ++i) {
      for (let j = 0; j < this.board.squares[i].length; ++j) {
        let square = this.board.squares[i][j];
        let piece = square.piece;
        if (piece && !piece.playable) {
          botPieces.push(piece);
        }
      }
    }

    Utils.shuffle(botPieces);

    for (let pi = 0; pi < botPieces.length; ++pi) {
      var piece = botPieces[pi];
      Utils.shuffle(piece.possibleMoves);
      for (let mi = 0; mi < piece.possibleMoves.length; ++mi) {
        if (this.board.isMoveLegal(piece, piece.possibleMoves[mi])) {
          this.move(piece.possibleMoves[mi], piece);
          return;
        }
      }
    }
  }

  move(square, piece) {
    piece.move(square);
  }

  render(g) {
  }
}