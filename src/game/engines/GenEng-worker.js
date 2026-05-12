importScripts('/src/game/engines/GenEng.js');

var engine = new GenEng();

engine.setOutputCallback(function(msg) {
  self.postMessage(msg);
});

self.onmessage = function(e) {
  engine.handleUCI(e.data);
};
