import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import EnemyObject from './objects/enemy';
import WorldObject from './objects/worldObject';

export default class Game {
    static CAMERA_POSITION = new THREE.Vector3(0, 0, 5);
    static WORLD_OBJECTS_CLASSMAP = {
        "enemy": EnemyObject
    };

    /**
     * @param {domElement} container Element to contain the game render
     */
    constructor(container) {
        if (!(container instanceof HTMLElement)) throw new Error("Container is not a valid DOM element");
        this._container = container;
        this._initialise();
    }

    _initialise() {
        this._setupScene();
        this._setupLights();
        this._setupCamera();
        this._setupControls();
        this._setupRenderer();
    }

    _setupScene() {
        this._scene = new THREE.Scene();

        this._loadWorldObjects();

        const geometry = new THREE.PlaneGeometry(50, 50);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.8, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / 2);
        plane.position.y = -5;
        plane.receiveShadow = true;
        this._scene.add(plane);
    }

    async _loadWorldObjects() {
        const objects = await this._fetchWorldObjects();

        objects.forEach(objectData => {
            const classConstructor = Game.WORLD_OBJECTS_CLASSMAP[objectData.type];
            if (!classConstructor) throw new Error(`No class found for WorldObject type: ${objectData.type}`);
            const object = new classConstructor(objectData.properties);
            this._scene.add(object._mesh);        
        });
    }

    async _fetchWorldObjects() {
        const objects = [
            {
                "type": "enemy",
                "properties": {
                    "position": { "x": 0, "y": 0, "z": 0 },
                    "rotation": { "x": 0, "y": 0, "z": 0 },
                    "updateCallback": function() {
                        this._mesh.rotation.y += 0.01;
                    }
                }
            }
        ];

        return objects;
    }
    
    _setupLights() {
        const spotlight = new THREE.SpotLight(0xffffff, 100, 100, Math.PI / 4, 0.1, 2);
        const spotlightHelper = new THREE.SpotLightHelper(spotlight);

        spotlight.castShadow = true;
        spotlight.position.set(0, 5, 0);
        spotlight.target.position.set(0, 0, 0);

        this._scene.add(spotlight);
        this._scene.add(spotlight.target);
        this._scene.add(spotlightHelper);
    }

    _setupCamera() {
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this._camera.position.copy(Game.CAMERA_POSITION);
    }

    _setupControls() {
        this._controls = new PointerLockControls(this._camera, this._container);
        this._controls.movementSpeed = 5;
        this._controls.lookSpeed = 0.05;
        this._controls.lookVertical = true;

        document.addEventListener('click', () => {
            this._controls.lock();
        });
          
        document.addEventListener('keypress', (event) => {
            if (event.code === 'KeyEscape') {
                this._controls.unlock();
            }
        });
    }

    _setupRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this._renderer.domElement);
    }

    start() {
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        this._controls.update(1);
        this._scene.traverse(object => {
            if (object.userData.parent instanceof WorldObject) {
                object.userData.parent.update();
            }

            if (object instanceof THREE.SpotLight) {
                object.position.y += Math.sin(Date.now() * 0.001) * 0.05;
            }

            if (object instanceof THREE.SpotLightHelper) {
                object.update();
            }
        });
        this._renderer.render(this._scene, this._camera);
    }
}