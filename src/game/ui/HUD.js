class HUD {
  constructor(board) {
    this.board = board;
    this.topLabel = document.getElementById('top-label');
    this.bottomLabel = document.getElementById('bottom-label');
    this.topPanel = document.getElementById('top-panel');
    this.bottomPanel = document.getElementById('bottom-panel');
    this.moveListEl = document.getElementById('move-list');
    this.gameStateEl = document.getElementById('game-state');
  }

  update(delta) {
    var turnIsWhite = this.board.turn === Piece.WHITE;
    var playerIsWhite = this.board.playerColor === Piece.WHITE;

    if (this.board.bot) {
      this.topLabel.textContent = 'Bot';
      this.bottomLabel.textContent = playerIsWhite ? 'White' : 'Black';
    } else {
      this.topLabel.textContent = playerIsWhite ? 'Black' : 'White';
      this.bottomLabel.textContent = playerIsWhite ? 'White' : 'Black';
    }

    this.topPanel.classList.toggle('active', !turnIsWhite);
    this.bottomPanel.classList.toggle('active', turnIsWhite);

    var moves = this.board.moveList;
    var html = '';
    var lineCount = 1;
    for (let i = 0; i < moves.length; i += 2) {
      var whiteText = this.formatMove(moves.get(i));
      var blackText = i + 1 < moves.length ? this.formatMove(moves.get(i + 1)) : '';

      html += '<div class="move-row">' +
        '<span class="move-num">' + lineCount + '.</span>' +
        '<span class="move-white">' + this.escapeHtml(whiteText) + '</span>' +
        '<span class="move-black">' + this.escapeHtml(blackText) + '</span>' +
        '</div>';
      lineCount++;
    }
    this.moveListEl.innerHTML = html;
    this.moveListEl.scrollTop = this.moveListEl.scrollHeight;

    if (this.board.gameState === 'check') {
      this.gameStateEl.textContent = 'Check!';
      this.gameStateEl.style.color = '#f0d060';
    } else if (this.board.gameState === 'checkmate') {
      this.gameStateEl.textContent = 'Checkmate!';
      this.gameStateEl.style.color = '#e06060';
    } else if (this.board.gameState === 'stalemate') {
      this.gameStateEl.textContent = 'Stalemate!';
      this.gameStateEl.style.color = '#909090';
    } else if (this.board.gameState === 'draw') {
      this.gameStateEl.textContent = 'Draw! (' + this.board.drawReason + ')';
      this.gameStateEl.style.color = '#909090';
    } else {
      this.gameStateEl.textContent = '';
    }
  }

  formatMove(move) {
    if (!move) return '';

    var isCastling = move.piece.name === 'king' && Math.abs(move.to.col - move.from.col) === 2;
    if (isCastling) {
      return move.to.col > move.from.col ? 'O-O' : 'O-O-O';
    }

    var piece = move.piece.name === 'pawn' ? '' : MoveList.PIECES[move.piece.color[0]][move.piece.name[0]];
    var to = Board.CNAME[move.to.col] + Board.RNAME[move.to.row];
    var promo = move.promotion ? '=' + move.promotion[0].toUpperCase() : '';
    return piece + (move.take ? 'x' : '') + to + promo;
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  render(g) {
  }
}
