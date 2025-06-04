export default class InventoryUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.uiElements = {};
        this.hidden = options?.hidden || false;
    }

    generateDOMElement() {
        const inventoryElement = document.createElement("div");
        inventoryElement.id = "inventory";
        inventoryElement.classList.add(
            "ui-panel", "flex", "flex-col", "absolute", "bottom-0", "right-0", "h-1/2", "w-72", "z-50"
        );
        if (this.hidden) inventoryElement.classList.add("hidden");
        inventoryElement.innerHTML = `
            <div class="relative mb-2">
                <h2 class="text-xl font-bold mb-1">Inventory</h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="inventory-items flex-1 overflow-y-auto p-2 border border-gray-600 rounded-lg h-full">
            </div>
        `;
                
        this.uiElements.panel = inventoryElement;
        this.uiElements.itemsContainer = inventoryElement.querySelector(".inventory-items");
        this.uiElements.closeButton = inventoryElement.querySelector(".close-button");
        this.uiElements.closeButton.addEventListener("click", () => {
            this.hide();
        });

        this.populate();
        
        return inventoryElement;
    }

    hide() {
        this.uiElements?.panel?.classList.add("hidden");
    }

    show() {
        this.uiElements?.panel?.classList.remove("hidden");
    }

    populate() {
        if (!this.uiElements?.itemsContainer) return;

        this.uiElements.itemsContainer.innerHTML = ""; // Clear existing items

        this.player.inventory.forEach(item => {
            if (!item.quantity || item.quantity <= 0) return; // Skip items with zero quantity
            const itemElement = document.createElement("div");
            itemElement.classList.add("inventory-item", "flex", "justify-between", "p-1", "border-b", "border-gray-300");
            itemElement.innerHTML = `
                <span>${item.item}</span>
                <span class="text-gray-500">${item.quantity}</span>
            `;
            this.uiElements.itemsContainer.appendChild(itemElement);
        });
    }
}