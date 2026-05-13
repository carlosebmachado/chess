import React, { useState, useCallback } from 'react';
import Menu from './components/Menu.jsx';
import GameView from './components/GameView.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Game from './game/Game.js';

export default function App() {
  var [screen, setScreen] = useState('menu');
  var [options, setOptions] = useState(null);

  var handleStart = useCallback(function(opts) {
    setOptions(opts);
    setScreen('game');
  }, []);

  var handleBackToMenu = useCallback(function() {
    setScreen('menu');
    setOptions(null);
  }, []);

  Game.onBackToMenu = handleBackToMenu;

  return (
    <div id="container">
      {screen === 'game' && options && (
        <GameView options={options} onBackToMenu={handleBackToMenu} />
      )}
      <ConfirmDialog />
      {screen === 'menu' && <Menu onStart={handleStart} />}
    </div>
  );
}
