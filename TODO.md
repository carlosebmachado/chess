# TODO

- [X] Implement pawn promotion
- [X] Fix: Board.totalSize is NaN – Math.pow(this.size) on line 45 needs a second arg (Math.pow(8, 2) or just 8*8). Harmless since it's unused, but worth cleaning up.
- [X] Fix: MoveList notation is reversed – MoveList.toString() at line 64 prints RNME[row] + CNAME[col] producing "4e" instead of "e4".
- [X] Implement draw detection – threefold repetition, fifty-move rule, insufficient material are all missing.
- [X] Fix: king vs king possible squares to move, it's highlighting the square being attacked by the opposite king and even letting to move to some of these squares where the kings ends staying face to face.
- [X] Add flag to enable/disable debug interface items
- [X] QoL:
  - [X] Improve movement list (add the possibility to scroll it, or maybe even bring it to HTML?). Also, improve the general interface of movement list and start interface, make it more readable and beautiful.
  - [X] Adds numbers to left squares and letter to botton squares.
  - [X] Implement undo move.
  - [X] Add last move highlight, highlighting the from/to squares with a complete square overlay in a light transtarent color
  - [X] Add current square hover highlight, a border circulating the square
  - [X] Beyoud drag and release piece movement, also adds the possibility of click in the piece to move, piece which will become highlighted and show the possible movements and also let to click at the possible square to move there
  - [X] Adds the possibility to highlight/unhighlight the square by clicking at it with right mouse button
  - [X] Make the board be resizable
  - [ ] Adds arrow
  - [ ] Change the piece to capture highlight to a circle
