export default class OverlayUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.uiElements = {};
        this.hidden = options?.hidden || false;
        this.externalUI = options?.externalUI || {};
    }

    getSidebarButtons() {
        this.sidebarButtons = [
            { id: "inventory", label: '<span class="underline">I</span>nventory', icon: "📦", action: () => this.externalUI.inventory.show() },
            { id: "character", label: '<span class="underline">C</span>haracter', icon: "👤", action: () => this.externalUI.character.show() },
            { id: "smithing", label: '<span class="underline">S</span>mithing', icon: "⚒️", action: () => this.externalUI.smithing.show() }
        ];

        return this.sidebarButtons;
    }

    getAbilityButtons() {
        this.abilityButtons = [
            { name: "Lunge", icon: "🗡️", keybind: "1", action: () => console.log("Lunge activated") },
            { name: "Enrage", icon: "🔥", keybind: "2", action: () => console.log("Enrage activated") },
            { name: "Harden", icon: "🛡️", keybind: "3", action: () => console.log("Harden activated") },
            { name: "Potion", icon: "🧪", keybind: "4", action: () => console.log("Potion used") }
        ];
        return this.abilityButtons;
    }

    generateDOMElement() {
        const sidebarButtons = this.getSidebarButtons();
        const abilityButtons = this.getAbilityButtons();

        const overlayElement = document.createElement("div");
        overlayElement.id = "overlay";
        overlayElement.classList.add("ui-overlay", "absolute", "inset-0", "flex", "flex-col", "justify-between");
        if (this.hidden) overlayElement.classList.add("hidden");
        overlayElement.innerHTML = `
            <div class="interactive absolute bottom-0 right-0 flex flex-col items-end space-y-2 p-2 z-50">
                ${sidebarButtons.map(button => `
                    <button class="sidebar-button" data-id="${button.id}">
                        <div class="sidebar-icon">
                            ${button.icon}
                        </div>
                        <span class="sidebar-label">${button.label}</span>
                    </button>
                `).join('')}
            </div> 
            <div class="interactive absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center space-x-4 p-4 z-10">
                <button class="ability-button" title="Lunge">
                    <div class="ui-icon">
                        🗡️
                    </div>
                    <div class="icon-subtext">1</div>
                </button>
                <button class="ability-button" title="Enrage">
                    <div class="ui-icon">
                        🔥
                    </div>
                    <div class="icon-subtext">2</div>
                </button>
                <button class="ability-button" title="Harden">
                    <div class="ui-icon">
                        🛡️
                    </div>
                    <div class="icon-subtext">3</div>
                </button>
                <button class="ability-button !border-red-300 !bg-red-700" title="Potion">
                    <div class="ui-icon">
                        🧪
                    </div>
                    <div class="icon-subtext">4</div>
                </button>
            </div>
        `;
        // Add event listeners for sidebar buttons
        sidebarButtons.forEach(button => {
            const btnElement = overlayElement.querySelector(`button.sidebar-button[data-id="${button.id}"]`);
            btnElement?.addEventListener("click", () => {
                button.action()
            });
        });
        this.uiElements.panel = overlayElement;

        return overlayElement;
    }

    hide() {
        this.uiElements?.panel.classList.add("hidden");
    }

    show() {
        this.uiElements?.panel.classList.remove("hidden");
    }
}