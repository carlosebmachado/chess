class Bot {
  constructor(board, color) {
    this.board = board;
    this.color = color;
  }

  update(delta) {
    if (this.board.turn !== this.color) return;

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

    var pieceIndex = Utils.randomInt(0, botPieces.length - 1);
    var piece = botPieces[pieceIndex];

    var moveIndex = Utils.randomInt(0, piece.possibleMoves.length - 1);
    this.move(piece.possibleMoves[moveIndex], piece);

  }

  move(square, piece) {
    piece.move(square);
  }

  render(g) {
  }
}