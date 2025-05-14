import { GLTFLoader } from "three/examples/jsm/Addons";
import * as CANNON from 'cannon-es';
import * as THREE from "three";


export default class WorldObject {
    constructor(game, {position, rotation, gravity, startupCallback, updateCallback} = {}) {
        this._game = game;
        this._loader = game._loader;
        this._initialPosition = position || { x: 0, y: 0, z: 0};
        this._initialRotation = rotation || { x: 0, y: 0, z: 0};
        this._gravity = gravity || false;
        this._terrainPhysicsMaterial = game._terrainBody.material;
        this._startupCallback = startupCallback || (() => {});
        this._updateCallback = updateCallback || (() => {});
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

    update() {
        this._updateCallback();
    }
}