import axios from 'axios'; // Assuming axios or fetch is available for API calls

/**
 * AI Engine powered by a local Ollama model via API.
 * This engine assumes communication via a REST endpoint (e.g., http://localhost:11434).
 */
export default class AIEng {
  constructor(board, color, modelName) {
    this.board = board;
    this.color = color;
    this.modelName = modelName;
    this.baseUrl = 'http://localhost:11434/api/generate'; // Ollama generation endpoint
    this.session = {}; // To hold session/context info if needed
    this.setOutputCallback = null;
  }

  setOutputCallback(callback) {
    this.setOutputCallback = callback;
  }

  // Placeholder for communication
  async sendToEngine() {
    console.log(`[AIEng] Sending request to Ollama model: ${this.modelName}`);
    // In a real-world scenario, this would construct a complex prompt
    // including the board FEN and asking for the best move.
    // The actual call would look something like this:
    const prompt = `The current FEN is ${this.board.getFEN()}. In the context of the chess game, determine the optimal move for ${this.color}. Response must be in UCI format (e.g., 'e2e4').`;

    try {
      const response = await axios.post(this.baseUrl, {
        model: this.modelName,
        prompt: prompt,
        stream: false, // We wait for the whole response
        options: {
          temperature: 0.2,
          top_p: 0.9,
          repeat_penalty: 1.1,
        }
      });
      
      // Assuming Ollama response structure contains the generated text
      const fullResponse = response.data.response.trim();
      this.onEngineOutput(fullResponse);

    } catch (error) {
      console.error(`[AIEng] Error communicating with Ollama:`, error);
      this.onEngineOutput('0000'); // Signal failure or wait
    }
  }

  onEngineOutput(uciMove) {
    if (uciMove && uciMove.length > 0 && uciMove !== '0000') {
      this.setOutputCallback(uciMove);
    } else {
      this.setOutputCallback('0000');
    }
  }

  // Utility functions mirror Engine.js (simplified for now)
  buildPositionCommand() { return 'position ' + this.board.getFEN(); }
  playUCIMove(uci) {
    // Logic to apply move to board (requires access to board's internal methods)
    // For simplicity, we assume the board object handles this.
    // this.board.applyMove(uci); 
    return true;
  }

  // The core update loop wrapper
  async update(delta) {
    if (this.board.turn !== this.color) return;
    if (this.board.gameOver) return;
    if (this.board.isBotAttack) return;
    this.board.isBotAttack = true;

    await sleep(randInt(400, 800)); // Wait period

    this.board.recomputeAttacks();

    // Send the request to the AI model
    await this.sendToEngine();

    // Simulate the move application, which would happen after successful API call
    // The actual implementation would check the API result and then call this.playUCIMove()
    setTimeout(() => {
        this.board.isBotAttack = false;
    }, 1000); 
  }
  
  render(g) {
    // Drawing logic specific to AI moves (if needed)
  }
}