import * as THREE from 'three';

export default class WorldObject {
    constructor(game, objectScene) {
        this._game = game;
        this._GLTFCache = game._GLTFCache;
        this._terrainPhysicsMaterial = game._terrainBody.material;

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
        await this._loadGLTFData();
        await this._generateMesh();
        this._setupPhysics();
    }

    async _loadScene() {
        this._scene = await this._GLTFCache.fetchClonedScene(this._baseName, this);
        this._animations = this._GLTFCache.fetch(this._baseName).animations;
    }

    /**
     * Virtual function to be overridden by subclasses
     */
    async _generateMesh() {}
    
    /**
     * Virtual function to be overridden by subclasses
     */
    _setupPhysics() {}
    
}