import DynamicWorldObject from "./DynamicWorldObject";

export default class Interactable extends DynamicWorldObject {
    get type() { return 'Interactable'; }
    
    /**
     * Interactable objects are dynamic objects that can be interacted with by the player.
     * They can be picked up, used, or otherwise interacted with.
     * 
     * @param {Object} chunk - The chunk this object belongs to.
     * @param {THREE.Object3D|Object} objectScene - The scene graph of the object. This can be a simple object 
     *  that has the required properties for an interactable as well.
     */
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