import React, { useState, useEffect, useCallback } from 'react';
import Game from '../game/Game.js';

export default function ConfirmDialog() {
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    Game.onToggleConfirm = function() {
      setVisible(function(prev) { return !prev; });
    };
    Game.onConfirmBack = function() {
      setVisible(false);
      if (Game.onBackToMenu) Game.onBackToMenu();
    };
    Game.onConfirmCancel = function() {
      setVisible(false);
    };
  }, []);

  function handleYes() {
    if (Game.onConfirmBack) Game.onConfirmBack();
  }

  function handleNo() {
    if (Game.onConfirmCancel) Game.onConfirmCancel();
  }

  return (
    <div id="confirm-overlay" className={visible ? 'visible' : ''}>
      <div id="confirm-box">
        <p>Return to main menu?</p>
        <div className="confirm-buttons">
          <button id="confirm-yes" onClick={handleYes}>Yes</button>
          <button id="confirm-no" onClick={handleNo}>No</button>
        </div>
      </div>
    </div>
  );
}
