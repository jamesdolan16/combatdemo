export default class WorldObject {
    constructor({position, rotation, updateCallback} = {}) {
        this._initialPosition = position || { x: 0, y: 0, z: 0};
        this._initialRotation = rotation || { x: 0, y: 0, z: 0};
        this._updateCallback = updateCallback || (() => {});
        this._initialise(position, rotation);
    }

    _initialise() {
        this._generateMesh();
    }

    _generateMesh() {}

    update() {
        this._updateCallback();
    }
}