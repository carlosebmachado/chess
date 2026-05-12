class Engine {
  constructor(board, color, engineType, engineLevel) {
    this.board = board;
    this.color = color;
    this.pendingBestMove = null;
    this.engineType = engineType || 'ceng';

    if (this.engineType === 'stockfish') {
      this.engine = new StockfishEngine(engineLevel);
      this.engine.setOutputCallback(this.onEngineOutput.bind(this));
      this.sendToEngine('uci');
      this.sendToEngine('isready');
    } else if (this.engineType === 'geneng') {
      this.worker = new Worker('/src/game/engines/GenEng-worker.js');
      this.worker.onmessage = function(e) {
        this.onEngineOutput(e.data);
      }.bind(this);
      this.worker.postMessage('uci');
      if (engineLevel) {
        this.worker.postMessage('setoption name Level value ' + engineLevel);
      }
      this.worker.postMessage('isready');
    } else {
      this.engine = new CEngV0();
      this.engine.setOutputCallback(this.onEngineOutput.bind(this));
      this.engine.handleUCI('uci');
      this.engine.handleUCI('isready');
    }
  }

  async sendToEngine(cmd) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    } else if (this.engine) {
      var result = this.engine.handleUCI(cmd);
      if (result && typeof result.then === 'function') {
        await result;
      }
    }
  }

  onEngineOutput(msg) {
    if (msg.startsWith('bestmove ')) {
      this.pendingBestMove = msg.substring(9).trim().split(/\s+/)[0];
    }
  }

  buildPositionCommand() {
    var moves = this.board.moveList.moves;
    if (moves.length === 0) return 'position startpos';

    var uciMoves = [];
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var uci = Board.CNAME[m.from.col] + Board.RNAME[m.from.row] +
                Board.CNAME[m.to.col] + Board.RNAME[m.to.row];
      if (m.promotion) {
        uci += m.promotion[0];
      }
      uciMoves.push(uci);
    }
    return 'position startpos moves ' + uciMoves.join(' ');
  }

  playUCIMove(uci) {
    var fromCol = Board.CNAME.indexOf(uci[0]);
    var fromRow = Board.RNAME.indexOf(uci[1]);
    var toCol = Board.CNAME.indexOf(uci[2]);
    var toRow = Board.RNAME.indexOf(uci[3]);
    if (fromCol === -1 || fromRow === -1 || toCol === -1 || toRow === -1) return false;

    var piece = this.board.squares[fromRow][fromCol].piece;
    if (!piece) return false;

    var target = this.board.squares[toRow][toCol];
    var currentTurn = this.board.turn;

    piece.move(target);

    return this.board.turn !== currentTurn;
  }

  async update(delta) {
    if (this.board.turn !== this.color) return;
    if (this.board.gameOver) return;
    if (this.board.isBotAttack) return;
    this.board.isBotAttack = true;

    await sleep(randInt(400, 800));

    this.board.recomputeAttacks();

    var posCmd = this.buildPositionCommand();
    await this.sendToEngine(posCmd);

    var maxAttempts = 200;
    var movePlayed = false;

    for (var attempt = 0; attempt < maxAttempts && !movePlayed; attempt++) {
      if (this.board.gameOver) break;

      this.pendingBestMove = null;
      this.sendToEngine(this.worker || this.engineType === 'stockfish' ? 'go movetime 2000' : 'go');

      while (this.pendingBestMove === null) {
        await sleep(10);
      }

      if (this.pendingBestMove === '0000') break;

      movePlayed = this.playUCIMove(this.pendingBestMove);
    }

    this.board.recomputeAttacks();
    this.board.isBotAttack = false;
  }

  render(g) {
  }
}
