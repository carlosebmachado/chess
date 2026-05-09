# TODO

- [X] Implement pawn promotion
- [X] Fix: Board.totalSize is NaN – Math.pow(this.size) on line 45 needs a second arg (Math.pow(8, 2) or just 8*8). Harmless since it's unused, but worth cleaning up.
- [ ] Fix: MoveList notation is reversed – MoveList.toString() at line 64 prints RNME[row] + CNAME[col] producing "4e" instead of "e4".
- [ ] Implement draw detection – threefold repetition, fifty-move rule, insufficient material are all missing.
- [ ] Implement undo move – common QoL feature for both single and two-player.
- [ ] Fix: king vs king possible squares to move, it's highlighting the square being attacked by the opposite king and even letting to move to some of these squares where the kings stay face to face.
- [ ] Add flag to enable/disable debug interface items
- [ ] Move to a React.js project
- [ ] Improve movement list (add the possibility to scroll it, maybe even bring it to html?) and the general interface
- [ ] Improve the bot engine (learn about chess engine patterns)
