import * as THREE from 'three';
import { GLTFLoader, PointerLockControls, FirstPersonControls } from 'three/examples/jsm/Addons.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import EnemyObject from './objects/enemy';
import WorldObject from './objects/worldObject';
import Capsule from './cannon/capsule';
import { debug } from 'three/src/nodes/TSL.js';

export default class Game {
    static CAMERA_POSITION = new THREE.Vector3(0, 15, 5);
    static WORLD_OBJECTS_CLASSMAP = {
        "enemy": EnemyObject
    };

    /**
     * @param {domElement} container Element to contain the game render
     */
    constructor(container) {
        if (!(container instanceof HTMLElement)) throw new Error("Container is not a valid DOM element");
        this._container = container;
    }

    async initialise() {
        this._clock = new THREE.Clock();
        this._loader = new GLTFLoader();
        await this._setupScene();
        this._setupLights();
        this._setupCamera();
        this._setupPlayer();
        this._setupControls();
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
            shape: floorShape
        });
        this._terrainBody = floorBody;
        this._world.addBody(floorBody);

        this._loadWorldObjects();
    }

    async _loadWorldObjects() {
        this._mixers = [];
        const objects = await this._fetchWorldObjects();

        objects.forEach(async objectData => {
            const classConstructor = Game.WORLD_OBJECTS_CLASSMAP[objectData.type];
            if (!classConstructor) throw new Error(`No class found for WorldObject type: ${objectData.type}`);
            const object = new classConstructor(this._loader, objectData.properties);
            await object.initialise();
            this._mixers.push(object._mixer);
            this._scene.add(object._mesh);        
        });
    }

    async _fetchWorldObjects() {
        const objects = [
            {
                "type": "enemy",
                "properties": {
                    "position": { "x": 0, "y": 1, "z": 0 },
                    "rotation": { "x": 0, "y": 0, "z": 0 },
                    "startupCallback": function() {
                        this._mixer.clipAction(this._animations[3]).play();
                    },
                    "updateCallback": function() {
                    }
                }
            }
        ];

        return objects;
    }
    
    _setupLights() {
        this._scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    }

    _setupCamera() {
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this._camera.position.copy(Game.CAMERA_POSITION);   // Ensure the camera is looking at the scene
    }

    _setupPlayer() {
        const playerGeometry = new THREE.SphereGeometry(0, 32, 32);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this._playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this._scene.add(this._playerMesh);

        // Player physics body
        this._playerBody = new Capsule(0.5, 1.8, 1, { x: 0, y: 3, z: 3 });
        this._world.addBody(this._playerBody._capsuleBody);

        // In your _setupPlayer() or physics setup
        const playerPhysicsMaterial = new CANNON.Material('playerMaterial');
        const terrainPhysicsMaterial = new CANNON.Material('terrainMaterial');

        // Create a contact material with reduced friction
        const contactMaterial = new CANNON.ContactMaterial(playerPhysicsMaterial, terrainPhysicsMaterial, {
            friction: 0.1, // Lower friction for smoother movement on slopes
            restitution: 0.0, // No bounce
        });

        // Add the contact material to the world
        this._world.addContactMaterial(contactMaterial);

        // Assign the materials to the player and terrain
        this._playerBody._capsuleBody.material = playerPhysicsMaterial;
        this._terrainBody.material = terrainPhysicsMaterial; // Ensure your terrain body has this material
    }

    _setupControls() {
        this._controls = new PointerLockControls(this._camera, this._container);
        this._controls.lookSpeed = 0.005;
        this._controls.lookVertical = true;

        document.addEventListener('click', () => {
            this._controls.lock();
        });
          
        document.addEventListener('keypress', (event) => {
            if (event.code === 'KeyEscape') {
                this._controls.unlock();
            }
        });

        this._playerVelocity = new CANNON.Vec3();
        this._playerDirection = new THREE.Vector3();
        this._playerDirection.set(0, 0, 0);

        this._keysPressed = {};

        document.addEventListener('keydown', (e) => this._keysPressed[e.code] = true);
        document.addEventListener('keyup', (e) => this._keysPressed[e.code] = false);
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

    _updatePlayer() {
        const input = new THREE.Vector3();

        if (this._keysPressed['KeyW']) input.z -= 1;
        if (this._keysPressed['KeyS']) input.z += 1;
        if (this._keysPressed['KeyA']) input.x -= 1;
        if (this._keysPressed['KeyD']) input.x += 1;
        //if (this._keysPressed['Space'] && this._playerGrounded()) input.y = 5;

        if (input.lengthSq() > 0) {
            // Get horizontal facing direction from camera
            const euler = new THREE.Euler().setFromQuaternion(this._controls.object.quaternion, 'YXZ');
            euler.x = 0;
            euler.z = 0;
            input.applyEuler(euler);
            input.normalize();
            input.multiplyScalar(1.5);

            // Apply movement
            const speed = 5;
            this._playerBody._capsuleBody.velocity.x = input.x * speed;
            this._playerBody._capsuleBody.velocity.z = input.z * speed;
        } else {
            this._playerBody._capsuleBody.velocity.x *= 0.8;
            this._playerBody._capsuleBody.velocity.z *= 0.8;
        }

        if (this._keysPressed['Space'] && this._playerGrounded()) {
            this._playerBody._capsuleBody.velocity.y = 5; // Apply upward velocity
        }

        this._controls.object.position.set(
            this._playerBody._capsuleBody.position.x,
            this._playerBody._capsuleBody.position.y + 0.8,
            this._playerBody._capsuleBody.position.z
        );
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

        this._mixers.forEach(mixer => mixer.update(delta));

        this._controls.update(1/60);
        this._updatePlayer();   
        this._scene.traverse(object => {
            if (object.userData.parent instanceof WorldObject) {
                object.userData.parent.update();
            }

            if (object instanceof THREE.SpotLightHelper) {
                object.update();
            }
        });
        this._world.step(1 / 60);
        this._playerMesh.position.copy(this.cannonToThreeVec3(this._playerBody._capsuleBody.position));
        this._playerMesh.quaternion.copy(this.cannonToThreeQuaternion(this._playerBody._capsuleBody.quaternion));
        //this._cannonDebugger.update();
        this._renderer.render(this._scene, this._camera);
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

}