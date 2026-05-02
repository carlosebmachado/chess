# Chess Project Documentation

This document provides a comprehensive overview of the Chess game project, its architecture, and core logic.

## 1. Project Overview
The project is a web-based Chess game implemented in Vanilla JavaScript using the HTML5 Canvas API. It features a complete implementation of chess pieces, move validation, turn management, and a basic AI opponent.

## 2. Architecture

### 2.1 Game Loop and Singleton Pattern
The application is centered around the `Game` class (`src/game/Game.js`), which implements the Singleton pattern. It manages:
- **Game Loop**: A 60 FPS loop using `setInterval` that triggers `update` and `render` phases.
- **Resource Management**: Loading and initializing core components.
- **Input Handling**: Centralized event listeners for mouse and touch interactions.

### 2.2 Component-Based Structure
The game follows a hierarchical component structure where each object is responsible for its own state and rendering:
- `Game` -> `Board` -> `Square` -> `Piece`
- `Game` -> `HUD`
- `Game` -> `TestAnimation`

## 3. Core Components

### 3.1 Board (`src/game/Board.js`)
The `Board` class represents the 8x8 chess grid.
- **State**: Manages the turn (`WHITE`/`BLACK`), capture pieces, and the move history (`MoveList`).
- **Initialization**: Sets up the initial piece positions based on the player's chosen color.
- **Attack Tracking**: Maintains `underAttackSquares` to keep track of which squares are threatened by each side.

### 3.2 Square (`src/game/Square.js`)
Represents a single tile on the board.
- Holds a reference to the `Piece` currently occupying it.
- Handles highlighting (e.g., when a piece can move to it).

### 3.3 Pieces (`src/game/pieces/`)
The project uses an inheritance-based model for chess pieces:
- **`Piece.js`**: Base class containing shared logic for dragging pieces, finding the current square, and executing moves.
- **Specific Piece Classes**: `Pawn`, `Rook`, `Knight`, `Bishop`, `Queen`, `King` extend `Piece` and override the `update` method to calculate their specific `possibleMoves`.

## 4. Game Logic

### 4.1 Movement and Validation
Movement is handled through a combination of dragging and clicking:
1. When a piece is grabbed, it calculates its `possibleMoves`.
2. As long as it's held, valid target squares are highlighted.
3. Upon release, if the piece is over a valid square, the `move()` method is called.
4. The `move()` method updates the board state, records the move in `MoveList`, and switches the turn.

*Note: Advanced chess rules such as castling, en passant, and pawn promotion are currently not implemented in the movement logic.*

### 4.2 AI / Bot (`src/game/ceng/`)
The project includes a basic AI opponent:
- **`Bot.js`**: Currently implements a simple random-move strategy. It identifies all available pieces for its color and picks a random valid move.
- **`CEngV0.js`**: A placeholder for a more advanced chess engine (Chess Engine Version 0).

## 5. UI and Rendering

### 5.1 Graphics Wrapper (`src/game/Graphics.js`)
A utility class that wraps the Canvas 2D context, providing cleaner methods for drawing shapes, images, and clearing the screen.

### 5.2 HUD (`src/game/ui/HUD.js`)
The Heads-Up Display provides visual feedback on the current game state, such as turn indicators and captured pieces.

## 6. Directory Structure
```text
/
├── src/
│   ├── game/
│   │   ├── pieces/      # Individual piece logic
│   │   ├── ceng/        # AI and engine logic
│   │   ├── ui/          # UI components (HUD)
│   │   ├── assets/      # Piece images and sprites
│   │   ├── Game.js      # Main game controller
│   │   ├── Board.js     # Board state and management
│   │   └── ...          # Utility and helper classes
│   ├── index.html       # Entry point
│   └── style.css        # Layout styling
└── docs/                # Project documentation
```
