import DynamicWorldObject from "./DynamicWorldObject";
import * as U from "../utilities";
import Interactable from "./interactable";

export default class Character extends DynamicWorldObject {
    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        const {
            movementSpeed = U.WALKSPEED,
            jumpVelocity = U.JUMPVELOCITY,
            viewDistance = U.VIEWDISTANCE,
            initialInventory = [],
        } = objectScene.userData;
        
        this._movementSpeed = movementSpeed;
        this._jumpVelocity = jumpVelocity;
        this._viewDistance = viewDistance;
        this._initialInventory = initialInventory;
        this.slots = {
            rightHand: null,
            leftHand: null
        }
    }

    async initialise() {
        await this._loadInventory();
        await super.initialise();
        this._equipItems();
    }

    async _loadInventory() {
        this._inventory = new Map();
        await Promise.all(this?._initialInventory.map(async item => {
            const scene = await this._GLTFCache.fetchClonedScene(item.name, this);
            scene.userData.quantity = item.quantity;
            scene.userData.equipSlot = item.equipSlot;
            this._inventory.set(item.name, new Interactable(this._game, scene));
        }));
    }

    _equipItems() {
        Array.from(this._inventory.entries()).forEach(item => {
            if (item.equipSlot) {
                this._sockets[item.equipSlot].userData.equippedItem = item;
                this.alignToSocket(item, item.equipSocket, this._sockets[item.equipSlot]);
            }
        })
    }

}