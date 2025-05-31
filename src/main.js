import Game from "./game";

let game;

function init() {
    game = new Game(document.body);
    game.initialise().then(() => {
        game.start();
    });
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (game) {
            game.dispose();
            game = null;
        }
    });
}

init();
