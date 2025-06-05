import InventoryUI from './inventoryUI';
import OverlayUI from './overlayUI';
import SmithingUI from './smithingUI';

export default class GameUI {

    constructor(game) {
        this.game = game;
        this.player = game.activePlayer;
        this.panels = {};
    }

    initialise() {
        this.loadUI();
        this.outputUI();
    }

    loadUI() {
        this.loadOverlay();
        this.loadMainMenu();
        this.loadInventory();
        this.loadCharacterPanel();
        this.loadSmithingPanel();
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

    loadSmithingPanel() {
        this.smithing = new SmithingUI(this.game, {
            hidden: true,
            externalUI: this.panels
        });
        this.panels.smithing = {
            show: () => this.smithing.openSmithingPanel(),
            hide: () => this.smithing.closeSmithingPanel(),
        };
    }

    outputUI() {
        Object.entries(this.panels).forEach(([key, panel]) => {
            const panelElement = panel.generateDOMElement?.();
            if (panelElement) this.game.container.appendChild(panelElement);
        });
    }
}