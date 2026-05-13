import Piece from './Piece.js';
import Board from '../Board.js';

export default class Pawn extends Piece {
  constructor(board, color, squareSize, playable) {
    super(board, color, 'pawn', squareSize, playable);
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
    var dir = this.color === this.board.playerColor ? 1 : -1;
    this.findMovements(dir);
  }

  findMovements(dir) {
    var row = this.currentSquare.row;
    var col = this.currentSquare.col;

    // normal move
    if (this.board.inBoardLimit(row - dir, col)) {
      let square = this.board.squares[row - dir][col];
      if (square && !square.piece) {
        this.possibleMoves.push(square);
      }
    }

    // attack move left
    if (this.board.inBoardLimit(row - dir, col - dir)) {
      let square = this.board.squares[row - dir][col - dir];
      if (square) {
        this.board.underAttackSquares[Board.getListColor(this.color)].push(square);
        var canCapture = square.piece && square.piece.color !== this.color;
        var isEnPassant = square === this.board.enPassantTarget;
        if (canCapture || isEnPassant) {
          this.possibleMoves.push(square);
          if (canCapture) {
            this.board.pieceAttackSquares.push(square);
          }
        }
      }
    }

    // attack move right
    if (this.board.inBoardLimit(row - dir, col + dir)) {
      let square = this.board.squares[row - dir][col + dir];
      if (square) {
        this.board.underAttackSquares[Board.getListColor(this.color)].push(square);
        var canCapture = square.piece && square.piece.color !== this.color;
        var isEnPassant = square === this.board.enPassantTarget;
        if (canCapture || isEnPassant) {
          this.possibleMoves.push(square);
          if (canCapture) {
            this.board.pieceAttackSquares.push(square);
          }
        }
      }
    }

    // first 2 squares move
    if (!this.firstMove) {
      var doubleRow = row - (dir < 0 ? dir - 1 : dir + 1);
      if (this.board.inBoardLimit(doubleRow, col)) {
        let square = this.board.squares[doubleRow][col];
        var square2 = this.board.squares[row - dir][col];
        if (!square2.piece && !square.piece) {
          this.possibleMoves.push(square);
        }
      }
    }
  }

  move(square) {
    if (!square) return;

    if (this.board.enPassantTarget === square) {
      this.executeEnPassant(square);
      return;
    }

    var fromRow = this.currentSquare.row;
    var fromCol = this.currentSquare.col;
    var isDoubleMove = Math.abs(square.row - fromRow) === 2 && square.col === fromCol;

    var dir = this.color === this.board.playerColor ? 1 : -1;
    var isPromotion = (dir > 0 && square.row === Board.L8) || (dir < 0 && square.row === Board.L1);

    if (isPromotion) {
      var savedEnPassant = this.board.enPassantTarget;
      this.board.enPassantTarget = null;
      if (!this.board.isMoveLegal(this, square)) return;

      var fromSquare = this.currentSquare;
      var pieceTaken = square.piece ? true : false;
      if (pieceTaken) {
        this.board[this.color === Piece.WHITE ? 'whiteEatedPieces' : 'blackEatedPieces'].push(square.piece);
      }

      this.board.undoStack.push({
        type: 'promotion',
        fromRow: fromSquare.row,
        fromCol: fromSquare.col,
        toRow: square.row,
        toCol: square.col,
        pawn: this,
        capturedPiece: square.piece || null,
        pieceFirstMove: this.firstMove || false,
        halfMoveClock: this.board.halfMoveClock,
        enPassantTarget: savedEnPassant,
        gameState: this.board.gameState,
        gameOver: this.board.gameOver,
        drawReason: this.board.drawReason,
        lastMove: this.board.lastMove,
      });

      fromSquare.piece = null;
      square.piece = this;
      this.currentSquare = square;

      this.firstMove = true;
      this.executeMoveEvents();

      if (!this.playable) {
        this.board.completePromotion('queen');
        return;
      }

      this.board.promotionPending = {
        pawn: this,
        square: square,
        fromSquare: fromSquare,
        pieceTaken: pieceTaken,
        color: this.color
      };
      return;
    }

    super.move(square);

    if (isDoubleMove) {
      var midRow = (fromRow + square.row) / 2;
      this.board.enPassantTarget = this.board.squares[parseInt(midRow)][square.col];
    }
  }

  executeEnPassant(square) {
    if (!this.board.isEnPassantLegal(this, square)) return;

    var fromSquare = this.currentSquare;
    var dir = this.color === this.board.playerColor ? 1 : -1;
    var capturedRow = dir > 0 ? square.row + 1 : square.row - 1;
    var capturedSquare = this.board.squares[capturedRow][square.col];

    this.board.undoStack.push({
      type: 'enpassant',
      fromRow: fromSquare.row,
      fromCol: fromSquare.col,
      toRow: square.row,
      toCol: square.col,
      epCapturedRow: capturedRow,
      epCapturedCol: square.col,
      epCapturedPiece: capturedSquare.piece,
      pieceFirstMove: this.firstMove || false,
      halfMoveClock: this.board.halfMoveClock,
      enPassantTarget: this.board.enPassantTarget,
      gameState: this.board.gameState,
      gameOver: this.board.gameOver,
      drawReason: this.board.drawReason,
      lastMove: this.board.lastMove,
    });

    fromSquare.piece = null;
    square.piece = this;
    this.currentSquare = square;

    var epCaptured = capturedSquare.piece;
    capturedSquare.piece = null;

    this.board[this.color === Piece.WHITE ? 'whiteEatedPieces' : 'blackEatedPieces'].push(epCaptured);

    this.firstMove = true;
    this.board.enPassantTarget = null;

    this.board.moveList.add({
      piece: { name: this.name, color: this.color },
      from: { row: fromSquare.row, col: fromSquare.col },
      to: { row: square.row, col: square.col },
      take: true
    });

    this.board.lastMove = { from: fromSquare, to: square };

    this.board.halfMoveClock = 0;
    this.board.nextTurn();
  }

  render(g) {
    super.render(g);
  }

}