import * as THREE from 'three';

export default class WorldObject {
    constructor(chunk, objectScene) {
        this._chunk = chunk;
        this._game = chunk._game;
        this._GLTFCache = chunk._game._GLTFCache;

        const {
            position = new THREE.Vector3(), 
            rotation = new THREE.Quaternion(),
        } = objectScene;

        this._initialPosition = position;
        this._initialRotation = rotation;

        const {
            name = null,
            baseName = null
        } = objectScene.userData;

        this._name = name;
        this._baseName = baseName;
    }

    async initialise() {
        await this._loadScene();
        this._setupPhysics();
    }

    async _loadScene() {
        this._scene = await this._GLTFCache.fetchClonedScene(this._baseName, this);
        this._mesh = this._scene.children[0];   // Assume the first child is the main mesh
        this._animations = this._GLTFCache.fetch(this._baseName).animations;
    }
    
    /**
     * Virtual function to be overridden by subclasses
     */
    _setupPhysics() {}

}