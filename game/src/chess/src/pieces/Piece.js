class Piece {
  static WHITE = "white";
  static BLACK = "black";

  constructor(board, src, color, name, squareSize, playable) {
    this.board = board;

    this.texture = new Image();
    this.texture.src = src;

    this.x = 0;
    this.y = 0;
    this.isHolding = false;
    this.isHoldingWhite = false;
    this.isHoldingBlack = false;

    this.color = color;
    this.name = name;

    this.currentSquare = null;
    this.possibleMoves = [];

    this.texture.addEventListener(
      "load",
      () => {
        this.loaded = true;
      },
      false
    );

    this.squareSize = squareSize;

    this.playable = playable;

    this.didValidMoveEvent = [];

  }

  update(delta) {
    if (!this.currentSquare) {
      this.findCurrentSquare();
    }

    this.updatePlayer(delta);
  }

  updatePlayer(delta) {
    if (!this.playable || this.color !== this.board.turn) return;

    var isClicking = Game.get().isPushing;
    var xClick = Game.get().clickPosX;
    var yClick = Game.get().clickPosY;
    var xPos = Game.get().pushPosX;
    var yPos = Game.get().pushPosY;

    if (isClicking &&
      !this.board.isHoldingAny &&
      xClick >= this.x && xClick <= this.x + this.squareSize &&
      yClick >= this.y && yClick <= this.y + this.squareSize) {
      this.isHolding = true;
      this.board.isHoldingAny = true;
      this.board.currentHolding = this;
      this.setClickPosition(xPos, yPos);
      // console.log("holding");
    }

    if (this.board.currentHolding === this) {
      this.setClickPosition(xPos, yPos);
    }

    if (this.board.currentHolding === this && !isClicking) {
      this.isHolding = false;
      this.board.isHoldingAny = false;
      this.board.currentHolding = null;
      // console.log("not holding");

      for (let i = 0; i < this.possibleMoves.length; i++) {
        var square = this.possibleMoves[i];
        if (square && xPos >= square.x && xPos <= square.x + this.squareSize &&
          yPos >= square.y && yPos <= square.y + this.squareSize) {

          this.move(square);

          break;
        }
      }

    }

    if (this.isHolding) {
      this.setHighlight(true);
    } else {
      this.setHighlight(false);
    }
  }

  executeMoveEvents() {
    for (let i = 0; i < this.didValidMoveEvent.length; i++) {
      this.didValidMoveEvent[i]();
    }
  }

  move(square) {
    var pieceTaken = false;
    if (square.piece) {
      pieceTaken = true;
      // todo add piece to taken list
    }

    this.currentSquare.piece = null;
    square.piece = this;
    this.currentSquare = square;

    this.board.moveList.add({
      piece: {
        name: this.name,
        color: this.color
      },
      from: {
        row: this.currentSquare.row,
        col: this.currentSquare.col
      },
      to: {
        row: square.row,
        col: square.col
      },
      take: pieceTaken
    });
    
    this.executeMoveEvents();

    this.board.nextTurn();
  }

  findContinuousMovements(rowDir, colDir) {
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;

    while (true) {
      var calcRow = row + rowDir;
      var calcCol = col + colDir;
      
      if (!this.addNormalMovement(calcRow, calcCol)) {
        break;
      }

      if (rowDir !== 0) {
        rowDir += rowDir > 0 ? 1 : -1;
      }

      if (colDir !== 0) {
        colDir += colDir > 0 ? 1 : -1;
      }
    }

  }

  addNormalMovement(row, col) {
    if (!this.board.inBoardLimit(row, col)) {
      return false;
    }

    var square = this.board.squares[row][col];

    if (square && !square.piece) {
      this.possibleMoves.push(square);
      this.board.underAttackSquares[Board.getListColor(this.color)].push(square);
      return true;
    }

    if (square && square.piece && square.piece.color !== this.color) {
      this.possibleMoves.push(square);
      this.board.underAttackSquares[Board.getListColor(this.color)].push(square);
      this.board.pieceAttackSquares.push(square);
      return false;
    }

    if (square && square.piece && square.piece.color === this.color) {
      return false;
    }
    
    return true;
  }

  findCurrentSquare() {
    for (let i = 0; i < this.board.squares.length; i++) {
      for (let j = 0; j < this.board.squares[i].length; j++) {
        var square = this.board.squares[i][j];
        var piece = square.piece;
        // console.log("piece: ", piece);
        if (piece === this) {
          this.currentSquare = square;
          // console.log("current square: ", this.currentSquare);
        }
      }
    }
  }

  setHighlight(highlight) {
    for (let i = 0; i < this.possibleMoves.length; i++) {
      var square = this.possibleMoves[i];
      if (square) {
        square.highlight = highlight;
      }
    }
  }

  setClickPosition(x, y) {
    this.x = x - this.squareSize / 2;
    this.y = y - this.squareSize / 2;
  }

  render(g) {
    if (!this.loaded) {
      return;
    }
    g.drawImage(this.texture, this.x, this.y, this.squareSize, this.squareSize);
  }

}