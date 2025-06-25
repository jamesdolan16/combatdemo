import Game from "./game";
import GameUI from "./GameUI";
import SmithingUI from "./smithingUI";
import './style.css';
import EventEmitter from "./EventEmitter";
import Skill from "./skill";
import Item from "./item";
import { label } from "three/tsl";
import ItemRepository from "./repositories/itemRepository";
import SmithingManager from "./smithingManager";

let game;

async function init() {
    const itemRepo = new ItemRepository();
    const game = new Game(document.body);
    game.initialise();

    game.eventEmitter.on('playerSpawned', async (scene) => {
        const gameUI = new GameUI(game);
        gameUI.initialise();
    });

    /*const game = {
        eventEmitter: ee,
        container: document.getElementById('game-container'),
        activePlayer: {
            skills: {
                smithing: new Skill('smithing', ee, { xp: 0 })
            },
            inventory: [
                new Item('bronze-ingot', {
                    label: 'Bronze Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'bronze-ingot.png',
                    //container: game.activePlayer.inventory
                }),
                new Item('wood', {
                    label: 'Wood',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'wood.png',
                    //container: game.activePlayer.inventory
                }),
                new Item('iron-ingot', {
                    label: 'Iron Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'iron-ingot.png',
                    //container: game.activePlayer.inventory
                }),
                new Item('garlith-ingot', {
                    label: 'Garlith Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'garlith-ingot.png',
                }),
                new Item('damascus-ingot', {
                    label: 'Damascus Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'damascus-ingot.png',
                }),
                new Item('kyran-ingot', {
                    label: 'Kyran Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'kyran-ingot.png',
                }),
                new Item('tranid-ingot', {
                    label: 'Tranid Ingot',
                    stackLimit: 64,
                    quantity: 64,
                    icon: 'tranid-ingot.png',
                }),
            ]
        }   
    };*/
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
