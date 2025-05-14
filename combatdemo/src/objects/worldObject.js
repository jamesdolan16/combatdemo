import { GLTFLoader } from "three/examples/jsm/Addons";

export default class WorldObject {
    constructor(loader, {position, rotation, startupCallback, updateCallback} = {}) {
        this._initialPosition = position || { x: 0, y: 0, z: 0};
        this._initialRotation = rotation || { x: 0, y: 0, z: 0};
        this._startupCallback = startupCallback || (() => {});
        this._updateCallback = updateCallback || (() => {});
        this._loader = loader;
    }

    async initialise() {
        await this._generateMesh();
        this._startupCallback();
    }

    async _generateMesh() {}

    update() {
        this._updateCallback();
    }
}