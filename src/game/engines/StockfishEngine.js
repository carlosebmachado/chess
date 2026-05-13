export default class StockfishEngine {
  constructor(engineLevel) {
    this.serverUrl = 'http://localhost:3001/uci';
    this.outputCallback = null;
  }

  setOutputCallback(cb) {
    this.outputCallback = cb;
  }

  send(msg) {
    if (this.outputCallback) this.outputCallback(msg);
  }

  async handleUCI(cmd) {
    try {
      var response = await fetch(this.serverUrl, {
        method: 'POST',
        body: cmd
      });
      var text = await response.text();
      if (text && text !== 'ok') {
        this.send(text);
      }
    } catch (e) {
      console.error('StockfishEngine error:', e);
    }
  }
}
