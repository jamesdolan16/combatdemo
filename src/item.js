/**
 * In-game item/item stack
 */
export default class Item {
    constructor(name, options = {}) {
        /**
         * What this item is e.g. bronze-ingot
         * @type {string}
         */
        this.name = name;

        /**
         * Display name of this item
         * @type {string}
         * @default this.name
         */
        this.label = options.label ?? name;

        /**
         * Modifier of this item
         * @default 'ruined'
         */
        this.craftsmanshipModifier = options.craftsmanshipModifier ?? 'ruined';

        /**
         * How many of these can be in a stack
         * @type {number}
         * @default 1
         */
        this.stackLimit = options.stackLimit ?? 1;

        /**
         * How many of this is there in this stack
         * @type {number}
         * @default 1
         */
        this.quantity = options.quantity ?? 1;

        /**
         * Path of the icon file
         * @type {string}
         * @default 'missing-icon.png'
         */
        this.icon = options.icon ?? 'missing-icon.png';

        /**
         * The object that currently contains this item/stack
         * @type {object}
         */
        this.container = options.container;

        /**
         * All extra data associated with this Item
         * @type {object}
         */
        this.extraData = options.extraData;
    }

    /**
     * Generate UI element
     */
    generateDOMElement() {
        this.element = document.createElement('div');
        this.element.classList.add('item-container', 'group');
        const subtext = this.quantity !== 1 ? `<div class="icon-subtext">${this.quantity}</div>` : '';
        this.element.innerHTML = `
            <img class="ui-icon" 
                src="icons/${this.icon}"
                onerror="this.src = 'icons/missing-icon.png'">
            ${subtext}
            <div class="absolute bottom-3/4 left-1/2 -translate-x-1/2 mb-2 
                hidden group-hover:flex px-2 py-1 bg-gray-700 ${this.craftsmanshipModifier} text-sm shadow-lg
                whitespace-nowrap font-semibold">
                ${this.getStylisedLabel()}
            </div>
        `;

        return this.element;
    }

    getStylisedLabel() {
        return `<span class="${this.modifier}">${this.label}<span>`;
    }
}