# CEngV0 — Architecture Guide

## Overview

CEngV0 is a minimal UCI-compliant chess engine. It understands the UCI text protocol
but picks moves at random — no evaluation or search logic. It's the starting point
for building a smarter engine (CEngV1, CEngV2, ...).

## Board Representation

```
this.squares — 2D array, 8 rows × 8 cols
  squares[r][c] === null                     (empty square)
  squares[r][c] === { type, color }          (piece)
```

| Coordinate | Meaning       |
|------------|---------------|
| r = 0      | rank 8 (top)  |
| r = 7      | rank 1 (bottom) |
| c = 0      | file a (left) |
| c = 7      | file h (right) |

### Piece objects

```js
{ type: 'p', color: 'w' }   // white pawn
{ type: 'k', color: 'b' }   // black king
```

`type` is one of: `p`, `n`, `b`, `r`, `q`, `k`.
`color` is `'w'` or `'b'`.

### State fields

| Field            | Type                  | Example         |
|------------------|-----------------------|-----------------|
| `this.squares`   | `Array[8][8]`         | piece or null   |
| `this.sideToMove`| `'w'` or `'b'`        | `'w'`           |
| `this.castling`  | string                | `'KQkq'`, `'-'` |
| `this.epSquare`  | `{row,col}` or `null` | `{row:2,col:3}` |

## UCI Protocol Flow

```
Engine.js ──► CEngV0.handleUCI(command)
                  │
                  ├─ "uci"          → send("id name CEngV0") then send("uciok")
                  ├─ "isready"      → send("readyok")
                  ├─ "ucinewgame"   → resetToStartpos()
                  ├─ "position ..." → parse FEN, apply moves
                  ├─ "go"           → generateMoves(), pick random, send("bestmove ...")
                  ├─ "stop"         → no-op
                  └─ "quit"         → no-op
```

### position command

`position [startpos | fen <FEN>] [moves <moves...>]`

1. Reset board to startpos or parse the given FEN
2. Apply any move list on top (e.g. `e2e4 e7e5`)

### go command

Called by `cmdGo()`:
1. Call `generateMoves()` → gets array of UCI strings
2. Pick one at random
3. Send `"bestmove <uci>"` (or `"bestmove 0000"` if no moves)

## Move Generation

`generateMoves()` loops all 64 squares. For each piece matching `sideToMove`, it
dispatches to the appropriate helper:

| Piece | Helper             | Logic |
|-------|--------------------|-------|
| `p`   | `addPawnMoves`     | Single/double advance, diagonal capture, en passant, promotion |
| `n`   | `addKnightMoves`   | 8 L-shaped offsets, skip if blocked by own piece |
| `b`   | `addSlidingMoves`  | 4 diagonal directions, slide until blocked |
| `r`   | `addSlidingMoves`  | 4 orthogonal directions, slide until blocked |
| `q`   | `addSlidingMoves`  | All 8 directions (diag + ortho) |
| `k`   | `addKingMoves`     | 1 square any direction + castling |

All moves are **pseudo-legal**: no check/self-check validation. The generated
moves are plain UCI strings like `"e2e4"`, `"e7e8q"`, `"e1g1"`.

## Coordinate Helpers

```js
coordToUCI(row, col) → "e2", "d5", etc.
uciToSquare("e2")    → { row: 6, col: 4 }
```

Row/col mapping uses:
- `this.FILES = 'abcdefgh'` → col index
- `this.RANKS = '87654321'` → row index

## Reading Board State (for CEngV1)

### Iterate all squares

```js
for (var r = 0; r < 8; r++) {
  for (var c = 0; c < 8; c++) {
    var p = this.squares[r][c];
    if (p) {
      // p.type, p.color
    }
  }
}
```

### Find king position

```js
var kingRow, kingCol;
for (var r = 0; r < 8; r++) {
  for (var c = 0; c < 8; c++) {
    var p = this.squares[r][c];
    if (p && p.type === 'k' && p.color === this.sideToMove) {
      kingRow = r; kingCol = c;
    }
  }
}
```

### Count material

```js
var values = { p: 100, n: 320, b: 330, r: 500, q: 900 };
var score = 0;
for (var r = 0; r < 8; r++) {
  for (var c = 0; c < 8; c++) {
    var p = this.squares[r][c];
    if (p) {
      score += p.color === 'w' ? values[p.type] || 0 : -(values[p.type] || 0);
    }
  }
}
// positive = white ahead, negative = black ahead
```

### Detect check (simple)

```js
function isSquareAttacked(board, row, col, byColor) {
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      var p = board[r][c];
      if (!p || p.color !== byColor) continue;
      // check if piece at (r,c) can reach (row,col)
      // see addPawnMoves / addKnightMoves / etc logic
    }
  }
}

function isInCheck(board, color) {
  // find king of `color`, then isSquareAttacked(board, kingRow, kingCol, opposite)
}
```

## Creating CEngV1

1. Copy `CEngV0.js` → `CEngV1.js`
2. Rename class `CEngV0` → `CEngV1`
3. Replace `cmdGo()` with your own logic
4. Add `<script src="/src/game/ceng/CEngV1.js">` in `index.html` (before `Engine.js`)
5. Add `'cengv1'` to the engine options in the HTML menu and in `Board.js` where `Engine` is constructed

Your `cmdGo()` will typically:
1. Call `this.generateMoves()` to get candidate moves
2. Score each move using evaluation heuristics
3. Pick the highest-scoring move
4. Call `this.send('bestmove ' + move)`
