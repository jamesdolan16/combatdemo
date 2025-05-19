import Game from "./game";

const game = new Game(document.body);
await game.initialise();

game.start();
