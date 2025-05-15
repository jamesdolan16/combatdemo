export default class WorldObject {
    constructor(game, options = {}) {
        this._game = game;
        this._loader = game._loader;
        this._terrainPhysicsMaterial = game._terrainBody.material;

        const { 
            position = { x: 0, y: 0, z: 0 }, 
            rotation = { x: 0, y: 0, z: 0 }, 
            gravity = false, 
            startupCallback = () => {}, 
            updateCallback = () => {} 
        } = options;

        //this.id = "";
        this._initialPosition = position;
        this._initialRotation = rotation;
        this._gravity = gravity;
        this._startupCallback = startupCallback;
        this._updateCallback = updateCallback;
    }

    async initialise() {
        await this._generateMesh();
        this._setupPhysics();
        this._startupCallback();
    }

    /**
     * Virtual function to be overridden by subclasses
     */
    async _generateMesh() {}
    
    /**
     * Virtual function to be overridden by subclasses
     */
    _setupPhysics() {}

    update(delta) {
        this._updateCallback(delta);
    }
}