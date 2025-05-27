import * as THREE from 'three';
import { GLTFLoader, PointerLockControls } from 'three/examples/jsm/Addons.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import EnemyObject from './objects/enemy';
import WorldObject from './objects/worldObject';
import Capsule from './cannon/capsule';
import { debug } from 'three/src/nodes/TSL.js';
import PlayerObject from './objects/oldplayer';
import GLTFCache from './GLTFCache';
import WorldObjectFactory from './objects/WorldObjectFactory';
import Chunk from './chunk';

export default class Game {
    /**
     * @param {domElement} container Element to contain the game render
     */
    constructor(container) {
        if (!(container instanceof HTMLElement)) throw new Error("Container is not a valid DOM element");
        this._container = container;
        this._chunks = new Map();
        this._mixers = [];
        this._spawns = [];
    }

    async initialise() {
        this._clock = new THREE.Clock();
        this._loader = new GLTFLoader();
        this._GLTFCache = new GLTFCache(this._loader);
        this._worldObjectFactory = new WorldObjectFactory(this);

        await this._setupScene();
        this._setupLights();
        this._setupRenderer();
        this._setupCannonDebugger();
    }

    async _setupScene() {
        this._scene = new THREE.Scene();

        this._world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        this._terrainPhysicsMaterial = new CANNON.Material('terrain');

        const chunkName = 'chunktest';
        this._activeChunk = new Chunk(chunkName, this);
        await this._activeChunk.initialise();
        this._chunks.set(chunkName, this._activeChunk);
    }
    
    _setupLights() {
        this._scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    }

    _setupRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this._renderer.domElement);
    }

    _setupCannonDebugger() {
        //this._cannonDebugger = new CannonDebugger(this._scene, this._world);
    }

    start() {
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this._clock.getDelta();

        //if (this.activePlayer?._controls?.isLocked) {
            const chunkArray = Array.from(this._chunks.values());
            chunkArray.forEach(chunk => chunk.update(delta));
            this._world.step(delta);
            //this._cannonDebugger.update();
            this._renderer.render(this._scene, this.activePlayer._camera);
        //}
    }

    threeToCannonVec3(vec) {
        return new CANNON.Vec3(threeVec.x, threeVec.y, threeVec.z);
    }

    threeToCannonQuaternion(quat) {
        return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }

    cannonToThreeVec3(vec) {
        return new THREE.Vector3(vec.x, vec.y, vec.z);
    }

    cannonToThreeQuaternion(quat) {
        return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }

    lerpAngle(a, b, t) {
        const delta = ((((b - a) % (Math.PI * 2)) + (3 * Math.PI)) % (Math.PI * 2)) - Math.PI;
        return a + delta * t;
    }
    
}