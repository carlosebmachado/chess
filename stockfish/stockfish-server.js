const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

var stockfish = spawn(path.join(__dirname, 'stockfish'), [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

var stdoutBuf = '';
var initDone = false;
var initQueue = [];

stockfish.stdout.on('data', function(data) {
  stdoutBuf += data.toString();
  checkInit();
});

function checkInit() {
  if (initDone) return;
  if (stdoutBuf.indexOf('uciok') !== -1 && stdoutBuf.indexOf('readyok') !== -1) {
    initDone = true;
    for (var i = 0; i < initQueue.length; i++) initQueue[i]();
    initQueue = [];
  }
}

function waitForLine(pattern, timeout) {
  return new Promise(function(resolve) {
    var start = Date.now();
    function poll() {
      var idx = stdoutBuf.indexOf(pattern);
      if (idx !== -1) {
        var lineStart = stdoutBuf.lastIndexOf('\n', idx);
        if (lineStart === -1) lineStart = 0; else lineStart++;
        var lineEnd = stdoutBuf.indexOf('\n', idx);
        if (lineEnd === -1) lineEnd = stdoutBuf.length;
        var line = stdoutBuf.substring(lineStart, lineEnd);
        stdoutBuf = stdoutBuf.substring(lineEnd);
        resolve(line);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve(null);
        return;
      }
      setImmediate(poll);
    }
    poll();
  });
}

function waitFor(pattern, timeout) {
  return new Promise(function(resolve) {
    var start = Date.now();
    function poll() {
      var idx = stdoutBuf.indexOf(pattern);
      if (idx !== -1) {
        stdoutBuf = stdoutBuf.substring(idx + pattern.length);
        resolve(true);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve(false);
        return;
      }
      setImmediate(poll);
    }
    poll();
  });
}

function send(cmd) {
  stockfish.stdin.write(cmd + '\n');
}

send('uci');
waitFor('uciok', 5000).then(function() {
  send('isready');
  return waitFor('readyok', 5000);
}).then(function() {
  initDone = true;
  for (var i = 0; i < initQueue.length; i++) initQueue[i]();
  initQueue = [];
});

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/uci') {
    res.writeHead(404);
    res.end();
    return;
  }

  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    if (!initDone) {
      initQueue.push(function() { handleCommand(body, res); });
    } else {
      handleCommand(body, res);
    }
  });
});

function handleCommand(cmd, res) {
  send(cmd);

  if (cmd === 'go' || cmd.startsWith('go ')) {
    waitForLine('bestmove', 120000).then(function(line) {
      if (!line) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('error: timeout');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(line);
    });
  } else if (cmd === 'isready') {
    waitFor('readyok', 5000).then(function() {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('readyok');
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  }
}

server.listen(3001, function() {
  console.log('Stockfish server listening on http://localhost:3001');
});

process.on('SIGINT', function() {
  stockfish.kill();
  process.exit();
});

process.on('SIGTERM', function() {
  stockfish.kill();
  process.exit();
});
