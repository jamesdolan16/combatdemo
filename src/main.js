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
                    xp: 0,
                    levelBoundaries: [
                        -1, 0, 50, 120, 200, 300, 420, 560, 720, 900, 
                        1100, 1320, 1560, 1820, 2100, 2400, 2720, 3060, 3420, 3800, 
                        4200, 4620, 5060, 5520, 6000, 6500, 7020, 7560, 8120, 8700, 9300
                    ],
                    get level() {
                        let currentLevel = 0;
                        for (let i = 0; i < this.levelBoundaries.length; i++) {
                            if (this.xp < this.levelBoundaries[i]) {
                                break;
                            }
                            currentLevel = i;
                        }

                        return currentLevel;
                    }
                }
            },

            inventory: [
                { 
                    item: 'bronze', 
                    stackLimit: 64,
                    quantity: 64
                },
                { 
                    item: 'wood', 
                    stackLimit: 64,
                    quantity: 64 
                },
                {
                    item: 'iron',
                    stackLimit: 64,
                    quantity: 64
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
