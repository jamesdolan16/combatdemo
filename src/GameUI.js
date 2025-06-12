import InventoryUI from './inventoryUI';
import OverlayUI from './overlayUI';
import SmithingManager from './smithingManager';
import SmithingUI from './smithingUI';

export default class GameUI {

    constructor(game) {
        this.game = game;
        this.player = game.activePlayer;
        this.panels = {};
    }

    async initialise() {
        await this.loadUI();
        this.outputUI();
    }

    async loadUI() {
        this.loadOverlay();
        this.loadMainMenu();
        this.loadInventory();
        this.loadCharacterPanel();
        await this.loadSmithingPanel();
    }

    loadOverlay() {
        this.panels.overlay = new OverlayUI(this.game, {
            hidden: false,
            externalUI: this.panels
        });
    }

    loadMainMenu() {

    }

    loadInventory() {
        this.panels.inventory = new InventoryUI(this.game, {
            hidden: true
        });
    }

    loadCharacterPanel() {
        this.panels.character = {};
    }

    async loadSmithingPanel() {
        this.panels.smithing = new SmithingManager(this.game, {
            uiOptions: {
                hidden: true,
                externalUI: this.panels
            }
        });
        await this.panels.smithing.initialise();
    }

    outputUI() {
        Object.entries(this.panels).forEach(([key, panel]) => {
            const panelElement = panel.generateDOMElement?.();
            if (panelElement) this.game.container.appendChild(panelElement);
        });
    }
}