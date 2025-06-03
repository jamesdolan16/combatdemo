import * as THREE from 'three';

export default class WorldObject {
    constructor(chunk, objectScene) {
        this._chunk = chunk;
        this._game = chunk._game;
        this.gameScene = chunk.gameScene;
        this._GLTFCache = chunk._game._GLTFCache;

        const {
            position = new THREE.Vector3(), 
            quaternion = new THREE.Quaternion(),
            scale = new THREE.Vector3(1, 1, 1),
        } = objectScene;
        
        this._initialPosition = position.clone();
        this._initialRotation = quaternion.clone();
        this._initialScale = scale.clone();

        const {
            name = null,
            baseName = null
        } = objectScene.userData;

        this._name = name;
        this._baseName = baseName;
    }

    get type() { return 'WorldObject'; }

    async initialise() {
        await this._loadScene();
        if (this?._scene) this._addToWorldScene();
        this._setupPhysics();
        this._readyLevel = this.type;
    }

    async _loadScene() {
        this._scene = await this._GLTFCache.fetchClonedScene(this._baseName, this);
        this._mesh = this._scene.children[0];   // Assume the first child is the main mesh
        this._animations = await (this._GLTFCache.fetch(this._baseName)).animations;
        if (this?._animations) this._mixer = new THREE.AnimationMixer(this._scene);
    }

    _addToWorldScene() {
        this._scene.position.copy(this._initialPosition);
        this._scene.quaternion.copy(this._initialRotation);
        this._scene.scale.copy(this._initialScale);
        console.log(`Adding ${this._name} to chunk ${this._chunk.name} at position ${this._scene.position.toArray()}`);
        this.gameScene.add(this._scene);
        //this._chunk._scene.add(new THREE.BoxHelper(this._mesh, 0xff0000)); // Debug: add a box helper

        this._scene.userData.worldObject = this; // Link back to the WorldObject instance
    }
    
    /**
     * Virtual function to be overridden by subclasses
     */
    _setupPhysics() {}

}