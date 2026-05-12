class Engine {
  constructor(board, color, engineType) {
    this.board = board;
    this.color = color;
    this.pendingBestMove = null;

    if (engineType === 'stockfish') {
      this.engineType = 'stockfish';
    } else {
      this.engineType = 'ceng';
      this.engine = new CEngV0();
      this.engine.setOutputCallback(this.onEngineOutput.bind(this));
      this.engine.handleUCI('uci');
      this.engine.handleUCI('isready');
    }
  }

  onEngineOutput(msg) {
    if (msg.startsWith('bestmove ')) {
      this.pendingBestMove = msg.substring(9).trim();
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

    await sleep(randInt(800, 1200));

    this.board.recomputeAttacks();

    var posCmd = this.buildPositionCommand();
    if (this.engineType === 'ceng') {
      this.engine.handleUCI(posCmd);
    }

    var maxAttempts = 200;
    var movePlayed = false;

    for (var attempt = 0; attempt < maxAttempts && !movePlayed; attempt++) {
      if (this.board.gameOver) break;

      this.pendingBestMove = null;

      if (this.engineType === 'ceng') {
        this.engine.handleUCI('go');
      }

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
