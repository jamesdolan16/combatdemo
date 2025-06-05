export default class InventoryUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.uiElements = {};
        this.hidden = options?.hidden || false;
        
        this.game.eventEmitter.on('playerInventoryUpdated', () => {
            this.populate();
        });
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

    stack(quantity, stackLimit) {
        return Array.from({ length: Math.ceil(quantity / stackLimit) }, (_, i) =>
            Math.min(stackLimit, quantity - i * stackLimit)
        );
    }

    populate() {
        if (!this.uiElements?.itemsContainer) return;

        this.uiElements.itemsContainer.innerHTML = ""; // Clear existing items

        const newInventory = []; // Temporary array for the updated inventory

        for (let i = 0; i < this.player.inventory.length; i++) {
            const item = this.player.inventory[i];

            // Skip invalid entries
            if (item.stackLimit <= 0 || (item.stackLimit && !item.quantity) || item.quantity <= 0) continue;

            if (item.stackLimit < item.quantity) {
                // Split into stacks if quantity exceeds stack limit
                const stacks = this.stack(item.quantity, item.stackLimit);
                stacks.forEach(stackQuantity => {
                    const tempItem = structuredClone(item);
                    tempItem.quantity = stackQuantity;
                    newInventory.push(tempItem); // Add each stack to the new inventory
                });
            } else {
                newInventory.push(item); // Add the item as-is to the new inventory
            }
        }

        // Replace the player's inventory with the updated inventory
        this.player.inventory = newInventory;

        // Populate the UI with the updated inventory
        this.player.inventory.forEach(item => {
            const itemElement = this.inventoryItemElement(item);
            this.uiElements.itemsContainer.appendChild(itemElement);
        });
    }

    inventoryItemElement(item) {
        const quantity = item.quantity > 1 ? `<span class="text-gray-500">${item.quantity}</span>` : "";
        const itemElement = document.createElement("div");
            itemElement.classList.add("inventory-item", "flex", "justify-between", "p-1", "border-b", "border-gray-300");
            itemElement.innerHTML = `
                <span class="${item.craftsmanshipModifier ?? ""}">${item.item}</span>
                <span class="text-gray-500">${quantity}</span>
        `;
        return itemElement;
    }
}