import Game from "./game";
import GameUI from "./GameUI";
import SmithingUI from "./smithingUI";
import './style.css';
import EventEmitter from "./EventEmitter";


let game;

function init() {
    // game = new Game(document.body);
    // game.initialise();
    const game = {
        eventEmitter: new EventEmitter(),
        container: document.getElementById('game-container'),
        activePlayer: {
            skills: {
                smithing: {
                    level: 1,
                    xp: 0
                }
            },

            inventory: [
                { 
                    item: 'bronze', 
                    stackLimit: 64,
                    quantity: 350
                },
                { 
                    item: 'wood', 
                    stackLimit: 64,
                    quantity: 50 
                },
                {
                    item: 'iron',
                    stackLimit: 64,
                    quantity: 15
                }
            ]
        }   
    };

    const gameUI = new GameUI(game);
    gameUI.initialise();

    const smithingUI = new SmithingUI(game);
    //smithingUI.openSmithingPanel();
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
