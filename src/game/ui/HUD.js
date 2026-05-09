class HUD {
  constructor(board) {
    var boardSize = board.size * board.squareSize;
    this.x = boardSize;
    this.y = 0;
    this.width = Game.get().g.getWidth() - boardSize;
    this.height = boardSize;
    this.board = board;
  }

  update(delta) {

  }

  render(g) {
    // background
    g.rect(this.x, this.y, this.width, this.height, 'rgba(0, 0, 0, 0.5)');

    // players
    var playerH = this.height / 6;
    // top panel (black or bot)
    g.rect(this.x, this.y, this.width, playerH, 'rgba(0, 0, 0, 0.5)');
    var topLabel = this.board.bot ? 'Bot (Black)' : 'Black';
    var topFont = '16px monospace';
    g.drawText(topLabel, this.x + 10, this.y + playerH / 2 + 5, topFont, '#aaa');

    // bottom panel (white or player)
    var playerY = this.y + playerH * 5;
    g.rect(this.x, this.y + playerY, this.width, playerH, 'rgba(0, 0, 0, 0.5)');
    var bottomLabel = this.board.isTwoPlayer ? 'White' : 'Player (White)';
    g.drawText(bottomLabel, this.x + 10, playerY + playerH / 2 + 5, topFont, '#aaa');

    // move list
    var listY = this.y + playerH;
    g.rect(this.x, listY, this.width, listY * 4, 'rgba(100, 0, 0, 0.5)');
    var titleText = '  White   Black';
    var lines = this.board.moveList.toString().split('\n');
    var spaceCount = parseInt(this.board.moveList.length / 2).toString().length + titleText.length;
    var printLines = lines.slice(-15);
    var font = '15px monospace';
    var color = 'white';
    var tPad = 25;
    g.drawText(titleText.padStart(spaceCount, ' '), this.x + 10, listY + tPad, font, color);
    for (let i = 0; i < printLines.length; ++i) {
      g.drawText(printLines[i], this.x + 10, listY + tPad * (i + 2), font, color);
    }

    // game state
    if (this.board.gameState !== 'normal') {
      var stateFont = '20px monospace';
      var stateY = playerY + playerH / 2;
      var stateText = '';
      if (this.board.gameState === 'check') {
        stateText = 'Check!';
        g.drawText(stateText, this.x + 10, stateY, stateFont, 'yellow');
      } else if (this.board.gameState === 'checkmate') {
        stateText = 'Checkmate!';
        g.drawText(stateText, this.x + 10, stateY, stateFont, 'red');
      } else if (this.board.gameState === 'stalemate') {
        stateText = 'Stalemate!';
        g.drawText(stateText, this.x + 10, stateY, stateFont, 'gray');
      } else if (this.board.gameState === 'draw') {
        stateText = 'Draw!';
        g.drawText(stateText, this.x + 10, stateY, stateFont, 'gray');
        g.drawText(`(${this.board.drawReason})`, this.x + 10, stateY + 22, '12px monospace', 'gray');
      }
    }
  }
}