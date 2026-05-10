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

  constructor(playerColor, options) {
    this.size = 8;

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
    this.hoveredSquare = null;

    this.moveList = new MoveList();

    this.turn = Piece.WHITE;
    this.prevTurn = null;
    this.updateGame = false;

    this.gameState = 'normal';
    this.gameOver = false;
    this.enPassantTarget = null;
    this.lastMove = null;
    this.promotionPending = null;
    this.promotionChoices = [];
    this.wasPromotionPushing = false;

    this.halfMoveClock = 0;
    this.positionHistory = [];
    this.drawReason = null;
    this.undoStack = [];

    this.arrows = [];

    this.playerColor = playerColor;
    this.selectedPiece = null;
    this.justSelected = false;

    var opts = options || {};
    var mode = opts.mode || 'bot';
    this.isTwoPlayer = mode === '2player';

    this.initPieces(playerColor);

    this.recordPosition();

    this.isBotAttack = false;
    if (this.isTwoPlayer) {
      for (let i = 0; i < this.squares.length; i++) {
        for (let j = 0; j < this.squares[i].length; j++) {
          var p = this.squares[i][j].piece;
          if (p) p.playable = true;
        }
      }
      this.bot = null;
    } else {
      this.bot = new Bot(this, playerColor === Piece.WHITE ? Piece.BLACK : Piece.WHITE);
    }
  }

  initUnderAttackSquares() {
    this.underAttackSquares = [];
    for (let i = 0; i < 2; ++i) {
      this.underAttackSquares.push([]);
    }
  }

  addUnderAttackSquare(square, color) {
    if (!this.underAttackSquares[Board.getListColor(color)].includes(square)) {
      this.underAttackSquares[Board.getListColor(color)].push(square);
    }
  }

  addPieceAttackSquare(square) {
    if (!this.pieceAttackSquares.includes(square)) {
      this.pieceAttackSquares.push(square);
    }
  }

  clearHighlight() {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var square = this.squares[i][j];
        square.highlight = false;
      }
    }
  }

  toggleArrow(from, to) {
    for (var i = 0; i < this.arrows.length; i++) {
      var arrow = this.arrows[i];
      if (arrow.from === from && arrow.to === to) {
        this.arrows.splice(i, 1);
        return;
      }
    }
    this.arrows.push({from: from, to: to});
  }

  update(delta) {
    if (this.promotionPending) {
      this.checkPromotionClick();
      return;
    }

    this.initUnderAttackSquares();
    
    this.clearHighlight();

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

    for (let i = 0; i < this.kings.length; i++) {
      var king = this.kings[i];
      king.possibleMoves = [];
      king.calcMoves();
    }

    if (this.selectedPiece && !this.isHoldingAny) {
      this.selectedPiece.setHighlight(true);
    }

    if (this.bot) this.bot.update(delta);

    this.checkGameState();

    this.handleClicks();

    this.updateHoveredSquare();

  }

  handleClicks() {
    var game = Game.get();

    if (game.clickPending && !this.isHoldingAny) {
      var fromCol = Math.floor(game.clickPending.x / this.squareSize);
      var fromRow = Math.floor(game.clickPending.y / this.squareSize);
      var toCol = Math.floor(game.clickPending.releaseX / this.squareSize);
      var toRow = Math.floor(game.clickPending.releaseY / this.squareSize);

      if (fromRow === toRow && fromCol === toCol) {
        this.processClick(game.clickPending.x, game.clickPending.y);
      }

      game.clickPending = null;
    }
  }

  processClick(mx, my) {
    var col = Math.floor(mx / this.squareSize);
    var row = Math.floor(my / this.squareSize);

    if (!this.inBoardLimit(row, col)) return;

    var clickedSquare = this.squares[row][col];

    if (this.selectedPiece) {
      if (this.selectedPiece.possibleMoves.includes(clickedSquare) && this.isMoveLegal(this.selectedPiece, clickedSquare)) {
        this.selectedPiece.move(clickedSquare);
        this.selectedPiece = null;
      } else if (!this.justSelected) {
        this.selectedPiece = null;
      }
    }

    this.justSelected = false;
  }

  updateHoveredSquare() {
    if (this.gameOver || !this.isHoldingAny) {
      this.hoveredSquare = null;
      return;
    }

    var game = Game.get();
    var mx = game.mousePosX;
    var my = game.mousePosY;

    if (mx === 0 && my === 0) {
      this.hoveredSquare = null;
      return;
    }

    var col = Math.floor(mx / this.squareSize);
    var row = Math.floor(my / this.squareSize);

    if (this.inBoardLimit(row, col)) {
      this.hoveredSquare = this.squares[row][col];
    } else {
      this.hoveredSquare = null;
    }
  }

  render(g) {
    this.renderBoard(g);
    this.renderLabels(g);
    this.renderPieces(g);
    this.renderArrows(g);
    this.renderPromotionUI(g);
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

  renderLabels(g) {
    var labelColor = 'rgba(0, 0, 0, 0.25)';
    var font = '13px sans-serif';
    var pad = 5;

    g.ctx.textBaseline = 'top';
    g.ctx.textAlign = 'left';
    for (let i = 0; i < 8; i++) {
      var sq = this.squares[i][0];
      g.drawText(Board.RNAME[i], sq.x + pad, sq.y + pad, font, labelColor);
    }

    g.ctx.textBaseline = 'bottom';
    g.ctx.textAlign = 'right';
    for (let j = 0; j < 8; j++) {
      var sq = this.squares[7][j];
      g.drawText(Board.CNAME[j], sq.x + this.squareSize - pad, sq.y + this.squareSize - pad, font, labelColor);
    }

    g.ctx.textBaseline = 'alphabetic';
    g.ctx.textAlign = 'start';
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

  renderArrows(g) {
    for (var i = 0; i < this.arrows.length; i++) {
      var arrow = this.arrows[i];
      var fromX = arrow.from.x + this.squareSize / 2;
      var fromY = arrow.from.y + this.squareSize / 2;
      var toX = arrow.to.x + this.squareSize / 2;
      var toY = arrow.to.y + this.squareSize / 2;
      g.drawArrow(fromX, fromY, toX, toY, 'rgba(50, 120, 230, 0.6)', 4);
    }
  }

  inBoardLimit(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  resize(width, height) {
    this.squareSize = Math.min(width, height) / this.size;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        var sq = this.squares[i][j];
        sq.x = j * this.squareSize;
        sq.y = i * this.squareSize;
        sq.size = this.squareSize;
        if (sq.piece) {
          sq.piece.squareSize = this.squareSize;
        }
      }
    }
  }

  nextTurn() {
    this.selectedPiece = null;
    this.turn = this.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
    this.recordPosition();
  }

  initPieces(color) {
    var player = color;
    var opponent = color === Piece.WHITE ? Piece.BLACK : Piece.WHITE;

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

  isInCheck(color) {
    var king = this.kings[Board.getListColor(color)];
    if (!king || !king.currentSquare) return false;
    return this.underAttackSquares[Board.getInverseListColor(color)].includes(king.currentSquare);
  }

  recomputeAttacks() {
    this.initUnderAttackSquares();
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var piece = this.squares[i][j].piece;
        if (piece !== null && piece.name !== 'king') {
          piece.possibleMoves = [];
          piece.calcMoves();
        }
      }
    }
    for (let i = 0; i < this.kings.length; i++) {
      var king = this.kings[i];
      if (king) {
        king.possibleMoves = [];
        king.calcMoves();
      }
    }
    for (let i = 0; i < this.kings.length; i++) {
      var king = this.kings[i];
      if (king) {
        king.possibleMoves = [];
        king.calcMoves();
      }
    }
  }

  isMoveLegal(piece, targetSquare) {
    if (targetSquare.piece && targetSquare.piece.color === piece.color) {
      return false;
    }

    if (piece.name === 'pawn' && this.enPassantTarget === targetSquare) {
      return this.isEnPassantLegal(piece, targetSquare);
    }

    var fromSquare = piece.currentSquare;
    var capturedPiece = targetSquare.piece;
    var playerColor = piece.color;

    var savedAttacks = [
      [...this.underAttackSquares[0]],
      [...this.underAttackSquares[1]]
    ];
    var savedMoves = new Map();
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var p = this.squares[i][j].piece;
        if (p) {
          savedMoves.set(p, [...p.possibleMoves]);
        }
      }
    }

    fromSquare.piece = null;
    targetSquare.piece = piece;
    piece.currentSquare = targetSquare;

    this.recomputeAttacks();

    var inCheck = this.isInCheck(playerColor);

    fromSquare.piece = piece;
    targetSquare.piece = capturedPiece;
    piece.currentSquare = fromSquare;

    this.underAttackSquares = savedAttacks;
    for (let [p, moves] of savedMoves) {
      p.possibleMoves = moves;
    }

    return !inCheck;
  }

  isCastlingLegal(king, targetSquare) {
    var colDiff = targetSquare.col - king.currentSquare.col;
    var row = king.currentSquare.row;
    var rookStartCol = colDiff > 0 ? 7 : 0;
    var rookDestCol = colDiff > 0 ? 5 : 3;
    var fromKingSquare = king.currentSquare;
    var rookStartSquare = this.squares[row][rookStartCol];
    var rookDestSquare = this.squares[row][rookDestCol];
    var rook = rookStartSquare.piece;

    if (!rook || rook.name !== 'rook') return false;

    var savedAttacks = [
      [...this.underAttackSquares[0]],
      [...this.underAttackSquares[1]]
    ];
    var savedMoves = new Map();
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var p = this.squares[i][j].piece;
        if (p) savedMoves.set(p, [...p.possibleMoves]);
      }
    }

    fromKingSquare.piece = null;
    targetSquare.piece = king;
    king.currentSquare = targetSquare;

    rookStartSquare.piece = null;
    rookDestSquare.piece = rook;
    rook.currentSquare = rookDestSquare;

    this.recomputeAttacks();

    var inCheck = this.isInCheck(king.color);

    fromKingSquare.piece = king;
    targetSquare.piece = null;
    king.currentSquare = fromKingSquare;

    rookStartSquare.piece = rook;
    rookDestSquare.piece = null;
    rook.currentSquare = rookStartSquare;

    this.underAttackSquares = savedAttacks;
    for (let [p, moves] of savedMoves) {
      p.possibleMoves = moves;
    }

    return !inCheck;
  }

  isEnPassantLegal(pawn, targetSquare) {
    var fromSquare = pawn.currentSquare;
    var capturedRow = pawn.playable ? targetSquare.row + 1 : targetSquare.row - 1;
    var capturedSquare = this.squares[capturedRow][targetSquare.col];
    var capturedPawn = capturedSquare.piece;

    var savedAttacks = [
      [...this.underAttackSquares[0]],
      [...this.underAttackSquares[1]]
    ];
    var savedMoves = new Map();
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var p = this.squares[i][j].piece;
        if (p) savedMoves.set(p, [...p.possibleMoves]);
      }
    }

    fromSquare.piece = null;
    targetSquare.piece = pawn;
    pawn.currentSquare = targetSquare;
    capturedSquare.piece = null;

    this.recomputeAttacks();

    var inCheck = this.isInCheck(pawn.color);

    fromSquare.piece = pawn;
    targetSquare.piece = null;
    pawn.currentSquare = fromSquare;
    capturedSquare.piece = capturedPawn;

    this.underAttackSquares = savedAttacks;
    for (let [p, moves] of savedMoves) {
      p.possibleMoves = moves;
    }

    return !inCheck;
  }

  hasLegalMoves(color) {
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = 0; j < this.squares[i].length; j++) {
        var piece = this.squares[i][j].piece;
        if (piece && piece.color === color) {
          for (let k = 0; k < piece.possibleMoves.length; k++) {
            if (this.isMoveLegal(piece, piece.possibleMoves[k])) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  getPositionKey() {
    var key = '';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        var p = this.squares[i][j].piece;
        if (p) {
          key += p.color[0] + p.name[0];
        } else {
          key += '..';
        }
      }
    }
    key += this.turn[0];
    key += this.getCastlingKey();
    key += this.enPassantTarget ? this.enPassantTarget.row + ',' + this.enPassantTarget.col : '--';
    return key;
  }

  getCastlingKey() {
    var key = '';
    var wKing = this.squares[7][4].piece;
    var bKing = this.squares[0][4].piece;

    var wr = this.squares[7][7].piece;
    key += (wKing && wKing.name === 'king' && wKing.color === Piece.WHITE && !wKing.firstMove &&
            wr && wr.name === 'rook' && wr.color === Piece.WHITE && !wr.firstMove) ? 'K' : '-';

    wr = this.squares[7][0].piece;
    key += (wKing && wKing.name === 'king' && wKing.color === Piece.WHITE && !wKing.firstMove &&
            wr && wr.name === 'rook' && wr.color === Piece.WHITE && !wr.firstMove) ? 'Q' : '-';

    wr = this.squares[0][7].piece;
    key += (bKing && bKing.name === 'king' && bKing.color === Piece.BLACK && !bKing.firstMove &&
            wr && wr.name === 'rook' && wr.color === Piece.BLACK && !wr.firstMove) ? 'k' : '-';

    wr = this.squares[0][0].piece;
    key += (bKing && bKing.name === 'king' && bKing.color === Piece.BLACK && !bKing.firstMove &&
            wr && wr.name === 'rook' && wr.color === Piece.BLACK && !wr.firstMove) ? 'q' : '-';

    return key;
  }

  recordPosition() {
    var key = this.getPositionKey();
    this.positionHistory.push(key);
  }

  isThreefoldRepetition() {
    if (this.positionHistory.length < 5) return false;
    var last = this.positionHistory[this.positionHistory.length - 1];
    var count = 0;
    for (let i = 0; i < this.positionHistory.length; i++) {
      if (this.positionHistory[i] === last) count++;
    }
    return count >= 3;
  }

  isFiftyMoveDraw() {
    return this.halfMoveClock >= 100;
  }

  hasInsufficientMaterial() {
    var wNonKing = [];
    var bNonKing = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        var p = this.squares[i][j].piece;
        if (p && p.name !== 'king') {
          if (p.color === Piece.WHITE) {
            wNonKing.push(p);
          } else {
            bNonKing.push(p);
          }
        }
      }
    }

    if (wNonKing.length === 0 && bNonKing.length === 0) return true;

    if (wNonKing.length === 1 && bNonKing.length === 0) {
      if (wNonKing[0].name === 'bishop' || wNonKing[0].name === 'knight') return true;
    }
    if (wNonKing.length === 0 && bNonKing.length === 1) {
      if (bNonKing[0].name === 'bishop' || bNonKing[0].name === 'knight') return true;
    }

    if (wNonKing.length === 1 && bNonKing.length === 1) {
      if (wNonKing[0].name === 'bishop' && bNonKing[0].name === 'bishop') {
        var wSq = wNonKing[0].currentSquare;
        var bSq = bNonKing[0].currentSquare;
        if (wSq && bSq) {
          if ((wSq.row + wSq.col) % 2 === (bSq.row + bSq.col) % 2) return true;
        }
      }
    }

    return false;
  }

  checkGameState() {
    if (this.gameOver) return;

    var color = this.turn;
    var inCheck = this.isInCheck(color);
    var hasLegal = this.hasLegalMoves(color);

    if (inCheck && !hasLegal) {
      this.gameState = 'checkmate';
      this.gameOver = true;
    } else if (!inCheck && !hasLegal) {
      this.gameState = 'stalemate';
      this.gameOver = true;
    } else if (inCheck) {
      this.gameState = 'check';
    } else {
      this.gameState = 'normal';
    }

    if (!this.gameOver) {
      if (this.isThreefoldRepetition()) {
        this.gameState = 'draw';
        this.drawReason = 'Threefold Repetition';
        this.gameOver = true;
      } else if (this.isFiftyMoveDraw()) {
        this.gameState = 'draw';
        this.drawReason = 'Fifty-Move Rule';
        this.gameOver = true;
      } else if (this.hasInsufficientMaterial()) {
        this.gameState = 'draw';
        this.drawReason = 'Insufficient Material';
        this.gameOver = true;
      }
    }
  }

  undoLastMove() {
    if (this.undoStack.length === 0) return false;
    if (this.promotionPending) return false;

    var state = this.undoStack.pop();

    if (this.moveList.length > 0) {
      this.moveList.moves.pop();
    }

    this.halfMoveClock = state.halfMoveClock;
    this.enPassantTarget = state.enPassantTarget;
    this.gameState = state.gameState;
    this.gameOver = state.gameOver;
    this.drawReason = state.drawReason;

    if (this.positionHistory.length > 0) {
      this.positionHistory.pop();
    }

    switch (state.type) {
      case 'normal':
      case 'capture': {
        var piece = this.squares[state.toRow][state.toCol].piece;
        this.squares[state.fromRow][state.fromCol].piece = piece;
        piece.currentSquare = this.squares[state.fromRow][state.fromCol];
        piece.firstMove = state.pieceFirstMove;
        this.squares[state.toRow][state.toCol].piece = state.capturedPiece;
        if (state.capturedPiece) {
          state.capturedPiece.currentSquare = this.squares[state.toRow][state.toCol];
        }
        break;
      }
      case 'enpassant': {
        var epPiece = this.squares[state.toRow][state.toCol].piece;
        this.squares[state.fromRow][state.fromCol].piece = epPiece;
        epPiece.currentSquare = this.squares[state.fromRow][state.fromCol];
        epPiece.firstMove = state.pieceFirstMove;
        this.squares[state.toRow][state.toCol].piece = null;
        this.squares[state.epCapturedRow][state.epCapturedCol].piece = state.epCapturedPiece;
        if (state.epCapturedPiece) {
          state.epCapturedPiece.currentSquare = this.squares[state.epCapturedRow][state.epCapturedCol];
        }
        break;
      }
      case 'castling': {
        var king = this.squares[state.toRow][state.toCol].piece;
        this.squares[state.fromRow][state.fromCol].piece = king;
        king.currentSquare = this.squares[state.fromRow][state.fromCol];
        king.firstMove = state.kingFirstMove;
        this.squares[state.toRow][state.toCol].piece = null;

        var rook = this.squares[state.rookToRow][state.rookToCol].piece;
        this.squares[state.rookFromRow][state.rookFromCol].piece = rook;
        rook.currentSquare = this.squares[state.rookFromRow][state.rookFromCol];
        rook.firstMove = state.rookFirstMove;
        this.squares[state.rookToRow][state.rookToCol].piece = null;
        break;
      }
      case 'promotion': {
        this.squares[state.toRow][state.toCol].piece = state.capturedPiece;
        if (state.capturedPiece) {
          state.capturedPiece.currentSquare = this.squares[state.toRow][state.toCol];
        }
        var pawn = state.pawn;
        this.squares[state.fromRow][state.fromCol].piece = pawn;
        pawn.currentSquare = this.squares[state.fromRow][state.fromCol];
        pawn.firstMove = state.pieceFirstMove;
        break;
      }
    }

    if (state.capturedPiece) {
      var eater = state.capturedPiece.color === Piece.WHITE ? 'blackEatedPieces' : 'whiteEatedPieces';
      this[eater].pop();
    }
    if (state.type === 'enpassant' && state.epCapturedPiece) {
      var epEater = state.epCapturedPiece.color === Piece.WHITE ? 'blackEatedPieces' : 'whiteEatedPieces';
      this[epEater].pop();
    }

    this.turn = this.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
    return true;
  }

  checkPromotionClick() {
    var game = Game.get();
    if (game.isPushing && !this.wasPromotionPushing) {
      var x = game.pushPosX;
      var y = game.pushPosY;

      for (let i = 0; i < this.promotionChoices.length; i++) {
        var opt = this.promotionChoices[i];
        if (x >= opt.x && x <= opt.x + opt.w && y >= opt.y && y <= opt.y + opt.h) {
          this.completePromotion(opt.name);
          break;
        }
      }
    }
    this.wasPromotionPushing = game.isPushing;
  }

  completePromotion(choice) {
    var pending = this.promotionPending;
    if (!pending) return;

    var square = pending.square;
    var fromSquare = pending.fromSquare;
    var pawn = pending.pawn;
    var pieceTaken = pending.pieceTaken;
    var color = pending.color;

    var newPiece;
    switch (choice) {
      case 'queen': newPiece = new Queen(this, color, this.squareSize, pawn.playable); break;
      case 'rook': newPiece = new Rook(this, color, this.squareSize, pawn.playable); break;
      case 'bishop': newPiece = new Bishop(this, color, this.squareSize, pawn.playable); break;
      case 'knight': newPiece = new Knight(this, color, this.squareSize, pawn.playable); break;
      default: newPiece = new Queen(this, color, this.squareSize, pawn.playable);
    }
    newPiece.firstMove = true;

    square.piece = newPiece;
    newPiece.currentSquare = square;

    this.moveList.add({
      piece: { name: 'pawn', color: color },
      from: { row: fromSquare.row, col: fromSquare.col },
      to: { row: square.row, col: square.col },
      take: pieceTaken,
      promotion: choice
    });

    this.lastMove = { from: fromSquare, to: square };

    this.halfMoveClock = 0;
    this.promotionPending = null;
    this.promotionChoices = [];
    this.nextTurn();
  }

  renderPromotionUI(g) {
    if (!this.promotionPending) return;

    var boardSize = this.size * this.squareSize;
    var centerX = boardSize / 2;
    var centerY = boardSize / 2;

    g.rect(0, 0, boardSize, boardSize, 'rgba(0, 0, 0, 0.6)');

    var dialogW = 340;
    var dialogH = 130;
    var dialogX = centerX - dialogW / 2;
    var dialogY = centerY - dialogH / 2;
    g.rect(dialogX, dialogY, dialogW, dialogH, '#333');

    g.drawText('Promote pawn:', dialogX + 20, dialogY + 25, '18px monospace', 'white');

    var choices = ['queen', 'rook', 'bishop', 'knight'];
    var optionSize = 60;
    var spacing = 10;
    var totalW = choices.length * optionSize + (choices.length - 1) * spacing;
    var startX = centerX - totalW / 2;
    var optY = dialogY + 50;

    var colorPrefix = this.promotionPending.color[0];
    var symbols = {
      queen: MoveList.PIECES[colorPrefix].q,
      rook: MoveList.PIECES[colorPrefix].r,
      bishop: MoveList.PIECES[colorPrefix].b,
      knight: MoveList.PIECES[colorPrefix].n
    };

    this.promotionChoices = [];
    for (let i = 0; i < choices.length; i++) {
      var optX = startX + i * (optionSize + spacing);
      this.promotionChoices.push({
        name: choices[i],
        x: optX,
        y: optY,
        w: optionSize,
        h: optionSize
      });

      g.rect(optX, optY, optionSize, optionSize, '#555');
      g.rect(optX + 2, optY + 2, optionSize - 4, optionSize - 4, '#777');
      g.drawText(symbols[choices[i]], optX + optionSize / 2 - 16, optY + optionSize / 2 + 16, '40px serif', 'white');
    }
  }

}