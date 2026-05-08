# Chess Game - Agent Guide

## Tech Stack
- **Language**: Vanilla JavaScript (ES6 classes)
- **Rendering**: HTML5 Canvas API
- **Entry point**: `src/index.html`
- **No framework, no bundler, no build step**

## Directory Structure
```
├── src/
│   ├── index.html           # Entry point
│   ├── style.css            # Layout styling
│   └── game/
│       ├── Game.js          # Main controller (Singleton)
│       ├── Board.js         # 8x8 grid, turn management
│       ├── Square.js        # Individual tile
│       ├── MoveList.js      # Move history
│       ├── Graphics.js      # Canvas 2D wrapper
│       ├── Utils.js         # Helpers
│       ├── pieces/          # Piece classes extending Piece
│       │   ├── Piece.js     # Base class
│       │   ├── Pawn.js
│       │   ├── Rook.js
│       │   ├── Knight.js
│       │   ├── Bishop.js
│       │   ├── Queen.js
│       │   └── King.js
│       ├── ceng/            # AI / engine
│       │   ├── Bot.js       # Random-move AI
│       │   └── CEngV0.js    # Engine placeholder
│       └── ui/
│           ├── HUD.js       # HUD overlay
│           └── TestAnimation.js
```

## Architecture & Conventions

### Singleton Pattern
`Game` uses a static Singleton (`Game.get()`). Access it from anywhere to get mouse state, canvas, etc.

### Game Loop
60 FPS via `setInterval`. Each tick calls `update(delta)` then `render(g)` on all objects.

### Component Hierarchy
`Game` → `Board` → `Square` → `Piece`
Each component owns its state and renders itself via `render(g)` where `g` is a `Graphics` instance.

### Coding Style
- ES6 classes, no modules/imports (all global via `<script>` tags)
- `var` for local variables (legacy convention in this codebase)
- `static` constants for enums (e.g. `Piece.WHITE`, `Piece.BLACK`)
- camelCase for methods and properties
- PascalCase for classes
- Arrow functions for event handlers (bound to instance via class fields)

### Naming
- Files: PascalCase matching the class name (e.g. `Game.js` → `class Game`)
- Assets: `{color}-{name}.png` (e.g. `white-pawn.png`, `black-king.png`)

## Key Patterns
- Pieces calculate `possibleMoves` in their `update()` override
- Movement uses drag-and-drop via mouse/touch events
- `addNormalMovement(row, col)` and `findContinuousMovements(rowDir, colDir)` are shared helpers in `Piece.js`
- Each piece implements `calcMoves()` for pure move computation (extracted from `update()` for simulation use)
- Turn switching: `board.nextTurn()`
- No castling, en passant, or pawn promotion implemented yet

## Game State & Check/Checkmate
- `Board.gameState`: `'normal'` | `'check'` | `'checkmate'` | `'stalemate'`
- `Board.gameOver`: boolean, set on checkmate/stalemate
- `Board.isInCheck(color)`: checks if king is in opponent's `underAttackSquares`
- `Board.isMoveLegal(piece, targetSquare)`: simulates a move and checks if own king stays safe
- `Board.hasLegalMoves(color)`: iterates all pieces' pseudo-legal moves and filters by legality
- Legal moves are enforced in `Piece.move()` — illegal moves are silently rejected
- Under-attack squares are correctly tracked for all squares including those blocked by same-color pieces
- Pawn diagonal attacks are always added to `underAttackSquares`, regardless of occupancy
- Kings compute moves after all attacks are populated (including the other king's attacks)

## Testing
No test framework is currently configured. If adding tests, put them in a `tests/` directory.
