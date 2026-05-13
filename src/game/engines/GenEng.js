export default class GenEng {
  static EMPTY = 0;
  static W_PAWN = 1;  static W_KNIGHT = 2;  static W_BISHOP = 3;
  static W_ROOK = 4;   static W_QUEEN = 5;   static W_KING = 6;
  static B_PAWN = 7;   static B_KNIGHT = 8;  static B_BISHOP = 9;
  static B_ROOK = 10;  static B_QUEEN = 11;  static B_KING = 12;

  static PIECE_NAMES = ['', 'p', 'n', 'b', 'r', 'q', 'k', 'p', 'n', 'b', 'r', 'q', 'k'];
  static FILES = 'abcdefgh';
  static RANKS = '87654321';

  static VALUES = [0, 100, 320, 330, 500, 900, 20000, 100, 320, 330, 500, 900, 20000];

  constructor() {
    this.outputCallback = null;
    this.level = 5;
    this.searchTimeLimit = 3000;
    this.searching = false;
    this.stopRequested = false;
    this.nodeCount = 0;

    this.resetToStartpos();
  }

  setOutputCallback(cb) { this.outputCallback = cb; }

  send(msg) { if (this.outputCallback) this.outputCallback(msg); }

  handleUCI(cmd) {
    var parts = cmd.trim().split(/\s+/);
    if (parts.length === 0) return;
    switch (parts[0]) {
      case 'uci': this.cmdUci(); break;
      case 'isready': this.cmdIsready(); break;
      case 'ucinewgame': this.cmdUcinewgame(); break;
      case 'setoption': this.cmdSetoption(parts.slice(1)); break;
      case 'position': this.cmdPosition(parts.slice(1)); break;
      case 'go': this.cmdGo(parts.slice(1)); break;
      case 'stop': this.cmdStop(); break;
      case 'quit': this.cmdQuit(); break;
    }
  }

  cmdUci() {
    this.send('id name GenEng');
    this.send('id author GenEng');
    this.send('option name Level type spin default 5 min 1 max 10');
    this.send('uciok');
  }

  cmdIsready() { this.send('readyok'); }
  cmdUcinewgame() { this.resetToStartpos(); }

  cmdSetoption(args) {
    for (var i = 0; i < args.length; i++) {
      if (args[i] === 'name' && i + 2 < args.length) {
        var optName = args[i + 1];
        if (optName === 'Level' && i + 3 < args.length && args[i + 2] === 'value') {
          this.level = parseInt(args[i + 3], 10);
          this.level = Math.max(1, Math.min(10, this.level));
        }
        break;
      }
    }
  }

  cmdPosition(args) {
    var idx = 0;
    if (args[idx] === 'startpos') {
      this.resetToStartpos();
      idx++;
    } else if (args[idx] === 'fen') {
      idx++;
      var fenParts = [];
      while (idx < args.length && args[idx] !== 'moves') {
        fenParts.push(args[idx]);
        idx++;
      }
      this.parseFEN(fenParts.join(' '));
    }
    if (idx < args.length && args[idx] === 'moves') {
      idx++;
      while (idx < args.length) {
        this.applyUCIMove(args[idx]);
        idx++;
      }
    }
  }

  cmdGo(args) {
    var self = this;
    this.searching = true;
    this.stopRequested = false;
    this.nodeCount = 0;

    var maxDepth = this.getDepthForLevel();
    var timeLimit = 3000;

    for (var i = 0; i < args.length; i++) {
      if (args[i] === 'movetime' && i + 1 < args.length) {
        timeLimit = parseInt(args[i + 1], 10);
      } else if (args[i] === 'depth' && i + 1 < args.length) {
        maxDepth = parseInt(args[i + 1], 10);
      } else if (args[i] === 'wtime' && i + 1 < args.length) {
        var wtime = parseInt(args[i + 1], 10);
        var btime = parseInt(args[i + 3] || '300000', 10);
        var time = this.board.sideToMove === 'w' ? wtime : btime;
        timeLimit = Math.max(100, Math.floor(time / 40));
      }
    }

    setTimeout(function() {
      var state = self.saveState();
      var move = self.findBestMove(state, timeLimit, maxDepth);
      self.searching = false;
      if (move) {
        self.send('bestmove ' + move);
      } else {
        self.send('bestmove 0000');
      }
    }, 1);
  }

  cmdStop() { this.stopRequested = true; this.searching = false; }
  cmdQuit() { this.stopRequested = true; this.searching = false; }

  getDepthForLevel() {
    var depths = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14];
    return depths[this.level - 1] || 5;
  }

  saveState() {
    var wkr = -1, wkc = -1, bkr = -1, bkc = -1;
    for (var i = 0; i < 64; i++) {
      var p = this.board[i];
      if (p === GenEng.W_KING) { wkr = i >> 3; wkc = i & 7; }
      if (p === GenEng.B_KING) { bkr = i >> 3; bkc = i & 7; }
    }
    return {
      board: new Uint8Array(this.board),
      sideToMove: this.sideToMove,
      castling: this.castling,
      epSquare: this.epSquare ? { row: this.epSquare.row, col: this.epSquare.col } : null,
      wKingRow: wkr, wKingCol: wkc,
      bKingRow: bkr, bKingCol: bkc
    };
  }

  loadState(state) {
    this.board = new Uint8Array(state.board);
    this.sideToMove = state.sideToMove;
    this.castling = state.castling;
    this.epSquare = state.epSquare ? { row: state.epSquare.row, col: state.epSquare.col } : null;
  }

  resetToStartpos() {
    this.parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  parseFEN(fen) {
    this.board = new Uint8Array(64);
    var parts = fen.split(' ');
    var rows = parts[0].split('/');

    for (var r = 0; r < 8; r++) {
      var col = 0;
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        if (ch >= '1' && ch <= '8') {
          col += parseInt(ch, 10);
        } else {
          var isUpper = ch === ch.toUpperCase();
          var type = ch.toLowerCase();
          var pieceMap = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 };
          var idx = pieceMap[type] || 0;
          this.board[r * 8 + col] = isUpper ? idx + 1 : idx + 7;
          col++;
        }
      }
    }

    this.sideToMove = parts[1] || 'w';
    this.castling = parts[2] || '-';
    this.epSquare = parts[3] && parts[3] !== '-' ? this.parseSquare(parts[3]) : null;
  }

  parseSquare(uci) {
    var col = GenEng.FILES.indexOf(uci[0]);
    var row = GenEng.RANKS.indexOf(uci[1]);
    if (col === -1 || row === -1) return null;
    return { row: row, col: col };
  }

  coordToUCI(row, col) {
    return GenEng.FILES[col] + GenEng.RANKS[row];
  }

  applyUCIMove(uci) {
    var from = this.parseSquare(uci.substring(0, 2));
    var to = this.parseSquare(uci.substring(2, 4));
    if (!from || !to) return;

    var fromIdx = from.row * 8 + from.col;
    var toIdx = to.row * 8 + to.col;
    var piece = this.board[fromIdx];
    if (!piece) return;

    if (this.getPieceType(piece) === 'p' && this.epSquare &&
        to.row === this.epSquare.row && to.col === this.epSquare.col) {
      this.board[from.row * 8 + to.col] = 0;
    }

    if (this.getPieceType(piece) === 'k') {
      var colDiff = to.col - from.col;
      if (colDiff === 2) {
        this.board[to.row * 8 + 5] = this.board[to.row * 8 + 7];
        this.board[to.row * 8 + 7] = 0;
      } else if (colDiff === -2) {
        this.board[to.row * 8 + 3] = this.board[to.row * 8 + 0];
        this.board[to.row * 8 + 0] = 0;
      }
    }

    this.board[toIdx] = piece;
    this.board[fromIdx] = 0;

    if (this.getPieceType(piece) === 'p' && (to.row === 0 || to.row === 7)) {
      var promo = uci.length > 4 ? uci[4] : 'q';
      var promoMap = { q: 4, r: 3, b: 2, n: 1 };
      var pieceCode = promoMap[promo] || 4;
      this.board[toIdx] = this.isWhite(piece) ? pieceCode + 1 : pieceCode + 7;
    }

    this.updateCastlingRights(piece, from);

    if (this.getPieceType(piece) === 'p' && Math.abs(to.row - from.row) === 2) {
      this.epSquare = { row: (from.row + to.row) / 2, col: from.col };
    } else {
      this.epSquare = null;
    }

    this.sideToMove = this.sideToMove === 'w' ? 'b' : 'w';
  }

  updateCastlingRights(piece, from) {
    var color = this.isWhite(piece) ? 'w' : 'b';
    if (this.getPieceType(piece) === 'k') {
      this.castling = this.castling.replace(new RegExp(
        color === 'w' ? '[KQ]' : '[kq]', 'g'
      ), '');
    }
    if (this.getPieceType(piece) === 'r') {
      if (from.row === 0 && from.col === 0) this.castling = this.castling.replace('q', '');
      if (from.row === 0 && from.col === 7) this.castling = this.castling.replace('k', '');
      if (from.row === 7 && from.col === 0) this.castling = this.castling.replace('Q', '');
      if (from.row === 7 && from.col === 7) this.castling = this.castling.replace('K', '');
    }
    if (this.castling === '') this.castling = '-';
  }

  isWhite(p) { return p <= 6; }
  getPieceType(p) { return GenEng.PIECE_NAMES[p]; }
  getColor(p) { return p <= 6 ? 'w' : 'b'; }

  inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  generateMoves() {
    var moves = [];
    var side = this.sideToMove === 'w';
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = this.board[r * 8 + c];
        if (p && this.isWhite(p) === side) {
          var type = this.getPieceType(p);
          switch (type) {
            case 'p': this.genPawnMoves(r, c, moves); break;
            case 'n': this.genKnightMoves(r, c, moves); break;
            case 'b': this.genSlidingMoves(r, c, [[-1,-1],[-1,1],[1,-1],[1,1]], moves); break;
            case 'r': this.genSlidingMoves(r, c, [[-1,0],[1,0],[0,-1],[0,1]], moves); break;
            case 'q': this.genSlidingMoves(r, c, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], moves); break;
            case 'k': this.genKingMoves(r, c, moves); break;
          }
        }
      }
    }
    return moves;
  }

  genPawnMoves(r, c, moves) {
    var dir = this.sideToMove === 'w' ? -1 : 1;
    var startRow = this.sideToMove === 'w' ? 6 : 1;
    var promoRow = this.sideToMove === 'w' ? 0 : 7;

    if (this.inBounds(r + dir, c) && !this.board[(r + dir) * 8 + c]) {
      this.addMove(r, c, r + dir, c, promoRow, moves);
      if (r === startRow && !this.board[(r + 2 * dir) * 8 + c]) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(r + 2 * dir, c));
      }
    }

    for (var dc = -1; dc <= 1; dc += 2) {
      var nr = r + dir, nc = c + dc;
      if (!this.inBounds(nr, nc)) continue;
      var target = this.board[nr * 8 + nc];
      if (target && this.isWhite(target) !== (this.sideToMove === 'w')) {
        this.addMove(r, c, nr, nc, promoRow, moves);
      }
      if (this.epSquare && this.epSquare.row === nr && this.epSquare.col === nc) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }
  }

  addMove(r, c, nr, nc, promoRow, moves) {
    var base = this.coordToUCI(r, c) + this.coordToUCI(nr, nc);
    if (nr === promoRow) {
      moves.push(base + 'q'); moves.push(base + 'r');
      moves.push(base + 'b'); moves.push(base + 'n');
    } else {
      moves.push(base);
    }
  }

  genKnightMoves(r, c, moves) {
    var offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (var i = 0; i < 8; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (!this.inBounds(nr, nc)) continue;
      var target = this.board[nr * 8 + nc];
      if (!target || this.isWhite(target) !== (this.sideToMove === 'w')) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }
  }

  genSlidingMoves(r, c, dirs, moves) {
    for (var d = 0; d < dirs.length; d++) {
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      while (this.inBounds(nr, nc)) {
        var target = this.board[nr * 8 + nc];
        if (!target) {
          moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
        } else {
          if (this.isWhite(target) !== (this.sideToMove === 'w')) {
            moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
          }
          break;
        }
        nr += dirs[d][0];
        nc += dirs[d][1];
      }
    }
  }

  genKingMoves(r, c, moves) {
    var offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (var i = 0; i < 8; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (!this.inBounds(nr, nc)) continue;
      var target = this.board[nr * 8 + nc];
      if (!target || this.isWhite(target) !== (this.sideToMove === 'w')) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }
    if (this.sideToMove === 'w' && r === 7 && c === 4) {
      if (GenEng.hasChar(this.castling, 'K') && !this.board[71] && !this.board[70]
          && this.board[63] === GenEng.W_ROOK) {
        moves.push('e1g1');
      }
      if (GenEng.hasChar(this.castling, 'Q') && !this.board[57] && !this.board[58] && !this.board[59]
          && this.board[56] === GenEng.W_ROOK) {
        moves.push('e1c1');
      }
    }
    if (this.sideToMove === 'b' && r === 0 && c === 4) {
      if (GenEng.hasChar(this.castling, 'k') && !this.board[5] && !this.board[6]
          && this.board[7] === GenEng.B_ROOK) {
        moves.push('e8g8');
      }
      if (GenEng.hasChar(this.castling, 'q') && !this.board[1] && !this.board[2] && !this.board[3]
          && this.board[0] === GenEng.B_ROOK) {
        moves.push('e8c8');
      }
    }
  }

  static hasChar(str, ch) { return str.indexOf(ch) !== -1; }

  isSquareAttacked(board, row, col, attackerColor) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = board[r * 8 + c];
        if (!p || this.isWhite(p) !== (attackerColor === 'w')) continue;
        var type = this.getPieceType(p);
        if (this.canAttack(board, type, r, c, row, col, p)) return true;
      }
    }
    return false;
  }

  canAttack(board, type, r, c, tr, tc, piece) {
    var dr = tr - r, dc = tc - c;
    var adr = dr < 0 ? -dr : dr, adc = dc < 0 ? -dc : dc;

    switch (type) {
      case 'p': {
        var dir = this.isWhite(piece) ? -1 : 1;
        return r + dir === tr && (c - 1 === tc || c + 1 === tc);
      }
      case 'n': return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
      case 'k': return adr <= 1 && adc <= 1;
      case 'b': return adr === adc && this.isClear(board, r, c, tr, tc);
      case 'r': return (r === tr || c === tc) && this.isClear(board, r, c, tr, tc);
      case 'q': return (adr === adc || r === tr || c === tc) && this.isClear(board, r, c, tr, tc);
    }
    return false;
  }

  isClear(board, r, c, tr, tc) {
    var dr = tr > r ? 1 : tr < r ? -1 : 0;
    var dc = tc > c ? 1 : tc < c ? -1 : 0;
    var nr = r + dr, nc = c + dc;
    while (nr !== tr || nc !== tc) {
      if (board[nr * 8 + nc]) return false;
      nr += dr;
      nc += dc;
    }
    return true;
  }

  isInCheck(state, side) {
    var kr = side === 'w' ? state.wKingRow : state.bKingRow;
    var kc = side === 'w' ? state.wKingCol : state.bKingCol;
    if (kr < 0 || kc < 0) return false;
    return this.isSquareAttacked(state.board, kr, kc, side === 'w' ? 'b' : 'w');
  }

  copyState(state) {
    return {
      board: new Uint8Array(state.board),
      sideToMove: state.sideToMove,
      castling: state.castling,
      epSquare: state.epSquare ? { row: state.epSquare.row, col: state.epSquare.col } : null,
      wKingRow: state.wKingRow, wKingCol: state.wKingCol,
      bKingRow: state.bKingRow, bKingCol: state.bKingCol
    };
  }

  applyMove(state, uci) {
    var newState = this.copyState(state);
    var from = this.parseSquare(uci.substring(0, 2));
    var to = this.parseSquare(uci.substring(2, 4));
    if (!from || !to) return newState;

    var fromIdx = from.row * 8 + from.col;
    var toIdx = to.row * 8 + to.col;
    var piece = newState.board[fromIdx];
    if (!piece) return newState;

    var pieceType = GenEng.PIECE_NAMES[piece];

    if (pieceType === 'p' && newState.epSquare &&
        to.row === newState.epSquare.row && to.col === newState.epSquare.col) {
      newState.board[from.row * 8 + to.col] = 0;
    }

    if (pieceType === 'k') {
      if (piece <= 6) {
        newState.wKingRow = to.row; newState.wKingCol = to.col;
      } else {
        newState.bKingRow = to.row; newState.bKingCol = to.col;
      }
      var colDiff = to.col - from.col;
      if (colDiff === 2) {
        newState.board[to.row * 8 + 5] = newState.board[to.row * 8 + 7];
        newState.board[to.row * 8 + 7] = 0;
      } else if (colDiff === -2) {
        newState.board[to.row * 8 + 3] = newState.board[to.row * 8 + 0];
        newState.board[to.row * 8 + 0] = 0;
      }
    }

    newState.board[toIdx] = piece;
    newState.board[fromIdx] = 0;

    if (pieceType === 'p' && (to.row === 0 || to.row === 7)) {
      var promo = uci.length > 4 ? uci[4] : 'q';
      var promoMap = { q: 4, r: 3, b: 2, n: 1 };
      var pieceCode = promoMap[promo] || 4;
      newState.board[toIdx] = (piece <= 6) ? pieceCode + 1 : pieceCode + 7;
    }

    var color = piece <= 6 ? 'w' : 'b';
    if (pieceType === 'k') {
      newState.castling = newState.castling.replace(new RegExp(color === 'w' ? '[KQ]' : '[kq]', 'g'), '');
    }
    if (pieceType === 'r') {
      if (from.row === 0 && from.col === 0) newState.castling = newState.castling.replace('q', '');
      if (from.row === 0 && from.col === 7) newState.castling = newState.castling.replace('k', '');
      if (from.row === 7 && from.col === 0) newState.castling = newState.castling.replace('Q', '');
      if (from.row === 7 && from.col === 7) newState.castling = newState.castling.replace('K', '');
    }
    if (newState.castling === '') newState.castling = '-';

    if (pieceType === 'p' && Math.abs(to.row - from.row) === 2) {
      newState.epSquare = { row: (from.row + to.row) / 2, col: from.col };
    } else {
      newState.epSquare = null;
    }

    newState.sideToMove = newState.sideToMove === 'w' ? 'b' : 'w';
    return newState;
  }

  genMovesFromState(state) {
    var side = state.sideToMove === 'w';
    var moves = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = state.board[r * 8 + c];
        if (!p || (p <= 6) !== side) continue;
        var type = GenEng.PIECE_NAMES[p];
        switch (type) {
          case 'p': this.genPawnMovesFrom(state, r, c, moves); break;
          case 'n': this.genKnightMovesFrom(state, r, c, moves); break;
          case 'b': this.genSlidingFrom(state, r, c, [[-1,-1],[-1,1],[1,-1],[1,1]], moves); break;
          case 'r': this.genSlidingFrom(state, r, c, [[-1,0],[1,0],[0,-1],[0,1]], moves); break;
          case 'q': this.genSlidingFrom(state, r, c, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], moves); break;
          case 'k': this.genKingMovesFrom(state, r, c, moves); break;
        }
      }
    }
    return moves;
  }

  genPawnMovesFrom(state, r, c, moves) {
    var isWhite = state.sideToMove === 'w';
    var dir = isWhite ? -1 : 1;
    var startRow = isWhite ? 6 : 1;
    var promoRow = isWhite ? 0 : 7;
    var b = state.board;

    if (this.inBounds(r + dir, c) && !b[(r + dir) * 8 + c]) {
      var base = this.coordToUCI(r, c) + this.coordToUCI(r + dir, c);
      if (r + dir === promoRow) {
        moves.push({ uci: base + 'q', score: 0, isCapture: false });
        moves.push({ uci: base + 'r', score: 0, isCapture: false });
        moves.push({ uci: base + 'b', score: 0, isCapture: false });
        moves.push({ uci: base + 'n', score: 0, isCapture: false });
      } else {
        moves.push({ uci: base, score: 0, isCapture: false });
      }
      if (r === startRow && !b[(r + 2 * dir) * 8 + c]) {
        moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(r + 2 * dir, c), score: 0, isCapture: false });
      }
    }

    for (var dc = -1; dc <= 1; dc += 2) {
      var nr = r + dir, nc = c + dc;
      if (!this.inBounds(nr, nc)) continue;
      var target = b[nr * 8 + nc];
      if (target && (target <= 6) !== isWhite) {
        var base = this.coordToUCI(r, c) + this.coordToUCI(nr, nc);
        if (nr === promoRow) {
          moves.push({ uci: base + 'q', score: GenEng.VALUES[target], isCapture: true });
          moves.push({ uci: base + 'r', score: GenEng.VALUES[target], isCapture: true });
          moves.push({ uci: base + 'b', score: GenEng.VALUES[target], isCapture: true });
          moves.push({ uci: base + 'n', score: GenEng.VALUES[target], isCapture: true });
        } else {
          moves.push({ uci: base, score: GenEng.VALUES[target], isCapture: true });
        }
      }
      if (state.epSquare && state.epSquare.row === nr && state.epSquare.col === nc) {
        moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(nr, nc), score: 100, isCapture: true });
      }
    }
  }

  genKnightMovesFrom(state, r, c, moves) {
    var isWhite = state.sideToMove === 'w';
    var b = state.board;
    var offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (var i = 0; i < 8; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (!this.inBounds(nr, nc)) continue;
      var target = b[nr * 8 + nc];
      if (!target || (target <= 6) !== isWhite) {
        moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(nr, nc), score: target ? GenEng.VALUES[target] : 0, isCapture: !!target });
      }
    }
  }

  genSlidingFrom(state, r, c, dirs, moves) {
    var isWhite = state.sideToMove === 'w';
    var b = state.board;
    for (var d = 0; d < dirs.length; d++) {
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      while (this.inBounds(nr, nc)) {
        var target = b[nr * 8 + nc];
        if (!target) {
          moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(nr, nc), score: 0, isCapture: false });
        } else {
          if ((target <= 6) !== isWhite) {
            moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(nr, nc), score: GenEng.VALUES[target], isCapture: true });
          }
          break;
        }
        nr += dirs[d][0];
        nc += dirs[d][1];
      }
    }
  }

  genKingMovesFrom(state, r, c, moves) {
    var isWhite = state.sideToMove === 'w';
    var b = state.board;
    var offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (var i = 0; i < 8; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (!this.inBounds(nr, nc)) continue;
      var target = b[nr * 8 + nc];
      if (!target || (target <= 6) !== isWhite) {
        moves.push({ uci: this.coordToUCI(r, c) + this.coordToUCI(nr, nc), score: target ? GenEng.VALUES[target] : 0, isCapture: !!target });
      }
    }
    if (state.sideToMove === 'w' && r === 7 && c === 4) {
      if (GenEng.hasChar(state.castling, 'K') && !b[71] && !b[70] && b[63] === GenEng.W_ROOK) {
        moves.push({ uci: 'e1g1', score: 0, isCapture: false });
      }
      if (GenEng.hasChar(state.castling, 'Q') && !b[57] && !b[58] && !b[59] && b[56] === GenEng.W_ROOK) {
        moves.push({ uci: 'e1c1', score: 0, isCapture: false });
      }
    }
    if (state.sideToMove === 'b' && r === 0 && c === 4) {
      if (GenEng.hasChar(state.castling, 'k') && !b[5] && !b[6] && b[7] === GenEng.B_ROOK) {
        moves.push({ uci: 'e8g8', score: 0, isCapture: false });
      }
      if (GenEng.hasChar(state.castling, 'q') && !b[1] && !b[2] && !b[3] && b[0] === GenEng.B_ROOK) {
        moves.push({ uci: 'e8c8', score: 0, isCapture: false });
      }
    }
  }

  orderMoves(moves) {
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      if (m.isCapture) {
        m.sortKey = 10000 + m.score;
      } else {
        var uci = m.uci;
        var toCol = GenEng.FILES.indexOf(uci[2]);
        var toRow = GenEng.RANKS.indexOf(uci[3]);
        var centerDist = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
        m.sortKey = Math.round(Math.max(0, 6 - centerDist) * 10);
      }
    }
    moves.sort(function(a, b) { return b.sortKey - a.sortKey; });
  }

  static PST_PAWN = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
  ];

  static PST_KNIGHT = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  static PST_BISHOP = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ];

  static PST_ROOK = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
  ];

  static PST_QUEEN = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ];

  static PST_KING = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
  ];

  static PST = [
    null,
    GenEng.PST_PAWN, GenEng.PST_KNIGHT, GenEng.PST_BISHOP,
    GenEng.PST_ROOK, GenEng.PST_QUEEN, GenEng.PST_KING
  ];

  evaluate(state) {
    var score = 0;
    var b = state.board;

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = b[r * 8 + c];
        if (!p) continue;

        var val = GenEng.VALUES[p];
        var pieceType = GenEng.PIECE_NAMES[p];
        var pstIdx = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 }[pieceType] || 0;
        var pst = GenEng.PST[pstIdx];

        if (p <= 6) {
          score += val;
          if (pst) score += pst[r * 8 + c];
        } else {
          score -= val;
          if (pst) score -= pst[(7 - r) * 8 + c];
        }
      }
    }

    return state.sideToMove === 'w' ? score : -score;
  }

  findBestMove(initialState, timeLimit, maxDepth) {
    var startTime = Date.now();
    var bestMove = null;

    for (var depth = 1; depth <= maxDepth; depth++) {
      if (this.nodeCount > 2000000 || this.stopRequested || Date.now() - startTime > timeLimit * 0.8) break;

      var state = this.copyState(initialState);
      var moves = this.genMovesFromState(state);
      this.orderMoves(moves);

      if (moves.length === 0) break;

      var alpha = -Infinity, beta = Infinity;
      var bestScore = -Infinity;
      var bestAtDepth = null;

      for (var i = 0; i < moves.length; i++) {
        if (this.stopRequested || Date.now() - startTime > timeLimit * 0.9) break;

        var child = this.applyMove(state, moves[i].uci);
        if (this.isInCheck(child, state.sideToMove)) continue;
        var score = -this.search(child, depth - 1, -beta, -alpha, startTime, timeLimit);

        if (score > bestScore) {
          bestScore = score;
          bestAtDepth = moves[i].uci;
        }
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
      }

      if (bestAtDepth) {
        bestMove = bestAtDepth;
      }
    }

    return bestMove;
  }

  search(state, depth, alpha, beta, startTime, timeLimit) {
    if (this.nodeCount > 2000000 || this.stopRequested) return 0;
    this.nodeCount++;
    if ((this.nodeCount & 255) === 0 && Date.now() - startTime > timeLimit) {
      this.stopRequested = true;
      return 0;
    }
    if (this.stopRequested) return 0;

    if (depth === 0) return this.quiesce(state, alpha, beta, startTime, timeLimit);

    var inCheck = this.isInCheck(state, state.sideToMove);

    if (inCheck) {
      depth++;
    }

    var moves = this.genMovesFromState(state);
    if (moves.length === 0) {
      if (inCheck) return -19999;
      return 0;
    }

    this.orderMoves(moves);

    var bestScore = -Infinity;

    for (var i = 0; i < moves.length; i++) {
      if (this.stopRequested) return 0;

      var child = this.applyMove(state, moves[i].uci);

      if (this.isInCheck(child, state.sideToMove)) {
        continue;
      }

      var score = -this.search(child, depth - 1, -beta, -alpha, startTime, timeLimit);

      if (score > bestScore) bestScore = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }

    if (bestScore === -Infinity) {
      if (inCheck) return -19999;
      return 0;
    }

    return bestScore;
  }

  quiesce(state, alpha, beta, startTime, timeLimit) {
    this.nodeCount++;
    if ((this.nodeCount & 1023) === 0 && Date.now() - startTime > timeLimit) {
      this.stopRequested = true;
      return 0;
    }
    if (this.stopRequested) return 0;

    var standPat = this.evaluate(state);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    var moves = this.genMovesFromState(state);
    var captures = [];
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].isCapture) captures.push(moves[i]);
    }

    if (captures.length === 0) return standPat;

    captures.sort(function(a, b) { return b.score - a.score; });

    for (var i = 0; i < captures.length; i++) {
      if (this.stopRequested) return 0;

      var child = this.applyMove(state, captures[i].uci);

      if (this.isInCheck(child, state.sideToMove)) continue;

      var score = -this.quiesce(child, -beta, -alpha, startTime, timeLimit);

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  render(g) {
  }
}
