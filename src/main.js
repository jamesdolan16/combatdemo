import Game from "./game";
import GameUI from "./GameUI";
import SmithingUI from "./smithingUI";
import './style.css';

let game;

function init() {
    // game = new Game(document.body);
    // game.initialise();
    const game = {
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
                    quantity: 50 
                },
                { 
                    item: 'wood', 
                    quantity: 50 
                },
                {
                    item: 'iron',
                    //quantity: 15
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
