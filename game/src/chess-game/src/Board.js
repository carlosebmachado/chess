class Board {
  static L8 = 0;
  static L7 = 1;
  static L6 = 2;
  static L5 = 3;
  static L4 = 4;
  static L3 = 5;
  static L2 = 6;
  static L1 = 7;

  static A = 0;
  static B = 1;
  static C = 2;
  static D = 3;
  static E = 4;
  static F = 5;
  static G = 6;
  static H = 7;

  static RNAME = [
    '8', '7', '6', '5', '4', '3', '2', '1'
  ];

  static CNAME = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
  ];

  constructor(playerColor) {
    this.size = 8;
    this.totalSize = Math.pow(this.size);

    var width = Game.get().g.getWidth();
    var height = Game.get().g.getHeight();

    this.squareSize = Math.min(width, height) / this.size;

    this.squares = [];
    for (let i = 0; i < this.size; i++) {
      const row = [];
      for (let j = 0; j < this.size; j++) {
        var x = j * this.squareSize;
        var y = i * this.squareSize;

        var color = (i + j) % 2 == 0 ? 'white' : 'black';

        // console.log(x, y)

        row.push(new Square(x, y, i, j, this.squareSize, color, null, this));
      }
      this.squares.push(row);
    }

    this.isHoldingAny = false;
    this.currentHolding = null;

    this.initPieces(playerColor);
    this.bot = new CEngV0(this, playerColor == Piece.WHITE ? Piece.BLACK : Piece.WHITE);

    this.whiteEatedPieces = [];
    this.blackEatedPieces = [];

    this.underAttackSquares = [];

    this.moveList = new MoveList();

    this.turn = Piece.WHITE;
  }

  update(delta) {
    this.underAttackSquares = [];
    // console.log("board update");
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];
        var piece = square.piece;
        square.update(delta);
        if (piece !== null) {
          piece.update(delta);
        }
      }
    }
    this.bot.update(delta);
  }

  render(g) {
    this.renderBoard(g);
    this.renderPieces(g);
  }

  renderBoard(g) {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];
        square.render(g);
        // console.log(square);
      }
    }
  }

  renderPieces(g) {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];

        if (square.piece !== null) {
          if (!square.piece.isHolding) {
            square.piece.x = square.x;
            square.piece.y = square.y;
          }
          square.piece.render(g);
        }
      }
    }
  }

  nextTurn() {
    this.turn = this.turn == Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  }

  initPieces(color) {
    var player = color;
    var opponent = color == Piece.WHITE ? Piece.BLACK : Piece.WHITE;

    this.squares[7][0].piece = new Rook(this, player, this.squareSize, true);
    // this.squares[7][1].piece = new Knight(this, player, this.squareSize, true);
    // this.squares[7][2].piece = new Bishop(this, player, this.squareSize, true);
    // this.squares[7][3].piece = new Queen(this, player, this.squareSize, true);
    // this.squares[7][4].piece = new King(this, player, this.squareSize, true);
    // this.squares[7][5].piece = new Bishop(this, player, this.squareSize, true);
    // this.squares[7][6].piece = new Knight(this, player, this.squareSize, true);
    this.squares[7][7].piece = new Rook(this, player, this.squareSize, true);

    this.squares[6][0].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][1].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][2].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][3].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][4].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][5].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][6].piece = new Pawn(this, player, this.squareSize, true);
    this.squares[6][7].piece = new Pawn(this, player, this.squareSize, true);

    this.squares[1][0].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][1].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][2].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][3].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][4].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][5].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][6].piece = new Pawn(this, opponent, this.squareSize, false);
    this.squares[1][7].piece = new Pawn(this, opponent, this.squareSize, false);

    this.squares[0][0].piece = new Rook(this, opponent, this.squareSize, false);
    // this.squares[0][1].piece = new Knight(this, opponent, this.squareSize, false);
    // this.squares[0][2].piece = new Bishop(this, opponent, this.squareSize, false);
    // this.squares[0][3].piece = new Queen(this, opponent, this.squareSize, false);
    // this.squares[0][4].piece = new King(this, opponent, this.squareSize, false);
    // this.squares[0][5].piece = new Bishop(this, opponent, this.squareSize, false);
    // this.squares[0][6].piece = new Knight(this, opponent, this.squareSize, false);
    this.squares[0][7].piece = new Rook(this, opponent, this.squareSize, false);
  }

}