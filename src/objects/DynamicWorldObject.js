import WorldObject from "./worldObject";

export default class DynamicWorldObject extends WorldObject {
    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        const {
            scriptPath = null,
            startupCallback = (object, game) => {}, 
            updateCallback = (object, game) => {},
        } = objectScene.userData;

        this._scriptPath = scriptPath;
        this._startupCallback = startupCallback;
        this._updateCallback = updateCallback;
        this._positionHistory = [];
        this._sockets = new Map();
        
        //this._terrainPhysicsMaterial = chunk._terrainBody.material;
    }

    async initialise() {
        if (this._scriptPath) this._scriptModule = await this._loadScriptModule(this._scriptPath);
        this._startupCallback = this._scriptModule?.startupCallback ?? this._startupCallback;
        this._updateCallback = this._scriptModule?.updateCallback ?? this._updateCallback;

        await super.initialise();
        this._loadSockets();

        const result = this._startupCallback(this, this._game);
        if (result instanceof Promise) await result; // Wait for the startup callback to complete if it's a promise
    }

    async _loadScriptModule(path) {
        const module = await import(`/src/objects/scripts/${path}`);
        return module.default || module;
    }

    _loadSockets() {
        this._scene?.traverse((obj) => {
            if (!obj.isObject3D || typeof obj.name !== 'string') return;

            // Look for names that match the socket naming pattern
            if (/socket/i.test(obj.name)) {
                this._sockets.set(obj.name, obj);
            }   
        });
    }

    async update(delta) {
        this._updatePositionHistory();
        const result = this._updateCallback(this, game, delta);
        if (result instanceof Promise) await result;
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