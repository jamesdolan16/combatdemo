import * as THREE from 'three';
import { GLTFLoader, PointerLockControls } from 'three/examples/jsm/Addons.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import EnemyObject from './objects/enemy';
import WorldObject from './objects/worldObject';
import Capsule from './cannon/capsule';
import { debug } from 'three/src/nodes/TSL.js';
import PlayerObject from './objects/player';

export default class Game {
    static CAMERA_POSITION = new THREE.Vector3(0, 15, 5);
    static WORLD_OBJECTS_CLASSMAP = {
        "player": PlayerObject,
        "enemy": EnemyObject
    };

    /**
     * @param {domElement} container Element to contain the game render
     */
    constructor(container) {
        if (!(container instanceof HTMLElement)) throw new Error("Container is not a valid DOM element");
        this._container = container;
        this._mixers = [];
    }

    async initialise() {
        this._clock = new THREE.Clock();
        this._loader = new GLTFLoader();
        await this._setupScene();
        this._setupLights();
        await this._loadWorldObjects();
        this._setupRenderer();
        this._setupCannonDebugger();
    }

    async _setupScene() {
        this._scene = new THREE.Scene();
        //const axesHelper = new THREE.AxesHelper(5); // 5 is the length of the lines
        //this._scene.add(axesHelper);

        this._world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        const gltf = await this._loader.loadAsync('/chunktest.glb', (e) => {
            console.log((e.loaded / e.total * 100) + '% loaded');
        });
        const chunkMesh = gltf.scene;
        chunkMesh.traverse((child) => {
            if (child.isMesh) {
              child.material.side = THREE.DoubleSide;
            }
        });
        chunkMesh.position.set(0, 0, 0);
        this._scene.add(chunkMesh);
        this._terrain = chunkMesh.children[0];

        // setup chunk physics
        const floorShape = new CANNON.Trimesh(
            chunkMesh.children[0].geometry.attributes.position.array,
            chunkMesh.children[0].geometry.index.array
        );
        const floorBody = new CANNON.Body({
            mass: 0,
            shape: floorShape,
            material: new CANNON.Material('terrain')
        });
        this._terrainBody = floorBody;
        this._world.addBody(floorBody);
    }

    async _loadWorldObjects() {
        const objects = await this._fetchWorldObjects();

        objects.forEach(async (objectData) => {
            const classConstructor = Game.WORLD_OBJECTS_CLASSMAP[objectData.type];
            if (!classConstructor) throw new Error(`No class found for WorldObject type: ${objectData.type}`);
            const object = new classConstructor(this, objectData.properties);
            await object.initialise();
            this._mixers.push(object._mixer);
            this._scene.add(object._mesh); 
            /*this._scene.add(
                new THREE.ArrowHelper(
                    new THREE.Vector3(0, 0, -1),
                    object._mesh.position,
                    2,
                    0xff0000
                ), 
            )*/      
            this._world.addBody(object._body._capsuleBody);
            this._world.addContactMaterial(object._contactMaterial);
        });
    }

    async _fetchWorldObjects() {
        const objects = [
            {
                "type": "player",
                "properties": {
                    "position": { "x": 0, "y": 15, "z": 5 },
                },
                "gravity": true,
                "startupCallback": function() {}
            },
            {
                "type": "enemy",
                "properties": {
                    "position": { "x": 0, "y": 5, "z": 0 },
                    //"rotation": { "x": 0, "y": 0, "z": 0 },
                    "gravity": true,
                    "startupCallback": function() {},
                    "updateCallback": function() {
                        if (this.canSee(this._game.activePlayer)) {
                            this.pursue(this._game.activePlayer);
                        }
                    },
                    "inventory": [
                        {
                            "type": "weapon1h",
                            "item": "falx1h",
                            "equippedR": true
                        }
                    ]
                }
            }
        ];

        return objects;
    }
    
    _setupLights() {
        this._scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    }

    _playerGrounded() {
        // Set up a ray that starts at the player's current position and points downward
        const rayOrigin = new THREE.Vector3(
            this._playerBody._capsuleBody.position.x, 
            this._playerBody._capsuleBody.position.y + 0.5, 
            this._playerBody._capsuleBody.position.z
        ); // Slight offset upwards to start above the player
        const rayDirection = new THREE.Vector3(0, -1, 0);  // Ray going downward
        
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 2); // Range is from 0 to 1 to detect objects just beneath
        const intersects = raycaster.intersectObject(this._terrain);  // _terrain is the terrain object or mesh
        
        return intersects.length > 0; // If there's an intersection, we're grounded
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

        if (this.activePlayer._controls?.isLocked) {
            this._scene.traverse(object => {
                if (object.userData.parent instanceof WorldObject) {
                    object.userData.parent.update(delta);
                }

                if (object instanceof THREE.SpotLightHelper) {
                    object.update();
                }
            });
            this._world.step(delta);
            //this._cannonDebugger.update();
            this._renderer.render(this._scene, this.activePlayer._camera);
        }
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