import DynamicWorldObject from "./DynamicWorldObject";

export default class Interactable extends DynamicWorldObject {
    constructor(chunk, objectScene) {
        super(game, objectScene);

        const {
            quantity = 0,
            equipSlot = null
        } = objectScene.userData;

        this.quantity = quantity;
        this.equipSlot = equipSlot;
    }

}