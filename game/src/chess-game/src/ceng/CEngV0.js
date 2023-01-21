class CEngV0 {
  constructor(board, color) {
    this.board = board;
    this.color = color;
  }

  update(delta) {
    if (this.board.turn !== this.color) return;

    var playablePieces = [];

    for (let i = 0; i < this.board.squares.length; ++i) {
      for (let j = 0; j < this.board.squares[i].length; ++j) {
        var square = this.board.squares[i][j];
        var piece = square.piece;
        if (piece && !piece.playable) {
          playablePieces.push(piece);
        }
      }
    }

    var piece = playablePieces[Utils.randomInt(0, playablePieces.length - 1)];

    this.move(piece.possibleMoves[Utils.randomInt(0, piece.possibleMoves.length - 1)], piece);

  }

  move(square, piece) {
    piece.move(square);
  }

  render(g) {
  }
}