class CEngV0 {
  constructor() {
    this.squares = [];
    this.sideToMove = 'w';
    this.castling = '-';
    this.epSquare = null;
    this.outputCallback = null;

    this.FILES = 'abcdefgh';
    this.RANKS = '87654321';

    this.resetToStartpos();
  }

  setOutputCallback(cb) {
    this.outputCallback = cb;
  }

  send(msg) {
    if (this.outputCallback) this.outputCallback(msg);
  }

  handleUCI(cmd) {
    var parts = cmd.trim().split(/\s+/);
    if (parts.length === 0) return;

    switch (parts[0]) {
      case 'uci': this.cmdUci(); break;
      case 'isready': this.cmdIsready(); break;
      case 'ucinewgame': this.cmdUcinewgame(); break;
      case 'position': this.cmdPosition(parts.slice(1)); break;
      case 'go': this.cmdGo(); break;
      case 'stop': this.cmdStop(); break;
      case 'quit': this.cmdQuit(); break;
    }
  }

  cmdUci() {
    this.send('id name CEngV0');
    this.send('id author CEngV0');
    this.send('uciok');
  }

  cmdIsready() {
    this.send('readyok');
  }

  cmdUcinewgame() {
    this.resetToStartpos();
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

  cmdGo() {
    var moves = this.generateMoves();
    if (moves.length > 0) {
      var move = moves[Math.floor(Math.random() * moves.length)];
      this.send('bestmove ' + move);
    } else {
      this.send('bestmove 0000');
    }
  }

  cmdStop() {
  }

  cmdQuit() {
  }

  resetToStartpos() {
    this.parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  parseFEN(fen) {
    this.squares = [];
    var parts = fen.split(' ');
    var rows = parts[0].split('/');

    for (var r = 0; r < 8; r++) {
      this.squares[r] = [];
      var col = 0;
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        if (ch >= '1' && ch <= '8') {
          var empty = parseInt(ch, 10);
          for (var e = 0; e < empty; e++) {
            this.squares[r][col++] = null;
          }
        } else {
          var isWhite = ch === ch.toUpperCase();
          this.squares[r][col++] = {
            type: ch.toLowerCase(),
            color: isWhite ? 'w' : 'b'
          };
        }
      }
    }

    this.sideToMove = parts[1] || 'w';
    this.castling = parts[2] || '-';
    this.epSquare = parts[3] && parts[3] !== '-' ? this.uciToSquare(parts[3]) : null;
  }

  applyUCIMove(uci) {
    var from = this.uciToSquare(uci.substring(0, 2));
    var to = this.uciToSquare(uci.substring(2, 4));
    if (!from || !to) return;

    var piece = this.squares[from.row][from.col];
    if (!piece) return;

    if (piece.type === 'p' && this.epSquare &&
        to.row === this.epSquare.row && to.col === this.epSquare.col) {
      this.squares[from.row][to.col] = null;
    }

    if (piece.type === 'k') {
      var colDiff = to.col - from.col;
      if (colDiff === 2) {
        this.squares[to.row][5] = this.squares[to.row][7];
        this.squares[to.row][7] = null;
      } else if (colDiff === -2) {
        this.squares[to.row][3] = this.squares[to.row][0];
        this.squares[to.row][0] = null;
      }
    }

    this.squares[to.row][to.col] = piece;
    this.squares[from.row][from.col] = null;

    if (piece.type === 'p' && (to.row === 0 || to.row === 7)) {
      var promo = uci.length > 4 ? uci[4] : 'q';
      piece.type = promo;
    }

    if (piece.type === 'k') {
      this.castling = this.castling.replace(new RegExp(
        (piece.color === 'w' ? 'KQ' : 'kq').split('').join('|'), 'g'
      ), '');
    }
    if (piece.type === 'r') {
      if (from.row === 0 && from.col === 0) this.castling = this.castling.replace('q', '');
      if (from.row === 0 && from.col === 7) this.castling = this.castling.replace('k', '');
      if (from.row === 7 && from.col === 0) this.castling = this.castling.replace('Q', '');
      if (from.row === 7 && from.col === 7) this.castling = this.castling.replace('K', '');
    }
    if (this.castling === '') this.castling = '-';

    if (piece.type === 'p' && Math.abs(to.row - from.row) === 2) {
      this.epSquare = { row: (from.row + to.row) / 2, col: from.col };
    } else {
      this.epSquare = null;
    }

    this.sideToMove = this.sideToMove === 'w' ? 'b' : 'w';
  }

  generateMoves() {
    var moves = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = this.squares[r][c];
        if (p && p.color === this.sideToMove) {
          switch (p.type) {
            case 'p': this.addPawnMoves(r, c, moves); break;
            case 'n': this.addKnightMoves(r, c, moves); break;
            case 'b': this.addSlidingMoves(r, c, [[-1,-1],[-1,1],[1,-1],[1,1]], moves); break;
            case 'r': this.addSlidingMoves(r, c, [[-1,0],[1,0],[0,-1],[0,1]], moves); break;
            case 'q': this.addSlidingMoves(r, c, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], moves); break;
            case 'k': this.addKingMoves(r, c, moves); break;
          }
        }
      }
    }
    return moves;
  }

  addPawnMoves(r, c, moves) {
    var dir = this.sideToMove === 'w' ? -1 : 1;
    var startRow = this.sideToMove === 'w' ? 6 : 1;
    var promoRow = this.sideToMove === 'w' ? 0 : 7;

    var nr = r + dir;
    if (nr >= 0 && nr < 8 && !this.squares[nr][c]) {
      this.addPromoMove(r, c, nr, c, promoRow, moves);
      if (r === startRow) {
        var nr2 = r + 2 * dir;
        if (!this.squares[nr2][c]) {
          moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr2, c));
        }
      }
    }

    for (var dc = -1; dc <= 1; dc += 2) {
      var nc = c + dc;
      if (nc < 0 || nc >= 8 || nr < 0 || nr >= 8) continue;
      if (this.squares[nr][nc] && this.squares[nr][nc].color !== this.sideToMove) {
        this.addPromoMove(r, c, nr, nc, promoRow, moves);
      }
      if (this.epSquare && this.epSquare.row === nr && this.epSquare.col === nc) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }
  }

  addPromoMove(r, c, nr, nc, promoRow, moves) {
    var base = this.coordToUCI(r, c) + this.coordToUCI(nr, nc);
    if (nr === promoRow) {
      moves.push(base + 'q');
      moves.push(base + 'r');
      moves.push(base + 'b');
      moves.push(base + 'n');
    } else {
      moves.push(base);
    }
  }

  addKnightMoves(r, c, moves) {
    var offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (var i = 0; i < offsets.length; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 &&
          (!this.squares[nr][nc] || this.squares[nr][nc].color !== this.sideToMove)) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }
  }

  addSlidingMoves(r, c, dirs, moves) {
    for (var d = 0; d < dirs.length; d++) {
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (!this.squares[nr][nc]) {
          moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
        } else {
          if (this.squares[nr][nc].color !== this.sideToMove) {
            moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
          }
          break;
        }
        nr += dirs[d][0];
        nc += dirs[d][1];
      }
    }
  }

  addKingMoves(r, c, moves) {
    var offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (var i = 0; i < offsets.length; i++) {
      var nr = r + offsets[i][0], nc = c + offsets[i][1];
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 &&
          (!this.squares[nr][nc] || this.squares[nr][nc].color !== this.sideToMove)) {
        moves.push(this.coordToUCI(r, c) + this.coordToUCI(nr, nc));
      }
    }

    if (this.sideToMove === 'w' && r === 7 && c === 4) {
      if (this.castling.indexOf('K') !== -1 &&
          !this.squares[7][5] && !this.squares[7][6] &&
          this.squares[7][7] && this.squares[7][7].type === 'r' && this.squares[7][7].color === 'w') {
        moves.push('e1g1');
      }
      if (this.castling.indexOf('Q') !== -1 &&
          !this.squares[7][1] && !this.squares[7][2] && !this.squares[7][3] &&
          this.squares[7][0] && this.squares[7][0].type === 'r' && this.squares[7][0].color === 'w') {
        moves.push('e1c1');
      }
    }
    if (this.sideToMove === 'b' && r === 0 && c === 4) {
      if (this.castling.indexOf('k') !== -1 &&
          !this.squares[0][5] && !this.squares[0][6] &&
          this.squares[0][7] && this.squares[0][7].type === 'r' && this.squares[0][7].color === 'b') {
        moves.push('e8g8');
      }
      if (this.castling.indexOf('q') !== -1 &&
          !this.squares[0][1] && !this.squares[0][2] && !this.squares[0][3] &&
          this.squares[0][0] && this.squares[0][0].type === 'r' && this.squares[0][0].color === 'b') {
        moves.push('e8c8');
      }
    }
  }

  coordToUCI(row, col) {
    return this.FILES[col] + this.RANKS[row];
  }

  uciToSquare(uci) {
    var col = this.FILES.indexOf(uci[0]);
    var row = this.RANKS.indexOf(uci[1]);
    if (col === -1 || row === -1) return null;
    return { row: row, col: col };
  }

}
