import * as THREE from 'three';
import { GLTFLoader, PointerLockControls } from 'three/examples/jsm/Addons.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import WorldObject from './objects/worldObject';
import Capsule from './cannon/capsule';
import { debug } from 'three/src/nodes/TSL.js';
import GLTFCache from './GLTFCache';
import WorldObjectFactory from './objects/WorldObjectFactory';
import Chunk from './chunk';
import InitManager from './InitManager.js';
import { ExtendedObject3D, PhysicsLoader, Project } from 'enable3d';
import GameScene from './GameScene.js';
import SmithingUI from './smithingUI.js';

export default class Game extends Project {
    /**
     * @param {domElement} container Element to contain the game render
     */
    constructor(container) {
        super({scenes: [/* MainScene */], container: container});

        if (!(container instanceof HTMLElement)) throw new Error("Container is not a valid DOM element");
        this._container = container;
        this._chunks = new Map();
    }

    initialise() {
        this._clock = new THREE.Clock();
        this._loader = new GLTFLoader();
        this._GLTFCache = new GLTFCache(this._loader);
        this._worldObjectFactory = new WorldObjectFactory(this);
        this._initManager = new InitManager(this);
        this.smithingUI = new SmithingUI(this);
        this.smithingUI.openSmithingPanel();
        // PhysicsLoader('/ammo', async () => {
        //     this._gameScene = new GameScene(this);
        //     this._gameScene.start();
        // });
    }

    threeToCannonVec3(vec) {
        return new CANNON.Vec3(vec.x, vec.y, vec.z);
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

    dispose() {
        // Clean up Three.js resources
        cleanupThreeScene(this._scene, this._renderer);

        // Stop animation frame if any
        cancelAnimationFrame(this._frameId);

        // DOM cleanup if needed
        if (this._renderer.domElement.parentElement) {
            this._renderer.domElement.parentElement.removeChild(this._renderer.domElement);
        }

        console.log("Game cleaned up.");
    }

    cleanupThreeScene(scene, renderer) {
        // Dispose all geometries, materials, textures, etc.
        scene.traverse((object) => {
            // Dispose geometries
            if (object.geometry) {
                object.geometry.dispose();
            }
    
            // Dispose materials (and nested materials in SkinnedMesh or multiple materials)
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => {
                        disposeMaterial(mat);
                    });
                } else {
                    disposeMaterial(object.material);
                }
            }
        });
    
        // Remove scene children
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    
        // Dispose renderer
        if (renderer) {
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement = null;
        }
    }
    
    disposeMaterial(material) {
        // Dispose textures used by material
        for (const key in material) {
            const value = material[key];
            if (value && value instanceof THREE.Texture) {
                value.dispose();
            }
        }
        material.dispose();
    }
    
}