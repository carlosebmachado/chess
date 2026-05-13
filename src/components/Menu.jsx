import React, { useState, useEffect } from 'react';

export default function Menu({ onStart }) {
  var [mode, setMode] = useState('bot');
  var [playerColor, setPlayerColor] = useState('white');
  var [engineType, setEngineType] = useState('ceng');
  var [engineLevel, setEngineLevel] = useState('5');

  var showColor = mode === 'bot';
  var showEngine = mode === 'bot';
  var showLevel = mode === 'bot' && engineType !== 'ceng';

  function handleSubmit(e) {
    e.preventDefault();
    onStart({
      mode: mode,
      playerColor: playerColor,
      engineType: engineType,
      engineLevel: parseInt(engineLevel, 10),
    });
  }

  return (
    <div id="menu-overlay">
      <div id="menu-box">
        <h1>♚ Chess</h1>
        <form onSubmit={handleSubmit}>
          <div className="menu-row">
            <label htmlFor="mode-select">Mode</label>
            <select id="mode-select" value={mode} onChange={function(e) { setMode(e.target.value); }}>
              <option value="bot">vs Bot</option>
              <option value="2player">2 Players</option>
            </select>
          </div>
          {showColor && (
            <div className="menu-row" id="color-row">
              <label htmlFor="color-select">Play as</label>
              <select id="color-select" value={playerColor} onChange={function(e) { setPlayerColor(e.target.value); }}>
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
          )}
          {showEngine && (
            <div className="menu-row" id="engine-row">
              <label htmlFor="engine-select">Engine</label>
              <select id="engine-select" value={engineType} onChange={function(e) { setEngineType(e.target.value); }}>
                <option value="ceng">CEng V0</option>
                <option value="geneng">GenEng</option>
                <option value="stockfish">Stockfish</option>
              </select>
            </div>
          )}
          {showLevel && (
            <div className="menu-row" id="level-row">
              <label htmlFor="level-select">Level</label>
              <select id="level-select" value={engineLevel} onChange={function(e) { setEngineLevel(e.target.value); }}>
                {[1,2,3,4,5,6,7,8,9,10].map(function(n) {
                  return <option key={n} value={n}>{n} {n === 1 ? '(Easy)' : n === 5 ? '(Medium)' : n === 10 ? '(Hard)' : ''}</option>;
                })}
              </select>
            </div>
          )}
          <button id="start-btn" type="submit">Start Game</button>
        </form>
      </div>
    </div>
  );
}
