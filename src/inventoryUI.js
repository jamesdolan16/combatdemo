import Sortable from "sortablejs";

export default class InventoryUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.uiElements = {};
        this.hidden = options?.hidden || false;
        
        this.game.eventEmitter.on('playerInventoryUpdated', () => {
            this.populate();
            this.uiElements.itemsContainer.scrollTop = this.uiElements.itemsContainer.scrollHeight;
        });
    }

    generateDOMElement() {
        const inventoryElement = document.createElement("div");
        inventoryElement.id = "inventory";
        inventoryElement.classList.add(
            "ui-panel", "flex", "flex-col", "absolute", "bottom-0", "right-[112px]", "h-3/5", "w-96", "z-50"
        );
        if (this.hidden) inventoryElement.classList.add("hidden");
        inventoryElement.innerHTML = `
            <div class="relative mb-2">
                <h2 class="text-xl font-bold mb-1">Inventory</h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="inventory-items flex-1 flex flex-row flex-wrap content-start overflow-visible 
                    p-1 rounded-lg h-full">
            </div>
        `;
                
        this.uiElements.panel = inventoryElement;
        this.uiElements.itemsContainer = inventoryElement.querySelector(".inventory-items");
        Sortable.create(this.uiElements.itemsContainer, {
            animation: 150,
            ghostClass: 'bg-gray-800/10',
            onEnd: (evt) => {
                console.log('Moved from', evt.oldIndex, 'to', evt.newIndex);
                // You can update your inventory state here
            }
        });
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
            this.uiElements.itemsContainer.appendChild(item.generateDOMElement());
        });
    }
}