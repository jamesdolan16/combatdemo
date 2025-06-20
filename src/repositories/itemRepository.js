import Item from "../item";

export default class ItemRepository {
    constructor(game) {
        this.game = game;

        this.itemDefinitions = {
            'forge-scrap': new Item('forge-scrap', {
                label: 'Forge Scrap',
                tags: ['misc'],
                stackLimit: 64,
                icon: 'forge-scrap.png'
            }),
            'wood': new Item('wood', {
                label: 'Wood',
                tags: ['material'],
                stackLimit: 16,
                icon: 'wood.png',
                //container: game.activePlayer.inventory
            }),
            'bronze-ingot': new Item('bronze-ingot', {
                label: 'Bronze Ingot',
                tags: ['material'],
                stackLimit: 16,
                icon: 'bronze-ingot.png',
                //container: game.activePlayer.inventory
            }),
            'iron-ingot': new Item('iron-ingot', {
                label: 'Iron Ingot',
                tags: ['material'],
                stackLimit: 16,
                icon: 'iron-ingot.png',
                //container: game.activePlayer.inventory
            }),
            'garlith-ingot': new Item('garlith-ingot', {
                label: 'Garlith Ingot',
                tags: ['material'],
                stackLimit: 12,
                icon: 'garlith-ingot.png',
            }),
            'damascus-ingot': new Item('damascus-ingot', {
                label: 'Damascus Ingot',
                tags: ['material'],
                stackLimit: 12,
                icon: 'damascus-ingot.png',
            }),
            'kyran-ingot': new Item('kyran-ingot', {
                label: 'Kyran Ingot',
                tags: ['material'],
                stackLimit: 8,
                icon: 'kyran-ingot.png',
            }),
            'tranid-ingot': new Item('tranid-ingot', {
                label: 'Tranid Ingot',
                tags: ['material'],
                stackLimit: 8,
                icon: 'tranid-ingot.png',
            }),
            'pastranite-ingot': new Item('pastranite-ingot', {
                label: 'Pastranite Ingot',
                tags: ['material'],
                stackLimit: 8,
                icon: 'pastranite-ingot.png',
            }),
            'paledrite-ingot': new Item('paledrite-ingot', {
                label: 'Paledrite Ingot',
                tags: ['material'],
                stackLimit: 4,
                icon: 'paledrite-ingot.png',
            }),
            'bronze-dagger': new Item('bronze-dagger', {
                label: 'Bronze Dagger',
                tags: ['weapon', 'bronze', 'dagger'],
                icon: 'bronze-dagger.png',
            })
        };
    }

    async getItem(name) {
        let value = null;
        if (this.itemDefinitions[name]) {
            value = Object.assign(new Item(), structuredClone(this.itemDefinitions[name]));
        }

        return Promise.resolve(value);
    }
}