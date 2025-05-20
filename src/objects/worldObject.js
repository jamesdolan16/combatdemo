import * as THREE from 'three';

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

        this._positionHistory = [];
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
        this._updatePositionHistory();
        this._updateCallback(delta);
    }

    _updatePositionHistory() {
        this._positionHistory.push({
            time: performance.now() / 1000,
            position: this._mesh.getWorldPosition(new THREE.Vector3()),
            quaternion: this._mesh.getWorldQuaternion(new THREE.Quaternion())
        });

        //Remove positions older than 3 seconds
        const cutoffTime = performance.now() - 1000;
        this._positionHistory = this._positionHistory.filter(pos => pos.time > cutoffTime);
    }

    alignToSocket(itemMesh, itemSocket, targetSocket) {
        const itemSocketWorldPos = itemSocket.getWorldPosition(new THREE.Vector3());
        const itemSocketWorldQuat = itemSocket.getWorldQuaternion(new THREE.Quaternion());

        // Step 2: Convert that world position to local space of itemMesh
        const offsetPos = itemMesh.worldToLocal(itemSocketWorldPos.clone());
        const offsetQuat = itemSocketWorldQuat.clone().invert(); // rotation we need to "cancel"

        // Step 3: Attach item to the target socket
        targetSocket.add(itemMesh);

        // Step 4: Apply inverse offset so that the item’s internal socket aligns to target
        itemMesh.position.copy(offsetPos.negate());
        itemMesh.quaternion.copy(offsetQuat);
    }
}