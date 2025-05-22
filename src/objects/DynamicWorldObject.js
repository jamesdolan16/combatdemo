import WorldObject from "./worldObject";

export default class DynamicWorldObject extends WorldObject {
    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        const {
            scriptPath = null,
            startupCallback = () => {}, 
            updateCallback = () => {},
        } = objectScene.userData;

        this._scriptPath = scriptPath;
        this._startupCallback = startupCallback;
        this._updateCallback = updateCallback;
        this._positionHistory = [];
        
        this._terrainPhysicsMaterial = chunk._terrainBody.material;
    }

    async initialise() {
        if (this._scriptPath) this._scriptModule = this._loadScriptModule(this._scriptPath);
        this._startupCallback = this._scriptModule?.startupCallback ?? this._startupCallback;
        this._updateCallback = this._scriptModule?.updateCallback ?? this._updateCallback;

        await super.initialise();
        this._loadSockets();

        this._startupCallback();
        this._startupScript(this, game);
    }

    async _loadScriptModule(path) {
        const module = await import(`/${path}`);
        return module.default || module;
    }

    _loadSockets() {
        // TODO: Implement
    }

    update(delta) {
        this._updatePositionHistory();
        this._updateCallback(delta);
        this._updateScript(this, game, delta);
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