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
    // bot
    g.rect(this.x, this.y, this.width, playerH, 'rgba(0, 0, 0, 0.5)');
    // player
    var playerY = this.y + playerH * 5;
    g.rect(this.x, this.y + playerY, this.width, playerH, 'rgba(0, 0, 0, 0.5)');

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
      g.drawText(printLines[i], this.x + 10, listY + tPad * (i+2), font, color);
    }

    // g.ctx.font = "48px serif";
    // g.ctx.fillStyle = "black";
    // g.ctx.fillText("Hello world", this.x, listY);
  }
}