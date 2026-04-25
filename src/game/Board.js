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

  static LIST_WHITE = 0;
  static LIST_BLACK = 1;

  static getListColor(color) {
    return color === Piece.WHITE ? Board.LIST_WHITE : Board.LIST_BLACK;
  }

  static getInverseListColor(color) {
    return color === Piece.WHITE ? Board.LIST_BLACK : Board.LIST_WHITE;
  }

  static RNAME = [
    '8', '7', '6', '5', '4', '3', '2', '1'
  ];

  static CNAME = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
  ];

  static getSquareName(row, col) {
    return Board.CNAME[col] + Board.RNAME[row];
  }

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

    this.whiteEatedPieces = [];
    this.blackEatedPieces = [];

    this.initUnderAttackSquares();

    this.pieceAttackSquares = [];

    this.moveList = new MoveList();

    this.turn = Piece.WHITE;
    this.prevTurn = null;
    this.updateGame = false;

    this.initPieces(playerColor);
    this.bot = new Bot(this, playerColor == Piece.WHITE ? Piece.BLACK : Piece.WHITE);
  }

  initUnderAttackSquares() {
    this.underAttackSquares = [];
    for (let i = 0; i < 2; ++i) {
      this.underAttackSquares.push([]);
    }
  }

  update(delta) {
    this.initUnderAttackSquares();

    // console.log("board update");
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];
        var piece = square.piece;

        square.update(delta);
        if (piece !== null) {
          if (piece.name === 'king') continue;
          piece.update(delta);
        }
      }
    }

    for (let i = 0; i < this.kings.length; i++) {
      var king = this.kings[i];
      king.update(delta);
    }

    this.bot.update(delta);
    // if (this.turn !== Piece.WHITE) this.turn = Piece.WHITE;

  }

  render(g) {
    this.renderBoard(g);
    this.renderPieces(g);
  }

  renderBoard(g) {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];
        if (this.currentHolding && this.currentHolding.currentSquare === square) continue;
        square.render(g);
        // console.log(square);
      }
    }

    if (this.currentHolding) {
      this.currentHolding.currentSquare.render(g);
    }
  }

  renderPieces(g) {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];

        if (square.piece !== null) {
          if (square.piece === this.currentHolding) continue;
          square.piece.x = square.x;
          square.piece.y = square.y;
          square.piece.render(g);
        }
      }
    }

    if (this.currentHolding) {
      this.currentHolding.render(g);
    }
  }

  inBoardLimit(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  nextTurn() {
    this.turn = this.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  }

  initPieces(color) {
    var player = color;
    var opponent = color === Piece.WHITE ? Piece.BLACK : Piece.WHITE;


    // this.squares[3][3].piece = new Knight(this, player, this.squareSize, true);
    // this.squares[6][3].piece = new Pawn(this, player, this.squareSize, true);
    // this.squares[3][3].piece = new King(this, player, this.squareSize, true);

    this.squares[7][0].piece = new Rook(this, player, this.squareSize, true);
    this.squares[7][1].piece = new Knight(this, player, this.squareSize, true);
    this.squares[7][2].piece = new Bishop(this, player, this.squareSize, true);
    this.squares[7][3].piece = new Queen(this, player, this.squareSize, true);
    this.squares[7][4].piece = new King(this, player, this.squareSize, true);
    this.squares[7][5].piece = new Bishop(this, player, this.squareSize, true);
    this.squares[7][6].piece = new Knight(this, player, this.squareSize, true);
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
    this.squares[0][1].piece = new Knight(this, opponent, this.squareSize, false);
    this.squares[0][2].piece = new Bishop(this, opponent, this.squareSize, false);
    this.squares[0][3].piece = new Queen(this, opponent, this.squareSize, false);
    this.squares[0][4].piece = new King(this, opponent, this.squareSize, false);
    this.squares[0][5].piece = new Bishop(this, opponent, this.squareSize, false);
    this.squares[0][6].piece = new Knight(this, opponent, this.squareSize, false);
    this.squares[0][7].piece = new Rook(this, opponent, this.squareSize, false);

    this.kings = Array(2).fill(null);
    if (player === Piece.WHITE) {
      this.kings[Board.LIST_WHITE] = this.squares[7][4].piece;
      this.kings[Board.LIST_BLACK] = this.squares[0][4].piece;
    } else {
      this.kings[Board.LIST_WHITE] = this.squares[0][4].piece;
      this.kings[Board.LIST_BLACK] = this.squares[7][4].piece;
    }
  }

}