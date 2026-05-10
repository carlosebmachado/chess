class Piece {
  static WHITE = "white";
  static BLACK = "black";

  constructor(board, color, name, squareSize, playable) {
    this.board = board;

    this.texture = new Image();
    this.texture.src = `/src/game/assets/${color}-${name}.png`;

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

    var isPushing = Game.get().isPushing;
    var xClick = Game.get().clickPosX;
    var yClick = Game.get().clickPosY;
    var xPos = Game.get().pushPosX;
    var yPos = Game.get().pushPosY;

    var mouseOnThis = xClick >= this.x && xClick <= this.x + this.squareSize &&
                      yClick >= this.y && yClick <= this.y + this.squareSize;

    var fromCol = Math.floor(xClick / this.squareSize);
    var fromRow = Math.floor(yClick / this.squareSize);
    var dropCol = Math.floor(xPos / this.squareSize);
    var dropRow = Math.floor(yPos / this.squareSize);
    var sameSquare = fromRow === dropRow && fromCol === dropCol;

    if (isPushing && !this.board.isHoldingAny && mouseOnThis) {
      if (this.board.selectedPiece !== this) {
        this.board.justSelected = true;
      }
      this.board.selectedPiece = this;
      this.isHolding = true;
      this.board.isHoldingAny = true;
      this.board.currentHolding = this;
      this.setClickPosition(xPos, yPos);
    }

    if (this.board.currentHolding === this) {
      this.setClickPosition(xPos, yPos);
    }

    if (this.board.currentHolding === this && !isPushing) {
      this.isHolding = false;
      this.board.isHoldingAny = false;
      this.board.currentHolding = null;

      if (sameSquare) return;

      var moved = false;
      for (let i = 0; i < this.possibleMoves.length; i++) {
        var square = this.possibleMoves[i];
        if (square && xPos >= square.x && xPos <= square.x + this.squareSize &&
          yPos >= square.y && yPos <= square.y + this.squareSize) {
          this.move(square);
          moved = true;
          break;
        }
      }

      if (!moved) {
        this.board.selectedPiece = this;
      }
    }

    if (this.isHolding) {
      this.setHighlight(true);
    }
  }

  calcMoves() {
  }

  executeMoveEvents() {
    for (let i = 0; i < this.didValidMoveEvent.length; i++) {
      this.didValidMoveEvent[i]();
    }
  }

  move(square) {
    if (!square) {
      return;
    }

    var savedEnPassant = this.board.enPassantTarget;
    this.board.enPassantTarget = null;

    if (!this.board.isMoveLegal(this, square)) {
      return;
    }

    var fromSquare = this.currentSquare;
    var pieceTaken = false;

    if (square.piece) {
      pieceTaken = true;
      this.board[this.color === Piece.WHITE ? 'whiteEatedPieces' : 'blackEatedPieces'].push(square.piece);
    }

    this.board.undoStack.push({
      type: pieceTaken ? 'capture' : 'normal',
      fromRow: fromSquare.row,
      fromCol: fromSquare.col,
      toRow: square.row,
      toCol: square.col,
      capturedPiece: square.piece || null,
      pieceFirstMove: this.firstMove || false,
      halfMoveClock: this.board.halfMoveClock,
      enPassantTarget: savedEnPassant,
      gameState: this.board.gameState,
      gameOver: this.board.gameOver,
      drawReason: this.board.drawReason,
    });

    fromSquare.piece = null;
    square.piece = this;
    this.currentSquare = square;

    this.board.moveList.add({
      piece: {
        name: this.name,
        color: this.color
      },
      from: {
        row: fromSquare.row,
        col: fromSquare.col
      },
      to: {
        row: square.row,
        col: square.col
      },
      take: pieceTaken
    });

    this.executeMoveEvents();

    this.board.lastMove = { from: fromSquare, to: square };

    if (this.name === 'pawn' || pieceTaken) {
      this.board.halfMoveClock = 0;
    } else {
      this.board.halfMoveClock++;
    }

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

    if (!square) {
      return false;
    }

    if (!square.piece) {
      this.possibleMoves.push(square);
      this.board.addUnderAttackSquare(square, this.color);
      return true;
    }

    if (square.piece && square.piece.color !== this.color) {
      this.possibleMoves.push(square);
      this.board.addUnderAttackSquare(square, this.color);
      this.board.addPieceAttackSquare(square);
      return false;
    }

    if (square.piece && square.piece.color === this.color) {
      this.board.addUnderAttackSquare(square, this.color);
      return false;
    }
    
    return true;
  }

  findCurrentSquare() {
    for (let i = 0; i < this.board.squares.length; i++) {
      for (let j = 0; j < this.board.squares[i].length; j++) {
        var square = this.board.squares[i][j];
        var piece = square.piece;
        if (piece === this) {
          this.currentSquare = square;
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