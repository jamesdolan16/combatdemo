import Game from "./game";
import SmithingUI from "./smithingUI";

let game;

function init() {
    // game = new Game(document.body);
    // game.initialise();
    const smithingUI = new SmithingUI({
        activePlayer: {
            skills: {
                smithing: {
                    level: 1,
                    xp: 0
                }
            },

            inventory: [
                { item: 'bronze', quantity: 50 },
                { item: 'wood', quantity: 50 } 
            ]
        }   
    });
    smithingUI.openSmithingPanel();
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
