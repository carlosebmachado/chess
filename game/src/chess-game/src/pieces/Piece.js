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
    if (!this.playable) return;

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

      var isValidMove = false;

      for (let i = 0; i < this.possibleMoves.length; i++) {
        var square = this.possibleMoves[i];
        if (square && xPos >= square.x && xPos <= square.x + this.squareSize &&
          yPos >= square.y && yPos <= square.y + this.squareSize) {

          var pieceTaken = false;
          if (square.piece) {
            pieceTaken = true;
          }

          this.currentSquare.piece = null;
          square.piece = this;
          this.currentSquare = square;

          isValidMove = true;

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

          break;
          // this.setClickPosition(square.x, square.y);
        }
      }

      if (isValidMove) {
        for (let i = 0; i < this.didValidMoveEvent.length; i++) {
          this.didValidMoveEvent[i]();
        }
      }
    }

    if (this.isHolding) {
      this.setHighlight(true);
    } else {
      this.setHighlight(false);
    }
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
    this.possibleMoves = [];
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