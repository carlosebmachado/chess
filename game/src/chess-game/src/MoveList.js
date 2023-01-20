class MoveList {
  static PIECES = {
    w: {
      p: '♙',
      r: '♖',
      n: '♘',
      b: '♗',
      q: '♕',
      k: '♔'
    },
    b: {
      p: '♟',
      r: '♜',
      n: '♞',
      b: '♝',
      q: '♛',
      k: '♚'
    }
  }

  constructor() {
    this.moves = [];
  }

  add(move) {
    this.moves.push(move);
  }

  get(index) {
    return this.moves[index];
  }

  get length() {
    return this.moves.length;
  }

  get last() {
    return this.moves[this.moves.length - 1];
  }

  get first() {
    return this.moves[0];
  }

  get isEmpty() {
    return this.moves.length === 0;
  }

  clear() {
    this.moves = [];
  }

  toString() {
    var str = '';
    var lineCount = 1;
    for (let i = 0; i < this.moves.length; ++i) {
      var move = this.moves[i];

      // console.log(move);

      var piece = MoveList.PIECES[move.piece.color[0]][move.piece.name[0]];
      var to = Board.RNAME[move.to.row] + Board.CNAME[move.to.col];

      var moveText = `${piece}${move.take ? 'x' : ''}${to}`;
      if (i % 2 === 0) {
        str += `${lineCount}.\t\t${moveText}\t\t\t\t`;
        lineCount++;
      } else {
        str += `${moveText}\n`;
      }
    }

    // console.log(str);
    if (str[str.length - 1] !== '\n') {
      str += '\n';
    }

    return str;
  }
}