import GenEng from './GenEng.js';

var engine = new GenEng();

engine.setOutputCallback(function(msg) {
  self.postMessage(msg);
});

self.onmessage = function(e) {
  engine.handleUCI(e.data);
};
