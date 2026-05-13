import React, { useRef, useEffect } from 'react';
import Game from '../game/Game.js';

export default function GameView({ options, onBackToMenu }) {
  var canvasRef = useRef(null);

  useEffect(function() {
    var canvas = canvasRef.current;
    var game = Game.get();
    game.start(canvas, Game.HORIZONTAL_ORIENTATION, options);
    game.run();

    return function() {
      game.stop();
      Game.instance = null;
    };
  }, []);

  function handlePrevMove() {
    var game = Game.get();
    if (game.board) game.board.undoLastMove();
  }

  function handleNextMove() {
    var game = Game.get();
    if (game.board) game.board.redoNextMove();
  }

  function handleBackToMenu() {
    Game.get().backToMenu();
  }

  return (
    <>
      <canvas ref={canvasRef} id="game-canvas"></canvas>
      <div id="sidebar">
        <div id="top-panel" className="player-panel">
          <span className="player-dot"></span>
          <span id="top-label">Black</span>
        </div>
        <div id="top-captured" className="captured-pieces"></div>
        <div id="move-list-container">
          <div id="move-list-header"><span>White</span><span>Black</span></div>
          <div id="move-list"></div>
        </div>
        <div id="game-state"></div>
        <div id="nav-buttons">
          <button id="prev-move-btn" onClick={handlePrevMove}>&#9664;</button>
          <button id="next-move-btn" onClick={handleNextMove}>&#9654;</button>
        </div>
        <div id="bottom-panel" className="player-panel">
          <span className="player-dot"></span>
          <span id="bottom-label">White</span>
        </div>
        <div id="bottom-captured" className="captured-pieces"></div>
        <button id="back-to-menu-btn" onClick={handleBackToMenu}>Back to Menu</button>
      </div>
    </>
  );
}
