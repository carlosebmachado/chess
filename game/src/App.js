var canvas = document.getElementById('game-canvas');

var game = Game.get();
game.start(canvas, Game.HORIZONTAL_ORIENTATION);
game.run();

// var arr = [

// ];
// for (let i = 0; i < 8; i++) {
//   var row = [];
//   for (let j = 0; j < 8; j++) {
//     row.push(`[${i}, ${j}]`);
//   }
//   arr.push(row);
// }



// console.log(arr);
